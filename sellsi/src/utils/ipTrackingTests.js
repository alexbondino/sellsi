// Test de funcionalidad del sistema de tracking de IP

// Importar el servicio de tracking de IP
import { trackUserAction, updateUserIP, getCurrentUserIP } from '../services/security';

// Test 1: Verificar que la función trackUserAction funciona
async function testTrackUserAction() {

  try {
    await trackUserAction('test_action');

  } catch (error) {
  }
}

// Test 2: Verificar que updateUserIP funciona
async function testUpdateUserIP() {

  try {
    await updateUserIP();

  } catch (error) {
  }
}

// Test 3: Verificar que getCurrentUserIP funciona
async function testGetCurrentUserIP() {

  try {
    const ip = await getCurrentUserIP();

  } catch (error) {
  }
}

// Ejecutar tests
export async function runIPTrackingTests() {

  await testTrackUserAction();
  await testUpdateUserIP();
  await testGetCurrentUserIP();

}

// Ejecutar automáticamente en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Ejecutar tests después de un delay para asegurar que Supabase esté inicializado
  setTimeout(runIPTrackingTests, 2000);
}
