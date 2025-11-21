/**
 * @fileoverview Utilidades de filesystem para reportes QA
 * @description Manejo seguro de archivos con histórico y sin sobreescritura
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import type { SaveReportOptions, SavedReportMetadata } from '../types/report-types.js';

/**
 * Directorios base para reportes
 */
export const REPORT_DIRS = {
  BASE: './reports',
  DAILY: './reports/diarios',
  WEEKLY: './reports/semanales',
  WEEKLY_CSV: './reports/semanales/csv',
} as const;

/**
 * Construye la ruta para un reporte diario con fecha
 * @param date Fecha del reporte
 * @returns Ruta completa del archivo
 */
export function buildDailyReportPath(date: Date): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  return path.join(REPORT_DIRS.DAILY, `reporte-diario-${dateStr}.json`);
}

/**
 * Construye la ruta para el alias "latest" del reporte diario
 * @returns Ruta completa del alias
 */
export function buildDailyLatestPath(): string {
  return path.join(REPORT_DIRS.BASE, 'latest-daily.json');
}

/**
 * Construye la ruta para un reporte semanal con fecha y hora
 * @param date Fecha del reporte (generalmente lunes de la semana)
 * @returns Ruta completa del archivo con timestamp para evitar sobreescritura
 */
export function buildWeeklyReportPath(date: Date): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  const timeStr = format(date, 'HHmmss');
  return path.join(REPORT_DIRS.WEEKLY, `reporte-semanal-${dateStr}-${timeStr}.json`);
}

/**
 * Construye la ruta para un reporte semanal con número de semana
 * @param year Año
 * @param week Número de semana (1-53)
 * @returns Ruta completa del archivo
 */
export function buildWeeklyReportPathByWeek(year: number, week: number): string {
  const weekStr = week.toString().padStart(2, '0');
  return path.join(REPORT_DIRS.WEEKLY, `reporte-semanal-${year}-W${weekStr}.json`);
}

/**
 * Construye la ruta para el alias "latest" del reporte semanal
 * @returns Ruta completa del alias
 */
export function buildWeeklyLatestPath(): string {
  return path.join(REPORT_DIRS.BASE, 'latest-weekly.json');
}

/**
 * Construye la ruta para un CSV semanal con fecha
 * @param date Fecha del reporte
 * @returns Ruta completa del archivo CSV
 */
export function buildWeeklyCsvPath(date: Date): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  return path.join(REPORT_DIRS.WEEKLY_CSV, `reporte-semanal-${dateStr}.csv`);
}

/**
 * Construye la ruta para un CSV semanal con número de semana
 * @param year Año
 * @param week Número de semana (1-53)
 * @returns Ruta completa del archivo CSV
 */
export function buildWeeklyCsvPathByWeek(year: number, week: number): string {
  const weekStr = week.toString().padStart(2, '0');
  return path.join(REPORT_DIRS.WEEKLY_CSV, `reporte-semanal-${year}-W${weekStr}.csv`);
}

/**
 * Asegura que un directorio existe, creándolo si es necesario
 * @param dirPath Ruta del directorio
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Escribe un archivo JSON de forma atómica con validación
 * @param filePath Ruta del archivo
 * @param data Datos a escribir
 * @param options Opciones de escritura
 */
