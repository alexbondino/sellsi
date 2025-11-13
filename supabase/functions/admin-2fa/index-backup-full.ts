// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticator } from 'https://esm.sh/otplib@12.0.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-email',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'
const log = DEBUG_MODE ? console.log : () => {}

// In-memory attempt tracking (NOTE: ephemeral per function instance)
const attemptsMap: Map<string, { count: number; first: number }> = (globalThis as any).admin2faAttempts || new Map();
(globalThis as any).admin2faAttempts = attemptsMap;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  // Handle CORS preflight FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Parse JSON request body
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

    // Basic input validation
    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // verify_password no requiere autenticación (es parte del login)
    const requiresAuth = action !== 'verify_password';
    
    let authUser: any = null;
    let supabase: any;

    if (requiresAuth) {
      // Expect Authorization Bearer token from client
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Validate authenticated user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      authUser = userData.user;
    } else {
      // Para verify_password, usar cliente anónimo
      supabase = createClient(supabaseUrl, anonKey);
    }

    // Actions that require adminId
    const actionsRequiringAdminId = ['generate_secret', 'verify_token', 'disable_2fa', 'verify_password', 'change_password'];
    if (actionsRequiringAdminId.includes(action) && !adminId) {
      return new Response(
        JSON.stringify({ success: false, error: 'adminId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let adminRow: any = null;
    if (adminId) {
      const { data: adminData, error: adminErr } = await supabase
        .from('control_panel_users')
        .select('id, email, twofa_secret, twofa_configured, password_hash')
        .eq('id', adminId)
        .limit(1)
        .single();
      if (adminErr || !adminData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Admin not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }
      // Authorization: email must match authenticated user (solo si está autenticado)
      if (requiresAuth && adminData.email && authUser && adminData.email.toLowerCase() !== authUser.email?.toLowerCase()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
      adminRow = adminData;
    }

    switch (action) {
      case 'generate_secret': {
        // Invalidate previous secret (audit) if exists
        if (adminRow?.twofa_secret) {
          await supabase.from('admin_audit_log').insert({
            admin_id: adminId,
            action: '2fa_secret_regenerated',
            details: { previousConfigured: adminRow.twofa_configured }
          });
        }
        const secret = authenticator.generateSecret();
        const appName = 'Sellsi Admin Panel';
        const email = adminRow?.email || authUser.email || 'admin@sellsi.com';
        const otpauth = authenticator.keyuri(email, appName, secret);
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: secret, twofa_configured: false })
          .eq('id', adminId)
          .select('id');
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
        if (!adminRow?.twofa_secret) {
          return new Response(
            JSON.stringify({ success: false, error: '2FA not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        // If remember flag and device fingerprint provided, attempt trust pre-check (still must validate token once)
        // Rate limiting attempts
        const now = Date.now();
        const entry = attemptsMap.get(adminId) || { count: 0, first: now };
        if (now - entry.first > WINDOW_MS) {
          entry.count = 0; entry.first = now;
        }
        if (entry.count >= MAX_ATTEMPTS) {
          const retryIn = Math.max(0, WINDOW_MS - (now - entry.first));
            return new Response(
              JSON.stringify({ success: false, error: 'Too many attempts', retry_in_ms: retryIn }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
            )
        }
        let normalizedToken = String(token ?? '').trim();
        if (normalizedToken.length === 5) normalizedToken = normalizedToken.padStart(6, '0');
        const isValid = authenticator.verify({ token: normalizedToken, secret: adminRow.twofa_secret });
        if (!isValid) {
          entry.count += 1;
          attemptsMap.set(adminId, entry);
          const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - entry.count);
          await supabase.from('admin_audit_log').insert({
            admin_id: adminId,
            action: '2fa_verify_failed',
            details: { attemptsRemaining }
          });
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token', attempts_remaining: attemptsRemaining }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        // Reset attempts
        attemptsMap.delete(adminId);
        // Update configured + last_login
        const { error: updErr } = await supabase
          .from('control_panel_users')
          .update({ twofa_configured: true, last_login: new Date().toISOString() })
          .eq('id', adminId)
          .select('id');
        if (updErr) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update 2FA status' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        await supabase.from('admin_audit_log').insert({
          admin_id: adminId,
          action: '2fa_verified_login',
          details: { user_agent: req.headers.get('user-agent') }
        });

        let trust_token: string | undefined = undefined;
        if (remember && device_fingerprint) {
          // Derive hash server-side: device_fingerprint should already be a hash base64/hex from client; re-hash to avoid raw fingerprint storage
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(device_fingerprint + ':' + adminId));
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
          const expiresAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();
          // Upsert trusted device
          const { data: existing } = await supabase
            .from('admin_trusted_devices')
            .select('id, token_id')
            .eq('admin_id', adminId)
            .eq('device_hash', hashHex)
            .limit(1)
            .maybeSingle();
          let tokenId = existing?.token_id;
          if (existing) {
            await supabase
              .from('admin_trusted_devices')
              .update({ last_used_at: new Date().toISOString(), expires_at: expiresAt })
              .eq('id', existing.id);
          } else {
            const { data: inserted } = await supabase
              .from('admin_trusted_devices')
              .insert({ admin_id: adminId, device_hash: hashHex, expires_at: expiresAt, user_agent: req.headers.get('user-agent') || null })
              .select('token_id')
              .single();
            tokenId = inserted?.token_id;
          }
          if (tokenId) {
            // Build a signed trust token (JWT-like simple HMAC) - we rely on an EDGE_SECRET
            const secret = Deno.env.get('EDGE_TRUST_SECRET') || 'insecure-dev-secret';
            const payload = JSON.stringify({ aid: adminId, tk: tokenId, exp: Math.floor(Date.now()/1000) + 30*24*60*60 });
            const enc = new TextEncoder();
            const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
            const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
            trust_token = btoa(payload) + '.' + sigB64;
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
        const trustHeader = req.headers.get('x-trust-token');
        if (!trustHeader) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        const secret = Deno.env.get('EDGE_TRUST_SECRET') || 'insecure-dev-secret';
        const [payloadB64, sig] = trustHeader.split('.');
        if (!payloadB64 || !sig) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        let payloadJson: any;
        try {
          payloadJson = JSON.parse(atob(payloadB64));
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
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const expectedSigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(JSON.stringify(payloadJson)));
        const expectedSigB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSigBuf)));
        if (expectedSigB64 !== sig) {
          return new Response(
            JSON.stringify({ success: true, trusted: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        // Validate device hash in DB
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(device_fingerprint + ':' + adminId));
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
        const { data: row } = await supabase
          .from('admin_trusted_devices')
          .select('id, expires_at')
          .eq('admin_id', adminId)
          .eq('device_hash', hashHex)
          .limit(1)
          .maybeSingle();
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
        // Update last_used_at
        await supabase
          .from('admin_trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', row.id);
        return new Response(
          JSON.stringify({ success: true, trusted: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'verify_password': {
        // Nueva acción para verificar contraseñas con bcrypt
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
        
        // Usar RPC de PostgreSQL para verificar password con bcrypt
        const { data: passwordMatch, error: verifyError } = await supabase
          .rpc('verify_admin_password', {
            p_admin_id: adminId,
            p_password: password
          });
        
        if (verifyError) {
          console.error('Password verification error:', verifyError);
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
          JSON.stringify({ 
            success: true, 
            valid: true,
            needs_rehash: !isBcrypt 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'change_password': {
        // Cambiar contraseña con bcrypt hash
        const { old_password, new_password } = requestData;
        
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
        
        if (!adminRow?.password_hash) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }
        
        // Verificar contraseña actual (soporta bcrypt y base64 legacy)
        const isBcrypt = adminRow.password_hash.startsWith('$2');
        let oldPasswordMatch = false;
        
        if (isBcrypt) {
          try {
            oldPasswordMatch = bcrypt.compareSync(old_password, adminRow.password_hash);
          } catch (err) {
            return new Response(
              JSON.stringify({ success: false, error: 'Password verification failed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }
        } else {
          // Legacy base64
          oldPasswordMatch = adminRow.password_hash === btoa(old_password);
        }
        
        if (!oldPasswordMatch) {
          return new Response(
            JSON.stringify({ success: false, error: 'Current password incorrect' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }
        
        // Generar nuevo hash bcrypt
        let newPasswordHash;
        try {
          newPasswordHash = bcrypt.hashSync(new_password, 10); // 10 salt rounds
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to hash password' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        
        // Llamar a la función SQL para cambiar contraseña
        const { error: rpcError } = await supabase.rpc('admin_change_password', {
          p_admin_id: adminId,
          p_new_password_hash: newPasswordHash
        });
        
        if (rpcError) {
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
        // Verify password
        if (!adminRow.password_hash || !bcrypt.compareSync(password, adminRow.password_hash)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid password' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }
        // Verify token
        let normalizedToken = String(token ?? '').trim();
        if (normalizedToken.length === 5) normalizedToken = normalizedToken.padStart(6, '0');
        const valid = authenticator.verify({ token: normalizedToken, secret: adminRow.twofa_secret });
        if (!valid) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        const { error } = await supabase
          .from('control_panel_users')
          .update({ twofa_secret: null, twofa_configured: false })
          .eq('id', adminId)
          .select('id');
        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to disable 2FA' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        await supabase.from('admin_audit_log').insert({
          admin_id: adminId,
          action: '2fa_disabled'
        });
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
    // Error handling
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

