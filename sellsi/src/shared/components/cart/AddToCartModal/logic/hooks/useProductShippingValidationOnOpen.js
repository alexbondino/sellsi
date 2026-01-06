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

  // ⚡ FIX CRÍTICO: Usar estado para mantener el último valor conocido
  // NO recalcular en cada render para evitar pérdida temporal
  const [effectiveUserRegion, setEffectiveUserRegion] = useState(() => hookUserRegion || userRegionProp);
  const [shippingValidation, setShippingValidation] = useState(null);
  const [isValidatingShipping, setIsValidatingShipping] = useState(false);
  const [justOpened, setJustOpened] = useState(false);
  const justOpenedTimerRef = useRef(null);

  // Actualizar effectiveUserRegion solo cuando haya un valor válido nuevo
  useEffect(() => {
    const newRegion = hookUserRegion || userRegionProp;
    if (newRegion && newRegion !== effectiveUserRegion) {
      setEffectiveUserRegion(newRegion);
    }
    // NO actualizar a null si ya teníamos un valor
  }, [hookUserRegion, userRegionProp, effectiveUserRegion]);

  const validateShippingOnDemand = useCallback(async () => {
    if (!effectiveUserRegion || !enrichedProduct || isLoadingRegions || isLoadingUserProfile) {
      setShippingValidation(null);
      return;
    }
    setIsValidatingShipping(true);
    try {
      let validation = null;
      if (hookUserRegion) {
        validation = validateSingleProduct(enrichedProduct);
      } else {
        validation = validateProductShipping(enrichedProduct, effectiveUserRegion);
      }
      setShippingValidation(validation);
    } catch (e) {
      console.error('[useProductShippingValidationOnOpen] error', e);
      setShippingValidation(null);
    } finally {
      setIsValidatingShipping(false);
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
