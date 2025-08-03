import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Función de Ayuda para la Verificación de Firma HMAC-SHA256 (Base64)
// ============================================================================
async function verifyKhipuSignature(
  requestBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('s='));

    if (!timestampPart || !signaturePart) {
      console.error('❌ Firma incompleta: falta t= o s=');
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];
    const stringToSign = `${timestamp}.${requestBody}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(stringToSign);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return (
      signature.replace(/=*$/, '') === expectedSignature.replace(/=*$/, '')
    );
  } catch (error) {
    console.error('❌ Error verificando firma de Khipu:', error);
    return false;
  }
}

// ============================================================================
// Función Principal del Webhook
// ============================================================================
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBodyString = await req.text();
    const signatureHeader = req.headers.get('X-Khipu-Signature');
    const khipuWebhookSecret = Deno.env.get('KHIPU_SECRET_KEY');

    if (!signatureHeader || !khipuWebhookSecret) {
      console.error('❌ Falta cabecera de firma o secreto');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const isValidSignature = await verifyKhipuSignature(
      requestBodyString,
      signatureHeader,
      khipuWebhookSecret
    );

    if (!isValidSignature) {
      console.error('❌ Firma de webhook inválida.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let khipuPayload: Record<string, any> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(requestBodyString);
      khipuPayload = Object.fromEntries(formData.entries());
    } else if (contentType.includes('application/json')) {
      try {
        khipuPayload = JSON.parse(requestBodyString);
      } catch (e) {
        console.error('❌ Error parseando JSON del cuerpo:', e);
        return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      console.warn('⚠️ Tipo de contenido no soportado:', contentType);
      return new Response(
        JSON.stringify({ error: 'Unsupported content-type' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📦 Payload procesado:', khipuPayload);

    // ✅ **CORRECCIÓN:** Se asume que el payload completo es el objeto del evento.
    // No se busca un campo 'data' anidado.
    const eventData = khipuPayload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Se usa 'eventData.event' para determinar el tipo de evento
    if (eventData.event === 'payment.succeeded') {
      // 'metadata' puede seguir siendo un string JSON, por lo que se parsea.
      const metadata = JSON.parse(eventData.metadata || '{}');
      const orderId = metadata.cart_id;

      if (!orderId) {
        console.warn('⚠️ Pago exitoso sin `cart_id` en metadata');
        return new Response('OK (sin orderId)', { status: 200 });
      }

      console.log(`💰 Procesando pago exitoso para la orden: ${orderId}`);

      await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'paid',
          khipu_payment_id: eventData.id, // Se usa eventData.id
          khipu_transaction_id: eventData.transaction_id, // Se usa eventData.transaction_id
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } else if (eventData.event === 'payment.rejected') {
      const metadata = JSON.parse(eventData.metadata || '{}');
      const orderId = metadata.cart_id;

      if (orderId) {
        console.log(`❌ Procesando pago rechazado para la orden: ${orderId}`);
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    } else {
      console.log(`ℹ️ Evento no manejado: ${eventData.event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event: eventData.event }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('🔥 Error fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
