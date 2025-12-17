// @ts-nocheck
/**
 * Edge Function: admin-2fa
 * Maneja autenticación 2FA para el panel de administración
 * 
 * Acciones:
 * - verify_password: Verifica contraseña de admin (sin auth)
 * - generate_secret: Genera secreto TOTP para 2FA (requiere auth)
 * - verify_token: Verifica código 2FA (sin auth)
 * - check_trust: Verifica si dispositivo es confiable (sin auth)
 * - change_password: Cambia contraseña (requiere auth)
 * - disable_2fa: Desactiva 2FA (requiere auth)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import * as OTPAuth from 'otpauth'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return new Uint8Array(sigBuf)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trust-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Rate limiting en memoria (ELIMINADO - Usamos DB)
// const attemptsMap: Map<string, { count: number; first: number }> = (globalThis as any).admin2faAttempts || new Map()
// ;(globalThis as any).admin2faAttempts = attemptsMap
// const MAX_ATTEMPTS = 5
// const WINDOW_MS = 5 * 60 * 1000 // 5 minutos

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parsear request body
    let requestData
    try {
      requestData = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { action, adminId, token, password, device_fingerprint, remember } = requestData

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Acciones que NO requieren autenticación (son parte del login)
    // generate_secret se mueve aquí pero requerirá password para seguridad
    const publicActions = ['verify_password', 'verify_token', 'check_trust', 'generate_secret']
    const requiresAuth = !publicActions.includes(action)
    
    let authUser: any = null
    let supabase: any

    if (requiresAuth) {
      // Verificar Authorization header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      authUser = userData.user
    } else {
      // Cliente anónimo para acciones públicas
      // IMPORTANTE: Si la acción es generate_secret o verify_token, necesitamos permisos de escritura
      // en control_panel_users, pero el usuario aún no está autenticado.
      // Usamos SERVICE_ROLE_KEY solo si hemos verificado la contraseña (en generate_secret)
      // o si estamos verificando el token (en verify_token).
      
      if (action === 'generate_secret' || action === 'verify_token') {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) {
           console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
           // Fallback a anonKey, pero fallará si hay RLS estricto
           supabase = createClient(supabaseUrl, anonKey)
        } else {
           supabase = createClient(supabaseUrl, serviceRoleKey)
        }
      } else {
        supabase = createClient(supabaseUrl, anonKey)
      }
    }

    // Acciones que requieren adminId
    const actionsRequiringAdminId = ['generate_secret', 'verify_token', 'disable_2fa', 'verify_password', 'change_password']
    if (actionsRequiringAdminId.includes(action) && !adminId) {
      return new Response(
        JSON.stringify({ success: false, error: 'adminId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Cargar datos del admin si se requiere
    let adminRow: any = null
    if (adminId) {
      const { data: adminData, error: adminErr } = await supabase
        .from('control_panel_users')
        .select('id, email, twofa_secret, twofa_configured, password_hash')
        .eq('id', adminId)
        .eq('is_active', true)
        .limit(1)
        .single()
        
      if (adminErr || !adminData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Admin not found or inactive' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }
      
      // Verificar que el email coincida si está autenticado
      if (requiresAuth && adminData.email && authUser && adminData.email.toLowerCase() !== authUser.email?.toLowerCase()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
      
      adminRow = adminData
    }

    // Router de acciones
    switch (action) {
      case 'verify_password': {
        if (!password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Password required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        if (!adminRow?.password_hash) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin not found or no password set' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }
        
        // Verificar password usando RPC PostgreSQL (bcrypt)
        const { data: passwordMatch, error: verifyError } = await supabase
          .rpc('verify_admin_password', {
            p_admin_id: adminId,
            p_password: password
          })
        
        if (verifyError) {
          console.error('Password verification error:', verifyError)
          return new Response(
            JSON.stringify({ success: false, error: 'Password verification failed' }),
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
      }

      case 'generate_secret': {
        // Si no está autenticado (flujo de login), requerir y verificar contraseña
        if (!authUser) {
          if (!password) {
            return new Response(
              JSON.stringify({ success: false, error: 'Password required for initial setup' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Verificar password
          const { data: passwordMatch, error: verifyError } = await supabase
            .rpc('verify_admin_password', {
              p_admin_id: adminId,
              p_password: password
            })
          
          if (verifyError || !passwordMatch) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid password' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
          }
        }

        // Generar secreto para 2FA
        const secret = new OTPAuth.Secret({ size: 20 }).base32
        const appName = 'Sellsi Admin Panel'
        const email = adminRow?.email || authUser?.email || 'admin@sellsi.com'
        const totp = new OTPAuth.TOTP({ issuer: appName, label: email, secret: secret })
        const otpauth = totp.toString()
        
        // Guardar secreto (twofa_configured = false hasta verificar primer token)
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: secret, twofa_configured: false })
          .eq('id', adminId)
        
        if (error) {
          console.error('Error saving 2FA secret:', error)
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
        if (!adminRow?.twofa_secret) {
          return new Response(
            JSON.stringify({ success: false, error: '2FA not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // 1. Verificar Rate Limit en DB (persistente / atómico)
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
        const { data: limitCheck, error: rpcError } = await supabase
          .rpc('check_admin_rate_limit', { p_admin_id: adminId, p_ip_address: ipAddress, p_action: '2fa_verify' })

        if (rpcError) {
          console.error('Rate limit check error:', rpcError)
          // Fail-secure: Si no podemos verificar el límite, bloqueamos por seguridad
          return new Response(
            JSON.stringify({ success: false, error: 'Security check failed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        if (!limitCheck.allowed) {
          return new Response(
            JSON.stringify({ success: false, error: limitCheck.error || 'Too many attempts' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          )
        }
        
        // Normalizar token (si tiene 5 dígitos, agregar 0 al inicio)
        let normalizedToken = String(token ?? '').trim()
        if (normalizedToken.length === 5) normalizedToken = normalizedToken.padStart(6, '0')
        
        // Verificar token TOTP
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(adminRow.twofa_secret) })
        const isValid = totp.validate({ token: normalizedToken, window: 1 }) !== null
        
        // Registrar intento (éxito o fallo)
        // Esto incrementa el contador en la DB si falló
        await supabase.rpc('log_admin_auth_attempt', {
          p_admin_id: adminId,
          p_success: isValid,
          p_ip_address: ipAddress,
          p_action: '2fa_verify'
        })
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // Si es válido, continuamos con la actualización de estado...
        
        // Actualizar twofa_configured y last_login
        await supabase
          .from('control_panel_users')
          .update({ twofa_configured: true, last_login: new Date().toISOString() })
          .eq('id', adminId)
        
        // Manejar "remember device" (dispositivos confiables)
        let trust_token: string | undefined = undefined
        
        if (remember && device_fingerprint) {
          const trustSecret = Deno.env.get('EDGE_TRUST_SECRET')
          // Fail-secure: si no hay secreto, simplemente no emitimos trust token
          if (!trustSecret) {
            console.error('Missing EDGE_TRUST_SECRET; trust token disabled')
          }

          // Device hash: HMAC(secret, fingerprint:adminId) para evitar rainbow/lookup offline
          const deviceHmac = trustSecret ? await hmacSha256(trustSecret, device_fingerprint + ':' + adminId) : null
          const hashHex = deviceHmac
            ? Array.from(deviceHmac).map(b => b.toString(16).padStart(2, '0')).join('')
            : null
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
          
          if (!hashHex) {
            // No podemos registrar trusted device sin secreto
            return new Response(
              JSON.stringify({ success: true, trust_token: undefined }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
          }

          // Upsert trusted device
          const { data: existing } = await supabase
            .from('admin_trusted_devices')
            .select('id, token_id')
            .eq('admin_id', adminId)
            .eq('device_hash', hashHex)
            .limit(1)
            .maybeSingle()
          
          let tokenId = existing?.token_id
          
          if (existing) {
            await supabase
              .from('admin_trusted_devices')
              .update({ last_used_at: new Date().toISOString(), expires_at: expiresAt })
              .eq('id', existing.id)
          } else {
            const { data: inserted } = await supabase
              .from('admin_trusted_devices')
              .insert({
                admin_id: adminId,
                device_hash: hashHex,
                expires_at: expiresAt,
                user_agent: req.headers.get('user-agent') || null
              })
              .select('token_id')
              .single()
            
            tokenId = inserted?.token_id
          }
          
          if (tokenId) {
            // Crear trust token firmado con HMAC (sin fallbacks inseguros)
            const trustSecret = Deno.env.get('EDGE_TRUST_SECRET')
            if (!trustSecret) {
              console.error('Missing EDGE_TRUST_SECRET; trust token disabled')
            } else {
              const payload = JSON.stringify({ aid: adminId, tk: tokenId, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 })
              const sigBytes = await hmacSha256(trustSecret, payload)
              const sigB64 = bytesToBase64(sigBytes)
              trust_token = btoa(payload) + '.' + sigB64
            }
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, trust_token }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'check_trust': {
        if (!device_fingerprint || !adminId) {
          return new Response(
            JSON.stringify({ success: false, error: 'device_fingerprint and adminId required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        const trustHeader = req.headers.get('x-trust-token')
        if (!trustHeader) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        // Verificar firma del trust token (fail-secure: sin secreto nunca es trusted)
        const trustSecret = Deno.env.get('EDGE_TRUST_SECRET')
        if (!trustSecret) {
          console.error('Missing EDGE_TRUST_SECRET; trust disabled')
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        const [payloadB64, sig] = trustHeader.split('.')
        
        if (!payloadB64 || !sig) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        let payloadJson: any
        try {
          payloadJson = JSON.parse(atob(payloadB64))
        } catch {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        if (payloadJson.aid !== adminId || payloadJson.exp * 1000 < Date.now()) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        // Verificar firma HMAC usando crypto.subtle.verify (evita compare no-constante)
        const enc = new TextEncoder()
        const key = await crypto.subtle.importKey('raw', enc.encode(trustSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
        const ok = await crypto.subtle.verify('HMAC', key, base64ToBytes(sig), enc.encode(atob(payloadB64)))
        if (!ok) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        // Verificar que el device_hash existe en la BD
        const deviceHmac = await hmacSha256(trustSecret, device_fingerprint + ':' + adminId)
        const hashHex = Array.from(deviceHmac).map(b => b.toString(16).padStart(2, '0')).join('')
        
        const { data: row } = await supabase
          .from('admin_trusted_devices')
          .select('id, expires_at')
          .eq('admin_id', adminId)
          .eq('device_hash', hashHex)
          .limit(1)
          .maybeSingle()
        
        if (!row) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        if (new Date(row.expires_at).getTime() < Date.now()) {
          return new Response(
            JSON.stringify({ success: true, trusted: false, expired: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        // Actualizar last_used_at
        await supabase
          .from('admin_trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', row.id)
        
        return new Response(
          JSON.stringify({ success: true, trusted: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'change_password': {
        const { old_password, new_password } = requestData
        
        if (!old_password || !new_password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Old and new password required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        if (new_password.length < 8) {
          return new Response(
            JSON.stringify({ success: false, error: 'New password must be at least 8 characters' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // Verificar contraseña actual
        const { data: passwordMatch } = await supabase.rpc('verify_admin_password', {
          p_admin_id: adminId,
          p_password: old_password
        })
        
        if (!passwordMatch) {
          return new Response(
            JSON.stringify({ success: false, error: 'Current password incorrect' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }
        
        // Generar nuevo hash usando PostgreSQL
        const { data: newHash, error: hashError } = await supabase.rpc('generate_password_hash', {
          p_password: new_password
        })
        
        if (hashError || !newHash) {
          console.error('Error generating password hash:', hashError)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to hash password' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        
        // Actualizar contraseña
        const { error: updateError } = await supabase
          .from('control_panel_users')
          .update({ password_hash: newHash })
          .eq('id', adminId)
        
        if (updateError) {
          console.error('Error updating password:', updateError)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update password' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Password changed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'disable_2fa': {
        if (!password || !token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Password and token required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        if (!adminRow?.twofa_secret) {
          return new Response(
            JSON.stringify({ success: false, error: '2FA not enabled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // Verificar contraseña
        const { data: passwordMatch } = await supabase.rpc('verify_admin_password', {
          p_admin_id: adminId,
          p_password: password
        })
        
        if (!passwordMatch) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid password' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }
        
        // Verificar token
        let normalizedToken = String(token ?? '').trim()
        if (normalizedToken.length === 5) normalizedToken = normalizedToken.padStart(6, '0')
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(adminRow.twofa_secret) })
        const valid = totp.validate({ token: normalizedToken, window: 1 }) !== null
        
        if (!valid) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // Desactivar 2FA
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: null, twofa_configured: false })
          .eq('id', adminId)
        
        if (error) {
          console.error('Error disabling 2FA:', error)
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
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})


