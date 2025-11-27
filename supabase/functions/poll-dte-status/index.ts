/**
 * Edge Function: Poll DTE Status (Polling automático de estados SII)
 * 
 * PROPÓSITO:
 * Consulta periódicamente el estado de DTEs enviados al SII y actualiza la BD.
 * Diseñado para ser llamado por pg_cron cada 5 minutos.
 * 
 * FLUJO:
 * 1. Busca DTEs con estado 'ENVIADO' y track_id válido
 * 2. Para cada DTE, consulta QueryEstUp al SII
 * 3. Actualiza estado en BD (ACEPTADO, RECHAZADO, etc.)
 * 4. Registra log de la operación
 * 
 * LLAMADA:
 * - Automática: pg_cron cada 5 minutos (usa service_role key en header)
 * - Manual: POST /poll-dte-status con Bearer token (requiere ser el supplier)
 * 
 * SEGURIDAD:
 * - Llamadas desde pg_cron: Authorization header con service_role key
 * - Llamadas manuales: Valida que el usuario sea el supplier del DTE
 * 
 * ============================================================
 * TODO: UI - Agregar botón "Actualizar Estado SII" en la vista
 * de DTEs del proveedor que llame a esta función bajo demanda.
 * Ubicación sugerida: 
 *   - sellsi/src/workspaces/supplier/components/DteList.tsx
 *   - Junto a cada DTE con estado "ENVIADO"
 *   - O como botón global "Refrescar todos los estados"
 * ============================================================
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { recordInvocation } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Estados finales del SII (no requieren más polling)
const ESTADOS_FINALES = ['ACEPTADO', 'RECHAZADO', 'ACEPTADO_CON_REPAROS', 'ANULADO'];

// Mapeo de estados SII a estados internos
const ESTADO_SII_MAP: Record<string, string> = {
  // Estados de aceptación
  'DOK': 'ACEPTADO',
  'SOK': 'ACEPTADO', // Schema OK
  'FOK': 'ACEPTADO', // Firma OK
  'EPR': 'ENVIADO',  // Envío procesado, seguir esperando
  'EAM': 'ACEPTADO_CON_REPAROS', // Aceptado con advertencias menores
  'EMR': 'ACEPTADO_CON_REPAROS', // Aceptado sin afectar validez
  
  // Estados de rechazo
  'RCH': 'RECHAZADO', // Rechazado
  'RCT': 'RECHAZADO', // Rechazado por error contenido
  'RFR': 'RECHAZADO', // Rechazado por error formato
  'DNK': 'RECHAZADO', // Documento no conocido
  'FAU': 'RECHAZADO', // Firma con error
  'FNA': 'RECHAZADO', // Firma no autorizada
  'FAN': 'RECHAZADO', // Folio ya anulado
  'EMP': 'RECHAZADO', // Empresa no autorizada
  'TMD': 'RECHAZADO', // Tipo DTE no autorizado
  'RNG': 'RECHAZADO', // Folio fuera de rango
  'FLR': 'RECHAZADO', // Folio repetido
  'SNK': 'RECHAZADO', // Schema con errores
  'FNK': 'RECHAZADO', // Firma inválida
  
  // Estado de anulación
  '-11': 'ANULADO',
};

interface DtePendiente {
  id: string;
  supplier_id: string;
  tipo_dte: number;
  folio: number;
  track_id: string;      // Filtrado NOT NULL en query
  estado: string;
  created_at: string;
}

interface PollResult {
  dteId: string;
  folio: number;
  tipoDte: number;
  estadoAnterior: string;
  estadoNuevo: string;
  estadoSii: string;
  glosa?: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();
  const results: PollResult[] = [];
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  let isServiceRole = false;
  let authenticatedUserId: string | null = null;

  try {
    // Aceptar GET (para cron) o POST (para llamada manual)
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================================
    // SEGURIDAD: Validar autorización
    // ============================================================
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      // Sin auth header = no autorizado
      return new Response(
        JSON.stringify({ error: 'No autorizado - se requiere Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar si es service_role key (usado por pg_cron)
    if (token === supabaseServiceKey) {
      isServiceRole = true;
      console.log('Llamada con service_role key (pg_cron o admin)');
    } else {
      // Validar token de usuario
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Token inválido o expirado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      authenticatedUserId = user.id;
      console.log(`Llamada manual por usuario: ${authenticatedUserId}`);
    }

    // Parámetros opcionales para filtrar
    let supplierId: string | null = null;
    let dteId: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        supplierId = body.supplierId || null;
        dteId = body.dteId || null;
      } catch {
        // Body vacío es válido para polling general
      }
    } else {
      const url = new URL(req.url);
      supplierId = url.searchParams.get('supplierId');
      dteId = url.searchParams.get('dteId');
    }

    // Si es llamada manual (no service_role), DEBE especificar supplierId o dteId
    // y DEBE ser el dueño de esos DTEs
    if (!isServiceRole) {
      if (!supplierId && !dteId) {
        return new Response(
          JSON.stringify({ error: 'Llamada manual requiere supplierId o dteId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Si especifica supplierId, debe ser el mismo usuario
      if (supplierId && supplierId !== authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'No tiene permiso para consultar DTEs de otro proveedor' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Forzar supplierId al usuario autenticado para seguridad
      supplierId = authenticatedUserId;
    }

    // 1. Buscar DTEs pendientes de confirmación
    // NOTA: Filtrar track_id NOT NULL y no vacío
    let query = supabase
      .from('supplier_dtes')
      .select(`
        id,
        supplier_id,
        tipo_dte,
        folio,
        track_id,
        estado,
        created_at
      `)
      .eq('estado', 'ENVIADO')
      .not('track_id', 'is', null)
      .neq('track_id', '');  // También excluir strings vacíos

    // Filtros opcionales
    if (dteId) {
      query = query.eq('id', dteId);
    } else if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    // Limitar a DTEs creados hace más de 2 minutos (dar tiempo al SII)
    // y menos de 7 días (no seguir consultando DTEs muy antiguos)
    const hace2Minutos = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    query = query
      .lt('created_at', hace2Minutos)
      .gt('created_at', hace7Dias)
      .order('created_at', { ascending: true })
      .limit(50); // Procesar máximo 50 por ejecución

    const { data: dtesPendientes, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Error consultando DTEs: ${queryError.message}`);
    }

    if (!dtesPendientes || dtesPendientes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay DTEs pendientes de actualización',
          processed: 0,
          updated: 0,
          errors: 0,
          duration: Math.round(performance.now() - startTime),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Procesando ${dtesPendientes.length} DTEs pendientes`);

    // 2. Pre-cargar billing configs para evitar N+1 queries
    const uniqueSupplierIds = [...new Set(dtesPendientes.map(d => d.supplier_id))];
    const { data: billingConfigs, error: configsError } = await supabase
      .from('supplier_billing_config')
      .select('supplier_id, rut_emisor')
      .in('supplier_id', uniqueSupplierIds);
    
    if (configsError) {
      console.error('Error cargando billing configs:', configsError.message);
    }
    
    // Crear mapa para lookup O(1)
    const billingConfigMap = new Map<string, string>();
    billingConfigs?.forEach(bc => {
      billingConfigMap.set(bc.supplier_id, bc.rut_emisor);
    });

    // 3. Para cada DTE, consultar estado al SII
    for (const dte of dtesPendientes) {
      processedCount++;
      
      const result: PollResult = {
        dteId: dte.id,
        folio: dte.folio,
        tipoDte: dte.tipo_dte,
        estadoAnterior: dte.estado,
        estadoNuevo: dte.estado,
        estadoSii: '',
        success: false,
      };

      try {
        // Obtener RUT emisor desde el mapa pre-cargado
        const rutEmisor = billingConfigMap.get(dte.supplier_id);
        
        if (!rutEmisor) {
          result.error = 'Configuración de facturación no encontrada para el supplier';
          results.push(result);
          errorCount++;
          continue;
        }

        // Consultar estado al SII
        // NOTA: En producción real, esto llamaría a QueryEstUp del SII
        // Por ahora simulamos la respuesta para ambiente CERT/desarrollo
        const estadoSii = await consultarEstadoSii(
          dte.track_id,
          rutEmisor,
          supabase
        );

        result.estadoSii = estadoSii.estado;
        result.glosa = estadoSii.glosa;

        // 3. Mapear estado SII a estado interno
        const estadoInterno = ESTADO_SII_MAP[estadoSii.estado] || dte.estado;

        // 4. Actualizar si cambió el estado
        if (estadoInterno !== dte.estado) {
          // Construir objeto de actualización con campos de M1 (siempre existen)
          const updateData: Record<string, unknown> = {
            estado: estadoInterno,
            glosa_estado: estadoSii.glosa?.substring(0, 2000), // Limitar a 2000 chars (M1)
          };
          
          // Si el estado es final (ACEPTADO/RECHAZADO), guardar fecha
          if (ESTADOS_FINALES.includes(estadoInterno)) {
            updateData.fecha_aceptacion = new Date().toISOString();
          }
          
          const { error: updateError } = await supabase
            .from('supplier_dtes')
            .update(updateData)
            .eq('id', dte.id);
          
          // Si la M3 está desplegada, intentar actualizar campos adicionales
          // Esto es un update separado para no fallar si los campos no existen
          if (!updateError) {
            // Fire-and-forget: intentar actualizar campos de M3
            supabase
              .from('supplier_dtes')
              .update({
                estado_sii: estadoSii.estado,
                glosa_sii: estadoSii.glosa,
              })
              .eq('id', dte.id)
              .then(() => {})
              .catch(() => {
                // Ignorar error si columnas no existen (M3 no desplegada)
              });
          }

          if (updateError) {
            result.error = `Error actualizando: ${updateError.message}`;
            errorCount++;
          } else {
            result.estadoNuevo = estadoInterno;
            result.success = true;
            updatedCount++;
            
            console.log(`DTE ${dte.folio} actualizado: ${dte.estado} → ${estadoInterno}`);

            // Si fue rechazado, podríamos enviar notificación al proveedor
            // TODO: Implementar notificación push/email
            if (estadoInterno === 'RECHAZADO') {
              console.warn(`⚠️ DTE ${dte.folio} RECHAZADO por SII: ${estadoSii.glosa}`);
              // await notifySupplierRejection(dte.supplier_id, dte, estadoSii.glosa);
            }
          }
        } else {
          result.success = true;
          result.estadoNuevo = estadoInterno;
        }

      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Error desconocido';
        errorCount++;
      }

      results.push(result);
    }

    // 5. Registrar log de la ejecución
    const durationMs = Math.round(performance.now() - startTime);
    
    await supabase.from('polling_logs').insert({
      function_name: 'poll-dte-status',
      processed: processedCount,
      updated: updatedCount,
      errors: errorCount,
      duration_ms: durationMs,
      details: results,
    }).catch(() => {
      // Ignorar si la tabla no existe
      console.log('Nota: tabla polling_logs no existe (opcional)');
    });
    
    // Registrar en métricas de Edge Functions
    recordInvocation({
      functionName: 'poll-dte-status',
      status: errorCount > 0 && updatedCount === 0 ? 'error' : 'success',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      meta: { processed: processedCount, updated: updatedCount, errors: errorCount },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Procesados ${processedCount} DTEs`,
        processed: processedCount,
        updated: updatedCount,
        errors: errorCount,
        duration: durationMs,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en poll-dte-status:', error);
    
    // Registrar error en métricas
    recordInvocation({
      functionName: 'poll-dte-status',
      status: 'error',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      errorMessage: error instanceof Error ? error.message : 'Error interno',
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
        processed: processedCount,
        updated: updatedCount,
        errors: errorCount,
        duration: Math.round(performance.now() - startTime),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Consulta el estado de un DTE al SII
 * 
 * NOTA: Esta es una implementación simplificada.
 * En producción real, deberías:
 * 1. Obtener token de autenticación (GetSeed → GetToken)
 * 2. Llamar a QueryEstUp con el trackId
 * 3. Parsear la respuesta XML
 * 
 * Por ahora retorna un estado simulado para desarrollo.
 */
