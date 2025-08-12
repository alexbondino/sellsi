import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Verificar firma HMAC-SHA256 Base64 de Khipu
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
// Webhook principal
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

    // ========================================================================
    // EXTRAER orderId DESDE subject
    // ========================================================================
    const subject: string = khipuPayload.subject || '';
    const orderIdMatch = subject.match(/#([0-9a-fA-F-]{36})/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (!orderId) {
      console.warn('⚠️ No se pudo extraer orderId del subject');
      return new Response('OK (sin orderId)', { status: 200 });
    }

    console.log(`💰 Procesando pago exitoso para la orden: ${orderId}`);

    // ========================================================================
    // ACTUALIZAR EN SUPABASE
    // ========================================================================
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        khipu_payment_id: khipuPayload.payment_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('❌ Error al actualizar la orden:', error);
    } else {
      console.log('✅ Orden actualizada:', data);
    }

    // ========================================================================
    // MATERIALIZAR ORDEN PARA PROVEEDORES (carts/cart_items) Y AJUSTAR INVENTARIO/VENTAS
    // ========================================================================
    try {
      // 1) Obtener la orden completa para extraer user_id e items
      const { data: orderRows, error: fetchOrderErr } = await supabase
        .from('orders')
        .select('id, user_id, items, total, created_at')
        .eq('id', orderId)
        .limit(1);

      if (fetchOrderErr) {
        console.error('❌ No se pudo leer la orden para materializar:', fetchOrderErr);
      } else if (orderRows && orderRows.length > 0) {
        const ord = orderRows[0] as any;
        const buyerId: string = ord.user_id;
        let items: any[] = [];
        try {
          if (Array.isArray(ord.items)) items = ord.items;
          else if (typeof ord.items === 'string') items = JSON.parse(ord.items);
          else if (ord.items && typeof ord.items === 'object') items = (ord.items.items && Array.isArray(ord.items.items)) ? ord.items.items : [ord.items];
        } catch (_) {
          items = [];
        }

        // 2) Intentar tomar carrito ACTIVO del usuario y convertirlo a 'pending'
        const { data: activeCart, error: activeCartErr } = await supabase
          .from('carts')
          .select('cart_id, status')
          .eq('user_id', buyerId)
          .eq('status', 'active')
          .maybeSingle();

        let targetCartId: string | null = null;

        if (activeCart && activeCart.cart_id) {
          // Convertir carrito activo en pedido pendiente
          const { data: updCart, error: updErr } = await supabase
            .from('carts')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('cart_id', activeCart.cart_id)
            .select('cart_id')
            .single();

          if (!updErr && updCart) {
            targetCartId = updCart.cart_id;
          } else if (updErr) {
            console.error('❌ Error convirtiendo carrito activo a pending:', updErr);
          }
        }

        // 3) Si no hay carrito activo, crear un nuevo registro de carts en 'pending'
        if (!targetCartId) {
          const { data: newCart, error: newCartErr } = await supabase
            .from('carts')
            .insert({ user_id: buyerId, status: 'pending' })
            .select('cart_id')
            .single();

          if (newCartErr) {
            console.error('❌ Error creando carrito para orden pagada:', newCartErr);
          } else if (newCart) {
            targetCartId = newCart.cart_id;
          }
        }

        // 4) Si tenemos un cart_id, asegurar que los cart_items reflejen los items pagados
        if (targetCartId && items.length > 0) {
          // Reemplazar items del carrito por los items exactos de la orden pagada
          await supabase.from('cart_items').delete().eq('cart_id', targetCartId);
          // Insertar cada item
          for (const it of items) {
            const productId = it.product_id || it.productid || it.id;
            const qty = Number(it.quantity || 1);
            const priceAt = Number(it.price_at_addition || it.price || 0);
            if (!productId || !Number.isFinite(qty)) continue;
            await supabase.from('cart_items').insert({
              cart_id: targetCartId,
              product_id: productId,
              quantity: qty,
              price_at_addition: priceAt,
              price_tiers: it.price_tiers || null,
            });
          }

          // Actualizar timestamp del carrito
          await supabase
            .from('carts')
            .update({ updated_at: new Date().toISOString() })
            .eq('cart_id', targetCartId);

          // 5) Ajustar inventario por cada producto comprado y registrar ventas por proveedor y por producto
          for (const it of items) {
            const productId = it.product_id || it.productid || it.id;
            const qty = Number(it.quantity || 1);
            const unitPrice = Number(it.price_at_addition || it.price || 0);
            const supplierId = it.supplier_id || it.product?.supplier_id || null;
            if (!productId || !Number.isFinite(qty)) continue;

            // Decrementar stock: seleccionar y actualizar
            const { data: prodRows, error: prodErr } = await supabase
              .from('products')
              .select('productqty')
              .eq('productid', productId)
              .limit(1);
            if (!prodErr && prodRows && prodRows.length > 0) {
              const currentQty = Number(prodRows[0].productqty || 0);
              const newQty = Math.max(0, currentQty - qty);
              await supabase
                .from('products')
                .update({ productqty: newQty, updateddt: new Date().toISOString() })
                .eq('productid', productId);
            }

            // Registrar venta por proveedor si contamos con supplierId
            if (supplierId) {
              const amount = Math.max(0, unitPrice * qty);
              // Insert into supplier-level sales (no unique key available; allow duplicates but could be deduped later)
              await supabase.from('sales').insert({ user_id: supplierId, amount, trx_date: new Date().toISOString() });

              // Insert product-level sale with idempotency per order/product/supplier
              await supabase
                .from('product_sales')
                .upsert({
                  product_id: productId,
                  supplier_id: supplierId,
                  quantity: qty,
                  amount: amount,
                  trx_date: new Date().toISOString(),
                  order_id: orderId,
                }, { onConflict: 'order_id,product_id,supplier_id' });
            }
          }
        }

        // 6) Crear un nuevo carrito ACTIVO vacío para el usuario (para futuras compras)
        const { error: newActiveErr } = await supabase
          .from('carts')
          .insert({ user_id: buyerId, status: 'active' });
        if (newActiveErr) {
          // No es crítico; puede fallar si ya existe
        }
      }
    } catch (materializeErr) {
      console.error('❌ Error materializando orden pagada:', materializeErr);
    }

    return new Response(JSON.stringify({ success: true, orderId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
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
