// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testProyectosEnCurso() {
//   try {
//     console.log('Probando filtro de proyectos "En curso"...');
    
//     const fetcher = new NotionFetcher();
//     const dbId = process.env.NOTION_PROJECTS_DB_ID!;
    
//     // Obtener todos los proyectos
//     console.log('Obteniendo TODOS los proyectos...');
//     const todosProyectos = await fetcher.fetchProjects(dbId);
    
//     // Obtener solo proyectos en curso
//     const proyectosEnCurso = await fetcher.fetchProyectosEnCurso(dbId);
    
//     // Mostrar resumen
//     console.log('\nRESUMEN:');
//     console.log(`Total de proyectos: ${todosProyectos.length}`);
//     console.log(`Proyectos "En curso": ${proyectosEnCurso.length}`);
//     console.log(`Porcentaje activo: ${((proyectosEnCurso.length / todosProyectos.length) * 100).toFixed(1)}%`);
    
//     // Mostrar distribución de estados
//     const estadisticas = new Map<string, number>();
//     todosProyectos.forEach(proyecto => {
//       const count = estadisticas.get(proyecto.status) || 0;
//       estadisticas.set(proyecto.status, count + 1);
//     });
    
//     console.log('\nDistribución de estados:');
//     Array.from(estadisticas.entries())
//       .sort(([,a], [,b]) => b - a)
//       .forEach(([estado, count]) => {
//         const porcentaje = ((count / todosProyectos.length) * 100).toFixed(1);
//         console.log(`  ${estado}: ${count} (${porcentaje}%)`);
//       });
    
//     // Mostrar todos los proyectos en curso
//     if (proyectosEnCurso.length > 0) {
//       console.log(`\nProyectos "En curso" (${proyectosEnCurso.length}):`);
//       proyectosEnCurso.forEach((proyecto, index) => {
//         console.log(`  ${index + 1}. ${proyecto.name} (ID: ${proyecto.id.substring(0, 8)}...)`);
//       });
//     }
    
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// testProyectosEnCurso();