#!/usr/bin/env node

import { Command } from 'commander';
import { NotionSecureClient } from './notion/client.js';
import { JSONGeneratorReal } from './report/json-generator-real.js';
import { JSONGeneratorDailySimple } from './report/json-generator-daily-simple.js';
import { JSONGeneratorWeeklySimple } from './report/json-generator-weekly-simple.js';
import { ConfigurationError } from './domain/types.js';
import { exportWeeklyReportToCsv, exportLatestWeeklyToCsv } from './report/csv-exporter-weekly.js';
import { listDailyReports, listWeeklyReports } from './utils/fs-reports.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Aplicación principal del generador de reportes QA
 */
class ReportRunner {
  private jsonGenerator: JSONGeneratorReal;
  private dailyGenerator: JSONGeneratorDailySimple;
  private weeklyGenerator: JSONGeneratorWeeklySimple;

  constructor() {
    this.jsonGenerator = new JSONGeneratorReal();
    this.dailyGenerator = new JSONGeneratorDailySimple();
    this.weeklyGenerator = new JSONGeneratorWeeklySimple();
  }

  /**
   * Ejecuta el proceso completo de generación de reportes JSON
   */
  public async generateJSONReport(options: {
    skipValidation?: boolean;
  } = {}): Promise<void> {
    console.info('>> Iniciando generación de reportes QA JSON...');

    try {
      // Validar token de Notion
      if (!options.skipValidation) {
        const isValid = await NotionSecureClient.validateToken();
        if (!isValid) {
          throw new ConfigurationError('Token de Notion inválido');
        }
        console.info('   Token de Notion validado');
      }

      // Generar reporte JSON
      const reporte = await this.jsonGenerator.generarReporteReal();
      
      console.info('>> REPORTE GENERADO EXITOSAMENTE');
      console.info('='.repeat(40));
      console.info(`   Fecha: ${reporte.fecha}`);
      console.info(`   Proyectos: ${reporte.proyectos.length}`);
      
      const totalCasos = reporte.proyectos.reduce((sum, p) => sum + p.matriz_pruebas.nuevos, 0);
      const totalIncidencias = reporte.proyectos.reduce((sum, p) => sum + p.incidencias.nuevos, 0);
      
      console.info(`   Casos de Prueba: ${totalCasos}`);
      console.info(`   Incidencias: ${totalIncidencias}`);
      console.info(`   Archivo JSON: reportes/reporte-real-${reporte.fecha}.json`);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('   [ERROR] Error de configuración:', error.message);
        process.exit(1);
      }
      
      console.error('   [ERROR] Error inesperado:', error);
      process.exit(1);
    }
  }

  /**
   * Genera reporte diario simplificado (solo cambios ordenados por ID)
   */
  public async generateDailyReport(options: {
    skipValidation?: boolean;
  } = {}): Promise<void> {
    console.info('>> Iniciando generacion de reporte DIARIO...');

    try {
      // Validar token de Notion
      if (!options.skipValidation) {
        const isValid = await NotionSecureClient.validateToken();
        if (!isValid) {
          throw new ConfigurationError('Token de Notion invalido');
        }
        console.info('   Token validado\n');
      }

      // Generar reporte
      const reporte = await this.dailyGenerator.generarReporteDiario();
      
      console.info('\n>> REPORTE DIARIO COMPLETADO');
      console.info(`   Fecha/Hora: ${reporte.fecha_hora}`);
      console.info(`   Proyectos: ${reporte.proyectos.length}`);
      
      const totalCambios = reporte.proyectos.reduce(
        (sum, p) => sum + p.matriz_pruebas.cambios.length + p.incidencias.cambios.length, 
        0
      );
      console.info(`   Total items: ${totalCambios}`);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('   [ERROR] Error de configuracion:', error.message);
        process.exit(1);
      }
      
      console.error('   [ERROR] Error inesperado:', error);
      process.exit(1);
    }
  }

  /**
   * Genera reporte semanal simplificado (solo 4 métricas clave)
   */
  public async generateWeeklyReport(options: {
    skipValidation?: boolean;
  } = {}): Promise<void> {
    console.info('>> Iniciando generacion de reporte SEMANAL...');

    try {
      // Validar token de Notion
      if (!options.skipValidation) {
        const isValid = await NotionSecureClient.validateToken();
        if (!isValid) {
          throw new ConfigurationError('Token de Notion invalido');
        }
        console.info('   Token validado\n');
      }

      // Generar reporte
      const reporte = await this.weeklyGenerator.generarReporteSemanal();
      
      console.info('\n>> REPORTE SEMANAL COMPLETADO');
      console.info(`   Semana: ${reporte.semana}`);
      console.info(`   Proyectos: ${reporte.proyectos.length}`);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('   [ERROR] Error de configuracion:', error.message);
        process.exit(1);
      }
      
      console.error('   [ERROR] Error inesperado:', error);
      process.exit(1);
    }
  }
}

