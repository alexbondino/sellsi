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

// 🚀 OPTIMIZACIÓN: Reducir logging masivo que consume BigQuery
const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'
const log = DEBUG_MODE ? console.log : () => {}
const logError = DEBUG_MODE ? console.error : () => {}
// Logging casi nulo para reducir cuota: mantener sólo errores fatales fuera de thumbsLog.
function thumbsLog(_event: string, _data: Record<string, unknown> = {}) { /* no-op */ }

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

// Función: ignora WebP, aplana PNG/JPEG con transparencia sobre fondo blanco
async function createThumbnailFromOriginal(imageBuffer: ArrayBuffer, width: number, height: number): Promise<Uint8Array> {
  const imageType = detectImageType(imageBuffer);
  if (imageType === 'webp') throw new Error('WEBP_NOT_ALLOWED');
  const { Image } = await getImageModule();
  let originalImage: any;
  try {
    originalImage = await Image.decode(new Uint8Array(imageBuffer));
  } catch (e) {
    thumbsLog('DECODE_FAIL', { message: (e as any)?.message?.slice(0,200) || 'decode_error' });
    throw e;
  }
  const aspectRatio = originalImage.width / originalImage.height;
  const targetAspectRatio = width / height;
  let newWidth = width;
  let newHeight = height;
  if (aspectRatio > targetAspectRatio) {
    newHeight = height;
    newWidth = Math.round(height * aspectRatio);
  } else {
    newWidth = width;
    newHeight = Math.round(width / aspectRatio);
  }
  let resizedImage = originalImage.resize(newWidth, newHeight);
  if (newWidth > width || newHeight > height) {
    const cropX = Math.max(0, Math.floor((newWidth - width) / 2));
    const cropY = Math.max(0, Math.floor((newHeight - height) / 2));
    resizedImage = resizedImage.crop(cropX, cropY, width, height);
  }
  // Aplanar si tiene alpha
  if (resizedImage.hasAlpha) {
    const flattened = new Image(width, height);
    flattened.fill(0xffffffff); // blanco
    flattened.draw(resizedImage, 0, 0);
    resizedImage = flattened;
  }
  if (resizedImage.width !== width || resizedImage.height !== height) {
    const blank = new Image(width, height);
    blank.fill(0xffffffff);
    resizedImage = blank;
  }
  return await resizedImage.encode(80);
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
  const { imageUrl, productId, supplierId, force } = requestBody;
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
      if (imageType === 'webp') {
        return new Response(JSON.stringify({ success: true, ignored: true, reason: 'webp_main_ignored' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate thumbnails (per-variant error resilience)
      const variantDefs = [
        { key: 'minithumb', w: 40, h: 40 },
        { key: 'mobile', w: 190, h: 153 },
        { key: 'tablet', w: 300, h: 230 },
        { key: 'desktop', w: 320, h: 260 },
      ] as const;

  const generationResults = await Promise.allSettled(
        variantDefs.map(v => createThumbnailFromOriginal(imageBuffer, v.w, v.h)
          .then(data => ({ variant: v.key, data }))
        )
      );

      const genMap: Record<string, Uint8Array | null> = { minithumb: null, mobile: null, tablet: null, desktop: null };
      let generationErrors: Array<{ variant: string; error: string }> = [];
      generationResults.forEach(r => {
        if (r.status === 'fulfilled') {
          genMap[r.value.variant] = r.value.data;
        } else {
          const message = (r.reason && (r.reason.message || String(r.reason))) || 'unknown_generation_error';
          generationErrors.push({ variant: (r as any)?.reason?.variant || 'unknown', error: message });
        }
      });
  thumbsLog('GEN_VARIANTS_RESULT', { productId, errors: generationErrors, ok: variantDefs.map(v=>({v:v.key, present: !!genMap[v.key]})) });
      const minithumb = genMap.minithumb;
      const mobileThumb = genMap.mobile;
      const tabletThumb = genMap.tablet;
      const desktopThumb = genMap.desktop;
      if (!desktopThumb && !mobileThumb && !tabletThumb && !minithumb) {
        thumbsLog('ALL_VARIANTS_FAILED', { productId, generationErrors });
        return new Response(JSON.stringify({
          success: false,
          error: 'NO_VARIANTS_GENERATED',
          variantErrors: generationErrors
        }), {
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
          try { await supabaseSr.storage.createBucket(bucketName, { public: true, allowedMimeTypes: ['image/jpeg'], fileSizeLimit: '2097152' }); } catch(_) {}
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
      try {
        const res = await (supabaseSr || supabasePublic!).storage
          .from('product-images-thumbnails')
          .upload(v.path, v.data, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true
          });
        return { variant: v.key, path: v.path, error: res.error };
      } catch (e) {
        return { variant: v.key, path: v.path, error: e };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    const variantStatuses = uploadResults.map(r => ({
      variant: r.variant,
      ok: !r.error || /exists/i.test(r.error.message || ''),
      error: r.error ? (r.error.message || 'unknown_error') : null
    }));
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

    // Update principal (image_order=0). En observación: sólo seteamos signature si no existía o coincide.
    const thumbnailsPayload: Record<string,string> = {};
    if (minithumbUrl) thumbnailsPayload.minithumb = minithumbUrl;
    if (mobileUrl) thumbnailsPayload.mobile = mobileUrl;
    if (tabletUrl) thumbnailsPayload.tablet = tabletUrl;
    if (desktopUrl) thumbnailsPayload.desktop = desktopUrl;
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

    if (dbUpdateError) {
      logError("❌ Error updating thumbnails in DB:", dbUpdateError);
      // Optionally, you can return an error here or just log it and continue
      if (jobTrackingEnabled) {
        try { await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: dbUpdateError.message }); } catch(_) {}
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
  forced: !!force
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
