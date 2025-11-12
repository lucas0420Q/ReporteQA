/**
 * @fileoverview Configuración centralizada del sistema de reportes QA
 * @description Gestiona todas las configuraciones del proyecto con validación de tipos
 * @version 2.0.0
 */

/**
 * Parsea un número desde variable de entorno con valor por defecto
 */
function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parsea un booleano desde variable de entorno con valor por defecto
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Configuración principal del sistema
 */
export const config = {
  // Variables de entorno requeridas
  requiredEnvVars: [
    'NOTION_TOKEN',
    'NOTION_PROJECTS_DB_ID',
    'MATRIZ_DB_NAME',
    'INCIDENCIAS_DB_NAME',
  ] as const,

  // Valores por defecto (ahora configurables por ENV)
  defaults: {
    snapshotDir: process.env.SNAPSHOT_DIR || './snapshots',
    reportOutDir: process.env.REPORT_OUT_DIR || './reports',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    rateLimitRequestsPerMinute: parseEnvNumber(process.env.RATE_LIMIT_RPM, 60),
    logLevel: process.env.LOG_LEVEL || 'info',
  } as const,

  // Configuración de Notion API (configurable por ENV)
  notion: {
    apiVersion: process.env.NOTION_API_VERSION || '2022-06-28',
    maxRetries: parseEnvNumber(process.env.MAX_RETRIES, 3),
    baseRetryDelayMs: parseEnvNumber(process.env.BASE_RETRY_DELAY_MS, 1000),
    maxRetryDelayMs: parseEnvNumber(process.env.MAX_RETRY_DELAY_MS, 30000),
    timeoutMs: parseEnvNumber(process.env.TIMEOUT_MS, 30000),
  } as const,

  // Configuración de logging (configurable por ENV)
  logging: {
    maxIdDisplayLength: parseEnvNumber(process.env.MAX_ID_DISPLAY_LENGTH, 8),
    excludeFields: ['token', 'secret', 'password', 'key'] as const,
    enableDebug: parseEnvBoolean(process.env.ENABLE_DEBUG, false),
    enableVerbose: parseEnvBoolean(process.env.ENABLE_VERBOSE, false),
  } as const,

  // Configuración de snapshot
  snapshot: {
    maxAgeDays: 30, // Mantener snapshots por 30 días
    compressOlderThanDays: 7,
  } as const,

  // Configuración de S3
  s3: {
    serverSideEncryption: 'aws:kms',
    checksumAlgorithm: 'SHA256',
    storageClass: 'STANDARD_IA',
  } as const,
} as const;

export type Config = typeof config;