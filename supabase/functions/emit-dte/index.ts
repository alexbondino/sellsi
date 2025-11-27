/**
 * Edge Function: Emisión de DTE (VERSIÓN CORREGIDA)
 * POST /emit-dte
 * 
 * Emite un Documento Tributario Electrónico para un proveedor
 * 
 * CAMBIOS vs versión anterior:
 * 1. Consulta tabla 'users' en vez de 'suppliers' inexistente
 * 2. Puede emitir para una supplier_order existente o de forma manual
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmitDTERequest {
  // El supplierId es el user_id del proveedor en tabla users
  supplierId: string;
  tipoDte: number;
  
  // Opción 1: Emitir para una orden existente
  supplierOrderId?: string;
  
  // Opción 2: Emisión manual (sin orden)
  receptor?: {
    rut: string;
    razonSocial: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    correo?: string;
  };
  items?: Array<{
    nombre: string;
    descripcion?: string;
    cantidad: number;
    unidad?: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    exento?: boolean;
    codigoProducto?: string;
  }>;
  descuentoGlobal?: {
    tipo: 'porcentaje' | 'monto';
    valor: number;
  };
  referencias?: Array<{
    tipoDteRef: number;
    folioRef: number;
    fechaRef: string;
    razonRef: string;
    codigoRef?: number;
  }>;
  medioPago?: string;
  observaciones?: string;
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EmitDTERequest = await req.json();

    // Validar campos requeridos
    if (!body.supplierId || !body.tipoDte) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: supplierId, tipoDte' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // CORRECCIÓN: Verificar supplier en tabla 'users', no 'suppliers'
    // ============================================================
    const { data: supplierUser, error: supplierError } = await supabase
      .from('users')
      .select('user_id, user_nm, rut, email')
      .eq('user_id', body.supplierId)
      .single();

    if (supplierError || !supplierUser) {
      return new Response(
        JSON.stringify({ error: 'Proveedor no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario autenticado ES el supplier
    if (supplierUser.user_id?.toLowerCase() !== user.id?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'No tiene acceso a este proveedor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo de DTE
    const tiposValidos = [33, 34, 39, 41, 52, 56, 61];
    if (!tiposValidos.includes(body.tipoDte)) {
      return new Response(
        JSON.stringify({ error: `Tipo de DTE inválido. Válidos: ${tiposValidos.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // OPCIÓN 1: Emitir para una supplier_order existente
    // ============================================================
    if (body.supplierOrderId) {
      // Validar que la orden pertenece al supplier
      const { data: orderCheck, error: orderCheckError } = await supabase
        .from('supplier_orders')
        .select('supplier_id')
        .eq('id', body.supplierOrderId)
        .single();

      if (orderCheckError || !orderCheck) {
        return new Response(
          JSON.stringify({ error: 'Orden no encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (orderCheck.supplier_id !== body.supplierId) {
        return new Response(
          JSON.stringify({ error: 'La orden no pertenece a este proveedor' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: result, error: emitError } = await supabase.rpc('emit_dte_for_supplier_order', {
        p_supplier_order_id: body.supplierOrderId,
        p_tipo_dte: body.tipoDte,
      });

      if (emitError) {
        console.error('Error en emit_dte_for_supplier_order:', emitError);
        return new Response(
          JSON.stringify({ error: emitError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          mensaje: 'DTE emitido para orden de proveedor',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // OPCIÓN 2: Emisión manual (sin orden)
    // ============================================================
    if (!body.receptor || !body.items?.length) {
      return new Response(
        JSON.stringify({ error: 'Para emisión manual se requiere: receptor e items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar RUT receptor (formato y dígito verificador)
    const rutNormalizado = normalizeRut(body.receptor.rut);
    if (!rutNormalizado || !isValidRut(rutNormalizado)) {
      return new Response(
        JSON.stringify({ error: 'RUT del receptor inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar máximo 60 items (requisito SII)
    if (body.items.length > 60) {
      return new Response(
        JSON.stringify({ error: 'Máximo 60 líneas de detalle permitidas por el SII' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar referencias obligatorias para Notas de Crédito/Débito
    if ((body.tipoDte === 56 || body.tipoDte === 61) && (!body.referencias || body.referencias.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Notas de Crédito/Débito requieren referencia al documento original' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar longitudes máximas SII
    if (body.receptor.razonSocial.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Razón social del receptor excede 100 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar items
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.nombre || item.cantidad <= 0 || item.precioUnitario < 0) {
        return new Response(
          JSON.stringify({ error: `Item ${i + 1}: nombre, cantidad > 0 y precioUnitario >= 0 requeridos` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (item.nombre.length > 80) {
        return new Response(
          JSON.stringify({ error: `Item ${i + 1}: nombre excede 80 caracteres` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar configuración de facturación
    const { data: billingConfig, error: configError } = await supabase
      .from('supplier_billing_config')
      .select('*')
      .eq('supplier_id', body.supplierId)
      .single();

    if (configError || !billingConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuración de facturación no encontrada. Configure RUT emisor, giro y dirección.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar certificado activo
    const { data: certificate, error: certError } = await supabase
      .from('supplier_certificates')
      .select('id, valid_to')
      .eq('supplier_id', body.supplierId)
      .eq('is_active', true)
      .single();

    if (certError || !certificate) {
      return new Response(
        JSON.stringify({ 
          error: 'No hay certificado digital activo. Suba su certificado .pfx.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(certificate.valid_to) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'El certificado digital está vencido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener siguiente folio
    const { data: folioData, error: folioError } = await supabase.rpc('get_next_folio', {
      p_supplier_id: body.supplierId,
      p_tipo_dte: body.tipoDte,
    });

    if (folioError || !folioData || folioData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: `No hay folios disponibles para tipo ${body.tipoDte}. Solicite más CAF al SII.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const folio = folioData[0].folio_actual;

    // Calcular totales
    const esExento = body.tipoDte === 34 || body.tipoDte === 41;
    let montoNeto = 0;
    let montoExento = 0;

    for (const item of body.items) {
      let montoItem = item.cantidad * item.precioUnitario;
      if (item.descuentoPorcentaje) {
        montoItem -= montoItem * (item.descuentoPorcentaje / 100);
      }
      montoItem = Math.round(montoItem);

      if (esExento || item.exento) {
        montoExento += montoItem;
      } else {
        montoNeto += montoItem;
      }
    }

    // Aplicar descuento global
    if (body.descuentoGlobal) {
      const total = montoNeto + montoExento;
      if (body.descuentoGlobal.tipo === 'porcentaje') {
        const descuento = total * (body.descuentoGlobal.valor / 100);
        const proporcion = montoNeto / (total || 1);
        montoNeto = Math.max(0, montoNeto - Math.round(descuento * proporcion));
        montoExento = Math.max(0, montoExento - Math.round(descuento * (1 - proporcion)));
      } else {
        const proporcion = montoNeto / (total || 1);
        montoNeto = Math.max(0, montoNeto - Math.round(body.descuentoGlobal.valor * proporcion));
        montoExento = Math.max(0, montoExento - Math.round(body.descuentoGlobal.valor * (1 - proporcion)));
      }
    }

    const iva = esExento ? 0 : Math.round(montoNeto * 0.19);
    const montoTotal = montoNeto + montoExento + iva;

    // Determinar ind_servicio para boletas (obligatorio para tipos 39, 41)
    const esBoleta = body.tipoDte === 39 || body.tipoDte === 41;
    const indServicio = esBoleta ? 3 : null; // 3 = Bienes o servicios no periódicos

    // Preparar datos de referencia para NC/ND
    let referenciaData: {
      dte_referencia_tipo?: number;
      dte_referencia_folio?: number;
      dte_referencia_fecha?: string;
      codigo_referencia?: number;
      razon_referencia?: string;
    } = {};

    if ((body.tipoDte === 56 || body.tipoDte === 61) && body.referencias && body.referencias.length > 0) {
      const ref = body.referencias[0]; // Usamos la primera referencia
      referenciaData = {
        dte_referencia_tipo: ref.tipoDteRef,
        dte_referencia_folio: ref.folioRef,
        dte_referencia_fecha: ref.fechaRef,
        codigo_referencia: ref.codigoRef || 1, // 1 = Anula documento (default)
        razon_referencia: ref.razonRef?.substring(0, 90) || null,
      };
    }

    // Guardar DTE (incluyendo detalle de items)
    const { data: dteRecord, error: dteError } = await supabase
      .from('supplier_dtes')
      .insert({
        supplier_id: body.supplierId,
        tipo_dte: body.tipoDte,
        folio,
        fecha_emision: new Date().toISOString().split('T')[0],
        rut_receptor: rutNormalizado,
        razon_social_receptor: body.receptor.razonSocial.substring(0, 100),
        giro_receptor: body.receptor.giro?.substring(0, 40) || null,
        direccion_receptor: body.receptor.direccion?.substring(0, 70) || null,
        comuna_receptor: body.receptor.comuna?.substring(0, 20) || null,
        ciudad_receptor: body.receptor.ciudad?.substring(0, 20) || null,
        monto_neto: montoNeto || null,
        monto_exento: montoExento || null,
        iva: iva || null,
        monto_total: montoTotal,
        ind_servicio: indServicio,
        forma_pago: 1, // 1 = Contado (default para marketplace)
        estado: billingConfig.ambiente === 'CERT' ? 'SIMULADO' : 'PENDIENTE',
        detalle_items: body.items, // Guardar items para regeneración
        ...referenciaData, // Incluir datos de referencia si es NC/ND
      })
      .select()
      .single();

    if (dteError) {
      console.error('Error guardando DTE:', dteError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el documento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        dteId: dteRecord.id,
        folio,
        tipoDte: body.tipoDte,
        fechaEmision: dteRecord.fecha_emision,
        receptor: {
          rut: body.receptor.rut,
          razonSocial: body.receptor.razonSocial,
        },
        totales: {
          montoNeto: montoNeto || null,
          montoExento: montoExento || null,
          iva: iva || null,
          montoTotal,
        },
        estado: dteRecord.estado,
        mensaje: billingConfig.ambiente === 'CERT' 
          ? 'DTE generado en modo CERTIFICACIÓN (simulado)' 
          : 'DTE creado, pendiente de firma y envío al SII',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en emit-dte:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Normaliza un RUT al formato requerido por la tabla: 12345678-9
 * Acepta formatos: 12.345.678-9, 12345678-9, 123456789
 */
