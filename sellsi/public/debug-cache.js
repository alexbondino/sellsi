// 🔥 DEBUG HELPER: Función para diagnosticar el estado completo de los caches
window.debugShippingCache = () => {
  console.log('=== 🔍 DIAGNÓSTICO COMPLETO DE CACHE ===');
  
  // 1. localStorage info
  console.log('📦 localStorage:');
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('user') || key.includes('shipping') || key.includes('cached_')) {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
      }
    });
  } catch(e) {
    console.log('  Error accediendo localStorage:', e);
  }
  
  // 2. globalShippingInfoCache
  console.log('🚛 globalShippingInfoCache:');
  try {
    const cache = window.globalShippingInfoCache || {};
    console.log('  cache keys:', Object.keys(cache));
    if (cache.data) {
      console.log('  cache.data:', cache.data);
    }
  } catch(e) {
    console.log('  Error:', e);
  }
  
  // 3. globalCache
  console.log('🌍 globalCache:');
  try {
    if (window.globalCache) {
      console.log('  globalCache exists, methods:', Object.keys(window.globalCache));
    } else {
      console.log('  globalCache no existe');
    }
  } catch(e) {
    console.log('  Error:', e);
  }
  
  // 4. Current user
  console.log('👤 Usuario actual:');
  try {
    const userId = localStorage.getItem('user_id');
    console.log('  user_id:', userId);
  } catch(e) {
    console.log('  Error obteniendo user_id:', e);
  }
  
  console.log('=== FIN DIAGNÓSTICO ===');
};

console.log('🔧 Debug helper cargado. Usa window.debugShippingCache() para diagnóstico completo');