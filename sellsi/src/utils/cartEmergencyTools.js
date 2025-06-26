/**
 * ============================================================================
 * HERRAMIENTAS DE EMERGENCIA PARA CARRITO CORRUPTO
 * ============================================================================
 * 
 * Estas funciones pueden ser ejecutadas desde la consola del navegador
 * para solucionar problemas graves con el carrito.
 * 
 * PARA USAR:
 * 1. Abrir DevTools (F12)
 * 2. Ir a la pestaña "Console"
 * 3. Ejecutar: window.sellsiEmergencyTools.clearAllCartData()
 */

const clearAllCartData = () => {
  console.log('🚨 [EMERGENCIA] Iniciando limpieza completa del carrito...');
  
  try {
    // Limpiar LocalStorage
    const keysToRemove = [
      'cart-storage',
      'cart-items', 
      'carrito',
      'sellsi-cart',
      'buyerCart'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`✅ Removido: ${key}`);
      } catch (e) {
        console.warn(`⚠️ No se pudo remover ${key}:`, e);
      }
    });
    
    // Limpiar SessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpiado');
    } catch (e) {
      console.warn('⚠️ Error limpiando SessionStorage:', e);
    }
    
    // Recargar la página
    console.log('🔄 Recargando página...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error durante limpieza de emergencia:', error);
  }
};

const validateCurrentCart = () => {
  console.log('🔍 [DIAGNÓSTICO] Analizando estado actual del carrito...');
  
  try {
    // Revisar LocalStorage
    const cartKeys = Object.keys(localStorage).filter(key => 
      key.includes('cart') || key.includes('carrito')
    );
    
    console.log('📦 Claves de carrito encontradas:', cartKeys);
    
    cartKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`📋 ${key}:`, {
          type: typeof data,
          isArray: Array.isArray(data),
          length: data?.length || 'N/A',
          hasItems: data?.items?.length || 'N/A'
        });
        
        // Verificar items corruptos
        if (data?.items && Array.isArray(data.items)) {
          const corruptedItems = data.items.filter(item => {
            const quantity = parseInt(item.quantity);
            return isNaN(quantity) || quantity <= 0 || quantity > 15000;
          });
          
          if (corruptedItems.length > 0) {
            console.warn(`⚠️ ${corruptedItems.length} items corruptos en ${key}:`, corruptedItems);
          }
        }
        
      } catch (e) {
        console.warn(`⚠️ Error parseando ${key}:`, e);
      }
    });
    
  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  }
};

const fixCorruptedQuantities = () => {
  console.log('🔧 [REPARACIÓN] Corrigiendo cantidades corruptas...');
  
  try {
    const cartKeys = Object.keys(localStorage).filter(key => 
      key.includes('cart') || key.includes('carrito')
    );
    
    let totalFixed = 0;
    
    cartKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        
        if (data?.items && Array.isArray(data.items)) {
          let modified = false;
          
          data.items = data.items.map(item => {
            const originalQuantity = item.quantity;
            const quantity = parseInt(originalQuantity);
            
            if (isNaN(quantity) || quantity <= 0 || quantity > 15000) {
              const fixedQuantity = Math.max(1, Math.min(quantity || 1, 15000));
              console.log(`🔧 Corrigiendo ${item.name || item.id}: ${originalQuantity} → ${fixedQuantity}`);
              totalFixed++;
              modified = true;
              return { ...item, quantity: fixedQuantity };
            }
            
            return item;
          });
          
          if (modified) {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ Actualizado: ${key}`);
          }
        }
        
      } catch (e) {
        console.warn(`⚠️ Error reparando ${key}:`, e);
      }
    });
    
    console.log(`🎉 Reparación completada. ${totalFixed} cantidades corregidas.`);
    
    if (totalFixed > 0) {
      console.log('🔄 Recarga la página para ver los cambios.');
    }
    
  } catch (error) {
    console.error('❌ Error durante reparación:', error);
  }
};

// Exponer herramientas globalmente para uso en consola
if (typeof window !== 'undefined') {
  window.sellsiEmergencyTools = {
    clearAllCartData,
    validateCurrentCart,
    fixCorruptedQuantities,
    
    // Función de ayuda
    help: () => {
      console.log(`
🆘 HERRAMIENTAS DE EMERGENCIA SELLSI
====================================

Comandos disponibles:

1. window.sellsiEmergencyTools.validateCurrentCart()
   → Analiza el estado actual del carrito

2. window.sellsiEmergencyTools.fixCorruptedQuantities()
   → Intenta reparar cantidades corruptas

3. window.sellsiEmergencyTools.clearAllCartData()
   → LIMPIEZA COMPLETA (elimina todo y recarga)

4. window.sellsiEmergencyTools.help()
   → Muestra esta ayuda

⚠️ NOTA: La limpieza completa eliminará todos los productos
del carrito y recargará la página.
      `);
    }
  };
  
  // Mostrar ayuda al cargar
  console.log(`
🛠️ Herramientas de emergencia cargadas.
Ejecuta: window.sellsiEmergencyTools.help()
  `);
}

export { clearAllCartData, validateCurrentCart, fixCorruptedQuantities };
