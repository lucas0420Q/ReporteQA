// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testActiveProjects() {
//   try {
//     console.log('🔍 Probando filtro de proyectos "En Curso"...');
    
//     const fetcher = new NotionFetcher();
    
//     // Obtener TODOS los proyectos primero
//     console.log('\n📋 Obteniendo TODOS los proyectos:');
//     const allProjects = await fetcher.fetchProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     console.log(`\n📊 Resumen de todos los proyectos (${allProjects.length} totales):`);
//     const statusCounts = allProjects.reduce((acc, project) => {
//       acc[project.status] = (acc[project.status] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);
    
//     Object.entries(statusCounts).forEach(([status, count]) => {
//       console.log(`   ${status}: ${count} proyectos`);
//     });
    
//     // Obtener solo proyectos EN CURSO
//     console.log('\n🎯 Obteniendo proyectos "En Curso":');
//     const activeProjects = await fetcher.fetchActiveProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     if (activeProjects.length > 0) {
//       console.log(`\n✅ Proyectos "En Curso" encontrados: ${activeProjects.length}`);
//       activeProjects.forEach((project, index) => {
//         console.log(`   ${index + 1}. ${project.name} - ${project.status}`);
//       });
//     } else {
//       console.log('\n⚠️ No se encontraron proyectos "En Curso"');
//       console.log('\nℹ️ Esto puede significar:');
//       console.log('   - Los proyectos no tienen el campo de estado');
//       console.log('   - El estado se llama diferente (ej: "En curso", "Active", etc.)');
//       console.log('   - Todos los proyectos están en otros estados');
//     }
    
//     // Mostrar algunos ejemplos de estados encontrados
//     if (allProjects.length > 0) {
//       console.log('\n📋 Primeros 5 proyectos con sus estados:');
//       allProjects.slice(0, 5).forEach((project, index) => {
//         console.log(`   ${index + 1}. "${project.name}" - Estado: "${project.status}"`);
//       });
//     }
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// testActiveProjects();