import { NotionClientFactory } from './client.js';
import {
  Project,
  ChildDatabase,
  MinimalItem,
  ItemType,
  NotionAPIError,
  EstadoProyecto,
} from '../domain/types.js';
import { config } from '../config.js';
import pLimit from 'p-limit';
import crypto from 'crypto';

/**
 * Cliente para realizar fetch de datos desde Notion API
 * con manejo de rate limiting y paginación
 */
export class NotionFetcher {
  private readonly limiter: ReturnType<typeof pLimit>;
  private readonly maxRetries = config.notion.maxRetries;

  constructor(concurrency = 2) {
    this.limiter = pLimit(concurrency);
  }

  /**
   * Obtiene la lista de proyectos desde la base de datos principal
   */
  public async fetchProjects(dbId: string): Promise<Project[]> {
    return this.fetchProjectsWithFilter(dbId, null);
  }

  /**
   * Obtiene solo los proyectos que están "En Curso"
   */
  public async fetchActiveProjects(dbId: string): Promise<Project[]> {
    console.info('Obteniendo solo proyectos "En curso"...');
    return this.fetchProjectsWithFilter(dbId, 'En Curso');
  }

  /**
   * Obtiene proyectos con filtro opcional por estado
   */
  private async fetchProjectsWithFilter(dbId: string, statusFilter: EstadoProyecto | null): Promise<Project[]> {
    const filterMsg = statusFilter ? ` (filtro: ${statusFilter})` : '';
    console.info(`Obteniendo proyectos desde DB: ${this.truncateId(dbId)}${filterMsg}`);

    try {
      const client = await NotionClientFactory.getClient();
      const projects: Project[] = [];
      let hasMore = true;
      let nextCursor: string | undefined;

      while (hasMore) {
        const response = await this.limiter(() =>
          this.retryOperation(() =>
            client.databases.query({
              database_id: dbId,
              start_cursor: nextCursor,
              page_size: 100,
            })
          )
        );

        for (const page of response.results) {
          if ('properties' in page) {
            const project = this.extractProjectFromPage(page);
            if (project && (!statusFilter || project.status === statusFilter)) {
              projects.push(project);
            }
          }
        }

        hasMore = response.has_more;
        nextCursor = response.next_cursor || undefined;
      }

      const filteredCount = projects.length;
      const filterText = statusFilter ? ` proyectos "${statusFilter}"` : ' proyectos';
      console.info(`Encontrados ${filteredCount}${filterText}`);
      
      return projects;
    } catch (error) {
      if (error instanceof Error) {
        // Detectar tipo de error específico
        if (error.message.includes('429') || error.message.includes('rate')) {
          throw new NotionAPIError(
            'RATE_LIMIT_ERROR',
            'Rate limit excedido - demasiadas requests',
            429,
            error
          );
        }
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          throw new NotionAPIError(
            'AUTH_ERROR',
            'Token de Notion inválido o expirado',
            401,
            error
          );
        }
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new NotionAPIError(
            'DATABASE_NOT_FOUND',
            `Base de datos no encontrada: ${this.truncateId(dbId)}`,
            404,
            error
          );
        }
      }
      
