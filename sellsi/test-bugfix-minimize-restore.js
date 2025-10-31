/**
 * ============================================================================
 * SCRIPT DE PRUEBA - BUG FIX: Minimizar/Restaurar Navegador
 * ============================================================================
 * 
 * Este script permite probar el fix del bug de pérdida de región al 
 * minimizar/restaurar el navegador.
 * 
 * USO:
 * 1. Abrir DevTools Console en BuyerCart o AddToCartModal
 * 2. Copiar y pegar este script completo
 * 3. Ejecutar los comandos uno por uno
 */

console.log('🧪 INICIANDO PRUEBAS DE BUGFIX MINIMIZE/RESTORE...\n');

// ============================================================================
// TEST 1: Verificar que sessionStorage tiene el cache
// ============================================================================
console.group('📦 TEST 1: SessionStorage Cache');

const cachedData = sessionStorage.getItem('user_shipping_region_cache');
if (cachedData) {
  const parsed = JSON.parse(cachedData);
  console.log('✅ Cache encontrado en sessionStorage:');
  console.table({
    userRegion: parsed.userRegion,
    timestamp: new Date(parsed.timestamp).toLocaleString('es-CL'),
    cachedUserId: parsed.cachedUserId,
    age: Math.round((Date.now() - parsed.timestamp) / 1000) + 's'
  });
} else {
  console.log('⚠️ No hay cache en sessionStorage (esto es normal en primera carga)');
}

console.groupEnd();

// ============================================================================
// TEST 2: Simular cache expirado
// ============================================================================
console.group('⏰ TEST 2: Simular Cache Expirado');

window.testExpiredCache = () => {
  const cached = sessionStorage.getItem('user_shipping_region_cache');
  if (!cached) {
    console.log('❌ No hay cache para expirar');
    return;
  }
  
  const parsed = JSON.parse(cached);
  // Modificar timestamp para simular 20 minutos atrás
  parsed.timestamp = Date.now() - (20 * 60 * 1000);
  sessionStorage.setItem('user_shipping_region_cache', JSON.stringify(parsed));
  
  console.log('✅ Cache modificado para parecer expirado (20 min atrás)');
  console.log('🔄 Ahora recarga la página y verifica que:');
  console.log('   1. NO aparece "Calculando envío..." infinito');
  console.log('   2. Muestra el valor de región inmediatamente');
  console.log('   3. En console aparece: "⚡ Cache stale, usando valor anterior..."');
};

console.log('📝 Para probar cache expirado, ejecuta: testExpiredCache()');
console.log('   Luego recarga la página (F5)');

console.groupEnd();

// ============================================================================
// TEST 3: Simular visibilitychange (minimizar/restaurar)
// ============================================================================
console.group('👁️ TEST 3: Simular Minimizar/Restaurar');

window.testVisibilityChange = () => {
  console.log('🔄 Simulando que la página pasa a background...');
  
  // Simular hidden
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    configurable: true,
    value: 'hidden'
  });
  document.dispatchEvent(new Event('visibilitychange'));
  
  console.log('⏳ Esperando 2 segundos (simula usuario en otra app)...');
  
  setTimeout(() => {
    console.log('👁️ Simulando que la página vuelve a visible...');
    
    // Simular visible
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible'
    });
    document.dispatchEvent(new Event('visibilitychange'));
    
    console.log('✅ Visibilitychange disparado. Verifica en console:');
    console.log('   - "👁️ Página restaurada, verificando cache..."');
    console.log('   - NO debe aparecer error de región');
  }, 2000);
};

console.log('📝 Para probar visibilitychange, ejecuta: testVisibilityChange()');

console.groupEnd();

// ============================================================================
// TEST 4: Verificar estado actual del globalCache
// ============================================================================
console.group('🔍 TEST 4: Inspeccionar Estado Actual');

window.inspectCache = () => {
  // Acceder al cache global (si está expuesto)
  console.log('📊 Estado actual del cache:');
  console.log('Nota: El globalCache es privado al módulo, pero podemos ver sessionStorage');
  
  const cached = sessionStorage.getItem('user_shipping_region_cache');
  if (cached) {
    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    const isStale = age > (15 * 60 * 1000);
    const isExpired = age > (30 * 60 * 1000);
    
    console.table({
      'Región': parsed.userRegion,
      'User ID': parsed.cachedUserId,
      'Edad (segundos)': Math.round(age / 1000),
      'Es Stale (>15min)': isStale ? '⚠️ Sí' : '✅ No',
      'Expirado (>30min)': isExpired ? '❌ Sí' : '✅ No',
      'Última actualización': new Date(parsed.timestamp).toLocaleString('es-CL')
    });
    
    if (isExpired) {
      console.log('❌ Cache expirado (>30min). Se hará refresh bloqueante.');
    } else if (isStale) {
      console.log('⚡ Cache stale (>15min). Se usará valor viejo mientras se refresca en background.');
    } else {
      console.log('✅ Cache fresco (<15min). Se usa directamente sin refetch.');
    }
  } else {
    console.log('⚠️ No hay cache en sessionStorage');
  }
};

console.log('📝 Para inspeccionar cache, ejecuta: inspectCache()');

console.groupEnd();

// ============================================================================
// TEST 5: Test completo end-to-end
// ============================================================================
console.group('🚀 TEST 5: Test Completo E2E');

window.testFullFlow = async () => {
  console.log('🔄 Iniciando test completo...\n');
  
  // Paso 1: Verificar estado inicial
  console.log('1️⃣ Verificando estado inicial...');
  window.inspectCache();
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Paso 2: Simular cache expirado
  console.log('\n2️⃣ Simulando cache expirado...');
  window.testExpiredCache();
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Paso 3: Simular visibilitychange
  console.log('\n3️⃣ Simulando minimizar/restaurar...');
  await new Promise(resolve => {
    window.testVisibilityChange();
    setTimeout(resolve, 3000);
  });
  
  // Paso 4: Verificar estado final
  console.log('\n4️⃣ Verificando estado final...');
  window.inspectCache();
  
  console.log('\n✅ TEST COMPLETO FINALIZADO');
  console.log('📝 Ahora verifica visualmente que:');
  console.log('   - BuyerCart muestra envío correctamente (NO "Calculando envío...")');
  console.log('   - AddToCartModal detecta región correctamente');
  console.log('   - NO hay loops infinitos');
};

console.log('📝 Para ejecutar test completo, ejecuta: testFullFlow()');
console.log('   (Este test toma ~5 segundos)');

console.groupEnd();

// ============================================================================
// TEST 6: Cleanup
// ============================================================================
console.group('🧹 TEST 6: Cleanup');

window.cleanupTest = () => {
  sessionStorage.removeItem('user_shipping_region_cache');
  console.log('✅ Cache limpiado de sessionStorage');
  console.log('🔄 Recarga la página para empezar de cero');
};

console.log('📝 Para limpiar todo y empezar de nuevo, ejecuta: cleanupTest()');

console.groupEnd();

// ============================================================================
// RESUMEN DE COMANDOS
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📚 RESUMEN DE COMANDOS DISPONIBLES:');
console.log('='.repeat(60));
console.log('inspectCache()      - Ver estado actual del cache');
console.log('testExpiredCache()  - Simular cache expirado');
console.log('testVisibilityChange() - Simular minimizar/restaurar');
console.log('testFullFlow()      - Test completo E2E (~5s)');
console.log('cleanupTest()       - Limpiar y resetear');
console.log('='.repeat(60) + '\n');

console.log('💡 TIP: Empieza con inspectCache() para ver el estado actual');
