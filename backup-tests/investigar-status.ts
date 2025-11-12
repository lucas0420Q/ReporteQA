// import dotenv from 'dotenv';
// import { NotionSecureClient } from './src/notion/client.js';

// // Cargar variables de entorno
// dotenv.config();

// async function investigarCampoStatus() {
//   try {
//     console.log('🔍 Investigando el campo Status (tipo: status)...');
    
//     const client = await NotionSecureClient.getClient();
//     const dbId = process.env.NOTION_PROJECTS_DB_ID!;
    
//     const response = await client.databases.query({
//       database_id: dbId,
//       page_size: 15,
//     });
    
//     console.log(`\n📊 Valores del campo Status en ${response.results.length} proyectos:`);
    
//     const statusCount = new Map<string, number>();
    
//     response.results.forEach((page: any, index: number) => {
//       const statusProp = page.properties['Status'];
      
//       // Buscar título para identificar el proyecto
//       const titleProp = Object.entries(page.properties).find(([key, prop]: [string, any]) => 
//         prop.type === 'title'
//       );
//       const title = titleProp ? (titleProp[1] as any).title?.[0]?.plain_text || 'Sin título' : 'Sin título';
      
//       if (statusProp) {
//         let statusValue = 'Sin estado';
        
//         // El campo Status puede tener diferentes estructuras
//         if (statusProp.status) {
//           statusValue = statusProp.status.name || statusProp.status.id || 'Sin nombre';
//         } else if (statusProp.select) {
//           statusValue = statusProp.select.name || 'Sin nombre';
//         }
        
//         console.log(`${index + 1}. "${title}" -> Status: "${statusValue}"`);
        
//         // Contar estados
//         const count = statusCount.get(statusValue) || 0;
//         statusCount.set(statusValue, count + 1);
        
//         // Mostrar estructura completa del primer proyecto para debug
//         if (index === 0) {
//           console.log(`   Estructura completa del Status:`, JSON.stringify(statusProp, null, 2));
//         }
//       } else {
//         console.log(`${index + 1}. "${title}" -> Sin campo Status`);
//       }
//     });
    
//     console.log('\n📈 Resumen de estados encontrados:');
//     Array.from(statusCount.entries())
//       .sort(([,a], [,b]) => b - a)
//       .forEach(([estado, count]) => {
//         console.log(`  "${estado}": ${count} proyectos`);
//       });
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// investigarCampoStatus();