/**
 * ============================================================================
 * SHIPPING CALCULATION UTILITIES - UTILIDADES DE CÁLCULO DE ENVÍO
 * ============================================================================
 * 
 * Funciones para calcular el costo real de envío basado en las regiones
 * de despacho de los productos y la región del usuario.
 * 
 * EJEMPLO DE CÁLCULO CORRECTO:
 * 
 * Carrito:
 * - Producto A: 3 unidades, costo envío $2.000
 * - Producto B: 2 unidades, costo envío $1.500
 * - Producto C: 1 unidad, costo envío $3.000
 * 
 * TOTAL ENVÍO = $2.000 + $1.500 + $3.000 = $6.500
 * 
 * ❌ INCORRECTO: (3 × $2.000) + (2 × $1.500) + (1 × $3.000) = $12.000
 * ✅ CORRECTO: $2.000 + $1.500 + $3.000 = $6.500
 */

import { getUserProfile } from '../services/user/profileService';
import { supabase } from '../services/supabase';

/**
 * Calcular el costo real de envío para un conjunto de productos
 * basado en la región del usuario y las regiones de despacho disponibles
 * 
 * @param {Array} items - Array de productos del carrito
 * @param {string} userRegion - Región del usuario (opcional, se obtendrá del perfil si no se proporciona)
 * @returns {Promise<number>} - Costo total de envío
 */
export const calculateRealShippingCost = async (items = [], userRegion = null) => {
  // Obtener región del usuario si no se proporciona
  let targetRegion = userRegion;
  if (!targetRegion) {
    try {
      // Obtener usuario autenticado primero
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const profile = await getUserProfile(user.id);
        
        // ✅ CORREGIDO: La región está en shipping_info, no en users
        targetRegion = profile?.shipping_region || profile?.data?.shipping_region;
      }
    } catch (error) {
      // Error obteniendo región del usuario
    }
  }

  // Si aún no hay región, usar lógica de fallback temporal
  if (!targetRegion) {
    // TEMPORAL: Usar 'metropolitana' como fallback hasta que se arregle el perfil
    targetRegion = 'metropolitana';
  }

  // Calcular costo total - SUMA de costos por producto (NO multiplicado por cantidad)
  const totalCost = items.reduce((total, item) => {
    const itemCost = calculateProductShippingCost(item, targetRegion);
    return total + itemCost; // Solo sumar el costo, sin multiplicar por cantidad
  }, 0);

  return totalCost;
};

/**
 * Calcular el costo de envío para un producto específico
 * basado en la región del usuario
 * 
 * IMPORTANTE: El costo es POR PRODUCTO, no por cantidad.
 * Si hay 5 unidades del mismo producto, el costo de envío es uno solo.
 * 
 * @param {Object} product - Producto del carrito
 * @param {string} userRegion - Región del usuario
 * @returns {number} - Costo de envío del producto (fijo, independiente de cantidad)
 */
export const calculateProductShippingCost = (product, userRegion) => {
  // Obtener información de despacho del producto con múltiples fuentes
  const shippingRegions = product.shippingRegions || 
                         product.delivery_regions || 
                         product.shipping_regions || 
                         product.product_delivery_regions || 
                         [];

  // Si no hay información de despacho, usar precio por defecto
  if (!shippingRegions || shippingRegions.length === 0) {
    return 5990; // Precio por defecto
  }

  // Buscar la región del usuario en las regiones disponibles
  const matchingRegion = shippingRegions.find(region => {
    const regionValue = region.region || region.value;
    return regionValue === userRegion;
  });

  if (matchingRegion) {
    // Usar costo específico para la región del usuario
    const cost = matchingRegion.price || 
                matchingRegion.shippingValue || 
                matchingRegion.cost || 
                5990;
    
    return cost;
  } else {
    // Región no compatible, usar el precio MÁS BAJO disponible
    const availableCosts = shippingRegions.map(region => 
      region.price || region.shippingValue || region.cost || 5990
    );
    
    // Usar el precio más bajo en lugar del promedio
    const finalCost = Math.min(...availableCosts);
    
    return finalCost;
  }
};

/**
 * Verificar si un producto puede ser enviado a una región específica
 * 
 * @param {Object} product - Producto del carrito
 * @param {string} userRegion - Región del usuario
 * @returns {boolean} - True si el producto puede ser enviado a la región
 */
export const canShipToRegion = (product, userRegion) => {
  const shippingRegions = product.shippingRegions || 
                         product.delivery_regions || 
                         product.shipping_regions || 
                         product.product_delivery_regions || 
                         [];

  if (!shippingRegions || shippingRegions.length === 0) {
    return false; // Sin información de despacho
  }

  return shippingRegions.some(region => {
    const regionValue = region.region || region.value;
    return regionValue === userRegion;
  });
};

/**
 * Obtener información detallada de envío para un producto
 * 
 * @param {Object} product - Producto del carrito
 * @param {string} userRegion - Región del usuario
 * @returns {Object} - Información detallada del envío
 */
export const getShippingInfo = (product, userRegion) => {
  const shippingRegions = product.shippingRegions || 
                         product.delivery_regions || 
                         product.shipping_regions || 
                         product.product_delivery_regions || 
                         [];

  if (!shippingRegions || shippingRegions.length === 0) {
    return {
      canShip: false,
      cost: 0,
      days: null,
      message: 'Sin información de despacho'
    };
  }

  const matchingRegion = shippingRegions.find(region => {
    const regionValue = region.region || region.value;
    return regionValue === userRegion;
  });

  if (matchingRegion) {
    return {
      canShip: true,
      cost: matchingRegion.price || matchingRegion.shippingValue || matchingRegion.cost || 5990,
      days: matchingRegion.delivery_days || matchingRegion.maxDeliveryDays || matchingRegion.days || 'N/A',
      message: 'Envío disponible'
    };
  } else {
    return {
      canShip: false,
      cost: 0,
      days: null,
      message: 'Región no disponible para envío'
    };
  }
};
