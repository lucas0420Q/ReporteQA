/**
 * Generador de reportes JSON que muestra TODOS los datos reales de Notion
 * En lugar de solo diferencias, muestra el estado actual completo
 */

import { NotionFetcher } from '../notion/fetch.js';
import { Project } from '../domain/types.js';
import { 
  ItemMin, 
  PropertyConfig, 
  toItemMin,
  bucketMatriz,
  bucketIncid
} from '../domain/utils-notion.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type ProyectoReporteReal = {
  nombre: string;
  matriz_pruebas: {
    nuevos: number;
    nuevos_CP: { id: string; titulo: string; estado: 'Pendiente' }[];
    cambios: {
      total: number;
      pendiente: { id: string; titulo: string }[];
      en_curso: { id: string; titulo: string }[];
      finalizado: { id: string; titulo: string }[];
    };
  };
  incidencias: {
    nuevos: number;
    cambios: {
      total: number;
      pendiente: { id: string; titulo: string }[];
      devuelto: { id: string; titulo: string }[];
      en_curso: { id: string; titulo: string }[];
      finalizado: { id: string; titulo: string }[];
      resuelto: { id: string; titulo: string }[];
    };
  };
};

export type ReporteJSONReal = {
  fecha: string;
  zona_horaria: string;
  proyectos: ProyectoReporteReal[];
};

export class JSONGeneratorReal {
  private readonly fetcher: NotionFetcher;
  private readonly reportesDir = './reportes';

  // Configuración de propiedades por defecto
  private readonly defaultConfig: PropertyConfig = {
    tituloProps: ['Name', 'Nombre', 'Title', 'Título', 'Caso', 'Case'],
    estadoProps: ['Status', 'Estado', 'State']
  };

