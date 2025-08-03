// supabase/functions/khipu-webhook-handler/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Función de Ayuda para la Verificación de Firma (Tomada de tu Función #1, adaptada)
// ============================================================================
async function verifyKhipuSignature(
  requestBody: string, // El cuerpo RAW de la solicitud entrante (como string)
  signatureHeader: string, // La cabecera 'X-Khipu-Signature' de la solicitud
  secret: string // Tu secreto de webhook de Khipu (desde variables de entorno)
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('s='));

    if (!timestampPart || !signaturePart) {
      console.error('Firma de Khipu incompleta: falta t= o s=');
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];

    // La cadena a firmar es timestamp + '.' + cuerpo_raw
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
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = signature === expectedSignature;
    if (!isValid) {
      console.warn(
        `Firma no coincide. Esperada: ${expectedSignature}, Recibida: ${signature}`
      );
    }
    return isValid;
  } catch (error) {
    console.error('Error verificando firma de Khipu:', error);
    return false;
  }
}

// ============================================================================
// Función Principal del Webhook (Combinación de seguridad y formato)
// ============================================================================
serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let requestBodyString = ''; // Para almacenar el cuerpo RAW para la verificación de firma

  try {
    // Clona la solicitud para poder leer el cuerpo dos veces: una como texto y otra como JSON
    const clonedReq = req.clone();
    requestBodyString = await clonedReq.text(); // Lee el cuerpo como texto (para la firma)

    // Ahora, parsea el cuerpo como JSON
    const khipuPayload = JSON.parse(requestBodyString); // <-- Aquí se lee el payload de Khipu

    // Obtener la firma de la cabecera HTTP
    const signatureHeader = req.headers.get('X-Khipu-Signature'); // O el nombre de cabecera que use Khipu
    const khipuWebhookSecret = Deno.env.get('KHIPU_WEBHOOK_SECRET'); // Tu secreto de webhook (desde Supabase secrets)

    // Validaciones iniciales
    if (!signatureHeader || !khipuWebhookSecret) {
      console.error(
        'Faltan datos para la verificación de firma: cabecera o secreto.'
      );
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing signature or secret' }),
        { status: 401 }
      );
    }

    // AHORA: Verificar la firma HMAC-SHA256
    const isValidSignature = await verifyKhipuSignature(
      requestBodyString, // Cuerpo RAW
      signatureHeader, // Firma de la cabecera
      khipuWebhookSecret // Secreto de la variable de entorno
    );

    if (!isValidSignature) {
      console.error('Firma de webhook inválida');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        { status: 401 }
      );
    }

    console.log(
      'Webhook de Khipu validado y payload recibido:',
      JSON.stringify(khipuPayload, null, 2)
    );

    // Crear cliente de Supabase (igual que en tus funciones)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ==========================================================
    // Lógica de Procesamiento del Webhook (Similar a tu Función #2)
    // ==========================================================
    if (khipuPayload.event === 'payment.succeeded') {
      const paymentData = khipuPayload.data;
      console.log(
        'Pago completado (evento payment.succeeded):',
        paymentData.transaction_id
      );

      const metadata = JSON.parse(paymentData.metadata || '{}');
      const orderId = metadata.cart_id; // Asumimos que guardaste el orderId/cartId en los metadatos

      if (!orderId) {
        console.warn(
          'Webhook de Khipu recibido sin orderId (cart_id) en los metadatos. No se puede actualizar el pedido.'
        );
        return new Response('OK (sin orderId)', { status: 200 });
      }

      // Actualizar orden en la base de datos (puedes actualizar 'orders' o 'carts' según tu modelo)
      // Usaremos 'orders' si tienes ambas tablas y 'cart_id' en metadata se refiere a un orderId.
      const { data: updateOrderData, error: updateOrderError } = await supabase
        .from('orders') // O 'carts' si 'orderId' es el ID del carrito
        .update({
          status: 'completed',
          payment_status: 'paid',
          khipu_payment_id: paymentData.id, // El ID de Khipu para este pago
          khipu_transaction_id: paymentData.transaction_id, // El ID de transacción de Khipu
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId) // Asumiendo que 'id' es la PK de tu tabla de órdenes/carritos
        .select();

      if (updateOrderError) {
        console.error('Error actualizando orden:', updateOrderError);
        throw new Error(
          `Error actualizando orden: ${updateOrderError.message}`
        );
      }
      console.log('Orden actualizada exitosamente:', updateOrderData);

      // Si también necesitas actualizar 'carts' por separado y orderId es el cart_id
      const { error: cartUpdateError } = await supabase
        .from('carts')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId); // Asumiendo que 'id' es la PK de tu tabla de carritos

      if (cartUpdateError) {
        console.error('Error actualizando carrito:', cartUpdateError);
        throw new Error(
          `Error actualizando carrito: ${cartUpdateError.message}`
        );
      }
      console.log('Carrito actualizado exitosamente.');
    } else if (khipuPayload.event === 'payment.rejected') {
      // Manejar pagos rechazados
      console.log(
        'Pago rechazado (evento payment.rejected):',
        khipuPayload.data.transaction_id
      );
      const metadata = JSON.parse(khipuPayload.data.metadata || '{}');
      const orderId = metadata.cart_id;

      if (orderId) {
        await supabase
          .from('orders') // O 'carts' según tu modelo
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        console.log(`Orden ${orderId} marcada como fallida.`);
      }
    } else {
      console.log(
        `Evento de webhook recibido (${khipuPayload.event}), no es 'payment.succeeded' o 'payment.rejected'. Ignorando.`
      );
    }

    // Responder 200 OK para que Khipu sepa que la notificación fue recibida
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        event: khipuPayload.event,
        transaction_id: khipuPayload.data?.transaction_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en función process-khipu-webhook:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
