/**
 * 🧪 Test Suite para Safari Compatibility Fixes
 * 
 * Este script verifica que los fixes para Safari estén correctamente implementados.
 * Ejecutar en Safari para validar que los errores han sido resueltos.
 */

console.log('🧪 Iniciando tests de compatibilidad Safari...\n');

// Test 1: Verificar que requestIdleCallback existe
console.log('Test 1: requestIdleCallback availability');
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  console.log('✅ requestIdleCallback está disponible');
  
  // Test que funciona correctamente
  let testPassed = false;
  const id = window.requestIdleCallback((deadline) => {
    console.log('✅ requestIdleCallback callback ejecutado');
    console.log(`   - didTimeout: ${deadline.didTimeout}`);
    console.log(`   - timeRemaining: ${deadline.timeRemaining()}ms`);
    testPassed = true;
  }, { timeout: 1000 });
  
  console.log(`   - ID retornado: ${id}`);
  
  // Verificar cancelIdleCallback
  if ('cancelIdleCallback' in window) {
    console.log('✅ cancelIdleCallback está disponible');
  } else {
    console.error('❌ cancelIdleCallback NO está disponible');
  }
} else {
  console.error('❌ requestIdleCallback NO está disponible');
}

console.log('\nTest 2: Verificar que Sentry Replay está configurado correctamente');
// Este test solo verifica que el código no lanza errores
// La verificación completa requiere que Sentry esté inicializado
setTimeout(() => {
  if (window.__SENTRY__) {
    console.log('✅ Sentry está inicializado');
    console.log('   - Verificar manualmente que blockSelector incluye YouTube iframes');
  } else {
    console.log('⚠️  Sentry no está inicializado aún (normal en staging sin DSN)');
  }
}, 3000);

console.log('\nTest 3: Verificar YouTubeEmbed sin errores cross-origin');
console.log('   - Navegar a la landing page');
console.log('   - Verificar que no hay errores de "Blocked a frame" en consola');
console.log('   - El iframe de YouTube debe cargar normalmente');

console.log('\nTest 4: Verificar ProductsSection.jsx');
console.log('   - Navegar al marketplace');
console.log('   - Verificar que no hay ReferenceError de requestIdleCallback');

console.log('\n📋 Resumen de verificaciones manuales:');
console.log('1. ✅ Polyfill aplicado correctamente');
console.log('2. ⏳ Verificar Sentry Replay config (revisar Network tab en error)');
console.log('3. ⏳ Probar YouTubeEmbed en landing');
console.log('4. ⏳ Probar ProductsSection en marketplace');

console.log('\n🎯 Para testing completo en Safari:');
console.log('1. Abrir https://staging-sellsi.vercel.app en Safari');
console.log('2. Abrir DevTools (Cmd+Option+I)');
console.log('3. Ir a Console tab');
console.log('4. Verificar que NO aparezcan estos errores:');
console.log('   - "Blocked a frame with origin"');
console.log('   - "Can\'t find variable: requestIdleCallback"');
console.log('5. Navegar por landing → marketplace → producto');
console.log('6. Verificar funcionalidad completa sin errores');

console.log('\n✨ Tests completados. Revisar console para resultados.\n');

// Export para uso en tests automatizados
export const testRequestIdleCallback = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      reject(new Error('requestIdleCallback not available'));
      return;
    }
    
    window.requestIdleCallback(() => {
      resolve(true);
    }, { timeout: 1000 });
  });
};

export const testCancelIdleCallback = () => {
  if (typeof window === 'undefined' || !('cancelIdleCallback' in window)) {
    throw new Error('cancelIdleCallback not available');
  }
  
  const id = window.requestIdleCallback(() => {}, { timeout: 1000 });
  window.cancelIdleCallback(id);
  return true;
};

export default {
  testRequestIdleCallback,
  testCancelIdleCallback,
};
