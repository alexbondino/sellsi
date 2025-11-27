/**
 * Edge Function: Subida de CAF (VERSIÓN CORREGIDA)
 * POST /upload-caf
 * 
 * CAMBIOS vs versión anterior:
 * 1. Consulta tabla 'users' en vez de 'suppliers'
 * 2. Implementa cifrado AES-256-GCM real para el CAF
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadCAFRequest {
  supplierId: string;
  cafXml: string;
}

interface CAFData {
  tipoDte: number;
  rutEmisor: string;
  razonSocial: string;
  folioDesde: number;
  folioHasta: number;
  fechaAutorizacion: string;
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
    const encryptionKey = Deno.env.get('CAF_ENCRYPTION_KEY');
    
    // CRÍTICO: La clave de cifrado es obligatoria - el CAF contiene claves privadas RSA
    if (!encryptionKey || encryptionKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      console.error('CAF_ENCRYPTION_KEY inválida o no configurada');
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

    const body: UploadCAFRequest = await req.json();

    if (!body.supplierId || !body.cafXml) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: supplierId, cafXml' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño máximo del CAF (500KB debería ser suficiente para cualquier CAF legítimo)
    if (body.cafXml.length > 512 * 1024) {
      return new Response(
        JSON.stringify({ error: 'El archivo CAF excede el tamaño máximo permitido (500KB)' }),
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

    // Parsear el CAF XML
    const cafData = parseCAF(body.cafXml);
    if (!cafData) {
      return new Response(
        JSON.stringify({ error: 'El archivo CAF no tiene un formato válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo de DTE
    const tiposValidos = [33, 34, 39, 41, 52, 56, 61];
    if (!tiposValidos.includes(cafData.tipoDte)) {
      return new Response(
        JSON.stringify({ error: `Tipo de DTE ${cafData.tipoDte} no soportado` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar rango de folios según normativa SII
    if (cafData.folioDesde < 1 || cafData.folioHasta > 999999999) {
      return new Response(
        JSON.stringify({ error: 'Rango de folios inválido. Debe ser entre 1 y 999.999.999' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar cantidad máxima de folios razonable (100,000 por CAF)
    const totalFoliosEnCaf = cafData.folioHasta - cafData.folioDesde + 1;
    if (totalFoliosEnCaf > 100000) {
      return new Response(
        JSON.stringify({ error: `CAF con demasiados folios (${totalFoliosEnCaf}). Máximo permitido: 100.000` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar configuración de facturación
    const { data: billingConfig } = await supabase
      .from('supplier_billing_config')
      .select('rut_emisor')
      .eq('supplier_id', body.supplierId)
      .single();

    if (billingConfig?.rut_emisor) {
      const rutConfigLimpio = billingConfig.rut_emisor.replace(/[.-]/g, '').toUpperCase();
      const rutCafLimpio = cafData.rutEmisor.replace(/[.-]/g, '').toUpperCase();
      
      if (rutConfigLimpio !== rutCafLimpio) {
        return new Response(
          JSON.stringify({ 
            error: `El CAF es para RUT ${cafData.rutEmisor} pero su configuración tiene RUT ${billingConfig.rut_emisor}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar que no exista ya este rango de folios
    const { data: existingCaf } = await supabase
      .from('supplier_cafs')
      .select('id')
      .eq('supplier_id', body.supplierId)
      .eq('tipo_dte', cafData.tipoDte)
      .eq('folio_desde', cafData.folioDesde)
      .single();

    if (existingCaf) {
      return new Response(
        JSON.stringify({ 
          error: `Ya existe un CAF para tipo ${cafData.tipoDte} con folios desde ${cafData.folioDesde}` 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular fecha de vencimiento
    const fechaAuth = new Date(cafData.fechaAutorizacion);
    const ahora = new Date();
    
    // Validar que la fecha de autorización no sea futura
    if (fechaAuth > ahora) {
      return new Response(
        JSON.stringify({ error: 'La fecha de autorización del CAF no puede ser futura' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const esBoleta = cafData.tipoDte === 39 || cafData.tipoDte === 41;
    const fechaVencimiento = new Date(fechaAuth);
    if (esBoleta) {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6);
    } else {
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 2);
    }

    // Validar que el CAF no esté vencido
    if (fechaVencimiento < ahora) {
      return new Response(
        JSON.stringify({ 
          error: `El CAF está vencido desde ${fechaVencimiento.toISOString().split('T')[0]}. Los ${esBoleta ? 'CAFs de boletas vencen en 6 meses' : 'CAFs de facturas vencen en 2 años'}.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // Cifrar con AES-256-GCM (obligatorio - CAF contiene claves RSA)
    // ============================================================
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      hexToUint8Array(encryptionKey),
      'AES-GCM',
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const cafBytes = encoder.encode(body.cafXml);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      cafBytes
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const authTag = encryptedArray.slice(-16);
    const ciphertext = encryptedArray.slice(0, -16);

    const cafXmlEncrypted = uint8ArrayToBase64(ciphertext);
    const cafIv = uint8ArrayToBase64(iv);
    const cafAuthTag = uint8ArrayToBase64(authTag);

    // Guardar CAF
    const { data: cafRecord, error: insertError } = await supabase
      .from('supplier_cafs')
      .insert({
        supplier_id: body.supplierId,
        tipo_dte: cafData.tipoDte,
        folio_desde: cafData.folioDesde,
        folio_hasta: cafData.folioHasta,
        folio_actual: cafData.folioDesde,
        caf_xml_encrypted: cafXmlEncrypted,
        caf_iv: cafIv,
        caf_auth_tag: cafAuthTag,
        fecha_autorizacion: cafData.fechaAutorizacion,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
        is_active: true,
        agotado: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando CAF:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el CAF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalFolios = cafData.folioHasta - cafData.folioDesde + 1;
    const nombreTipo = getNombreTipoDte(cafData.tipoDte);

    return new Response(
      JSON.stringify({
        success: true,
        cafId: cafRecord.id,
        tipoDte: cafData.tipoDte,
        nombreTipo,
        rutEmisor: cafData.rutEmisor,
        folioDesde: cafData.folioDesde,
        folioHasta: cafData.folioHasta,
        totalFolios,
        fechaAutorizacion: cafData.fechaAutorizacion,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        mensaje: `CAF cargado: ${totalFolios} folios de ${nombreTipo} (${cafData.folioDesde} - ${cafData.folioHasta})`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en upload-caf:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCAF(cafXml: string): CAFData | null {
  try {
    // Función que busca contenido de tag incluyendo posibles namespaces
    const getTagContent = (xml: string, tag: string): string | null => {
      // Soporta <TAG>, <ns:TAG>, <ns1:TAG>, etc.
      const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}>([^<]+)</(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : null;
    };

    // Validar estructura básica del CAF (con o sin namespace)
    if (!/<(?:[a-zA-Z0-9_-]+:)?CAF/i.test(cafXml) || !/<\/(?:[a-zA-Z0-9_-]+:)?CAF>/i.test(cafXml)) {
      return null;
    }

    const tipoDte = parseInt(getTagContent(cafXml, 'TD') || '', 10);
    if (isNaN(tipoDte)) return null;

    const rutEmisor = getTagContent(cafXml, 'RUT');
    if (!rutEmisor) return null;

    const razonSocial = getTagContent(cafXml, 'RS') || '';

    // Soportar RNG con namespace
    const rngMatch = cafXml.match(/<(?:[a-zA-Z0-9_-]+:)?RNG>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?RNG>/i);
    if (!rngMatch) return null;

    const rngXml = rngMatch[1];
    const folioDesde = parseInt(getTagContent(rngXml, 'D') || '', 10);
    const folioHasta = parseInt(getTagContent(rngXml, 'H') || '', 10);

    if (isNaN(folioDesde) || isNaN(folioHasta)) return null;
    if (folioDesde > folioHasta) return null;
    if (folioDesde < 1) return null;

    const fechaAutorizacion = getTagContent(cafXml, 'FA');
    if (!fechaAutorizacion) return null;
    
    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAutorizacion)) return null;

    return {
      tipoDte,
      rutEmisor,
      razonSocial,
      folioDesde,
      folioHasta,
      fechaAutorizacion,
    };
  } catch {
    return null;
  }
}

function getNombreTipoDte(tipoDte: number): string {
  const nombres: Record<number, string> = {
    33: 'Factura Electrónica',
    34: 'Factura No Afecta o Exenta',
    39: 'Boleta Electrónica',
    41: 'Boleta Exenta Electrónica',
    52: 'Guía de Despacho Electrónica',
    56: 'Nota de Débito Electrónica',
    61: 'Nota de Crédito Electrónica',
  };
  return nombres[tipoDte] || `Tipo ${tipoDte}`;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
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
