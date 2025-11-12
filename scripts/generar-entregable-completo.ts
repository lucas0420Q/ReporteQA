#!/usr/bin/env tsx

/**
 * Script principal para generar el ENTREGABLE COMPLETO para el gerente
 * Genera JSON + TXT organizados en carpetas
 */

import { config } from 'dotenv';
import { JSONGeneratorReal } from '../src/report/json-generator-real.js';
import { GeneradorTxtParaGerente } from '../src/report/txt-generator.js';

// Cargar variables de entorno
config();

async function main() {
  try {
    console.log('🚀 GENERANDO ENTREGABLE COMPLETO PARA GERENCIA');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Generar JSON con datos reales
    console.log('📊 Paso 1: Generando datos JSON desde Notion...');
    const generatorJson = new JSONGeneratorReal();
    const reporteJson = await generatorJson.generarReporteReal();
    
    const statsJson = {
      proyectos: reporteJson.proyectos.length,
      totalCasos: reporteJson.proyectos.reduce((sum, p) => sum + p.matriz_pruebas.nuevos, 0),
      totalIncidencias: reporteJson.proyectos.reduce((sum, p) => sum + p.incidencias.nuevos, 0)
    };
    
    console.log(`   ✅ JSON generado: ${statsJson.proyectos} proyectos, ${statsJson.totalCasos} casos, ${statsJson.totalIncidencias} incidencias\n`);

    // 2. Generar archivos TXT organizados
    console.log('📋 Paso 2: Generando archivos TXT para gerencia...');
    const generatorTxt = new GeneradorTxtParaGerente();
    const dirTxt = await generatorTxt.generarReporteTxt();
    
    console.log(`   ✅ Archivos TXT generados en: ${dirTxt}\n`);

    // 3. Resumen final
    console.log('🎯 ENTREGABLE COMPLETADO');
    console.log('═════════════════════════');
    console.log(`📅 Fecha: ${reporteJson.fecha}`);
    console.log(`📊 Datos: ${statsJson.totalCasos + statsJson.totalIncidencias} items procesados`);
    console.log(`📁 Archivos JSON: ./reportes/`);
    console.log(`📁 Archivos TXT: ${dirTxt}`);
    
    console.log('\n📋 CONTENIDO DEL ENTREGABLE:');
    console.log('──────────────────────────────');
    console.log('• 00-RESUMEN-EJECUTIVO.txt    ← Para el gerente');
    console.log('• 01-DETALLE-PROYECTOS.txt    ← Vista general');
    console.log('• proyectos-individuales/     ← Detalle por proyecto');
    console.log('• reporte-real-YYYY-MM-DD.json ← Datos técnicos');
    
    console.log('\n✅ LISTO PARA ENTREGAR AL GERENTE 🎉');

  } catch (error) {
    console.error('❌ Error generando entregable:', (error as Error).message);
    process.exit(1);
  }
}

main();