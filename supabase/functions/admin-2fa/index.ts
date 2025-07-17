import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticator } from 'https://esm.sh/otplib@12.0.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🚀 OPTIMIZACIÓN: Reducir logging para ahorrar BigQuery quota
const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'
const log = DEBUG_MODE ? console.log : () => {}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 🚀 OPTIMIZACIÓN: JSON parsing sin logs excesivos
    let requestData
    try {
      requestData = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { action, adminId, token } = requestData

    switch (action) {
      case 'generate_secret': {
        // Generar nuevo secret para 2FA
        const secret = authenticator.generateSecret()
        const appName = 'Sellsi Admin Panel'
        const email = req.headers.get('admin-email') || 'admin@sellsi.com'
        
        const otpauth = authenticator.keyuri(email, appName, secret)
        
        // 🚀 OPTIMIZACIÓN: Update optimizado
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: secret })
          .eq('id', adminId)
          .select('id')

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to save 2FA secret' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        return new Response(
          JSON.stringify({ success: true, secret, qrCode: otpauth }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'verify_token': {
        // 🚀 OPTIMIZACIÓN: Query optimizada
        const { data: admin, error } = await supabase
          .from('control_panel_users')
          .select('twofa_secret')
          .eq('id', adminId)
          .limit(1)
          .single()

        if (error || !admin?.twofa_secret) {
          return new Response(
            JSON.stringify({ success: false, error: '2FA not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const isValid = authenticator.verify({ token: token, secret: admin.twofa_secret })

        return new Response(
          JSON.stringify({ success: true, isValid }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'disable_2fa': {
        // 🚀 OPTIMIZACIÓN: Update directo
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: null, twofa_configured: false })
          .eq('id', adminId)
          .select('id')

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to disable 2FA' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: '2FA disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    // 🚀 OPTIMIZACIÓN: Error handling sin logs masivos
    log('Function error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
