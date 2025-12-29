// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment

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

// --- LOGGING & CONFIG ---
const DEBUG_MODE = (Deno.env.get('DEBUG_MODE') || 'false') === 'true'
const TRACE_MODE = (Deno.env.get('THUMBS_TRACE') || 'false') === 'true'

// Wrapper seguro para logging
function dbg(event: string, data: unknown = {}) {
  if (TRACE_MODE) {
    try { console.log('[THUMBS_TRACE]', event, JSON.stringify(safeJson(data))); } catch(_) {}
  }
}
const logError = DEBUG_MODE || TRACE_MODE ? console.error : () => {}
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

// Feature flags
const ENABLE_SIGNATURE_COLUMN = (Deno.env.get('ENABLE_SIGNATURE_COLUMN') || 'true') === 'true';
const ENABLE_SIGNATURE_ENFORCE = (Deno.env.get('ENABLE_SIGNATURE_ENFORCE') || 'false') === 'true';
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

// --- CORE IMAGE FUNCTIONS ---

// Exportamos para poder testear unitariamente si es necesario
export function detectImageType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  // WebP: RIFF ... WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
  // GIF: GIF87a / GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return 'gif';
  
  return 'unknown';
}

// Cache import de ImageScript
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

export async function createThumbnailFromOriginal(imageBuffer: ArrayBuffer, width: number, height: number, variantKey: string, trace: any): Promise<Uint8Array> {
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

  // Resize logic
  if (origW > width || origH > height) {
    const scale = Math.min(width / origW, height / origH);
    const newW = Math.max(1, Math.round(origW * scale));
    const newH = Math.max(1, Math.round(origH * scale));
    workImage = originalImage.resize(newW, newH);
    trace.steps.push({ step: 'resize', variant: variantKey, targetW: newW, targetH: newH })
  }

  // Alpha flatten
  if (workImage.hasAlpha) {
    const flattened = new Image(workImage.width, workImage.height);
    flattened.fill(0xffffffff);
    try { flattened.draw(workImage, 0, 0); } catch(_) {}
    workImage = flattened;
    trace.steps.push({ step: 'alpha_flatten', variant: variantKey })
  }

  // Canvas centering
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

  // Encode
  try { 
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

// ==========================================
//  LÓGICA PURA (TESTABLE / INYECCIÓN DE DEPENDENCIAS)
// ==========================================

export async function processGenerateThumbnail(requestBody: any, deps: any = {}) {
  // Inyección de dependencias con valores por defecto (para producción)
  const env = deps.env || Deno.env;
  const fetchFn = deps.fetch || fetch;
  const createClientFn = deps.createClient || createClient;
  // Permite inyectar un procesador mock para tests que simulen fallos de generación
  const imageProcessor = deps.imageProcessor || createThumbnailFromOriginal;

  const trace: any = { startedAt: Date.now(), steps: [], productId: requestBody?.productId, supplierId: requestBody?.supplierId };
  const { imageUrl, productId, supplierId, force } = requestBody || {};
  
  dbg('REQUEST_BODY', safeJson({ productId, supplierId, force, hasImageUrl: !!imageUrl }));
  thumbsLog('REQ_BODY', { productId, supplierId, hasImageUrl: !!imageUrl, force: !!force });

  if (!imageUrl || !productId || !supplierId) {
    return { status: 400, body: { error: 'Missing required parameters: imageUrl, productId, supplierId' } };
  }

  // Configuración de Supabase
  const supabaseUrl = env.get ? env.get('SUPABASE_URL') : env.SUPABASE_URL;
  const anonKey = env.get ? env.get('SUPABASE_ANON_KEY') : env.SUPABASE_ANON_KEY;
  const serviceRoleKey = env.get ? (env.get('SUPABASE_SERVICE_ROLE_KEY') || env.get('SERVICE_ROLE_KEY')) : (env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY);

  thumbsLog('ENV_VARS', { hasUrl: !!supabaseUrl, hasAnon: !!anonKey, hasService: !!serviceRoleKey, debug: DEBUG_MODE });
  
  if (!supabaseUrl || (!anonKey && !serviceRoleKey)) {
    logError('❌ Missing required env vars: SUPABASE_URL and at least one of SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
    return { status: 500, body: { error: 'Server configuration error' } };
  }

  const supabasePublic = anonKey ? createClientFn(supabaseUrl, anonKey) : null;
  const supabaseSr = serviceRoleKey ? createClientFn(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) : null;
  const dbClient = supabaseSr || supabasePublic!;

  // Fetch fila principal
  const { data: mainImage, error: mainImageError } = await dbClient
    .from('product_images')
    .select('id, thumbnails, thumbnail_url, image_url, thumbnail_signature, updated_at')
    .eq('product_id', productId)
    .eq('image_order', 0)
    .single();
  
  trace.steps.push({ step: 'fetch_main_row', success: !mainImageError, hasRow: !!mainImage, thumbnailsKeys: mainImage ? Object.keys(mainImage.thumbnails||{}) : [] });

  if (mainImageError || !mainImage) {
    return { status: 404, body: { error: 'Imagen principal no encontrada para este producto' } };
  }

  // Idempotencia y Firmas
  const candidateSignature = ENABLE_SIGNATURE_COLUMN ? extractBasename(imageUrl) : null;
  const previousSignature = ENABLE_SIGNATURE_COLUMN ? (mainImage.thumbnail_signature || null) : null;
  const signatureMismatch = ENABLE_SIGNATURE_COLUMN && previousSignature && candidateSignature && previousSignature !== candidateSignature;

  const allVariantsExist = !!(mainImage.thumbnails &&
    mainImage.thumbnails.desktop &&
    mainImage.thumbnails.tablet &&
    mainImage.thumbnails.mobile &&
    mainImage.thumbnails.minithumb &&
    mainImage.thumbnail_url);

  let cooldownActive = false;
  if (ENABLE_SIGNATURE_ENFORCE && signatureMismatch) {
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
    return { 
      status: 200, 
      body: { 
        success: true, 
        status: 'ok', 
        message: 'Todas las variantes de thumbnails ya existen (idempotente)' + (signatureMismatch && ENABLE_SIGNATURE_ENFORCE && cooldownActive ? ' (cooldown)' : ''), 
        thumbnails: mainImage.thumbnails, 
        thumbnailUrl: mainImage.thumbnail_url, 
        previousSignature, 
        candidateSignature, 
        staleDetected: !!signatureMismatch, 
        enforcement: ENABLE_SIGNATURE_ENFORCE, 
        cooldownActive, 
        forced: false 
      } 
    };
  }

  // Job Tracking
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

  // Fetch Imagen Original
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    const imageResponse = await fetchFn(imageUrl, { 
      signal: controller.signal, 
      headers: { 'User-Agent': 'Supabase-Edge-Function/1.0' } 
    });
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      logError('❌ Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return { status: 400, body: { error: 'Failed to fetch image' } };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    thumbsLog('FETCH_OK', { productId, bytes: imageBuffer.byteLength });

    if (imageBuffer.byteLength === 0) {
      logError('❌ Empty image buffer');
      return { status: 400, body: { error: 'Empty image data' } };
    }

    const imageType = detectImageType(imageBuffer);
    thumbsLog('IMAGE_TYPE', { productId, imageType });
    
    if (imageType === 'gif') {
      if (jobTrackingEnabled) {
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'unsupported_image_type_gif' }); } catch(e) { logError('RPC mark_thumbnail_job_error failed:', e); }
      }
      return { status: 422, body: { success: false, error: 'unsupported_image_type', reason: 'gif_not_supported' } };
    }
    if (imageType === 'webp') {
      return { status: 200, body: { success: true, ignored: true, reason: 'webp_main_ignored' } };
    }

    // Generación de Variantes
    const variantDefs = [
      { key: 'minithumb', w: 40, h: 40 },
      { key: 'mobile', w: 190, h: 153 },
      { key: 'tablet', w: 300, h: 230 },
      { key: 'desktop', w: 320, h: 260 },
    ] as const;

    const generationResults = await Promise.allSettled(
      variantDefs.map(v => {
        trace.steps.push({ step: 'variant_generate_start', variant: v.key, target: `${v.w}x${v.h}` });
        // ✅ USO DE LA DEPENDENCIA INYECTADA (Critical for Tests)
        return (imageProcessor as any)(imageBuffer, v.w, v.h, v.key, trace).then((data: any) => ({ variant: v.key, data }));
      })
    );

    trace.steps.push({ step: 'variants_generation_complete' });
    const genMap: Record<string, Uint8Array | null> = { minithumb: null, mobile: null, tablet: null, desktop: null };
    const generationErrors: Array<{ variant: string; error: string }> = [];
    
    generationResults.forEach(r => {
      if (r.status === 'fulfilled') genMap[(r as any).value.variant] = (r as any).value.data;
      else generationErrors.push({ variant: (r as any)?.value?.variant || 'unknown', error: (r as any)?.reason?.message || 'generation_failed' });
    });

    if (!genMap.desktop && !genMap.mobile && !genMap.tablet && !genMap.minithumb) {
      console.error('[THUMBS] ALL_VARIANTS_FAILED', { productId, generationErrors });
      return { status: 422, body: { success: false, error: 'NO_VARIANTS_GENERATED', variantErrors: generationErrors } };
    }

    // Timestamp
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

    // Configuración de rutas
    const variantPaths = {
      minithumb: `${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`,
      mobile: `${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`,
      tablet: `${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`,
      desktop: `${supplierId}/${productId}/${timestamp}_desktop_320x260.jpg`
    } as const;

    // Check Bucket
    try {
      const bucketName = 'product-images-thumbnails';
      if (supabaseSr) {
        const { data: buckets } = await supabaseSr.storage.listBuckets();
        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
          try { await supabaseSr.storage.createBucket(bucketName, { public: true, allowedMimeTypes: ['image/jpeg','image/png'], fileSizeLimit: '2097152' }); } catch(_) {}
        } else {
          try { await supabaseSr.storage.updateBucket(bucketName, { public: true, allowedMimeTypes: ['image/jpeg','image/png'], fileSizeLimit: '2097152' }); } catch(_) {}
        }
      }
    } catch (be) {
      logError('⚠️ Bucket existence check/creation failed:', be);
    }

    // Upload
    const uploadVariants = [
      { key: 'minithumb', data: genMap.minithumb, path: variantPaths.minithumb },
      { key: 'mobile', data: genMap.mobile, path: variantPaths.mobile },
      { key: 'tablet', data: genMap.tablet, path: variantPaths.tablet },
      { key: 'desktop', data: genMap.desktop, path: variantPaths.desktop },
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

    // Verificación HEAD
    async function headOk(url: string): Promise<boolean> {
      const controller = new AbortController();
      const to = setTimeout(()=>controller.abort(), 5000);
      try {
        const resp = await fetchFn(url, { method: 'HEAD', signal: controller.signal });
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
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'upload_partial_fail' }); } catch(e) { logError('RPC mark_thumbnail_job_error failed:', e); }
      }
    }

    // Build URLs
    const buildUrl = (variant: keyof typeof variantPaths) => (supabaseSr || supabasePublic!).storage
      .from('product-images-thumbnails')
      .getPublicUrl(variantPaths[variant]).data.publicUrl;

    const minithumbUrl = successfulVariants.has('minithumb') ? buildUrl('minithumb') : null;
    const mobileUrl = successfulVariants.has('mobile') ? buildUrl('mobile') : null;
    const tabletUrl = successfulVariants.has('tablet') ? buildUrl('tablet') : null;
    const desktopUrl = successfulVariants.has('desktop') ? buildUrl('desktop') : null;

    // HEAD Verification Logic
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
      
      // 🔄 RETRY LOOP: Reintento secuencial de re-upload para las variantes faltantes
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

      // Segunda verificación HEAD después de reintentos
      const secondChecks = await Promise.all(urlsToVerify.map(async v => ({ key: v.key, ok: await headOk(v.url) })));
      try { dbg('HEAD_RECHECK', { productId, checks: secondChecks.map(c=>({ key: c.key, ok: c.ok })) }); } catch(_) {}
      trace.steps.push({ step: 'head_recheck', checks: secondChecks });

      const stillMissing = secondChecks.filter(e => !e.ok).map(e => e.key);
      if (stillMissing.length) {
        console.error('[THUMBS] VARIANTS_STILL_MISSING', { productId, stillMissing });
        trace.steps.push({ step: 'variants_still_missing', variants: stillMissing });
        // Remover de successfulVariants para que no se persistan claves vacías
        stillMissing.forEach(k => successfulVariants.delete(k));
      }
    }

    // 📁 STORAGE LIST DEBUG: Listar contenidos reales del path para observabilidad
    if (supabaseSr) {
      try {
        const folderPath = `${supplierId}/${productId}`;
        const { data: listed, error: listErr } = await supabaseSr.storage.from('product-images-thumbnails').list(folderPath, { limit: 50 });
        if (!listErr) {
          trace.steps.push({ step: 'storage_list', files: (listed||[]).map((f: any)=>({ name: f.name, size: f.metadata?.size||null })) });
          dbg('STORAGE_LIST', { productId, files: listed?.map((f: any)=>f.name) });
        } else {
          trace.steps.push({ step: 'storage_list_error', error: listErr.message });
        }
      } catch (lx) {
        trace.steps.push({ step: 'storage_list_exception', error: (lx as any)?.message });
      }
    }

    // DB Update
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
        updatePayload.thumbnail_signature = candidateSignature;
      } else if (ENABLE_SIGNATURE_ENFORCE && signatureMismatch) {
        updatePayload.thumbnail_signature = candidateSignature;
      }
    }

    let dbUpdateError: any = null;
    try {
      const upd = await dbClient.from('product_images')
        .update(updatePayload)
        .eq('product_id', productId)
        .eq('image_order', 0);
      if (upd.error) dbUpdateError = upd.error;
    } catch (e) { dbUpdateError = e; }

    trace.steps.push({ step: 'db_update', error: dbUpdateError ? dbUpdateError.message : null, payloadKeys: Object.keys(thumbnailsPayload) });

    if (dbUpdateError) {
      logError("❌ Error updating thumbnails in DB:", dbUpdateError);
      if (jobTrackingEnabled) {
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: dbUpdateError.message }); } catch(e) { logError('RPC mark_thumbnail_job_error failed:', e); }
      }
    }

    // 🔄 POST-VERIFICACIÓN: Reconsultar fila y validar que las claves se guardaron correctamente
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
          
          // 🔧 MERGE CORRECTIVO: Si faltan claves generadas, intentar merge y re-update
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

    // Evaluar estado final de variantes antes de marcar job
    const hasSuccessfulVariants = successfulVariants.size > 0;
    const hasThumbnailsInDB = storedThumbnails && Object.keys(storedThumbnails).length > 0;
    const failed = successfulVariants.size === 0;
    
    if (!dbUpdateError && jobTrackingEnabled) {
      if (hasSuccessfulVariants || hasThumbnailsInDB) {
        try { 
          await dbClient.rpc('mark_thumbnail_job_success', { p_product_id: productId }); 
        } catch(e) { 
          logError('RPC mark_thumbnail_job_success failed:', e); 
        }
      } else {
        try { 
          await dbClient.rpc('mark_thumbnail_job_error', { 
            p_product_id: productId, 
            p_error: 'all_variants_missing_after_verification' 
          }); 
        } catch(e) { 
          logError('RPC mark_thumbnail_job_error failed:', e); 
        }
      }
    }

    // Construcción de la respuesta final con observabilidad completa
    return { 
      status: (hasSuccessfulVariants || hasThumbnailsInDB) ? 200 : 500, 
      body: { 
        success: hasSuccessfulVariants || hasThumbnailsInDB, 
        partial,
        failed, 
        status: dbUpdateError ? 'stored_without_db_update' : 'stored_and_updated',
        generatedVariants: Array.from(successfulVariants), 
        failedVariants: variantStatuses.filter(v => !v.ok).map(v => ({ variant: v.variant, error: v.error })), 
        dbUpdateError: dbUpdateError ? (dbUpdateError.message || dbUpdateError) : null,
        thumbnails: thumbnailsPayload,
        thumbnailUrl: primaryThumbnail,
        originalSize: imageBuffer.byteLength,
        generatedAt: new Date().toISOString(),
        // 📊 Campos adicionales de observabilidad
        sizes: {
          minithumb: { width: 40, height: 40 },
          mobile: { width: 190, height: 153 },
          tablet: { width: 300, height: 230 },
          desktop: { width: 320, height: 260 }
        },
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
      } 
    };

  } catch (err) {
    if (err && err.name === 'AbortError') return { status: 408, body: { error: 'Image fetch timeout' } };
    throw err;
  }
}

