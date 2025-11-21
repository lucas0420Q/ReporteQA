/**
 * @fileoverview Configuración para exportación de archivos CSV
 * @description Define delimitadores y opciones de codificación para compatibilidad con Excel
 */

/**
 * Delimitador de columnas CSV
 * - Para Excel en español (y la mayoría de regiones con coma como decimal): usar ";"
 * - Para Excel en inglés: usar ","
 * 
 * @default ";" (compatible con Excel en español)
 */
export const CSV_DELIMITER = ';';

/**
 * Configuración de saltos de línea
 * - Windows: \r\n (recomendado para Excel en Windows)
 * - Unix/Mac: \n
 * 
 * @default "\r\n" (Windows-friendly)
 */
export const CSV_LINE_ENDING = '\r\n';

/**
 * Configuración de codificación
 */
export const CSV_ENCODING = {
  /**
   * Codificación del archivo
   * @default "utf8"
   */
  charset: 'utf8' as BufferEncoding,
  
  /**
   * BOM (Byte Order Mark) para UTF-8
   * - Activa el BOM para que Excel reconozca automáticamente la codificación UTF-8
   * - El BOM es el caracter especial \uFEFF al inicio del archivo
   * 
   * @default true (recomendado para Excel)
   */
  useBOM: true,
  
  /**
   * Obtiene el BOM UTF-8 como string
   */
  getBOM(): string {
    return this.useBOM ? '\uFEFF' : '';
  }
} as const;

/**
 * Configuración completa para exportación CSV
 */
export const CSV_CONFIG = {
  delimiter: CSV_DELIMITER,
  lineEnding: CSV_LINE_ENDING,
  encoding: CSV_ENCODING,
} as const;

/**
 * Tipo de configuración CSV
 */
export type CsvConfig = typeof CSV_CONFIG;
