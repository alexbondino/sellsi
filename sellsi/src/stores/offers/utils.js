// Utilidades puras relacionadas con tiempos, status config y sanitización.
import { OFFER_STATES } from './constants';

export function sanitizePotentiallyUnsafe(val) {
  if (typeof val === 'string') {
    return val
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/onerror\s*=\s*"[^"]*"/gi, '')
      .replace(/onload\s*=\s*"[^"]*"/gi, '');
  }
  return val;
}

export function calculateTimeRemaining(offer) {
  const now = new Date();
  if (offer.status === OFFER_STATES.PENDING) {
    const expiresAt = new Date(offer.expires_at);
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  } else if (offer.status === OFFER_STATES.ACCEPTED) {
    const deadline = new Date(offer.purchase_deadline);
    return Math.max(0, Math.floor((deadline - now) / 1000));
  }
  return 0;
}

export function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Expirado';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function getOfferStatusConfig(offer) {
  switch (offer.status) {
    case OFFER_STATES.PENDING:
      return { color: 'warning', label: 'Pendiente', description: 'Esperando respuesta del proveedor', actionable: true };
    case OFFER_STATES.ACCEPTED:
      return { color: 'success', label: 'Aceptada', description: 'Tienes 24h para agregar al carrito', actionable: true };
    case OFFER_STATES.RESERVED:
      return { color: 'info', label: 'Reservada', description: 'Agregada al carrito (pendiente de pago)', actionable: false };
    case OFFER_STATES.PAID:
      return { color: 'success', label: 'Pagada', description: 'Pago confirmado', actionable: false };
    case OFFER_STATES.REJECTED:
      return { color: 'error', label: 'Rechazada', description: offer.rejection_reason || 'Rechazada por el proveedor', actionable: false };
    case OFFER_STATES.EXPIRED:
      return { color: 'default', label: 'Caducada', description: 'La oferta ha expirado', actionable: false };
    default:
      return { color: 'default', label: 'Desconocido', description: '', actionable: false };
  }
}
