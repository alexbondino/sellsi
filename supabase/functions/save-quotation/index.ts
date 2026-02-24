import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { withMetrics } from '../_shared/metrics.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SaveQuotationBody = {
  productId?: string;
  storagePath?: string;
  pdfBase64?: string;
  metadata?: Record<string, unknown>;
};

const stripDataUrlPrefix = (maybeDataUrl: string) => {
  const idx = maybeDataUrl.indexOf('base64,');
  return idx >= 0 ? maybeDataUrl.slice(idx + 'base64,'.length) : maybeDataUrl;
};

const decodeBase64ToBytes = (base64: string) => {
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

serve((req) =>
  withMetrics('save-quotation', req, async () => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'No autenticado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const jwt = authHeader.replace('Bearer ', '').trim();

      const url = Deno.env.get('SUPABASE_URL');
      const anon = Deno.env.get('SUPABASE_ANON_KEY');
      const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
      if (!url || !anon || !serviceRole) {
        return new Response(JSON.stringify({ error: 'Config faltante' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(url, anon, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false },
      });

      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const buyerUserId = userData.user.id;

      const body = (await req.json().catch(() => ({}))) as SaveQuotationBody;
      const productId = body.productId;
      const storagePathFromClient = body.storagePath;
      const pdfBase64Raw = body.pdfBase64;
      const incomingMetadata = body.metadata;

      if (!productId || typeof productId !== 'string' || productId.length < 10) {
        return new Response(JSON.stringify({ error: 'productId requerido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

      // 0) Podar antes del insert (mantener 2 más recientes; la nueva será la #3)
      const { data: existingRows, error: existingErr } = await admin
        .from('quotation_documents')
        .select('id, storage_path, created_at')
        .eq('buyer_user_id', buyerUserId)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!existingErr && existingRows && existingRows.length > 2) {
        const extras = existingRows.slice(2);
        const extraPaths = extras.map((r) => r.storage_path).filter(Boolean);
        const extraIds = extras.map((r) => r.id).filter(Boolean);

        if (extraPaths.length > 0) {
          await admin.storage.from('quotations').remove(extraPaths);
        }
        if (extraIds.length > 0) {
          await admin.from('quotation_documents').delete().in('id', extraIds);
        }
      }

      // 1) Determinar storagePath + (opcional) subir PDF si viene como base64
      let quotationId = crypto.randomUUID();
      let storagePath = `${buyerUserId}/${productId}/${quotationId}.pdf`;

      if (storagePathFromClient && typeof storagePathFromClient === 'string') {
        // Validación estricta: debe colgar del user y del product
        const expectedPrefix = `${buyerUserId}/${productId}/`;
        if (!storagePathFromClient.startsWith(expectedPrefix) || !storagePathFromClient.endsWith('.pdf')) {
          return new Response(JSON.stringify({ error: 'storagePath inválido' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        storagePath = storagePathFromClient;
        const parts = storagePath.split('/');
        const last = parts[parts.length - 1] || '';
        const maybeId = last.replace(/\.pdf$/i, '');
        if (maybeId && isUuid(maybeId)) quotationId = maybeId;
      } else {
        if (!pdfBase64Raw || typeof pdfBase64Raw !== 'string' || pdfBase64Raw.length < 50) {
          return new Response(JSON.stringify({ error: 'storagePath o pdfBase64 requerido' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const pdfBase64 = stripDataUrlPrefix(pdfBase64Raw);
        const pdfBytes = decodeBase64ToBytes(pdfBase64);

        // Guardrail: 5MB máx (alineado con bucket)
        if (pdfBytes.byteLength > 5 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'PDF demasiado grande' }), {
            status: 413,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Guardrail: magic bytes PDF
        const magic = new TextDecoder().decode(pdfBytes.slice(0, 5));
        if (magic !== '%PDF-') {
          return new Response(JSON.stringify({ error: 'Archivo no es PDF' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Upload a bucket
        const { error: uploadErr } = await admin.storage.from('quotations').upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        });
        if (uploadErr) {
          return new Response(JSON.stringify({ error: 'No se pudo subir PDF', details: uploadErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // 2) Insert metadata (expires_at default = now + 15 days)
      const { error: insertErr } = await admin
        .from('quotation_documents')
        .insert({
          id: quotationId,
          buyer_user_id: buyerUserId,
          product_id: productId,
          storage_path: storagePath,
          metadata:
            incomingMetadata && typeof incomingMetadata === 'object' && !Array.isArray(incomingMetadata)
              ? incomingMetadata
              : {},
        });

      if (insertErr) {
        // rollback best-effort: borrar archivo recién subido
        await admin.storage.from('quotations').remove([storagePath]);
        return new Response(JSON.stringify({ error: 'No se pudo guardar metadata', details: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ ok: true, saved: true, id: quotationId, storagePath }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: e?.message || 'Error interno' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