// ==========================================
//  ENTRY POINT (SERVER)
// ==========================================

serve((req) => withMetrics('generate-thumbnail', req, async () => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  thumbsLog('REQ_START', { method: req.method, url: req.url });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestBody = await req.json();
    
    // Llamada a la lógica pura usando las dependencias reales de Deno
    const res = await processGenerateThumbnail(requestBody, { 
      env: Deno.env, 
      fetch: fetch, 
      createClient: createClient 
    });

    return new Response(JSON.stringify(res.body), { 
      status: res.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    thumbsLog('GEN_FATAL', { error: (err as any)?.message, stack: (err as any)?.stack?.slice(0,500), name: (err as any)?.name });
    // Siempre loguear error fatal aunque DEBUG_MODE esté off
    console.error('❌ Edge Function top-level error:', err);
    
    // 🔄 FALLBACK RPC: Marcar job error si tracking activo (incluso en error fatal)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (supabaseUrl && (serviceRoleKey || anonKey)) {
        const tmpClient = createClient(supabaseUrl, serviceRoleKey || anonKey!);
        let body: any = {};
        try { body = await req.clone().json(); } catch(_){ }
        if (body?.productId) {
          try { 
            await tmpClient.rpc('mark_thumbnail_job_error', { 
              p_product_id: body.productId, 
              p_error: (err as any)?.message?.slice(0,500) || 'edge_error' 
            }); 
          } catch(_) {}
        }
      }
    } catch (_) {}
    
    return new Response(JSON.stringify({ 
      error: (err as any)?.message || 'Internal server error',
      details: (err as any)?.stack,
      type: (err as any)?.constructor?.name
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}));