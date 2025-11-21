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
 * V3.4: Incluye totales actuales además de cambios de la semana
 */
export interface ProyectoSemanalSimple {
  nombre: string;
  
  // Casos de Prueba (CP) - Cambios de la semana
  casos_agregados_semana: number;             // CPs nuevos agregados esta semana
  casos_con_cambios_semana: number;           // CPs con cambio de estado esta semana
  
  // Casos de Prueba (CP) - Totales actuales
  casos_prueba_pendientes: number;            // CPs pendientes actuales (total)
  casos_prueba_en_curso: number;              // CPs en curso actuales (total)
  casos_prueba_finalizados: number;           // CPs finalizados actuales (total)
  
  // Reportes de Incidencias (RI) - Cambios de la semana
  incidencias_nuevas_semana: number;          // RIs nuevas esta semana
  incidencias_con_cambios_semana: number;     // RIs con cambio de estado esta semana
  
  // Reportes de Incidencias (RI) - Totales actuales
  incidencias_pendientes: number;             // RIs pendientes actuales (total)
  incidencias_en_curso: number;               // RIs en curso actuales (total)
  incidencias_devueltas: number;              // RIs devueltas actuales (total)
  incidencias_finalizadas: number;            // RIs finalizadas actuales (total)
  incidencias_resueltas: number;              // RIs resueltas actuales (total)
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
