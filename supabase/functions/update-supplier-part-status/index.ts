// @ts-nocheck
// Edge Function: update-supplier-part-status
// Actualiza el estado de una parte de orden (supplier) dentro de orders.supplier_parts_meta (Opción A 2.0)
// Entrada JSON: { order_id, supplier_id, new_status, estimated_delivery_date?, rejected_reason? }
// Reglas: valida transición, recorta history a 10, timestamps dispatched_at/delivered_at.
// Auth: requiere bearer token de un usuario cuyo uuid == supplier_id objetivo (proveedor dueño)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withMetrics } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const allowedTransitions: Record<string, Set<string>> = {
  pending: new Set(['accepted','rejected']),
  // Permitimos cancelar una parte que ya fue aceptada pero aún no despachada
  accepted: new Set(['in_transit', 'cancelled' /*,'rejected'*/]), // habilitar 'rejected' si negocio lo permite
  in_transit: new Set(['delivered','cancelled']),
  delivered: new Set(),
  rejected: new Set(),
  cancelled: new Set()
};
function canTransition(from: string, to: string) { return allowedTransitions[from]?.has(to) || false; }

serve(req => withMetrics('update-supplier-part-status', req, async () => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed'}), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  try {
    // Auth header (as supplier user)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing bearer token'}), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured'}), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader }}});

    let body: any = null;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON'}), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}); }

  const { order_id, supplier_id, new_status, estimated_delivery_date, rejected_reason, cancel_reason } = body || {};
    if (!order_id || !supplier_id || !new_status) {
      return new Response(JSON.stringify({ error: 'order_id, supplier_id, new_status required'}), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Obtener usuario autenticado
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized'}), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const authUser = userData.user;
    if (authUser.id !== supplier_id) {
      return new Response(JSON.stringify({ error: 'FORBIDDEN_SUPPLIER_MISMATCH'}), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Leer orden (traer meta + lista items para validación de membership opcional)
    const { data: orderRow, error: ordErr } = await supabase
      .from('orders')
      .select('id, user_id, supplier_parts_meta, items, payment_status')
      .eq('id', order_id)
      .limit(1)
      .maybeSingle();
    if (ordErr || !orderRow) {
      return new Response(JSON.stringify({ error: 'ORDER_NOT_FOUND'}), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Validación extra: si meta null => no inicializada (no debería ocurrir si webhook ya lo hizo) -> inicializar nodo si supplier aparece en items
    let meta: Record<string, any> = orderRow.supplier_parts_meta || {};
    if (meta === null) meta = {};

    // Confirmar supplier pertenece a la orden (buscando en items) si aún no existe nodo
    if (!meta[supplier_id]) {
      let items: any[] = [];
      try {
        const raw = orderRow.items;
        if (Array.isArray(raw)) items = raw; else if (typeof raw === 'string') items = JSON.parse(raw); else if (raw && typeof raw === 'object') items = raw.items || [];
      } catch { items = []; }
      const belongs = items.some(it => (it.supplier_id || it.supplierId || it.product?.supplier_id) === supplier_id);
      if (!belongs) {
        return new Response(JSON.stringify({ error: 'SUPPLIER_NOT_IN_ORDER'}), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }
      // Inicializar nodo en pending
      const nowIso = new Date().toISOString();
      meta[supplier_id] = { status: 'pending', history: [{ at: nowIso, from: null, to: 'pending' }] };
    }

    const node = meta[supplier_id];
    const fromStatus = node.status || 'pending';
    const toStatus = String(new_status).trim();

    if (fromStatus === toStatus) {
      return new Response(JSON.stringify({ success: true, unchanged: true, status: fromStatus }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    if (!canTransition(fromStatus, toStatus)) {
      return new Response(JSON.stringify({ error: 'INVALID_TRANSITION', from: fromStatus, to: toStatus }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const now = new Date().toISOString();
    const history = Array.isArray(node.history) ? node.history.slice(-9) : []; // dejamos espacio para nuevo evento
    history.push({ at: now, from: fromStatus, to: toStatus });

    node.status = toStatus;
    node.history = history;
    if (toStatus === 'in_transit' && !node.dispatched_at) node.dispatched_at = now;
    if (toStatus === 'delivered' && !node.delivered_at) node.delivered_at = now;
    if (toStatus === 'rejected' && rejected_reason) node.rejected_reason = String(rejected_reason).slice(0,500);
    if (toStatus === 'cancelled' && (cancel_reason || rejected_reason)) {
      // guardar motivo de cancelación si viene (aceptamos cancel_reason o reutilizamos rejected_reason)
      node.cancel_reason = String(cancel_reason || rejected_reason || '').slice(0,500);
    }
    if (estimated_delivery_date) node.estimated_delivery_date = estimated_delivery_date;

    meta[supplier_id] = node;

    // Persistir: re-escribimos blob completo (sencillo y atómico suficiente dado tamaño pequeño)
    const { error: updErr } = await supabase
      .from('orders')
      .update({ supplier_parts_meta: meta, updated_at: now })
      .eq('id', order_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: 'UPDATE_FAILED', details: updErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 📊 Log específico para rechazos parciales (debugging de restauración de stock)
    if (toStatus === 'rejected' && orderRow.payment_status === 'paid') {
      console.log(`🔄 Supplier ${supplier_id} rejected their part of order ${order_id} after payment - partial stock restoration should be triggered automatically`);
      console.log(`📋 Rejection details:`, {
        orderId: order_id,
        supplierId: supplier_id,
        paymentStatus: orderRow.payment_status,
        rejectionReason: rejected_reason || 'No reason provided'
      });
    }

    // (Opc) Insertar notificación simple
    if (orderRow.user_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: orderRow.user_id,
          supplier_id: supplier_id,
          order_id: order_id,
          type: 'supplier_part_status',
          context_section: 'supplier_part',
          title: 'Estado actualizado',
          body: `Parte proveedor pasó de ${fromStatus} a ${toStatus}`,
          metadata: { supplier_id, from: fromStatus, to: toStatus }
        });
      } catch (_e) { /* silencioso */ }
    }

    return new Response(JSON.stringify({ success: true, order_id, supplier_id, from: fromStatus, to: toStatus, node }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  } catch (e) {
    console.error('update-supplier-part-status error', e);
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR', message: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
}));
