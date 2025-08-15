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
  const { amount, subject, currency, buyer_id, cart_items, cart_id } = await req.json();

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

    // 3. Preparar y enviar la petición a la API de Khipu
    const khipuApiUrl = 'https://payment-api.khipu.com/v3/payments';
    const body = JSON.stringify({
      subject,
      amount: Math.round(amount), // Khipu requiere montos enteros
      currency,
      return_url: 'https://sellsi.cl/buyer/orders',
      notify_url: notifyUrl,
    });

    console.log(
      '[create-payment-khipu] Enviando petición a Khipu con body:',
      body
    );

    const khipuResponse = await fetch(khipuApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      body,
    });

    console.log(
      `[create-payment-khipu] Respuesta de Khipu recibida con estado: ${khipuResponse.status}`
    );

    // 4. Procesar la respuesta de Khipu
    const responseData = await khipuResponse.json();

    if (!khipuResponse.ok) {
      // Si Khipu responde con un error, lo lanzamos para que se capture abajo
      const errorMessage =
        responseData.message || 'Error desconocido de Khipu.';
      throw new Error(`Error de la API de Khipu: ${errorMessage}`);
    }

    // Log para depurar la respuesta exitosa de Khipu
    console.log(
      '[create-payment-khipu] Respuesta de Khipu parseada:',
      JSON.stringify(responseData, null, 2)
    );

    // 5. Normalizar salida para frontend
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
    // Persistir / upsert de la payment order en tabla orders
    // ================================================================
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const expiresRaw: string | null = (normalized as any).expires_date || null;
      const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : new Date(Date.now() + 20 * 60 * 1000).toISOString(); // fallback 20m

      // Construir estructura items minimal (si se entregan cart_items)
      let itemsPayload = [] as any[];
      if (Array.isArray(cart_items)) {
        itemsPayload = cart_items.map(ci => {
          const rawDoc = ci.document_type || ci.documentType || '';
          const normDoc = (() => {
            const v = String(rawDoc).toLowerCase();
            return v === 'boleta' || v === 'factura' ? v : 'ninguno';
          })();
          return {
            product_id: ci.product_id || ci.productid || ci.id,
            quantity: ci.quantity || 1,
            price: ci.price || ci.price_at_addition || 0,
            supplier_id: ci.supplier_id || ci.supplierId || null,
            document_type: normDoc,
          };
        });
      }

      const orderInsert = {
        id: (normalized as any).payment_id || crypto.randomUUID(),
        user_id: buyer_id || null,
        cart_id: cart_id || null,
        items: itemsPayload.length ? itemsPayload : null,
        subtotal: amount,
        total: amount,
        total_amount: amount, // si existe esta convención en el servicio front
        status: 'pending',
        payment_method: 'khipu',
        payment_status: 'pending',
        khipu_payment_id: (normalized as any).payment_id || null,
        khipu_payment_url: (normalized as any).payment_url || null,
        khipu_expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;

      // upsert por id para idempotencia
      const { error: upsertErr } = await supabaseAdmin
        .from('orders')
        .upsert(orderInsert, { onConflict: 'id' });
      if (upsertErr) {
        console.error('[create-payment-khipu] Error persistiendo payment order:', upsertErr);
      } else {
        (normalized as any).persisted = true;
        (normalized as any).khipu_expires_at = expiresAt;
      }
    } catch (persistErr) {
      console.error('[create-payment-khipu] Persist error:', persistErr);
    }

    if (!normalized.payment_url) {
      // Si por alguna razón Khipu no devolvió URL, informamos explícitamente
      console.warn('[create-payment-khipu] Respuesta sin payment_url:', responseData);
    }

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
