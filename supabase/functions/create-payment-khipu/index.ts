// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Lista de orígenes permitidos para CORS
const allowedOrigins = [
  'https://sellsi.cl', // URL de producción
  'https://staging-sellsi.vercel.app', // URL de staging
  'http://localhost:5173', // URL de desarrollo local
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3004',
];

serve(async req => {
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
    const { amount, subject, currency } = await req.json();

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
      return_url: 'https://sellsi.cl/buyer/orders', // Es mejor usar la URL de producción
      notify_url: notifyUrl, // Usar la URL construida dinámicamente
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

    if (!normalized.payment_url) {
      // Si por alguna razón Khipu no devolvió URL, informamos explícitamente
      console.warn('[create-payment-khipu] Respuesta sin payment_url:', responseData);
    }

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Capturar cualquier error (de nuestro código o de Khipu) y devolverlo con estado 500
    console.error('[create-payment-khipu] ERROR FATAL:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
