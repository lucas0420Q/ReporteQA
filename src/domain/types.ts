/**
 * @fileoverview Definiciones de tipos centralizadas para el sistema de reportes QA
 * @description Tipos TypeScript y esquemas Zod para validación de datos de Notion
 * @version 2.0.0
 */

import { z } from 'zod';

/**
 * Tipo de elemento en el sistema QA
 */
export type ItemType = 'CASO' | 'INCIDENCIA';

/**
 * Esquema de validación para tipos de items
 */
export const ItemTypeSchema = z.enum(['CASO', 'INCIDENCIA']);

/**
 * Estados posibles para casos de la matriz de pruebas
 */
export type MatrizPruebasEstado = 'Pendiente' | 'En curso' | 'Finalizado';

/**
 * Estados posibles para incidencias de QA
 */
export type IncidenciaEstado = 'Pendiente' | 'Devuelto' | 'En curso' | 'Finalizado' | 'Resuelto';

export const MatrizPruebasEstadoSchema = z.enum(['Pendiente', 'En curso', 'Finalizado']);
export const IncidenciaEstadoSchema = z.enum(['Pendiente', 'Devuelto', 'En curso', 'Finalizado', 'Resuelto']);

// Estado general (unión de ambos)
export type EstadoGeneral = MatrizPruebasEstado | IncidenciaEstado;

// Normalización de estados (mapeo de alias)
export const ESTADO_NORMALIZACION: Record<string, EstadoGeneral> = {
  'Curso': 'En curso',
  'En Curso': 'En curso',
  'en curso': 'En curso',
  'EN_CURSO': 'En curso',
  'Pendiente': 'Pendiente',
  'PENDIENTE': 'Pendiente',
  'Finalizado': 'Finalizado',
  'FINALIZADO': 'Finalizado',
  'Devuelto': 'Devuelto',
  'DEVUELTO': 'Devuelto',
  'Resuelto': 'Resuelto',
  'RESUELTO': 'Resuelto'
};

// Esquema para validar propiedades de Notion
export const NotionPropertySchema = z.object({
  id: z.string(),
  type: z.string(),
});

export const NotionSelectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});

export const NotionTitleSchema = z.object({
  type: z.literal('title'),
  title: z.array(
    z.object({
      type: z.literal('text'),
      text: z.object({
        content: z.string(),
      }),
    })
  ),
});

export const NotionRichTextSchema = z.object({
  type: z.literal('rich_text'),
  rich_text: z.array(
    z.object({
      type: z.literal('text'),
      text: z.object({
        content: z.string(),
      }),
    })
  ),
});

export const NotionSelectPropertySchema = z.object({
  type: z.literal('select'),
  select: NotionSelectSchema.nullable(),
});

export const NotionMultiSelectPropertySchema = z.object({
  type: z.literal('multi_select'),
  multi_select: z.array(NotionSelectSchema),
});

// Tipos específicos para Notion API (reemplaza any usage)
export interface NotionPageResponse {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, NotionProperty>;
}

export interface NotionProperty {
  id: string;
  type: string;
  title?: NotionTitleContent[];
  rich_text?: NotionRichTextContent[];
  select?: NotionSelectValue | null;
  multi_select?: NotionSelectValue[];
  status?: NotionStatusValue | null;
}

export interface NotionTitleContent {
  type: 'text';
  text: {
    content: string;
  };
  plain_text: string;
}

export interface NotionRichTextContent {
  type: 'text';
  text: {
    content: string;
  };
  plain_text: string;
}

export interface NotionSelectValue {
  id: string;
  name: string;
  color?: string;
}

export interface NotionStatusValue {
  id: string;
  name: string;
  color?: string;
}

export interface NotionBlockResponse {
  id: string;
  type: string;
  child_database?: {
    title: string;
  };
}

// Item mínimo para snapshots
export interface MinimalItem {
  id: string;
  title: string;
  status: string;
  lastEdited: string; // ISO string
  type: ItemType;
  hash: string; // SHA-256 de {id,title,status,lastEdited,type}
}

export const MinimalItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.string().min(1),
  lastEdited: z.string().datetime(),
  type: ItemTypeSchema,
  hash: z.string().length(64), // SHA-256 hash length
});

// Estados de proyecto
export type EstadoProyecto = 'En Curso' | 'Finalizado' | 'Pendiente' | 'Pausado' | 'Cancelado';

export const EstadoProyectoSchema = z.enum(['En Curso', 'Finalizado', 'Pendiente', 'Pausado', 'Cancelado']);

// Proyecto básico
export interface Project {
  id: string;
  name: string;
  status: EstadoProyecto;
}

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: EstadoProyectoSchema,
});

// Base de datos hijo
export interface ChildDatabase {
  id: string;
  name: string;
}

export const ChildDatabaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

// Snapshot de un proyecto
export interface ProjectSnapshot {
  projectName: string;
  dateISO: string;
  items: MinimalItem[];
}

export const ProjectSnapshotSchema = z.object({
  projectName: z.string().min(1),
  dateISO: z.string().datetime(),
  items: z.array(MinimalItemSchema),
});

// Cambios detectados entre snapshots
export interface ItemChanges {
  nuevos: MinimalItem[];
  cambiosEstado: Record<string, MinimalItem[]>; // agrupado por estado destino
}

export const ItemChangesSchema = z.object({
  nuevos: z.array(MinimalItemSchema),
  cambiosEstado: z.record(z.string(), z.array(MinimalItemSchema)),
});