      throw new NotionAPIError(
        'FETCH_PROJECTS_ERROR',
        `Error obteniendo proyectos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Obtiene solo proyectos con estado "En curso" (optimización para QA)
   */
  public async fetchProyectosEnCurso(dbId: string): Promise<Project[]> {
    return await this.fetchActiveProjects(dbId);
  }

  /**
   * Obtiene las bases de datos hijo de un proyecto (búsqueda recursiva)
   */
  public async fetchChildDatabases(
    projectPageId: string,
    targetNames: string[]
  ): Promise<ChildDatabase[]> {
    console.info(
      `Obteniendo DBs hijo del proyecto: ${this.truncateId(projectPageId)}`
    );

    try {
      const databases: ChildDatabase[] = [];
      
      // Buscar DBs directamente en el proyecto
      const directDbs = await this.searchDatabasesInPage(projectPageId, targetNames);
      databases.push(...directDbs);
      
      // Si no encontramos DBs directas, buscar en páginas hijo
      if (databases.length === 0) {
        console.info('No se encontraron DBs directas, buscando en páginas hijo...');
        const childPages = await this.fetchChildPages(projectPageId);
        
        for (const childPage of childPages) {
          console.info(`Explorando página hijo: "${childPage.title}"`);
          
          // Priorizar "Documento técnico QA" si existe
          const esDocumentoTecnico = childPage.title.toLowerCase().includes('documento') &&
                                   childPage.title.toLowerCase().includes('técnico') &&
                                   childPage.title.toLowerCase().includes('qa');
          
          if (esDocumentoTecnico) {
            console.info('Encontrada página "Documento técnico QA", explorando...');
          }
          
          const childDbs = await this.searchDatabasesInPage(childPage.id, targetNames);
          if (childDbs.length > 0) {
            console.info(`Encontradas ${childDbs.length} DBs en "${childPage.title}"`);
            databases.push(...childDbs);
          }
        }
      }

      console.info(
        `Encontradas ${databases.length} DBs hijo en proyecto ${this.truncateId(
          projectPageId
        )}`
      );
      return databases;
    } catch (error) {
      throw new NotionAPIError(
        'FETCH_CHILD_DBS_ERROR',
        `Error obteniendo DBs hijo: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Busca bases de datos dentro de una página específica
   */
  private async searchDatabasesInPage(
    pageId: string,
    targetNames: string[]
  ): Promise<ChildDatabase[]> {
    try {
      const client = await NotionClientFactory.getClient();
      const databases: ChildDatabase[] = [];
      let hasMore = true;
      let nextCursor: string | undefined;

      while (hasMore) {
        const response = await this.limiter(() =>
          this.retryOperation(() =>
            client.blocks.children.list({
              block_id: pageId,
              start_cursor: nextCursor,
              page_size: 100,
            })
          )
        );

        for (const block of response.results) {
          if ('type' in block && block.type === 'child_database') {
            const childDb = this.extractChildDatabaseFromBlock(
              block,
              targetNames
            );
            if (childDb) {
              databases.push(childDb);
            }
          }
        }

        hasMore = response.has_more;
        nextCursor = response.next_cursor || undefined;
      }

      return databases;
    } catch (error) {
      console.warn(`Error buscando DBs en página ${this.truncateId(pageId)}:`,
        error instanceof Error ? error.message : 'Error desconocido');
      return [];
    }
  }

  /**
   * Obtiene las páginas hijo de un proyecto
   */
  public async fetchChildPages(
    projectPageId: string
  ): Promise<Array<{ id: string; title: string }>> {
    console.info(
      `Obteniendo páginas hijo del proyecto: ${this.truncateId(projectPageId)}`
    );

    try {
      const client = await NotionClientFactory.getClient();
      const pages: Array<{ id: string; title: string }> = [];
      let hasMore = true;
      let nextCursor: string | undefined;

      while (hasMore) {
        const response = await this.limiter(() =>
          this.retryOperation(() =>
            client.blocks.children.list({
              block_id: projectPageId,
              start_cursor: nextCursor,
              page_size: 100,
            })
          )
        );

        for (const block of response.results) {
          if ('type' in block && block.type === 'child_page') {
            const title = this.extractChildPageTitle(block);
            if (title) {
              pages.push({
                id: block.id,
                title: title
              });
            }
          }
        }

        hasMore = response.has_more;
        nextCursor = response.next_cursor || undefined;
      }

      console.info(
        `Encontradas ${pages.length} páginas hijo en proyecto ${this.truncateId(
          projectPageId
        )}`
      );
      return pages;
    } catch (error) {
      throw new NotionAPIError(
        'FETCH_CHILD_PAGES_ERROR',
        `Error obteniendo páginas hijo: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Obtiene los items mínimos de una base de datos
   */
  public async fetchMinimalItems(
    dbId: string,
    type: ItemType
  ): Promise<MinimalItem[]> {
    console.info(
      `Obteniendo items tipo ${type} desde DB: ${this.truncateId(dbId)}`
    );

    try {
      const client = await NotionClientFactory.getClient();
      const items: MinimalItem[] = [];
      let hasMore = true;
      let nextCursor: string | undefined;

      while (hasMore) {
        const response = await this.limiter(() =>
          this.retryOperation(() =>
            client.databases.query({
              database_id: dbId,
              start_cursor: nextCursor,
              page_size: 100,
            })
          )
        );

        for (const page of response.results) {
          if ('properties' in page) {
            const item = this.extractMinimalItemFromPage(page, type);
            if (item) {
              items.push(item);
            }
          }
        }

        hasMore = response.has_more;
        nextCursor = response.next_cursor || undefined;
      }

      console.info(
        `Encontrados ${items.length} items tipo ${type} en DB ${this.truncateId(
          dbId
        )}`
      );
      return items;
    } catch (error) {
      throw new NotionAPIError(
        'FETCH_ITEMS_ERROR',
        `Error obteniendo items: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }

  /**
   * Type guard para verificar si un objeto tiene las propiedades de una página de Notion
   */
  private isNotionPage(page: unknown): page is { id: string; properties: Record<string, unknown> } {
    return typeof page === 'object' && 
           page !== null && 
           'id' in page && 
           'properties' in page &&
           typeof (page as { id: unknown }).id === 'string';
  }

  /**
   * Extrae el texto de una propiedad title de Notion de forma segura
   */
  private extractTitleText(titleProperty: unknown): string | null {
    if (!titleProperty || typeof titleProperty !== 'object' || titleProperty === null) {
      return null;
    }

    const prop = titleProperty as Record<string, unknown>;
    if (prop.type !== 'title' || !Array.isArray(prop.title)) {
      return null;
    }

    return prop.title
      .map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const textItem = item as Record<string, unknown>;
          const textContent = textItem.text as Record<string, unknown>;
          return textItem.plain_text || textContent?.content || '';
        }
        return '';
      })
      .join('')
      .trim();
  }

