/**
 * ============================================================================
 * PRODUCT PAGE OWNERSHIP HOOK
 * ============================================================================
 * 
 * Hook especializado para ProductPageView que combina la verificación de
 * propiedad optimizada con la lógica específica de renderizado de acciones.
 * 
 * Simplifica la integración en componentes que necesitan mostrar/ocultar
 * elementos basados en la propiedad del producto.
 */

import { useMemo } from 'react';
import { useOptimizedProductOwnership } from './useOptimizedProductOwnership';

/**
 * Hook para manejar la lógica de propiedad en ProductPageView
 * 
 * @param {Object} product - Producto a verificar
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones para manejo de propiedad
 */
export const useProductPageOwnership = (product, options = {}) => {
  const {
    fromMyProducts = false,
    isFromSupplierMarketplace = false,
    isSupplier = false,
    hideActionsForOwnProducts = true
  } = options;

  const {
    isProductOwnedByUser,
    isUserDataReady,
    isLoadingOwnership,
    currentUserName,
    isLoggedIn
  } = useOptimizedProductOwnership();

  // ============================================================================
  // VERIFICACIÓN PRINCIPAL DE PROPIEDAD
  // ============================================================================

  const ownershipInfo = useMemo(() => {
    // Si no hay datos del usuario listos, mostrar loading
    if (!isUserDataReady || isLoadingOwnership) {
      return {
        isOwnProduct: false,
        isChecking: true,
        confidence: 'unknown',
        reason: 'loading_user_data'
      };
    }

    // Si no hay producto, no es propio
    if (!product) {
      return {
        isOwnProduct: false,
        isChecking: false,
        confidence: 'high',
        reason: 'no_product'
      };
    }

    // Verificación instantánea
    const verification = isProductOwnedByUser(product);
    
    return {
      isOwnProduct: verification.isOwned,
      isChecking: false,
      confidence: verification.confidence,
      reason: verification.reason,
      supplierName: verification.supplierName,
      verificationTime: verification.verificationTime
    };
  }, [product, isUserDataReady, isLoadingOwnership, isProductOwnedByUser]);

  // ============================================================================
  // LÓGICA DE RENDERIZADO DE ACCIONES
  // ============================================================================

  const renderingDecisions = useMemo(() => {
    const { isOwnProduct, isChecking } = ownershipInfo;

    // Si está verificando, mostrar loading
    if (isChecking) {
      return {
        showLoadingSpinner: true,
        showPurchaseActions: false,
        showEditActions: false,
        showOwnerActions: false,
        reason: 'checking_ownership'
      };
    }

    // Verificar todas las condiciones para ocultar las purchase actions
    const shouldHidePurchaseActions = 
      fromMyProducts ||                    // Viene de mis productos
      isFromSupplierMarketplace ||         // Viene del marketplace de proveedor
      isSupplier ||                        // Es un proveedor viendo
      (hideActionsForOwnProducts && isOwnProduct); // Es producto propio y se configuró para ocultar

    return {
      showLoadingSpinner: false,
      showPurchaseActions: !shouldHidePurchaseActions,
      showEditActions: isOwnProduct && fromMyProducts,
      showOwnerActions: isOwnProduct,
      shouldHidePurchaseActions,
      reason: shouldHidePurchaseActions 
        ? (isOwnProduct ? 'own_product' : 'supplier_context')
        : 'can_purchase'
    };
  }, [
    ownershipInfo,
    fromMyProducts,
    isFromSupplierMarketplace,
    isSupplier,
    hideActionsForOwnProducts
  ]);

  // ============================================================================
  // FUNCIONES DE UTILIDAD
  // ============================================================================

  /**
   * Determinar si mostrar un elemento específico basado en la propiedad
   */
  const shouldShowElement = (elementType) => {
    const { isOwnProduct, isChecking } = ownershipInfo;
    const { showPurchaseActions, showEditActions, showOwnerActions } = renderingDecisions;

    switch (elementType) {
      case 'purchase_button':
      case 'add_to_cart':
      case 'buy_now':
        return showPurchaseActions;
        
      case 'edit_button':
      case 'delete_button':
      case 'update_stock':
        return showEditActions;
        
      case 'owner_badge':
      case 'owner_actions':
        return showOwnerActions;
        
      case 'loading_spinner':
        return isChecking;
        
      case 'contact_supplier':
        return !isOwnProduct && isLoggedIn;
        
      case 'share_product':
        return true; // Siempre se puede compartir
        
      default:
        return true;
    }
  };

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Estados principales
    isOwnProduct: ownershipInfo.isOwnProduct,
    isChecking: ownershipInfo.isChecking,
    
    // Decisiones de renderizado (principales)
    showLoadingSpinner: renderingDecisions.showLoadingSpinner,
    showPurchaseActions: renderingDecisions.showPurchaseActions,
    showEditActions: renderingDecisions.showEditActions,
    showOwnerActions: renderingDecisions.showOwnerActions,
    
    // Funciones de utilidad
    shouldShowElement,
    
    // Estados derivados útiles
    isLoggedIn,
    currentUserName,
    isUserDataReady: isUserDataReady && !isLoadingOwnership,
    
    // Compatibilidad con código existente
    checkingOwnership: ownershipInfo.isChecking, // Para mantener compatibilidad
  };
};

export default useProductPageOwnership;
