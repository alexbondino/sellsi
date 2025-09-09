// Validation helpers extracted from offerStore without behavior changes.

export async function runValidateOfferLimits(rawArgs, { supabase, get, log }) {
  let buyerId, productId, supplierId;
  if (rawArgs.length === 1 && typeof rawArgs[0] === 'object' && rawArgs[0] !== null) {
    ({ buyerId, productId, supplierId } = rawArgs[0]);
  } else {
    [buyerId, supplierId, productId] = rawArgs; // legacy ordering
    try { if (typeof console !== 'undefined') console.warn('[offerStore] validateOfferLimits usando firma DEPRECATED. Actualiza a validateOfferLimits({ buyerId, productId, supplierId })'); } catch(_) {}
  }
  try {
    log('validateOfferLimits input', { buyerId, productId, supplierId });
    if (!buyerId || !productId || !supplierId) throw new Error('Parámetros inválidos para validateOfferLimits');
    const state = get();
    state._validateCache = state._validateCache || new Map();
    state._validateInFlight = state._validateInFlight || new Map();
    const key = `${buyerId}:${supplierId}:${productId}`;
    const now = Date.now();
    const TTL = 3000;
    const cached = state._validateCache.get(key);
    if (cached && (now - cached.ts) < TTL) { log('validateOfferLimits cache hit', key); return cached.data; }
    if (state._validateInFlight.has(key)) { log('validateOfferLimits join in-flight', key); return await state._validateInFlight.get(key); }
    const p = (async () => {
      const res = await supabase.rpc('validate_offer_limits', { p_buyer_id: buyerId, p_supplier_id: supplierId, p_product_id: productId });
      if (res.error) throw new Error(res.error.message);
      const data = res.data || {};
      const productCount = Number(data.product_count) || 0;
      const supplierCount = Number(data.supplier_count) || 0;
      const productLimit = Number(data.product_limit) || 3;
      const supplierLimit = Number(data.supplier_limit) || 5;
      const allowed = !!data.allowed;
      const reason = data.reason || (productCount >= productLimit ? 'Se alcanzó el límite mensual de ofertas (producto)' : (supplierCount >= supplierLimit ? 'Se alcanzó el límite mensual de ofertas con este proveedor' : undefined));
      const base = { isValid: allowed, allowed, currentCount: productCount, product_count: productCount, supplier_count: supplierCount, limit: productLimit, product_limit: productLimit, supplier_limit: supplierLimit, reason };
      state._validateCache.set(key, { ts: Date.now(), data: base });
      return base;
    })();
    state._validateInFlight.set(key, p);
    try { const result = await p; log('validateOfferLimits returning (normalized)', result); return result; } finally { state._validateInFlight.delete(key); }
  } catch (e) {
    log('validateOfferLimits error', e?.message || String(e));
    try { if (typeof console !== 'undefined') console.warn('[offerStore] validateOfferLimits RPC error:', e?.message || e); } catch(_) {}
    return { isValid: true, allowed: true, currentCount: undefined, product_count: undefined, supplier_count: undefined, limit: 3, product_limit: 3, supplier_limit: 5, reason: 'No se pudo validar límites', error: 'Error al validar límites: ' + (e?.message || String(e)) };
  }
}

export async function runValidateOfferPrice(productId, quantity, offeredPrice, { supabase }) {
  const { data, error } = await supabase.rpc('validate_offer_against_tiers', { p_product_id: productId, p_offered_quantity: quantity, p_offered_price: offeredPrice });
  if (error) throw error;
  return data;
}
