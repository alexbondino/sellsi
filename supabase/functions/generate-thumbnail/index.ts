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

// Función para redimensionar imágenes usando una librería compatible con Edge Runtime
async function createThumbnailFromOriginal(imageBuffer: ArrayBuffer, width: number, height: number): Promise<Uint8Array> {
  try {
    // Detectar el tipo de imagen
    const imageType = detectImageType(imageBuffer);
    const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
    let originalImage;
    try {
      originalImage = await Image.decode(new Uint8Array(imageBuffer));
    } catch (decodeError) {
      // Si es WebP transparente no soportado, sugerir conversión previa a PNG
      if (imageType === 'webp') {
        logError('❌ WebP transparente no soportado. Se recomienda convertir a PNG antes de subir.');
      }
      throw decodeError;
    }

    // Si la imagen es WebP, abortar el pipeline y no generar thumbnails
    if (imageType === 'webp') {
      throw new Error('No se permiten imágenes WebP.');
    }
    // Si la imagen NO es WebP y tiene transparencia, lanzar error para abortar el pipeline
    if (originalImage.hasAlpha) {
      throw new Error('No se permiten imágenes con transparencia.');
    }

    // Calcular nuevas dimensiones manteniendo proporciones
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
    // Redimensionar la imagen
    const resizedImage = originalImage.resize(newWidth, newHeight);
    // Si la imagen redimensionada es más grande que el target, hacer crop centrado
    let finalImage = resizedImage;
    if (newWidth > width || newHeight > height) {
      const cropX = Math.max(0, Math.floor((newWidth - width) / 2));
      const cropY = Math.max(0, Math.floor((newHeight - height) / 2));
      finalImage = resizedImage.crop(cropX, cropY, width, height);
    }
    // Validar tamaño final
    if (finalImage.width !== width || finalImage.height !== height) {
      logError(`❌ Thumbnail size incorrect (${finalImage.width}x${finalImage.height}), forzando fondo blanco ${width}x${height}`);
      const blank = new Image(width, height);
      blank.fill(0xffffffff);
      finalImage = blank;
    }
    // Codificar como JPEG con calidad 80% (todos los thumbnails serán JPEG para consistencia)
    const thumbnailData = await finalImage.encode(80);
    return thumbnailData;
  } catch (error) {
    logError(`❌ Error creating thumbnail ${width}x${height}:`, error);
    logError('Error details:', error.message);
    logError('Error stack:', error.stack);
    // Fallback: retornar thumbnail blanco del tamaño correcto
    const { Image } = await import("https://deno.land/x/imagescript@1.2.15/mod.ts");
    const blank = new Image(width, height);
    blank.fill(0xffffffff);
    return await blank.encode(80);
  }
}

