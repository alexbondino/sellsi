/**
 * 📡 Edge Function para Tracking de IP de Usuarios
 * 
 * Actualiza el campo last_ip del usuario en la tabla users
 * con auditoría completa y validaciones de seguridad.
 * 
 * @author Sistema de Auditoría Sellsi
 * @date 16 de Julio de 2025
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withMetrics } from '../_shared/metrics.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 🚀 OPTIMIZACIÓN: Reducir logging masivo que consume BigQuery
const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'
const log = DEBUG_MODE ? console.log : () => {}
const logError = DEBUG_MODE ? console.error : () => {}

serve((req) => withMetrics('update-lastip', req, async () => {
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo acepta POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Solo se permiten POST requests' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Inicializar cliente Supabase con service role para operaciones administrativas
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validar y obtener datos del body
    let user_id: string;
    let sessionInfo: any = null;
    
    try {
      const body = await req.json();
      user_id = body.user_id;
      sessionInfo = body.session_info;
      
      if (!user_id || typeof user_id !== 'string') {
        throw new Error("user_id es requerido y debe ser string");
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos: " + e.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener IP del request con múltiples fuentes
    const getClientIP = (req: Request): string => {
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare
      const xOriginalForwarded = req.headers.get("x-original-forwarded-for");
      
      // Prioridad: Cloudflare > X-Forwarded-For > X-Real-IP > X-Original-Forwarded-For
      let ip = cfConnectingIp || forwarded || realIp || xOriginalForwarded || 'unknown';
      
      // Si hay múltiples IPs en X-Forwarded-For, tomar la primera (cliente real)
      if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      
      return ip;
    };

    const clientIp = getClientIP(req);
    const timestamp = new Date().toISOString();
    const userAgent = req.headers.get("user-agent") || 'unknown';

    // Verificar si el usuario existe
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('user_id, last_ip, banned, email')
      .eq('user_id', user_id)
      .single();

    if (userError || !existingUser) {
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  // Verificar si la IP está baneada
    const { data: bannedIp, error: banError } = await supabase
      .from('banned_ips')
      .select('ip, banned_reason')
      .eq('ip', clientIp)
      .single();

    if (banError && banError.code !== 'PGRST116') {
      logError('Error verificando IP baneada:', banError);
    }

    // Si la IP está baneada, registrar intento pero no actualizar
    if (bannedIp) {
      log(`🚫 IP baneada intentó acceder: ${clientIp} - Usuario: ${user_id}`);
      
      return new Response(
        JSON.stringify({ 
          error: "IP baneada", 
          reason: bannedIp.banned_reason || 'Acceso denegado',
          ip: clientIp 
        }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TTL server-side para evitar spam (env override IP_UPDATE_MIN_INTERVAL_SEC)
    const MIN_INTERVAL_SEC = parseInt(Deno.env.get('IP_UPDATE_MIN_INTERVAL_SEC') || '600'); // 10 min default

    // Usar tabla de auditoría ip_updates si existe para última actualización (fallback a updatedt)
    let lastServerUpdate: Date | null = null;
    if (existingUser.updatedt) {
      try { lastServerUpdate = new Date(existingUser.updatedt); } catch (_) {}
    }

    const nowTs = new Date();
    const elapsedSec = lastServerUpdate ? (nowTs.getTime() - lastServerUpdate.getTime()) / 1000 : Infinity;

    // Procesar batch metadata si viene en sessionInfo.actions_summary
    let actionsSummary: Record<string, number> | undefined;
    if (sessionInfo && typeof sessionInfo === 'object' && sessionInfo.actions_summary) {
      actionsSummary = sessionInfo.actions_summary;
    }

    let updated = false;
    let skippedReason: string | undefined;
    if (existingUser.last_ip !== clientIp) {
      // IP cambió: siempre actualizar ignorando TTL
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          last_ip: clientIp,
          updatedt: timestamp
        })
        .eq("user_id", user_id);
      if (updateError) {
        logError('Error actualizando last_ip:', updateError);
        return new Response(
          JSON.stringify({ error: "Error actualizando IP: " + updateError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      updated = true;
    } else if (elapsedSec < MIN_INTERVAL_SEC && !actionsSummary) {
      // Misma IP y dentro de TTL y no es batch con summary => omitir
      skippedReason = 'ttl';
    } else {
      // Misma IP pero TTL expiró o trae summary (auditoría de acciones): refrescar timestamp
      const { error: touchError } = await supabase
        .from('users')
        .update({ updatedt: timestamp })
        .eq('user_id', user_id);
      if (touchError) {
        logError('Error tocando updatedt:', touchError);
      }
    }

    // Preparar respuesta con información de auditoría
    const response: any = {
      success: true,
      ip: clientIp,
      previous_ip: existingUser.last_ip,
      updated,
      timestamp: timestamp,
      user_id: user_id,
      ip_status: bannedIp ? 'banned' : 'clean',
      skipped_reason: skippedReason,
      server_ttl_sec: MIN_INTERVAL_SEC
    };
    if (actionsSummary) {
      response.actions_summary = actionsSummary;
      response.total_actions = Object.values(actionsSummary).reduce((a: number, b: number) => a + (b as number), 0);
    }

    // Log de auditoría para debugging
    log('✅ update-lastip:', {
      user_id: user_id,
      email: existingUser.email,
      old_ip: existingUser.last_ip,
      new_ip: clientIp,
      updated,
      skippedReason,
      ttlSec: MIN_INTERVAL_SEC,
      actions: actionsSummary,
      user_agent: userAgent,
      timestamp: timestamp
    });

    return new Response(
      JSON.stringify(response), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('Error inesperado en update-lastip:', error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