async function consultarEstadoSii(
  trackId: string,
  _rutEmisor: string,
  _supabase: ReturnType<typeof createClient>
): Promise<{ estado: string; glosa: string }> {
  
  // ============================================================
  // TODO: Implementar llamada real al SII
  // 
  // const siiResponse = await fetch(
  //   `https://maullin.sii.cl/cgi_dte/UPL/QueryEstUp.cgi?TRACKID=${trackId}&RUTCOMPANY=${rutNumero}&DVCOMPANY=${dv}`,
  //   {
  //     headers: {
  //       'Cookie': `TOKEN=${token}`,
  //     },
  //   }
  // );
  // const xml = await siiResponse.text();
  // return parseEstadoSii(xml);
  // ============================================================

  // SIMULACIÓN para desarrollo/certificación:
  // En ambiente CERT, después de unos minutos el SII debería responder DOK
  
  console.log(`Consultando estado SII para trackId: ${trackId}`);
  
  // Por ahora, simular que después de 5 minutos se acepta
  // En producción real, esto sería la respuesta del SII
  return {
    estado: 'EPR', // Envío procesado, seguir esperando
    glosa: 'Envío procesado correctamente',
  };
}

/**
 * TODO: Implementar notificación al proveedor cuando un DTE es rechazado
 */
// async function notifySupplierRejection(
//   supplierId: string,
//   dte: DtePendiente,
//   glosa: string
// ): Promise<void> {
//   // Opciones:
//   // 1. Insertar en tabla de notificaciones
//   // 2. Enviar email via Resend/SendGrid
//   // 3. Enviar push notification
//   console.log(`Notificar a ${supplierId}: DTE ${dte.folio} rechazado - ${glosa}`);
// }
