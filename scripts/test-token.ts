import dotenv from 'dotenv';
import { NotionSecureClient } from '../src/notion/client.js';

// Cargar variables de entorno
dotenv.config();

async function testToken() {
  try {
    console.log('🔍 Probando lectura de token...');
    
    // Solo test de que el método existe y el token se puede leer
    const testResult = await NotionSecureClient.validateToken();
    
    if (testResult) {
      console.log('✅ Token obtenido y validado correctamente');
      console.log('📍 El token se leyó desde el archivo token.txt o variable de entorno');
    } else {
      console.log('⚠️ Token obtenido pero no válido para Notion API');
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testToken();