/**
 * CLI Principal
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('reporte-qa')
    .description('Generador de reportes QA desde Notion API')
    .version('3.1.0');

  program
    .command('generate')
    .description('Genera el reporte JSON con todas las mejoras implementadas')
    .option('--skip-validation', 'Omite validación de token')
    .action(async (options: { skipValidation?: boolean }) => {
      const runner = new ReportRunner();
      await runner.generateJSONReport({
        skipValidation: options.skipValidation,
      });
    });

  program
    .command('generate:daily')
    .description('Genera reporte diario simplificado (solo cambios ordenados por ID)')
    .option('--skip-validation', 'Omite validación de token')
    .action(async (options: { skipValidation?: boolean }) => {
      const runner = new ReportRunner();
      await runner.generateDailyReport({
        skipValidation: options.skipValidation,
      });
    });

  program
    .command('generate:weekly')
    .description('Genera reporte semanal simplificado (4 métricas clave)')
    .option('--skip-validation', 'Omite validación de token')
    .action(async (options: { skipValidation?: boolean }) => {
      const runner = new ReportRunner();
      await runner.generateWeeklyReport({
        skipValidation: options.skipValidation,
      });
    });

  // ========================================
  // COMANDOS DE CSV
  // ========================================

  program
    .command('export:weekly-csv')
    .description('Exporta el último reporte semanal a formato CSV')
    .action(async () => {
      console.info('>> Exportando reporte semanal a CSV...\n');
      
      try {
        const csvPath = await exportLatestWeeklyToCsv();
        console.info('\n>> CSV GENERADO EXITOSAMENTE');
        console.info(`   Archivo: ${csvPath}`);
      } catch (error) {
        console.error(
          '   [ERROR] Error al exportar CSV:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  program
    .command('export:weekly-csv-custom')
    .description('Exporta un reporte semanal específico a CSV')
    .requiredOption('--json <path>', 'Ruta del archivo JSON del reporte semanal')
    .option('--output <path>', 'Ruta de salida del CSV (opcional)')
    .action(async (options: { json: string; output?: string }) => {
      console.info('>> Exportando reporte semanal personalizado a CSV...\n');
      
      try {
        const csvPath = await exportWeeklyReportToCsv(options.json, options.output);
        console.info('\n>> CSV GENERADO EXITOSAMENTE');
        console.info(`   Archivo: ${csvPath}`);
      } catch (error) {
        console.error(
          '   [ERROR] Error al exportar CSV:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  // ========================================
  // COMANDOS DE LISTADO DE REPORTES
  // ========================================

  program
    .command('list:daily')
    .description('Lista todos los reportes diarios disponibles')
    .action(async () => {
      console.info('>> Reportes Diarios Disponibles\n');
      
      try {
        const reportes = await listDailyReports();
        
        if (reportes.length === 0) {
          console.info('   No se encontraron reportes diarios');
        } else {
          console.info(`   Total: ${reportes.length} reportes\n`);
          reportes.forEach((ruta, idx) => {
            console.info(`   ${idx + 1}. ${ruta}`);
          });
        }
      } catch (error) {
        console.error(
          '   [ERROR] Error al listar reportes:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  program
    .command('list:weekly')
    .description('Lista todos los reportes semanales disponibles')
    .action(async () => {
      console.info('>> Reportes Semanales Disponibles\n');
      
      try {
        const reportes = await listWeeklyReports();
        
        if (reportes.length === 0) {
          console.info('   No se encontraron reportes semanales');
        } else {
          console.info(`   Total: ${reportes.length} reportes\n`);
          reportes.forEach((ruta, idx) => {
            console.info(`   ${idx + 1}. ${ruta}`);
          });
        }
      } catch (error) {
        console.error(
          '   [ERROR] Error al listar reportes:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  program
    .command('validate')
    .description('Valida la configuración y conexión a Notion')
    .action(async () => {
      try {
        console.info('>> Validando configuración...');
        
        const isValid = await NotionSecureClient.validateToken();
        
        if (isValid) {
          const workspaceInfo = await NotionSecureClient.getWorkspaceInfo();
          console.info('   Configuración válida');
          console.info(`   Workspace: ${workspaceInfo.workspaceId}`);
          console.info(`   Bot ID: ${workspaceInfo.botId}`);
        } else {
          console.error('   [ERROR] Token de Notion inválido');
          process.exit(1);
        }
      } catch (error) {
        console.error(
          '   [ERROR] Error en validación:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Ejecutar si es el módulo principal
main().catch(error => {
  console.error(
    '   [ERROR] Error fatal:',
    error instanceof Error ? error.message : 'Error desconocido'
  );
  process.exit(1);
});

export { ReportRunner };