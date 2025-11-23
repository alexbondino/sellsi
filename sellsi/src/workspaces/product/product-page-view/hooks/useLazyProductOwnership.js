/**
 * ============================================================================
 * LAZY PRODUCT OWNERSHIP VERIFICATION - ON-DEMAND PATTERN
 * ============================================================================
 * 
 * Hook complementario que sigue el patrón de useOptimizedShippingValidation
 * para verificaciones bajo demanda de propiedad de productos.
 * 
 * Útil para casos donde se necesita verificar propiedad solo cuando es necesario
 * (hover, click, modal open, etc.) en lugar de verificaciones automáticas.
 */

import { useState, useCallback, useMemo } from 'react';
import { useOptimizedProductOwnership } from './useOptimizedProductOwnership';

/**
 * Estados posibles para verificación de propiedad
 */
export const OWNERSHIP_STATES = {
  OWNED: 'owned',
  NOT_OWNED: 'not_owned',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFICATION_ERROR: 'verification_error'
};

/**
 * Hook para verificación lazy de propiedad de productos
 * Sigue el mismo patrón que useOptimizedShippingValidation
 */
export const useLazyProductOwnership = (products = []) => {
  const { 
    isProductOwnedByUser, 
    getProductsOwnership, 
    isUserDataReady,
    currentUserName 
  } = useOptimizedProductOwnership();
  
  const [ownershipStates, setOwnershipStates] = useState({});
  const [error, setError] = useState(null);
  const [ownedProducts, setOwnedProducts] = useState([]);

  /**
   * Verificación manual de un producto específico (BAJO DEMANDA)
   */
  const verifyProductOwnership = useCallback((product) => {
    if (!product || !isUserDataReady) {
      return {
        state: OWNERSHIP_STATES.PENDING_VERIFICATION,
        message: 'Verificando datos del usuario...',
        isOwned: false
      };
    }

    try {
      const verification = isProductOwnedByUser(product);
      
      const state = verification.isOwned ? 
        OWNERSHIP_STATES.OWNED : 
        OWNERSHIP_STATES.NOT_OWNED;
      
      const message = verification.isOwned ? 
        'Este producto te pertenece' : 
        'Este producto no te pertenece';

      return {
        state,
        message,
        isOwned: verification.isOwned,
        confidence: verification.confidence,
        reason: verification.reason,
        verificationTime: verification.verificationTime
      };
    } catch (err) {
      console.error('Error verificando propiedad:', err);
      setError(err.message);
      
      return {
        state: OWNERSHIP_STATES.VERIFICATION_ERROR,
        message: 'Error al verificar propiedad del producto',
        isOwned: false,
        error: err.message
      };
    }
  }, [isProductOwnedByUser, isUserDataReady]);

  /**
   * Verificación batch manual (BAJO DEMANDA)
   */
  const verifyProductsOwnership = useCallback((targetProducts = null) => {
    const productsToVerify = targetProducts || products;
    
    if (!productsToVerify.length || !isUserDataReady) {
      return {
        ownedProducts: [],
        notOwnedProducts: productsToVerify,
        ownershipStates: {},
        verificationTime: 0
      };
    }

    try {
      const batchVerification = getProductsOwnership(productsToVerify);
      const newOwnershipStates = {};

      productsToVerify.forEach(product => {
        const verification = verifyProductOwnership(product);
        newOwnershipStates[product.id] = verification;
      });

      setOwnershipStates(newOwnershipStates);
      setOwnedProducts(batchVerification.ownedProducts);

      return {
        ownedProducts: batchVerification.ownedProducts,
        notOwnedProducts: batchVerification.notOwnedProducts,
        ownershipStates: newOwnershipStates,
        verificationTime: batchVerification.verificationTime,
        totalProducts: batchVerification.totalProducts
      };
    } catch (err) {
      console.error('Error en verificación batch:', err);
      setError(err.message);
      
      return {
        ownedProducts: [],
        notOwnedProducts: productsToVerify,
        ownershipStates: {},
        verificationTime: 0,
        error: err.message
      };
    }
  }, [products, isUserDataReady, verifyProductOwnership, getProductsOwnership]);

  /**
   * Verificar si el usuario actual es dueño de al menos un producto
   */
  const hasOwnedProducts = useCallback(() => {
    if (!isUserDataReady) return false;
    return ownedProducts.length > 0;
  }, [isUserDataReady, ownedProducts]);

  /**
   * Obtener productos propios filtrados
   */
  const getOwnedProductsOnly = useCallback((targetProducts = null) => {
    const productsToFilter = targetProducts || products;
    
    if (!isUserDataReady || !productsToFilter.length) {
      return [];
    }

    return productsToFilter.filter(product => {
      const verification = verifyProductOwnership(product);
      return verification.isOwned;
    });
  }, [products, isUserDataReady, verifyProductOwnership]);

  /**
   * Obtener productos NO propios filtrados
   */
  const getNonOwnedProductsOnly = useCallback((targetProducts = null) => {
    const productsToFilter = targetProducts || products;
    
    if (!isUserDataReady || !productsToFilter.length) {
      return productsToFilter;
    }

    return productsToFilter.filter(product => {
      const verification = verifyProductOwnership(product);
      return !verification.isOwned;
    });
  }, [products, isUserDataReady, verifyProductOwnership]);

  /**
   * Limpiar estados y errores
   */
  const clearOwnershipStates = useCallback(() => {
    setOwnershipStates({});
    setOwnedProducts([]);
    setError(null);
  }, []);

  /**
   * Estadísticas de propiedad
   */
  const ownershipStats = useMemo(() => {
    if (!isUserDataReady || !products.length) {
      return {
        totalProducts: products.length,
        ownedCount: 0,
        notOwnedCount: products.length,
        ownershipPercentage: 0
      };
    }

    const ownedCount = ownedProducts.length;
    const notOwnedCount = products.length - ownedCount;
    const ownershipPercentage = products.length > 0 ? 
      Math.round((ownedCount / products.length) * 100) : 0;

    return {
      totalProducts: products.length,
      ownedCount,
      notOwnedCount,
      ownershipPercentage
    };
  }, [products, ownedProducts, isUserDataReady]);

  return {
    // Estados
    ownershipStates,
    error,
    ownedProducts,
    isUserDataReady,
    currentUserName,

    // Estados derivados
    hasOwnedProducts: hasOwnedProducts(),
    ownershipStats,

    // Funciones de verificación (BAJO DEMANDA)
    verifyProductOwnership,
    verifyProductsOwnership,

    // Funciones de filtrado
    getOwnedProductsOnly,
    getNonOwnedProductsOnly,

    // Funciones de control
    clearOwnershipStates,

    // Constantes
    OWNERSHIP_STATES
  };
};

export default useLazyProductOwnership;