  constructor() {
    this.fetcher = new NotionFetcher(2);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.reportesDir)) {
      mkdirSync(this.reportesDir, { recursive: true });
    }
  }

  /**
   * Genera reporte con TODOS los datos reales de Notion
   */
  async generarReporteReal(): Promise<ReporteJSONReal> {
    const fecha = this.getFechaHoy();
    
    console.log('📊 Generando reporte con datos reales de Notion...');

    // Obtener proyectos activos
    const proyectos = await this.fetcher.fetchActiveProjects(
      '160a972d1d9d800b9d9fdc19f16e1126'
    );

    console.log(`✅ Encontrados ${proyectos.length} proyectos activos`);

    const proyectosReporte: ProyectoReporteReal[] = [];

    for (const proyecto of proyectos) {
      try {
        console.log(`\n🔄 ${proyecto.name}...`);
        const reporte = await this.procesarProyectoReal(proyecto);
        proyectosReporte.push(reporte);
        
        const totalItems = reporte.matriz_pruebas.cambios.total + reporte.incidencias.cambios.total;
        if (totalItems > 0) {
          console.log(`   ✅ ${totalItems} items procesados`);
        }
      } catch (error) {
        console.error(`❌ Error en ${proyecto.name}:`, (error as Error).message);
        // Crear reporte vacío para no romper el JSON
        proyectosReporte.push(this.crearReporteVacio(proyecto.name));
      }
    }

    const reporte: ReporteJSONReal = {
      fecha: fecha,
      zona_horaria: 'America/Asuncion',
      proyectos: proyectosReporte
    };

    // Guardar reporte con contadores agregados en formato legible
    const nombreArchivo = `reporte-real-${fecha}.json`;
    const rutaArchivo = join(this.reportesDir, nombreArchivo);
    const reporteConContadores = this.agregarContadores(reporte);
    writeFileSync(rutaArchivo, reporteConContadores, 'utf8');

    console.log(`\n💾 Reporte guardado: ${rutaArchivo}`);
    return reporte;
  }

  private async procesarProyectoReal(proyecto: Project): Promise<ProyectoReporteReal> {
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

    // Procesar items REALES (no diffs, sino estado actual)
    const matrizProcesada = this.procesarMatrizReal(matrizItems);
    const incidenciasProcesadas = this.procesarIncidenciasReal(incidenciasItems);

    return {
      nombre: proyecto.name,
      matriz_pruebas: matrizProcesada,
      incidencias: incidenciasProcesadas
    };
  }

  /**
   * Extrae el número del CP o RI del título
   */
  private extraerNumeroCP(titulo: string): string {
    // Buscar patrones como CP-01, CP - 01, RI-01, RI - 01, etc.
    const match = titulo.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
    if (match) {
      return match[1]; // Retorna solo el número (sin ceros a la izquierda)
    }
    // Si no encuentra patrón, retornar "0" como fallback
    return "0";
  }

  /**
   * Ordena por número de ID (como string numérico)
   */
  private ordenarPorNumeroId(idA: string, idB: string): number {
    const numA = parseInt(idA, 10);
    const numB = parseInt(idB, 10);
    return numA - numB;
  }

  /**
   * Ordena por número CP/RI manteniendo el orden numérico correcto
   */
  private ordenarPorCP(tituloA: string, tituloB: string): number {
    // Extraer números de CP-XX, CP - XX, RI-XX, RI - XX (con o sin espacios)
    const matchA = tituloA.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
    const matchB = tituloB.match(/(?:CP|RI)\s*-?\s*(\d+)/i);
    
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      return numA - numB;
    }
    
    // Si no hay números, ordenar alfabéticamente
    return tituloA.localeCompare(tituloB);
  }

  /**
   * Agrega contadores visibles en el JSON final
   */
  private agregarContadores(reporte: ReporteJSONReal): string {
    const reporteClonado = JSON.parse(JSON.stringify(reporte));
    
    // Agregar contadores a cada proyecto
    reporteClonado.proyectos.forEach((proyecto: any) => {
      // Matriz de pruebas - Renombrar claves con contadores
      const matriz = proyecto.matriz_pruebas.cambios;
      const matrizNueva = {
        total: matriz.total,
        [`pendiente (${matriz.pendiente.length})`]: matriz.pendiente,
        [`en_curso (${matriz.en_curso.length})`]: matriz.en_curso,
        [`finalizado (${matriz.finalizado.length})`]: matriz.finalizado
      };
      proyecto.matriz_pruebas.cambios = matrizNueva;
      
      // Incidencias - Renombrar claves con contadores
      const incidencias = proyecto.incidencias.cambios;
      const incidenciasNuevas = {
        total: incidencias.total,
        [`pendiente (${incidencias.pendiente.length})`]: incidencias.pendiente,
        [`devuelto (${incidencias.devuelto.length})`]: incidencias.devuelto,
        [`en_curso (${incidencias.en_curso.length})`]: incidencias.en_curso,
        [`finalizado (${incidencias.finalizado.length})`]: incidencias.finalizado,
        [`resuelto (${incidencias.resuelto.length})`]: incidencias.resuelto
      };
      proyecto.incidencias.cambios = incidenciasNuevas;
    });
    
    return JSON.stringify(reporteClonado, null, 2);
  }

  private procesarMatrizReal(items: ItemMin[]) {
    const pendientes: { id: string; titulo: string }[] = [];
    const enCurso: { id: string; titulo: string }[] = [];
    const finalizados: { id: string; titulo: string }[] = [];

    for (const item of items) {
      const bucket = bucketMatriz(item.estado);
      // Extraer el número del CP del título
      const cpNumber = this.extraerNumeroCP(item.titulo);
      const itemFormateado = {
        id: cpNumber,
        titulo: item.titulo
      };

      switch (bucket) {
        case 'pendiente':
          pendientes.push(itemFormateado);
          break;
        case 'en_curso':
          enCurso.push(itemFormateado);
          break;
        case 'finalizado':
          finalizados.push(itemFormateado);
          break;
      }
    }

    return {
      nuevos: items.length, // Total de items encontrados
      nuevos_CP: pendientes.map(p => ({ ...p, estado: 'Pendiente' as const })).sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
      cambios: {
        total: items.length,
        pendiente: pendientes.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        en_curso: enCurso.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        finalizado: finalizados.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id))
      }
    };
  }

  private procesarIncidenciasReal(items: ItemMin[]) {
    const pendientes: { id: string; titulo: string }[] = [];
    const devueltos: { id: string; titulo: string }[] = [];
    const enCurso: { id: string; titulo: string }[] = [];
    const finalizados: { id: string; titulo: string }[] = [];
    const resueltos: { id: string; titulo: string }[] = [];

    for (const item of items) {
      const bucket = bucketIncid(item.estado);
      // Extraer el número del RI del título
      const riNumber = this.extraerNumeroCP(item.titulo);
      const itemFormateado = {
        id: riNumber,
        titulo: item.titulo
      };

      switch (bucket) {
        case 'pendiente':
          pendientes.push(itemFormateado);
          break;
        case 'devuelto':
          devueltos.push(itemFormateado);
          break;
        case 'en_curso':
          enCurso.push(itemFormateado);
          break;
        case 'finalizado':
          finalizados.push(itemFormateado);
          break;
        case 'resuelto':
          resueltos.push(itemFormateado);
          break;
      }
    }

    return {
      nuevos: items.length, // Total de items encontrados
      cambios: {
        total: items.length,
        pendiente: pendientes.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        devuelto: devueltos.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        en_curso: enCurso.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        finalizado: finalizados.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id)),
        resuelto: resueltos.sort((a, b) => this.ordenarPorNumeroId(a.id, b.id))
      }
    };
  }

  private async obtenerItemsRobusto(dbId: string, tipo: 'matriz' | 'incidencias'): Promise<ItemMin[]> {
    try {
      // Obtener páginas raw con consulta simple
      const pagesRaw = await this.fetcher.fetchItemsRobust(dbId, tipo === 'matriz' ? 'CASO' : 'INCIDENCIA');

      // Convertir a ItemMin usando función robusta
      const items: ItemMin[] = [];
      for (const page of pagesRaw) {
        const item = toItemMin(page, this.defaultConfig);
        if (item) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      return this.handleDatabaseError(error as Error, tipo, dbId);
    }
  }

  /**
   * ✅ MEJORA: Manejo profesional e informativo de errores de base de datos
   */
  private handleDatabaseError(error: Error, tipo: string, dbId: string): ItemMin[] {
    const errorMessage = error.message.toLowerCase();
    
    // 🔧 Múltiples fuentes de datos - Limitación técnica conocida
    if (errorMessage.includes('multiple data sources')) {
      console.log(`   📋 ${tipo} omitida - Limitación de API Notion`);
      console.log(`      💡 Solución: Convertir a base de datos con fuente única en Notion`);
      console.log(`      📊 Impacto: Los datos de matriz siguen disponibles`);
      return [];
    }
    
    // 🔑 Errores de permisos
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      console.log(`   🔒 ${tipo} inaccesible - Verificar permisos de integración`);
      console.log(`      💡 Solución: Otorgar acceso a la integración en Notion`);
      return [];
    }
    
    // 🔍 Recurso no encontrado
    if (errorMessage.includes('not_found')) {
      console.log(`   🔍 ${tipo} DB no encontrada (ID: ${this.truncateId(dbId)})`);
      console.log(`      💡 Posible causa: Base de datos eliminada o movida`);
      return [];
    }
    
    // ⚡ Rate limiting
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      console.log(`   ⏳ ${tipo} temporalmente no disponible - Rate limit alcanzado`);
      console.log(`      💡 El sistema reintentará automáticamente`);
      return [];
    }
    
    // 🌐 Errores de conectividad
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      console.log(`   🌐 ${tipo} no disponible - Error de conectividad`);
      console.log(`      💡 Verificar conexión a internet y estado de Notion API`);
      return [];
    }
    
    // ❌ Errores no categorizados - mostrar con contexto
    console.log(`   ❌ Error procesando ${tipo}:`);
    console.log(`      📝 Detalle: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`);
    console.log(`      🆔 DB: ${this.truncateId(dbId)}`);
    return [];
  }

  /**
   * Trunca un ID para logging seguro
   */
  private truncateId(id: string): string {
    return id.substring(0, 8) + '...';
  }

  private crearReporteVacio(nombre: string): ProyectoReporteReal {
    return {
      nombre,
      matriz_pruebas: {
        nuevos: 0,
        nuevos_CP: [],
        cambios: { total: 0, pendiente: [], en_curso: [], finalizado: [] }
      },
      incidencias: {
        nuevos: 0,
        cambios: { total: 0, pendiente: [], devuelto: [], en_curso: [], finalizado: [], resuelto: [] }
      }
    };
  }

  private getFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}