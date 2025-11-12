#!/usr/bin/env tsx

/**
 * Script para generar reporte JSON limpio con datos reales de Notion
 */

import { JSONGeneratorReal } from '../src/report/json-generator-real.js';

async function main() {
  try {
    const generator = new JSONGeneratorReal();
    
    // Generar reporte completo con datos reales
    const reporte = await generator.generarReporteReal();

    // Mostrar solo el JSON final
    console.log('\n📋 REPORTE JSON FINAL:');
    console.log(JSON.stringify(reporte, null, 2));

    // Estadísticas breves
    const stats = {
      fecha: reporte.fecha,
      proyectos: reporte.proyectos.length,
      total_casos: reporte.proyectos.reduce((sum, p) => sum + p.matriz_pruebas.nuevos, 0),
      total_incidencias: reporte.proyectos.reduce((sum, p) => sum + p.incidencias.nuevos, 0)
    };

    console.log(`\n✅ Completado - ${stats.proyectos} proyectos, ${stats.total_casos} casos, ${stats.total_incidencias} incidencias`);

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

main();