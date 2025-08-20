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

    // Verificación de integridad (items_hash) antes de mutar inventario / supplier_orders
    let integrityOk = true;
    try {
      const supabaseHash = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      // Obtener items y recalcular hash usando representación server (jsonb::text) vía RPC inline
      const { data: orderForHash, error: hashErr } = await supabaseHash
        .from('orders')
        .select('id, items, items_hash')
        .eq('id', orderId)
        .maybeSingle();
      if (hashErr) {
        console.error('❌ Error obteniendo orden para hash:', hashErr);
      } else if (orderForHash) {
        // Llamar función SQL para asegurar mismo algoritmo que finalize_order_pricing
        const { data: hashCalc, error: hashFuncErr } = await supabaseHash.rpc('order_items_canonical_hash', { o: orderForHash });
        let hex = null;
        if (hashFuncErr) {
          console.warn('⚠️ Falla order_items_canonical_hash, fallback a hashing JS', hashFuncErr);
          try {
            const itemsJson = orderForHash.items;
            const canonical = typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson);
            const encoder = new TextEncoder();
            const dataBuf = encoder.encode(canonical);
            const digestBuf = await crypto.subtle.digest('SHA-256', dataBuf);
            hex = Array.from(new Uint8Array(digestBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
          } catch(_) { hex = null; }
        } else {
          hex = hashCalc as any;
        }
        if (hex && orderForHash.items_hash && orderForHash.items_hash !== hex) {
          integrityOk = false;
          console.error('❌ Mismatch items_hash detectado', { stored: orderForHash.items_hash, computed: hex });
        } else if (hex) {
          console.log('🛡️ Hash integridad OK');
        } else {
          console.warn('⚠️ No se pudo calcular hash para comparación');
        }
      }
    } catch (hashEx) {
      console.error('⚠️ Fallo verificando hash de items (continuando con caution):', hashEx);
    }
    if (!integrityOk) {
      return new Response(JSON.stringify({ error: 'ITEMS_HASH_MISMATCH', order_id: orderId }), { status: 409, headers: corsHeaders });
    }

    // ========================================================================
    // ACTUALIZAR EN SUPABASE + IDEMPOTENCIA INVENTARIO (inventory_processed_at)
    // ========================================================================
    const paidAt = khipuPayload.paid_at || khipuPayload.paidAt || new Date().toISOString();

    // Intento obtener estado actual incluyendo inventory_processed_at para decidir idempotencia
    const { data: preOrder, error: preErr } = await supabase
      .from('orders')
      .select('id, payment_status, inventory_processed_at')
      .eq('id', orderId)
      .maybeSingle();
    if (preErr) {
      console.error('❌ Error obteniendo orden previa:', preErr);
    }

    let alreadyProcessedInventory = false;
    if (preOrder?.inventory_processed_at) {
      console.log('ℹ️ Webhook idempotente (inventory ya procesado)');
      alreadyProcessedInventory = true;
    }

    if (preOrder && preOrder.payment_status !== 'paid') {
      const { error: payUpdErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          khipu_payment_id: paymentIdFromPayload,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (payUpdErr) console.error('❌ Error marcando pago:', payUpdErr); else console.log('✅ Orden marcada pagada');
    }
    // Si inventario ya procesado, salimos antes de mutar inventario / ventas / materializaciones
    if (alreadyProcessedInventory) {
      return new Response(JSON.stringify({ success: true, orderId, idempotent: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // ========================================================================
    // MATERIALIZACIÓN DUAL / SPLIT (nuevo)
    // ========================================================================
    try {
      const SPLIT_MODE = (Deno.env.get('SPLIT_MODE') || 'legacy').toLowerCase(); // legacy | dual | split
      const SUPPLIER_PARTS_ENABLED = (Deno.env.get('SUPPLIER_PARTS_ENABLED') || 'false').toLowerCase() === 'true';
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

        // ====================================================================
        // SUPPLIER PARTS (supplier_orders) CREATION (Fase 1.5)
        // ====================================================================
        if (SUPPLIER_PARTS_ENABLED) {
          try {
            // Group items by supplier
            const groupMap = new Map<string, typeof normItems>();
            for (const it of normItems) {
              if (!it.supplier_id) continue;
              if (!groupMap.has(it.supplier_id)) groupMap.set(it.supplier_id, []);
              groupMap.get(it.supplier_id)!.push(it);
            }
            if (groupMap.size > 0) {
              // Pre-fetch existing supplier_orders for idempotency
              const { data: existingParts, error: partsErr } = await supabase
                .from('supplier_orders')
                .select('id, supplier_id')
                .eq('parent_order_id', orderId);
              if (partsErr) console.error('⚠️ Error leyendo supplier_orders existentes', partsErr);
              const existingSet = new Set((existingParts||[]).map(p => p.supplier_id));

              // Compute shipping allocation similar a lógica split carts
              const subtotalsArray: { sid: string; subtotal: number; items: any[] }[] = [];
              for (const [sid, items] of groupMap.entries()) {
                const subtotal = items.reduce((s,i)=> s + (i.price_at_addition * i.quantity), 0);
                subtotalsArray.push({ sid, subtotal, items });
              }
              const totalSubtotal = subtotalsArray.reduce((s,x)=>s+x.subtotal,0) || 1;
              const totalShipping = Number(ord.shipping || 0);
              let accShip = 0;
              subtotalsArray.forEach((entry, idx) => {
                if (totalShipping <= 0) entry.shippingAlloc = 0;
                else if (idx === subtotalsArray.length -1) entry.shippingAlloc = Math.max(0, totalShipping - accShip);
                else { const alloc = Math.round(totalShipping * (entry.subtotal / totalSubtotal)); entry.shippingAlloc = alloc; accShip += alloc; }
              });

              // Insert missing supplier_orders
              for (const entry of subtotalsArray) {
                if (existingSet.has(entry.sid)) continue;
                const { data: insertedPart, error: insErr } = await supabase
                  .from('supplier_orders')
                  .insert({
                    parent_order_id: orderId,
                    supplier_id: entry.sid,
                    status: ord.status || 'pending',
                    payment_status: data && data.length ? (data[0] as any).payment_status || 'paid' : 'paid',
                    subtotal: entry.subtotal,
                    shipping_amount: entry.shippingAlloc || 0,
                    total: entry.subtotal + (entry.shippingAlloc || 0),
                    estimated_delivery_date: ord.estimated_delivery_date || null
                  })
                  .select('id, supplier_id')
                  .single();
                if (insErr) { console.error('❌ Error insert supplier_order', insErr); continue; }
                existingSet.add(entry.sid);
                const partId = insertedPart?.id;
                if (!partId) continue;
                // Insert items
                for (const it of entry.items) {
                  try {
                    await supabase.from('supplier_order_items').insert({
                      supplier_order_id: partId,
                      product_id: it.product_id,
                      quantity: it.quantity,
                      unit_price: it.price_at_addition,
                      price_at_addition: it.price_at_addition,
                      price_tiers: it.price_tiers || null,
                      document_type: it.document_type
                    });
                  } catch(e) { console.error('item insert fail supplier_order_items', e); }
                }
              }
            }
          } catch (supplierPartsErr) {
            console.error('❌ Error creando supplier_orders:', supplierPartsErr);
          }
        }

        // ===== LEGACY MATERIALIZATION (si legacy o dual) (omitido si supplier parts habilitado) =====
        if (!SUPPLIER_PARTS_ENABLED && (SPLIT_MODE === 'legacy' || SPLIT_MODE === 'dual')) {
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
  if (!SUPPLIER_PARTS_ENABLED && (SPLIT_MODE === 'dual' || SPLIT_MODE === 'split')) {
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

  // ===== INVENTARIO & VENTAS =====
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

        // Marcar inventory_processed_at para idempotencia futura
        try {
          await supabase.from('orders')
            .update({ inventory_processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .is('inventory_processed_at', null);
        } catch (invMarkErr) {
          console.error('⚠️ No se pudo marcar inventory_processed_at', invMarkErr);
        }

        // Nuevo carrito activo vacío (ignorar errores)
        // Nota: Cuando SUPPLIER_PARTS_ENABLED está activo migramos a supplier_orders y
        // deshabilitamos la creación automática de un nuevo cart activo aquí para reducir
        // ruido legacy. La creación de un cart 'active' ocurrirá on-demand cuando el buyer
        // vuelva a agregar un producto (frontend debería manejarlo). Esto acelera el retiro
        // progresivo del modelo legacy de carts post–pago.
        if (!SUPPLIER_PARTS_ENABLED) {
          try { await supabase.from('carts').insert({ user_id: buyerId, status: 'active' }); } catch(_) {}
        }
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
