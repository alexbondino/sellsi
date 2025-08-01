/**
 * ============================================================================
 * OPTIMIZED SHIPPING VALIDATION HOOK - LAZY LOADING
 * ============================================================================
 * 
 * Hook que elimina las validaciones automáticas masivas y solo valida
 * cuando realmente se necesita (en modals, hover, etc.)
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
 * Hook optimizado para validación de shipping - SOLO BAJO DEMANDA
 */
export const useOptimizedShippingValidation = (cartItems = [], isAdvancedMode = false) => {
  const { userRegion, isLoadingUserRegion } = useOptimizedUserShippingRegion();
  
  const [shippingStates, setShippingStates] = useState({});
  const [error, setError] = useState(null);
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
   * Función principal de validación de shipping - SIN CONSULTAS AUTOMÁTICAS
   */
  const validateProductShipping = useCallback((product, targetUserRegion = null) => {
    const effectiveUserRegion = targetUserRegion || userRegion;
    
    // Si no hay región del usuario, no se puede validar
    if (!effectiveUserRegion) {
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

    // Si no hay regiones, mostrar mensaje específico
    if (!shippingRegions || shippingRegions.length === 0) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Este producto no cuenta con información de despacho',
        canShip: false
      };
    }

    // Buscar la región del usuario en las regiones del producto
    const matchingRegion = shippingRegions.find(region => {
      const regionValue = region.region || region.value;
      return regionValue === effectiveUserRegion;
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
    
    return {
      state: SHIPPING_STATES.INCOMPATIBLE_REGION,
      message: `No disponible en: ${getUserRegionName(effectiveUserRegion)}`,
      canShip: false,
      availableRegions: availableRegions
    };
  }, [userRegion, getUserRegionName]);

  /**
   * Función para validar manualmente un producto específico (BAJO DEMANDA)
   */
  const validateSingleProduct = useCallback((product) => {
    if (!product || !userRegion) return null;
    return validateProductShipping(product, userRegion);
  }, [userRegion, validateProductShipping]);

  /**
   * Verificar si todos los productos son compatibles
   */
  const isCartCompatible = useCallback(() => {
    if (!isAdvancedMode) return true;
    if (!userRegion) return false;
    return incompatibleProducts.length === 0;
  }, [isAdvancedMode, userRegion, incompatibleProducts]);

  /**
   * Verificar si la información de envío está completa
   */
  const isShippingInfoComplete = useCallback(() => {
    try {
      return !!(
        userRegion && 
        Object.keys(shippingStates).length > 0 &&
        Object.values(shippingStates).every(state => 
          state.state !== SHIPPING_STATES.NO_SHIPPING_INFO
        )
      );
    } catch (err) {
      console.error('Error checking shipping info:', err);
      return false;
    }
  }, [userRegion, shippingStates]);

  // ✅ OPTIMIZACIÓN CRÍTICA: NO hacer validaciones automáticas
  // Solo limpiar estados cuando cambia la región
  useEffect(() => {
    if (userRegion) {
      setShippingStates({});
      setIncompatibleProducts([]);
    }
  }, [userRegion]);

  return {
    // Estados
    userRegion,
    isLoadingUserRegion,
    shippingStates,
    error,
    incompatibleProducts,

    // Estados derivados
    isCartCompatible: isCartCompatible(),
    isShippingInfoComplete: isShippingInfoComplete(),

    // Funciones de control - SOLO BAJO DEMANDA
    validateProductShipping, // Función pura sin side effects
    validateSingleProduct,   // Wrapper que usa userRegion actual

    // Utilidades
    getUserRegionName,
    SHIPPING_STATES
  };
};

export default useOptimizedShippingValidation;
