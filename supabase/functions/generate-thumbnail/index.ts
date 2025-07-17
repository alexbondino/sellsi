// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.


// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
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

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      logError("❌ Missing environment variables");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      supabase.storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`, minithumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000' // 1 year cache
        }),
      supabase.storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`, mobileThumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000' // 1 year cache
        }),
      supabase.storage
        .from('product-images-thumbnails')
        .upload(`${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`, tabletThumb, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000'
        }),
      supabase.storage
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
      return new Response(JSON.stringify({ 
        error: 'Failed to upload thumbnails',
        details: errors.map(err => err.error?.message).join(', ')
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate public URLs
    const minithumbUrl = supabase.storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_minithumb_40x40.jpg`).data.publicUrl;

    const mobileUrl = supabase.storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_mobile_190x153.jpg`).data.publicUrl;

    const tabletUrl = supabase.storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_tablet_300x230.jpg`).data.publicUrl;

    const desktopUrl = supabase.storage
      .from('product-images-thumbnails')
      .getPublicUrl(`${supplierId}/${productId}/${timestamp}_desktop_320x260.jpg`).data.publicUrl;

    // Update the product_images table with the new thumbnails
    const { error: dbUpdateError } = await supabase
      .from('product_images')
      .update({
        thumbnails: {
          minithumb: minithumbUrl,
          mobile: mobileUrl,
          tablet: tabletUrl,
          desktop: desktopUrl
        }
      })
      .eq('product_id', productId);

    if (dbUpdateError) {
      logError("❌ Error updating thumbnails in DB:", dbUpdateError);
      // Optionally, you can return an error here or just log it and continue
    }

    const response = {
      success: true,
      thumbnailUrl: desktopUrl, // Main thumbnail for backward compatibility
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
      generatedAt: new Date().toISOString()
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
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack,
      type: error.constructor.name
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-thumbnail' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"imageUrl":"https://example.com/image.jpg","productId":"test-product","supplierId":"test-supplier"}'

*/
