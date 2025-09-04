// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withMetrics } from '../_shared/metrics.ts';


// Lista de orígenes permitidos para CORS
const allowedOrigins = [
  'https://sellsi.cl', // URL de producción
  'https://staging-sellsi.vercel.app', // URL de staging
  'http://localhost:5173', // URL de desarrollo local
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3004',
];

serve(req => withMetrics('create-payment-khipu', req, async () => {
  // Configuración de CORS
  const origin = req.headers.get('origin') || '';
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isAllowed = allowedOrigins.includes(origin) || isLocalhost;
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Manejar la petición pre-vuelo (preflight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[create-payment-khipu] Función iniciada.');

    // 1. Leer los datos dinámicos que envía el frontend (khipuService.js)
    // Ahora esperamos también order_id (ID de la fila ya creada en orders)
  const { amount, subject, currency, buyer_id, cart_items, cart_id, order_id, shipping_address, billing_address } = await req.json();

  if (!order_id) {
    throw new Error('Falta order_id: la función ahora requiere el ID existente de la orden.');
  }

    // Validar que los datos necesarios fueron recibidos
    if (!amount || !subject || !currency) {
      throw new Error(
        'Payload inválido. Faltan datos requeridos: amount, subject, o currency.'
      );
    }
    console.log(
      `[create-payment-khipu] Datos recibidos: amount=${amount}, subject=${subject}`
    );

    // 2. Verificar que las variables de entorno necesarias estén configuradas
    const apiKey = Deno.env.get('KHIPU_API_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL'); // Obtener la URL base de Supabase

    if (!apiKey) {
      throw new Error(
        'El secreto KHIPU_API_KEY no está configurado en Supabase.'
      );
    }
    if (!supabaseUrl) {
      throw new Error(
        'La variable de entorno SUPABASE_URL no está disponible.'
      );
    }
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada.');
    }
    console.log(
      '[create-payment-khipu] Secretos y variables de entorno encontrados.'
    );

    // Construir la URL de notificación dinámicamente
    const notifyUrl = `${supabaseUrl}/functions/v1/process-khipu-webhook`;

    // ================================================================
    // 3. Autoridad de Pricing (Server) – Recalcular y sellar antes de ir a Khipu
    // ================================================================
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const PRICE_TOLERANCE_CLP = 5; // diferencia permitida entre monto front y monto sellado
    let sealedOrder: any = null;
  try {
      const { data: sealed, error: sealErr } = await supabaseAdmin
        .rpc('finalize_order_pricing', { p_order_id: order_id });
      if (sealErr) {
        console.error('[create-payment-khipu] Error en finalize_order_pricing:', sealErr);
        return new Response(JSON.stringify({ error: 'PRICING_SEAL_FAILED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
      }
      sealedOrder = sealed;
    } catch (sealEx) {
      console.error('[create-payment-khipu] Excepción finalize_order_pricing:', sealEx);
      return new Response(JSON.stringify({ error: 'PRICING_SEAL_EXCEPTION' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    if (!sealedOrder || !sealedOrder.pricing_verified_at) {
      return new Response(JSON.stringify({ error: 'PRICING_NOT_VERIFIED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
    }

    // 3.1 Validación básica de items (producto existe y supplier coincide)
    try {
      const items = Array.isArray(sealedOrder.items) ? sealedOrder.items : [];
      const productIds = items.map((it: any) => it.product_id).filter(Boolean);
      if (productIds.length) {
        const { data: products, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('productid, supplier_id, price')
          .in('productid', productIds);
        if (prodErr) {
          console.warn('[create-payment-khipu] Advertencia leyendo productos para validación:', prodErr);
        } else {
          const pMap = new Map(products.map(p => [p.productid, p]));
          for (const it of items) {
            const ref = pMap.get(it.product_id);
            if (!ref) {
              return new Response(JSON.stringify({ error: 'ITEM_PRODUCT_NOT_FOUND', product_id: it.product_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
            }
            if (ref.supplier_id && it.supplier_id && ref.supplier_id !== it.supplier_id) {
              return new Response(JSON.stringify({ error: 'ITEM_SUPPLIER_MISMATCH', product_id: it.product_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
            }
            const eff = Number(it.unit_price_effective || it.price_at_addition || 0);
            if (!Number.isFinite(eff) || eff <= 0) {
              return new Response(JSON.stringify({ error: 'ITEM_PRICE_INVALID', product_id: it.product_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
            }
          }
        }
      }
    } catch (valEx) {
      console.error('[create-payment-khipu] Error validación items (continuando con fallback abort):', valEx);
      return new Response(JSON.stringify({ error: 'ITEM_VALIDATION_EXCEPTION' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    // 3.2 Comparar monto sellado vs monto recibido del front
    const sealedTotal = Math.round(Number(sealedOrder.total || 0));
    const frontendAmount = Math.round(Number(amount || 0));
    const diff = Math.abs(sealedTotal - frontendAmount);
    if (!Number.isFinite(sealedTotal) || sealedTotal <= 0) {
      return new Response(JSON.stringify({ error: 'SEALED_TOTAL_INVALID' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 });
    }
    if (diff > PRICE_TOLERANCE_CLP) {
      console.error('[create-payment-khipu] PRICING_MISMATCH', { sealedTotal, frontendAmount, diff });
      return new Response(JSON.stringify({ error: 'PRICING_MISMATCH', sealed_total: sealedTotal, frontend_amount: frontendAmount, diff }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 });
    }

    // 4. Preparar y enviar la petición a la API de Khipu usando el monto sellado
    const khipuApiUrl = 'https://payment-api.khipu.com/v3/payments';
    const body = JSON.stringify({
      subject,
      amount: sealedTotal, // monto sellado authoritative
      currency,
      return_url: 'https://sellsi.cl/buyer/orders',
      notify_url: notifyUrl,
    });

    console.log('[create-payment-khipu] Enviando petición a Khipu con body sellado:', body);

    const khipuResponse = await fetch(khipuApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      body,
    });

    console.log(`[create-payment-khipu] Respuesta de Khipu recibida con estado: ${khipuResponse.status}`);

    // 5. Procesar la respuesta de Khipu
    const responseData = await khipuResponse.json();
    if (!khipuResponse.ok) {
      const errorMessage = responseData.message || 'Error desconocido de Khipu.';
      throw new Error(`Error de la API de Khipu: ${errorMessage}`);
    }
    console.log('[create-payment-khipu] Respuesta de Khipu parseada:', JSON.stringify(responseData, null, 2));

    // 6. Normalizar salida para frontend
    const normalized = {
      // bandera de éxito para clientes que lo esperan
      success: true,
      // mapeo defensivo de campos posibles
      payment_url:
        responseData.payment_url ||
        responseData.paymentUrl ||
        responseData.simplified_transfer_url ||
        responseData.transfer_url ||
        null,
      payment_id: responseData.payment_id || responseData.id || null,
      transaction_id:
        responseData.transaction_id ||
        responseData.trx_id ||
        responseData.transactionId ||
        null,
      expires_date: responseData.expires_date || responseData.expires_at || null,
      // Devolvemos también el objeto crudo para depuración si fuera necesario en el cliente
      raw: responseData,
  } as Record<string, unknown>;

    // ================================================================
    // Actualizar la orden existente (NO crear nueva fila)
    // ================================================================
    try {
  // (supabaseAdmin ya inicializado arriba)
      // Fecha de expiración robusta: si Khipu entrega un formato inválido, fallback a +20m
      const expiresRaw: string | null = (normalized as any).expires_date || null;
      let expiresAt: string;
      if (expiresRaw) {
        const parsed = new Date(expiresRaw);
        if (isNaN(parsed.getTime())) {
          console.warn('[create-payment-khipu] expires_date inválido recibido (%s); se aplica fallback +20m', expiresRaw);
          expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        } else {
          expiresAt = parsed.toISOString();
        }
      } else {
        expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
      }

      // 1. Construir payload normalizado de items (si se envían)
      let itemsPayload: any[] | null = null;
      if (Array.isArray(cart_items)) {
        itemsPayload = cart_items.map(ci => {
          const rawDoc = ci.document_type || ci.documentType || '';
          const normDoc = (() => {
            const v = String(rawDoc).toLowerCase();
            return v === 'boleta' || v === 'factura' ? v : 'ninguno';
          })();
          let price = ci.price || ci.price_at_addition || 0;
          // Recalcular si precio cero y hay price_tiers disponible
          if ((!price || price === 0) && Array.isArray(ci.price_tiers) && ci.price_tiers.length) {
            try {
              // Simple algoritmo tier: ordenar desc por min y tomar el mayor min <= qty
              const qty = ci.quantity || 1;
              const tiers = [...ci.price_tiers].sort((a,b)=> (b.min||b.min_qty||0) - (a.min||a.min_qty||0));
              for (const t of tiers) {
                const min = t.min ?? t.min_qty ?? t.quantity ?? 1;
                const tp = t.price ?? t.unit_price ?? t.value;
                if (qty >= min && typeof tp === 'number') { price = tp; break; }
              }
            } catch(_) {}
          }
          return {
            product_id: ci.product_id || ci.productid || ci.id || null,
            quantity: ci.quantity || 1,
            price: price,
            price_at_addition: ci.price_at_addition || price,
            supplier_id: ci.supplier_id || ci.supplierId || null,
            document_type: normDoc,
            price_tiers: ci.price_tiers || null,
          };
        });
      }

      // 2. Verificar existencia de la orden
      const { data: existingOrder, error: fetchErr } = await supabaseAdmin
        .from('orders')
        .select('id, items, payment_status, shipping_address, billing_address')
        .eq('id', order_id)
        .maybeSingle();

      if (fetchErr) {
        console.error('[create-payment-khipu] Error buscando orden existente:', fetchErr);
      }
      if (!existingOrder) {
        console.warn('[create-payment-khipu] Orden no encontrada, se intentará crear (fallback). ID:', order_id);
        const fallbackInsert = {
          id: order_id,
          user_id: buyer_id || null,
          cart_id: cart_id || null,
          items: itemsPayload,
          subtotal: amount,
          total: amount,
          status: 'pending',
          payment_method: 'khipu',
          payment_status: 'pending',
          // Evitar doble stringificación: persistir objetos JSON directamente
          shipping_address: (shipping_address && typeof shipping_address === 'object') ? shipping_address : null,
          billing_address: (billing_address && typeof billing_address === 'object') ? billing_address : null,
          khipu_payment_id: (normalized as any).payment_id || null,
          khipu_payment_url: (normalized as any).payment_url || null,
          khipu_expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error: fallbackErr } = await supabaseAdmin.from('orders').insert(fallbackInsert).single();
        if (fallbackErr) {
          console.error('[create-payment-khipu] Error en fallback insert:', fallbackErr);
        } else {
          (normalized as any).persisted = true;
          (normalized as any).khipu_expires_at = expiresAt;
        }
      } else {
        // 3. No volver a sobrescribir items sellados: finalize_order_pricing ya generó items enriquecidos y hash.
        //    Reemplazar aquí por items crudos rompe la integridad (items_hash mismatch en webhook).
        //    Solo actualizamos metadatos de pago y totales sellados. (Si en el futuro se quieren cambiar items,
        //    debe hacerse ANTES de llamar a finalize_order_pricing.)
        const preservePaid = (existingOrder as any).payment_status === 'paid';
        const updateData: Record<string, any> = {
          khipu_payment_id: (normalized as any).payment_id || null,
          khipu_payment_url: (normalized as any).payment_url || null,
          khipu_expires_at: expiresAt,
          payment_method: 'khipu',
          payment_status: preservePaid ? 'paid' : 'pending',
          subtotal: sealedOrder.subtotal || sealedTotal,
          total: sealedOrder.total || sealedTotal,
          // items OMITIDOS para preservar hash sellado
          updated_at: new Date().toISOString(),
        };
        // ✔ Solo actualizar direcciones si se enviaron explícitamente (preserva existentes)
        // Merge-preserve: solo actualizar si viene objeto; NO degradar non-null a null sin intención explícita
        if (typeof shipping_address !== 'undefined') {
          if (shipping_address && typeof shipping_address === 'object') {
            updateData.shipping_address = shipping_address;
          } else if (shipping_address === null) {
            // preservar existente; si se requiere limpiarla en el futuro agregar flag force_clear_shipping_address
            updateData.shipping_address = existingOrder?.shipping_address ?? null; // no change
          }
        }
        if (typeof billing_address !== 'undefined') {
          if (billing_address && typeof billing_address === 'object') {
            updateData.billing_address = billing_address;
          } else if (billing_address === null) {
            updateData.billing_address = existingOrder?.billing_address ?? null;
          }
        }
        if (preservePaid) {
          console.log('[create-payment-khipu] Orden ya estaba pagada; se preserva payment_status=paid y no se degrada a pending');
        }
        const { data: updData, error: updErr } = await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('id', order_id)
          .select('id, khipu_expires_at, payment_status')
          .maybeSingle();
        if (updErr) {
          console.error('[create-payment-khipu] Error actualizando orden existente:', updErr);
          return new Response(JSON.stringify({ error: 'ORDER_UPDATE_FAILED' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        } else {
          (normalized as any).persisted = true;
          (normalized as any).khipu_expires_at = updData?.khipu_expires_at || expiresAt;
          (normalized as any).payment_status = updData?.payment_status || updateData.payment_status;
        }
      }
      (normalized as any).order_id = order_id;
    } catch (persistErr) {
      console.error('[create-payment-khipu] Persist error (update path):', persistErr);
      return new Response(JSON.stringify({ error: 'PERSIST_EXCEPTION' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    if (!normalized.payment_url) {
      // Si por alguna razón Khipu no devolvió URL, informamos explícitamente
      console.warn('[create-payment-khipu] Respuesta sin payment_url:', responseData);
    }

  (normalized as any).sealed_total = sealedTotal;
  (normalized as any).frontend_amount = frontendAmount;
  (normalized as any).pricing_diff = diff;
  return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[create-payment-khipu] ERROR FATAL:', (error as any).message);
    return new Response(JSON.stringify({ error: (error as any).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}));
