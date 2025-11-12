/**
 * Setup global para los tests
 */
async function globalSetup(): Promise<void> {
  // Configuración global antes de ejecutar los tests
  console.log('🔧 Preparando entorno de tests...');
  
  // Validar que las variables de entorno de test estén configuradas
  const testEnvVars = {
    NODE_ENV: process.env['NODE_ENV'] || 'test',
    TEST_DATA_DIR: process.env['TEST_DATA_DIR'] || './test-data',
  };
  
  console.log('📝 Variables de entorno de test:', testEnvVars);
  
  // Crear directorios de test si no existen
  const { promises: fs } = await import('fs');
  const { join } = await import('path');
  
  const testDataDir = join(process.cwd(), 'test-data');
  
  try {
    await fs.mkdir(testDataDir, { recursive: true });
    console.log('✅ Directorio de datos de test creado');
  } catch (error) {
    console.warn('⚠️  Error creando directorio de test:', error);
  }
  
  console.log('🎯 Entorno de tests preparado exitosamente');
}

export default globalSetup;