  /**
   * Extrae el valor de una propiedad de estado de forma segura
   */
  private extractStatusValue(statusProperty: unknown): string {
    if (!statusProperty || typeof statusProperty !== 'object' || statusProperty === null) {
      return 'Pendiente';
    }

    const prop = statusProperty as Record<string, unknown>;
    
    if (prop.type === 'status' && prop.status && typeof prop.status === 'object') {
      const status = prop.status as Record<string, unknown>;
      return (status.name as string) || 'Pendiente';
    }
    
    if (prop.type === 'select' && prop.select && typeof prop.select === 'object') {
      const select = prop.select as Record<string, unknown>;
      return (select.name as string) || 'Pendiente';
    }

    return 'Pendiente';
  }

  /**
   * Extrae información del proyecto desde una página de Notion
   */
  private extractProjectFromPage(page: unknown): Project | null {
    try {
      if (!this.isNotionPage(page)) {
        return null;
      }

      const properties = page.properties;
      
      // Buscar la propiedad de título
      const titleProperty = 
        properties['Project name'] || 
        properties['Name'] || 
        properties['Title'] ||
        Object.values(properties).find((prop: unknown) => {
          return typeof prop === 'object' && prop !== null && 
                 (prop as Record<string, unknown>).type === 'title';
        });

      const title = this.extractTitleText(titleProperty);
      if (!title) {
        console.warn(
          `Página sin título válido: ${this.truncateId(page.id)}`
        );
        return null;
      }

      // Buscar la propiedad de estado
      const statusProperty = 
        properties['Status'] || 
        properties['Estado'] || 
        properties['State'] ||
        Object.values(properties).find((prop: unknown) => {
          if (typeof prop !== 'object' || prop === null) return false;
          const p = prop as Record<string, unknown>;
          return p.type === 'status' || p.type === 'select';
        });

      const status = this.extractStatusValue(statusProperty);

      // Normalizar estado
      const normalizedStatus = this.normalizeProjectStatus(status);

      return {
        id: page.id,
        name: title,
        status: normalizedStatus,
      };
    } catch (error) {
      const pageId = this.isNotionPage(page) ? page.id : 'unknown';
      console.warn(
        `Error extrayendo proyecto de página ${this.truncateId(pageId)}:`,
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return null;
    }
  }

  /**
   * Normaliza el estado del proyecto desde Notion
   */
  private normalizeProjectStatus(status: string): EstadoProyecto {
    const statusLower = status.toLowerCase().trim();
    
    if (statusLower.includes('curso') || statusLower.includes('progress') || statusLower.includes('active')) {
      return 'En Curso';
    }
    if (statusLower.includes('finaliz') || statusLower.includes('complet') || statusLower.includes('done')) {
      return 'Finalizado';
    }
    if (statusLower.includes('pendiente') || statusLower.includes('pending') || statusLower.includes('todo')) {
      return 'Pendiente';
    }
    if (statusLower.includes('pausad') || statusLower.includes('pause') || statusLower.includes('hold')) {
      return 'Pausado';
    }
    if (statusLower.includes('cancel') || statusLower.includes('abort')) {
      return 'Cancelado';
    }
    
    // Si no coincide con nada, asumir que está en curso si no dice lo contrario
    return 'Pendiente';
  }

  /**
   * Type guard para verificar si un objeto es un bloque de Notion válido
   */
  private isNotionBlock(block: unknown): block is { id: string; type: string; child_database?: { title: string }; child_page?: { title: string } } {
    return typeof block === 'object' && 
           block !== null && 
           'id' in block && 
           'type' in block &&
           typeof (block as { id: unknown }).id === 'string';
  }

  /**
   * Extrae el título de una página hijo
   */
  private extractChildPageTitle(block: unknown): string | null {
    try {
      if (!this.isNotionBlock(block) || block.type !== 'child_page') {
        return null;
      }

      const title = block.child_page?.title || '';
      return title.trim() || null;
    } catch (error) {
      const blockId = this.isNotionBlock(block) ? block.id : 'unknown';
      console.warn(
        `Error extrayendo título de página hijo del bloque ${this.truncateId(blockId)}:`,
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return null;
    }
  }

  /**
   * Extrae información de DB hijo desde un bloque de Notion
   */
  private extractChildDatabaseFromBlock(
    block: unknown,
    targetNames: string[]
  ): ChildDatabase | null {
    try {
      if (!this.isNotionBlock(block) || block.type !== 'child_database') {
        return null;
      }

      const title = block.child_database?.title || '';
      
      // Verificar si el nombre coincide con alguno de los objetivos
      const isTargetDb = targetNames.some(targetName =>
        title.toLowerCase().includes(targetName.toLowerCase()) ||
        targetName.toLowerCase().includes(title.toLowerCase())
      );

      if (!isTargetDb) {
        return null;
      }

      return {
        id: block.id,
        name: title.trim(),
      };
    } catch (error) {
      const blockId = this.isNotionBlock(block) ? block.id : 'unknown';
      console.warn(
        `Error extrayendo DB hijo del bloque ${this.truncateId(blockId)}:`,
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return null;
    }
  }

  /**
   * Extrae un item mínimo desde una página de Notion
   */
  private extractMinimalItemFromPage(
    page: unknown,
    type: ItemType
  ): MinimalItem | null {
    try {
      if (!this.isNotionPage(page)) {
        return null;
      }

      // Extraer título
      const titleProperty = 
        page.properties['Name'] || 
        page.properties['Title'] ||
        Object.values(page.properties).find((prop: unknown) => {
          return typeof prop === 'object' && prop !== null && 
                 (prop as Record<string, unknown>).type === 'title';
        });

      const title = this.extractTitleText(titleProperty);
      if (!title) {
        return null;
      }

      // Extraer estado
      const statusProperty = 
        page.properties['Status'] || 
        page.properties['Estado'] ||
        Object.values(page.properties).find((prop: unknown) => {
          if (typeof prop !== 'object' || prop === null) return false;
          const p = prop as Record<string, unknown>;
          return p.type === 'select' || p.type === 'multi_select';
        });

      let status = this.extractStatusValue(statusProperty);
      
      // Handle multi_select differently
      if (statusProperty && typeof statusProperty === 'object' && statusProperty !== null) {
        const prop = statusProperty as Record<string, unknown>;
        if (prop.type === 'multi_select' && Array.isArray(prop.multi_select)) {
          status = prop.multi_select
            .map((s: unknown) => {
              if (typeof s === 'object' && s !== null) {
                return ((s as Record<string, unknown>).name as string) || '';
              }
              return '';
            })
            .filter(Boolean)
            .join(', ') || 'Sin estado';
        }
      }

      const lastEdited = (page as unknown as { last_edited_time: string }).last_edited_time || new Date().toISOString();
      const id = page.id;

      // Crear hash
      const hash = this.createItemHash({
        id,
        title,
        status,
        lastEdited,
        type,
      });

      return {
        id,
        title,
        status,
        lastEdited,
        type,
        hash,
      };
    } catch (error) {
      const pageId = this.isNotionPage(page) ? page.id : 'unknown';
      console.warn(
        `Error extrayendo item de página ${this.truncateId(pageId)}:`,
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return null;
    }
  }

  /**
   * Crea un hash SHA-256 para un item
   */
  private createItemHash(item: Omit<MinimalItem, 'hash'>): string {
    const data = `${item.id}|${item.title}|${item.status}|${item.lastEdited}|${item.type}`;
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Trunca un ID para logging seguro
   */
  private truncateId(id: string): string {
    return id.substring(0, config.logging.maxIdDisplayLength) + '...';
  }

  /**
   * Ejecuta una operación con retry y backoff exponencial
   * Implementa detección inteligente de errores no recuperables
   */
  private async retryOperation<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');

        // ✅ MEJORA 1: Detección inmediata de errores no recuperables
        if (this.isNonRecoverableError(lastError)) {
          // Fallar inmediatamente sin reintentos para errores conocidos como permanentes
          throw lastError;
        }

        // ⏱️ Rate limiting - requiere backoff especial
        if (this.isRateLimitError(lastError)) {
          const delay = this.calculateBackoffDelay(attempt, true);
          console.log(
            `   ⏳ Rate limit detectado, pausa estratégica de ${Math.round(delay/1000)}s (${attempt}/${this.maxRetries})`
          );
          await this.sleep(delay);
          continue;
        }

        // Errores temporales - reintentar con backoff
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, false);
          console.log(
            `   -> Reintento ${attempt}/${this.maxRetries} en ${Math.round(delay/1000)}s - ${this.getErrorSummary(lastError)}`
          );
          await this.sleep(delay);
          continue;
        }
      }
    }

    throw new NotionAPIError(
      'MAX_RETRIES_EXCEEDED',
      `Máximo de reintentos alcanzado: ${lastError?.message || 'Error desconocido'}`
    );
  }

