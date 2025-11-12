/**
 * Tipos para el reporte JSON estructurado
 */

export interface ItemReporte {
  id: string;
  titulo: string;
  estado?: string;
}

export interface MatrizPruebas {
  nuevos: number;
  nuevos_CP: ItemReporte[];
  cambios: {
    total: number;
    pendiente: ItemReporte[];
    en_curso: ItemReporte[];
    finalizado: ItemReporte[];
  };
}

export interface Incidencias {
  nuevos: number;
  cambios: {
    total: number;
    pendiente: ItemReporte[];
    devuelto: ItemReporte[];
    en_curso: ItemReporte[];
    finalizado: ItemReporte[];
    resuelto: ItemReporte[];
  };
}

export interface ProyectoReporte {
  nombre: string;
  matriz_pruebas: MatrizPruebas;
  incidencias: Incidencias;
}

export interface ReporteJSON {
  fecha: string; // YYYY-MM-DD
  zona_horaria: string;
  proyectos: ProyectoReporte[];
}

/**
 * Tipos para sistema de diff
 */
export interface ItemMin {
  id?: string;
  titulo: string;
  estado: string;
}

export interface CambiosMatriz {
  total: number;
  finalizado: ItemReporte[];
  en_curso: ItemReporte[];
  pendiente: ItemReporte[];
}

export interface CambiosIncidencias {
  total: number;
  pendiente: ItemReporte[];
  devuelto: ItemReporte[];
  en_curso: ItemReporte[];
  finalizado: ItemReporte[];
  resuelto: ItemReporte[];
}

export interface DiffMatriz {
  nuevos: number;
  nuevos_pendiente: ItemReporte[];
  cambios: CambiosMatriz;
}

export interface DiffIncidencias {
  nuevos: number;
  cambios: CambiosIncidencias;
}

/**
 * Configuración para la generación del reporte
 */
export interface ConfigReporte {
  zonaHoraria: string;
  incluirSoloActivos: boolean;
  formatoFecha: string;
}