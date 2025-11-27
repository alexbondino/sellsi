/**
 * Edge Function: Subida de Certificado Digital (VERSIÓN CORREGIDA)
 * POST /upload-certificate
 * 
 * CAMBIOS vs versión anterior:
 * 1. Consulta tabla 'users' en vez de 'suppliers'
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadCertificateRequest {
  supplierId: string;
  pfxBase64: string;
  passphrase: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('CERTIFICATE_ENCRYPTION_KEY')!;
    
    if (!encryptionKey || encryptionKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      console.error('CERTIFICATE_ENCRYPTION_KEY inválida o no configurada');
      return new Response(
        JSON.stringify({ error: 'Configuración de cifrado no disponible' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: UploadCertificateRequest = await req.json();

    if (!body.supplierId || !body.pfxBase64 || !body.passphrase) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: supplierId, pfxBase64, passphrase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño máximo del PFX (2MB - certificados son típicamente <50KB)
    if (body.pfxBase64.length > 2 * 1024 * 1024 * 1.37) { // 1.37 = overhead base64
      return new Response(
        JSON.stringify({ error: 'El archivo PFX excede el tamaño máximo permitido (2MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar longitud de passphrase
    if (body.passphrase.length < 1 || body.passphrase.length > 256) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener entre 1 y 256 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // CORRECCIÓN: Verificar en tabla 'users', no 'suppliers'
    // ============================================================
    const { data: supplierUser, error: supplierError } = await supabase
      .from('users')
      .select('user_id, user_nm, rut')
      .eq('user_id', body.supplierId)
      .single();

    if (supplierError || !supplierUser) {
      return new Response(
        JSON.stringify({ error: 'Proveedor no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario autenticado ES el supplier (normalizar UUIDs)
    if (supplierUser.user_id.toLowerCase() !== user.id.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'No tiene acceso a este proveedor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decodificar y validar el PFX
    let pfxBytes: Uint8Array;
    try {
      pfxBytes = base64ToUint8Array(body.pfxBase64);
    } catch {
      return new Response(
        JSON.stringify({ error: 'El archivo PFX no está correctamente codificado en Base64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño mínimo y máximo razonable para un PFX
    if (pfxBytes.length < 100) {
      return new Response(
        JSON.stringify({ error: 'El archivo PFX es demasiado pequeño para ser válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (pfxBytes.length > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'El archivo PFX excede el tamaño máximo (2MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que es un PFX válido (ASN.1 SEQUENCE - primer byte debe ser 0x30)
    // PKCS#12 comienza con SEQUENCE tag
    if (pfxBytes[0] !== 0x30) {
      return new Response(
        JSON.stringify({ error: 'El archivo no parece ser un certificado PFX/P12 válido (formato ASN.1 incorrecto)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cifrar el PFX con AES-256-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      hexToUint8Array(encryptionKey),
      'AES-GCM',
      false,
      ['encrypt']
    );

    const encryptedPfx = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      pfxBytes
    );

    const encryptedArray = new Uint8Array(encryptedPfx);
    const authTag = encryptedArray.slice(-16);
    const ciphertext = encryptedArray.slice(0, -16);

    // Extraer información del certificado (placeholder hasta que se valide)
    // NOTA: El RUT placeholder '0-0' cumple el regex de la tabla pero es claramente temporal
    // La información real del titular se extrae del PFX al primer uso (emit-dte)
    const certInfo = {
      rutTitular: '0-0', // Placeholder válido - se actualiza al validar el certificado
      nombreTitular: 'PENDIENTE VALIDACIÓN',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 año placeholder
      fingerprint: await calculateFingerprint(pfxBytes),
    };

    // Desactivar certificados anteriores
    await supabase
      .from('supplier_certificates')
      .update({ is_active: false })
      .eq('supplier_id', body.supplierId);

    // Guardar nuevo certificado
    const { data: certRecord, error: insertError } = await supabase
      .from('supplier_certificates')
      .insert({
        supplier_id: body.supplierId,
        rut_titular: certInfo.rutTitular,
        nombre_titular: certInfo.nombreTitular,
        pfx_encrypted: uint8ArrayToBase64(ciphertext),
        iv: uint8ArrayToBase64(iv),
        auth_tag: uint8ArrayToBase64(authTag),
        valid_from: certInfo.validFrom.toISOString(),
        valid_to: certInfo.validTo.toISOString(),
        fingerprint: certInfo.fingerprint,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando certificado:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el certificado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cifrar y guardar passphrase
    const passphraseIv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const passphraseBytes = encoder.encode(body.passphrase);

    const encryptedPassphrase = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: passphraseIv },
      keyMaterial,
      passphraseBytes
    );

    const encPassArray = new Uint8Array(encryptedPassphrase);
    const passAuthTag = encPassArray.slice(-16);
    const passCiphertext = encPassArray.slice(0, -16);

    const { error: secretError } = await supabase
      .from('supplier_secrets')
      .upsert({
        supplier_id: body.supplierId,
        passphrase_encrypted: uint8ArrayToBase64(passCiphertext),
        passphrase_iv: uint8ArrayToBase64(passphraseIv),
        passphrase_auth_tag: uint8ArrayToBase64(passAuthTag),
        updated_at: new Date().toISOString(),
      });

    if (secretError) {
      console.error('Error guardando passphrase:', secretError);
      // CRÍTICO: Sin passphrase el certificado es inútil - hacer rollback
      await supabase
        .from('supplier_certificates')
        .delete()
        .eq('id', certRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Error al guardar las credenciales del certificado. Intente nuevamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificateId: certRecord.id,
        fingerprint: certInfo.fingerprint,
        validTo: certInfo.validTo.toISOString(),
        mensaje: 'Certificado subido correctamente. La información del titular se validará al primer uso.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en upload-certificate:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function calculateFingerprint(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
