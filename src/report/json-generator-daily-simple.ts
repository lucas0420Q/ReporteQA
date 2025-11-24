/**
 * Generador de reporte diario simplificado
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
  ReporteDiarioSimple, 
  ProyectoDiarioSimple, 
  ItemCambio 
} from '../domain/tipos-reportes-simple.js';
import { obtenerFechaHoraActual } from '../domain/date-utils.js';
import { 
  SnapshotManager, 
  ProyectoSnapshot, 
  SnapshotCompleto,
  SnapshotItem 
} from '../domain/snapshot-manager.js';
import { DiffEngine } from '../domain/diff-engine-v2.js';
import { join } from 'path';
import { 
  buildDailyReportPath, 
  writeJsonReportAtomic 
} from '../utils/fs-reports.js';

export class JSONGeneratorDailySimple {
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
   * Genera reporte diario simplificado con comparaciones reales
   * V3.2: Optimizado con mejor manejo de errores y estructura organizada
   */
  async generarReporteDiario(): Promise<ReporteDiarioSimple> {
    try {
      const fechaHora = obtenerFechaHoraActual();
      
      console.log('>> Generando reporte diario con comparaciones...');
      console.log(`   Fecha/Hora: ${fechaHora.fecha_hora}`);

      // Validar variable de entorno requerida
      const projectsDbId = process.env.NOTION_PROJECTS_DB_ID;
      if (!projectsDbId) {
        throw new Error('NOTION_PROJECTS_DB_ID no está configurado en las variables de entorno');
      }

      // Cargar snapshot del día hábil anterior
      const snapshotAnterior = this.snapshotManager.buscarSnapshotDiaHabilAnterior();
      
      if (!snapshotAnterior) {
        console.log('   [!] Sin snapshot anterior, primer reporte del sistema');
      } else {
        console.log(`   Snapshot anterior encontrado: ${snapshotAnterior.fecha_hora}`);
      }

      // Obtener proyectos activos
      console.log('   Consultando proyectos activos desde Notion...');
      const proyectos = await this.fetcher.fetchActiveProjects(projectsDbId);

      if (proyectos.length === 0) {
        console.warn('   [!] No se encontraron proyectos activos');
      }

      console.log(`   Proyectos activos: ${proyectos.length}\n`);

      const proyectosReporte: ProyectoDiarioSimple[] = [];
      const proyectosSnapshot: ProyectoSnapshot[] = [];

      for (const proyecto of proyectos) {
        try {
          console.log(`   Procesando ${proyecto.name}...`);
          const { reporte, snapshot } = await this.procesarProyecto(
            proyecto, 
            snapshotAnterior
          );
          proyectosReporte.push(reporte);
          proyectosSnapshot.push(snapshot);
          
          const totalCambios = reporte.matriz_pruebas.cambios.length + reporte.incidencias.cambios.length;
          console.log(`      -> ${totalCambios} cambios detectados`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`      [ERROR] ${proyecto.name}: ${errorMsg}`);
          proyectosReporte.push(this.crearReporteVacio(proyecto.name));
        }
      }

      // Guardar snapshot actual para futuras comparaciones
      const snapshotActual: SnapshotCompleto = {
        fecha_hora: fechaHora.fecha_hora,
        zona_horaria: 'America/Asuncion',
        proyectos: proyectosSnapshot
      };
      
      await this.snapshotManager.guardarSnapshot(snapshotActual);
      console.log('   Snapshot actual guardado para futuras comparaciones');

      const reporte: ReporteDiarioSimple = {
        fecha_hora: fechaHora.fecha_hora,
        zona_horaria: 'America/Asuncion',
        proyectos: proyectosReporte
      };

      // Guardar reporte con sistema de histórico (sin sobreescritura)
      const fechaReporte = new Date(fechaHora.fecha_hora);
      const rutaArchivo = buildDailyReportPath(fechaReporte);
      
      try {
        const metadata = await writeJsonReportAtomic(rutaArchivo, reporte, {
          createLatestAlias: true,
          overwrite: false
        });
        
        console.log(`\n   Reporte guardado: ${metadata.mainPath}`);
        if (metadata.aliasPath) {
          console.log(`   Alias latest actualizado: ${metadata.aliasPath}`);
        }
        console.log(`   Tamaño: ${(metadata.size / 1024).toFixed(2)} KB`);
      } catch (error) {
        const err = error as Error;
        if (err.message.includes('ya existe')) {
          console.warn(`   [!] El reporte de hoy ya existe, no se sobrescribe`);
        } else {
          throw new Error(`No se pudo guardar el reporte: ${err.message}`);
        }
      }
      
      return reporte;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('\n   [ERROR] Error generando reporte diario:', errorMsg);
      throw error;
    }
  }

  private async procesarProyecto(
    proyecto: Project,
    snapshotAnterior: SnapshotCompleto | null
  ): Promise<{ reporte: ProyectoDiarioSimple; snapshot: ProyectoSnapshot }> {
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

    // Buscar snapshot anterior del proyecto
    const proyectoAnterior = snapshotAnterior?.proyectos.find(
      p => p.nombre_proyecto === proyecto.name
    );

    // Comparar con snapshot anterior
    const comparacion = this.diffEngine.compararProyecto(snapshotActual, proyectoAnterior || null);

    // Combinar items nuevos + con cambios de estado (solo los que cambiaron)
    const cambiosMatriz = [
      ...comparacion.matriz.items_nuevos.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: cambio.estado_actual,
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'nuevo' as const
      })),
      ...comparacion.matriz.items_con_cambio_estado.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: cambio.estado_actual,
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'modificado' as const
      })),
      ...comparacion.matriz.items_eliminados.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: 'Eliminado',
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'eliminado' as const
      }))
    ].sort((a, b) => this.ordenarPorNumeroId(a.id, b.id));

    const cambiosIncidencias = [
      ...comparacion.incidencias.items_nuevos.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: cambio.estado_actual,
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'nuevo' as const
      })),
      ...comparacion.incidencias.items_con_cambio_estado.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: cambio.estado_actual,
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'modificado' as const
      })),
      ...comparacion.incidencias.items_eliminados.map(cambio => ({
        id: cambio.id,
        titulo: cambio.titulo,
        estado_actual: 'Eliminado',
        estado_anterior: cambio.estado_anterior,
        tipo_cambio: 'eliminado' as const
      }))
    ].sort((a, b) => this.ordenarPorNumeroId(a.id, b.id));

    // Calcular contadores por estado (del estado ACTUAL)
    const matrizPorEstado = this.contarPorEstado(matrizItems);
    const incidenciasPorEstado = this.contarPorEstado(incidenciasItems);

    const reporte: ProyectoDiarioSimple = {
      nombre: proyecto.name,
      matriz_pruebas: {
        total_actual: matrizItems.length,
        por_estado: matrizPorEstado,
        cambios: cambiosMatriz
      },
      incidencias: {
        total_actual: incidenciasItems.length,
        por_estado: incidenciasPorEstado,
        cambios: cambiosIncidencias
      }
    };

    return { reporte, snapshot: snapshotActual };
  }

  /**
   * Extrae el número del CP o RI del título
   */
  private extraerNumeroId(titulo: string): string {
    const match = titulo.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
    return match ? match[1] : "0";
  }

  /**
   * Ordena por número de ID (numérico)
   */
  private ordenarPorNumeroId(idA: string, idB: string): number {
    const numA = parseInt(idA, 10);
    const numB = parseInt(idB, 10);
    return numA - numB;
  }

  /**
   * Cuenta items agrupados por estado
   */
  private contarPorEstado(items: ItemMin[]): { [estado: string]: number } {
    const contadores: { [estado: string]: number } = {};
    
    for (const item of items) {
      const estado = item.estado;
      contadores[estado] = (contadores[estado] || 0) + 1;
    }
    
    return contadores;
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

  private crearReporteVacio(nombreProyecto: string): ProyectoDiarioSimple {
    return {
      nombre: nombreProyecto,
      matriz_pruebas: {
        total_actual: 0,
        por_estado: {},
        cambios: []
      },
      incidencias: {
        total_actual: 0,
        por_estado: {},
        cambios: []
      }
    };
  }
}
