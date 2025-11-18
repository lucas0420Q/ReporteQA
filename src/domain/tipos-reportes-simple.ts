/**
 * Tipos para reportes simplificados v3.1
 * - Reporte Diario: Solo cambios ordenados por ID
 * - Reporte Semanal: Solo 4 contadores de la semana actual
 */

/**
 * Item con cambio de estado (solo para items que cambiaron)
 */
export interface ItemCambio {
  id: string;           // Número extraído (ej: "7" de "CP-7")
  titulo: string;       // Título completo
  estado_actual: string;
  estado_anterior: string;
  tipo_cambio: 'nuevo' | 'modificado' | 'eliminado';  // Tipo de cambio detectado
}

/**
 * Contadores por estado
 */
export interface ContadoresPorEstado {
  [estado: string]: number;  // Ejemplo: {"Pendiente": 10, "En curso": 5, "Finalizado": 30}
}

/**
 * Proyecto en reporte diario simplificado
 */
export interface ProyectoDiarioSimple {
  nombre: string;
  matriz_pruebas: {
    total_actual: number;           // Total de casos en Notion hoy
    por_estado: ContadoresPorEstado; // Contadores agrupados por estado
    cambios: ItemCambio[];          // Solo items que cambiaron, ordenados por ID numérico
  };
  incidencias: {
    total_actual: number;           // Total de incidencias en Notion hoy
    por_estado: ContadoresPorEstado; // Contadores agrupados por estado
    cambios: ItemCambio[];          // Solo items que cambiaron, ordenados por ID numérico
  };
}

/**
 * Reporte diario completo (solo cambios)
 */
export interface ReporteDiarioSimple {
  fecha_hora: string;               // YYYY-MM-DD HH:MM:SS
  zona_horaria: string;
  proyectos: ProyectoDiarioSimple[];
}

/**
 * Métricas de un proyecto para reporte semanal
 */
export interface ProyectoSemanalSimple {
  nombre: string;
  casos_agregados_semana: number;             // CPs agregados esta semana
  incidencias_devueltas_semana: number;       // RIs devueltas esta semana
  incidencias_resueltas_semana: number;       // RIs resueltas esta semana
  casos_prueba_finalizados_semana: number;    // CPs finalizados esta semana
  casos_prueba_pendientes: number;            // CPs pendientes actuales
}

/**
 * Reporte semanal completo (solo métricas actuales, sin comparación)
 */
export interface ReporteSemanalSimple {
  semana: string;                   // Formato "2025-W46"
  fecha_hora: string;               // YYYY-MM-DD HH:MM:SS
  zona_horaria: string;
  proyectos: ProyectoSemanalSimple[];
}
