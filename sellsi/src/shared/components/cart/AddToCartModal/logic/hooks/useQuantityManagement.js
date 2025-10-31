import { useState, useEffect, useCallback } from 'react';
import { deriveEffectiveMinimum, computeQuantityBounds } from '../quantity';

/**
 * Maneja la cantidad (inicialización, validaciones y cambios) para AddToCartModal.
 */
export function useQuantityManagement({ open, isOfferMode, offer, enrichedProduct, initialQuantity }) {
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [quantityError, setQuantityError] = useState('');

  // Inicializar cantidad al abrir
  useEffect(() => {
    if (!open) return;
    if (isOfferMode && offer) {
      setQuantity(offer.offered_quantity);
    } else {
      const tiers = enrichedProduct?.priceTiers || enrichedProduct?.price_tiers || [];
      const fallbackMin = enrichedProduct?.minimum_purchase || enrichedProduct?.compraMinima || 1;
      const effectiveMinimum = deriveEffectiveMinimum(tiers, fallbackMin);
      setQuantity(Math.max(initialQuantity, effectiveMinimum));
    }
    setQuantityError('');
  }, [open, isOfferMode, offer, enrichedProduct, initialQuantity]);

  const handleQuantityChange = useCallback((newQuantity, productData) => {
    if (isOfferMode) return; // no cambios en ofertas
    setQuantity(newQuantity);
    const { minQ, maxQ } = computeQuantityBounds(productData);
    if (newQuantity < minQ) {
      setQuantityError(`La cantidad mínima de compra es ${minQ} unidades`);
    } else if (newQuantity > maxQ) {
      setQuantityError(`La cantidad máxima disponible es ${maxQ} unidades`);
    } else {
      setQuantityError('');
    }
  }, [isOfferMode]);

  return { quantity, setQuantity, quantityError, setQuantityError, handleQuantityChange };
}
