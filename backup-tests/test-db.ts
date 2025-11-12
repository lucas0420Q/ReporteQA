// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testProjectsDatabase() {
//   try {
//     console.log('🔍 Probando lectura de base de datos de proyectos...');
//     console.log('DB ID:', process.env.NOTION_PROJECTS_DB_ID);
    
//     const fetcher = new NotionFetcher();
//     const projects = await fetcher.fetchProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     console.log('✅ Proyectos encontrados:', projects.length);
//     projects.forEach((project, index) => {
//       console.log(`📁 Proyecto ${index + 1}:`, {
//         id: project.id,
//         nombre: project.name
//       });
//     });
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// testProjectsDatabase();