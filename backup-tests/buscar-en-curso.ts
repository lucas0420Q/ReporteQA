// import dotenv from 'dotenv';
// // import { NotionSecureClient } from './src/notion/client.js';

// // Cargar variables de entorno
// dotenv.config();

// async function buscarProyectosEnCurso() {
//   try {
//     console.log('🔍 Buscando proyectos "En curso" en toda la base de datos...');
    
//     // const client = await NotionSecureClient.getClient();
//     const dbId = process.env.NOTION_PROJECTS_DB_ID!;
    
//     let hasMore = true;
//     let nextCursor: string | undefined;
//     let allProjects: any[] = [];
    
//     // Obtener TODOS los proyectos paginando
//     while (hasMore) {
//       // const response = await client.databases.query({
//         database_id: dbId,
//         page_size: 100,
//         start_cursor: nextCursor,
//       });
      
//       allProjects.push(...response.results);
//       hasMore = response.has_more;
//       nextCursor = response.next_cursor || undefined;
//     }
    
//     console.log(`📊 Analizando ${allProjects.length} proyectos totales...`);
    
//     const statusCount = new Map<string, {count: number, examples: string[]}>();
//     const proyectosEnCurso: any[] = [];
    
//     allProjects.forEach((page: any, index: number) => {
//       const statusProp = page.properties['Status'];
      
//       // Buscar título para identificar el proyecto
//       const titleProp = Object.entries(page.properties).find(([key, prop]: [string, any]) => 
//         prop.type === 'title'
//       );
//       const title = titleProp ? (titleProp[1] as any).title?.[0]?.plain_text || 'Sin título' : 'Sin título';
      
//       let statusValue = 'Sin estado';
      
//       if (statusProp && statusProp.status) {
//         statusValue = statusProp.status.name || 'Sin nombre';
//       }
      
//       // Contar estados
//       if (!statusCount.has(statusValue)) {
//         statusCount.set(statusValue, {count: 0, examples: []});
//       }
//       const statusData = statusCount.get(statusValue)!;
//       statusData.count++;
//       if (statusData.examples.length < 3) {
//         statusData.examples.push(title);
//       }
      
//       // Buscar proyectos "En curso"
//       if (statusValue.toLowerCase().includes('curso') || 
//           statusValue.toLowerCase().includes('progress') ||
//           statusValue.toLowerCase().includes('en curso') ||
//           statusValue === 'En curso') {
//         proyectosEnCurso.push({title, status: statusValue, id: page.id});
//       }
//     });
    
//     console.log('\n📈 Distribución de TODOS los estados:');
//     Array.from(statusCount.entries())
//       .sort(([,a], [,b]) => b.count - a.count)
//       .forEach(([estado, data]) => {
//         console.log(`  "${estado}": ${data.count} proyectos`);
//         console.log(`    Ejemplos: ${data.examples.join(', ')}`);
//       });
    
//     console.log(`\n🎯 Proyectos encontrados "En curso": ${proyectosEnCurso.length}`);
//     if (proyectosEnCurso.length > 0) {
//       console.log('📋 Lista de proyectos "En curso":');
//       proyectosEnCurso.forEach((proyecto, index) => {
//         console.log(`  ${index + 1}. "${proyecto.title}" - Status: "${proyecto.status}"`);
//       });
//     }
    
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// buscarProyectosEnCurso();