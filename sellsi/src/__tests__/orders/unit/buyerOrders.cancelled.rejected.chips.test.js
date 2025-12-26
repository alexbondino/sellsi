import { getStatusChips } from '../../../workspaces/buyer/my-orders/utils/orderStatusUtils';

// Test B-2: Chips cancelado vs rechazado — use real implementation from orderStatusUtils

describe('B-2 chips cancelado vs rechazado', () => {
  it('status=rejected muestra chip Rechazado con pago confirmado', () => {
    const chips = getStatusChips('rejected', 'paid', { order_id: 'o1' });
    expect(chips).toHaveLength(4);

    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Pago Confirmado');
    expect(pago.active).toBe(true);

    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej).toBeDefined();
    expect(rej.label).toBe('Rechazado');
    expect(rej.color).toBe('error');
    expect(rej.active).toBe(true);
  });

  it('status=cancelled muestra chip Cancelado y pago activo', () => {
    const chips = getStatusChips('cancelled', 'paid', { order_id: 'o2' });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej).toBeDefined();
    expect(rej.label).toBe('Cancelado');
    expect(rej.active).toBe(true);

    const pago = chips.find(c => c.key === 'pago');
    expect(pago.active).toBe(true);
  });

  it('cancelled_at forzado aunque status!=cancelled -> Cancelado', () => {
    const chips = getStatusChips('pending', 'paid', { order_id: 'o3', cancelled_at: new Date().toISOString() });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej).toBeDefined();
    expect(rej.label).toBe('Cancelado');
  });

  it('status=rejected y payment_status=expired debe mostrar solo Pago Expirado (no rechazado)', () => {
    const chips = getStatusChips('rejected', 'expired', { order_id: 'o4' });
    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Pago Expirado');
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej).toBeUndefined();
  });

  it('si hay cancelled_at pero payment expired -> no mostrar Cancelado (expired anula cancel) y no hay chips activos', () => {
    const chips = getStatusChips('pending', 'expired', { order_id: 'o5', cancelled_at: new Date().toISOString() });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej).toBeUndefined();

    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Pago Expirado');
    // En la implementación actual, cuando hay expired y cancelled_at, ninguno de los chips queda activo
    expect(chips.filter(c => c.active).length).toBe(0);
  });

  it('estado por defecto con pago pendiente muestra Pago activo solo', () => {
    const chips = getStatusChips('pending', 'pending', null);
    expect(chips).toHaveLength(4);
    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Procesando Pago');
    expect(pago.active).toBe(true);
    // Los demás deben estar inactivos
    expect(chips.filter(c => c.active).length).toBe(1);
  });
});