  /**
   * Calcula el delay para backoff exponencial con jitter
   */
  private calculateBackoffDelay(attempt: number, isRateLimit: boolean): number {
    const baseDelay = isRateLimit ? 5000 : config.notion.baseRetryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Jitter de hasta 1 segundo
    
    return Math.min(
      exponentialDelay + jitter, 
      config.notion.maxRetryDelayMs
    );
  }

  /**
   * Función helper para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene los IDs de las DBs específicas dentro de una página "Documento técnico QA"
   */
  async getDocTecnicoChildDbIds(
    docTecnicoPageId: string,
    nombres: { matriz: string; incidencias: string }
  ): Promise<{ matrizDbId: string | null; incidenciasDbId: string | null }> {
    try {
      const client = await NotionClientFactory.getClient();
      const children = await client.blocks.children.list({
        block_id: docTecnicoPageId,
        page_size: 100
      });

      let matrizDbId: string | null = null;
      let incidenciasDbId: string | null = null;

      for (const child of children.results) {
        if (!this.isNotionBlock(child) || child.type !== 'child_database') continue;

        // Ignorar DBs archivadas
        if ('archived' in child && child.archived) continue;

        const title = child.child_database?.title || '';
        const titleLower = title.toLowerCase();

        // Buscar matriz de pruebas (case-insensitive)
        if (titleLower.includes(nombres.matriz.toLowerCase()) && !matrizDbId) {
          matrizDbId = child.id;
          console.log(`   Encontrada DB Matriz: "${title}" (ID: ${this.truncateId(child.id)})`);
        }

        // Buscar incidencias (case-insensitive)  
        if (titleLower.includes(nombres.incidencias.toLowerCase()) && !incidenciasDbId) {
          incidenciasDbId = child.id;
          console.log(`   Encontrada DB Incidencias: "${title}" (ID: ${this.truncateId(child.id)})`);
        }
      }

      return { matrizDbId, incidenciasDbId };
    } catch (error) {
      console.error(`Error obteniendo child DBs de página ${this.truncateId(docTecnicoPageId)}:`, error);
      return { matrizDbId: null, incidenciasDbId: null };
    }
  }

