// Edge Function: retry-thumbnail-jobs
// Objetivo: Reintentar generación de thumbnails para jobs en estado 'error' con attempts < MAX_ATTEMPTS
// Estrategia:
// 1. Seleccionar lote de jobs error ordenados por updated_at ASC
// 2. Reiniciar job vía start_thumbnail_job (incrementa attempts y status=processing)
// 3. Invocar generate-thumbnail internamente (HTTP) para la imagen principal si aún no tiene thumbnails
// 4. Si éxito => mark_thumbnail_job_success; si falla => mark_thumbnail_job_error con mensaje
// 5. Retornar resumen (procesados, reintentos lanzados, éxitos, errores)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withMetrics } from '../_shared/metrics.ts'
// NOTE: Local editors without Deno types may complain; declare Deno to silence TS diagnostics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
const GENERATE_FN_URL = Deno.env.get('GENERATE_THUMBNAIL_URL') // opcional override
// Consolidated maintenance token (single secret for cleanup, purge, retry)
const MAINTENANCE_SECRET_TOKEN = Deno.env.get('CLEANUP_SECRET_TOKEN')
const MAX_ATTEMPTS = parseInt(Deno.env.get('THUMBNAIL_MAX_ATTEMPTS') || '5', 10)
const BATCH_LIMIT = parseInt(Deno.env.get('RETRY_BATCH_LIMIT') || '20', 10)

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL')
}
if (!SERVICE_KEY) {
  console.warn('⚠️ retry-thumbnail-jobs: No service role key set; will likely fail to update jobs until provided.')
}
if (!MAINTENANCE_SECRET_TOKEN) {
  throw new Error('Missing CLEANUP_SECRET_TOKEN env var')
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || Deno.env.get('SUPABASE_ANON_KEY') || '', { auth: { persistSession: false } })

interface JobRow { product_id: string; product_image_id: string | null }

serve((req) => withMetrics('retry-thumbnail-jobs', req, async () => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 })
  }
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ') || auth.substring(7) !== MAINTENANCE_SECRET_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Seleccionar jobs a reintentar
  const { data: jobs, error: jobsError } = await supabase
    .from('image_thumbnail_jobs')
    .select('product_id, product_image_id, attempts')
    .eq('status', 'error')
    .lt('attempts', MAX_ATTEMPTS)
    .order('updated_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (jobsError) {
    return new Response(JSON.stringify({ error: 'Error listando jobs', details: jobsError.message }), { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ processed: 0, retried: 0, success: 0, errors: [] }), { status: 200 })
  }

  const retried: string[] = []
  const successes: string[] = []
  const errors: string[] = []

  for (const job of jobs) {
    const productId = job.product_id
    try {
      // Recuperar imagen principal (para datos supplierId + URL)
      const { data: mainImg, error: mainImgErr } = await supabase
        .from('product_images')
        .select('id, product_id, image_url, thumbnails, product_id, product_id')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .single()
      if (mainImgErr || !mainImg) {
        await supabase.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'main_image_missing' })
        errors.push(`${productId}: main image missing`)
        continue
      }
      if (mainImg.thumbnails && mainImg.thumbnails.desktop && mainImg.thumbnail_url) {
        // Verificar existencia física del archivo antes de marcar success
        let headCheckOk = false
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 3000)
          try {
            const headResp = await fetch(mainImg.thumbnail_url, {
              method: 'HEAD',
              signal: controller.signal,
            })
            headCheckOk = headResp.ok
          } finally {
            clearTimeout(timeout)
          }
        } catch (_) {
          // Si HEAD check falla, continuar a regeneración
        }

        if (headCheckOk) {
          await supabase.rpc('mark_thumbnail_job_success', { p_product_id: productId })
          successes.push(productId)
          continue
        }
        // Si HEAD falla, continuar a regeneración
      }

      // Reiniciar job (incrementa attempts)
      await supabase.rpc('start_thumbnail_job', { p_product_id: productId, p_product_image_id: mainImg.id })

      retried.push(productId)

      // Construir URL de función generate-thumbnail
      const generateUrl = GENERATE_FN_URL || `${SUPABASE_URL}/functions/v1/generate-thumbnail`
      // En la request original se usaba supplierId, lo derivamos del path de la image_url si tiene supplierId/productId/
      let supplierId = 'unknown'
      try {
        const parts = mainImg.image_url.split('/')
        // buscar secuencia .../product-images/<supplier>/<productId>/
        const idx = parts.findIndex(p => p === 'product-images-thumbnails' || p === 'product-images')
        if (idx >= 0 && parts[idx+2] === productId) {
          supplierId = parts[idx+1]
        }
      } catch { /* noop */ }

      // Llamar generate-thumbnail (fire & wait)
      const genResp = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: mainImg.image_url, productId, supplierId })
      })
      if (!genResp.ok) {
        const txt = await genResp.text()
        await supabase.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: `generate_fail:${txt.slice(0,120)}` })
        errors.push(`${productId}: generate-fail ${genResp.status}`)
        continue
      }
      const genData = await genResp.json().catch(()=>({}))
      if (genData?.success) {
        successes.push(productId)
      } else {
        await supabase.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: 'generate_response_not_success' })
        errors.push(`${productId}: response not success`)
      }
    } catch (e: any) {
      await supabase.rpc('mark_thumbnail_job_error', { p_product_id: productId, p_error: e.message.slice(0,120) })
      errors.push(`${productId}: ${e.message}`)
    }
  }

  return new Response(JSON.stringify({ processed: jobs.length, retried: retried.length, success: successes.length, errors }), { status: errors.length ? 207 : 200 })
}))
