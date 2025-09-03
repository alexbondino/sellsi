// Test aislado de la lógica de highlight "Pago Confirmado" (B-1)
// Se replica la lógica del efecto en BuyerOrders para evitar dependencias de UI/MUI.

const HIGHLIGHT_MS = 12000;

// Implementación equivalente simplificada del efecto:
// Mantiene un Set prevPaidRef y un Set recentlyPaid. Para cada orden con payment_status 'paid'
// que no estaba previamente, la agrega a recentlyPaid y programa su eliminación en 12s.
function createRecentlyPaidTracker(){
  const prevPaidRef = new Set();
  let recentlyPaid = new Set();
  const timeouts = new Map();

  const applyOrders = (orders) => {
    const nextPrev = new Set(prevPaidRef);
    (orders || []).forEach(o => {
      if (o.payment_status === 'paid' && !prevPaidRef.has(o.order_id)) {
        // nuevo pago confirmado
        if(!recentlyPaid.has(o.order_id)){
          const clone = new Set(recentlyPaid); clone.add(o.order_id); recentlyPaid = clone;
        }
        // programar remoción si no existe
        if(!timeouts.has(o.order_id)){
          const t = setTimeout(() => {
            if(recentlyPaid.has(o.order_id)){
              const clone = new Set(recentlyPaid); clone.delete(o.order_id); recentlyPaid = clone;
            }
            timeouts.delete(o.order_id);
          }, HIGHLIGHT_MS);
          timeouts.set(o.order_id, t);
        }
      }
      if (o.payment_status === 'paid') nextPrev.add(o.order_id);
    });
    // actualizar referencia histórica
    prevPaidRef.clear();
    nextPrev.forEach(v => prevPaidRef.add(v));
    return { recentlyPaid: new Set(recentlyPaid) };
  };

  return { applyOrders, getRecentlyPaid: () => new Set(recentlyPaid) };
}

jest.useFakeTimers();

describe('BuyerOrders recentlyPaid highlight (B-1)', () => {
  it('agrega id al Set cuando pasa a paid y lo elimina tras 12s', () => {
    const tracker = createRecentlyPaidTracker();
    const baseOrder = { order_id:'o1', payment_status:'pending' };

    // Primer render (pending) -> no highlight
    let r = tracker.applyOrders([baseOrder]);
    expect(r.recentlyPaid.size).toBe(0);

    // Segundo render transición a paid
    const paidOrder = { ...baseOrder, payment_status:'paid' };
    r = tracker.applyOrders([paidOrder]);
    expect(r.recentlyPaid.has('o1')).toBe(true);

    // Avanzar 11.9s -> sigue presente
    jest.advanceTimersByTime(11900);
    expect(tracker.getRecentlyPaid().has('o1')).toBe(true);

    // Avanzar el resto hasta 12s => removido
    jest.advanceTimersByTime(200);
    expect(tracker.getRecentlyPaid().has('o1')).toBe(false);
  });

  it('no reprograma timeout si ya estaba agendado', () => {
    const tracker = createRecentlyPaidTracker();
    const paidOrder = { order_id:'o2', payment_status:'paid' };
    tracker.applyOrders([paidOrder]);
    // Reaplicar mismas órdenes múltiples veces no debe duplicar ni reiniciar highlight
    jest.advanceTimersByTime(6000);
    tracker.applyOrders([paidOrder]);
    // Avanzar restante 6s (total 12s) debe remover
    jest.advanceTimersByTime(6000);
    expect(tracker.getRecentlyPaid().has('o2')).toBe(false);
  });
});
