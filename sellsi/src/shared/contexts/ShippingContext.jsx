/**
 * ============================================================================
 * SHIPPING CONTEXT - PROVIDER GLOBAL PARA OPTIMIZAR CONSULTAS
 * ============================================================================
 * 
 * Context que maneja el estado global de shipping validation,
 * evitando consultas duplicadas en toda la aplicación.
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useUnifiedShippingValidation } from '../hooks/shipping/useUnifiedShippingValidation';

// Context para shipping
const ShippingContext = createContext();

/**
 * Provider de Shipping que centraliza todas las validaciones
 */
export const ShippingProvider = ({ children }) => {
  const {
    userRegion,
    isLoadingUserRegion,
    validateProductWithCache,
    validateProductShipping,
    getUserRegionName,
    cacheStats,
    SHIPPING_STATES
  } = useUnifiedShippingValidation();

  // Función optimizada para validar productos en marketplace
  const validateMarketplaceProducts = useCallback(async (products) => {
    if (!userRegion || !Array.isArray(products)) return [];

    const validations = [];
    
    // Validar en lotes pequeños para no bloquear UI
    const batchSize = 5;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchValidations = await Promise.all(
        batch.map(product => validateProductWithCache(product))
      );
      validations.push(...batchValidations);
      
      // Pequeño delay para no saturar
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return validations;
  }, [userRegion, validateProductWithCache]);

  // Función para validar un producto individual (bajo demanda)
  const validateSingleProduct = useCallback(async (product) => {
    if (!product || !userRegion) return null;
    return await validateProductWithCache(product);
  }, [userRegion, validateProductWithCache]); // ✅ FIX: Removido 'product' de las dependencias

  // Valor del context optimizado
  const contextValue = useMemo(() => ({
    // Estado global
    userRegion,
    isLoadingUserRegion,
    
    // Funciones de validación
    validateMarketplaceProducts,
    validateSingleProduct,
    validateProductShipping, // Para validaciones directas sin caché
    
    // Utilidades
    getUserRegionName,
    
    // Estados y constantes
    SHIPPING_STATES,
    
    // Debug info
    cacheStats,
    validationCount
  }), [
    userRegion,
    isLoadingUserRegion,
    validateMarketplaceProducts,
    validateSingleProduct,
    validateProductShipping,
    getUserRegionName,
    SHIPPING_STATES,
    cacheStats,
    validationCount
  ]);

  return (
    <ShippingContext.Provider value={contextValue}>
      {children}
    </ShippingContext.Provider>
  );
};

/**
 * Hook para usar el shipping context
 */
export const useShippingContext = () => {
  const context = useContext(ShippingContext);
  
  if (!context) {
    throw new Error('useShippingContext must be used within a ShippingProvider');
  }
  
  return context;
};

/**
 * HOC para wrappear componentes que necesitan shipping validation
 */
export const withShipping = (Component) => {
  const WrappedComponent = (props) => (
    <ShippingProvider>
      <Component {...props} />
    </ShippingProvider>
  );
  
  WrappedComponent.displayName = `withShipping(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ShippingProvider;
