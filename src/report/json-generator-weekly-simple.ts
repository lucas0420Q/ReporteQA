/**
 * Generador de reporte semanal simplificado
 * VERSION 2: Con comparación real usando snapshots y días hábiles
 */

import { NotionFetcher } from '../notion/fetch.js';
import { Project } from '../domain/types.js';
import { 
  ItemMin, 
  PropertyConfig, 
  toItemMin
} from '../domain/utils-notion.js';
import { 
  ReporteSemanalSimple, 
  ProyectoSemanalSimple 
} from '../domain/tipos-reportes-simple.js';
import { obtenerFechaHoraActual } from '../domain/date-utils.js';
import { 
  SnapshotManager, 
  ProyectoSnapshot 
} from '../domain/snapshot-manager.js';
import { DiffEngine } from '../domain/diff-engine-v2.js';
import { join } from 'path';
import { 
  buildWeeklyReportPath, 
  writeJsonReportAtomic,
  getPreviousWeeklyReport,
  readJsonReport
} from '../utils/fs-reports.js';

export class JSONGeneratorWeeklySimple {
  private readonly fetcher: NotionFetcher;
  private readonly baseReportsDir = './reports';
  private readonly snapshotManager: SnapshotManager;
  private readonly diffEngine: DiffEngine;

  private readonly defaultConfig: PropertyConfig = {
    tituloProps: ['Name', 'Nombre', 'Title', 'Título', 'Caso', 'Case'],
    estadoProps: ['Status', 'Estado', 'State']
  };

  constructor() {
    this.fetcher = new NotionFetcher(2);
    this.snapshotManager = new SnapshotManager();
    this.diffEngine = new DiffEngine();
  }

  /**
   * Genera reporte semanal simplificado con métricas reales
   * V3.3: Usa snapshot guardado junto con cada reporte para comparaciones
   */
  async generarReporteSemanal(): Promise<ReporteSemanalSimple> {
    try {
      const { semana, fecha } = this.getInfoSemana();
      const fechaHora = obtenerFechaHoraActual();
      
      console.log('>> Generando reporte semanal con comparaciones...');
      console.log(`   Semana: ${semana}`);
      console.log(`   Fecha/Hora: ${fechaHora.fecha_hora}`);

      // Validar variable de entorno requerida
      const projectsDbId = process.env.NOTION_PROJECTS_DB_ID;
      if (!projectsDbId) {
        throw new Error('NOTION_PROJECTS_DB_ID no está configurado en las variables de entorno');
      }

      // Buscar el snapshot semanal anterior más reciente
      console.log('   Buscando snapshot de reporte semanal anterior...');
      const snapshotAnterior = await this.buscarSnapshotSemanalAnterior();
      
      if (!snapshotAnterior) {
        console.log(`   [!] No hay snapshot semanal anterior disponible`);
      } else {
        console.log(`   ✓ Snapshot anterior encontrado: ${snapshotAnterior.fecha_hora}`);
      }

      // Obtener proyectos activos
      console.log('   Consultando proyectos activos desde Notion...');
      const proyectos = await this.fetcher.fetchActiveProjects(projectsDbId);

      if (proyectos.length === 0) {
        console.warn('   [!] No se encontraron proyectos activos');
      }

      console.log(`   Proyectos activos: ${proyectos.length}\n`);

      const proyectosReporte: ProyectoSemanalSimple[] = [];
      const proyectosSnapshot: ProyectoSnapshot[] = [];

      for (const proyecto of proyectos) {
        try {
          console.log(`   Procesando ${proyecto.name}...`);
          const { metricas, snapshot } = await this.calcularMetricasProyecto(
            proyecto, 
            snapshotAnterior
          );
          proyectosReporte.push(metricas);
          proyectosSnapshot.push(snapshot);
          console.log(`      -> Métricas calculadas`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`      [ERROR] ${proyecto.name}: ${errorMsg}`);
          proyectosReporte.push(this.crearMetricasVacias(proyecto.name));
        }
      }

      const reporte: ReporteSemanalSimple = {
        semana: semana,
        fecha_hora: fechaHora.fecha_hora,
        zona_horaria: 'America/Asuncion',
        proyectos: proyectosReporte
      };

      // Guardar snapshot actual para futuras comparaciones
      const snapshotActual = {
        fecha_hora: fechaHora.fecha_hora,
        zona_horaria: 'America/Asuncion',
        proyectos: proyectosSnapshot
      };
      await this.guardarSnapshotSemanal(snapshotActual, fechaHora.fecha_hora);

      // Guardar reporte con timestamp único (fecha + hora)
      const fechaReporte = new Date(fechaHora.fecha_hora);
      const rutaArchivo = buildWeeklyReportPath(fechaReporte);
      
      try {
        const metadata = await writeJsonReportAtomic(rutaArchivo, reporte, {
          createLatestAlias: true,
          overwrite: true // Permitir sobreescritura ya que el nombre incluye timestamp
        });
        
        console.log(`\n   Reporte semanal guardado: ${metadata.mainPath}`);
        if (metadata.aliasPath) {
          console.log(`   Alias latest actualizado: ${metadata.aliasPath}`);
        }
        console.log(`   Tamaño: ${(metadata.size / 1024).toFixed(2)} KB`);
      } catch (error) {
        throw new Error(`No se pudo guardar el reporte semanal: ${(error as Error).message}`);
      }
      
      return reporte;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('\n   [ERROR] Error generando reporte semanal:', errorMsg);
      throw error;
    }
  }

