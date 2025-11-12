#!/usr/bin/env node

import { Command } from 'commander';
import { NotionSecureClient } from './notion/client.js';
import { JSONGeneratorReal } from './report/json-generator-real.js';
import { ConfigurationError } from './domain/types.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Aplicación principal del generador de reportes QA
 */
class ReportRunner {
  private jsonGenerator: JSONGeneratorReal;

  constructor() {
    this.jsonGenerator = new JSONGeneratorReal();
  }

  /**
   * Ejecuta el proceso completo de generación de reportes JSON
   */
  public async generateJSONReport(options: {
    skipValidation?: boolean;
  } = {}): Promise<void> {
    console.info('🚀 Iniciando generación de reportes QA JSON...');

    try {
      // Validar token de Notion
      if (!options.skipValidation) {
        const isValid = await NotionSecureClient.validateToken();
        if (!isValid) {
          throw new ConfigurationError('Token de Notion inválido');
        }
        console.info('✅ Token de Notion validado');
      }

      // Generar reporte JSON
      const reporte = await this.jsonGenerator.generarReporteReal();
      
      console.info('🎯 REPORTE GENERADO EXITOSAMENTE');
      console.info('═'.repeat(40));
      console.info(`📅 Fecha: ${reporte.fecha}`);
      console.info(`📊 Proyectos: ${reporte.proyectos.length}`);
      
      const totalCasos = reporte.proyectos.reduce((sum, p) => sum + p.matriz_pruebas.nuevos, 0);
      const totalIncidencias = reporte.proyectos.reduce((sum, p) => sum + p.incidencias.nuevos, 0);
      
      console.info(`🧪 Casos de Prueba: ${totalCasos}`);
      console.info(`🐛 Incidencias: ${totalIncidencias}`);
      console.info(`📄 Archivo JSON: reportes/reporte-real-${reporte.fecha}.json`);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('❌ Error de configuración:', error.message);
        process.exit(1);
      }
      
      console.error('❌ Error inesperado:', error);
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
    .version('1.0.0');

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
    .command('validate')
    .description('Valida la configuración y conexión a Notion')
    .action(async () => {
      try {
        console.info('🔍 Validando configuración...');
        
        const isValid = await NotionSecureClient.validateToken();
        
        if (isValid) {
          const workspaceInfo = await NotionSecureClient.getWorkspaceInfo();
          console.info('✅ Configuración válida');
          console.info(`📝 Workspace: ${workspaceInfo.workspaceId}`);
          console.info(`🤖 Bot ID: ${workspaceInfo.botId}`);
        } else {
          console.error('❌ Token de Notion inválido');
          process.exit(1);
        }
      } catch (error) {
        console.error(
          '💥 Error en validación:',
          error instanceof Error ? error.message : 'Error desconocido'
        );
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Ejecutar si es el módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(
      '💥 Error fatal:',
      error instanceof Error ? error.message : 'Error desconocido'
    );
    process.exit(1);
  });
}

export { ReportRunner };