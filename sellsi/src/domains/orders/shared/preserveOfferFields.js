// Small helper to normalize/preserve offer-related fields from raw item shapes
export function preserveOfferFields(raw = {}) {
  return {
    metadata: raw.metadata || null,
    isOffered: !!(raw.isOffered || raw.metadata?.isOffered || raw.offer_id || raw.offered_price),
    offer_id: raw.offer_id || raw.metadata?.offer_id || null,
    offered_price: raw.offered_price ?? raw.offeredPrice ?? null,
    offeredPrice: raw.offered_price ?? raw.offeredPrice ?? null
  };
}
