// ============================================================================
// SUPABASE EDGE FUNCTION - PROCESAR WEBHOOK DE KHIPU
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhookData, signature, secret } = await req.json()

    // Validar datos requeridos
    if (!webhookData || !signature || !secret) {
      throw new Error('Datos incompletos para procesar webhook')
    }

    // Verificar firma HMAC-SHA256
    const isValidSignature = await verifyKhipuSignature(
      JSON.stringify(webhookData), 
      signature, 
      secret
    )

    if (!isValidSignature) {
      console.error('Firma de webhook inválida')
      throw new Error('Firma de webhook inválida')
    }

    console.log('Webhook de Khipu validado:', webhookData)

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Procesar según el estado del pago
    if (webhookData.status === 'done') {
      // Pago completado exitosamente
      console.log('Pago completado:', webhookData.transaction_id)
      
      // Extraer orderId del transaction_id
      const orderIdMatch = webhookData.transaction_id.match(/SELLSI-([^-]+)-/)
      if (!orderIdMatch) {
        throw new Error('No se pudo extraer Order ID del transaction_id')
      }
      
      const orderId = orderIdMatch[1]
      
      // Actualizar orden en la base de datos
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'paid',
          khipu_payment_id: webhookData.payment_id,
          khipu_transaction_id: webhookData.transaction_id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()

      if (updateError) {
        console.error('Error actualizando orden:', updateError)
        throw new Error(`Error actualizando orden: ${updateError.message}`)
      }

      console.log('Orden actualizada exitosamente:', updateData)

      // TODO: Aquí puedes agregar lógica adicional como:
      // - Enviar email de confirmación
      // - Actualizar inventario
      // - Crear registro de venta
      // - Notificar a proveedores

    } else if (webhookData.status === 'rejected') {
      // Pago rechazado
      console.log('Pago rechazado:', webhookData.transaction_id)
      
      const orderIdMatch = webhookData.transaction_id.match(/SELLSI-([^-]+)-/)
      if (orderIdMatch) {
        const orderId = orderIdMatch[1]
        
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: true,
        status: webhookData.status,
        transaction_id: webhookData.transaction_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en función process-khipu-webhook:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Verificar firma HMAC-SHA256 del webhook de Khipu
 */
async function verifyKhipuSignature(requestBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  try {
    // Extraer timestamp y firma de la cabecera
    const parts = signatureHeader.split(',')
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signaturePart = parts.find(p => p.startsWith('s='))
    
    if (!timestampPart || !signaturePart) {
      return false
    }
    
    const timestamp = timestampPart.split('=')[1]
    const signature = signaturePart.split('=')[1]

    // Crear la cadena de texto que se firmó originalmente
    const stringToSign = `${timestamp}.${requestBody}`

    // Generar la firma esperada usando la llave secreta
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(stringToSign)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Comparar firmas de forma segura
    return signature === expectedSignature
    
  } catch (error) {
    console.error('Error verificando firma:', error)
    return false
  }
}
