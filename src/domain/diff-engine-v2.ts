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
   */
  calcularMetricasSemanales(
    proyectoActual: ProyectoSnapshot,
    proyectoSemanaAnterior: ProyectoSnapshot | null
  ): {
    casos_agregados_semana: number;
    incidencias_devueltas_semana: number;
    incidencias_resueltas_semana: number;
    casos_prueba_finalizados_semana: number;
    casos_prueba_pendientes: number;
  } {
    
    const comparacion = this.compararProyecto(proyectoActual, proyectoSemanaAnterior);

    // Casos agregados = items nuevos en matriz esta semana
    const casosAgregadosSemana = comparacion.matriz.items_nuevos.length;

    // Estados actuales
    const casosFinalizados = proyectoActual.matriz_pruebas.filter(item =>
      this.esEstadoFinalizado(item.estado)
    ).length;

    const casosPendientes = proyectoActual.matriz_pruebas.filter(item =>
      this.esEstadoPendiente(item.estado)
    ).length;

    // Incidencias devueltas esta semana = items que cambiaron a "Devuelto"
    const incidenciasDevueltas = comparacion.incidencias.items_con_cambio_estado.filter(cambio =>
      this.esEstadoDevuelto(cambio.estado_actual) && 
      !this.esEstadoDevuelto(cambio.estado_anterior)
    ).length + comparacion.incidencias.items_nuevos.filter(nuevo =>
      this.esEstadoDevuelto(nuevo.estado_actual)
    ).length;

    // Incidencias resueltas esta semana = items que cambiaron a "Resuelto"
    const incidenciasResueltas = comparacion.incidencias.items_con_cambio_estado.filter(cambio =>
      this.esEstadoResuelto(cambio.estado_actual) && 
      !this.esEstadoResuelto(cambio.estado_anterior)
    ).length + comparacion.incidencias.items_nuevos.filter(nuevo =>
      this.esEstadoResuelto(nuevo.estado_actual)
    ).length;

    // Casos finalizados esta semana = items que cambiaron a "Finalizado"
    const casosFinalizadosSemana = comparacion.matriz.items_con_cambio_estado.filter(cambio =>
      this.esEstadoFinalizado(cambio.estado_actual) && 
      !this.esEstadoFinalizado(cambio.estado_anterior)
    ).length + comparacion.matriz.items_nuevos.filter(nuevo =>
      this.esEstadoFinalizado(nuevo.estado_actual)
    ).length;

    return {
      casos_agregados_semana: casosAgregadosSemana,
      incidencias_devueltas_semana: incidenciasDevueltas,
      incidencias_resueltas_semana: incidenciasResueltas,
      casos_prueba_finalizados_semana: casosFinalizadosSemana,
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
}
