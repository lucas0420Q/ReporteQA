/**
 * @fileoverview Tipos comunes compartidos en todo el sistema
 * @description Define tipos básicos reutilizables en todo el proyecto
 */

/**
 * Tipo de elemento en el sistema QA
 */
export type ItemType = 'CASO' | 'INCIDENCIA';

/**
 * Estados posibles para casos de la matriz de pruebas
 */
export type MatrizPruebasEstado = 'Pendiente' | 'En curso' | 'Finalizado';

/**
 * Estados posibles para incidencias de QA
 */
export type IncidenciaEstado = 'Pendiente' | 'Devuelto' | 'En curso' | 'Finalizado' | 'Resuelto';

/**
 * Estado general (unión de ambos tipos)
 */
export type EstadoGeneral = MatrizPruebasEstado | IncidenciaEstado;

/**
 * Estados posibles para proyectos
 */
export type EstadoProyecto = 'En Curso' | 'Finalizado' | 'Pendiente' | 'Pausado' | 'Cancelado';

/**
 * Item mínimo para representar casos e incidencias
 */
export interface ItemMin {
  id: string;
  titulo: string;
  estado: string;
}

/**
 * Proyecto básico del sistema
 */
export interface Project {
  id: string;
  name: string;
  status: EstadoProyecto;
}

/**
 * Base de datos hijo en Notion
 */
export interface ChildDatabase {
  id: string;
  name: string;
}

/**
 * Resultado de operación asíncrona con manejo de errores tipado
 */
export type AsyncResult<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };
