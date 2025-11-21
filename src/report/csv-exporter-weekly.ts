/**
 * @fileoverview Exportador de reportes semanales a formato CSV
 * @description Convierte reportes JSON semanales a CSV con estructura de dos tablas
 * Optimizado para Excel en español con delimitador de punto y coma (;)
 */

import type { ReporteSemanalSimple } from '../domain/tipos-reportes-simple.js';
import type { ProyectoSemanalCSV, ReporteSemanalCSVData } from '../types/report-types.js';
import { readJsonReport, writeCsvReportAtomic, buildWeeklyCsvPath, fileExists } from '../utils/fs-reports.js';
import { CSV_CONFIG } from '../config/csv-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Convierte un reporte semanal JSON a estructura CSV
 * @param reporteJson Reporte semanal en formato JSON
 * @returns Datos estructurados para CSV
 */
export function convertWeeklyJsonToCsvData(reporteJson: ReporteSemanalSimple): ReporteSemanalCSVData {
  const proyectosCSV: ProyectoSemanalCSV[] = reporteJson.proyectos.map(proyecto => {
    return {
      nombre: proyecto.nombre,
      
      // Casos de Prueba - Usar totales actuales (no "_semana")
      cp_nuevos: proyecto.casos_agregados_semana,
      cp_con_cambios: proyecto.casos_con_cambios_semana,
      cp_pendientes: proyecto.casos_prueba_pendientes,
      cp_en_curso: proyecto.casos_prueba_en_curso,
      cp_finalizados: proyecto.casos_prueba_finalizados, // Total actual
      
      // Reportes de Incidencias - Usar totales actuales (no "_semana")
      ri_nuevas: proyecto.incidencias_nuevas_semana,
      ri_con_cambios: proyecto.incidencias_con_cambios_semana,
      ri_pendientes: proyecto.incidencias_pendientes,
      ri_en_curso: proyecto.incidencias_en_curso,
      ri_devuelto: proyecto.incidencias_devueltas, // Total actual
      ri_finalizado: proyecto.incidencias_finalizadas, // Total actual
      ri_resuelto: proyecto.incidencias_resueltas, // Total actual
    };
  });

  return {
    fecha_generacion: reporteJson.fecha_hora,
    semana: reporteJson.semana,
    proyectos: proyectosCSV,
  };
}

/**
 * Genera el contenido CSV con dos tablas: CP e RI
 * Usa delimitador configurable (;) para compatibilidad con Excel en español
 * @param data Datos estructurados del reporte
 * @returns String con el contenido CSV completo
 */
export function generateCsvContent(data: ReporteSemanalCSVData): string {
  const lines: string[] = [];
  const { delimiter, lineEnding, encoding } = CSV_CONFIG;
  
  // BOM para UTF-8 (ayuda a Excel a reconocer la codificación)
  const bom = encoding.getBOM();
  
  // Encabezado del reporte
  lines.push(`Reporte Semanal de QA - Semana ${data.semana}`);
  lines.push(`Generado: ${data.fecha_generacion}`);
  lines.push(''); // Línea vacía
  
  // ============================================
  // TABLA 1: CASOS DE PRUEBA (CP)
  // ============================================
  lines.push('=== CASOS DE PRUEBA (CP) ===');
  lines.push(''); // Línea vacía
  
  // Encabezados de CP
  const cpHeaders = [
    'Proyecto',
    'CP_nuevos',
    'CP_con_cambios',
    'CP_pendientes',
    'CP_en_curso',
    'CP_finalizados',
  ];
  lines.push(cpHeaders.join(delimiter));
  
  // Filas de CP
  for (const proyecto of data.proyectos) {
    const cpRow = [
      escapeCsvValue(proyecto.nombre, delimiter),
      proyecto.cp_nuevos.toString(),
      proyecto.cp_con_cambios.toString(),
      proyecto.cp_pendientes.toString(),
      proyecto.cp_en_curso.toString(),
      proyecto.cp_finalizados.toString(),
    ];
    lines.push(cpRow.join(delimiter));
  }
  
  // Línea vacía entre tablas
  lines.push('');
  lines.push('');
  
  // ============================================
  // TABLA 2: REPORTES DE INCIDENCIAS (RI)
  // ============================================
  lines.push('=== REPORTES DE INCIDENCIAS (RI) ===');
  lines.push(''); // Línea vacía
  
  // Encabezados de RI
  const riHeaders = [
    'Proyecto',
    'RI_nuevas',
    'RI_con_cambios',
    'RI_pendientes',
    'RI_en_curso',
    'RI_devuelto',
    'RI_finalizado',
    'RI_resuelto',
  ];
  lines.push(riHeaders.join(delimiter));
  
  // Filas de RI
  for (const proyecto of data.proyectos) {
    const riRow = [
      escapeCsvValue(proyecto.nombre, delimiter),
      proyecto.ri_nuevas.toString(),
      proyecto.ri_con_cambios.toString(),
      proyecto.ri_pendientes.toString(),
      proyecto.ri_en_curso.toString(),
      proyecto.ri_devuelto.toString(),
      proyecto.ri_finalizado.toString(),
      proyecto.ri_resuelto.toString(),
    ];
    lines.push(riRow.join(delimiter));
  }
  
  // Línea vacía final
  lines.push('');
  
  // Unir con saltos de línea Windows (\r\n) y agregar BOM al inicio
  return bom + lines.join(lineEnding);
}

/**
 * Escapa un valor para CSV (manejo de delimitadores, comillas, etc.)
 * @param value Valor a escapar
 * @param delimiter Delimitador usado (ej: ";" o ",")
 * @returns Valor escapado
 */
function escapeCsvValue(value: string, delimiter: string): string {
  // Si contiene delimitador, comilla doble o salto de línea, envolver en comillas
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // Escapar comillas dobles duplicándolas
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Encuentra el siguiente número de versión disponible para un CSV
 * @param basePath Ruta base del CSV (sin versión)
 * @returns Número de versión disponible
 */
async function getNextCsvVersion(basePath: string): Promise<number> {
  const dir = path.dirname(basePath);
  const fileName = path.basename(basePath, '.csv');
  
  let version = 1;
  while (await fileExists(path.join(dir, `${fileName}-v${version}.csv`))) {
    version++;
  }
  return version;
}

/**
 * Crea backup del CSV anterior si existe
 * @param csvPath Ruta del CSV actual
 * @returns Ruta del backup creado, o null si no había CSV previo
 */
async function backupPreviousCsv(csvPath: string): Promise<string | null> {
  if (!(await fileExists(csvPath))) {
    return null;
  }
  
  const dir = path.dirname(csvPath);
  const fileName = path.basename(csvPath, '.csv');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(dir, `${fileName}-backup-${timestamp}.csv`);
  
  await fs.copyFile(csvPath, backupPath);
  console.log(`[WEEKLY_CSV] 📦 Backup creado: ${path.basename(backupPath)}`);
  
  return backupPath;
}

/**
 * Exporta un reporte semanal JSON a CSV
 * V2: Con versionado automático y backups
 * @param reportJsonPath Ruta del archivo JSON del reporte semanal
 * @param csvOutputPath Ruta donde guardar el CSV (opcional, se genera automáticamente)
 * @returns Ruta del archivo CSV generado
 */
export async function exportWeeklyReportToCsv(
  reportJsonPath: string,
  csvOutputPath?: string
): Promise<string> {
  // Leer el reporte JSON
  const reporteJson = await readJsonReport<ReporteSemanalSimple>(reportJsonPath);
  
  console.log(`[WEEKLY_CSV] Exportando reporte semanal ${reporteJson.semana} a CSV...`);
  console.log(`[WEEKLY_CSV] Fecha: ${reporteJson.fecha_hora}`);
  console.log(`[WEEKLY_CSV] Proyectos: ${reporteJson.proyectos.length}`);
  
  // Convertir a estructura CSV
  const csvData = convertWeeklyJsonToCsvData(reporteJson);
  
  // Verificar advertencias sobre campos en cero
  const proyectosConCambios = csvData.proyectos.filter(p => 
    p.cp_con_cambios > 0 || p.ri_con_cambios > 0
  );
  
  if (proyectosConCambios.length > 0) {
    console.log(`[WEEKLY_CSV] ✓ Detectados cambios de estado en ${proyectosConCambios.length} proyecto(s):`);
    proyectosConCambios.forEach(p => {
      console.log(`   - ${p.nombre}: CP_con_cambios=${p.cp_con_cambios}, RI_con_cambios=${p.ri_con_cambios}`);
    });
  } else {
    console.log(`[WEEKLY_CSV] ⚠ No se detectaron cambios de estado esta semana`);
    console.log(`[WEEKLY_CSV]   (Esto es normal si no hay snapshot anterior o no hubo cambios)`);
  }
  
  // Generar contenido CSV
  const csvContent = generateCsvContent(csvData);
  
  // Determinar ruta de salida base
  const outputPath = csvOutputPath || buildWeeklyCsvPath(new Date());
  
  // Crear backup del CSV anterior si existe
  await backupPreviousCsv(outputPath);
  
  // Escribir el nuevo CSV (sobreescribiendo el anterior)
  const metadata = await writeCsvReportAtomic(outputPath, csvContent, {
    overwrite: true // Siempre sobrescribir (el backup ya se hizo)
  });
  
  console.log(`[WEEKLY_CSV] ✓ CSV generado: ${metadata.mainPath}`);
  console.log(`[WEEKLY_CSV] Tamaño: ${(metadata.size / 1024).toFixed(2)} KB`);
  console.log(`[WEEKLY_CSV] Delimitador: "${CSV_CONFIG.delimiter}" (Excel español compatible)`);
  
  return metadata.mainPath;
}

/**
 * Exporta el último reporte semanal disponible a CSV
 * @returns Ruta del archivo CSV generado
 */
export async function exportLatestWeeklyToCsv(): Promise<string> {
  const latestJsonPath = './reports/latest-weekly.json';
  return exportWeeklyReportToCsv(latestJsonPath);
}
