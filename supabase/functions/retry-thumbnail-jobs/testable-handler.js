// Minimal test shim for retry-thumbnail-jobs (CommonJS for Jest)
async function processRetryThumbnailJobs(deps = {}) {
  const supabase = deps.supabase
  const fetchFn = deps.fetch || (async () => ({ ok: false }))
  const GENERATE_FN_URL =
    deps.generateUrl || 'https://supabase/functions/v1/generate-thumbnail'
  const MAX_ATTEMPTS = deps.maxAttempts || 5
  const BATCH_LIMIT = deps.batchLimit || 20

  // 1. List jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('image_thumbnail_jobs')
    .select('product_id, product_image_id, attempts')
    .eq('status', 'error')
    .lt('attempts', MAX_ATTEMPTS)
    .order('updated_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (jobsError) return { status: 500, error: jobsError.message }
  if (!jobs || jobs.length === 0)
    return { processed: 0, retried: 0, success: 0, errors: [] }

  const retried = []
  const successes = []
  const errors = []

  for (const job of jobs) {
    const productId = job.product_id
    try {
      const { data: mainImg, error: mainImgErr } = await supabase
        .from('product_images')
        .select('id, product_id, image_url, thumbnails, thumbnail_url')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .single()

      if (mainImgErr || !mainImg) {
        await supabase.rpc('mark_thumbnail_job_error', {
          p_product_id: productId,
          p_error: 'main_image_missing',
        })
        errors.push(`${productId}: main image missing`)
        continue
      }

      if (
        mainImg.thumbnails &&
        mainImg.thumbnails.desktop &&
        mainImg.thumbnail_url
      ) {
        // HEAD check with timeout
        let headOk = false
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 3000)
          try {
            const r = await fetchFn(mainImg.thumbnail_url, {
              method: 'HEAD',
              signal: controller.signal,
            })
            headOk = !!(r && r.ok)
          } finally {
            clearTimeout(timeout)
          }
        } catch (_) {
          headOk = false
        }

        if (headOk) {
          await supabase.rpc('mark_thumbnail_job_success', {
            p_product_id: productId,
          })
          successes.push(productId)
          continue
        }
        // else fallthrough to regeneration
      }

      // restart job
      await supabase.rpc('start_thumbnail_job', {
        p_product_id: productId,
        p_product_image_id: mainImg.id,
      })
      retried.push(productId)

      // call generate-thumbnail
      const genResp = await fetchFn(GENERATE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: mainImg.image_url, productId }),
      })
      if (!genResp.ok) {
        const txt = await genResp.text().catch(() => '')
        await supabase.rpc('mark_thumbnail_job_error', {
          p_product_id: productId,
          p_error: `generate_fail:${txt.slice(0, 120)}`,
        })
        errors.push(`${productId}: generate-fail ${genResp.status}`)
        continue
      }
      const genData = await genResp.json().catch(() => ({}))
      if (genData?.success) {
        successes.push(productId)
      } else {
        await supabase.rpc('mark_thumbnail_job_error', {
          p_product_id: productId,
          p_error: 'generate_response_not_success',
        })
        errors.push(`${productId}: response not success`)
      }
    } catch (e) {
      await supabase.rpc('mark_thumbnail_job_error', {
        p_product_id: productId,
        p_error: e && e.message ? e.message.slice(0, 120) : 'unknown',
      })
      errors.push(`${productId}: ${e && e.message ? e.message : String(e)}`)
    }
  }

  return {
    processed: jobs.length,
    retried: retried.length,
    success: successes.length,
    errors,
  }
}

module.exports = { processRetryThumbnailJobs }
