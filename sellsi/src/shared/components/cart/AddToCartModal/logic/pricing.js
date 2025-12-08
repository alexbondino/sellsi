import { calculatePriceForQuantity } from '../../../../../utils/priceCalculation';

export function computePricing(priceTiers = [], basePrice = 0, quantity = 1) {
  if (Array.isArray(priceTiers) && priceTiers.length > 0) {
    const unitPrice = calculatePriceForQuantity(
      quantity,
      priceTiers,
      basePrice
    );
    return { unitPrice, total: unitPrice * quantity, hasDiscountTiers: true };
  }
  return {
    unitPrice: basePrice,
    total: basePrice * quantity,
    hasDiscountTiers: false,
  };
}

export function findActiveTier(priceTiers = [], quantity = 1) {
  if (!Array.isArray(priceTiers) || priceTiers.length === 0) return null;
  
  // ✅ FIX: Ordenar tiers por min_quantity ascendente para procesar en orden
  const sortedTiers = [...priceTiers].sort((a, b) => {
    const aMin = a.min_quantity || 1;
    const bMin = b.min_quantity || 1;
    return aMin - bMin;
  });
  
  // ✅ FIX: Buscar el tier activo calculando max_quantity implícito
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    const min = tier.min_quantity || 1;
    
    // Calcular max basado en el siguiente tier
    const isLastTier = i === sortedTiers.length - 1;
    const nextTier = isLastTier ? null : sortedTiers[i + 1];
    const max = tier.max_quantity ?? (nextTier ? nextTier.min_quantity - 1 : null);
    
    // Verificar si quantity está en este rango
    const isInRange = quantity >= min && (max == null || quantity <= max);
    if (isInRange) {
      return tier;
    }
  }
  
  return null;
}
