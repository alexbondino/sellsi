// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withMetrics } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Firmar parámetros para consulta getStatus
// ============================================================================
async function signFlowParams(params: Record<string, any>, secretKey: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(k => `${k}${params[k]}`).join('');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(toSign);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve((req: Request) => withMetrics('process-flow-webhook', req, async () => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: any = {}) =>
    console.log(JSON.stringify({ tag: 'process-flow-webhook', request_id: requestId, msg, ...extra }));
  const logErr = (msg: string, extra: any = {}) =>
    console.error(JSON.stringify({ tag: 'process-flow-webhook', level: 'error', request_id: requestId, msg, ...extra }));

  try {
    // Extraer order_id del query string (pasado en urlConfirmation)
    const url = new URL(req.url);
    const orderIdFromUrl = url.searchParams.get('oid');

    // 1. Flow envía POST con content-type application/x-www-form-urlencoded
    // Solo envía un parámetro: token
    const contentType = req.headers.get('content-type') || '';
    let token: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(await req.text());
      token = formData.get('token');
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      token = json.token;
    }

    if (!token) {
      logErr('token_missing');
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    log('token_received', { token_prefix: token.substring(0, 20) + '...', orderIdFromUrl });

    // 2. Obtener credenciales
    const flowApiKey = Deno.env.get('FLOW_API_KEY');
    const flowSecretKey = Deno.env.get('FLOW_SECRET_KEY');
    const flowEnv = Deno.env.get('FLOW_ENV') || 'sandbox';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!flowApiKey || !flowSecretKey) {
      logErr('config_missing');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const FLOW_API = flowEnv === 'production'
      ? 'https://www.flow.cl/api'
      : 'https://sandbox.flow.cl/api';

    // 3. Consultar estado del pago con /payment/getStatus
    const statusParams: Record<string, any> = {
      apiKey: flowApiKey,
      token: token,
    };
    statusParams.s = await signFlowParams(statusParams, flowSecretKey);

    const statusUrl = `${FLOW_API}/payment/getStatus?${new URLSearchParams(statusParams as Record<string, string>)}`;
    log('querying_status', { url_prefix: statusUrl.substring(0, 80) + '...' });

    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    log('status_response', { status: statusResponse.status, flowOrder: statusData.flowOrder, paymentStatus: statusData.status });

    if (!statusResponse.ok) {
      logErr('status_query_failed', { status: statusResponse.status, response: statusData });
      return new Response(JSON.stringify({ error: 'Failed to get payment status' }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    // 4. Extraer datos de la respuesta
    const {
      flowOrder,
      commerceOrder,  // Ahora es formato corto #XXXXXXXX
      status,         // 1=pendiente, 2=pagada, 3=rechazada, 4=anulada
      subject,
      amount,
      payer,
      optional,
      paymentData,
    } = statusData;

    // Extraer order_id (UUID) - múltiples fuentes por orden de prioridad
    let orderId: string | null = null;
    
    // Fuente 1: Query string de urlConfirmation (más confiable, no visible al usuario)
    if (orderIdFromUrl && orderIdFromUrl.length === 36) {
      orderId = orderIdFromUrl;
    }

    // Fuente 2: optional (fallback para pagos antiguos)
    if (!orderId || orderId.length !== 36) {
      try {
        const optData = typeof optional === 'string' ? JSON.parse(optional) : optional;
        if (optData?.o) orderId = optData.o;
        else if (optData?.oid) orderId = optData.oid;
        else if (optData?.order_id) orderId = optData.order_id;
      } catch {}
    }

    // Fuente 3: commerceOrder si es UUID (legacy)
    if (!orderId || orderId.length !== 36) {
      if (commerceOrder && commerceOrder.length === 36) {
        orderId = commerceOrder;
      }
    }

    // Fuente 4: extraer UUID del subject (fallback extremo)
    if (!orderId || orderId.length !== 36) {
      const uuidMatch = subject?.match(/([0-9a-fA-F-]{36})/);
      if (uuidMatch) {
        orderId = uuidMatch[1];
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Log del webhook
    try {
      await supabase.from('flow_webhook_logs').insert({
        flow_order: flowOrder,
        commerce_order: commerceOrder,
        token: token,
        status: status,
        webhook_data: statusData,
        processed: false,
        order_id: orderId || null,
        category: status === 2 ? 'payment_confirmed' : status === 3 ? 'payment_rejected' : status === 4 ? 'payment_cancelled' : 'other',
      });
    } catch (logInsertErr) {
      logErr('webhook_log_insert_failed', { error: String(logInsertErr) });
    }

    if (!orderId) {
      logErr('order_id_not_found', { commerceOrder, subject });
      return new Response(JSON.stringify({ success: false, reason: 'order_not_found' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    log('order_id_resolved', { orderId });

    // 6. Obtener orden actual
    const { data: preOrder, error: preErr } = await supabase
      .from('orders')
      .select('id, payment_status, inventory_processed_at, cancelled_at, status, items, items_hash, user_id, supplier_parts_meta, cart_id')
      .eq('id', orderId)
      .maybeSingle();

    if (preErr || !preOrder) {
      logErr('order_fetch_failed', { orderId, error: preErr });
      return new Response(JSON.stringify({ success: false, reason: 'order_not_found' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // 7. Verificar si está cancelada
    if (preOrder.cancelled_at || preOrder.status === 'cancelled') {
      logErr('order_cancelled', { orderId, cancelled_at: preOrder.cancelled_at });
      return new Response(JSON.stringify({ success: false, reason: 'order_cancelled' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // 8. Verificar integridad de items_hash
    let integrityOk = true;
    try {
      if (preOrder.items_hash) {
        const { data: hashCalc, error: hashFuncErr } = await supabase.rpc('order_items_canonical_hash', { o: preOrder });
        let hex = null;
        if (hashFuncErr) {
          try {
            const itemsJson = preOrder.items;
            const canonical = typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson);
            const encoder = new TextEncoder();
            const dataBuf = encoder.encode(canonical);
            const digestBuf = await crypto.subtle.digest('SHA-256', dataBuf);
            hex = Array.from(new Uint8Array(digestBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
          } catch (_) { hex = null; }
        } else {
          hex = hashCalc as any;
        }
        if (hex && preOrder.items_hash !== hex) {
          integrityOk = false;
          logErr('items_hash_mismatch', { stored: preOrder.items_hash, computed: hex });
        }
      }
    } catch (hashEx) {
      log('hash_verification_warning', { error: String(hashEx) });
    }

    if (!integrityOk) {
      return new Response(JSON.stringify({ error: 'ITEMS_HASH_MISMATCH', order_id: orderId }), { status: 409, headers: corsHeaders });
    }

    // 9. Inicializar supplier_parts_meta si NULL (antes del early return)
    try {
      if (preOrder.supplier_parts_meta == null) {
        let rawItems: any[] = [];
        try {
          if (Array.isArray(preOrder.items)) rawItems = preOrder.items;
          else if (typeof preOrder.items === 'string') rawItems = JSON.parse(preOrder.items);
        } catch { rawItems = []; }

        const supplierIds = Array.from(new Set(rawItems.map(it => it.supplier_id || it.supplierId).filter(Boolean)));
        if (supplierIds.length) {
          const now = new Date().toISOString();
          const metaObj: Record<string, any> = {};
          for (const sid of supplierIds) {
            metaObj[sid] = { status: 'pending', history: [{ at: now, from: null, to: 'pending' }] };
          }
          await supabase
            .from('orders')
            .update({ supplier_parts_meta: metaObj, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .is('supplier_parts_meta', null);
        }
      }
    } catch (metaInitEx) {
      log('supplier_parts_meta_init_error', { error: String(metaInitEx) });
    }

    // 10. Procesar según status de Flow
    const paidAt = paymentData?.date || new Date().toISOString();
    let justMarkedPaid = false;

    if (status === 2 && preOrder.payment_status !== 'paid') {
      // PAGO EXITOSO
      log('payment_confirmed', { flowOrder, amount });

      const { error: payUpdErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          flow_order: flowOrder,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .is('cancelled_at', null);

      if (payUpdErr) {
        logErr('order_update_failed', { error: payUpdErr });
      } else {
        justMarkedPaid = true;
      }

      // Promover ofertas vinculadas a estado paid
      try {
        const { data: linkedOffers, error: lErr } = await supabase
          .from('offers')
          .select('id,status')
          .eq('order_id', orderId);

        if (!lErr && linkedOffers?.length) {
          const promoteIds = linkedOffers.filter(o => ['reserved', 'accepted'].includes(o.status)).map(o => o.id);
          if (promoteIds.length) {
            await supabase
              .from('offers')
              .update({ status: 'paid', paid_at: paidAt, updated_at: new Date().toISOString() })
              .in('id', promoteIds);
          }
        }
      } catch (promEx) {
        log('offer_promotion_error', { error: String(promEx) });
      }

      // Marcar webhook como procesado
      await supabase
        .from('flow_webhook_logs')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          processing_latency_ms: Date.now() - startedAt,
        })
        .eq('token', token);

    } else if (status === 3) {
      // PAGO RECHAZADO
      log('payment_rejected', { flowOrder });
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId);

    } else if (status === 4) {
      // PAGO ANULADO
      log('payment_cancelled', { flowOrder });
      await supabase
        .from('orders')
        .update({ payment_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    // 11. Si ya se procesó inventario, salir (idempotencia)
    if (preOrder.inventory_processed_at) {
      log('inventory_already_processed', { orderId });
      return new Response(JSON.stringify({ success: true, orderId, idempotent: true }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // 12. Solo procesar inventario si se marcó como pagado
    if (justMarkedPaid) {
      // Parsear items
      let rawItems: any[] = [];
      try {
        if (Array.isArray(preOrder.items)) rawItems = preOrder.items;
        else if (typeof preOrder.items === 'string') rawItems = JSON.parse(preOrder.items);
      } catch { rawItems = []; }

      const normItems = rawItems.map(it => ({
        product_id: it.product_id || it.productid || null,
        supplier_id: it.supplier_id || it.supplierId || null,
        quantity: Number(it.quantity || 1),
        price_at_addition: Number(it.price_at_addition || it.price || 0),
      })).filter(it => it.product_id && it.supplier_id);

      // Calcular estimated_delivery_date si falta
      if (!preOrder.estimated_delivery_date && normItems.length > 0) {
        try {
          const productIds = [...new Set(normItems.map(it => it.product_id))];
          const { data: prodRows } = await supabase
            .from('products')
            .select('productid, product_delivery_regions')
            .in('productid', productIds);
          const productMap = new Map((prodRows || []).map(p => [p.productid, p]));
          const norm = (v:string) => (v || '').toString().trim().toLowerCase();
          const buyerRegion = norm(preOrder.shipping_address?.shipping_region || preOrder.shipping_address?.region || '');
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

          // Feriados Chile 2025 (coincidente con frontend)
          const CHILE_HOLIDAYS_2025 = new Set([
            '2025-01-01','2025-04-18','2025-04-19','2025-05-01',
            '2025-05-21','2025-06-29','2025-07-16','2025-08-15',
            '2025-09-18','2025-09-19','2025-10-12','2025-10-31',
            '2025-11-01','2025-12-08','2025-12-25'
          ]);

          const isBusinessDay = (date: Date) => {
            const dow = date.getDay();
            if (dow === 0 || dow === 6) return false; // fin de semana
            const iso = date.toISOString().slice(0, 10);
            if (CHILE_HOLIDAYS_2025.has(iso)) return false; // feriado
            return true;
          };

          // Calcular sumando días hábiles (saltar sábado/domingo/feriados)
          const addBusinessDays = (start: Date, days: number) => {
            const d = new Date(start);
            let added = 0;
            while (added < days) {
              d.setDate(d.getDate() + 1);
              if (isBusinessDay(d)) added++;
            }
            return d;
          };
          // Usar fecha de pago si está disponible, sino created_at
          const paymentDate = new Date(paidAt || preOrder.created_at);
          const deadline = addBusinessDays(paymentDate, maxDays);
          const isoDate = deadline.toISOString().slice(0,10);
          const { error: slaErr } = await supabase
            .from('orders')
            .update({ estimated_delivery_date: isoDate, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .is('estimated_delivery_date', null);
          if (slaErr) log('sla_persist_error', { error: slaErr });
        } catch(slaEx) {
          log('sla_calculation_error', { error: String(slaEx) });
        }
      }

      // Descontar inventario y registrar ventas
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
        } catch (invErr) {
          logErr('inventory_update_failed', { product_id: it.product_id, error: String(invErr) });
        }

        // Registrar ventas
        try {
          const saleAmount = Math.max(0, it.price_at_addition * it.quantity);
          await supabase.from('sales').insert({
            user_id: it.supplier_id,
            amount: saleAmount,
            trx_date: new Date().toISOString(),
          });
          await supabase.from('product_sales').upsert({
            product_id: it.product_id,
            supplier_id: it.supplier_id,
            quantity: it.quantity,
            amount: saleAmount,
            trx_date: new Date().toISOString(),
            order_id: orderId,
          }, { onConflict: 'order_id,product_id,supplier_id' });
        } catch (salesErr) {
          logErr('sales_record_failed', { product_id: it.product_id, error: String(salesErr) });
        }
      }

      // Marcar inventario procesado
      await supabase.from('orders')
        .update({ inventory_processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .is('inventory_processed_at', null);

      // Limpiar carrito
      try {
        if (preOrder.cart_id) {
          await supabase.from('cart_items').delete().eq('cart_id', preOrder.cart_id);
          await supabase.from('carts')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('cart_id', preOrder.cart_id);
        }
      } catch (cartErr) {
        log('cart_cleanup_warning', { error: String(cartErr) });
      }

      // Crear notificaciones
      try {
        const buyerId = preOrder.user_id;
        if (buyerId) {
          await supabase.rpc('create_notification', {
            p_payload: {
              p_user_id: buyerId,
              p_order_id: orderId,
              p_type: 'order_new',
              p_order_status: 'paid',
              p_role_context: 'buyer',
              p_context_section: 'buyer_orders',
              p_title: 'Se registró tu compra',
              p_body: 'Pago confirmado vía Flow',
              p_metadata: { payment_method: 'flow', flow_order: flowOrder },
            },
          } as any);
        }

        // Notificar a suppliers
        const supplierIds = Array.from(new Set(normItems.map(it => it.supplier_id)));
        for (const supplierId of supplierIds) {
          try {
            await supabase.rpc('create_notification', {
              p_payload: {
                p_user_id: supplierId,
                p_supplier_id: supplierId,
                p_order_id: orderId,
                p_type: 'order_new',
                p_order_status: 'paid',
                p_role_context: 'supplier',
                p_context_section: 'supplier_orders',
                p_title: 'Nuevo pedido pagado',
                p_body: 'Tienes productos listos para despacho.',
                p_metadata: { buyer_id: buyerId, payment_method: 'flow' },
              },
            } as any);
          } catch (supNotifErr) {
            log('supplier_notification_warning', { supplierId, error: String(supNotifErr) });
          }
        }
      } catch (notifErr) {
        log('notification_warning', { error: String(notifErr) });
      }
    }

    log('webhook_processed_successfully', { orderId, status, ms: Date.now() - startedAt });

    return new Response(JSON.stringify({ success: true, orderId, status }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    logErr('fatal_error', { error: (error as any).message });
    return new Response(JSON.stringify({ success: false, error: (error as any).message }), {
      headers: corsHeaders,
      status: 500,
    });
  }
}));