export async function writeJsonReportAtomic(
  filePath: string,
  data: unknown,
  options: SaveReportOptions = {}
): Promise<SavedReportMetadata> {
  const { createLatestAlias = false, overwrite = false } = options;
  
  // Verificar si existe y no se debe sobrescribir
  if (!overwrite) {
    try {
      await fs.access(filePath);
      throw new Error(`El archivo ya existe y overwrite=false: ${filePath}`);
    } catch (error) {
      // Si no existe, está bien, continuar
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // Asegurar que el directorio existe
  const dir = path.dirname(filePath);
  await ensureDirectoryExists(dir);

  // Escribir archivo temporal primero
  const tempPath = `${filePath}.tmp`;
  const jsonContent = JSON.stringify(data, null, 2);
  
  await fs.writeFile(tempPath, jsonContent, 'utf-8');
  
  // Mover atómicamente (rename es atómico en la mayoría de filesystems)
  await fs.rename(tempPath, filePath);

  // Obtener metadata
  const stats = await fs.stat(filePath);
  const metadata: SavedReportMetadata = {
    mainPath: filePath,
    size: stats.size,
    createdAt: stats.birthtime,
  };

  // Crear alias "latest" si se solicitó
  if (createLatestAlias) {
    const aliasPath = filePath.includes('diario')
      ? buildDailyLatestPath()
      : buildWeeklyLatestPath();
    
    await ensureDirectoryExists(path.dirname(aliasPath));
    await fs.copyFile(filePath, aliasPath);
    metadata.aliasPath = aliasPath;
  }

  return metadata;
}

/**
 * Escribe un archivo CSV de forma atómica con opción de no sobrescritura
 * @param filePath Ruta del archivo CSV
 * @param content Contenido CSV como string
 * @param options Opciones de escritura
 */
export async function writeCsvReportAtomic(
  filePath: string,
  content: string,
  options: SaveReportOptions = {}
): Promise<SavedReportMetadata> {
  const { overwrite = false } = options;
  
  // Verificar si existe y no se debe sobrescribir
  if (!overwrite) {
    try {
      await fs.access(filePath);
      throw new Error(`El archivo CSV ya existe y overwrite=false: ${filePath}`);
    } catch (error) {
      // Si no existe, está bien, continuar
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // Asegurar que el directorio existe
  const dir = path.dirname(filePath);
  await ensureDirectoryExists(dir);

  // Escribir archivo temporal primero
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  
  // Mover atómicamente
  await fs.rename(tempPath, filePath);

  // Obtener metadata
  const stats = await fs.stat(filePath);
  
  return {
    mainPath: filePath,
    size: stats.size,
    createdAt: stats.birthtime,
  };
}

/**
 * Lee un reporte JSON desde un archivo
 * @param filePath Ruta del archivo
 * @returns Datos del reporte
 */
export async function readJsonReport<T = unknown>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Verifica si un archivo existe
 * @param filePath Ruta del archivo
 * @returns true si existe, false si no
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lista todos los reportes diarios disponibles
 * @returns Array de rutas de archivos
 */
export async function listDailyReports(): Promise<string[]> {
  try {
    await ensureDirectoryExists(REPORT_DIRS.DAILY);
    const files = await fs.readdir(REPORT_DIRS.DAILY);
    return files
      .filter(f => f.startsWith('reporte-diario-') && f.endsWith('.json'))
      .map(f => path.join(REPORT_DIRS.DAILY, f))
      .sort()
      .reverse(); // Más recientes primero
  } catch {
    return [];
  }
}

/**
 * Lista todos los reportes semanales disponibles
 * @returns Array de rutas de archivos ordenados del más reciente al más antiguo
 */
export async function listWeeklyReports(): Promise<string[]> {
  try {
    await ensureDirectoryExists(REPORT_DIRS.WEEKLY);
    const files = await fs.readdir(REPORT_DIRS.WEEKLY);
    return files
      .filter(f => f.startsWith('reporte-semanal-') && f.endsWith('.json'))
      .map(f => path.join(REPORT_DIRS.WEEKLY, f))
      .sort()
      .reverse(); // Más recientes primero
  } catch {
    return [];
  }
}

/**
 * Obtiene el reporte semanal más reciente (excluyendo el actual si existe)
 * @param currentReportPath Ruta del reporte actual a excluir
 * @returns Ruta del reporte anterior o null si no existe
 */
export async function getPreviousWeeklyReport(currentReportPath?: string): Promise<string | null> {
  const reports = await listWeeklyReports();
  
  if (reports.length === 0) {
    return null;
  }
  
  // Si no hay reporte actual especificado, devolver el más reciente
  if (!currentReportPath) {
    return reports[0];
  }
  
  // Excluir el reporte actual y devolver el siguiente
  const filtered = reports.filter(r => r !== currentReportPath);
  return filtered.length > 0 ? filtered[0] : null;
}
