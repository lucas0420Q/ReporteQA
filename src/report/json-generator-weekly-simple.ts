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
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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
   * Crea la estructura de carpetas: reports/YYYY/MM/DD/semanales/
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Ruta completa del directorio
   */
  private crearEstructuraDirectorios(fecha: string): string {
    try {
      const [year, month, day] = fecha.split('-');
      
      if (!year || !month || !day) {
        throw new Error(`Formato de fecha inválido: ${fecha}`);
      }
      
      const rutaCompleta = join(this.baseReportsDir, year, month, day, 'semanales');
      
      if (!existsSync(rutaCompleta)) {
        mkdirSync(rutaCompleta, { recursive: true });
      }
      
      return rutaCompleta;
    } catch (error) {
      console.error('Error creando estructura de directorios:', error);
      throw new Error(`No se pudo crear la estructura de directorios para ${fecha}`);
    }
  }

  /**
   * Genera reporte semanal simplificado con métricas reales
   * V3.2: Optimizado con mejor manejo de errores y estructura organizada
   */
  async generarReporteSemanal(): Promise<ReporteSemanalSimple> {
    try {
      const { semana, fecha } = this.getInfoSemana();
      const fechaHora = obtenerFechaHoraActual();
      
      console.log('🔄 Generando reporte semanal con comparaciones...');
      console.log(`📊 Semana: ${semana}`);
      console.log(`📅 Fecha/Hora: ${fechaHora.fecha_hora}`);

      // Validar variable de entorno requerida
      const projectsDbId = process.env.NOTION_PROJECTS_DB_ID;
      if (!projectsDbId) {
        throw new Error('NOTION_PROJECTS_DB_ID no está configurado en las variables de entorno');
      }

      // Cargar snapshot de hace 5 días hábiles (1 semana laboral: Lunes-Viernes)
      const snapshotSemanaAnterior = this.snapshotManager.buscarSnapshotDiasHabilesAtras(5);
      
      if (!snapshotSemanaAnterior) {
        console.log('⚠️  Sin snapshot de semana anterior, métricas basadas en estado actual');
      } else {
        console.log(`✓ Comparando con snapshot de hace 5 días hábiles (${snapshotSemanaAnterior.fecha_hora})`);
      }

      // Obtener proyectos activos
      console.log('📡 Consultando proyectos activos desde Notion...');
      const proyectos = await this.fetcher.fetchActiveProjects(projectsDbId);

      if (proyectos.length === 0) {
        console.warn('⚠️  No se encontraron proyectos activos');
      }

      console.log(`✓ Proyectos activos: ${proyectos.length}\n`);

      const proyectosReporte: ProyectoSemanalSimple[] = [];

      for (const proyecto of proyectos) {
        try {
          console.log(`🔍 Procesando ${proyecto.name}...`);
          const metricas = await this.calcularMetricasProyecto(
            proyecto, 
            snapshotSemanaAnterior
          );
          proyectosReporte.push(metricas);
          console.log(`   ✓ Métricas calculadas`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`   ❌ [ERROR] ${proyecto.name}: ${errorMsg}`);
          proyectosReporte.push(this.crearMetricasVacias(proyecto.name));
        }
      }

      const reporte: ReporteSemanalSimple = {
        semana: semana,
        fecha_hora: fechaHora.fecha_hora,
        zona_horaria: 'America/Asuncion',
        proyectos: proyectosReporte
      };

      // Crear estructura de directorios por fecha
      const rutaDirectorio = this.crearEstructuraDirectorios(fechaHora.fecha);
      
      // Guardar reporte en carpeta organizada
      const nombreArchivo = `reporte-weekly-${semana}.json`;
      const rutaArchivo = join(rutaDirectorio, nombreArchivo);
      
      try {
        writeFileSync(rutaArchivo, JSON.stringify(reporte, null, 2), 'utf8');
        console.log(`\n✅ Reporte semanal guardado: ${rutaArchivo}`);
      } catch (error) {
        console.error('Error guardando reporte semanal:', error);
        throw new Error(`No se pudo guardar el reporte semanal en ${rutaArchivo}`);
      }
      
      // Guardar copia latest
      try {
        const rutaLatest = join(this.baseReportsDir, 'latest-weekly.json');
        writeFileSync(rutaLatest, JSON.stringify(reporte, null, 2), 'utf8');
        console.log(`✅ Copia latest: ${rutaLatest}`);
      } catch (error) {
        console.warn('⚠️  No se pudo crear copia latest:', error);
      }
      
      return reporte;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('\n❌ Error generando reporte semanal:', errorMsg);
      throw error;
    }
  }

  private async calcularMetricasProyecto(
    proyecto: Project,
    snapshotSemanaAnterior: any | null
  ): Promise<ProyectoSemanalSimple> {
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

    // Buscar snapshot de hace 1 semana del proyecto
    const proyectoSemanaAnterior = snapshotSemanaAnterior?.proyectos.find(
      (p: any) => p.nombre_proyecto === proyecto.name
    );

    // Si hay snapshot de semana anterior, calcular métricas con comparación real
    if (proyectoSemanaAnterior) {
      const metricas = this.diffEngine.calcularMetricasSemanales(
        snapshotActual,
        proyectoSemanaAnterior
      );
      return {
        nombre: proyecto.name,
        ...metricas
      };
    }

    // Si no hay snapshot anterior, usar aproximaciones basadas en estado actual
    return this.calcularMetricasAproximadas(proyecto.name, matrizItems, incidenciasItems);
  }

  /**
   * Calcula métricas aproximadas cuando no hay snapshot de comparación
   */
  private calcularMetricasAproximadas(
    nombreProyecto: string,
    matrizItems: ItemMin[],
    incidenciasItems: ItemMin[]
  ): ProyectoSemanalSimple {
    const casosFinalizados = matrizItems.filter(item => 
      this.esEstadoFinalizado(item.estado)
    ).length;
    
    const casosPendientes = matrizItems.filter(item => 
      this.esEstadoPendiente(item.estado)
    ).length;
    
    const incidenciasDevueltas = incidenciasItems.filter(item => 
      this.esEstadoDevuelto(item.estado)
    ).length;

    const incidenciasResueltas = incidenciasItems.filter(item => 
      this.esEstadoResuelto(item.estado)
    ).length;

    // Aproximación para V1: total actual como casos agregados
    const casosAgregadosSemana = matrizItems.length;

    return {
      nombre: nombreProyecto,
      casos_agregados_semana: casosAgregadosSemana,
      incidencias_devueltas_semana: incidenciasDevueltas,
      incidencias_resueltas_semana: incidenciasResueltas,
      casos_prueba_finalizados_semana: casosFinalizados,
      casos_prueba_pendientes: casosPendientes
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
      console.error(`   ⚠️  Error obteniendo ${tipo}:`, (error as Error).message);
      return [];
    }
  }

  private crearMetricasVacias(nombreProyecto: string): ProyectoSemanalSimple {
    return {
      nombre: nombreProyecto,
      casos_agregados_semana: 0,
      incidencias_devueltas_semana: 0,
      incidencias_resueltas_semana: 0,
      casos_prueba_finalizados_semana: 0,
      casos_prueba_pendientes: 0
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
