import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async req => {
  // Esta función es muy simple, no necesita CORS complejo si se llama desde tu propio frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obtenemos el ID del pago que nos envía el frontend
    const { payment_id } = await req.json();
    if (!payment_id) {
      throw new Error('Falta el "payment_id" en la petición.');
    }

    // Obtenemos la llave secreta de Khipu
    const apiKey = Deno.env.get('KHIPU_API_KEY');
    if (!apiKey) {
      throw new Error('No se encontró la KHIPU_API_KEY en los secretos.');
    }

    const khipuApiUrl = `https://payment-api.khipu.com/v3/payments/${payment_id}`;

    // Llamamos a la API de Khipu para OBTENER el estado del pago
    const khipuResponse = await fetch(khipuApiUrl, {
      method: 'GET', // Usamos GET para consultar
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
    });

    if (!khipuResponse.ok) {
      throw new Error('Error al consultar la API de Khipu.');
    }

    const responseData = await khipuResponse.json();

    // Devolvemos la respuesta completa de Khipu al frontend
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
