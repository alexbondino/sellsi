import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { PDFDocument, StandardFonts } from "https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.esm.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const storageBucket = "financing-documents";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { "x-client-info": "generate-financing-contract" } },
});

function getSpanishDateParts(date: Date = new Date()) {
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const day = String(date.getDate());
  const month = months[date.getMonth()];
  const year = String(date.getFullYear());
  return { day, month, year, full: `${day} de ${month} del ${year}` };
}

import { CONTRACT_TEMPLATE } from "./templates.ts";

function renderContractFromTemplate(template: string, ctx: Record<string,string>) {
  let out = template;
  // Sort keys by length DESC to replace longer placeholders first (avoid partial replacements)
  const sortedKeys = Object.keys(ctx).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    // Use global replacement without word boundaries (placeholders are unique)
    const re = new RegExp(k, 'g');
    out = out.replace(re, ctx[k] || '');
  }
  // Basic integrity check on the template
  const required = ['CONTRATO', 'FIRMA ELECTRÓNICA', 'LEY', 'SELLSI SPA', 'RUT:'];
  for (const phrase of required) if (!template.includes(phrase)) throw new Error(`Embedded template missing phrase: ${phrase}`);
  return out;
}

async function generatePdfFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const { width, height } = page.getSize();
  const margin = 50;
  const maxWidth = width - (margin * 2);

  const wrapText = (t: string, f: any, size: number) => {
    const words = t.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      const wwidth = f.widthOfTextAtSize(test, size);
      if (wwidth > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const paragraphs = text.split('\n');
  let y = height - margin;
  
  for (const p of paragraphs) {
    if (!p.trim()) { y -= 8; continue; }
    
    // Detectar título principal
    const isMainTitle = p.includes('CONTRATO MARCO DE LÍNEA DE CRÉDITO');
    // Detectar subtítulos (PRIMERO:, SEGUNDO:, etc.)
    const isSubtitle = /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO):/.test(p.trim());
    
    const currentFont = (isMainTitle || isSubtitle) ? fontBold : font;
    const currentSize = isMainTitle ? 12 : fontSize;
    
    const lines = wrapText(p, currentFont, currentSize);
    
    for (const line of lines) {
      if (y < margin) { 
        page = pdfDoc.addPage(); 
        y = page.getSize().height - margin; 
      }
      
      // Centrar título principal
      if (isMainTitle) {
        const textWidth = currentFont.widthOfTextAtSize(line, currentSize);
        const x = (width - textWidth) / 2;
        page.drawText(line, { x, y, size: currentSize, font: currentFont });
      } else {
        page.drawText(line, { x: margin, y, size: currentSize, font: currentFont });
      }
      
      y -= currentSize + 4;
    }
    y -= 6;
  }

  return await pdfDoc.save();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.json();
    const financing_id = body.financing_id || body.id;
    if (!financing_id) {
      return new Response(JSON.stringify({ error: 'financing_id is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch financing snapshot
    const { data: fr, error: frError } = await supabase
      .from('financing_requests')
      .select('*')
      .eq('id', financing_id)
      .single();

    if (frError || !fr) {
      console.error('[generate-financing-contract] Financing not found:', frError);
      return new Response(JSON.stringify({ error: 'Financing request not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields from financing_requests
    if (!fr.supplier_id || !fr.buyer_id) {
      return new Response(JSON.stringify({ error: 'Missing supplier_id or buyer_id in financing_requests' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch supplier data from supplier table (contains legal info)
    const { data: supplier, error: supplierError } = await supabase
      .from('supplier')
      .select('name, legal_rut, supplier_legal_name, supplier_legal_rut, supplier_legal_representative_name, supplier_legal_address, supplier_legal_commune, supplier_legal_region')
      .eq('id', fr.supplier_id)
      .single();

    if (supplierError) {
      console.warn('[generate-financing-contract] Supplier query error:', supplierError);
    }

    if (!supplier) {
      return new Response(JSON.stringify({ error: 'Supplier not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const dateParts = getSpanishDateParts();
    const ctx: Record<string,string> = {
      DIA: dateParts.day,
      MES: dateParts.month,
      ANIO: dateParts.year,
      // supplier snapshot (from supplier table)
      NOMBRE_PROVEEDOR: supplier?.supplier_legal_name || supplier?.name || 'PROVEEDOR NO REGISTRADO',
      RUT_PROVEEDOR: supplier?.supplier_legal_rut || supplier?.legal_rut || 'RUT NO DISPONIBLE',
      REP_PROVEEDOR: supplier?.supplier_legal_representative_name || 'REPRESENTANTE NO REGISTRADO',
      DIR_PROVEEDOR: supplier?.supplier_legal_address || 'DIRECCIÓN NO REGISTRADA',
      COMUNA_PROVEEDOR: supplier?.supplier_legal_commune || 'COMUNA NO REGISTRADA',
      REGION_PROVEEDOR: supplier?.supplier_legal_region || 'REGIÓN NO REGISTRADA',
      // buyer snapshot (from financing_requests)
      NOMBRE_COMPRADOR: fr.legal_name || 'COMPRADOR NO REGISTRADO',
      RUT_COMPRADOR: fr.legal_rut || 'RUT NO DISPONIBLE',
      REP_COMPRADOR: fr.buyer_legal_representative_name || 'REPRESENTANTE NO REGISTRADO',
      DIR_COMPRADOR: fr.legal_address || 'DIRECCIÓN NO REGISTRADA',
      COMUNA_COMPRADOR: fr.legal_commune || 'COMUNA NO REGISTRADA',
      REGION_COMPRADOR: fr.legal_region || 'REGIÓN NO REGISTRADA',
      // financial - formateado con $ CLP
      MONTO: '$' + new Intl.NumberFormat('es-CL').format(fr.amount || 0),
      PLAZO: String(fr.term_days || '0'),
    };

    // Use embedded template constant (no disk reads in Edge runtime)
    const template = CONTRACT_TEMPLATE;
    const fullText = renderContractFromTemplate(template, ctx);

    const pdfBytes = await generatePdfFromText(fullText);

    // Usar nombre FIJO para documento progresivo
    const fileName = `contrato_marco_${fr.id}.pdf`;
    const filePath = `${fr.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, pdfBytes, { 
      contentType: 'application/pdf', 
      upsert: true 
    });
    
    if (uploadError) {
      console.error('[generate-financing-contract] Upload error:', uploadError);
      throw uploadError;
    }

    // UPSERT record in financing_documents (actualizar si existe)
    const insertPayload: Record<string, any> = {
      financing_id: fr.id,
      financing_request_id: fr.id,
      file_path: filePath,
      uploaded_by: null,
      document_type: 'contrato_marco', // Tipo genérico para documento progresivo
      document_name: fileName,
      storage_path: filePath,
      file_size: pdfBytes.length,
      mime_type: 'application/pdf',
      uploaded_by_admin_id: null
    };

    // UPSERT en lugar de INSERT (actualizar si ya existe)
    const { error: upsertError } = await supabase
      .from('financing_documents')
      .upsert(insertPayload, {
        onConflict: 'financing_request_id,document_type'
      });
      
    if (upsertError) {
      console.warn('[generate-financing-contract] Upsert financing_documents failed:', upsertError);
      throw upsertError;
    }

    console.log('[generate-financing-contract] Success:', { financing_id: fr.id, path: filePath });
    return new Response(JSON.stringify({ success: true, path: filePath }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error('[generate-financing-contract] Unhandled error:', err);
    
    // Serializar correctamente el error
    const errorMessage = err instanceof Error 
      ? err.message 
      : (typeof err === 'object' && err !== null) 
        ? JSON.stringify(err)
        : String(err);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: err 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
