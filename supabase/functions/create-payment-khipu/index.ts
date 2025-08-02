import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Lista de orígenes permitidos para CORS
const allowedOrigins = [
  'https://tu-proyecto.vercel.app', // URL de producción
  'https://staging-sellsi.vercel.app', // URL de staging
  'http://localhost:5173', // URL de desarrollo local
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

serve(async req => {
  // Configuración de CORS
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.includes(origin);
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

    // 2. Verificar que la API Key de Khipu esté configurada en los secretos de Supabase
    const apiKey = Deno.env.get('KHIPU_API_KEY');
    if (!apiKey) {
      throw new Error(
        'El secreto KHIPU_API_KEY no está configurado en Supabase.'
      );
    }
    console.log('[create-payment-khipu] API Key de Khipu encontrada.');

    // 3. Preparar y enviar la petición a la API de Khipu
    const khipuApiUrl = 'https://payment-api.khipu.com/v3/payments';
    const body = JSON.stringify({
      subject,
      amount: Math.round(amount), // Khipu requiere montos enteros
      currency,
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

    // 5. Devolver la respuesta completa al frontend
    return new Response(JSON.stringify(responseData), {
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
