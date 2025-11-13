// @ts-nocheck
// Versión simplificada para debugging
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS - env check:', {
      hasUrl: !!Deno.env.get('SUPABASE_URL'),
      hasKey: !!Deno.env.get('SUPABASE_ANON_KEY')
    })
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, adminId, password } = await req.json()
    
    if (action !== 'verify_password') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only verify_password supported' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Creating client...', { hasUrl: !!supabaseUrl, hasKey: !!anonKey })
    
    const supabase = createClient(supabaseUrl, anonKey)

    console.log('Calling RPC...', { adminId })

    const { data: passwordMatch, error } = await supabase.rpc('verify_admin_password', {
      p_admin_id: adminId,
      p_password: password
    })

    console.log('RPC result:', { passwordMatch, error })

    if (error) {
      console.error('RPC error:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, needs_rehash: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})