  /**
   * Obtiene items con filtros robustos y configuración personalizable
   */
  async fetchItemsRobust(
    dbId: string, 
    type: ItemType,
    config: { statusProperty?: string; filter?: any } = {}
  ): Promise<unknown[]> {
    return this.limiter(async () => {
      return this.retryOperation(async () => {
        const client = await NotionClientFactory.getClient();
        const items: unknown[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        // Usar consulta simple sin filtros complejos que pueden fallar
        while (hasMore) {
          const response = await client.databases.query({
            database_id: dbId,
            page_size: 100,
            start_cursor: startCursor,
          });

          items.push(...response.results);
          hasMore = response.has_more;
          startCursor = response.next_cursor || undefined;
        }

        console.log(`Encontrados ${items.length} items tipo ${type} en DB ${this.truncateId(dbId)} (sin filtros)`);
        return items;
      });
    });
  }

  /**
   * ✅ MEJORA 2: Detecta errores no recuperables para evitar reintentos innecesarios
   */
  private isNonRecoverableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Errores de configuración/permisos que no se resuelven con reintentos
    const nonRecoverablePatterns = [
      'multiple data sources',           // Limitación arquitectural de Notion
      'unauthorized',                    // Token inválido o permisos
      'forbidden',                       // Sin acceso al recurso
      'not_found',                      // Recurso no existe
      'validation_error'                // Error en la estructura de la petición
    ];

    return nonRecoverablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * ✅ MEJORA 3: Detecta específicamente errores de rate limiting
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('429') || 
           message.includes('rate') || 
           message.includes('too many requests');
  }

  /**
   * ✅ MEJORA 4: Proporciona resúmenes legibles de errores
   */
  private getErrorSummary(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('multiple data sources')) {
      return 'Base de datos con múltiples fuentes (no soportado)';
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'Error de permisos o autenticación';
    }
    if (message.includes('not_found')) {
      return 'Recurso no encontrado';
    }
    if (message.includes('timeout')) {
      return 'Tiempo de espera agotado';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'Error de conectividad';
    }
    
    // Truncar mensaje muy largo
    return error.message.length > 60 
      ? error.message.substring(0, 60) + '...'
      : error.message;
  }
}