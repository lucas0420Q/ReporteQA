// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testChildDatabases() {
//   try {
//     console.log('🔍 Probando acceso a bases de datos hijo...');
    
//     const fetcher = new NotionFetcher();
//     const projects = await fetcher.fetchProjects(process.env.NOTION_PROJECTS_DB_ID!);
    
//     if (projects.length === 0) {
//       console.log('❌ No se encontraron proyectos');
//       return;
//     }
    
//     // Tomar el primer proyecto que tenga nombre interesante
//     const proyecto = projects.find(p => 
//       p.name.toLowerCase().includes('helpcenter') || 
//       p.name.toLowerCase().includes('test') ||
//       p.name.toLowerCase().includes('qa')
//     ) || projects[0];
    
//     console.log(`📁 Probando proyecto: ${proyecto.name} (ID: ${proyecto.id})`);
    
//     // Buscar bases de datos hijo
//     const matrizDbName = process.env.MATRIZ_DB_NAME || 'Matriz de Pruebas';
//     const incidenciasDbName = process.env.INCIDENCIAS_DB_NAME || 'Reporte de incidencias';
    
//     console.log(`🔍 Buscando bases de datos hijo: "${matrizDbName}" y "${incidenciasDbName}"`);
    
//     const childDatabases = await fetcher.fetchChildDatabases(
//       proyecto.id,
//       [matrizDbName, incidenciasDbName]
//     );
    
//     console.log(`✅ Encontradas ${childDatabases.length} bases de datos hijo:`);
//     childDatabases.forEach((db, index) => {
//       console.log(`  ${index + 1}. ${db.name} (ID: ${db.id})`);
//     });
    
//     // Si encontramos bases de datos, intentar obtener algunos items
//     for (const db of childDatabases) {
//       console.log(`\n🔍 Obteniendo items de "${db.name}"...`);
      
//       const type = db.name.toLowerCase().includes('matriz') ? 'CASO' : 'INCIDENCIA';
//       const items = await fetcher.fetchMinimalItems(db.id, type);
      
//       console.log(`✅ Encontrados ${items.length} items de tipo ${type}`);
//       if (items.length > 0) {
//         console.log('📋 Primeros 3 items:');
//         items.slice(0, 3).forEach((item, i) => {
//           console.log(`  ${i + 1}. ${item.title} - ${item.status} (${item.id})`);
//         });
//       }
//     }
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// testChildDatabases();