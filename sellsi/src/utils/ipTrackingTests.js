// Test de funcionalidad del sistema de tracking de IP

// Importar el servicio de tracking de IP
import { trackUserAction, updateUserIP, getCurrentUserIP } from '../services/security';

// Test 1: Verificar que la función trackUserAction funciona
async function testTrackUserAction() {
  console.log('🧪 Testing trackUserAction...');
  
  try {
    await trackUserAction('test_action');
    console.log('✅ trackUserAction funcionó correctamente');
  } catch (error) {
    console.error('❌ Error en trackUserAction:', error);
  }
}

// Test 2: Verificar que updateUserIP funciona
async function testUpdateUserIP() {
  console.log('🧪 Testing updateUserIP...');
  
  try {
    await updateUserIP();
    console.log('✅ updateUserIP funcionó correctamente');
  } catch (error) {
    console.error('❌ Error en updateUserIP:', error);
  }
}

// Test 3: Verificar que getCurrentUserIP funciona
async function testGetCurrentUserIP() {
  console.log('🧪 Testing getCurrentUserIP...');
  
  try {
    const ip = await getCurrentUserIP();
    console.log('✅ getCurrentUserIP funcionó correctamente, IP:', ip);
  } catch (error) {
    console.error('❌ Error en getCurrentUserIP:', error);
  }
}

// Ejecutar tests
export async function runIPTrackingTests() {
  console.log('🚀 Iniciando tests del sistema de tracking de IP...');
  
  await testTrackUserAction();
  await testUpdateUserIP();
  await testGetCurrentUserIP();
  
  console.log('✅ Tests completados');
}

// Ejecutar automáticamente en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Ejecutar tests después de un delay para asegurar que Supabase esté inicializado
  setTimeout(runIPTrackingTests, 2000);
}
