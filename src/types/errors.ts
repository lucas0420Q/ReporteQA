/**
 * @fileoverview Jerarquía de errores personalizados del sistema
 * @description Define clases de error tipadas para mejor manejo de excepciones
 */

/**
 * Error base del sistema QA con categorización
 */
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

/**
 * Error relacionado con llamadas a APIs externas (Notion, AWS, etc.)
 */
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

/**
 * Error de configuración (variables de entorno, archivos, etc.)
 */
export class ConfigurationError extends BaseQAError {
  readonly category = 'CONFIG' as const;
  readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error de validación de datos (tipos, formatos, etc.)
 */
export class ValidationError extends BaseQAError {
  readonly category = 'VALIDATION' as const;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string, public readonly details?: unknown, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error durante procesamiento de datos (transformaciones, cálculos, etc.)
 */
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
