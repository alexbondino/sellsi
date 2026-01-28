import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { PDFDocument, StandardFonts } from "https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.esm.js";

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
  for (const [k, v] of Object.entries(ctx)) {
    // replace whole word keys and placeholders
    const re = new RegExp(`\\b${k}\\b`, 'g');
    out = out.replace(re, v || '');
  }
  // Basic integrity check on the template
  const required = ['CONTRATO', 'FIRMA ELECTRÓNICA', 'LEY', 'SELLSI SPA', 'RUT'];
  for (const phrase of required) if (!template.includes(phrase)) throw new Error(`Embedded template missing phrase: ${phrase}`);
  return out;
}

async function generatePdfFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const { width, height } = page.getSize();
  const margin = 50;
  const maxWidth = width - (margin * 2);

  const wrapText = (t: string) => {
    const words = t.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      const wwidth = font.widthOfTextAtSize(test, fontSize);
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
    const lines = wrapText(p);
    for (const line of lines) {
      if (y < margin) { page = pdfDoc.addPage(); y = page.getSize().height - margin; }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= fontSize + 4;
    }
    y -= 6;
  }

  return await pdfDoc.save();
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const body = await req.json();
    const financing_id = body.financing_id || body.id;
    if (!financing_id) return new Response(JSON.stringify({ error: 'financing_id is required' }), { status: 400 });

    // Fetch financing snapshot (use only financing_requests fields)
    const { data: fr, error } = await supabase
      .from('financing_requests')
      .select('*')
      .eq('id', financing_id)
      .single();

    if (error || !fr) return new Response(JSON.stringify({ error: 'Financing request not found' }), { status: 404 });

    const dateParts = getSpanishDateParts();
    const ctx: Record<string,string> = {
      DIA: dateParts.day,
      MES: dateParts.month,
      ANIO: dateParts.year,
      // supplier snapshot
      NOMBRE_PROVEEDOR: fr.supplier_legal_name || 'PROVEEDOR NO REGISTRADO',
      RUT_PROVEEDOR: fr.supplier_legal_rut || '',
      REP_PROVEEDOR: fr.supplier_legal_representative_name || '',
      DIR_PROVEEDOR: fr.supplier_legal_address || '',
      COMUNA_PROVEEDOR: fr.supplier_legal_commune || '',
      REGION_PROVEEDOR: fr.supplier_legal_region || '',
      // buyer snapshot
      NOMBRE_COMPRADOR: fr.buyer_legal_name || 'COMPRADOR NO REGISTRADO',
      RUT_COMPRADOR: fr.buyer_legal_rut || '',
      REP_COMPRADOR: fr.buyer_legal_representative_name || '',
      DIR_COMPRADOR: fr.buyer_legal_address || '',
      COMUNA_COMPRADOR: fr.buyer_legal_commune || '',
      REGION_COMPRADOR: fr.buyer_legal_region || '',
      // financial
      MONTO: new Intl.NumberFormat('es-CL').format(fr.amount || 0),
      PLAZO: String(fr.term_days || fr.term || ''),
    };

    // Use embedded template constant (no disk reads in Edge runtime)
    const template = CONTRACT_TEMPLATE;
    const fullText = renderContractFromTemplate(template, ctx);

    const pdfBytes = await generatePdfFromText(fullText);

    const fileName = `contrato_template.pdf`;
    const filePath = `${fr.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw uploadError;

    // Insert record in financing_documents using schema-compatible fields
    const insertPayload: Record<string, any> = {
      financing_id: fr.id,
      financing_request_id: fr.id, // keep old FK for compatibility
      document_type: 'contrato',
      document_name: fileName,
      storage_path: filePath,
      file_size: pdfBytes.length,
      mime_type: 'application/pdf',
      uploaded_by_admin_id: null
    };

    const { error: insertError } = await supabase.from('financing_documents').insert(insertPayload);
    if (insertError) {
      // Cleanup uploaded file to avoid orphaned files and surface error
      try {
        await supabase.storage.from(storageBucket).remove([filePath]);
      } catch (cleanupErr) {
        console.error('Failed to cleanup uploaded file after DB insert error', cleanupErr);
      }
      console.warn('Insert financing_documents failed', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, path: filePath }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
