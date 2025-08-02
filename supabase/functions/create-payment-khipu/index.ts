// supabase/functions/create-payment-khipu/index.ts
// VERSIÓN CON DEPURACIÓN AVANZADA PARA EL ERROR 500

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const allowedOrigins = [
  'https://tu-proyecto.vercel.app', // Reemplaza con tu URL de Vercel
  'https://staging-sellsi.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

serve(async req => {
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.includes(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('--- Función iniciada ---');
    const apiKey = Deno.env.get('KHIPU_API_KEY');

    if (!apiKey) {
      throw new Error(
        'La KHIPU_API_KEY no está configurada en los secretos de Supabase.'
      );
    }
    console.log('API Key encontrada. Preparando petición a Khipu...');

    const url = 'https://payment-api.khipu.com/v3/payments';

    const body = JSON.stringify({
      subject: 'Pago de prueba',
      amount: 500,
      currency: 'CLP',
    });

    const khipuResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      body: body,
    });

    console.log(
      `Respuesta de Khipu recibida con estado: ${khipuResponse.status}`
    );

    if (!khipuResponse.ok) {
      const errorText = await khipuResponse.text();
      throw new Error(`Error de Khipu: ${errorText}`);
    }

    console.log('Intentando parsear la respuesta de Khipu...');
    const paymentData = await khipuResponse.json();
    console.log('Respuesta de Khipu parseada:', paymentData);

    const paymentUrl =
      paymentData.simplified_transfer_url || paymentData.payment_url;

    if (!paymentUrl) {
      console.error(
        "¡FALLO! No se encontró 'simplified_transfer_url' ni 'payment_url' en la respuesta.",
        paymentData
      );
      throw new Error(
        'La respuesta de Khipu no contenía una URL de pago válida.'
      );
    }

    console.log('URL de pago encontrada. Devolviendo al cliente.');
    return new Response(JSON.stringify({ payment_url: paymentUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('--- ERROR FATAL EN EL BLOQUE CATCH ---');
    console.error('Error en la Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
