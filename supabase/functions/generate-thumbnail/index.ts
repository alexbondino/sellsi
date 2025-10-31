// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.


// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withMetrics } from "../_shared/metrics.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Modo de logging
const DEBUG_MODE = (Deno.env.get('DEBUG_MODE') || 'false') === 'true'
// TRACE desactivado por defecto para evitar uso de cuota; activar con env THUMBS_TRACE='true' si necesitas trazas
const TRACE_MODE = (Deno.env.get('THUMBS_TRACE') || 'false') === 'true'
// Wrapper seguro
function dbg(event: string, data: unknown = {}) {
  if (TRACE_MODE) {
    try { console.log('[THUMBS_TRACE]', event, JSON.stringify(safeJson(data))); } catch(_) {}
  }
}
const log = DEBUG_MODE || TRACE_MODE ? console.log : () => {}
const logError = DEBUG_MODE || TRACE_MODE ? console.error : () => {}
// Logging de eventos sintéticos (mantener API previa)
function thumbsLog(event: string, data: Record<string, unknown> = {}) { dbg(event, data) }

function safeJson(value: unknown): unknown {
  if (!value) return value;
  if (Array.isArray(value)) return value.map(v=>safeJson(v));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k,v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'object' && v !== null) {
        if (v instanceof Uint8Array) out[k] = { type: 'Uint8Array', length: v.length }
        else out[k] = safeJson(v)
      } else out[k] = v
    }
    return out
  }
  return value
}

// Feature flags (edge)
const ENABLE_SIGNATURE_COLUMN = (Deno.env.get('ENABLE_SIGNATURE_COLUMN') || 'true') === 'true';
const ENABLE_SIGNATURE_ENFORCE = (Deno.env.get('ENABLE_SIGNATURE_ENFORCE') || 'false') === 'true';
// (Eliminado ENABLE_THUMBS_LOGS: logging detallado desactivado permanentemente)
const SIGNATURE_ENFORCE_COOLDOWN_MS = Number(Deno.env.get('SIGNATURE_ENFORCE_COOLDOWN_MS') || '5000');

function extractBasename(url: string): string {
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1];
  } catch (_) {
    return url;
  }
}

// Función para detectar el tipo de imagen basado en los magic bytes
function detectImageType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'png';
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }

  // GIF: 47 49 46 38 37 61 (GIF87a) or 47 49 46 38 39 61 (GIF89a)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return 'gif';
  }
  
  return 'unknown';
}

// Cache import de ImageScript para evitar múltiples fetch concurrentes
let _imageModulePromise: Promise<any> | null = null;
async function getImageModule() {
  if (!_imageModulePromise) {
    _imageModulePromise = (async () => {
      try {
        return await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
      } catch (e) {
        thumbsLog('IMPORT_FAIL', { message: (e as any)?.message?.slice(0,200) || 'unknown' });
        throw e;
      }
    })();
  }
  return _imageModulePromise;
}