serve((req) => withMetrics('generate-thumbnail', req, async () => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.json();
    const { imageUrl, productId, supplierId } = requestBody;

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
      .select('id, thumbnails, thumbnail_url')
      .eq('product_id', productId)
      .eq('image_order', 0)
      .single();

    if (mainImageError || !mainImage) {
      return new Response(JSON.stringify({ error: 'Imagen principal no encontrada para este producto' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mainImage.thumbnails && mainImage.thumbnails.desktop && mainImage.thumbnail_url) {
      // Idempotente: ya existen thumbnails
      return new Response(JSON.stringify({
        success: true,
        status: 'ok',
        message: 'Thumbnails ya existentes (idempotente)',
        thumbnails: mainImage.thumbnails,
        thumbnailUrl: mainImage.thumbnail_url
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

      if (imageBuffer.byteLength === 0) {
        logError("❌ Empty image buffer");
        return new Response(JSON.stringify({ error: 'Empty image data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Detectar tipo de imagen antes de procesar thumbnails
      const imageType = detectImageType(imageBuffer);
      if (imageType === 'webp') {
        logError('❌ No se permiten imágenes WebP.');
        return new Response(JSON.stringify({ error: 'No se permiten imágenes WebP como entrada.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate thumbnails with different sizes for responsive design
      const thumbnailPromises = [
        createThumbnailFromOriginal(imageBuffer, 40, 40),
        createThumbnailFromOriginal(imageBuffer, 190, 153),
        createThumbnailFromOriginal(imageBuffer, 300, 230),
        createThumbnailFromOriginal(imageBuffer, 320, 260)
      ];

      const [minithumb, mobileThumb, tabletThumb, desktopThumb] = await Promise.all(thumbnailPromises);

    // Extract timestamp from original image URL if possible, otherwise use current timestamp
    let timestamp = Date.now();
    try {
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const timestampMatch = filename.match(/^(\d+)_/);
      if (timestampMatch) {
        timestamp = parseInt(timestampMatch[1]);
        log(`✅ Extracted timestamp from original image: ${timestamp}`);
      } else {
        log(`⚠️ No timestamp found in filename: ${filename}, using current timestamp: ${timestamp}`);
      }
    } catch (error) {
      log(`⚠️ Error extracting timestamp from URL: ${error.message}, using current timestamp: ${timestamp}`);
    }

    // Upload thumbnails to storage
    const uploadPromises = [
  (supabaseSr || supabasePublic!).storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`, minithumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000' // 1 year cache
        }),
  (supabaseSr || supabasePublic!).storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`, mobileThumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000' // 1 year cache
        }),
  (supabaseSr || supabasePublic!).storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`, tabletThumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000'
        }),
  (supabaseSr || supabasePublic!).storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_desktop_320x260.jpg`, desktopThumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000'
        })
    ];

    const uploadResults = await Promise.all(uploadPromises);
    const errors = uploadResults.filter(result => result.error);
    if (errors.length > 0) {
      logError("❌ Error uploading thumbnails:", errors);
      if (jobTrackingEnabled) {
        await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'upload_fail' }).catch(()=>{});
      }
      return new Response(JSON.stringify({ 
        error: 'Failed to upload thumbnails',
        details: errors.map(err => err.error?.message).join(', ')
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate public URLs
  const minithumbUrl = (supabaseSr || supabasePublic!).storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`).data.publicUrl;

  const mobileUrl = (supabaseSr || supabasePublic!).storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`).data.publicUrl;

  const tabletUrl = (supabaseSr || supabasePublic!).storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`).data.publicUrl;

  const desktopUrl = (supabaseSr || supabasePublic!).storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_desktop_320x260.jpg`).data.publicUrl;

    // Update SOLO la imagen principal (image_order=0) y solo si todavía no tenía thumbnails
  const { error: dbUpdateError } = await dbClient
      .from('product_images')
      .update({
        thumbnails: {
          minithumb: minithumbUrl,
          mobile: mobileUrl,
          tablet: tabletUrl,
          desktop: desktopUrl
        },
        thumbnail_url: desktopUrl
      })
      .eq('product_id', productId)
      .eq('image_order', 0)
      .is('thumbnails', null);

    if (dbUpdateError) {
      logError("❌ Error updating thumbnails in DB:", dbUpdateError);
      // Optionally, you can return an error here or just log it and continue
      if (jobTrackingEnabled) {
        await dbClient.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: dbUpdateError.message }).catch(()=>{});
      }
    }

    if (!dbUpdateError && jobTrackingEnabled) {
      await dbClient.rpc('mark_thumbnail_job_success', { p_product_id: productId }).catch(()=>{});
    }

    const response = {
      success: true,
      status: dbUpdateError ? 'stored_without_db_update' : 'stored_and_updated',
      thumbnailUrl: desktopUrl, // Compatibilidad
      thumbnails: {
        minithumb: minithumbUrl,
        mobile: mobileUrl,
        tablet: tabletUrl,
        desktop: desktopUrl
      },
      sizes: {
        minithumb: { width: 40, height: 40 },
        mobile: { width: 190, height: 153 },
        tablet: { width: 300, height: 230 },
        desktop: { width: 320, height: 260 }
      },
      originalSize: imageBuffer.byteLength,
      generatedAt: new Date().toISOString(),
      clientMode: serviceRoleKey ? 'service_role' : 'anon'
    };

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
    logError("❌ Edge Function error:", error);
    try {
      // Fallback: marcar job error si tracking activo
      // (No re-lanzamos si falla este update)
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (supabaseUrl && (serviceRoleKey || anonKey)) {
        const tmpClient = createClient(supabaseUrl, serviceRoleKey || anonKey!);
        const body = await req.clone().json().catch(() => ({}));
        if (body?.productId) {
          await tmpClient.rpc('mark_thumbnail_job_error', { p_product_id: body.productId, p_error: (error as any)?.message?.slice(0,500) || 'edge_error' }).catch(()=>{});
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
