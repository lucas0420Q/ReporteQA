/**
 * @fileoverview Sistema de logging consistente
 * @description Utilidades para logging estructurado con prefijos y colores
 */

/**
 * Prefijos estándar para diferentes módulos del sistema
 */
export const LOG_PREFIXES = {
  NOTION: '[NOTION]',
  REPORT_DAILY: '[DAILY]',
  REPORT_WEEKLY: '[WEEKLY]',
  CSV_EXPORT: '[CSV]',
  SNAPSHOT: '[SNAPSHOT]',
  DIFF: '[DIFF]',
  CONFIG: '[CONFIG]',
  FS: '[FS]',
} as const;

/**
 * Niveles de log del sistema
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Logger con prefijo automático
 */
export class Logger {
  constructor(private readonly prefix: string) {}

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} ⚠️  ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`${this.prefix} ❌ ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.ENABLE_DEBUG === 'true') {
      console.debug(`${this.prefix} 🔍 ${message}`, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} ✅ ${message}`, ...args);
  }
}

/**
 * Crea una instancia de logger con prefijo
 */
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

/**
 * Loggers pre-configurados para módulos comunes
 */
export const loggers = {
  notion: createLogger(LOG_PREFIXES.NOTION),
  daily: createLogger(LOG_PREFIXES.REPORT_DAILY),
  weekly: createLogger(LOG_PREFIXES.REPORT_WEEKLY),
  csv: createLogger(LOG_PREFIXES.CSV_EXPORT),
  snapshot: createLogger(LOG_PREFIXES.SNAPSHOT),
  diff: createLogger(LOG_PREFIXES.DIFF),
  config: createLogger(LOG_PREFIXES.CONFIG),
  fs: createLogger(LOG_PREFIXES.FS),
};
