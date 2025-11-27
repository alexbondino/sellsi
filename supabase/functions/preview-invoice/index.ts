/**
 * Edge Function: Preview Invoice (Factura Simulada para Previsualización)
 * 
 * POST /preview-invoice
 * 
 * PROPÓSITO:
 * Genera un PDF de factura electrónica con datos simulados para
 * previsualizar cómo se verá el documento antes de configurar
 * la facturación real.
 * 
 * CARACTERÍSTICAS:
 * - No requiere certificado digital
 * - No requiere folios CAF
 * - Usa datos ficticios o los proporcionados por el usuario
 * - Marca de agua "SIMULACIÓN - NO VÁLIDO"
 * - Layout conforme al formato SII Chile
 * 
 * LLAMADA:
 * POST /preview-invoice
 * Body (opcional): { 
 *   tipoDte?: 33 | 34 | 39,
 *   emisor?: { razonSocial, rut, giro, direccion, comuna },
 *   receptor?: { razonSocial, rut, giro, direccion },
 *   items?: [{ nombre, cantidad, precioUnitario }]
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { recordInvocation } from '../_shared/metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Datos simulados por defecto
const DATOS_SIMULADOS = {
  emisor: {
    rut: '76.123.456-7',
    razonSocial: 'EMPRESA DEMO LTDA.',
    giro: 'Venta al por menor de productos varios',
    direccion: 'Av. Providencia 1234, Of. 567',
    comuna: 'Providencia',
    ciudad: 'Santiago',
    telefono: '+56 2 2345 6789',
    email: 'facturacion@empresademo.cl',
  },
  receptor: {
    rut: '12.345.678-9',
    razonSocial: 'CLIENTE EJEMPLO S.A.',
    giro: 'Comercio al por mayor',
    direccion: 'Calle Los Leones 987',
    comuna: 'Las Condes',
    ciudad: 'Santiago',
  },
  items: [
    { codigo: 'PROD-001', nombre: 'Producto de Ejemplo 1', cantidad: 2, unidad: 'UN', precioUnitario: 15000 },
    { codigo: 'PROD-002', nombre: 'Servicio de Instalación', cantidad: 1, unidad: 'UN', precioUnitario: 25000 },
    { codigo: 'PROD-003', nombre: 'Accesorio Premium XL', cantidad: 3, unidad: 'UN', precioUnitario: 8500 },
  ],
};

const TIPOS_DTE: Record<number, string> = {
  33: 'FACTURA ELECTRÓNICA',
  34: 'FACTURA NO AFECTA O EXENTA ELECTRÓNICA',
  39: 'BOLETA ELECTRÓNICA',
  41: 'BOLETA EXENTA ELECTRÓNICA',
  52: 'GUÍA DE DESPACHO ELECTRÓNICA',
  56: 'NOTA DE DÉBITO ELECTRÓNICA',
  61: 'NOTA DE CRÉDITO ELECTRÓNICA',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth opcional - si viene token, validamos
    const authHeader = req.headers.get('Authorization');
    let supplierId: string | null = null;

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        supplierId = user.id;
        
        // Intentar cargar datos reales del supplier si existen
        const { data: billingConfig } = await supabase
          .from('supplier_billing_config')
          .select('*')
          .eq('supplier_id', supplierId)
          .single();
        
        if (billingConfig) {
          DATOS_SIMULADOS.emisor = {
            rut: billingConfig.rut_emisor,
            razonSocial: billingConfig.razon_social,
            giro: billingConfig.giro,
            direccion: billingConfig.direccion,
            comuna: billingConfig.comuna,
            ciudad: billingConfig.ciudad || 'Santiago',
            telefono: '',
            email: billingConfig.email_dte || '',
          };
        }
      }
    }

    // Parsear body (opcional)
    let customData: {
      tipoDte?: number;
      emisor?: Partial<typeof DATOS_SIMULADOS.emisor>;
      receptor?: Partial<typeof DATOS_SIMULADOS.receptor>;
      items?: typeof DATOS_SIMULADOS.items;
    } = {};

    try {
      customData = await req.json();
    } catch {
      // Body vacío es válido
    }

    // Merge datos custom con simulados
    const tipoDte = customData.tipoDte || 33;
    const emisor = { ...DATOS_SIMULADOS.emisor, ...customData.emisor };
    const receptor = { ...DATOS_SIMULADOS.receptor, ...customData.receptor };
    const items = customData.items?.length ? customData.items : DATOS_SIMULADOS.items;

    // Calcular totales
    const esExento = tipoDte === 34 || tipoDte === 41;
    let montoNeto = 0;
    let montoExento = 0;

    for (const item of items) {
      const subtotal = item.cantidad * item.precioUnitario;
      if (esExento) {
        montoExento += subtotal;
      } else {
        montoNeto += subtotal;
      }
    }

    const iva = esExento ? 0 : Math.round(montoNeto * 0.19);
    const montoTotal = montoNeto + montoExento + iva;

    // Generar número de folio simulado
    const folioSimulado = Math.floor(Math.random() * 900000) + 100000;
    const fechaEmision = new Date().toLocaleDateString('es-CL');

    // Generar HTML del PDF
    const html = generateInvoiceHTML({
      tipoDte,
      folio: folioSimulado,
      fechaEmision,
      emisor,
      receptor,
      items,
      montoNeto,
      montoExento,
      iva,
      montoTotal,
      esSimulacion: true,
    });

    // Registrar métrica
    recordInvocation({
      functionName: 'preview-invoice',
      status: 'success',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      meta: { tipoDte, itemCount: items.length, montoTotal },
    });

    // Devolver HTML (el frontend puede renderizarlo o convertirlo a PDF)
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error en preview-invoice:', error);
    
    recordInvocation({
      functionName: 'preview-invoice',
      status: 'error',
      startedAt: startTime,
      requestOrigin: req.headers.get('origin'),
      errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      errorMessage: error instanceof Error ? error.message : 'Error interno',
    });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface InvoiceData {
  tipoDte: number;
  folio: number;
  fechaEmision: string;
  emisor: typeof DATOS_SIMULADOS.emisor;
  receptor: typeof DATOS_SIMULADOS.receptor;
  items: typeof DATOS_SIMULADOS.items;
  montoNeto: number;
  montoExento: number;
  iva: number;
  montoTotal: number;
  esSimulacion: boolean;
}

function generateInvoiceHTML(data: InvoiceData): string {
  const {
    tipoDte,
    folio,
    fechaEmision,
    emisor,
    receptor,
    items,
    montoNeto,
    montoExento,
    iva,
    montoTotal,
    esSimulacion,
  } = data;

  const nombreTipoDte = TIPOS_DTE[tipoDte] || `DOCUMENTO TIPO ${tipoDte}`;
  const formatCurrency = (n: number) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

  // Generar filas de items
  const itemRows = items.map((item, idx) => `
    <tr>
      <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.codigo || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
      <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${item.cantidad}</td>
      <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${item.unidad || 'UN'}</td>
      <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(item.precioUnitario)}</td>
      <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${formatCurrency(item.cantidad * item.precioUnitario)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${nombreTipoDte} - Vista Previa</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 12px;
      line-height: 1.4;
      background: #f5f5f5;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      font-weight: bold;
      color: rgba(255, 0, 0, 0.08);
      white-space: nowrap;
      pointer-events: none;
      z-index: 1;
    }
    .content { position: relative; z-index: 2; padding: 30px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .emisor-info { flex: 1; }
    .emisor-info h1 { font-size: 18px; color: #333; margin-bottom: 10px; }
    .emisor-info p { color: #666; margin: 3px 0; }
    .recuadro-rojo {
      border: 3px solid #FF0000;
      padding: 15px 25px;
      text-align: center;
      min-width: 280px;
    }
    .recuadro-rojo .rut { font-size: 16px; font-weight: bold; color: #FF0000; }
    .recuadro-rojo .tipo-dte { font-size: 14px; font-weight: bold; color: #FF0000; margin: 8px 0; }
    .recuadro-rojo .folio { font-size: 16px; font-weight: bold; color: #FF0000; }
    .recuadro-rojo .sii { font-size: 10px; color: #FF0000; margin-top: 8px; }
    .receptor-section {
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .receptor-grid {
      display: grid;
      grid-template-columns: 120px 1fr 120px 150px;
      gap: 8px;
    }
    .receptor-grid .label { font-weight: bold; color: #555; }
    .receptor-grid .value { color: #333; }
    .detalle-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .detalle-table th {
      background: none;
      color: #333;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #333;
    }
    .detalle-table th:nth-child(1) { width: 40px; }
    .detalle-table th:nth-child(4),
    .detalle-table th:nth-child(5) { text-align: center; }
    .detalle-table th:nth-child(6),
    .detalle-table th:nth-child(7) { text-align: right; }
    .footer { display: flex; justify-content: space-between; margin-top: 30px; }
    .timbre-section {
      border: 1px dashed #ccc;
      padding: 20px;
      text-align: center;
      width: 200px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #999;
    }
    .timbre-section svg { width: 150px; height: 60px; margin-bottom: 10px; }
    .totales {
      text-align: right;
      min-width: 280px;
    }
    .totales-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totales-row.total {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      border-bottom: 2px solid #333;
      margin-top: 10px;
      padding-top: 10px;
    }
    .totales-row .label { color: #666; }
    .totales-row .value { font-weight: 500; }
    .simulacion-banner {
      background: #fff3cd;
      border: 2px solid #ffc107;
      color: #856404;
      padding: 12px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .simulacion-banner svg { flex-shrink: 0; }
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2196F3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 100;
    }
    .print-button:hover { background: #1976D2; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
      .print-button { display: none; }
      .simulacion-banner { background: #fff3cd !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${esSimulacion ? '<div class="watermark">SIMULACIÓN - NO VÁLIDO TRIBUTARIAMENTE</div>' : ''}
    
    <div class="content">
      ${esSimulacion ? `
      <div class="simulacion-banner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong>DOCUMENTO DE SIMULACIÓN</strong><br>
          Este documento es solo una vista previa y NO tiene validez tributaria. 
          Para emitir documentos válidos, complete la configuración de facturación.
        </div>
      </div>
      ` : ''}

      <!-- Header -->
      <div class="header">
        <div class="emisor-info">
          <h1>${emisor.razonSocial}</h1>
          <p>${emisor.giro}</p>
          <p>${emisor.direccion}</p>
          <p>${emisor.comuna}, ${emisor.ciudad}</p>
          ${emisor.telefono ? `<p>Tel: ${emisor.telefono}</p>` : ''}
          ${emisor.email ? `<p>Email: ${emisor.email}</p>` : ''}
        </div>
        <div class="recuadro-rojo">
          <div class="rut">R.U.T.: ${emisor.rut}</div>
          <div class="tipo-dte">${nombreTipoDte}</div>
          <div class="folio">Nº ${folio.toLocaleString('es-CL')}</div>
          <div class="sii">S.I.I. - ${emisor.comuna.toUpperCase()}</div>
        </div>
      </div>

      <!-- Receptor -->
      <div class="receptor-section">
        <div class="receptor-grid">
          <span class="label">Señor(es):</span>
          <span class="value">${receptor.razonSocial}</span>
          <span class="label">Fecha Emisión:</span>
          <span class="value">${fechaEmision}</span>
          
          <span class="label">R.U.T.:</span>
          <span class="value">${receptor.rut}</span>
          <span class="label">Condición Pago:</span>
          <span class="value">Contado</span>
          
          <span class="label">Giro:</span>
          <span class="value">${receptor.giro}</span>
          <span class="label"></span>
          <span class="value"></span>
          
          <span class="label">Dirección:</span>
          <span class="value" style="grid-column: span 3;">${receptor.direccion}, ${receptor.comuna}</span>
        </div>
      </div>

      <!-- Detalle -->
      <table class="detalle-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Código</th>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>Unidad</th>
            <th>P. Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Footer: Timbre + Totales -->
      <div class="footer">
        <div class="timbre-section">
          <svg viewBox="0 0 150 60">
            <rect x="5" y="5" width="140" height="50" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="4"/>
            <text x="75" y="35" text-anchor="middle" fill="#bbb" font-size="10">TIMBRE ELECTRÓNICO</text>
          </svg>
          <small>Timbre no incluido en simulación</small>
        </div>
        
        <div class="totales">
          ${montoNeto > 0 ? `
          <div class="totales-row">
            <span class="label">Monto Neto:</span>
            <span class="value">${formatCurrency(montoNeto)}</span>
          </div>
          ` : ''}
          ${montoExento > 0 ? `
          <div class="totales-row">
            <span class="label">Monto Exento:</span>
            <span class="value">${formatCurrency(montoExento)}</span>
          </div>
          ` : ''}
          ${iva > 0 ? `
          <div class="totales-row">
            <span class="label">I.V.A. (19%):</span>
            <span class="value">${formatCurrency(iva)}</span>
          </div>
          ` : ''}
          <div class="totales-row total">
            <span class="label">TOTAL:</span>
            <span class="value">${formatCurrency(montoTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <button class="print-button" onclick="window.print()">
    🖨️ Imprimir / Guardar PDF
  </button>
</body>
</html>`;
}
