/**
 * Generador de reporte diario simplificado
 * VERSION 1: Solo estado actual, sin comparación (para testing inicial)
 * TODO: Agregar sistema de diffs en v2
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
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class JSONGeneratorDailySimple {
  private readonly fetcher: NotionFetcher;
  private readonly reportsDir = './reports';

  private readonly defaultConfig: PropertyConfig = {
    tituloProps: ['Name', 'Nombre', 'Title', 'Título', 'Caso', 'Case'],
    estadoProps: ['Status', 'Estado', 'State']
  };

  constructor() {
    this.fetcher = new NotionFetcher(2);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Genera reporte diario simplificado
   * V1: Sin comparación, solo muestra estado actual
   */
  async generarReporteDiario(): Promise<ReporteDiarioSimple> {
    const fecha = this.getFechaHoy();
    
    console.log('>> Generando reporte diario simplificado...');
    console.log(`   Fecha: ${fecha}`);

    // Obtener proyectos activos
    const proyectos = await this.fetcher.fetchActiveProjects(
      process.env.NOTION_PROJECTS_DB_ID || ''
    );

    console.log(`   Proyectos activos: ${proyectos.length}\n`);

    const proyectosReporte: ProyectoDiarioSimple[] = [];

    for (const proyecto of proyectos) {
      try {
        console.log(`   Procesando ${proyecto.name}...`);
        const reporte = await this.procesarProyecto(proyecto);
        proyectosReporte.push(reporte);
        
        const totalItems = reporte.matriz_pruebas.total_actual + reporte.incidencias.total_actual;
        console.log(`      -> ${totalItems} items encontrados`);
      } catch (error) {
        console.error(`      [ERROR] ${proyecto.name}:`, (error as Error).message);
        // Crear reporte vacío para no romper el JSON
        proyectosReporte.push(this.crearReporteVacio(proyecto.name));
      }
    }

    const reporte: ReporteDiarioSimple = {
      fecha: fecha,
      zona_horaria: 'America/Asuncion',
      proyectos: proyectosReporte
    };

    // Guardar reporte
    const nombreArchivo = `reporte-daily-${fecha}.json`;
    const rutaArchivo = join(this.reportsDir, nombreArchivo);
    writeFileSync(rutaArchivo, JSON.stringify(reporte, null, 2), 'utf8');

    console.log(`\n   Reporte guardado: ${rutaArchivo}`);
    
    // Crear copia latest
    const rutaLatest = join(this.reportsDir, 'latest-daily.json');
    writeFileSync(rutaLatest, JSON.stringify(reporte, null, 2), 'utf8');
    console.log(`   Copia latest: ${rutaLatest}`);
    
    return reporte;
  }

  private async procesarProyecto(proyecto: Project): Promise<ProyectoDiarioSimple> {
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

    // Por ahora, como es V1, no tenemos cambios reales, solo mostramos estado actual
    // En V2 agregaremos sistema de snapshots para detectar cambios
    const matrizCambios: ItemCambio[] = matrizItems.map(item => ({
      id: this.extraerNumeroId(item.titulo),
      titulo: item.titulo,
      estado_actual: item.estado,
      estado_anterior: '' // V1: Sin comparación aún
    })).sort((a, b) => this.ordenarPorNumeroId(a.id, b.id));

    const incidenciasCambios: ItemCambio[] = incidenciasItems.map(item => ({
      id: this.extraerNumeroId(item.titulo),
      titulo: item.titulo,
      estado_actual: item.estado,
      estado_anterior: '' // V1: Sin comparación aún
    })).sort((a, b) => this.ordenarPorNumeroId(a.id, b.id));

    // Calcular contadores por estado
    const matrizPorEstado = this.contarPorEstado(matrizItems);
    const incidenciasPorEstado = this.contarPorEstado(incidenciasItems);

    return {
      nombre: proyecto.name,
      matriz_pruebas: {
        total_actual: matrizItems.length,
        por_estado: matrizPorEstado,
        cambios: matrizCambios
      },
      incidencias: {
        total_actual: incidenciasItems.length,
        por_estado: incidenciasPorEstado,
        cambios: incidenciasCambios
      }
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
      console.error(`   ⚠️  Error obteniendo ${tipo}:`, (error as Error).message);
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

  private getFechaHoy(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
