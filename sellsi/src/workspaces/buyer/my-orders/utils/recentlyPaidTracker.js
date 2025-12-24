export const HIGHLIGHT_MS = 12000;

export function createRecentlyPaidTracker() {
  const prevPaidRef = new Set();
  let recentlyPaid = new Set();
  const timeouts = new Map();

  const applyOrders = (orders) => {
    const nextPrev = new Set();
    (orders || []).forEach((o) => {
      if (o.payment_status === 'paid' && !prevPaidRef.has(o.order_id)) {
        if (!recentlyPaid.has(o.order_id)) {
          const clone = new Set(recentlyPaid);
          clone.add(o.order_id);
          recentlyPaid = clone;
        }
        if (!timeouts.has(o.order_id)) {
          const t = setTimeout(() => {
            if (recentlyPaid.has(o.order_id)) {
              const clone = new Set(recentlyPaid);
              clone.delete(o.order_id);
              recentlyPaid = clone;
            }
            timeouts.delete(o.order_id);
          }, HIGHLIGHT_MS);
          timeouts.set(o.order_id, t);
        }
      }
      if (o.payment_status === 'paid') nextPrev.add(o.order_id);
    });
    prevPaidRef.clear();
    nextPrev.forEach((v) => prevPaidRef.add(v));
    return { recentlyPaid: new Set(recentlyPaid) };
  };

  const getRecentlyPaid = () => new Set(recentlyPaid);

  const dispose = () => {
    for (const t of timeouts.values()) clearTimeout(t);
    timeouts.clear();
    recentlyPaid = new Set();
    prevPaidRef.clear();
  };

  return { applyOrders, getRecentlyPaid, dispose };
}