  private async calcularMetricasProyecto(
    proyecto: Project,
    snapshotAnterior: any | null
  ): Promise<{ metricas: ProyectoSemanalSimple; snapshot: ProyectoSnapshot }> {
    const fechaHora = obtenerFechaHoraActual();
    
    // Buscar páginas "Documento técnico QA"
    const paginasHijo = await this.fetcher.fetchChildPages(proyecto.id);
    
    let matrizItems: ItemMin[] = [];
    let incidenciasItems: ItemMin[] = [];

    for (const pagina of paginasHijo) {
      const titulo = pagina.title?.toLowerCase() || '';
      
      if (titulo.includes('documento técnico qa') || titulo.includes('documento tecnico qa')) {
        // Obtener DBs específicas dentro de esta página
        const { matrizDbId, incidenciasDbId } = await this.fetcher.getDocTecnicoChildDbIds(
          pagina.id,
          { matriz: 'matriz', incidencias: 'incidencia' }
        );

        // Procesar matriz de pruebas
        if (matrizDbId) {
          const itemsMatriz = await this.obtenerItemsRobusto(matrizDbId, 'matriz');
          matrizItems.push(...itemsMatriz);
        }

        // Procesar incidencias
        if (incidenciasDbId) {
          const itemsInc = await this.obtenerItemsRobusto(incidenciasDbId, 'incidencias');
          incidenciasItems.push(...itemsInc);
        }
      }
    }

    // Crear snapshot actual del proyecto
    const snapshotActual: ProyectoSnapshot = {
      nombre_proyecto: proyecto.name,
      fecha_hora: fechaHora.fecha_hora,
      matriz_pruebas: matrizItems.map(item => 
        SnapshotManager.convertirASnapshotItem(item, 'matriz', this.extraerNumeroId.bind(this))
      ),
      incidencias: incidenciasItems.map(item => 
        SnapshotManager.convertirASnapshotItem(item, 'incidencia', this.extraerNumeroId.bind(this))
      )
    };

    // Buscar proyecto en el snapshot/reporte anterior
    const proyectoAnterior = snapshotAnterior?.proyectos.find(
      (p: any) => p.nombre_proyecto === proyecto.name
    );

    // Si existe reporte anterior del proyecto, calcular métricas con comparación real
    if (proyectoAnterior) {
      console.log(`      [✓] Comparando con snapshot anterior`);
      const metricas = this.diffEngine.calcularMetricasSemanales(
        snapshotActual,
        proyectoAnterior
      );
      return {
        metricas: {
          nombre: proyecto.name,
          ...metricas
        },
        snapshot: snapshotActual
      };
    }

    // Si no hay reporte anterior del proyecto específico (proyecto nuevo)
    if (snapshotAnterior) {
      console.log(`      [!] Proyecto "${proyecto.name}" es nuevo (no existía en snapshot anterior)`);
    }
    
    const metricasAproximadas = this.calcularMetricasAproximadas(proyecto.name, matrizItems, incidenciasItems);
    return {
      metricas: metricasAproximadas,
      snapshot: snapshotActual
    };
  }

