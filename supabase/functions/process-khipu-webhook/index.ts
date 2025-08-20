// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withMetrics } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Verificar firma HMAC-SHA256 Base64 de Khipu
// ============================================================================
async function verifyKhipuSignature(
  requestBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('s='));

    if (!timestampPart || !signaturePart) {
      console.error('❌ Firma incompleta: falta t= o s=');
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];
    const stringToSign = `${timestamp}.${requestBody}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(stringToSign);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return (
      signature.replace(/=*$/, '') === expectedSignature.replace(/=*$/, '')
    );
  } catch (error) {
    console.error('❌ Error verificando firma de Khipu:', error);
    return false;
  }
}

// ============================================================================
// Webhook principal
// ============================================================================
serve((req: Request) => withMetrics('process-khipu-webhook', req, async () => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBodyString = await req.text();
    const signatureHeader = req.headers.get('X-Khipu-Signature');
    const khipuWebhookSecret = Deno.env.get('KHIPU_SECRET_KEY');

    if (!signatureHeader || !khipuWebhookSecret) {
      console.error('❌ Falta cabecera de firma o secreto');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const isValidSignature = await verifyKhipuSignature(
      requestBodyString,
      signatureHeader,
      khipuWebhookSecret
    );

    if (!isValidSignature) {
      console.error('❌ Firma de webhook inválida.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let khipuPayload: Record<string, any> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(requestBodyString);
      khipuPayload = Object.fromEntries(formData.entries());
    } else if (contentType.includes('application/json')) {
      try {
        khipuPayload = JSON.parse(requestBodyString);
      } catch (e) {
        console.error('❌ Error parseando JSON del cuerpo:', e);
        return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      console.warn('⚠️ Tipo de contenido no soportado:', contentType);
      return new Response(
        JSON.stringify({ error: 'Unsupported content-type' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📦 Payload procesado:', khipuPayload);

    // ========================================================================
    // EXTRAER orderId DESDE subject
    // ========================================================================
    const subject: string = khipuPayload.subject || '';
    const orderIdMatch = subject.match(/#([0-9a-fA-F-]{36})/);
    let orderId = orderIdMatch ? orderIdMatch[1] : null;
    const paymentIdFromPayload = khipuPayload.payment_id || khipuPayload.paymentId || null;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fallback: buscar order por khipu_payment_id si no se pudo parsear
    if (!orderId && paymentIdFromPayload) {
      const { data: lookup, error: lookupErr } = await supabase
        .from('orders')
        .select('id')
        .eq('khipu_payment_id', paymentIdFromPayload)
        .limit(1);
      if (!lookupErr && lookup && lookup.length) {
        orderId = lookup[0].id;
        console.log('🔍 Order encontrada por khipu_payment_id fallback', orderId);
      }
    }

    if (!orderId) {
      console.warn('⚠️ No se pudo asociar pago a una orden (sin UUID parseable ni fallback).');
      return new Response(JSON.stringify({ success: false, reason: 'order_not_found' }), { status: 200, headers: corsHeaders });
    }

    console.log(`💰 Procesando pago exitoso (o idempotente) para la orden: ${orderId}`);

    // ========================================================================
    // ACTUALIZAR EN SUPABASE
    // ========================================================================
    const paidAt = khipuPayload.paid_at || khipuPayload.paidAt || new Date().toISOString();

    // Idempotent update: solo si no está ya 'paid'
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        khipu_payment_id: paymentIdFromPayload,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .neq('payment_status', 'paid')
      .select();

    if (error) {
      console.error('❌ Error al actualizar la orden:', error);
    } else {
      console.log('✅ Orden actualizada:', data);
    }

    // ========================================================================
    // MATERIALIZACIÓN DUAL / SPLIT (nuevo)
    // ========================================================================
    try {
      const SPLIT_MODE = (Deno.env.get('SPLIT_MODE') || 'legacy').toLowerCase(); // legacy | dual | split
      const { data: orderRows, error: fetchOrderErr } = await supabase
        .from('orders')
        .select('id, user_id, items, total, created_at, shipping, split_status')
        .eq('id', orderId)
        .limit(1);
      if (fetchOrderErr) {
        console.error('❌ No se pudo leer la orden para materializar:', fetchOrderErr);
      } else if (orderRows && orderRows.length > 0) {
        const ord = orderRows[0] as any;
        const buyerId: string = ord.user_id;
        // Parse seguro
        let rawItems: any[] = [];
        try {
          if (Array.isArray(ord.items)) rawItems = ord.items;
          else if (typeof ord.items === 'string') rawItems = JSON.parse(ord.items);
          else if (ord.items && typeof ord.items === 'object') rawItems = Array.isArray(ord.items.items) ? ord.items.items : [ord.items];
        } catch(_) { rawItems = []; }

        const normItems = rawItems.map((it, idx) => {
          const product_id = it.product_id || it.productid || it.id || null;
          const supplier_id = it.supplier_id || it.supplierId || null;
          const quantity = Number(it.quantity || 1);
          const price_at_addition = Number(it.price_at_addition || it.price || 0);
          if (!product_id || !supplier_id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price_at_addition)) {
            console.warn('⚠️ Item inválido descartado', { idx, product_id, supplier_id });
            return null;
          }
          const dtRaw = String(it.document_type || it.documentType || '').toLowerCase();
          const document_type = (dtRaw === 'boleta' || dtRaw === 'factura') ? dtRaw : 'ninguno';
          return { product_id, supplier_id, quantity, price_at_addition, price_tiers: it.price_tiers || it.priceTiers || null, document_type };
        }).filter(Boolean);

        // ===== LEGACY MATERIALIZATION (si legacy o dual) =====
        if (SPLIT_MODE === 'legacy' || SPLIT_MODE === 'dual') {
          try {
            const totalShippingLegacy = Number(ord.shipping || 0);
            const shippingCurrency = 'CLP';
            const { data: activeCart } = await supabase
              .from('carts')
              .select('cart_id, status, shipping_total, shipping_currency')
              .eq('user_id', buyerId)
              .eq('status', 'active')
              .maybeSingle();
            let legacyCartId: string | null = null;
            if (activeCart?.cart_id) {
              const cartUpdate: any = { status: 'pending', updated_at: new Date().toISOString() };
              if ((activeCart.shipping_total == null || activeCart.shipping_total === 0) && totalShippingLegacy > 0) {
                cartUpdate.shipping_total = totalShippingLegacy;
                cartUpdate.shipping_currency = shippingCurrency;
              }
              const { data: upd } = await supabase
                .from('carts')
                .update(cartUpdate)
                .eq('cart_id', activeCart.cart_id)
                .select('cart_id')
                .single();
              legacyCartId = upd?.cart_id || activeCart.cart_id;
            } else {
              const insertLegacy: any = { user_id: buyerId, status: 'pending' };
              if (totalShippingLegacy > 0) { insertLegacy.shipping_total = totalShippingLegacy; insertLegacy.shipping_currency = shippingCurrency; }
              const { data: newLegacy } = await supabase
                .from('carts')
                .insert(insertLegacy)
                .select('cart_id')
                .single();
              legacyCartId = newLegacy?.cart_id || null;
            }
            if (legacyCartId) {
              // Reset items y volver a insertar
              await supabase.from('cart_items').delete().eq('cart_id', legacyCartId);
              for (const it of normItems) {
                await supabase.from('cart_items').insert({
                  cart_id: legacyCartId,
                  product_id: it.product_id,
                  quantity: it.quantity,
                  price_at_addition: it.price_at_addition,
                  price_tiers: it.price_tiers,
                  document_type: it.document_type
                });
              }
              // Vincular orders->cart si no estaba
              try {
                await supabase.from('orders')
                  .update({ cart_id: legacyCartId, updated_at: new Date().toISOString() })
                  .eq('id', orderId)
                  .is('cart_id', null);
              } catch(_) {}
            }
          } catch (legacyErr) {
            console.error('⚠️ Error en materialización legacy:', legacyErr);
          }
        }

        // ===== SPLIT MATERIALIZATION =====
        if (SPLIT_MODE === 'dual' || SPLIT_MODE === 'split') {
          if (ord.split_status !== 'split') {
            // Idempotencia optimista (no transaction available; rely on update+check)
            try {
              await supabase.from('orders')
                .update({ split_status: 'split', updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .eq('split_status', ord.split_status);
            } catch(markErr) {
              console.error('⚠️ No se pudo marcar split_status:', markErr);
            }
            // Agrupar por supplier
            const groupMap = new Map<string, any[]>();
            normItems.forEach(it => {
              if (!groupMap.has(it.supplier_id)) groupMap.set(it.supplier_id, []);
              groupMap.get(it.supplier_id)!.push(it);
            });
            // Subtotales + shipping prorrateado
            const supplierEntries = Array.from(groupMap.entries());
            const subtotals = supplierEntries.map(([sid, arr]) => ({ sid, subtotal: arr.reduce((s,i)=>s + i.price_at_addition*i.quantity,0) }));
            const totalSubtotal = subtotals.reduce((s,o)=>s+o.subtotal,0) || 1;
            const totalShipping = Number(ord.shipping || 0);
            let acc = 0;
            const shippingAlloc = subtotals.map((o,idx) => {
              if (idx === subtotals.length -1) return { sid: o.sid, shipping: Math.max(0, totalShipping - acc) };
              const share = Math.round(totalShipping * (o.subtotal / totalSubtotal));
              acc += share; return { sid: o.sid, shipping: share };
            });
            const shippingMap = new Map(shippingAlloc.map(a => [a.sid, a.shipping]));
            // Checar carts existentes (idempotencia)
            const { data: existing } = await supabase
              .from('carts')
              .select('cart_id, supplier_id')
              .eq('payment_order_id', orderId);
            const existingSet = new Set((existing||[]).map(r => r.supplier_id));
            for (const { sid, subtotal } of subtotals) {
              if (existingSet.has(sid)) continue; // ya creado
              const ship = shippingMap.get(sid) || 0;
              const { data: newCart, error: splitErr } = await supabase
                .from('carts')
                .insert({
                  user_id: buyerId,
                  status: 'pending',
                  payment_order_id: orderId,
                  supplier_id: sid,
                  shipping_total: ship > 0 ? ship : null,
                  shipping_currency: ship > 0 ? 'CLP' : null
                })
                .select('cart_id')
                .single();
              if (splitErr) {
                console.error('❌ Error creando cart split supplier:', splitErr);
                continue;
              }
              const cartId = newCart?.cart_id;
              if (!cartId) continue;
              for (const it of groupMap.get(sid) || []) {
                await supabase.from('cart_items').insert({
                  cart_id: cartId,
                  product_id: it.product_id,
                  quantity: it.quantity,
                  price_at_addition: it.price_at_addition,
                  price_tiers: it.price_tiers,
                  document_type: it.document_type
                });
              }
            }
          }
        }

        // ===== INVENTARIO & VENTAS (idempotente por product_sales) =====
        for (const it of normItems) {
          const { data: prodRows } = await supabase
            .from('products')
            .select('productqty')
            .eq('productid', it.product_id)
            .limit(1);
          if (prodRows?.length) {
            const currentQty = Number(prodRows[0].productqty || 0);
            const newQty = Math.max(0, currentQty - it.quantity);
            await supabase.from('products').update({ productqty: newQty, updateddt: new Date().toISOString() }).eq('productid', it.product_id);
          }
          if (it.supplier_id) {
            const amount = Math.max(0, it.price_at_addition * it.quantity);
            try { await supabase.from('sales').insert({ user_id: it.supplier_id, amount, trx_date: new Date().toISOString() }); } catch(e) { console.error('sales insert fail', e); }
            try {
              await supabase.from('product_sales').upsert({
                product_id: it.product_id,
                supplier_id: it.supplier_id,
                quantity: it.quantity,
                amount,
                trx_date: new Date().toISOString(),
                order_id: orderId
              }, { onConflict: 'order_id,product_id,supplier_id' });
            } catch(e) { console.error('product_sales upsert fail', e); }
          }
        }

        // Nuevo carrito activo vacío (ignorar errores)
        try { await supabase.from('carts').insert({ user_id: buyerId, status: 'active' }); } catch(_) {}
      }
    } catch(materializeErr) {
      console.error('❌ Error materializando (dual/split):', materializeErr);
    }

    return new Response(JSON.stringify({ success: true, orderId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('🔥 Error fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}));
