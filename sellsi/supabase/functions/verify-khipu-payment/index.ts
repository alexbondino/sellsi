// ============================================================================
// SUPABASE EDGE FUNCTION - VERIFICAR PAGO EN KHIPU
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { paymentId, receiverId, secret } = await req.json()

    // Validar datos requeridos
    if (!paymentId || !receiverId || !secret) {
      throw new Error('Datos incompletos para verificar pago')
    }

    // Preparar autenticación básica para Khipu
    const auth = btoa(`${receiverId}:${secret}`)
    
    // Llamar a la API de Khipu para verificar el estado del pago
    const response = await fetch(`https://api.khipu.com/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error verificando pago en Khipu:', errorData)
      throw new Error(`Error de API Khipu: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    console.log('Estado del pago en Khipu:', data)

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: data.payment_id,
        transaction_id: data.transaction_id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        subject: data.subject,
        body: data.body,
        picture_url: data.picture_url,
        receipt_url: data.receipt_url,
        return_url: data.return_url,
        cancel_url: data.cancel_url,
        notify_url: data.notify_url,
        notify_api_version: data.notify_api_version,
        expires_date: data.expires_date,
        attachment_urls: data.attachment_urls,
        bank: data.bank,
        bank_id: data.bank_id,
        payer_name: data.payer_name,
        payer_email: data.payer_email,
        personal_identifier: data.personal_identifier,
        bank_account_number: data.bank_account_number,
        out_of_date_conciliation: data.out_of_date_conciliation,
        custom: data.custom,
        responsible_user_email: data.responsible_user_email,
        send_reminders: data.send_reminders,
        send_email: data.send_email,
        payment_method: data.payment_method,
        funds_source: data.funds_source,
        paid_at: data.paid_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en función verify-khipu-payment:', error)
    
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
