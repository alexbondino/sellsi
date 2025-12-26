// Efectos y side-effects centralizados (notificaciones, limpieza de carrito)
// No cambian comportamiento; sólo encapsulan try/catch y logging.

import { INVALID_FOR_CART } from './constants';

export async function notifyOfferReceivedSafe(notificationService, payload, log = () => {}) {
  if (!notificationService?.notifyOfferReceived) return;
  try {
    await notificationService.notifyOfferReceived(payload);
  } catch (e) {
    log('notifyOfferReceived error', e?.message);
  }
}

export async function notifyOfferResponseSafe(notificationService, payload, accepted, log = () => {}) {
  if (!notificationService?.notifyOfferResponse) return;
  try {
    await notificationService.notifyOfferResponse(payload, accepted);
  } catch (e) {
    log('notifyOfferResponse error', e?.message);
  }
}

// Limpia del carrito items cuyos offer_id correspondan a ofertas finalizadas/invalidas
export function pruneInvalidOfferCartItems({ cartStore, offers, log = () => {} }) {
  try {
    if (!cartStore) return { removed: 0 };
    const cartState = cartStore.getState();
    const cartItems = cartState?.items || [];
    if (cartItems.length === 0) return { removed: 0 };
    const invalidOfferIds = new Set((offers||[]).filter(o => INVALID_FOR_CART.has(o.status)).map(o => o.id));
    if (invalidOfferIds.size === 0) return { removed: 0 };
    // Tolerar items malformados (null/undefined) que podrían venir de bugs externos
    const remaining = cartItems.filter(ci => ci && (!ci.offer_id || !invalidOfferIds.has(ci.offer_id)));
    if (remaining.length === cartItems.length) return { removed: 0 };
    if (typeof cartState.setItems === 'function') {
      cartState.setItems(remaining);
    } else {
      cartStore.setState({ items: remaining });
    }
    const removed = cartItems.length - remaining.length;
    log('Pruned cart items for invalid offers', { removed, invalidOfferIds: Array.from(invalidOfferIds) });
    return { removed };
  } catch (e) {
    try { console.warn('[offerStore] prune cart failed', e?.message); } catch(_) {}
    return { removed: 0, error: e };
  }
}