function normalizeRut(rut: string): string | null {
  if (!rut) return null;
  
  // Eliminar puntos, guiones y espacios
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2 || clean.length > 9) return null;
  
  // Separar cuerpo y dígito verificador
  const dv = clean.slice(-1);
  const cuerpo = clean.slice(0, -1);
  
  // Validar que el cuerpo sea numérico
  if (!/^\d+$/.test(cuerpo)) return null;
  
  // Formato final: XXXXXXXX-X (sin puntos, con guión)
  return `${cuerpo}-${dv}`;
}

/**
 * Valida un RUT chileno (debe estar normalizado)
 */
function isValidRut(rut: string): boolean {
  if (!rut) return false;
  
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  
  const dv = clean.slice(-1);
  const numero = parseInt(clean.slice(0, -1), 10);
  
  // RUT mínimo 50.000 para incluir empresas antiguas
  if (isNaN(numero) || numero < 50000) return false;
  
  let suma = 0;
  let multiplicador = 2;
  let n = numero;
  
  while (n > 0) {
    suma += (n % 10) * multiplicador;
    n = Math.floor(n / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = 11 - resto;
  
  let dvEsperado: string;
  if (dvCalculado === 11) dvEsperado = '0';
  else if (dvCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvCalculado.toString();
  
  return dv === dvEsperado;
}
