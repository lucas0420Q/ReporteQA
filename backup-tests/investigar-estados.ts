// import dotenv from 'dotenv';
// import { NotionSecureClient } from './src/notion/client.js';

// // Cargar variables de entorno
// dotenv.config();

// async function investigarEstadosReales() {
//   try {
//     console.log('🔍 Investigando los estados reales de los proyectos...');
    
//     const client = await NotionSecureClient.getClient();
//     const dbId = process.env.NOTION_PROJECTS_DB_ID!;
    
//     const response = await client.databases.query({
//       database_id: dbId,
//       page_size: 10, // Solo primeros 10 para investigar
//     });
    
//     console.log(`\n📊 Analizando primeros ${response.results.length} proyectos:`);
    
//     response.results.forEach((page: any, index: number) => {
//       console.log(`\n${index + 1}. Proyecto ID: ${page.id.substring(0, 8)}...`);
      
//       // Buscar título
//       const titleProp = Object.entries(page.properties).find(([key, prop]: [string, any]) => 
//         prop.type === 'title'
//       );
//       const title = titleProp ? (titleProp[1] as any).title?.[0]?.plain_text || 'Sin título' : 'Sin título';
//       console.log(`   Título: ${title}`);
      
//       // Mostrar TODAS las propiedades para ver qué campos existen
//       console.log('   Propiedades disponibles:');
//       Object.entries(page.properties).forEach(([key, prop]: [string, any]) => {
//         console.log(`     - ${key}: ${prop.type}`);
        
//         // Si es select o multi_select, mostrar el valor
//         if (prop.type === 'select' && prop.select) {
//           console.log(`       Valor: "${prop.select.name}"`);
//         } else if (prop.type === 'multi_select' && prop.multi_select) {
//           const values = prop.multi_select.map((s: any) => s.name).join(', ');
//           console.log(`       Valores: [${values}]`);
//         }
//       });
//     });
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// investigarEstadosReales();