// Genera una sola variante (decode individual) evitando upscale severo y aplanando alpha.
async function createThumbnailFromOriginal(imageBuffer: ArrayBuffer, width: number, height: number, variantKey: string, trace: any): Promise<Uint8Array> {
  const t0 = Date.now();
  const imageType = detectImageType(imageBuffer);
  if (imageType === 'webp') throw new Error('WEBP_NOT_ALLOWED');
  const { Image } = await getImageModule();
  let originalImage: any;
  try {
    originalImage = await Image.decode(new Uint8Array(imageBuffer));
    trace.steps.push({ step: 'decode_ok', variant: variantKey, ms: Date.now()-t0, origW: originalImage.width, origH: originalImage.height })
  } catch (e) {
    console.error('[THUMBS] DECODE_FAIL', (e as any)?.message || 'decode_error');
    trace.steps.push({ step: 'decode_fail', variant: variantKey, ms: Date.now()-t0, error: (e as any)?.message })
    throw e;
  }
  const origW = originalImage.width;
  const origH = originalImage.height;
  let workImage = originalImage;
  if (origW > width || origH > height) {
    const scale = Math.min(width / origW, height / origH);
    const newW = Math.max(1, Math.round(origW * scale));
    const newH = Math.max(1, Math.round(origH * scale));
    workImage = originalImage.resize(newW, newH);
    trace.steps.push({ step: 'resize', variant: variantKey, targetW: newW, targetH: newH })
  }
  if (workImage.hasAlpha) {
    const flattened = new Image(workImage.width, workImage.height);
    flattened.fill(0xffffffff);
    try { flattened.draw(workImage, 0, 0); } catch(_) {}
    workImage = flattened;
    trace.steps.push({ step: 'alpha_flatten', variant: variantKey })
  }
  if (workImage.width !== width || workImage.height !== height) {
    try {
      const canvas = new Image(width, height);
      canvas.fill(0xffffffff);
      const offX = Math.floor((width - workImage.width)/2);
      const offY = Math.floor((height - workImage.height)/2);
      try { canvas.draw(workImage, offX, offY); workImage = canvas; } catch(_) {}
      trace.steps.push({ step: 'canvas_center', variant: variantKey, finalW: width, finalH: height })
    } catch(_) { /* si falla canvas dejamos workImage tal cual */ }
  }
  try { // encodeJPEG preferido
    // @ts-ignore
    if (typeof workImage.encodeJPEG === 'function') {
      const encoded = await workImage.encodeJPEG(90);
      trace.steps.push({ step: 'encode_jpeg', variant: variantKey, bytes: encoded.length });
      return encoded;
    }
  } catch(_) {}
  const encoded = await workImage.encode(90);
  trace.steps.push({ step: 'encode_generic', variant: variantKey, bytes: encoded.length });
  return encoded;
}

