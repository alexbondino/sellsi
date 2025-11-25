// Centralización de constantes y mappings de estados de ofertas.
// Mantener compatibilidad retro (approved/cancelled) y mapping interno.

export const OFFER_STATES = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  RESERVED: 'reserved',
  PAID: 'paid',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  APPROVED: 'approved', // alias legacy (accepted -> approved)
  CANCELLED: 'cancelled' // alias legacy
});

// Estados que implican que la oferta ya no es válida para permanecer en el carrito
export const INVALID_FOR_CART = new Set([
  OFFER_STATES.EXPIRED,
  OFFER_STATES.REJECTED,
  OFFER_STATES.CANCELLED,
  OFFER_STATES.PAID
]);

// Map de estados devueltos por backend -> estados internos unificados
export const BACKEND_TO_INTERNAL_STATUS = Object.freeze({
  accepted: OFFER_STATES.APPROVED, // UI histórica espera 'approved'
  purchased: OFFER_STATES.RESERVED // rename histórico
  // pending, rejected, expired se mantienen igual
});

/**
 * Normaliza un estado proveniente de backend teniendo en cuenta expiración.
 * @param {string} status Original status (pending|accepted|purchased|...)
 * @param {string|Date|null} expiresAt Fecha de expiración 48h (para pending)
 * @param {string|Date|null} purchaseDeadline Fecha límite de compra 24h (para accepted/approved)
 * @returns {string} estado interno normalizado
 */
export function normalizeStatus(status, expiresAt, purchaseDeadline = null) {
  let finalStatus = status;
  const mapped = BACKEND_TO_INTERNAL_STATUS[status];
  if (mapped) finalStatus = mapped;
  
  const now = Date.now();
  
  // Para ofertas PENDING: verificar expires_at (48h desde creación)
  if (finalStatus === OFFER_STATES.PENDING && expiresAt) {
    const ms = new Date(expiresAt).getTime();
    if (!Number.isNaN(ms) && ms < now) {
      finalStatus = OFFER_STATES.EXPIRED;
    }
  }
  
  // Para ofertas APPROVED/ACCEPTED: verificar purchase_deadline (24h desde aceptación)
  // Si no hay purchase_deadline, usar expires_at como fallback (sincronizado en accept_offer_simple)
  if (finalStatus === OFFER_STATES.APPROVED) {
    const deadline = purchaseDeadline || expiresAt;
    if (deadline) {
      const ms = new Date(deadline).getTime();
      if (!Number.isNaN(ms) && ms < now) {
        finalStatus = OFFER_STATES.EXPIRED;
      }
    }
  }
  
  return finalStatus;
}
