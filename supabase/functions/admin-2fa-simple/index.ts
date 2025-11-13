// @ts-nocheck
// Versión simplificada de admin-2fa para login (sin bcrypt pesado)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const requestData = await req.json()
    const { action, adminId, password } = requestData

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Solo manejar verify_password
    if (action === 'verify_password') {
      if (!password || !adminId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password and adminId required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Usar cliente anónimo
      const supabase = createClient(supabaseUrl, anonKey)

      const { data: adminData, error: adminErr } = await supabase
        .from('control_panel_users')
        .select('id, password_hash')
        .eq('id', adminId)
        .single()

      if (adminErr || !adminData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Admin not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Usar RPC para verificar contraseña con bcrypt en PostgreSQL
      const { data: verifyData, error: verifyErr } = await supabase.rpc('verify_admin_password', {
        p_admin_id: adminId,
        p_password: password
      })

      if (verifyErr || !verifyData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      return new Response(
        JSON.stringify({ success: true, needs_rehash: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action not supported in simple mode' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
