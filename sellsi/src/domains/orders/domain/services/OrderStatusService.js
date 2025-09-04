// Encapsula reglas de transición de estado para órdenes
import { ORDER_STATUSES, ADVANCE_STATUSES, normalizeStatus } from '../../shared/constants';

export class OrderStatusService {
  canTransition(current, next, { paymentStatus } = {}) {
    const n = normalizeStatus(next);
    if (!ORDER_STATUSES.includes(n)) return { ok: false, reason: 'Estado destino no válido' };
    // Regla simple: no retroceder una vez avanzado excepto cancel/reject antes de delivered
    const order = ['pending','accepted','rejected','in_transit','delivered','cancelled'];
    const ci = order.indexOf(current);
    const ni = order.indexOf(n);
    if (ci === -1) return { ok: false, reason: 'Estado actual desconocido' };
    if (n === 'cancelled') return { ok: true };
    if (n === 'rejected' && current === 'pending') return { ok: true };
    if (ni < ci) return { ok: false, reason: 'No se permite retroceder' };
    // Pago requerido para avanzar a estados operativos
    if (ADVANCE_STATUSES.has(n) && paymentStatus && paymentStatus !== 'paid') {
      return { ok: false, reason: 'Pago no confirmado' };
    }
    return { ok: true };
  }
}

export const orderStatusService = new OrderStatusService();
