#!/usr/bin/env tsx

/**
 * @fileoverview Script principal del Generador de Reportes QA
 * @description Punto de entrada único para la generación de reportes gerenciales desde Notion
 * @version 2.0.0
 * @author Lucas Zaracho
 */

import { config } from 'dotenv';
import { JSONGeneratorReal } from './src/report/json-generator-real';
import { GeneradorTxtParaGerente } from './src/report/txt-generator';

// Cargar configuración del entorno
config();

interface ScriptConfig {
  readonly outputFormat: 'json' | 'txt' | 'completo';
  readonly verbose: boolean;
  readonly outputDir?: string;
}

/**
 * Clase principal para la gestión de reportes QA
 */
class ReporteQAManager {
  private readonly config: ScriptConfig;

  constructor(config: Partial<ScriptConfig> = {}) {
    this.config = {
      outputFormat: 'completo',
      verbose: true,
      ...config
    };
  }

  /**
   * Genera el reporte completo (JSON + TXT)
   */
  async generarReporteCompleto(): Promise<{ jsonFile: string; txtDir: string; stats: any }> {
    console.log('🚀 GENERADOR DE REPORTES QA - v2.0');
    console.log('═════════════════════════════════════');

    try {
      // 1. Generación de datos JSON
      if (this.config.verbose) {
        console.log('📊 Extrayendo datos desde Notion API...');
      }
      
      const generatorJson = new JSONGeneratorReal();
      const reporteJson = await generatorJson.generarReporteReal();
      
      // Calcular estadísticas
      const stats = this.calcularEstadisticas(reporteJson);
      
      if (this.config.verbose) {
        console.log(`✅ Datos procesados: ${stats.totalItems} items de ${stats.proyectos} proyectos`);
      }

      // 2. Generación de archivos gerenciales
      if (this.config.outputFormat === 'txt' || this.config.outputFormat === 'completo') {
        if (this.config.verbose) {
          console.log('📋 Generando archivos para gerencia...');
        }
        
        const generatorTxt = new GeneradorTxtParaGerente();
        const txtDir = await generatorTxt.generarReporteTxt();
        
        if (this.config.verbose) {
          console.log(`✅ Archivos gerenciales creados en: ${txtDir}`);
        }

        return {
          jsonFile: `reportes/reporte-real-${reporteJson.fecha}.json`,
          txtDir,
          stats
        };
      }

      return {
        jsonFile: `reportes/reporte-real-${reporteJson.fecha}.json`,
        txtDir: '',
        stats
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error generando reporte:', errorMessage);
      throw error;
    }
  }

  /**
   * Calcula estadísticas del reporte
   */
  private calcularEstadisticas(reporte: any): any {
    const proyectos = reporte.proyectos.length;
    const totalCasos = reporte.proyectos.reduce((sum: number, p: any) => sum + p.matriz_pruebas.nuevos, 0);
    const totalIncidencias = reporte.proyectos.reduce((sum: number, p: any) => sum + p.incidencias.nuevos, 0);
    
    return {
      proyectos,
      totalCasos,
      totalIncidencias,
      totalItems: totalCasos + totalIncidencias,
      fecha: reporte.fecha
    };
  }

  /**
   * Muestra el resumen final
   */
  mostrarResumen(result: { jsonFile: string; txtDir: string; stats: any }): void {
    console.log('\n🎯 REPORTE GENERADO EXITOSAMENTE');
    console.log('═══════════════════════════════════');
    console.log(`📅 Fecha: ${result.stats.fecha}`);
    console.log(`📊 Proyectos: ${result.stats.proyectos}`);
    console.log(`🧪 Casos de Prueba: ${result.stats.totalCasos}`);
    console.log(`🐛 Incidencias: ${result.stats.totalIncidencias}`);
    console.log(`📄 Archivo JSON: ${result.jsonFile}`);
    
    if (result.txtDir) {
      console.log(`📁 Archivos TXT: ${result.txtDir}`);
      console.log('\n📋 Para el gerente:');
      console.log('• 00-RESUMEN-EJECUTIVO.txt');
      console.log('• 01-DETALLE-PROYECTOS.txt');
      console.log('• proyectos-individuales/*.txt');
    }
    
    console.log('\n✅ ¡Entregable listo! 🎉');
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('🔧 Iniciando Generador de Reportes QA...');
  console.log('📍 Directorio de trabajo:', process.cwd());
  
  try {
    const manager = new ReporteQAManager({
      outputFormat: 'completo',
      verbose: true
    });

    const resultado = await manager.generarReporteCompleto();
    manager.mostrarResumen(resultado);

    process.exit(0);
  } catch (error) {
    console.error('💥 Fallo crítico:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/') || '') || 
    process.argv[1]?.endsWith('main.ts')) {
  main().catch(console.error);
}

export { ReporteQAManager };