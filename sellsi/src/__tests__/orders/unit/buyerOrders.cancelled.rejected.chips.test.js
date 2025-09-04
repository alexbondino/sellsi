// Test B-2: Chips cancelado vs rechazado (lógica aislada de getStatusChips en BuyerOrders)

function getStatusChips(status, paymentStatus, order = null) {
  const isCancelled = status === 'cancelled' || (order && order.cancelled_at);
  const isRejected = status === 'rejected' || isCancelled;
  if (isRejected) {
    const getPaymentChipInfo = (ps) => {
      switch (ps) {
        case 'paid': return { label: 'Pago Confirmado', color: 'success' };
        case 'expired': return { label: 'Pago Expirado', color: 'error' };
        case 'pending':
        default: return { label: 'Procesando Pago', color: 'warning' };
      }
    };
    const paymentInfo = getPaymentChipInfo(paymentStatus);
    return [
      { key: 'pago', label: paymentInfo.label, color: paymentInfo.color, active: true },
      { key: 'rechazado', label: isCancelled ? 'Cancelado' : 'Rechazado', active: true, color: 'error' },
      { key: 'en_transito', label: 'En Transito', active: false, color: 'default' },
      { key: 'entregado', label: 'Entregado', active: false, color: 'default' }
    ];
  }
  // Simplificado para este test: solo necesitamos el path rechazo/cancelación
  return [];
}

describe('B-2 chips cancelado vs rechazado', () => {
  it('status=rejected muestra chip Rechazado', () => {
    const chips = getStatusChips('rejected', 'paid', { order_id: 'o1' });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej.label).toBe('Rechazado');
  });
  it('status=cancelled muestra chip Cancelado', () => {
    const chips = getStatusChips('cancelled', 'paid', { order_id: 'o2' });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej.label).toBe('Cancelado');
  });
  it('cancelled_at forzado aunque status!=cancelled -> Cancelado', () => {
    const chips = getStatusChips('pending', 'paid', { order_id: 'o3', cancelled_at: new Date().toISOString() });
    const rej = chips.find(c => c.key === 'rechazado');
    expect(rej.label).toBe('Cancelado');
  });
  it('chip pago refleja Pago Expirado si payment_status=expired', () => {
    const chips = getStatusChips('rejected', 'expired', { order_id: 'o4' });
    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Pago Expirado');
  });
  it('chip pago refleja Procesando Pago si payment_status=pending', () => {
    const chips = getStatusChips('rejected', 'pending', { order_id: 'o5' });
    const pago = chips.find(c => c.key === 'pago');
    expect(pago.label).toBe('Procesando Pago');
  });
});
