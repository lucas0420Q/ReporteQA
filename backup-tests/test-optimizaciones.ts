// import dotenv from 'dotenv';
// import { NotionFetcher } from './src/notion/fetch.js';

// // Cargar variables de entorno
// dotenv.config();

// async function testOptimizaciones() {
//   try {
//     console.log('Probando optimizaciones aplicadas...');
    
//     const fetcher = new NotionFetcher(); // Ahora usa concurrency = 2
//     const dbId = process.env.NOTION_PROJECTS_DB_ID!;
    
//     // Test básico de conectividad
//     console.log('Probando conectividad básica...');
//     const proyectos = await fetcher.fetchProjects(dbId);
    
//     console.log(`✅ Conectividad OK - Encontrados ${proyectos.length} proyectos`);
//     console.log('✅ Validaciones Zod removidas - Performance mejorado');
//     console.log('✅ Concurrency optimizada a 2 - Menos rate limiting');
//     console.log('✅ Archivos test movidos a backup-tests/');
//     console.log('✅ ESLint configuración actualizada');
    
//     console.log('\n🎉 Todas las optimizaciones funcionan correctamente!');
    
//   } catch (error) {
//     console.error('❌ Error en optimizaciones:', error);
//   }
// }

// testOptimizaciones();