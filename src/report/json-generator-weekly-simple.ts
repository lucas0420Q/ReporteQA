/**
 * Generador de reporte semanal simplificado
 * VERSION 1: Solo métricas actuales, sin comparación con semana anterior
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
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class JSONGeneratorWeeklySimple {
  private readonly fetcher: NotionFetcher;
  private readonly reportsDir = './reports/semanales';

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
   * Genera reporte semanal simplificado
   * V1: Solo métricas actuales (sin comparación con semana anterior)
   */
  async generarReporteSemanal(): Promise<ReporteSemanalSimple> {
    const { semana, fecha } = this.getInfoSemana();
    
    console.log('>> Generando reporte semanal simplificado...');
    console.log(`   Semana: ${semana}`);
    console.log(`   Fecha: ${fecha}`);

    // Obtener proyectos activos
    const proyectos = await this.fetcher.fetchActiveProjects(
      process.env.NOTION_PROJECTS_DB_ID || ''
    );

    console.log(`   Proyectos activos: ${proyectos.length}\n`);

    const proyectosReporte: ProyectoSemanalSimple[] = [];

    for (const proyecto of proyectos) {
      try {
        console.log(`   Procesando ${proyecto.name}...`);
        const metricas = await this.calcularMetricasProyecto(proyecto);
        proyectosReporte.push(metricas);
        console.log(`      -> Métricas calculadas`);
      } catch (error) {
        console.error(`      [ERROR] ${proyecto.name}:`, (error as Error).message);
        // Crear métricas vacías para no romper el JSON
        proyectosReporte.push(this.crearMetricasVacias(proyecto.name));
      }
    }

    const reporte: ReporteSemanalSimple = {
      semana: semana,
      fecha_generacion: fecha,
      zona_horaria: 'America/Asuncion',
      proyectos: proyectosReporte
    };

    // Guardar reporte
    const nombreArchivo = `reporte-weekly-${semana}.json`;
    const rutaArchivo = join(this.reportsDir, nombreArchivo);
    writeFileSync(rutaArchivo, JSON.stringify(reporte, null, 2), 'utf8');

    console.log(`\n   Reporte guardado: ${rutaArchivo}`);
    
    // Crear copia latest
    const rutaLatest = join(this.reportsDir, 'latest-weekly.json');
    writeFileSync(rutaLatest, JSON.stringify(reporte, null, 2), 'utf8');
    console.log(`   Copia latest: ${rutaLatest}`);
    
    return reporte;
  }

  private async calcularMetricasProyecto(proyecto: Project): Promise<ProyectoSemanalSimple> {
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

    // Calcular métricas (V1: sin comparación semanal, solo estado actual)
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

    // TODO V2: Para "casos_agregados_semana", necesitamos comparar con snapshot de hace 7 días
    // Por ahora, usamos total actual como aproximación
    const casosAgregadosSemana = matrizItems.length; // Aproximación para V1

    return {
      nombre: proyecto.name,
      casos_agregados_semana: casosAgregadosSemana,
      incidencias_devueltas_semana: incidenciasDevueltas,
      incidencias_resueltas_semana: incidenciasResueltas,
      casos_prueba_finalizados_semana: casosFinalizados,
      casos_prueba_pendientes: casosPendientes
    };
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
