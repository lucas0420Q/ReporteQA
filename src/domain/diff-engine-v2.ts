/**
 * Motor de comparación entre snapshots
 * Detecta items nuevos, cambios de estado, e items eliminados
 */

import { ProyectoSnapshot, SnapshotItem } from './snapshot-manager.js';

export interface CambioDetectado {
  id: string;
  titulo: string;
  estado_actual: string;
  estado_anterior: string;
  tipo_cambio: 'nuevo' | 'cambio_estado' | 'sin_cambio';
}

export interface ItemEliminado {
  id: string;
  titulo: string;
  estado_anterior: string;
}

export interface ResultadoComparacion {
  items_nuevos: CambioDetectado[];
  items_con_cambio_estado: CambioDetectado[];
  items_sin_cambio: CambioDetectado[];
  items_eliminados: ItemEliminado[];
  total_cambios: number;  // nuevos + cambios de estado
}

export class DiffEngine {
  
  /**
   * Compara dos listas de items y detecta cambios
   */
  compararItems(
    itemsActuales: SnapshotItem[],
    itemsAnteriores: SnapshotItem[]
  ): ResultadoComparacion {
    
    // Crear mapas por ID para búsqueda rápida
    const mapaAnterior = new Map<string, SnapshotItem>();
    for (const item of itemsAnteriores) {
      mapaAnterior.set(item.id, item);
    }

    const mapaActual = new Map<string, SnapshotItem>();
    for (const item of itemsActuales) {
      mapaActual.set(item.id, item);
    }

    const nuevos: CambioDetectado[] = [];
    const cambiosEstado: CambioDetectado[] = [];
    const sinCambio: CambioDetectado[] = [];

    // Analizar items actuales
    for (const itemActual of itemsActuales) {
      const itemAnterior = mapaAnterior.get(itemActual.id);

      if (!itemAnterior) {
        // Item nuevo
        nuevos.push({
          id: itemActual.id,
          titulo: itemActual.titulo,
          estado_actual: itemActual.estado,
          estado_anterior: '',
          tipo_cambio: 'nuevo'
        });
      } else if (itemAnterior.estado !== itemActual.estado) {
        // Cambio de estado
        cambiosEstado.push({
          id: itemActual.id,
          titulo: itemActual.titulo,
          estado_actual: itemActual.estado,
          estado_anterior: itemAnterior.estado,
          tipo_cambio: 'cambio_estado'
        });
      } else {
        // Sin cambio
        sinCambio.push({
          id: itemActual.id,
          titulo: itemActual.titulo,
          estado_actual: itemActual.estado,
          estado_anterior: itemAnterior.estado,
          tipo_cambio: 'sin_cambio'
        });
      }
    }

    // Detectar items eliminados
    const eliminados: ItemEliminado[] = [];
    for (const itemAnterior of itemsAnteriores) {
      if (!mapaActual.has(itemAnterior.id)) {
        eliminados.push({
          id: itemAnterior.id,
          titulo: itemAnterior.titulo,
          estado_anterior: itemAnterior.estado
        });
      }
    }

    return {
      items_nuevos: nuevos,
      items_con_cambio_estado: cambiosEstado,
      items_sin_cambio: sinCambio,
      items_eliminados: eliminados,
      total_cambios: nuevos.length + cambiosEstado.length
    };
  }

  /**
   * Compara proyectos completos entre dos snapshots
   */
  compararProyecto(
    proyectoActual: ProyectoSnapshot,
    proyectoAnterior: ProyectoSnapshot | null
  ): {
    matriz: ResultadoComparacion;
    incidencias: ResultadoComparacion;
  } {
    
    const itemsMatrizAnteriores = proyectoAnterior?.matriz_pruebas || [];
    const itemsIncidenciasAnteriores = proyectoAnterior?.incidencias || [];

    return {
      matriz: this.compararItems(proyectoActual.matriz_pruebas, itemsMatrizAnteriores),
      incidencias: this.compararItems(proyectoActual.incidencias, itemsIncidenciasAnteriores)
    };
  }

