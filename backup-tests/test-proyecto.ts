// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testSingleProject() {
//   try {
//     console.log('🔍 Probando acceso a un proyecto específico...');
    
//     const fetcher = new NotionFetcher();
//     const projects = await fetcher.fetchProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     if (projects.length === 0) {
//       console.log('❌ No se encontraron proyectos');
//       return;
//     }
    
//     // Tomar el primer proyecto
//     const proyecto = projects[0];
//     console.log(`📁 Probando proyecto: ${proyecto.name} (ID: ${proyecto.id})`);
    
//     // Intentar obtener bases de datos hijo
//     console.log('🔍 Buscando bases de datos "Matriz de Pruebas" e "Reporte de incidencias"...');
    
//     const matrizDbName = process.env.MATRIZ_DB_NAME || 'Matriz de Pruebas';
//     const incidenciasDbName = process.env.INCIDENCIAS_DB_NAME || 'Reporte de incidencias';
    
//     console.log(`Buscando: "${matrizDbName}" y "${incidenciasDbName}"`);
    
//     // TODO: Aquí necesitamos implementar la lógica para buscar bases de datos hijo
//     // Por ahora solo verificamos que podemos acceder al proyecto
    
//     console.log('✅ Acceso al proyecto exitoso');
//     console.log('⚠️ Próximo paso: implementar búsqueda de bases de datos hijo');
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// testSingleProject();