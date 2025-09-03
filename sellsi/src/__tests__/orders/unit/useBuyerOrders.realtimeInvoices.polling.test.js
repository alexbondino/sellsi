// Tests B-3 (realtime invoice insert) y B-4 (polling fallback) aislados del hook real.
// En lugar de montar el hook completo (muchas dependencias), recreamos una versión mínima
// de la lógica relevante: inserción realtime de invoices y polling de payment_status.

jest.useFakeTimers();

function createBuyerOrdersMini({ pollInterval = 15000 } = {}) {
  let orders = [];
  let lastRealtime = Date.now();
  let pollFn = null;
  const listeners = { invoices: [], paymentStatus: [] };

  const setOrders = (updater) => {
    const next = typeof updater === 'function' ? updater(orders) : updater;
    orders = next;
  };

  const startPolling = (fetchStatuses) => {
    if (pollFn) clearInterval(pollFn);
    pollFn = setInterval(async () => {
      const hasPending = orders.some(o => o.is_payment_order && o.payment_status !== 'paid');
      if (!hasPending) return;
      if (Date.now() - lastRealtime < pollInterval * 2) return;
      const statuses = await fetchStatuses();
      if (Array.isArray(statuses)) {
        setOrders(prev => prev.map(o => {
          const st = statuses.find(s => s.id === o.order_id);
          return st ? { ...o, payment_status: st.payment_status } : o;
        }));
      }
    }, pollInterval);
  };

  return {
    init(initial) { orders = initial; },
    getOrders: () => orders.map(o => ({ ...o })),
    triggerInvoiceInsert(row) {
      // Simula callback realtime de invoices_meta
      try {
        if (!row?.order_id || !row?.supplier_id || !row?.path) return;
        setOrders(prev => prev.map(p => {
          if (p.order_id !== row.order_id || p.supplier_id !== row.supplier_id) return p;
          if (!Array.isArray(p.items)) return p;
          const already = p.items.some(it => it.invoice_path === row.path);
            if (already) return p;
          return { ...p, items: p.items.map(it => ({ ...it, invoice_path: it.invoice_path || row.path })) };
        }));
        lastRealtime = Date.now();
      } catch(_) {}
    },
    startPolling,
    simulateTime(ms) { jest.advanceTimersByTime(ms); },
    dispose(){ if (pollFn) clearInterval(pollFn); }
  };
}

describe('useBuyerOrders mini - B-3 invoices & B-4 polling', () => {
  afterEach(() => { jest.clearAllTimers(); });

  it('B-3 inserta invoice_path en items correctos vía evento realtime', () => {
    const mini = createBuyerOrdersMini();
    mini.init([
      { order_id: 'o1', supplier_id: 's1', is_payment_order: true, payment_status: 'paid', items: [{ product_id:'p1' }] },
      { order_id: 'o1', supplier_id: 's2', is_payment_order: true, payment_status: 'paid', items: [{ product_id:'p2' }] }
    ]);
    mini.triggerInvoiceInsert({ order_id:'o1', supplier_id:'s2', path:'/inv/s2.pdf' });
    const ords = mini.getOrders();
    const target = ords.find(o => o.supplier_id === 's2');
    expect(target.items[0].invoice_path).toBe('/inv/s2.pdf');
    const other = ords.find(o => o.supplier_id === 's1');
    expect(other.items[0].invoice_path).toBeUndefined();
  });

  it('B-4 polling actualiza payment_status cuando no hay realtime reciente', async () => {
    const mini = createBuyerOrdersMini({ pollInterval: 5000 });
    mini.init([
      { order_id: 'oX', supplier_id:'s1', is_payment_order:true, payment_status:'pending', items:[] }
    ]);
    const fetchStatuses = jest.fn().mockResolvedValue([{ id:'oX', payment_status:'paid' }]);
    mini.startPolling(fetchStatuses);
    // Avanzar 2 * intervalo para forzar condición de "no realtime" (lastRealtime inicial = now)
    mini.simulateTime(10000); // 2 intervalos -> poll ejecutado al menos 2 veces
    // Esperar microtasks del mock
    await Promise.resolve();
    const ords = mini.getOrders();
    expect(fetchStatuses).toHaveBeenCalled();
    expect(ords[0].payment_status).toBe('paid');
    mini.dispose();
  });

  it('B-4 NO actualiza si hubo realtime reciente (<2 intervalos)', async () => {
    const mini = createBuyerOrdersMini({ pollInterval: 5000 });
    mini.init([
      { order_id: 'oY', supplier_id:'s1', is_payment_order:true, payment_status:'pending', items:[] }
    ]);
    const fetchStatuses = jest.fn().mockResolvedValue([{ id:'oY', payment_status:'paid' }]);
    mini.startPolling(fetchStatuses);
    // Disparamos realtime update artificial para refrescar lastRealtime
    mini.triggerInvoiceInsert({ order_id:'oY', supplier_id:'s1', path:'/inv/x.pdf' });
    // Avanzamos un intervalo completo, debería saltarse por realtime reciente
    mini.simulateTime(5000);
    await Promise.resolve();
    expect(fetchStatuses).not.toHaveBeenCalled();
    mini.dispose();
  });
});
