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

    // Intento obtener estado actual incluyendo inventory_processed_at y supplier_parts_meta para decidir idempotencia
    const { data: preOrder, error: preErr } = await supabase
      .from('orders')
      .select('id, payment_status, inventory_processed_at, supplier_parts_meta, items, cancelled_at, status')
      .eq('id', orderId)
      .maybeSingle();
    if (preErr) {
      console.error('❌ Error obteniendo orden previa:', preErr);
    }

    // ================================================================
    // Validación de ofertas vinculadas (deadline / estado) antes de marcar pago
    // ================================================================
    const enforceLate = Deno.env.get('OFFERS_ENFORCE_LATE_BLOCK') === '1';
    const offerDeadlineWarnings: any[] = [];
    try {
      const { data: linkedOffers, error: linkedErr } = await supabase
        .from('offers')
        .select('id,status,purchase_deadline,order_id')
        .eq('order_id', orderId);
      if (linkedErr) {
        console.warn('⚠️ No se pudieron leer ofertas vinculadas para validación:', linkedErr);
      } else if (linkedOffers && linkedOffers.length) {
        const nowMs = Date.now();
        for (const off of linkedOffers) {
          const deadlineMs = off.purchase_deadline ? new Date(off.purchase_deadline).getTime() : null;
            if (deadlineMs && deadlineMs < nowMs) {
              const item = { offer_id: off.id, issue: 'deadline_expired' };
              if (enforceLate && preOrder?.payment_status !== 'paid') {
                console.warn('❌ Pago bloqueado: oferta vencida', item);
                return new Response(JSON.stringify({ error: 'OFFER_DEADLINE_EXPIRED', late: true, offer_id: off.id }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                offerDeadlineWarnings.push(item);
              }
            }
            if (!['accepted','reserved','paid'].includes(off.status)) {
              const item = { offer_id: off.id, issue: 'invalid_state', state: off.status };
              if (enforceLate && preOrder?.payment_status !== 'paid') {
                console.warn('❌ Pago bloqueado: estado inválido oferta', item);
                return new Response(JSON.stringify({ error: 'OFFER_INVALID_STATE', offer_id: off.id, state: off.status }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                offerDeadlineWarnings.push(item);
              }
            }
        }
      }
    } catch (offValEx) {
      console.error('⚠️ Excepción validando ofertas vinculadas (continuando):', offValEx);
    }

  let alreadyProcessedInventory = false;
  let justMarkedPaid = false;
    if (preOrder?.inventory_processed_at) {
      console.log('ℹ️ Webhook idempotente (inventory ya procesado)');
      alreadyProcessedInventory = true;
    }

    // --------------------------------------------------------------------
    // Opción A 2.0: Inicializar supplier_parts_meta si NULL
    // Debe ocurrir ANTES de early-return por inventory_processed_at
    // --------------------------------------------------------------------
    try {
      if (preOrder) {
        const meta = preOrder.supplier_parts_meta; // puede ser null
        if (meta == null) {
          // Parse items para derivar supplier_ids únicos
          let rawItems: any[] = [];
          try {
            const val = preOrder.items;
            if (Array.isArray(val)) rawItems = val; else if (typeof val === 'string') rawItems = JSON.parse(val); else if (val && typeof val === 'object') rawItems = Array.isArray(val.items) ? val.items : [val];
          } catch { rawItems = []; }
          const supplierIds = Array.from(new Set(rawItems.map(it => it.supplier_id || it.supplierId || it.product?.supplier_id || it.product?.supplierId).filter(Boolean)));
          if (supplierIds.length) {
            const now = new Date().toISOString();
            const metaObj: Record<string, any> = {};
            for (const sid of supplierIds) {
              metaObj[sid] = { status: 'pending', history: [{ at: now, from: null, to: 'pending' }] };
            }
            const { error: metaErr } = await supabase
              .from('orders')
              .update({ supplier_parts_meta: metaObj, updated_at: new Date().toISOString() })
              .eq('id', orderId)
              .is('supplier_parts_meta', null);
            if (metaErr) console.error('⚠️ No se pudo inicializar supplier_parts_meta', metaErr); else console.log('✅ supplier_parts_meta inicializado (suppliers=', supplierIds.length, ')');
          } else {
            console.log('ℹ️ No se encontraron supplier_ids para inicializar meta');
          }
        }
      }
    } catch (metaInitEx) {
      console.error('⚠️ Error inicializando supplier_parts_meta', metaInitEx);
    }

    // 🔧 FIX: Verificar que la orden NO esté cancelada antes de procesar el pago
  if (preOrder && preOrder.payment_status !== 'paid') {
      // Verificar si la orden fue cancelada
      if (preOrder.cancelled_at || preOrder.status === 'cancelled') {
        console.error('❌ No se puede procesar pago: orden fue cancelada', {
          orderId,
          cancelled_at: preOrder.cancelled_at,
          status: preOrder.status,
          payment_id: paymentIdFromPayload
        });
        return new Response(JSON.stringify({ 
          error: 'Order was cancelled', 
          orderId, 
          cancelled_at: preOrder.cancelled_at 
        }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error: payUpdErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          khipu_payment_id: paymentIdFromPayload,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .is('cancelled_at', null); // 🔧 Condición adicional de seguridad
  if (payUpdErr) console.error('❌ Error marcando pago:', payUpdErr); else { console.log('✅ Orden marcada pagada'); justMarkedPaid = true; }

      // Promover ofertas vinculadas a estado paid (idempotente)
      try {
        const { data: linkedForPay, error: lErr } = await supabase
          .from('offers')
          .select('id,status')
          .eq('order_id', orderId);
        if (lErr) {
          console.warn('⚠️ No se pudieron leer ofertas para promover a paid', lErr);
        } else if (linkedForPay && linkedForPay.length) {
          const promoteIds = linkedForPay.filter(o => ['reserved','accepted'].includes(o.status)).map(o => o.id);
          if (promoteIds.length) {
            const { error: upOffErr } = await supabase
              .from('offers')
              .update({ status: 'paid', paid_at: paidAt, updated_at: new Date().toISOString() })
              .in('id', promoteIds);
            if (upOffErr) console.error('⚠️ Error actualizando ofertas a paid', upOffErr); else console.log('✅ Ofertas promovidas a paid', promoteIds.length);
          }
        }
      } catch (promEx) {
        console.error('⚠️ Excepción promoviendo ofertas a paid', promEx);
      }
    }
    // Si inventario ya procesado, salimos (meta ya habría sido inicializada arriba si faltaba)
    if (alreadyProcessedInventory) {
  return new Response(JSON.stringify({ success: true, orderId, idempotent: true, offer_deadline_warnings: offerDeadlineWarnings }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

  // ========================================================================
  // SIMPLIFICACIÓN: Leer orden y procesar inventario / ventas sin materializar supplier_orders / carts
  // ========================================================================
  try {
      const { data: orderRows, error: fetchOrderErr } = await supabase
        .from('orders')
  .select('id, user_id, items, total, created_at, shipping, shipping_address, split_status, payment_status, estimated_delivery_date, status')
        .eq('id', orderId)
        .limit(1);
      if (fetchOrderErr) {
        console.error('❌ No se pudo leer la orden para materializar:', fetchOrderErr);
      } else if (orderRows && orderRows.length > 0) {
        const ord = orderRows[0] as any;
        const buyerId: string = ord.user_id;
        // Enviar notificaciones de compra confirmada al comprador solo al transicionar a paid
        if (justMarkedPaid && buyerId) {
          try {
            // Reutilizar items normalizados para construir metadata básica
            let rawItems: any[] = [];
            try {
              if (Array.isArray(ord.items)) rawItems = ord.items;
              else if (typeof ord.items === 'string') rawItems = JSON.parse(ord.items);
              else if (ord.items && typeof ord.items === 'object') rawItems = Array.isArray(ord.items.items) ? ord.items.items : [ord.items];
            } catch(_) { rawItems = []; }
            const normForNotify = rawItems.map((it) => ({
              product_id: it.product_id || it.productid || it.id || null,
              supplier_id: it.supplier_id || it.supplierId || it.product?.supplier_id || it.product?.supplierId || null,
              quantity: Number(it.quantity || 1),
              price_at_addition: Number(it.price_at_addition || it.price || 0)
            })).filter(x => x.product_id);
            const supplierMeta = new Map<string, { supplier_id: string; buyer_id: string; products: string[] }>();
            for (const it of normForNotify) {
              try {
                const { error: notifyErr } = await supabase.rpc('create_notification', {
                  p_payload: {
                    p_user_id: buyerId,
                    p_supplier_id: it.supplier_id || null,
                    p_order_id: orderId,
                    p_product_id: it.product_id || null,
                    p_type: 'order_new',
                    p_order_status: 'paid',
                    p_role_context: 'buyer',
                    p_context_section: 'buyer_orders',
                    p_title: 'Se registró tu compra',
                    p_body: 'Pago confirmado',
                    p_metadata: { quantity: it.quantity, price_at_addition: it.price_at_addition }
                  }
                } as any);
                if (notifyErr) console.error('⚠️ Error creando notificación de compra pagada:', notifyErr);
              } catch (nEx) { console.error('⚠️ Excepción notificando compra pagada', nEx); }
              if (it.supplier_id) {
                const entry = supplierMeta.get(it.supplier_id) || { supplier_id: it.supplier_id, buyer_id: buyerId, products: [] };
                if (it.product_id) entry.products.push(it.product_id);
                supplierMeta.set(it.supplier_id, entry);
              }
            }
            for (const meta of supplierMeta.values()) {
              try {
                const { error: notifySupplierErr } = await supabase.rpc('create_notification', {
                  p_payload: {
                    p_user_id: meta.supplier_id,
                    p_supplier_id: meta.supplier_id,
                    p_order_id: orderId,
                    p_product_id: null,
                    p_type: 'order_new',
                    p_order_status: 'paid',
                    p_role_context: 'supplier',
                    p_context_section: 'supplier_orders',
                    p_title: 'Nuevo pedido pagado',
                    p_body: 'Tienes productos listos para despacho.',
                    p_metadata: { buyer_id: meta.buyer_id, product_ids: meta.products }
                  }
                } as any);
                if (notifySupplierErr) console.error('⚠️ Error creando notificación supplier paid:', notifySupplierErr);
              } catch (supNotifEx) {
                console.error('⚠️ Excepción notificando supplier paid', supNotifEx);
              }
            }
          } catch (notifEx) { console.error('⚠️ Error preparando notificaciones buyer paid', notifEx); }
        }
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

        // === B4: Persistir SLA (estimated_delivery_date) si falta ===
        if (!ord.estimated_delivery_date && normItems.length) {
          try {
            const productIds = Array.from(new Set(normItems.map(i => i.product_id)));
            const { data: prodRows } = await supabase
              .from('products')
              .select('productid, product_delivery_regions')
              .in('productid', productIds);
            const productMap = new Map((prodRows || []).map(p => [p.productid, p]));
            const norm = (v:string) => (v || '').toString().trim().toLowerCase();
            const buyerRegion = norm(ord.shipping_address?.shipping_region || ord.shipping_address?.region || '');
            let maxDays = 0;
            for (const it of normItems) {
              const prod = productMap.get(it.product_id);
              const regions = (prod?.product_delivery_regions || []) as any[];
              if (Array.isArray(regions)) {
                const match = regions.find(r => norm(r.region) === buyerRegion);
                if (match && Number(match.delivery_days) > maxDays) maxDays = Number(match.delivery_days);
              }
            }
            if (maxDays === 0) maxDays = 7; // fallback
            // Calcular sumando días hábiles (simple business day add: saltar sábado/domingo)
            const addBusinessDays = (start: Date, days: number) => {
              const d = new Date(start);
              let added = 0;
              while (added < days) {
                d.setDate(d.getDate() + 1);
                const dow = d.getDay();
                if (dow !== 0 && dow !== 6) added++;
              }
              return d;
            };
            const createdAt = new Date(ord.created_at);
            const deadline = addBusinessDays(createdAt, maxDays);
            const isoDate = deadline.toISOString().slice(0,10);
            const { error: slaErr } = await supabase
              .from('orders')
              .update({ estimated_delivery_date: isoDate, updated_at: new Date().toISOString() })
              .eq('id', orderId)
              .is('estimated_delivery_date', null);
            if (slaErr) console.error('⚠️ No se pudo persistir SLA', slaErr); else console.log('✅ SLA persistido', isoDate);
          } catch(slaEx) {
            console.error('⚠️ Error calculando SLA', slaEx);
          }
        }

        // NOTA: Se eliminó creación de supplier_orders, carts legacy y split carts.
        // Mantenemos sólo inventario y métricas de ventas.
        for (const it of normItems) {
          // Inventario
          try {
            const { data: prodRows } = await supabase
              .from('products')
              .select('productqty')
              .eq('productid', it.product_id)
              .limit(1);
            if (prodRows?.length) {
              const currentQty = Number(prodRows[0].productqty || 0);
              const newQty = Math.max(0, currentQty - it.quantity);
              await supabase.from('products')
                .update({ productqty: newQty, updateddt: new Date().toISOString() })
                .eq('productid', it.product_id);
            }
          } catch(invErr) { console.error('inventory update fail', invErr); }
          // Ventas
          try {
            if (it.supplier_id) {
              const amount = Math.max(0, it.price_at_addition * it.quantity);
              await supabase.from('sales').insert({ user_id: it.supplier_id, amount, trx_date: new Date().toISOString() });
              await supabase.from('product_sales').upsert({
                product_id: it.product_id,
                supplier_id: it.supplier_id,
                quantity: it.quantity,
                amount,
                trx_date: new Date().toISOString(),
                order_id: orderId
              }, { onConflict: 'order_id,product_id,supplier_id' });
            }
          } catch(salesErr) { console.error('sales metrics fail', salesErr); }
        }

        // Marcar inventory_processed_at (idempotencia)
        try {
          await supabase.from('orders')
            .update({ inventory_processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .is('inventory_processed_at', null);
        } catch(invMarkErr) { console.error('⚠️ No se pudo marcar inventory_processed_at', invMarkErr); }
        // NO se crea nuevo cart activo automáticamente (simplificación post-refactor).
      }
    } catch(materializeErr) {
      console.error('❌ Error materializando (dual/split):', materializeErr);
    }

  return new Response(JSON.stringify({ success: true, orderId, offer_deadline_warnings: offerDeadlineWarnings }), {
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
