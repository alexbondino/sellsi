// supabase/functions/khipu-webhook-handler/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withMetrics } from '../_shared/metrics.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('khipu-webhook-handler function started');

serve(req => withMetrics('khipu-webhook-handler', req, async () => {
  try {
    const khipuPayload = await req.json();
    console.log(
      'Webhook payload received:',
      JSON.stringify(khipuPayload, null, 2)
    );

    // 1. Nos aseguramos de que el evento sea una notificación de pago exitoso
    if (khipuPayload.event === 'payment.succeeded') {
      const paymentData = khipuPayload.data;

      // 2. Extraemos el ID del carrito desde los metadatos que guardamos al crear el pago
      const metadata = JSON.parse(paymentData.metadata || '{}');
      const cartId = metadata.cart_id;

      if (!cartId) {
        console.warn(
          'Webhook de Khipu recibido sin cart_id en los metadatos. No se puede actualizar el pedido.'
        );
        // Devolvemos un 200 para que Khipu no siga reintentando
        return new Response('OK (sin cart_id)', { status: 200 });
      }

      // 3. Creamos un cliente de Supabase con permisos de administrador para modificar la base de datos
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // La Service Key es necesaria para escribir desde una función
      );

      // 4. Actualizamos el estado del carrito a "pagado" en la base de datos
      //    Asegúrate de que los nombres de tu tabla y columnas coincidan.
      const { data, error } = await supabaseAdmin
        .from('carts') // El nombre de tu tabla de carritos/pedidos
        .update({
          status: 'paid', // El nuevo estado que indica que es un pedido real
          paid_at: new Date().toISOString(), // Guardamos la fecha del pago
        })
        .eq('id', cartId) // La columna ID de tu tabla. Puede ser 'cart_id', 'id', etc.
        .select(); // .select() para que devuelva el registro actualizado (útil para logs)

      if (error) {
        console.error(
          `Error al actualizar el carrito ${cartId} a pagado:`,
          error
        );
        throw error; // Lanza el error para que sea capturado por el catch de abajo
      }

      console.log(
        `✅ Pedido para el carrito ${cartId} actualizado exitosamente. Datos:`,
        data
      );
    } else {
      console.log(
        `Evento de webhook recibido (${khipuPayload.event}), pero no es 'payment.succeeded'. No se hace nada.`
      );
    }

    // Si todo va bien (o si el evento no era de pago exitoso), respondemos 200 OK.
    return new Response('Webhook procesado correctamente', { status: 200 });
  } catch (error) {
    console.error('Error fatal en el webhook de Khipu:', error.message);
    // En caso de un error inesperado, respondemos con un error 400.
    return new Response(
      JSON.stringify({ error: 'Error procesando el webhook.' }),
      { status: 400 }
    );
  }
}));
