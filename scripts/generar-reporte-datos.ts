import dotenv from 'dotenv';
import { JSONGeneratorReal } from '../src/report/json-generator-real.js';

// Cargar variables de entorno
dotenv.config();

async function generarReporteJSON() {
  try {
    console.log('Iniciando generación de reporte JSON...');
    
    // Configurar generador
    const generador = new JSONGeneratorReal();

    // Generar reporte completo con datos reales
    const reporte = await generador.generarReporteReal();

    // Mostrar resumen en consola
    console.log('\nRESUMEN DEL REPORTE:');
    console.log(`Fecha: ${reporte.fecha}`);
    console.log(`Zona horaria: ${reporte.zona_horaria}`);
    console.log(`Proyectos procesados: ${reporte.proyectos.length}`);
    
    console.log('\nDETALLE POR PROYECTO:');
    reporte.proyectos.forEach((proyecto, index) => {
      console.log(`\n${index + 1}. ${proyecto.nombre}`);
      console.log(`   Matriz de Pruebas:`);
      console.log(`      Nuevos: ${proyecto.matriz_pruebas.nuevos}`);
      console.log(`      Total cambios: ${proyecto.matriz_pruebas.cambios.total}`);
      console.log(`      En curso: ${proyecto.matriz_pruebas.cambios.en_curso.length}`);
      console.log(`      Finalizados: ${proyecto.matriz_pruebas.cambios.finalizado.length}`);
      
      console.log(`   Incidencias:`);
      console.log(`      Nuevas: ${proyecto.incidencias.nuevos}`);
      console.log(`      Total cambios: ${proyecto.incidencias.cambios.total}`);
      console.log(`      En curso: ${proyecto.incidencias.cambios.en_curso.length}`);
      console.log(`      Resueltas: ${proyecto.incidencias.cambios.resuelto.length}`);
    });

    console.log(`\n✅ Reporte generado: ./reportes/reporte-real-${reporte.fecha}.json`);
    
    // Mostrar muestra del JSON
    console.log('\nMUESTRA DEL JSON GENERADO:');
    console.log(JSON.stringify(reporte, null, 2));

    console.log('\nReporte JSON generado exitosamente');

  } catch (error) {
    console.error('Error generando reporte:', error instanceof Error ? error.message : error);
  }
}

generarReporteJSON();