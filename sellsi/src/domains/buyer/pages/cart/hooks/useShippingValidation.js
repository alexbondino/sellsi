/**
 * ============================================================================
 * SHIPPING VALIDATION HOOK - VALIDACIÓN DE COMPATIBILIDAD DE DESPACHO
 * ============================================================================
 * 
 * Hook para validar la compatibilidad de despacho entre productos del carrito
 * y la región del usuario, implementando la lógica avanzada de validación.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedUserShippingRegion } from '../../../../../hooks/useOptimizedUserShippingRegion';

/**
 * Estados posibles para cada producto en el carrito
 */
export const SHIPPING_STATES = {
  COMPATIBLE: 'compatible',
  INCOMPATIBLE_REGION: 'incompatible_region', 
  NO_SHIPPING_INFO: 'no_shipping_info'
};

/**
 * Hook para validación de despacho
 * @param {Array} cartItems - Items del carrito
 * @param {boolean} isAdvancedMode - Toggle para activar/desactivar validación avanzada
 * @returns {Object} Estado de validación y funciones
 */
export const useShippingValidation = (cartItems = [], isAdvancedMode = false) => {
  // ✅ OPTIMIZADO: Usar hook optimizado con caché global
  const { userRegion: optimizedUserRegion, isLoadingUserRegion } = useOptimizedUserShippingRegion();
  
  const [shippingStates, setShippingStates] = useState({});
  const [incompatibleProducts, setIncompatibleProducts] = useState([]);
  
  // ⚡ FIX CRÍTICO: Mantener último estado de compatibilidad conocido
  // Para evitar que se deshabilite el botón cuando userRegion sea temporalmente null
  const [stableCompatibilityState, setStableCompatibilityState] = useState({
    isCompatible: false,
    hasBeenValidated: false
  });

  /**
   * Obtener nombre legible de la región - memoizado para evitar recreaciones
   */
  const getUserRegionName = useMemo(() => {
    const regionMap = {
      'arica-parinacota': 'Arica y Parinacota',
      'tarapaca': 'Tarapacá',
      'antofagasta': 'Antofagasta',
      'atacama': 'Atacama',
      'coquimbo': 'Coquimbo',
      'valparaiso': 'Valparaíso',
      'metropolitana': 'Región Metropolitana',
      'ohiggins': "O'Higgins",
      'maule': 'Maule',
      'nuble': 'Ñuble',
      'biobio': 'Biobío',
      'araucania': 'Araucanía',
      'los-rios': 'Los Ríos',
      'los-lagos': 'Los Lagos',
      'aysen': 'Aysén',
      'magallanes': 'Magallanes'
    };
    
    return (regionValue) => regionMap[regionValue] || regionValue;
  }, []);

  /**
   * Validar estado de despacho para un producto específico - función pura memoizada
   */
  const validateProductShipping = useMemo(() => {
    return (product, userRegion) => {
      // Si no hay región del usuario, no se puede validar
      if (!userRegion) {
        return {
          state: SHIPPING_STATES.NO_SHIPPING_INFO,
          message: 'Configura tu dirección de despacho en tu perfil',
          canShip: false
        };
      }

      // Obtener información de despacho del producto con múltiples fuentes
      const shippingRegions = product.shippingRegions || 
                            product.delivery_regions || 
                            product.shipping_regions || 
                            product.product_delivery_regions ||
                            [];

      // Estado: Sin información de despacho
      if (!shippingRegions || shippingRegions.length === 0) {
        return {
          state: SHIPPING_STATES.NO_SHIPPING_INFO,
          message: 'Este producto no cuenta con información de despacho. Por favor, contacta a Sellsi.',
          canShip: false
        };
      }

      // Buscar la región del usuario en las regiones del producto
      const matchingRegion = shippingRegions.find(region => {
        const regionValue = region.region || region.value;
        return regionValue === userRegion;
      });

      // Estado: Compatible
      if (matchingRegion) {
        const days = matchingRegion.delivery_days || 
                    matchingRegion.maxDeliveryDays || 
                    matchingRegion.days || 
                    'N/A';
        
        // Obtener costo base de envío
        let baseCost = matchingRegion.price || 
                    matchingRegion.shippingValue || 
                    matchingRegion.cost || 
                    0;
        
        // ✅ CHECK FREE SHIPPING: Verificar si aplica despacho gratuito por cantidad
        const freeShippingEnabled = product.free_shipping_enabled || product.freeShippingEnabled;
        const freeShippingMinQty = product.free_shipping_min_quantity || product.freeShippingMinQuantity;
        const quantity = product.quantity || product.cantidad || 1;
        
        let finalCost = baseCost;
        let isFreeShipping = false;
        
        if (freeShippingEnabled && freeShippingMinQty && quantity >= freeShippingMinQty) {
          finalCost = 0;
          isFreeShipping = true;
        }
        
        // Construir mensaje según si es envío gratis o no
        const costMessage = finalCost === 0 
          ? 'Gratis' 
          : `$${finalCost.toLocaleString('es-CL')}`;
        
        return {
          state: SHIPPING_STATES.COMPATIBLE,
          message: `${days} días hábiles - ${costMessage}`,
          canShip: true,
          shippingInfo: {
            days: days,
            cost: finalCost,
            baseCost: baseCost,
            isFreeShipping: isFreeShipping,
            freeShippingMinQty: freeShippingMinQty
          }
        };
      }

      // Estado: Incompatible por región
      const availableRegions = shippingRegions.map(region => {
        const regionValue = region.region || region.value;
        return getUserRegionName(regionValue);
      });
      
      return {
        state: SHIPPING_STATES.INCOMPATIBLE_REGION,
        message: `Este producto no cuenta con despacho a tu región: ${getUserRegionName(userRegion)}`,
        canShip: false,
        availableRegions: availableRegions
      };
    };
  }, [getUserRegionName]); // ✅ Solo depende de getUserRegionName que es estable

  /**
   * Función para revalidar manualmente los productos - estable
   */
  const revalidate = useCallback(() => {
    if (!isAdvancedMode) {
      setShippingStates({});
      setIncompatibleProducts([]);
      return;
    }

    const newStates = {};
    const incompatible = [];

    cartItems.forEach(item => {
      const validation = validateProductShipping(item, optimizedUserRegion);
      newStates[item.id] = validation;
      
      if (!validation.canShip && validation.state !== SHIPPING_STATES.NO_SHIPPING_INFO) {
        incompatible.push({
          id: item.id,
          name: item.name || item.nombre,
          availableRegions: validation.availableRegions || []
        });
      }
    });

    setShippingStates(newStates);
    setIncompatibleProducts(incompatible);
  }, [cartItems, optimizedUserRegion, isAdvancedMode, validateProductShipping]);

  /**
   * Verificar si todos los productos son compatibles
   */
  const isCartCompatible = useCallback(() => {
    if (!isAdvancedMode) {
      return true;
    }
    
    // ⚡ FIX CRÍTICO: Si ya validamos antes y no hay userRegion ahora (temporal),
    // mantener el último estado compatible conocido
    if (!optimizedUserRegion && stableCompatibilityState.hasBeenValidated) {
      return stableCompatibilityState.isCompatible;
    }
    
    // Si no hay región del usuario y nunca hemos validado, no es compatible
    if (!optimizedUserRegion) {
      return false;
    }

    // Si hay productos incompatibles, el carrito no es compatible
    const compatible = incompatibleProducts.length === 0;
    return compatible;
  }, [isAdvancedMode, optimizedUserRegion, incompatibleProducts, stableCompatibilityState]);

  /**
   * Verificar si la información de despacho está completa
   */
  const isShippingInfoComplete = useCallback(() => {
    try {
      return !!(
        optimizedUserRegion && 
        Object.keys(shippingStates).length > 0 &&
        Object.values(shippingStates).every(state => 
          state.state !== SHIPPING_STATES.NO_SHIPPING_INFO
        )
      );
    } catch (err) {
      console.error('Error checking shipping info:', err);
      return false;
    }
  }, [optimizedUserRegion, shippingStates]);

  // ============================================================================
  // EFECTOS - SIMPLIFICADOS PARA EVITAR BUCLES
  // ============================================================================

  // Efecto para revalidar cuando cambian los datos relevantes
  useEffect(() => {
    // Solo ejecutar si tenemos los datos necesarios y está en modo avanzado
    if (isAdvancedMode && cartItems.length > 0 && optimizedUserRegion) {
      const newStates = {};
      const incompatible = [];

      cartItems.forEach(item => {
        const validation = validateProductShipping(item, optimizedUserRegion);
        newStates[item.id] = validation;
        
        if (!validation.canShip && validation.state !== SHIPPING_STATES.NO_SHIPPING_INFO) {
          incompatible.push({
            id: item.id,
            name: item.name || item.nombre,
            availableRegions: validation.availableRegions || []
          });
        }
      });

      setShippingStates(newStates);
      setIncompatibleProducts(incompatible);
      
      // ⚡ FIX CRÍTICO: Guardar estado de compatibilidad estable
      const isCompatible = incompatible.length === 0;
      setStableCompatibilityState({
        isCompatible,
        hasBeenValidated: true
      });
    } else if (!isAdvancedMode) {
      // Limpiar estados en modo simple
      setShippingStates({});
      setIncompatibleProducts([]);
      setStableCompatibilityState({ isCompatible: false, hasBeenValidated: false });
    }
    // ⚡ FIX CRÍTICO: NO limpiar estados si optimizedUserRegion es null temporalmente
    // Esto previene pérdida de estado al minimizar/restaurar navegador
    // El estado anterior se mantiene hasta que haya un nuevo userRegion válido
  }, [isAdvancedMode, cartItems, optimizedUserRegion, validateProductShipping]); // ✅ Incluir cartItems completo para detectar cambios de cantidad

  return {
    // Estados
    userRegion: optimizedUserRegion,
    shippingStates,
    isLoading: isLoadingUserRegion,
    error: null, // El hook optimizado maneja errores internamente
    incompatibleProducts,

    // Estados derivados
    isCartCompatible: isCartCompatible(),
    isShippingInfoComplete: isShippingInfoComplete(),

    // Funciones de control
    revalidate,

    // Utilidades
    getUserRegionName,
    validateProductShipping,
    SHIPPING_STATES
  };
};

export default useShippingValidation;
