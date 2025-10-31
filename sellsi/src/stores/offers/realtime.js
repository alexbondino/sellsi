// Encapsulación de lógica realtime para buyer/supplier.
export function createBuyerSubscription({ supabase, buyerId, get, set }) {
  const subscription = supabase
    .channel('buyer-offers')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'offers',
      filter: `buyer_id=eq.${buyerId}`
    }, () => {
      try { get().loadBuyerOffers(buyerId, { forceNetwork: true }); } catch(_) {}
    })
    .subscribe();
  const subs = get()._subscriptions || [];
  subs.push(subscription);
  set({ _subscriptions: subs });
  return subscription;
}

export function createSupplierSubscription({ supabase, supplierId, get, set }) {
  const subscription = supabase
    .channel('supplier-offers')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'offers',
      filter: `supplier_id=eq.${supplierId}`
    }, () => {
      try { get().loadSupplierOffers(supplierId, { forceNetwork: true }); } catch(_) {}
    })
    .subscribe();
  const subs = get()._subscriptions || [];
  subs.push(subscription);
  set({ _subscriptions: subs });
  return subscription;
}
