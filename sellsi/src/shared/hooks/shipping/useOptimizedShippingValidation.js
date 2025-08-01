/**
 * ============================================================================
 * OPTIMIZED SHIPPING VALIDATION HOOK
 * ============================================================================
 * 
 * Hook optimizado que usa caché inteligente y validación bajo demanda
 * para eliminar consultas redundantes de shipping.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useShippingCache } from './useShippingCache';

/**
 * Estados posibles para validación de shipping
 */
export const SHIPPING_STATES = {
  COMPATIBLE: 'compatible',
  INCOMPATIBLE_REGION: 'incompatible_region', 
  NO_SHIPPING_INFO: 'no_shipping_info',
  PENDING_VALIDATION: 'pending_validation'
};

/**
 * Hook optimizado para validación de shipping con caché inteligente
 */
export const useOptimizedShippingValidation = () => {
  const {
    userRegion,
    isLoadingUserRegion,
    getProductShippingValidation,
    cacheProductValidation,
    cacheStats
  } = useShippingCache();

  const [validationResults, setValidationResults] = useState(new Map());

  /**
   * Función para obtener nombre legible de región
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
   * Función principal de validación de shipping (sin consultas automáticas)
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

    // Obtener información de despacho del producto
    const shippingRegions = product.shippingRegions || 
                          product.delivery_regions || 
                          product.shipping_regions || 
                          product.product_delivery_regions ||
                          [];

    // Si no hay regiones configuradas
    if (!shippingRegions || shippingRegions.length === 0) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Este producto no cuenta con información de despacho',
        canShip: false
      };
    }

    // Buscar coincidencia con región del usuario
    const matchingRegion = shippingRegions.find(region => {
      const regionValue = region.region || region.value;
      return regionValue === effectiveUserRegion;
    });

    // Si hay coincidencia
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
        shippingInfo: { days, cost }
      };
    }

    // No compatible con la región
    const availableRegions = shippingRegions.map(region => {
      const regionValue = region.region || region.value;
      return getUserRegionName(regionValue);
    });
    
    return {
      state: SHIPPING_STATES.INCOMPATIBLE_REGION,
      message: `No disponible en: ${getUserRegionName(effectiveUserRegion)}`,
      canShip: false,
      availableRegions
    };
  }, [userRegion, getUserRegionName]);

  /**
   * Función para validar producto con caché (bajo demanda)
   */
  const validateProductWithCache = useCallback(async (product) => {
    if (!product?.id || !userRegion) {
      return validateProductShipping(product);
    }

    // Verificar caché primero
    const cached = await getProductShippingValidation(product.id, userRegion);
    if (cached) {
      return cached;
    }

    // Validar y guardar en caché
    const validation = validateProductShipping(product, userRegion);
    cacheProductValidation(product.id, userRegion, validation);
    
    return validation;
  }, [userRegion, getProductShippingValidation, cacheProductValidation, validateProductShipping]);

  /**
   * Función para obtener validación de un producto específico
   */
  const getProductValidation = useCallback((productId) => {
    return validationResults.get(productId);
  }, [validationResults]);

  /**
   * Función para validar múltiples productos en lote
   */
  const validateProductsBatch = useCallback(async (products) => {
    if (!userRegion || !Array.isArray(products)) return;

    const newResults = new Map(validationResults);
    
    for (const product of products) {
      if (product?.id && !newResults.has(product.id)) {
        const validation = await validateProductWithCache(product);
        newResults.set(product.id, validation);
      }
    }

    setValidationResults(newResults);
  }, [userRegion, validationResults, validateProductWithCache]);

  /**
   * Función para limpiar validaciones cuando cambia la región
   */
  useEffect(() => {
    if (userRegion) {
      setValidationResults(new Map()); // Limpiar validaciones previas
    }
  }, [userRegion]);

  return {
    // Estados
    userRegion,
    isLoadingUserRegion,
    
    // Funciones de validación
    validateProductShipping, // Validación directa sin caché
    validateProductWithCache, // Validación con caché (recomendada)
    getProductValidation, // Obtener validación existente
    validateProductsBatch, // Validar múltiples productos
    
    // Utilidades
    getUserRegionName,
    
    // Debug info
    cacheStats,
    validationCount: validationResults.size,
    
    // Estados de shipping
    SHIPPING_STATES
  };
};

export default useOptimizedShippingValidation;
