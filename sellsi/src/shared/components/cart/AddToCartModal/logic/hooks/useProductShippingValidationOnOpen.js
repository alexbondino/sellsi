import { useState, useEffect, useRef, useCallback } from 'react';
import { useUnifiedShippingValidation } from '../../../../../hooks/shipping/useUnifiedShippingValidation';

/**
 * Encapsula la lógica de validación de despacho on-demand usada en AddToCartModal.
 * - Espera a que el modal se abra y existan datos suficientes.
 * - Aplica una pequeña ventana justOpened para evitar flicker inicial.
 */
export function useProductShippingValidationOnOpen({
  open,
  enrichedProduct,
  userRegionProp,
  isLoadingRegions,
  isLoadingUserProfile,
}) {
  const { validateSingleProduct, validateProductShipping, getUserRegionName, userRegion: hookUserRegion, isLoadingUserRegion } = useUnifiedShippingValidation();

  const effectiveUserRegion = hookUserRegion || userRegionProp;
  const [shippingValidation, setShippingValidation] = useState(null);
  const [isValidatingShipping, setIsValidatingShipping] = useState(false);
  const [justOpened, setJustOpened] = useState(false);
  const justOpenedTimerRef = useRef(null);

  const validateShippingOnDemand = useCallback(async () => {
    console.group('🎯 [MODAL DEBUG] validateShippingOnDemand');
    console.log('🔍 effectiveUserRegion:', effectiveUserRegion);
    console.log('🔍 hookUserRegion:', hookUserRegion);
    console.log('🔍 userRegionProp:', userRegionProp);
    console.log('🔍 enrichedProduct:', enrichedProduct);
    console.log('🔍 isLoadingRegions:', isLoadingRegions);
    console.log('🔍 isLoadingUserProfile:', isLoadingUserProfile);
    
    if (!effectiveUserRegion || !enrichedProduct || isLoadingRegions || isLoadingUserProfile) {
      console.log('❌ SALTANDO VALIDACIÓN - Faltan datos o está cargando');
      console.groupEnd();
      setShippingValidation(null);
      return;
    }
    
    console.log('✅ INICIANDO VALIDACIÓN');
    setIsValidatingShipping(true);
    try {
      let validation = null;
      if (hookUserRegion) {
        console.log('🔄 Usando validateSingleProduct (con hookUserRegion)');
        validation = validateSingleProduct(enrichedProduct);
      } else {
        console.log('🔄 Usando validateProductShipping (con userRegionProp)');
        validation = validateProductShipping(enrichedProduct, effectiveUserRegion);
      }
      console.log('📊 RESULTADO DE VALIDACIÓN:', validation);
      setShippingValidation(validation);
    } catch (e) {
      console.error('[useProductShippingValidationOnOpen] error', e);
      setShippingValidation(null);
    } finally {
      setIsValidatingShipping(false);
      console.groupEnd();
    }
  }, [effectiveUserRegion, enrichedProduct, hookUserRegion, isLoadingRegions, isLoadingUserProfile, validateProductShipping, validateSingleProduct]);

  // Trigger validation after open with slight delay
  useEffect(() => {
    if (open && !isLoadingRegions && !isLoadingUserProfile && effectiveUserRegion && enrichedProduct) {
      const timer = setTimeout(() => {
        validateShippingOnDemand();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!open) {
      setShippingValidation(null);
    }
  }, [open, isLoadingRegions, isLoadingUserProfile, effectiveUserRegion, enrichedProduct, validateShippingOnDemand]);

  // Manage justOpened window
  useEffect(() => {
    if (open) {
      setJustOpened(true);
      if (justOpenedTimerRef.current) clearTimeout(justOpenedTimerRef.current);
      justOpenedTimerRef.current = setTimeout(() => {
        setJustOpened(false);
        justOpenedTimerRef.current = null;
      }, 300);
    } else {
      setJustOpened(false);
      if (justOpenedTimerRef.current) {
        clearTimeout(justOpenedTimerRef.current);
        justOpenedTimerRef.current = null;
      }
    }
    return () => {
      if (justOpenedTimerRef.current) {
        clearTimeout(justOpenedTimerRef.current);
        justOpenedTimerRef.current = null;
      }
    };
  }, [open]);

  return {
    shippingValidation,
    isValidatingShipping,
    justOpened,
    effectiveUserRegion,
    getUserRegionName,
    isLoadingUserRegion,
    validateShippingOnDemand, // export for manual triggers if needed
  };
}