// Estructura específica para Matriz de Pruebas según requerimiento
export interface MatrizPruebasReporte {
  nuevos: MinimalItem[]; // casos de prueba nuevos
  nuevos_pendiente: MinimalItem[]; // nuevos en estado Pendiente
  cambios: {
    total: number; // contador global de cambios
    finalizado: MinimalItem[];
    en_curso: MinimalItem[];
    pendiente: MinimalItem[];
  };
}

// Estructura específica para Reporte de Incidencias según requerimiento  
export interface IncidenciasReporte {
  nuevos: MinimalItem[]; // incidencias nuevas
  cambios: {
    total: number; // contador global de cambios
    pendiente: MinimalItem[];
    devuelto: MinimalItem[];
    en_curso: MinimalItem[];
    finalizado: MinimalItem[];
    resuelto: MinimalItem[];
  };
}

// Reporte por proyecto según estructura del requerimiento
export interface ProyectoReporte {
  nombre: string;
  matriz_pruebas: MatrizPruebasReporte;
  incidencias: IncidenciasReporte;
}

// Reporte de proyecto legacy (mantener compatibilidad)
export interface ProjectReport {
  projectName: string;
  dateISO: string;
  casosGenerados: MinimalItem[];
  incidenciasGeneradas: MinimalItem[];
  cambiosEstado: {
    casos: Record<string, MinimalItem[]>;
    incidencias: Record<string, MinimalItem[]>;
  };
  estadisticas: {
    totalCasosNuevos: number;
    totalIncidenciasNuevas: number;
    totalCambiosEstadoCasos: number;
    totalCambiosEstadoIncidencias: number;
  };
}

// Reporte diario completo (JSON output según requerimiento)
export interface ReporteDiario {
  fecha: string; // YYYY-MM-DD
  zona_horaria: string; // America/Asuncion
  proyectos: ProyectoReporte[];
}

// CSV row para exportación detallada
export interface CSVDetalleRow {
  fecha: string;
  proyecto: string;
  tipo: 'CP' | 'RI'; // CP = Caso de Prueba, RI = Reporte de Incidencia
  registro_id: string;
  titulo: string;
  estado_categoria: EstadoGeneral;
  estado: string;
  es_nuevo: boolean;
}

// Schemas de validación
export const MatrizPruebasReporteSchema = z.object({
  nuevos: z.array(MinimalItemSchema),
  nuevos_pendiente: z.array(MinimalItemSchema),
  cambios: z.object({
    total: z.number(),
    finalizado: z.array(MinimalItemSchema),
    en_curso: z.array(MinimalItemSchema),
    pendiente: z.array(MinimalItemSchema),
  }),
});

export const IncidenciasReporteSchema = z.object({
  nuevos: z.array(MinimalItemSchema),
  cambios: z.object({
    total: z.number(),
    pendiente: z.array(MinimalItemSchema),
    devuelto: z.array(MinimalItemSchema),
    en_curso: z.array(MinimalItemSchema),
    finalizado: z.array(MinimalItemSchema),
    resuelto: z.array(MinimalItemSchema),
  }),
});

export const ProyectoReporteSchema = z.object({
  nombre: z.string(),
  matriz_pruebas: MatrizPruebasReporteSchema,
  incidencias: IncidenciasReporteSchema,
});

export const ReporteDiarioSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  zona_horaria: z.string(),
  proyectos: z.array(ProyectoReporteSchema),
});

// Configuración del aplicativo
export interface AppConfig {
  notionToken: string;
  projectsDbId: string;
  matrizDbName: string;
  incidenciasDbName: string;
  snapshotDir: string;
  reportOutDir: string;
  aws?: {
    region: string;
    secretsName?: string;
    s3Bucket?: string;
    s3KmsKeyId?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
  };
}

export const AppConfigSchema = z.object({
  notionToken: z.string().min(1),
  projectsDbId: z.string().min(1),
  matrizDbName: z.string().min(1),
  incidenciasDbName: z.string().min(1),
  snapshotDir: z.string().min(1),
  reportOutDir: z.string().min(1),
  aws: z
    .object({
      region: z.string().min(1),
      secretsName: z.string().optional(),
      s3Bucket: z.string().optional(),
      s3KmsKeyId: z.string().optional(),
    })
    .optional(),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).max(3000),
  }),
});

// Errores personalizados con jerarquía específica
export abstract class BaseQAError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'API' | 'CONFIG' | 'VALIDATION' | 'PROCESSING';
  
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    
    // Mantener stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

export class NotionAPIError extends BaseQAError {
  readonly category = 'API' as const;

  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode?: number,
    cause?: Error
  ) {
    super(message, cause);
  }
}

export class ConfigurationError extends BaseQAError {
  readonly category = 'CONFIG' as const;
  readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class ValidationError extends BaseQAError {
  readonly category = 'VALIDATION' as const;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string, public readonly details?: unknown, cause?: Error) {
    super(message, cause);
  }
}

export class ProcessingError extends BaseQAError {
  readonly category = 'PROCESSING' as const;

  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, cause);
  }
}

// Utilidades de tipo
export type AsyncResult<T> = Promise<{ success: true; data: T } | { success: false; error: Error }>;

export function createAsyncResult<T>(data: T): AsyncResult<T> {
  return Promise.resolve({ success: true, data });
}

export function createAsyncError<T>(error: Error): AsyncResult<T> {
  return Promise.resolve({ success: false, error });
}