serve((req) => withMetrics('generate-thumbnail', req, async () => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
  thumbsLog('REQ_START', { method: req.method, url: req.url });
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  const requestBody = await req.json();
  const trace: any = { startedAt: Date.now(), steps: [], productId: requestBody?.productId, supplierId: requestBody?.supplierId };
  const { imageUrl, productId, supplierId, force } = requestBody;
  dbg('REQUEST_BODY', safeJson({ productId, supplierId, force, hasImageUrl: !!imageUrl }));
  thumbsLog('REQ_BODY', { productId, supplierId, hasImageUrl: !!imageUrl, force: !!force });

  if (!imageUrl || !productId || !supplierId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: imageUrl, productId, supplierId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate environment variables (Edge Step 2: soporte SERVICE_ROLE según nuevoplan.md)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

  thumbsLog('ENV_VARS', { hasUrl: !!supabaseUrl, hasAnon: !!anonKey, hasService: !!serviceRoleKey, debug: DEBUG_MODE });
  if (!supabaseUrl || (!anonKey && !serviceRoleKey)) {
      logError("❌ Missing required env vars: SUPABASE_URL and at least one of SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cliente público (para acciones que puedan mantenerse con clave anon)
    const supabasePublic = anonKey ? createClient(supabaseUrl, anonKey) : null;
    // Cliente service role (privilegiado) sólo si la variable existe
    const supabaseSr = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) : null;
    // Selección de cliente para operaciones de BD (lectura + escritura) — si existe service role lo usamos para preparar futura RLS
    const dbClient = supabaseSr || supabasePublic!;

    // ✅ Validar existencia de imagen principal e idempotencia ANTES de hacer fetch pesado
  const { data: mainImage, error: mainImageError } = await dbClient
      .from('product_images')
      .select('id, thumbnails, thumbnail_url, image_url, thumbnail_signature, updated_at')
      .eq('product_id', productId)
      .eq('image_order', 0)
      .single();
  trace.steps.push({ step: 'fetch_main_row', success: !mainImageError, hasRow: !!mainImage, thumbnailsKeys: mainImage ? Object.keys(mainImage.thumbnails||{}) : [] });

    if (mainImageError || !mainImage) {
      return new Response(JSON.stringify({ error: 'Imagen principal no encontrada para este producto' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Firma candidata (basename del URL provisto)
    const candidateSignature = ENABLE_SIGNATURE_COLUMN ? extractBasename(imageUrl) : null;
    const previousSignature = ENABLE_SIGNATURE_COLUMN ? (mainImage.thumbnail_signature || null) : null;
    const signatureMismatch = ENABLE_SIGNATURE_COLUMN && previousSignature && candidateSignature && previousSignature !== candidateSignature;

    // Idempotencia con posible enforcement: si todo existe y NO hay enforcement o cooldown activo, retornamos.
    const allVariantsExist = !!(mainImage.thumbnails &&
      mainImage.thumbnails.desktop &&
      mainImage.thumbnails.tablet &&
      mainImage.thumbnails.mobile &&
      mainImage.thumbnails.minithumb &&
      mainImage.thumbnail_url);

    let cooldownActive = false;
    if (ENABLE_SIGNATURE_ENFORCE && signatureMismatch) {
      // Evaluar cooldown usando updated_at de la fila principal (cuando se actualizó por última vez cualquier campo)
      try {
        if (mainImage.updated_at) {
          const updatedAtMs = Date.parse(mainImage.updated_at);
            if (!Number.isNaN(updatedAtMs)) {
              const delta = Date.now() - updatedAtMs;
              cooldownActive = delta < SIGNATURE_ENFORCE_COOLDOWN_MS;
            }
        }
      } catch (_) {}
    }

    if (!force && allVariantsExist && (!signatureMismatch || !ENABLE_SIGNATURE_ENFORCE || cooldownActive)) {
      trace.steps.push({ step: 'idempotent_exit', allVariantsExist, signatureMismatch, cooldownActive });
      return new Response(JSON.stringify({
        success: true,
        status: 'ok',
        message: 'Todas las variantes de thumbnails ya existen (idempotente)'+(signatureMismatch && ENABLE_SIGNATURE_ENFORCE && cooldownActive ? ' (cooldown)' : ''),
        thumbnails: mainImage.thumbnails,
        thumbnailUrl: mainImage.thumbnail_url,
        previousSignature,
        candidateSignature,
        staleDetected: !!signatureMismatch,
        enforcement: ENABLE_SIGNATURE_ENFORCE,
    cooldownActive,
    forced: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (signatureMismatch && ENABLE_SIGNATURE_ENFORCE) {
      thumbsLog('SIGNATURE_ENFORCE_REGENERATE', { productId, previousSignature, candidateSignature })
    } else if (signatureMismatch) {
      thumbsLog('SIGNATURE_OBSERVE_MISMATCH', { productId, previousSignature, candidateSignature })
    }

    // Job tracking con RPC start_thumbnail_job (atomic attempts+processing)
    let jobTrackingEnabled = true;
    try {
      const { error: startErr } = await dbClient.rpc('start_thumbnail_job', { p_product_id: productId, p_product_image_id: mainImage.id });
      if (startErr) {
        jobTrackingEnabled = false;
        logError('⚠️ start_thumbnail_job failed (sin tracking):', startErr.message);
      }
    } catch (e) {
      jobTrackingEnabled = false;
      logError('⚠️ Error RPC start_thumbnail_job:', e);
    }

    // Fetch image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
  const imageResponse = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Supabase-Edge-Function/1.0'
        }
      });
      clearTimeout(timeoutId);

      if (!imageResponse.ok) {
        logError("❌ Failed to fetch image:", imageResponse.status, imageResponse.statusText);
        return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }


  const imageBuffer = await imageResponse.arrayBuffer();
  thumbsLog('FETCH_OK', { productId, bytes: imageBuffer.byteLength });

      if (imageBuffer.byteLength === 0) {
        logError("❌ Empty image buffer");
        return new Response(JSON.stringify({ error: 'Empty image data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Detectar tipo de imagen y respetar política: ignorar WebP
  const imageType = detectImageType(imageBuffer);
  thumbsLog('IMAGE_TYPE', { productId, imageType });
      if (imageType === 'gif') {
        // Reject GIFs explicitly (animated GIFs not supported by ImageScript pipeline)
        if (jobTrackingEnabled) {
          try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'unsupported_image_type_gif' }); } catch(_) {}
        }
        return new Response(JSON.stringify({ success: false, error: 'unsupported_image_type', reason: 'gif_not_supported' }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (imageType === 'webp') {
        return new Response(JSON.stringify({ success: true, ignored: true, reason: 'webp_main_ignored' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate thumbnails (parallel decode per variant)
      const variantDefs = [
        { key: 'minithumb', w: 40, h: 40 },
        { key: 'mobile', w: 190, h: 153 },
        { key: 'tablet', w: 300, h: 230 },
        { key: 'desktop', w: 320, h: 260 },
      ] as const;
      const generationResults = await Promise.allSettled(
        variantDefs.map(v => {
          trace.steps.push({ step: 'variant_generate_start', variant: v.key, target: `${v.w}x${v.h}` })
          return createThumbnailFromOriginal(imageBuffer, v.w, v.h, v.key, trace).then(data => ({ variant: v.key, data }))
        })
      );
      trace.steps.push({ step: 'variants_generation_complete' });
      const genMap: Record<string, Uint8Array | null> = { minithumb: null, mobile: null, tablet: null, desktop: null };
      const generationErrors: Array<{ variant: string; error: string }> = [];
      generationResults.forEach(r => {
        if (r.status === 'fulfilled') genMap[r.value.variant] = r.value.data;
        else generationErrors.push({ variant: (r as any)?.value?.variant || 'unknown', error: (r as any)?.reason?.message || 'generation_failed' });
      });
      // Logging reducido: usar dbg() para TRACE_MODE
      try {
        const sizeOf = (arr: Uint8Array|null) => arr ? arr.length : 0;
        dbg('VARIANT_BYTES', { productId, variants: variantDefs.map(v=>({ key: v.key, size: sizeOf(genMap[v.key]) })) });
      } catch(_) {}
      if (generationErrors.length) console.error('[THUMBS] GEN_VARIANTS_RESULT', { productId, errors: generationErrors });
      const minithumb = genMap.minithumb;
      const mobileThumb = genMap.mobile;
      const tabletThumb = genMap.tablet;
      const desktopThumb = genMap.desktop;
      if (!desktopThumb && !mobileThumb && !tabletThumb && !minithumb) {
        console.error('[THUMBS] ALL_VARIANTS_FAILED', { productId, generationErrors });
        return new Response(JSON.stringify({ success: false, error: 'NO_VARIANTS_GENERATED', variantErrors: generationErrors }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    // Extract timestamp from original image URL if possible, otherwise use current timestamp
    let timestamp = Date.now();
    try {
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const timestampMatch = filename.match(/^(\d+)_/);
      if (timestampMatch) {
        timestamp = parseInt(timestampMatch[1]);
        thumbsLog('TIMESTAMP_EXTRACTED', { productId, timestampSource: 'filename', timestamp })
      } else {
        thumbsLog('TIMESTAMP_FALLBACK', { productId, filename, timestamp })
      }
    } catch (error) {
      thumbsLog('TIMESTAMP_ERROR', { productId, message: error.message })
    }

    // Upload thumbnails to storage
    const variantPaths = {
      minithumb: `${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`,
      mobile: `${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`,
      tablet: `${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`,
      desktop: `${supplierId}/${productId}/${timestamp}_desktop_320x260.jpg`
    } as const;

    // Asegurar bucket existe (solo con service role). Si no, crearlo público.
    try {
      const bucketName = 'product-images-thumbnails';
      if (supabaseSr) {
        const { data: buckets } = await supabaseSr.storage.listBuckets();
        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
          try { await supabaseSr.storage.createBucket(bucketName, { public: true, allowedMimeTypes: ['image/jpeg','image/png'], fileSizeLimit: '2097152' }); } catch(_) {}
        } else {
          // Intentar ampliar allowedMimeTypes si estaba restringido solo a jpeg
          try { await supabaseSr.storage.updateBucket(bucketName, { public: true, allowedMimeTypes: ['image/jpeg','image/png'], fileSizeLimit: '2097152' }); } catch(_) {}
        }
      }
    } catch (be) {
      logError('⚠️ Bucket existence check/creation failed:', be);
    }

    const uploadVariants = [
      { key: 'minithumb', data: minithumb, path: variantPaths.minithumb },
      { key: 'mobile', data: mobileThumb, path: variantPaths.mobile },
      { key: 'tablet', data: tabletThumb, path: variantPaths.tablet },
      { key: 'desktop', data: desktopThumb, path: variantPaths.desktop },
    ];
    const uploadPromises = uploadVariants.map(async v => {
      if (!v.data) {
        trace.steps.push({ step: 'upload_skip', variant: v.key, reason: 'no_data' })
        return { variant: v.key, path: v.path, error: new Error('no_data') };
      }
      const upStart = Date.now();
      try {
        trace.steps.push({ step: 'upload_attempt', variant: v.key, path: v.path, bytes: v.data.length });
        const res = await (supabaseSr || supabasePublic!).storage
          .from('product-images-thumbnails')
          .upload(v.path, v.data, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true
          });
        trace.steps.push({ step: 'upload_result', variant: v.key, ms: Date.now()-upStart, error: res.error ? (res.error.message||'err') : null });
        return { variant: v.key, path: v.path, error: res.error };
      } catch (e) {
        trace.steps.push({ step: 'upload_throw', variant: v.key, ms: Date.now()-upStart, error: (e as any)?.message });
        return { variant: v.key, path: v.path, error: e };
      }
    });

  const uploadResults = await Promise.all(uploadPromises);
  try { dbg('UPLOAD_RESULTS', { productId, results: uploadResults.map(r=>({ variant: r.variant, ok: !r.error })) }); } catch(_) {}
    // Verificación HEAD de existencia real (puede detectar casos donde getPublicUrl construye URL aunque el objeto no exista)
    async function headOk(url: string): Promise<boolean> {
      const controller = new AbortController();
      const to = setTimeout(()=>controller.abort(), 5000);
      try {
        const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(to);
        return resp.status >= 200 && resp.status < 400;
      } catch(_) { clearTimeout(to); return false; }
    }
  const variantStatuses = uploadResults.map(r => ({
      variant: r.variant,
      ok: !r.error || /exists/i.test(r.error.message || ''),
      error: r.error ? (r.error.message || 'unknown_error') : null
    }));
  trace.steps.push({ step: 'upload_statuses', statuses: variantStatuses });
    const hardErrors = variantStatuses.filter(v => !v.ok && v.error && !/exists/i.test(v.error));
    const successfulVariants = new Set(variantStatuses.filter(v => v.ok).map(v => v.variant));
    const partial = successfulVariants.size < uploadResults.length;
    if (partial) {
      thumbsLog('GENERATION_PARTIAL', { productId, successful: Array.from(successfulVariants), errors: variantStatuses.filter(v=>!v.ok) });
    } else {
      thumbsLog('GENERATION_COMPLETE', { productId });
    }
    if (hardErrors.length > 0) {
      logError('❌ Errores duros subiendo variantes:', hardErrors.map(e=>({variant:e.variant,msg:e.error})));
      if (jobTrackingEnabled) {
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'upload_partial_fail' }); } catch(_) {}
      }
      // Continuar: intentaremos igualmente construir URLs para variantes exitosas
    }

    // Generate public URLs
  // Construir URLs sólo para variantes exitosas (evita referencias 404 en DB)
  const buildUrl = (variant: keyof typeof variantPaths) => (supabaseSr || supabasePublic!).storage
    .from('product-images-thumbnails')
    .getPublicUrl(variantPaths[variant]).data.publicUrl;

  const minithumbUrl = successfulVariants.has('minithumb') ? buildUrl('minithumb') : null;
  const mobileUrl = successfulVariants.has('mobile') ? buildUrl('mobile') : null;
  const tabletUrl = successfulVariants.has('tablet') ? buildUrl('tablet') : null;
  const desktopUrl = successfulVariants.has('desktop') ? buildUrl('desktop') : null;

    // HEAD verification pass (solo para variantes marcadas como exitosas)
    const urlsToVerify: Array<{key: string; url: string}> = [];
    if (minithumbUrl) urlsToVerify.push({ key: 'minithumb', url: minithumbUrl });
    if (mobileUrl) urlsToVerify.push({ key: 'mobile', url: mobileUrl });
    if (tabletUrl) urlsToVerify.push({ key: 'tablet', url: tabletUrl });
    if (desktopUrl) urlsToVerify.push({ key: 'desktop', url: desktopUrl });
  const existenceChecks = await Promise.all(urlsToVerify.map(async v => ({ key: v.key, ok: await headOk(v.url) })));
  try { dbg('HEAD_CHECK', { productId, checks: existenceChecks.map(c=>({ key: c.key, ok: c.ok })) }); } catch(_) {}
  trace.steps.push({ step: 'head_check', checks: existenceChecks });
    const missingAfterHead = existenceChecks.filter(e => !e.ok).map(e => e.key);
    if (missingAfterHead.length) {
      console.warn('[THUMBS] HEAD_MISSING_VARIANTS', { productId, missingAfterHead });
      // Reintento secuencial de re-upload para las variantes faltantes
      for (const miss of missingAfterHead) {
        const variantObj = uploadVariants.find(v => v.key === miss);
        if (variantObj && variantObj.data) {
          try {
            const reRes = await (supabaseSr || supabasePublic!).storage
              .from('product-images-thumbnails')
              .upload(variantObj.path, variantObj.data, {
                contentType: 'image/jpeg',
                cacheControl: '31536000',
                upsert: true
              });
            dbg('REUPLOAD_ATTEMPT', { productId, variant: miss, ok: !reRes.error });
            trace.steps.push({ step: 'reupload_attempt', variant: miss, error: reRes.error ? (reRes.error.message||'err') : null });
          } catch(reUpErr) {
            console.error('[THUMBS] REUPLOAD_EXCEPTION', { productId, variant: miss, error: (reUpErr as any)?.message });
            trace.steps.push({ step: 'reupload_exception', variant: miss, error: (reUpErr as any)?.message });
          }
        }
      }
      // Segunda verificación
  const secondChecks = await Promise.all(urlsToVerify.map(async v => ({ key: v.key, ok: await headOk(v.url) })));
  try { dbg('HEAD_RECHECK', { productId, checks: secondChecks.map(c=>({ key: c.key, ok: c.ok })) }); } catch(_) {}
      trace.steps.push({ step: 'head_recheck', checks: secondChecks });
      const stillMissing = secondChecks.filter(e => !e.ok).map(e => e.key);
      if (stillMissing.length) {
        console.error('[THUMBS] VARIANTS_STILL_MISSING', { productId, stillMissing });
        trace.steps.push({ step: 'variants_still_missing', variants: stillMissing });
        // Remover de successfulVariants para que no se persistan claves vacías que no existen realmente
        stillMissing.forEach(k => successfulVariants.delete(k));
      }
    }

    // Listar contenidos reales del path (si tenemos service role) para observar qué existe inmediatamente
    if (supabaseSr) {
      try {
        const folderPath = `${supplierId}/${productId}`;
        const { data: listed, error: listErr } = await supabaseSr.storage.from('product-images-thumbnails').list(folderPath, { limit: 50 });
        if (!listErr) {
          trace.steps.push({ step: 'storage_list', files: (listed||[]).map(f=>({ name: f.name, size: f.metadata?.size||null })) });
          dbg('STORAGE_LIST', { productId, files: listed?.map(f=>f.name) });
        } else {
          trace.steps.push({ step: 'storage_list_error', error: listErr.message });
        }
      } catch (lx) {
        trace.steps.push({ step: 'storage_list_exception', error: (lx as any)?.message });
      }
    }

    // Update principal (image_order=0). En observación: sólo seteamos signature si no existía o coincide.
    const thumbnailsPayload: Record<string,string> = {};
  if (minithumbUrl && successfulVariants.has('minithumb')) thumbnailsPayload.minithumb = minithumbUrl;
  if (mobileUrl && successfulVariants.has('mobile')) thumbnailsPayload.mobile = mobileUrl;
  if (tabletUrl && successfulVariants.has('tablet')) thumbnailsPayload.tablet = tabletUrl;
  if (desktopUrl && successfulVariants.has('desktop')) thumbnailsPayload.desktop = desktopUrl;
    const primaryThumbnail = desktopUrl || tabletUrl || mobileUrl || minithumbUrl || null;
    const updatePayload: Record<string, unknown> = {
      thumbnails: thumbnailsPayload,
      thumbnail_url: primaryThumbnail
    };
    if (ENABLE_SIGNATURE_COLUMN) {
      if (!previousSignature || previousSignature === candidateSignature) {
        updatePayload.thumbnail_signature = candidateSignature; // observación / coincidencia
      } else if (ENABLE_SIGNATURE_ENFORCE && signatureMismatch) {
        // Enforcement: sobreescribir con la nueva firma
        updatePayload.thumbnail_signature = candidateSignature;
      }
    }

  let { error: dbUpdateError } = await dbClient
      .from('product_images')
      .update(updatePayload)
      .eq('product_id', productId)
      .eq('image_order', 0);
    trace.steps.push({ step: 'db_update', error: dbUpdateError ? dbUpdateError.message : null, payloadKeys: Object.keys(thumbnailsPayload) });

    if (dbUpdateError) {
      logError("❌ Error updating thumbnails in DB:", dbUpdateError);
      // Optionally, you can return an error here or just log it and continue
      if (jobTrackingEnabled) {
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: dbUpdateError.message }); } catch(_) {}
      }
    }

    // Post-verificación: reconsultar fila y validar que las claves se guardaron
    let storedThumbnails: any = null;
    let storedPrimary: string | null = null;
    if (!dbUpdateError) {
      try {
        const { data: verifyRow, error: verifyErr } = await dbClient
          .from('product_images')
          .select('thumbnails, thumbnail_url, image_url, updated_at')
          .eq('product_id', productId)
          .eq('image_order', 0)
          .single();
        if (!verifyErr && verifyRow) {
          storedThumbnails = verifyRow.thumbnails;
          storedPrimary = verifyRow.thumbnail_url;
          const storedKeys = storedThumbnails ? Object.keys(storedThumbnails) : [];
          const expectedKeys = Object.keys(thumbnailsPayload);
          const missing = expectedKeys.filter(k => !storedKeys.includes(k));
          dbg('DB_VERIFY', { productId, storedKeys, expectedKeys, missing });
          trace.steps.push({ step: 'db_verify', storedKeys, expectedKeys, missing });
          // Intento correctivo si faltan claves generadas
          if (missing.length > 0) {
            const merged = { ...(storedThumbnails||{}), ...thumbnailsPayload };
            try {
              const { error: retryErr } = await dbClient
                .from('product_images')
                .update({ thumbnails: merged, thumbnail_url: primaryThumbnail })
                .eq('product_id', productId)
                .eq('image_order', 0);
              dbg('DB_RETRY', { productId, retryError: retryErr ? retryErr.message : null });
              trace.steps.push({ step: 'db_retry', error: retryErr ? retryErr.message : null });
              if (!retryErr) storedThumbnails = merged;
            } catch(retryEx) {
              console.error('[THUMBS] DB_RETRY_EXCEPTION', { productId, err: (retryEx as any)?.message });
              trace.steps.push({ step: 'db_retry_exception', error: (retryEx as any)?.message });
            }
          }
        } else {
          console.warn('[THUMBS] DB_VERIFY_FAIL', { productId, error: verifyErr?.message });
          trace.steps.push({ step: 'db_verify_fail', error: verifyErr?.message });
        }
      } catch (verEx) {
        console.error('[THUMBS] DB_VERIFY_EXCEPTION', { productId, err: (verEx as any)?.message });
        trace.steps.push({ step: 'db_verify_exception', error: (verEx as any)?.message });
      }
    }

    if (!dbUpdateError && jobTrackingEnabled) {
      try { await dbClient.rpc('mark_thumbnail_job_success', { p_product_id: productId }); } catch(_) {}
    }

    const response = {
      success: true,
  status: dbUpdateError ? 'stored_without_db_update' : 'stored_and_updated',
      thumbnailUrl: desktopUrl, // Compatibilidad
  thumbnails: thumbnailsPayload,
      sizes: {
        minithumb: { width: 40, height: 40 },
        mobile: { width: 190, height: 153 },
        tablet: { width: 300, height: 230 },
        desktop: { width: 320, height: 260 }
      },
  partial,
  generatedVariants: Array.from(successfulVariants),
  failedVariants: variantStatuses.filter(v=>!v.ok).map(v=>({ variant: v.variant, error: v.error })),
      originalSize: imageBuffer.byteLength,
      generatedAt: new Date().toISOString(),
  clientMode: serviceRoleKey ? 'service_role' : 'anon',
  previousSignature,
  candidateSignature,
  signatureApplied: !!updatePayload.thumbnail_signature,
  staleDetected: !!(previousSignature && candidateSignature && previousSignature !== candidateSignature),
  enforcement: ENABLE_SIGNATURE_ENFORCE,
  cooldownActive: false,
  forced: !!force,
  storedThumbnailsKeys: storedThumbnails ? Object.keys(storedThumbnails) : null,
  storedPrimaryThumbnail: storedPrimary || null,
      trace: { durationMs: Date.now()-trace.startedAt, steps: trace.steps }
    };

  thumbsLog('GEN_SUCCESS_RESPONSE', { productId, partial: response.partial, variants: response.generatedVariants, failed: response.failedVariants });
  return new Response(JSON.stringify(response), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logError("❌ Image fetch timeout");
        return new Response(JSON.stringify({ error: 'Image fetch timeout' }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw fetchError;
    }

  } catch (error) {
  thumbsLog('GEN_FATAL', { productId: undefined, error: (error as any)?.message, stack: (error as any)?.stack?.slice(0,500), name: (error as any)?.name });
    // Siempre loguear error fatal aunque DEBUG_MODE esté off
    console.error("❌ Edge Function error:", error);
    try {
      // Fallback: marcar job error si tracking activo
      // (No re-lanzamos si falla este update)
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (supabaseUrl && (serviceRoleKey || anonKey)) {
        const tmpClient = createClient(supabaseUrl, serviceRoleKey || anonKey!);
        let body: any = {};
        try { body = await req.clone().json(); } catch(_){ }
        if (body?.productId) {
          try { await tmpClient.rpc('mark_thumbnail_job_error', { p_product_id: body.productId, p_error: (error as any)?.message?.slice(0,500) || 'edge_error' }); } catch(_) {}
        }
      }
    } catch (_) {}
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack,
      type: error.constructor.name
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-thumbnail' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"imageUrl":"https://example.com/image.jpg","productId":"test-product","supplierId":"test-supplier"}'

*/
