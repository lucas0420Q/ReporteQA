// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function exploreProjects() {
//   try {
//     console.log('🔍 Explorando proyectos para encontrar bases de datos hijo...');
    
//     const fetcher = new NotionFetcher();
//     const projects = await fetcher.fetchProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     console.log(`📁 Explorando primeros 5 proyectos de ${projects.length} totales:\n`);
    
//     for (let i = 0; i < Math.min(5, projects.length); i++) {
//       const proyecto = projects[i];
//       console.log(`${i + 1}. Proyecto: ${proyecto.name}`);
//       console.log(`   ID: ${proyecto.id}`);
      
//       try {
//         // Buscar CUALQUIER base de datos hijo (sin filtrar por nombre)
//         const childDatabases = await fetcher.fetchChildDatabases(proyecto.id, []);
        
//         if (childDatabases.length > 0) {
//           console.log(`   ✅ Bases de datos hijo encontradas: ${childDatabases.length}`);
//           childDatabases.forEach((db, dbIndex) => {
//             console.log(`      - ${db.name} (ID: ${db.id.substring(0, 8)}...)`);
//           });
//         } else {
//           console.log(`   ❌ Sin bases de datos hijo`);
//         }
//       } catch (error) {
//         console.log(`   💥 Error accediendo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
//       }
      
//       console.log(''); // línea en blanco
//     }
    
//   } catch (error) {
//     console.error('💥 Error general:', error);
//   }
// }

// exploreProjects();