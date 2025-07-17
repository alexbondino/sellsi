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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
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
      console.error('Error verificando IP baneada:', banError);
    }

    // Si la IP está baneada, registrar intento pero no actualizar
    if (bannedIp) {
      console.log(`🚫 IP baneada intentó acceder: ${clientIp} - Usuario: ${user_id}`);
      
      return new Response(
        JSON.stringify({ 
          error: "IP baneada", 
          reason: bannedIp.banned_reason || 'Acceso denegado',
          ip: clientIp 
        }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar last_ip solo si es diferente (evitar updates innecesarios)
    if (existingUser.last_ip !== clientIp) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          last_ip: clientIp,
          updatedt: timestamp
        })
        .eq("user_id", user_id);

      if (updateError) {
        console.error('Error actualizando last_ip:', updateError);
        return new Response(
          JSON.stringify({ error: "Error actualizando IP: " + updateError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Preparar respuesta con información de auditoría
    const response = {
      success: true,
      ip: clientIp,
      previous_ip: existingUser.last_ip,
      updated: existingUser.last_ip !== clientIp,
      timestamp: timestamp,
      user_id: user_id,
      ip_status: bannedIp ? 'banned' : 'clean'
    };

    // Log de auditoría para debugging
    console.log('✅ IP actualizada:', {
      user_id: user_id,
      email: existingUser.email,
      old_ip: existingUser.last_ip,
      new_ip: clientIp,
      user_agent: userAgent,
      timestamp: timestamp
    });

    return new Response(
      JSON.stringify(response), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error inesperado en update-lastip:', error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
