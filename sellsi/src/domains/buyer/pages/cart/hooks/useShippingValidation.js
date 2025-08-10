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
          message: 'Configura tu región de envío en tu perfil',
          canShip: false
        };
      }

      // Obtener información de despacho del producto con múltiples fuentes
      const shippingRegions = product.shippingRegions || 
                            product.delivery_regions || 
                            product.shipping_regions || 
                            product.product_delivery_regions ||
                            [];

      // Debug para entender qué datos llegan
      console.log('📦 Product shipping data:', {
        productId: product.id,
        productName: product.nombre || product.name,
        shippingRegionsCount: shippingRegions.length,
        shippingRegions,
        allProductKeys: Object.keys(product), // Ver todas las propiedades del producto
        rawProduct: {
          shippingRegions: product.shippingRegions,
          delivery_regions: product.delivery_regions,
          shipping_regions: product.shipping_regions,
          product_delivery_regions: product.product_delivery_regions,
          deliveryRegions: product.deliveryRegions,
          // Ver si hay otras variantes de nombres
          productDeliveryRegions: product.productDeliveryRegions,
        },
      });

      // Si no hay regiones, mostrar mensaje específico
      if (!shippingRegions || shippingRegions.length === 0) {
        console.warn('⚠️ No shipping regions found for product:', {
          productId: product.id,
          productName: product.nombre || product.name,
          availableFields: Object.keys(product).filter(key => 
            key.toLowerCase().includes('region') || 
            key.toLowerCase().includes('delivery') || 
            key.toLowerCase().includes('shipping')
          )
        });
      }

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
        
        const cost = matchingRegion.price || 
                    matchingRegion.shippingValue || 
                    matchingRegion.cost || 
                    0;
        
        return {
          state: SHIPPING_STATES.COMPATIBLE,
          message: `${days} días hábiles - $${cost.toLocaleString('es-CL')}`,
          canShip: true,
          shippingInfo: {
            days: days,
            cost: cost
          }
        };
      }

      // Estado: Incompatible por región
      const availableRegions = shippingRegions.map(region => {
        const regionValue = region.region || region.value;
        return getUserRegionName(regionValue);
      });
      
      // Debug para ver qué está pasando
      console.log('🚚 Shipping Validation Debug:', {
        userRegion,
        shippingRegions,
        availableRegions,
        productId: product.id,
        productName: product.nombre || product.name
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
    
    // Si no hay región del usuario, el carrito no es compatible
    if (!optimizedUserRegion) {
      return false;
    }

    // Si hay productos incompatibles, el carrito no es compatible
    const compatible = incompatibleProducts.length === 0;
    return compatible;
  }, [isAdvancedMode, optimizedUserRegion, incompatibleProducts]);

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
    } else if (!isAdvancedMode) {
      // Limpiar estados en modo simple
      setShippingStates({});
      setIncompatibleProducts([]);
    }
  }, [isAdvancedMode, cartItems.length, optimizedUserRegion]); // ✅ Solo dependencias primitivas

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
