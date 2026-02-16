import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withMetrics } from '../_shared/metrics.ts';

serve(req => withMetrics('get-payment-status', req, async () => {
  // Esta función es muy simple, no necesita CORS complejo si se llama desde tu propio frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { payment_id, trigger_process = true } = body || {};
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

    let syncResult: any = null;
    const statusNorm = String(responseData?.status || '').toLowerCase().trim();
    const isTerminalOrPaid = ['done', 'expired', 'canceled', 'cancelled', 'failed', 'rejected'].includes(statusNorm);

    if (trigger_process && isTerminalOrPaid) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const internalWebhookSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && internalWebhookSecret) {
          const syncResp = await fetch(`${supabaseUrl}/functions/v1/process-khipu-webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-khipu-sync': internalWebhookSecret,
            },
            body: JSON.stringify(responseData),
          });

          let syncBody: any = null;
          try {
            syncBody = await syncResp.json();
          } catch {
            syncBody = null;
          }

          syncResult = {
            invoked: true,
            status: syncResp.status,
            ok: syncResp.ok,
            body: syncBody,
          };
        }
      } catch (syncErr: any) {
        syncResult = {
          invoked: true,
          ok: false,
          error: String(syncErr?.message || syncErr),
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment: responseData,
      sync_result: syncResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}));
