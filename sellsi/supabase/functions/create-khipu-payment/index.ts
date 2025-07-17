// ============================================================================
// SUPABASE EDGE FUNCTION - CREAR PAGO EN KHIPU
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
    const { khipuData, receiverId, secret } = await req.json()

    // Validar datos requeridos
    if (!khipuData || !receiverId || !secret) {
      throw new Error('Datos incompletos para crear pago')
    }

    // Preparar autenticación básica para Khipu
    const auth = btoa(`${receiverId}:${secret}`)
    
    // Llamar a la API de Khipu
    const response = await fetch('https://api.khipu.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(khipuData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error de Khipu:', errorData)
      throw new Error(`Error de API Khipu: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    console.log('Respuesta exitosa de Khipu:', data)

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: data.payment_id,
        payment_url: data.payment_url,
        simplified_transfer_url: data.simplified_transfer_url,
        transfer_url: data.transfer_url,
        app_url: data.app_url,
        ready_for_terminal: data.ready_for_terminal
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en función create-khipu-payment:', error)
    
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
