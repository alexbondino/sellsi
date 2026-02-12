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
      financing_amount,
      shipping_address,
      billing_address,
      offer_id,
      offer_ids,
      financing_payment_id,
      financing_id,
      debt_amount,
      is_financing_payment,
    } = await req.json();

    // 2. Variables de entorno (mover arriba para financing path)
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

    // ================================================================
    // DETECCIÓN DE PAGO DE FINANCIAMIENTO
    // Nuevo: flag explícito is_financing_payment
    // Legacy: order_id empieza con "financing_"
    // ================================================================
    const isFinancingPayment = is_financing_payment === true || (typeof order_id === 'string' && order_id.startsWith('financing_'));

    if (isFinancingPayment) {
      log('financing_payment_detected', { order_id, is_financing_payment, financing_id, financing_payment_id });
      const targetFinancingId = financing_id || (typeof order_id === 'string' ? order_id.replace('financing_', '').split('_')[0] : null);

      if (!targetFinancingId) {
        return respond(400, { error_code: 'MISSING_FINANCING_ID', error: 'financing_id o order_id requerido para pago de financiamiento' });
      }

      const financingId = targetFinancingId;

      if (!amount || amount <= 0) {
        return respond(400, { error_code: 'INVALID_AMOUNT', error: 'Monto inválido para pago de financiamiento' });
      }

      const paymentAmount = Math.round(Number(amount));
      const debtAmount = Math.round(Number(debt_amount ?? amount));

      if (!debtAmount || debtAmount <= 0) {
        return respond(400, { error_code: 'INVALID_DEBT_AMOUNT', error: 'Monto de deuda inválido para pago de financiamiento' });
      }

      // Verificar que el financiamiento existe y está activo
      const { data: financing, error: finErr } = await supabaseAdmin
        .from('financing_requests')
        .select('id, buyer_id, supplier_id, amount, amount_used, amount_paid, status')
        .eq('id', financingId)
        .maybeSingle();

      if (finErr || !financing) {
        logErr('financing_not_found', { financingId, error: finErr });
        return respond(404, { error_code: 'FINANCING_NOT_FOUND', error: 'Financiamiento no encontrado' });
      }

      if (!['active', 'approved_by_sellsi'].includes(financing.status)) {
        return respond(409, { error_code: 'FINANCING_NOT_ACTIVE', error: 'El financiamiento no está activo', status: financing.status });
      }

      const availableToPay = Math.max(0, Number(financing.amount_used || 0) - Number(financing.amount_paid || 0));

      if (debtAmount > availableToPay) {
        return respond(409, {
          error_code: 'AMOUNT_EXCEEDS_DEBT',
          error: 'El monto excede la deuda pendiente',
          amount_used: financing.amount_used,
          amount_paid: financing.amount_paid || 0,
          available_to_pay: availableToPay,
          requested: debtAmount,
          gateway_amount: paymentAmount,
        });
      }
      const shortId = financingId.slice(-8).toUpperCase();
      const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase();

      // Validar monto mínimo Flow
      if (paymentAmount < 350) {
        return respond(400, { error_code: 'AMOUNT_TOO_LOW', error: 'Monto mínimo $350 CLP', amount: paymentAmount });
      }

      // Obtener email del usuario
      let payerEmail = user_email;
      if (!payerEmail && financing.buyer_id) {
        // buyer_id es el id de buyer table, necesitamos user_id para buscar email
        const { data: buyerData } = await supabaseAdmin
          .from('buyer')
          .select('user_id')
          .eq('id', financing.buyer_id)
          .maybeSingle();
        if (buyerData?.user_id) {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('user_id', buyerData.user_id)
            .maybeSingle();
          payerEmail = userData?.email || 'comprador@sellsi.cl';
        }
      }
      if (!payerEmail) payerEmail = 'comprador@sellsi.cl';

      // Construir parámetros para Flow
      const flowParams: Record<string, any> = {
        apiKey: flowApiKey,
        commerceOrder: `FIN-${shortId}-${uniqueSuffix}`,
        subject: `Pago Crédito Sellsi #${shortId}`,
        currency: 'CLP',
        amount: paymentAmount,
        email: payerEmail,
        urlConfirmation: `${supabaseUrl}/functions/v1/process-flow-webhook?financing_payment=true&fid=${financingId}`,
        urlReturn: `${FRONTEND_URL}/buyer/my-financing`,
      };

      // Firmar
      flowParams.s = await signFlowParams(flowParams, flowSecretKey);

      log('financing_flow_request', { amount: paymentAmount, debt_amount: debtAmount, financingId });

      // Llamar a Flow API
      let flowResponse: Response;
      try {
        flowResponse = await fetch(`${FLOW_API}/payment/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(flowParams as Record<string, string>),
        });
      } catch (fetchErr) {
        logErr('financing_flow_fetch_failed', { error: String(fetchErr) });
        return respond(502, { error_code: 'FLOW_FETCH_FAILED', error: 'No se pudo conectar con Flow' });
      }

      let responseData: any;
      try {
        const rawText = await flowResponse.text();
        responseData = JSON.parse(rawText);
      } catch (parseErr) {
        logErr('financing_flow_parse_error', { error: String(parseErr) });
        return respond(502, { error_code: 'FLOW_RESPONSE_PARSE_FAILED' });
      }

      if (!flowResponse.ok) {
        logErr('financing_flow_api_error', { status: flowResponse.status, response: responseData });
        return respond(502, { error_code: 'FLOW_API_ERROR', error: responseData.message || 'Error de Flow' });
      }

      const paymentUrl = responseData.url && responseData.token
        ? `${responseData.url}?token=${responseData.token}`
        : null;

      if (!paymentUrl) {
        logErr('financing_flow_no_url', { response: responseData });
        return respond(502, { error_code: 'FLOW_NO_PAYMENT_URL' });
      }

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const gatewayFee = Math.max(0, paymentAmount - debtAmount);
      const gatewayValidationMeta = {
        debt_amount: debtAmount,
        payment_amount: paymentAmount,
        payment_fee: gatewayFee,
        expected_gateway_amount: paymentAmount,
      };

      // Si recibimos financing_payment_id, ACTUALIZAR el registro existente
      // Si no, CREAR uno nuevo (legacy backward compatibility)
      let fpData: any = null;
      let fpErr: any = null;

      if (financing_payment_id) {
        // ✅ BUG #20: Validar que financing_payment_id pertenece al financing correcto
        // Previene que un atacante envíe el ID de pago de otro usuario
        const { data: existingPayment, error: verifyErr } = await supabaseAdmin
          .from('financing_payments')
          .select('financing_request_id, payment_status, flow_order')
          .eq('id', financing_payment_id)
          .single();
        
        if (verifyErr || !existingPayment) {
          logErr('financing_payment_verify_failed', { financing_payment_id, error: verifyErr });
          return respond(404, { error_code: 'PAYMENT_NOT_FOUND', error: 'Registro de pago no encontrado' });
        }
        
        // ✅ BUG #28: No sobreescribir pagos ya procesados
        if (existingPayment.payment_status !== 'pending') {
          logErr('financing_payment_not_pending', { financing_payment_id, status: existingPayment.payment_status });
          return respond(409, { error_code: 'PAYMENT_NOT_PENDING', error: 'El pago ya fue procesado', current_status: existingPayment.payment_status });
        }
        
        if (existingPayment.financing_request_id !== targetFinancingId) {
          logErr('financing_payment_mismatch', { 
            financing_payment_id, 
            expected_financing_id: targetFinancingId,
            actual_financing_id: existingPayment.financing_request_id
          });
          return respond(403, { error_code: 'PAYMENT_MISMATCH', error: 'El pago no pertenece a este financiamiento' });
        }
        
        // 🐛 BUG #35 FIX: Prevenir re-crear pago en Flow si ya tiene flow_order
        // Esto previene duplicados cuando el usuario hace click múltiple o refresca la página
        if (existingPayment.flow_order) {
          log('financing_payment_already_has_flow_order', { 
            financing_payment_id, 
            flow_order: existingPayment.flow_order 
          });
          return respond(409, { 
            error_code: 'PAYMENT_ALREADY_CREATED', 
            error: 'Este pago ya tiene una orden de Flow activa. Usa el link de pago existente o cancela el pago anterior.',
            flow_order: existingPayment.flow_order
          });
        }
        
        // NUEVO FLUJO: Actualizar registro existente con datos de Flow
        const { data, error } = await supabaseAdmin
          .from('financing_payments')
          .update({
            flow_order: responseData.flowOrder,
            flow_token: responseData.token,
            flow_payment_url: paymentUrl,
            flow_expires_at: expiresAt,
            gateway_response: { ...responseData, ...gatewayValidationMeta },
            updated_at: new Date().toISOString(),
          })
          .eq('id', financing_payment_id)
          .select('id')
          .single();
        
        fpData = data;
        fpErr = error;
        
        if (!fpErr) {
          log('financing_payment_updated', { financing_payment_id });
        } else {
          logErr('financing_payment_update_failed', { financing_payment_id, error: fpErr });
          return respond(500, { error_code: 'DB_UPDATE_FAILED', error: 'Error al actualizar registro de pago' });
        }
      } else {
        // LEGACY FLUJO: Crear nuevo registro
        const { data, error } = await supabaseAdmin
          .from('financing_payments')
          .insert({
            financing_request_id: targetFinancingId,
            buyer_id: financing.buyer_id,
            amount: debtAmount,
            currency: 'CLP',
            payment_method: 'flow',
            payment_status: 'pending',
            flow_order: responseData.flowOrder,
            flow_token: responseData.token,
            flow_payment_url: paymentUrl,
            flow_expires_at: expiresAt,
            gateway_response: { ...responseData, ...gatewayValidationMeta },
          })
          .select('id')
          .single();
        
        fpData = data;
        fpErr = error;
        
        if (!fpErr) {
          log('financing_payment_created', { financing_payment_id: fpData?.id });
        } else {
          logErr('financing_payment_insert_failed', { error: fpErr });
          return respond(500, { error_code: 'DB_INSERT_FAILED', error: 'Error al crear registro de pago' });
        }
      }

      log('financing_payment_success', { ms: Date.now() - startedAt, flowOrder: responseData.flowOrder, financingPaymentId: fpData?.id });

      return respond(200, {
        success: true,
        payment_url: paymentUrl,
        token: responseData.token,
        flow_order: responseData.flowOrder,
        financing_payment_id: fpData?.id || financing_payment_id || null,
        is_financing_payment: true,
        request_id: requestId,
      });
    }
    // ================================================================
    // FIN FLUJO DE FINANCIAMIENTO - Continúa flujo normal de órdenes
    // ================================================================

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

    // 2. Variables de entorno (ya inicializadas arriba para financing path)

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
        return respond(500, { 
          error_code: 'ORDER_UPDATE_FAILED', 
          error: 'No se pudo guardar los datos del pago en la orden' 
        });
      }
    } catch (updateEx) {
      logErr('order_update_exception', { error: String(updateEx) });
      return respond(500, { 
        error_code: 'ORDER_UPDATE_EXCEPTION', 
        error: 'Error al actualizar la orden con datos de Flow' 
      });
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
