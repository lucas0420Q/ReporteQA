// import dotenv from 'dotenv';
// import { NotionSecureClient } from './src/notion/client.js';

// // Cargar variables de entorno
// dotenv.config();

// async function debugValidation() {
//   try {
//     console.log('🔍 Iniciando debug de validación...');
//     console.log('NOTION_TOKEN existe:', !!process.env.NOTION_TOKEN);
//     console.log('NOTION_TOKEN starts with ntn_:', process.env.NOTION_TOKEN?.startsWith('ntn_'));
    
//     console.log('🔧 Probando validateToken...');
//     const isValid = await NotionSecureClient.validateToken();
//     console.log('✅ validateToken resultado:', isValid);
    
//     if (isValid) {
//       console.log('🔧 Probando getWorkspaceInfo...');
//       const workspaceInfo = await NotionSecureClient.getWorkspaceInfo();
//       console.log('✅ Workspace Info:', workspaceInfo);
//     }
//   } catch (error) {
//     console.error('💥 Error:', error);
//   }
// }

// debugValidation();