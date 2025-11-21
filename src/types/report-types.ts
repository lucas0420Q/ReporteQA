/**
 * @fileoverview Tipos comunes para reportes QA
 * @description Define interfaces para reportes diarios, semanales y CSV
 */

/**
 * Proyecto con métricas semanales completas para CSV
 */
export interface ProyectoSemanalCSV {
  nombre: string;
  
  // Casos de Prueba (CP)
  cp_nuevos: number;
  cp_con_cambios: number;
  cp_pendientes: number;
  cp_en_curso: number;
  cp_finalizados: number;
  
  // Reportes de Incidencias (RI)
  ri_nuevas: number;
  ri_con_cambios: number;
  ri_pendientes: number;
  ri_en_curso: number;
  ri_devuelto: number;
  ri_finalizado: number;
  ri_resuelto: number;
}

/**
 * Estructura del CSV semanal exportado
 */
export interface ReporteSemanalCSVData {
  fecha_generacion: string;
  semana: string;
  proyectos: ProyectoSemanalCSV[];
}

/**
 * Opciones para guardar reportes con histórico
 */
export interface SaveReportOptions {
  /** Crear también un archivo "latest" */
  createLatestAlias?: boolean;
  /** Sobrescribir si existe */
  overwrite?: boolean;
}

/**
 * Metadata de archivo de reporte guardado
 */
export interface SavedReportMetadata {
  /** Ruta completa del archivo principal */
  mainPath: string;
  /** Ruta del alias "latest" si se creó */
  aliasPath?: string;
  /** Tamaño en bytes */
  size: number;
  /** Fecha de creación */
  createdAt: Date;
}
