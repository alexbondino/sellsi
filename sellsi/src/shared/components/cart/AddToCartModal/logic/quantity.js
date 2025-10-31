// Lógica pura de cantidades
export function deriveEffectiveMinimum(priceTiers = [], fallbackMinimum = 1) {
  if (!Array.isArray(priceTiers) || priceTiers.length === 0) return fallbackMinimum || 1;
  const sorted = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
  return sorted[0]?.min_quantity || fallbackMinimum || 1;
}

export function computeQuantityBounds(productData) {
  if (!productData) return { minQ: 1, maxQ: 1 };
  const minQ = deriveEffectiveMinimum(productData.priceTiers, productData.minimumPurchase);
  const maxQ = Math.min(productData.maxPurchase, productData.stock);
  return { minQ, maxQ };
}
