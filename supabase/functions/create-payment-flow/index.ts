// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withMetrics } from '../_shared/metrics.ts';

const allowedOrigins = [
  'https://sellsi.cl',
  'https://staging-sellsi.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3004',
];

// ============================================================================
// Función para firmar parámetros según especificación Flow
// Orden alfabético + concatenación + HMAC-SHA256
// ============================================================================
async function signFlowParams(
  params: Record<string, any>,
  secretKey: string
): Promise<string> {
  // 1. Ordenar claves alfabéticamente
  const sortedKeys = Object.keys(params).sort();

  // 2. Concatenar: key1value1key2value2...
  const toSign = sortedKeys.map(k => `${k}${params[k]}`).join('');

  // 3. HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(toSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // 4. Convertir a hex
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(req => withMetrics('create-payment-flow', req, async () => {
  const origin = req.headers.get('origin') || '';
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isAllowed = allowedOrigins.includes(origin) || isLocalhost;
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const log = (msg: string, extra: any = {}) =>
      console.log(JSON.stringify({ tag: 'create-payment-flow', request_id: requestId, msg, ...extra }));
    const logErr = (msg: string, extra: any = {}) =>
      console.error(JSON.stringify({ tag: 'create-payment-flow', level: 'error', request_id: requestId, msg, ...extra }));
    const respond = (status: number, body: any) => {
      return new Response(JSON.stringify({ request_id: requestId, ...body }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      });
    };

    log('func_start');

    // 1. Leer payload
    const {
      amount,
      subject,
      currency,
      buyer_id,
      cart_items,
      order_id,
      user_email,
      shipping_address,
      billing_address,
      offer_id,
      offer_ids,
    } = await req.json();

    if (!order_id) {
      return respond(400, { error_code: 'MISSING_ORDER_ID', error: 'Falta order_id' });
    }
    if (!amount || !currency) {
      return respond(400, { error_code: 'INVALID_PAYLOAD', error: 'Faltan datos requeridos' });
    }

    log('payload_received', {
      amount,
      subject,
      currency,
      order_id,
      buyer_id,
      cart_items_count: Array.isArray(cart_items) ? cart_items.length : 0,
    });

    // 2. Variables de entorno
    const flowApiKey = Deno.env.get('FLOW_API_KEY');
    const flowSecretKey = Deno.env.get('FLOW_SECRET_KEY');
    const flowEnv = Deno.env.get('FLOW_ENV') || 'sandbox';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!flowApiKey || !flowSecretKey) {
      return respond(500, { error_code: 'MISSING_FLOW_KEYS', error: 'Credenciales Flow no configuradas' });
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return respond(500, { error_code: 'MISSING_SUPABASE_CONFIG', error: 'Config Supabase no encontrada' });
    }

    const FLOW_API = flowEnv === 'production'
      ? 'https://www.flow.cl/api'
      : 'https://sandbox.flow.cl/api';

    const FRONTEND_URL = flowEnv === 'production'
      ? 'https://sellsi.cl'
      : 'https://staging-sellsi.vercel.app';

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // 3. Validación de ofertas (igual que create-payment-khipu)
    const allowPending = Deno.env.get('OFFERS_ALLOW_PENDING') === '1';
    const enforceDeadline = Deno.env.get('OFFERS_ENFORCE_DEADLINE') === '1';
    const offerIds: string[] = Array.isArray(offer_ids) ? offer_ids : (offer_id ? [offer_id] : []);
    const offerWarnings: any[] = [];
    const validStatuses = allowPending ? ['accepted', 'reserved', 'pending'] : ['accepted', 'reserved'];

    if (offerIds.length) {
      const { data: offersRows, error: offersErr } = await supabaseAdmin
        .from('offers')
        .select('id,status,purchase_deadline,order_id')
        .in('id', offerIds);

      if (offersErr) {
        logErr('offers_fetch_failed', { err: offersErr });
        return respond(500, { error_code: 'OFFERS_FETCH_FAILED', error: 'No se pudieron leer ofertas' });
      }
      if (!offersRows || offersRows.length !== offerIds.length) {
        return respond(404, { error_code: 'OFFER_NOT_FOUND', error: 'Oferta(s) no encontrada(s)', expected: offerIds.length, found: offersRows?.length || 0 });
      }

      const nowMs = Date.now();
      for (const off of offersRows) {
        const deadlineMs = off.purchase_deadline ? new Date(off.purchase_deadline).getTime() : null;
        if (deadlineMs && deadlineMs < nowMs) {
          const msg = { offer_id: off.id, issue: 'deadline_expired' };
          if (enforceDeadline) return respond(409, { error_code: 'OFFER_DEADLINE_EXPIRED', error: 'Oferta vencida', offer_id: off.id });
          offerWarnings.push(msg);
        }
        if (!validStatuses.includes(off.status)) {
          const msg = { offer_id: off.id, issue: 'invalid_state', state: off.status };
          if (enforceDeadline) return respond(409, { error_code: 'OFFER_INVALID_STATE', error: 'Estado inválido oferta', offer_id: off.id, state: off.status });
          offerWarnings.push(msg);
        }
        if (off.order_id && off.order_id !== order_id) {
          return respond(409, { error_code: 'OFFER_ALREADY_LINKED', error: 'Oferta ligada a otra orden', offer_id: off.id, existing_order_id: off.order_id });
        }
      }

      // Vincular ofertas a la orden
      try {
        const { error: linkErr } = await supabaseAdmin
          .from('offers')
          .update({ order_id, updated_at: new Date().toISOString() })
          .in('id', offerIds)
          .is('order_id', null);
        if (linkErr) {
          offerWarnings.push({ issue: 'link_partial_failure' });
          logErr('offer_link_partial_failure', { linkErr });
        }
      } catch (linkEx) {
        offerWarnings.push({ issue: 'link_exception' });
        logErr('offer_link_exception', { linkEx });
      }
    }

    // 4. Setear payment_method='flow' ANTES de sellar
    try {
      await supabaseAdmin
        .from('orders')
        .update({ payment_method: 'flow', updated_at: new Date().toISOString() })
        .eq('id', order_id);
    } catch (e) {
      log('warning_set_payment_method', { error: String(e) });
    }

    // 5. Sellar pricing
    const PRICE_TOLERANCE_CLP = 50;
    let sealedOrder: any = null;

    try {
      const { data: sealed, error: sealErr } = await supabaseAdmin
        .rpc('finalize_order_pricing', { p_order_id: order_id });
      if (sealErr) {
        logErr('seal_error', { error: sealErr });
        return respond(422, { error_code: 'PRICING_SEAL_FAILED', error: 'Error sellando precios' });
      }
      sealedOrder = sealed;
    } catch (sealEx) {
      logErr('seal_exception', { error: String(sealEx) });
      return respond(500, { error_code: 'PRICING_SEAL_EXCEPTION' });
    }

    if (!sealedOrder || !sealedOrder.pricing_verified_at) {
      return respond(422, { error_code: 'PRICING_NOT_VERIFIED' });
    }

    // 6. Validación de items
    try {
      const items = Array.isArray(sealedOrder.items) ? sealedOrder.items : [];
      const productIds = items.map((it: any) => it.product_id).filter(Boolean);
      if (productIds.length) {
        const { data: products, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('productid, supplier_id, price')
          .in('productid', productIds);

        if (prodErr) {
          log('warning_reading_products', { error: prodErr });
        } else {
          const pMap = new Map(products.map(p => [p.productid, p]));
          for (const it of items) {
            const ref = pMap.get(it.product_id);
            if (!ref) {
              return respond(422, { error_code: 'ITEM_PRODUCT_NOT_FOUND', product_id: it.product_id });
            }
            if (ref.supplier_id && it.supplier_id && ref.supplier_id !== it.supplier_id) {
              return respond(422, { error_code: 'ITEM_SUPPLIER_MISMATCH', product_id: it.product_id });
            }
            const eff = Number(it.unit_price_effective || it.price_at_addition || 0);
            if (!Number.isFinite(eff) || eff <= 0) {
              return respond(422, { error_code: 'ITEM_PRICE_INVALID', product_id: it.product_id });
            }
          }
        }
      }
    } catch (valEx) {
      logErr('item_validation_exception', { error: String(valEx) });
      return respond(500, { error_code: 'ITEM_VALIDATION_EXCEPTION' });
    }

    // 7. Comparar monto sellado vs frontend
    const sealedSubtotal = Math.round(Number(sealedOrder.subtotal || 0));
    const sealedShipping = Math.round(Number(sealedOrder.shipping || 0));
    const sealedTax = Math.round(Number(sealedOrder.tax || 0));
    const sealedPaymentFee = Math.round(Number(sealedOrder.payment_fee || 0));
    const sealedTotalBase = Math.round(Number(sealedOrder.total || 0));
    const sealedGrandTotal = Math.round(Number(sealedOrder.grand_total ?? (sealedTotalBase + sealedPaymentFee)));
    const frontendAmount = Math.round(Number(amount || 0));
    const diff = Math.abs(sealedGrandTotal - frontendAmount);

    log('pricing_compare', {
      sealedSubtotal,
      sealedShipping,
      sealedTax,
      sealedPaymentFee,
      sealedTotalBase,
      sealedGrandTotal,
      frontendAmount,
      diff,
      tolerance: PRICE_TOLERANCE_CLP,
    });

    if (!Number.isFinite(sealedGrandTotal) || sealedGrandTotal <= 0) {
      return respond(422, { error_code: 'SEALED_TOTAL_INVALID', error: 'Total sellado inválido' });
    }
    if (diff > PRICE_TOLERANCE_CLP) {
      return respond(409, {
        error_code: 'PRICING_MISMATCH',
        error: 'Diferencia de monto',
        sealed_grand_total: sealedGrandTotal,
        frontend_amount: frontendAmount,
        diff,
        tolerance: PRICE_TOLERANCE_CLP,
      });
    }

    // Validar monto mínimo Flow
    if (sealedGrandTotal < 350) {
      return respond(400, { error_code: 'AMOUNT_TOO_LOW', error: 'Monto mínimo $350 CLP', amount: sealedGrandTotal });
    }

    // 8. Obtener email del usuario
    let payerEmail = user_email;
    if (!payerEmail && buyer_id) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('user_id', buyer_id)
        .maybeSingle();
      payerEmail = userData?.email || 'comprador@sellsi.cl';
    }
    if (!payerEmail) {
      payerEmail = 'comprador@sellsi.cl';
    }

    // 9. Construir parámetros para Flow
    // Formato de order_id corto: últimos 8 caracteres en mayúsculas (igual que BuyerOrders)
    const shortOrderId = order_id.slice(-8).toUpperCase();
    
    const flowParams: Record<string, any> = {
      apiKey: flowApiKey,
      commerceOrder: `#${shortOrderId}`, // Formato corto visible al usuario
      subject: 'Compra en Sellsi', // Descripción genérica
      currency: 'CLP',
      amount: sealedGrandTotal,
      email: payerEmail,
      urlConfirmation: `${supabaseUrl}/functions/v1/process-flow-webhook?oid=${order_id}`,
      urlReturn: `${supabaseUrl}/functions/v1/flow-return?order=${order_id}`,
    };

    // 10. Firmar
    flowParams.s = await signFlowParams(flowParams, flowSecretKey);

    log('flow_request', {
      url: `${FLOW_API}/payment/create`,
      params: { ...flowParams, s: flowParams.s.substring(0, 10) + '...' },
    });

    // 11. Llamar a Flow API
    let flowResponse: Response;
    try {
      flowResponse = await fetch(`${FLOW_API}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(flowParams as Record<string, string>),
      });
    } catch (fetchErr) {
      logErr('flow_fetch_failed', { error: String(fetchErr) });
      return respond(502, { error_code: 'FLOW_FETCH_FAILED', error: 'No se pudo conectar con Flow' });
    }

    // 12. Procesar respuesta
    let responseData: any;
    try {
      const rawText = await flowResponse.text();
      log('flow_response_raw', { status: flowResponse.status, text: rawText.substring(0, 500) });
      responseData = JSON.parse(rawText);
    } catch (parseErr) {
      logErr('flow_parse_error', { error: String(parseErr) });
      return respond(502, { error_code: 'FLOW_RESPONSE_PARSE_FAILED' });
    }

    if (!flowResponse.ok) {
      logErr('flow_api_error', { status: flowResponse.status, response: responseData });
      return respond(flowResponse.status === 400 ? 400 : 502, {
        error_code: 'FLOW_API_ERROR',
        error: responseData.message || 'Error de Flow',
        flow_response: responseData,
      });
    }

    // 13. Respuesta exitosa de Flow
    const paymentUrl = responseData.url && responseData.token
      ? `${responseData.url}?token=${responseData.token}`
      : null;

    if (!paymentUrl) {
      logErr('flow_no_payment_url', { response: responseData });
      return respond(502, { error_code: 'FLOW_NO_PAYMENT_URL' });
    }

    // 14. Actualizar orden con datos de Flow
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    try {
      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          flow_order: responseData.flowOrder,
          flow_token: responseData.token,
          flow_payment_url: paymentUrl,
          flow_expires_at: expiresAt,
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (updateErr) {
        logErr('order_update_failed', { error: updateErr });
      }
    } catch (updateEx) {
      logErr('order_update_exception', { error: String(updateEx) });
    }

    log('success', { ms: Date.now() - startedAt, flowOrder: responseData.flowOrder });

    const result: any = {
      success: true,
      payment_url: paymentUrl,
      token: responseData.token,
      flow_order: responseData.flowOrder,
      sealed_grand_total: sealedGrandTotal,
      sealed_payment_fee: sealedPaymentFee,
      order_id,
    };

    if (offerIds.length) {
      result.offer_ids = offerIds;
    }
    if (offerWarnings.length) {
      result.offer_warnings = offerWarnings;
    }

    return respond(200, result);

  } catch (error) {
    console.error('[create-payment-flow] ERROR FATAL:', error);
    return new Response(JSON.stringify({ error: (error as any).message, error_code: 'UNHANDLED_EXCEPTION' }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}));
