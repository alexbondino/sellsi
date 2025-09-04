import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../../../../services/user';
import { supabase } from '../../../../services/supabase';
import { isUUID } from '../../../orders/shared/validation';
import { splitOrderBySupplier } from '../../../orders/shared/splitOrderBySupplier';

/**
 * Hook para manejar los pedidos de un comprador.
 * Este hook obtiene únicamente los pedidos que ya no están en estado 'pending'.
 * @param {string | null} buyerId - ID del comprador.
 * @returns {Object} El estado y las funciones para manejar los pedidos.
 */
export const useBuyerOrders = buyerId => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const DEBUG_BUYER_ORDERS = false; // activar para ver logs diagnósticos (temporal para tracing ETA)
  const POLL_INTERVAL_MS = 15000;
  const pollRef = useRef(null);
  const lastRealtimeRef = useRef(Date.now());
  const ordersChannelRef = useRef(null);
  const invoicesChannelRef = useRef(null);

  const mergeAndSplit = useCallback((payment) => {
    // 1. Ordenar por fecha
    const ordered = payment.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    // 2. Para cada payment order aplicar split derivado.
    const parts = ordered.flatMap(o => {
      // Parse supplier meta early to allow split to pick up statuses; fallback overlay after
      let meta = o.supplier_parts_meta || o.supplierPartsMeta || null;
      if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = null; } }
      const generated = splitOrderBySupplier({
        ...o,
        supplier_parts_meta: meta,
        id: o.order_id || o.id
      });
      // Ensure each part status reflects supplier meta even if split missed
      if (meta && typeof meta === 'object') {
        generated.forEach(p => {
          const node = meta[p.supplier_id];
          if (node && node.status && p.status !== node.status) {
            p.status = node.status; // override
          }
        });
      }
      return generated;
    });
    // 3. Rule: Si sólo hay una parte para la order, dejamos esa (sin synthetic flag is_supplier_part=false)
    // splitOrderBySupplier ya maneja esto.
    // 4. Dedupe defensivo (por si llega duplicada la order completa). Clave: parent_order_id+supplier_id (o solo parent).
    const map = new Map();
    for (const p of parts) {
      const key = p.parent_order_id + (p.supplier_id ? `-${p.supplier_id}` : '');
      if (!map.has(key)) map.set(key, p);
    }
    const result = Array.from(map.values()).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    if (DEBUG_BUYER_ORDERS) console.log('[useBuyerOrders] parts', result.length);
    return result;
  }, [DEBUG_BUYER_ORDERS]);

  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId || !isUUID(buyerId)) {
      // Aseguramos que no quede spinner infinito si buyerId aún no está listo.
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
  const payment = await orderService.getPaymentOrdersForBuyer(buyerId, filters).catch(e => {
          console.error('[buyerOrders][paymentOrders] error', e);
          setError(prev => prev || e.message || 'Error cargando payment orders');
          return [];
        });
      if (DEBUG_BUYER_ORDERS) {
          console.log('[buyerOrders][raw payment orders]', payment.map(p => ({ id: p.order_id, status: p.status, eta: p.estimated_delivery_date })));
        }
  // Mapa rápido de payment orders para fallback de ETA en parts
  const paymentMap = new Map(payment.map(p => [p.order_id || p.id, p]));
      // === Enriquecer con facturas (invoices_meta) ===
      let invoiceMap = Object.create(null); // { order_id: { supplier_id: path } }
      try {
        const orderIds = Array.from(new Set(payment.map(o => o.order_id || o.id).filter(Boolean)));
        if (orderIds.length) {
          const { data: invoiceRows, error: invErr } = await supabase
            .from('invoices_meta')
            .select('order_id,supplier_id,path,created_at')
            .in('order_id', orderIds);
          if (!invErr && Array.isArray(invoiceRows)) {
            for (const row of invoiceRows) {
              if (!row?.order_id || !row?.supplier_id || !row?.path) continue;
              const oId = row.order_id; const sId = row.supplier_id; const pth = row.path;
              if (!invoiceMap[oId]) invoiceMap[oId] = Object.create(null);
              // Mantener la última (por created_at) – si llega duplicada, reemplazar sólo si nueva fecha > anterior
              if (!invoiceMap[oId][sId]) {
                invoiceMap[oId][sId] = { path: pth, created_at: row.created_at }; 
              } else {
                const prev = invoiceMap[oId][sId];
                if ((new Date(row.created_at || 0)) > (new Date(prev.created_at || 0))) {
                  invoiceMap[oId][sId] = { path: pth, created_at: row.created_at };
                }
              }
            }
          }
        }
      } catch (invE) {
        console.warn('[buyerOrders] invoices_meta enrichment falló:', invE?.message || invE);
      }
      // Diagnóstico precios 0 (sobre payment orders)
      payment.forEach(o => {
        (o.items||[]).forEach(it => {
          if (it.price_at_addition === 0 && it.quantity > 0) {
            // eslint-disable-next-line no-console
            console.warn('[buyerOrders][WARN] price_at_addition=0', { order_id: o.order_id, product_id: it.product_id, quantity: it.quantity, pricing_warning: it.pricing_warning });
          }
        });
      });
      const split = mergeAndSplit(payment);
      if (DEBUG_BUYER_ORDERS) {
        console.log('[buyerOrders][after split]', split.map(p => ({ id: p.order_id, supplier: p.supplier_id, status: p.status, partEta: p.estimated_delivery_date })));
      }
      const enriched = split.map(part => {
        try {
          const oId = part.order_id;
          const sId = part.supplier_id;
          const maybe = invoiceMap[oId]?.[sId];
          // Fallback ETA: si la part no trae estimated_delivery_date y la order base sí, propagar
          if (!part.estimated_delivery_date) {
            const base = paymentMap.get(oId);
            if (base?.estimated_delivery_date) part.estimated_delivery_date = base.estimated_delivery_date;
          }
          if (maybe?.path && Array.isArray(part.items)) {
            return {
              ...part,
              items: part.items.map(it => ({ ...it, invoice_path: it.invoice_path || maybe.path }))
            };
          }
        } catch(_) {}
        return part;
      });
      if (DEBUG_BUYER_ORDERS) {
        console.log('[buyerOrders][final enriched]', enriched.map(p => ({ id: p.order_id, supplier: p.supplier_id, status: p.status, eta: p.estimated_delivery_date })));
      }
      setOrders(enriched);
      if (split.length === 0 && !error) {
        // Pista diagnóstica rápida en consola.
        console.warn('[buyerOrders] Resultado vacío tras merge. Verificar flags, RLS o errores previos en consola.');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [buyerId, mergeAndSplit, error]);

  // Initial load
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime subscription for payment orders (payment_status updates)
  useEffect(() => {
    if (!buyerId || !isUUID(buyerId)) return;
    // Evitar resuscribir si ya hay canal (React StrictMode dobles mounts en dev)
    if (!ordersChannelRef.current) {
      ordersChannelRef.current = orderService.subscribeToBuyerPaymentOrders(buyerId, payload => {
      lastRealtimeRef.current = Date.now();
      if (payload.eventType === 'UPDATE') {
        const row = payload.new;
        setOrders(prev => prev.map(o => o.order_id === row.id ? { ...o, payment_status: row.payment_status, updated_at: row.updated_at } : o));
      } else if (payload.eventType === 'INSERT') {
        // Podría ser nueva payment order: refetch ligero
        fetchOrders();
      }
      });
    }
    if (!invoicesChannelRef.current) {
      invoicesChannelRef.current = supabase
        .channel(`invoices_meta_buyer_${buyerId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices_meta' }, (payload) => {
          try {
            const row = payload.new;
            if (!row?.order_id || !row?.supplier_id || !row?.path) return;
            setOrders(prev => prev.map(p => {
              if (p.order_id !== row.order_id || p.supplier_id !== row.supplier_id) return p;
              if (!Array.isArray(p.items)) return p;
              const already = p.items.some(it => it.invoice_path === row.path);
              if (already) return p;
              return {
                ...p,
                items: p.items.map(it => ({ ...it, invoice_path: it.invoice_path || row.path }))
              };
            }));
          } catch (_) {}
        })
        .subscribe();
    }
    return () => {
      try {
        if (ordersChannelRef.current) { ordersChannelRef.current(); ordersChannelRef.current = null; }
      } catch(_) {}
      try {
        if (invoicesChannelRef.current) { supabase.removeChannel(invoicesChannelRef.current); invoicesChannelRef.current = null; }
      } catch(_) {}
    };
  }, [buyerId, fetchOrders]);

  // Poll fallback if realtime silent and there are pending payments
  useEffect(() => {
    if (!buyerId || !isUUID(buyerId)) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const hasPending = orders.some(o => o.is_payment_order && o.payment_status !== 'paid');
      if (!hasPending) return; // stop polling until a pending exists
      if (Date.now() - lastRealtimeRef.current < POLL_INTERVAL_MS * 2) return; // recent realtime
      try {
        const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
        if (Array.isArray(statuses)) {
          setOrders(prev => prev.map(o => {
            const st = statuses.find(s => s.id === o.order_id);
            return st ? { ...o, payment_status: st.payment_status, status: o.status } : o;
          }));
        }
      } catch(_) {}
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [buyerId, orders]);

  const getProductImage = product => {
    if (!product) return null;
    if (product.thumbnails) {
      try {
        const thumbnailData =
          typeof product.thumbnails === 'string'
            ? JSON.parse(product.thumbnails)
            : product.thumbnails;
        if (thumbnailData?.mobile) return thumbnailData.mobile;
      } catch (e) {
        console.warn('Error parsing thumbnails:', e);
      }
    }
    return (
      product.thumbnail_url || product.image_url || '/placeholder-product.jpg'
    );
  };

  const getStatusDisplayName = status => {
    const statusMap = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      in_transit: 'En Tránsito',
      delivered: 'Entregado',
      paid: 'Pagado',
      cancelled: 'Cancelado',
      expired: 'Expirado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = status => {
    const colorMap = {
      pending: 'warning',
      accepted: 'info',
      rejected: 'error',
      in_transit: 'secondary',
      delivered: 'success',
      paid: 'primary',
      cancelled: 'default',
      expired: 'default',
    };
    return colorMap[status] || 'default';
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  return { orders, loading, error, fetchOrders, getProductImage, getStatusDisplayName, getStatusColor, formatDate, formatCurrency };
};