  /**
   * Calcula métricas semanales comparando dos snapshots
   * V3.4: Incluye totales actuales además de cambios de la semana
   */
  calcularMetricasSemanales(
    proyectoActual: ProyectoSnapshot,
    proyectoSemanaAnterior: ProyectoSnapshot | null
  ): {
    casos_agregados_semana: number;
    casos_con_cambios_semana: number;
    casos_prueba_pendientes: number;
    casos_prueba_en_curso: number;
    casos_prueba_finalizados: number; // Total actual, no solo de la semana
    incidencias_nuevas_semana: number;
    incidencias_con_cambios_semana: number;
    incidencias_pendientes: number;
    incidencias_en_curso: number;
    incidencias_devueltas: number; // Total actual
    incidencias_finalizadas: number; // Total actual
    incidencias_resueltas: number; // Total actual
  } {
    
    const comparacion = this.compararProyecto(proyectoActual, proyectoSemanaAnterior);

    // ====================================
    // CASOS DE PRUEBA (CP)
    // ====================================
    
    // Casos agregados = items nuevos en matriz esta semana
    const casosAgregadosSemana = comparacion.matriz.items_nuevos.length;

    // Casos con cambios = items que tuvieron cambio de estado esta semana
    const casosConCambiosSemana = comparacion.matriz.items_con_cambio_estado.length;

    // Estados actuales de casos de prueba (TOTALES ACTUALES)
    const casosPendientes = proyectoActual.matriz_pruebas.filter(item =>
      this.esEstadoPendiente(item.estado)
    ).length;

    const casosEnCurso = proyectoActual.matriz_pruebas.filter(item =>
      this.esEstadoEnCurso(item.estado)
    ).length;

    const casosFinalizados = proyectoActual.matriz_pruebas.filter(item =>
      this.esEstadoFinalizado(item.estado)
    ).length;

    // ====================================
    // REPORTES DE INCIDENCIAS (RI)
    // ====================================
    
    // Incidencias nuevas esta semana
    const incidenciasNuevasSemana = comparacion.incidencias.items_nuevos.length;

    // Incidencias con cambios = items que tuvieron cambio de estado esta semana
    const incidenciasConCambiosSemana = comparacion.incidencias.items_con_cambio_estado.length;

    // Estados actuales de incidencias (TOTALES ACTUALES)
    const incidenciasPendientes = proyectoActual.incidencias.filter(item =>
      this.esEstadoPendiente(item.estado)
    ).length;

    const incidenciasEnCurso = proyectoActual.incidencias.filter(item =>
      this.esEstadoEnCurso(item.estado)
    ).length;

    const incidenciasFinalizadas = proyectoActual.incidencias.filter(item =>
      this.esEstadoFinalizado(item.estado)
    ).length;

    const incidenciasDevueltas = proyectoActual.incidencias.filter(item =>
      this.esEstadoDevuelto(item.estado)
    ).length;

    const incidenciasResueltas = proyectoActual.incidencias.filter(item =>
      this.esEstadoResuelto(item.estado)
    ).length;

    return {
      casos_agregados_semana: casosAgregadosSemana,
      casos_con_cambios_semana: casosConCambiosSemana,
      casos_prueba_pendientes: casosPendientes,
      casos_prueba_en_curso: casosEnCurso,
      casos_prueba_finalizados: casosFinalizados, // Total actual
      incidencias_nuevas_semana: incidenciasNuevasSemana,
      incidencias_con_cambios_semana: incidenciasConCambiosSemana,
      incidencias_pendientes: incidenciasPendientes,
      incidencias_en_curso: incidenciasEnCurso,
      incidencias_devueltas: incidenciasDevueltas, // Total actual
      incidencias_finalizadas: incidenciasFinalizadas, // Total actual
      incidencias_resueltas: incidenciasResueltas // Total actual
    };
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
}
