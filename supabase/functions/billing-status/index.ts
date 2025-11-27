/**
 * Edge Function: Estado de Facturación (VERSIÓN CORREGIDA)
 * GET /billing-status?supplierId=xxx
 * 
 * CAMBIOS vs versión anterior:
 * 1. Consulta tabla 'users' en vez de 'suppliers'
 * 2. Agregado recordInvocation para métricas
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { recordInvocation } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para tipado de respuesta RPC get_folio_stats
interface FolioStatRow {
  tipo_dte: number;
  nombre_tipo: string;
  total_autorizados: number;
  usados: number;
  disponibles: number;
  porcentaje_usado: number;
  alerta_baja: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    if (req.method !== 'GET') {
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

    const url = new URL(req.url);
    const supplierId = url.searchParams.get('supplierId');

    if (!supplierId) {
      return new Response(
        JSON.stringify({ error: 'supplierId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplierId)) {
      return new Response(
        JSON.stringify({ error: 'supplierId debe ser un UUID válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // CORRECCIÓN: Verificar en tabla 'users', no 'suppliers'
    // ============================================================
    const { data: supplierUser, error: supplierError } = await supabase
      .from('users')
      .select('user_id, user_nm, rut, email')
      .eq('user_id', supplierId)
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

    // 1. Obtener configuración de facturación
    const { data: billingConfig } = await supabase
      .from('supplier_billing_config')
      .select('*')
      .eq('supplier_id', supplierId)
      .single();

    // 2. Obtener estado del certificado
    const { data: certificate } = await supabase
      .from('supplier_certificates')
      .select('id, rut_titular, nombre_titular, valid_from, valid_to, is_active, created_at')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .single();

    let certificateStatus: {
      configured: boolean;
      isActive: boolean;
      rutTitular?: string;
      nombreTitular?: string;
      validTo?: string;
      diasRestantes?: number;
      estado?: 'vigente' | 'por_vencer' | 'vencido';
    } = { configured: false, isActive: false };

    if (certificate) {
      const validTo = new Date(certificate.valid_to);
      const now = new Date();
      const diasRestantes = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let estado: 'vigente' | 'por_vencer' | 'vencido' = 'vigente';
      if (diasRestantes < 0) estado = 'vencido';
      else if (diasRestantes <= 30) estado = 'por_vencer';

      certificateStatus = {
        configured: true,
        isActive: certificate.is_active && diasRestantes >= 0,
        rutTitular: certificate.rut_titular,
        nombreTitular: certificate.nombre_titular,
        validTo: certificate.valid_to,
        diasRestantes: Math.max(0, diasRestantes),
        estado,
      };
    }

    // 3. Obtener estadísticas de folios
    const { data: folioStats, error: folioError } = await supabase.rpc('get_folio_stats', {
      p_supplier_id: supplierId,
    });

    if (folioError) {
      console.warn('Error obteniendo stats de folios:', folioError.message);
    }

    // 4. Obtener DTEs recientes (últimos 10)
    const { data: recentDtes } = await supabase
      .from('supplier_dtes')
      .select('id, tipo_dte, folio, fecha_emision, rut_receptor, razon_social_receptor, monto_total, estado, supplier_order_id')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 5. Obtener resumen de DTEs del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { data: monthlyStats } = await supabase
      .from('supplier_dtes')
      .select('tipo_dte, monto_total')
      .eq('supplier_id', supplierId)
      .gte('fecha_emision', inicioMes.toISOString().split('T')[0]);

    // Calcular resumen mensual
    const resumenMensual = {
      totalDocumentos: monthlyStats?.length || 0,
      montoTotal: monthlyStats?.reduce((sum, d) => sum + (d.monto_total || 0), 0) || 0,
      porTipo: {} as Record<number, { cantidad: number; monto: number }>,
    };

    monthlyStats?.forEach((dte) => {
      if (!resumenMensual.porTipo[dte.tipo_dte]) {
        resumenMensual.porTipo[dte.tipo_dte] = { cantidad: 0, monto: 0 };
      }
      resumenMensual.porTipo[dte.tipo_dte].cantidad++;
      resumenMensual.porTipo[dte.tipo_dte].monto += dte.monto_total || 0;
    });

    // 6. Determinar si está listo para emitir
    const readyToEmit = !!(
      billingConfig &&
      certificateStatus.isActive &&
      folioStats &&
      folioStats.length > 0
    );

    const missingRequirements: string[] = [];
    if (!billingConfig) {
      missingRequirements.push('Configuración tributaria (RUT, giro, dirección)');
    }
    if (!certificateStatus.configured) {
      missingRequirements.push('Certificado digital (.pfx)');
    } else if (!certificateStatus.isActive) {
      missingRequirements.push('Certificado digital vigente');
    }
    if (!folioStats || folioStats.length === 0) {
      missingRequirements.push('Folios CAF del SII');
    }

    // Construir respuesta
    const responseBody = JSON.stringify({
      supplierId,
      supplierName: supplierUser.user_nm,
      supplierRut: supplierUser.rut,
      readyToEmit,
      missingRequirements,
      billingConfig: billingConfig ? {
        rutEmisor: billingConfig.rut_emisor,
        razonSocial: billingConfig.razon_social,
        giro: billingConfig.giro,
        direccion: billingConfig.direccion,
        comuna: billingConfig.comuna,
        ciudad: billingConfig.ciudad,
        ambiente: billingConfig.ambiente,
      } : null,
      certificate: certificateStatus,
      folios: (folioStats as FolioStatRow[] | null)?.map((f) => ({
        tipoDte: f.tipo_dte,
        nombreTipo: f.nombre_tipo,
        totalAutorizados: f.total_autorizados,
        usados: f.usados,
        disponibles: f.disponibles,
        porcentajeUsado: f.porcentaje_usado,
        alertaBaja: f.alerta_baja,
      })) || [],
      resumenMensual,
      dtesRecientes: recentDtes?.map((d) => ({
        id: d.id,
        tipoDte: d.tipo_dte,
        nombreTipo: getNombreTipoDte(d.tipo_dte),
        folio: d.folio,
        fechaEmision: d.fecha_emision,
        receptor: {
          rut: d.rut_receptor,
          razonSocial: d.razon_social_receptor,
        },
        montoTotal: d.monto_total,
        estado: d.estado,
        supplierOrderId: d.supplier_order_id,
      })) || [],
    });

    // Registrar éxito en métricas
    recordInvocation({
      functionName: 'billing-status',
      status: 'success',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      meta: { readyToEmit, missingCount: missingRequirements.length },
    });

    return new Response(
      responseBody,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Registrar error en métricas
    recordInvocation({
      functionName: 'billing-status',
      status: 'error',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      errorMessage: error instanceof Error ? error.message : 'Error interno',
    });
    console.error('Error en billing-status:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
