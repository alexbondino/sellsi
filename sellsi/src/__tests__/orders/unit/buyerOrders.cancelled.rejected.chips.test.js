// Test B-2: Chips cancelado vs rechazado (lógica aislada de getStatusChips en BuyerOrders)

function getStatusChips(status, paymentStatus, order = null) {
  const isPaymentExpired = paymentStatus === 'expired';
  // If payment expired, we do not want to treat the order as cancelled/rejected for UI chips
  const isCancelled = (status === 'cancelled' || (order && order.cancelled_at)) && !isPaymentExpired;
  const isRejected = (status === 'rejected' && !isPaymentExpired) || isCancelled;
  const getPaymentChipInfo = (ps) => {
    switch (ps) {
      case 'paid': return { label: 'Pago Confirmado', color: 'success' };
      case 'expired': return { label: 'Pago Expirado', color: 'error' };
      case 'pending':
      default: return { label: 'Procesando Pago', color: 'warning' };
    }
  };
  const paymentInfo = getPaymentChipInfo(paymentStatus);
  // Always return at least the payment chip so payment_status is visible independently
  const base = [{ key: 'pago', label: paymentInfo.label, color: paymentInfo.color, active: true }];
  if (isRejected) {
    base.push({ key: 'rechazado', label: isCancelled ? 'Cancelado' : 'Rechazado', active: true, color: 'error' });
    base.push({ key: 'en_transito', label: 'En Transito', active: false, color: 'default' });
    base.push({ key: 'entregado', label: 'Entregado', active: false, color: 'default' });
  }
  return base;
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

  it('si status=cancelled y payment_status=expired mostrar solo Pago Expirado (no Cancelado/Rechazado)', () => {
    const chips = getStatusChips('cancelled', 'expired', { order_id: 'o6' });
    const pago = chips.find(c => c.key === 'pago');
    const rej = chips.find(c => c.key === 'rechazado');
    expect(pago.label).toBe('Pago Expirado');
    expect(rej).toBeUndefined();
  });
});
