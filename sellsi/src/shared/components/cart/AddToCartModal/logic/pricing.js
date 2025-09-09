import { calculatePriceForQuantity } from '../../../../../utils/priceCalculation';

export function computePricing(priceTiers = [], basePrice = 0, quantity = 1) {
  if (Array.isArray(priceTiers) && priceTiers.length > 0) {
    const unitPrice = calculatePriceForQuantity(quantity, priceTiers, basePrice);
    return { unitPrice, total: unitPrice * quantity, hasDiscountTiers: true };
  }
  return { unitPrice: basePrice, total: basePrice * quantity, hasDiscountTiers: false };
}

export function findActiveTier(priceTiers = [], quantity = 1) {
  if (!Array.isArray(priceTiers) || priceTiers.length === 0) return null;
  return priceTiers.find(t => {
    const min = t.min_quantity || 1;
    const max = t.max_quantity;
    return quantity >= min && (max == null || quantity <= max);
  }) || null;
}