  /**
   * Busca el snapshot del reporte semanal anterior más reciente
   */
  private async buscarSnapshotSemanalAnterior(): Promise<any | null> {
    const reportes = await this.listarSnapshotsSemanales();
    if (reportes.length === 0) {
      return null;
    }
    
    // Tomar el más reciente (ya están ordenados)
    const snapshotPath = reportes[0];
    
    try {
      const contenido = await readJsonReport(snapshotPath);
      return contenido;
    } catch (error) {
      console.error(`   [!] Error leyendo snapshot: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Lista todos los snapshots semanales disponibles
   */
  private async listarSnapshotsSemanales(): Promise<string[]> {
    const snapshotsDir = './snapshots/semanales';
    
    try {
      const { ensureDirectoryExists } = await import('../utils/fs-reports.js');
      await ensureDirectoryExists(snapshotsDir);
      
      const fs = await import('fs/promises');
      const files = await fs.readdir(snapshotsDir);
      
      return files
        .filter(f => f.startsWith('snapshot-semanal-') && f.endsWith('.json'))
        .map(f => `${snapshotsDir}/${f}`)
        .sort()
        .reverse(); // Más recientes primero
    } catch {
      return [];
    }
  }

  /**
   * Guarda el snapshot del reporte semanal actual
   */
  private async guardarSnapshotSemanal(snapshot: any, fechaHora: string): Promise<void> {
    const snapshotsDir = './snapshots/semanales';
    
    try {
      const { ensureDirectoryExists } = await import('../utils/fs-reports.js');
      await ensureDirectoryExists(snapshotsDir);
      
      // Extraer fecha y hora del timestamp
      const [fecha, hora] = fechaHora.split(' ');
      const horaFormateada = hora.replace(/:/g, '');
      const nombreArchivo = `snapshot-semanal-${fecha}-${horaFormateada}.json`;
      const rutaArchivo = `${snapshotsDir}/${nombreArchivo}`;
      
      const fs = await import('fs/promises');
      await fs.writeFile(rutaArchivo, JSON.stringify(snapshot, null, 2), 'utf8');
      
      console.log(`   📸 Snapshot semanal guardado: ${rutaArchivo}`);
    } catch (error) {
      console.error(`   [!] Error guardando snapshot semanal: ${(error as Error).message}`);
    }
  }

  /**
   * Calcula métricas aproximadas cuando no hay snapshot de comparación
   */
  private calcularMetricasAproximadas(
    nombreProyecto: string,
    matrizItems: ItemMin[],
    incidenciasItems: ItemMin[]
  ): ProyectoSemanalSimple {
    // Estados actuales de casos de prueba
    const casosFinalizados = matrizItems.filter(item => 
      this.esEstadoFinalizado(item.estado)
    ).length;
    
    const casosPendientes = matrizItems.filter(item => 
      this.esEstadoPendiente(item.estado)
    ).length;

    const casosEnCurso = matrizItems.filter(item => 
      this.esEstadoEnCurso(item.estado)
    ).length;
    
    // Estados actuales de incidencias
    const incidenciasDevueltas = incidenciasItems.filter(item => 
      this.esEstadoDevuelto(item.estado)
    ).length;

    const incidenciasResueltas = incidenciasItems.filter(item => 
      this.esEstadoResuelto(item.estado)
    ).length;

    const incidenciasPendientes = incidenciasItems.filter(item => 
      this.esEstadoPendiente(item.estado)
    ).length;

    const incidenciasEnCurso = incidenciasItems.filter(item => 
      this.esEstadoEnCurso(item.estado)
    ).length;

    const incidenciasFinalizadas = incidenciasItems.filter(item => 
      this.esEstadoFinalizado(item.estado)
    ).length;

    // Aproximación para V1: total actual como casos agregados
    const casosAgregadosSemana = matrizItems.length;
    const incidenciasNuevasSemana = incidenciasItems.length;

    console.log(`   [!] Sin snapshot anterior - usando aproximaciones basadas en estado actual`);

    return {
      nombre: nombreProyecto,
      casos_agregados_semana: casosAgregadosSemana,
      casos_con_cambios_semana: 0, // No podemos calcular sin snapshot anterior
      casos_prueba_pendientes: casosPendientes,
      casos_prueba_en_curso: casosEnCurso,
      casos_prueba_finalizados: casosFinalizados, // Total actual, no solo de la semana
      incidencias_nuevas_semana: incidenciasNuevasSemana,
      incidencias_con_cambios_semana: 0, // No podemos calcular sin snapshot anterior
      incidencias_pendientes: incidenciasPendientes,
      incidencias_en_curso: incidenciasEnCurso,
      incidencias_devueltas: incidenciasDevueltas, // Total actual
      incidencias_finalizadas: incidenciasFinalizadas, // Total actual
      incidencias_resueltas: incidenciasResueltas // Total actual
    };
  }

  /**
   * Extrae el número del CP o RI del título
   */
  private extraerNumeroId(titulo: string): string {
    const match = titulo.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
    return match ? match[1] : "0";
  }

  /**
   * Determina si un estado es "en curso"
   */
  private esEstadoEnCurso(estado: string): boolean {
    const estadoLower = estado.toLowerCase();
    return estadoLower.includes('en curso') || 
           estadoLower.includes('en progreso') ||
           estadoLower.includes('in progress') ||
           estadoLower.includes('doing');
  }

  /**
   * Determina si un estado es "finalizado"
   */
  private esEstadoFinalizado(estado: string): boolean {
    const estadoLower = estado.toLowerCase();
    return estadoLower.includes('finalizado') || 
           estadoLower.includes('completado') ||
           estadoLower.includes('done');
  }

  /**
   * Determina si un estado es "pendiente"
   */
  private esEstadoPendiente(estado: string): boolean {
    const estadoLower = estado.toLowerCase();
    return estadoLower.includes('pendiente') || 
           estadoLower.includes('pending') ||
           estadoLower.includes('todo');
  }

  /**
   * Determina si un estado es "devuelto"
   */
  private esEstadoDevuelto(estado: string): boolean {
    const estadoLower = estado.toLowerCase();
    return estadoLower.includes('devuelto') || 
           estadoLower.includes('devuelta') ||
           estadoLower.includes('returned');
  }

  /**
   * Determina si un estado es "resuelto"
   */
  private esEstadoResuelto(estado: string): boolean {
    const estadoLower = estado.toLowerCase();
    return estadoLower.includes('resuelto') || 
           estadoLower.includes('resuelta') ||
           estadoLower.includes('resolved');
  }

  private async obtenerItemsRobusto(
    dbId: string, 
    tipo: 'matriz' | 'incidencias'
  ): Promise<ItemMin[]> {
    try {
      const pagesRaw = await this.fetcher.fetchItemsRobust(
        dbId, 
        tipo === 'matriz' ? 'CASO' : 'INCIDENCIA'
      );

      const items: ItemMin[] = [];
      for (const page of pagesRaw) {
        const item = toItemMin(page, this.defaultConfig);
        if (item) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      console.error(`   [!] Error obteniendo ${tipo}:`, (error as Error).message);
      return [];
    }
  }

  private crearMetricasVacias(nombreProyecto: string): ProyectoSemanalSimple {
    return {
      nombre: nombreProyecto,
      casos_agregados_semana: 0,
      casos_con_cambios_semana: 0,
      casos_prueba_pendientes: 0,
      casos_prueba_en_curso: 0,
      casos_prueba_finalizados: 0,
      incidencias_nuevas_semana: 0,
      incidencias_con_cambios_semana: 0,
      incidencias_pendientes: 0,
      incidencias_en_curso: 0,
      incidencias_devueltas: 0,
      incidencias_finalizadas: 0,
      incidencias_resueltas: 0
    };
  }

  /**
   * Obtiene información de la semana actual (ISO 8601)
   */
  private getInfoSemana(): { semana: string; fecha: string } {
    const now = new Date();
    
    // Calcular número de semana ISO 8601
    const tempDate = new Date(now.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    const semanaNum = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return {
      semana: `${year}-W${String(semanaNum).padStart(2, '0')}`,
      fecha: `${year}-${month}-${day}`
    };
  }
}
