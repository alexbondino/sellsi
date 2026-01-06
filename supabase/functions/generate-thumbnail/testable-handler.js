// Minimal test shim for generate-thumbnail logic (CommonJS so Jest can require it easily)
// 🔒 ROBUSTNESS VERSION: Includes retry loops, post-DB verification, and merge correctivo
const { TextEncoder, TextDecoder } = require('util')

function detectImageType(buffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return 'png'
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'webp'
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  )
    return 'gif'
  return 'unknown'
}

async function createThumbnailFromOriginal(
  imageBuffer,
  width,
  height,
  variantKey,
  trace
) {
  // Minimal behavior for tests: if buffer starts with valid JPG/PNG return a Uint8Array with some bytes,
  // otherwise throw to simulate decode failure
  const type = detectImageType(imageBuffer)
  if (type === 'webp') throw new Error('WEBP_NOT_ALLOWED')
  if (type === 'jpeg' || type === 'png') return new Uint8Array([1, 2, 3])
  throw new Error('decode_fail')
}

async function processGenerateThumbnail(requestBody, deps = {}) {
  const env = deps.env || {}
  const fetchFn = deps.fetch || (async () => ({ ok: false }))
  const createClientFn =
    deps.createClient ||
    (() => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ single: async () => ({ data: null, error: null }) }),
          }),
        }),
      }),
    }))

  const trace = { startedAt: Date.now(), steps: [] }
  const { imageUrl, productId, supplierId, force } = requestBody || {}
  if (!imageUrl || !productId || !supplierId)
    return {
      status: 400,
      body: {
        error: 'Missing required parameters: imageUrl, productId, supplierId',
      },
    }

  const supabaseUrl = env.get ? env.get('SUPABASE_URL') : env.SUPABASE_URL
  const anonKey = env.get ? env.get('SUPABASE_ANON_KEY') : env.SUPABASE_ANON_KEY
  const serviceRoleKey = env.get
    ? env.get('SUPABASE_SERVICE_ROLE_KEY') || env.get('SERVICE_ROLE_KEY')
    : env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY
  if (!supabaseUrl || (!anonKey && !serviceRoleKey))
    return { status: 500, body: { error: 'Server configuration error' } }

  const dbClient = createClientFn()
  const { data: mainImage, error: mainImageError } = await dbClient
    .from('product_images')
    .select(
      'id, thumbnails, thumbnail_url, image_url, thumbnail_signature, updated_at'
    )
    .eq('product_id', productId)
    .eq('image_order', 0)
    .single()
  if (mainImageError || !mainImage)
    return {
      status: 404,
      body: { error: 'Imagen principal no encontrada para este producto' },
    }

  // Idempotency/signature check before heavy work (avoid fetching large blobs when unnecessary)
  const ENABLE_SIGNATURE_ENFORCE = env.get
    ? env.get('ENABLE_SIGNATURE_ENFORCE') === 'true'
    : env.ENABLE_SIGNATURE_ENFORCE === 'true'
  const previousSignature = mainImage.thumbnail_signature || null
  const candidateSignature = (() => {
    try {
      return (imageUrl || '').split('?')[0].split('/').pop()
    } catch (_) {
      return null
    }
  })()
  const signatureMismatch =
    previousSignature &&
    candidateSignature &&
    previousSignature !== candidateSignature
  let cooldownActive = false
  if (ENABLE_SIGNATURE_ENFORCE && signatureMismatch) {
    try {
      const updatedAtMs = Date.parse(mainImage.updated_at)
      if (!Number.isNaN(updatedAtMs)) {
        const delta = Date.now() - updatedAtMs
        const cooldown = Number(
          env.get
            ? env.get('SIGNATURE_ENFORCE_COOLDOWN_MS') || '5000'
            : env.SIGNATURE_ENFORCE_COOLDOWN_MS || '5000'
        )
        cooldownActive = delta < cooldown
      }
    } catch (_) {}
  }
  const allVariantsExist = !!(
    mainImage.thumbnails &&
    mainImage.thumbnails.desktop &&
    mainImage.thumbnails.tablet &&
    mainImage.thumbnails.mobile &&
    mainImage.thumbnails.minithumb &&
    mainImage.thumbnail_url
  )
  if (
    !force &&
    allVariantsExist &&
    (!signatureMismatch || !ENABLE_SIGNATURE_ENFORCE || cooldownActive)
  ) {
    return {
      status: 200,
      body: {
        success: true,
        status: 'ok',
        message:
          'Todas las variantes de thumbnails ya existen (idempotente)' +
          (signatureMismatch && ENABLE_SIGNATURE_ENFORCE && cooldownActive
            ? ' (cooldown)'
            : ''),
        thumbnails: mainImage.thumbnails,
        thumbnailUrl: mainImage.thumbnail_url,
        previousSignature,
        candidateSignature,
        staleDetected: !!signatureMismatch,
        enforcement: ENABLE_SIGNATURE_ENFORCE,
        cooldownActive,
        forced: false,
      },
    }
  }

  // Fetch image
  try {
    const imageResponse = await fetchFn(imageUrl)
    if (!imageResponse.ok)
      return { status: 400, body: { error: 'Failed to fetch image' } }
    const imageBuffer = await imageResponse.arrayBuffer()
    if (imageBuffer.byteLength === 0)
      return { status: 400, body: { error: 'Empty image data' } }
    const imageType = detectImageType(imageBuffer)
    if (imageType === 'gif')
      return {
        status: 422,
        body: {
          success: false,
          error: 'unsupported_image_type',
          reason: 'gif_not_supported',
        },
      }
    if (imageType === 'webp')
      return {
        status: 200,
        body: { success: true, ignored: true, reason: 'webp_main_ignored' },
      }

    // Allow injection of an image processing function for testability (defaults to internal implementation)
    const imageProcessor =
      deps.imageProcessor || module.exports.createThumbnailFromOriginal

    // Generate variants for each defined size and collect results
    const variantDefs = [
      { key: 'minithumb', w: 40, h: 40 },
      { key: 'mobile', w: 190, h: 153 },
      { key: 'tablet', w: 300, h: 230 },
      { key: 'desktop', w: 320, h: 260 },
    ]

    const genMap = {
      minithumb: null,
      mobile: null,
      tablet: null,
      desktop: null,
    }
    const generationErrors = []
    for (const v of variantDefs) {
      try {
        const data = await imageProcessor(imageBuffer, v.w, v.h, v.key, trace)
        genMap[v.key] = data
      } catch (e) {
        generationErrors.push({
          variant: v.key,
          error: e.message || 'generate_failed',
        })
      }
    }

    if (
      !genMap.desktop &&
      !genMap.mobile &&
      !genMap.tablet &&
      !genMap.minithumb
    ) {
      return {
        status: 422,
        body: {
          success: false,
          error: 'NO_VARIANTS_GENERATED',
          variantErrors: generationErrors,
        },
      }
    }

    // Prepare upload paths
    const ts = Date.now()
    const variantPaths = {
      minithumb: `${supplierId}/${productId}/${ts}_minithumb_40x40.jpg`,
      mobile: `${supplierId}/${productId}/${ts}_mobile_190x153.jpg`,
      tablet: `${supplierId}/${productId}/${ts}_tablet_300x230.jpg`,
      desktop: `${supplierId}/${productId}/${ts}_desktop_320x260.jpg`,
    }

    // Storage client (from createClient)
    const client = createClientFn()
    const storage = client.storage || {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: async () => ({ data: [], error: null }),
      }),
    }

    // Upload each variant and collect statuses
    const uploadVariants = [
      {
        key: 'minithumb',
        data: genMap.minithumb,
        path: variantPaths.minithumb,
      },
      { key: 'mobile', data: genMap.mobile, path: variantPaths.mobile },
      { key: 'tablet', data: genMap.tablet, path: variantPaths.tablet },
      { key: 'desktop', data: genMap.desktop, path: variantPaths.desktop },
    ]
    const uploadResults = []
    for (const v of uploadVariants) {
      const data = v.data
      const path = v.path
      if (!data) {
        uploadResults.push({
          variant: v.key,
          path,
          error: new Error('no_data'),
        })
        continue
      }
      try {
        const res = await storage
          .from('product-images-thumbnails')
          .upload(path, data, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true,
          })
        uploadResults.push({
          variant: v.key,
          path,
          data,
          error: res && res.error ? res.error : null,
        })
      } catch (e) {
        uploadResults.push({ variant: v.key, path, data, error: e })
      }
    }

    const variantStatuses = uploadResults.map((r) => ({
      variant: r.variant,
      ok: !r.error || /exists/i.test(r.error.message || ''),
      error: r.error ? r.error.message || 'unknown_error' : null,
    }))
    const successfulVariants = new Set(
      variantStatuses.filter((v) => v.ok).map((v) => v.variant)
    )
    const partial = successfulVariants.size < Object.keys(variantPaths).length

    // Build public URLs for successful variants
    const buildUrl = (variant) =>
      storage
        .from('product-images-thumbnails')
        .getPublicUrl(variantPaths[variant]).data.publicUrl
    const urls = {}
    if (successfulVariants.has('minithumb'))
      urls.minithumb = buildUrl('minithumb')
    if (successfulVariants.has('mobile')) urls.mobile = buildUrl('mobile')
    if (successfulVariants.has('tablet')) urls.tablet = buildUrl('tablet')
    if (successfulVariants.has('desktop')) urls.desktop = buildUrl('desktop')

    // 🔄 HEAD checks and reupload attempts for missing files
    async function headOk(url) {
      try {
        const r = await fetchFn(url, { method: 'HEAD' })
        return r && r.status >= 200 && r.status < 400
      } catch (_) {
        return false
      }
    }
    const urlsToVerify = Object.keys(urls).map((k) => ({
      key: k,
      url: urls[k],
    }))
    const existenceChecks = []
    for (const v of urlsToVerify)
      existenceChecks.push({ key: v.key, ok: await headOk(v.url) })
    const missingAfterHead = existenceChecks
      .filter((e) => !e.ok)
      .map((e) => e.key)

    if (missingAfterHead.length) {
      // 🔄 RETRY LOOP: Re-upload for missing variants
      for (const miss of missingAfterHead) {
        const variantObj = uploadVariants.find((v) => v.key === miss)
        if (variantObj && variantObj.data) {
          try {
            const reRes = await storage
              .from('product-images-thumbnails')
              .upload(variantObj.path, variantObj.data, {
                contentType: 'image/jpeg',
                cacheControl: '31536000',
                upsert: true,
              })
            trace.steps.push({
              step: 'reupload_attempt',
              variant: miss,
              error: reRes && reRes.error ? reRes.error.message || 'err' : null,
            })
          } catch (reUpErr) {
            trace.steps.push({
              step: 'reupload_exception',
              variant: miss,
              error: (reUpErr && reUpErr.message) || String(reUpErr),
            })
          }
        }
      }
      // Second HEAD check
      const secondChecks = []
      for (const v of urlsToVerify)
        secondChecks.push({ key: v.key, ok: await headOk(v.url) })
      const stillMissing = secondChecks.filter((e) => !e.ok).map((e) => e.key)
      stillMissing.forEach((k) => successfulVariants.delete(k))
    }

    // Update DB row
    const thumbnailsPayload = {}
    if (urls.minithumb && successfulVariants.has('minithumb'))
      thumbnailsPayload.minithumb = urls.minithumb
    if (urls.mobile && successfulVariants.has('mobile'))
      thumbnailsPayload.mobile = urls.mobile
    if (urls.tablet && successfulVariants.has('tablet'))
      thumbnailsPayload.tablet = urls.tablet
    if (urls.desktop && successfulVariants.has('desktop'))
      thumbnailsPayload.desktop = urls.desktop
    const primaryThumbnail =
      urls.desktop || urls.tablet || urls.mobile || urls.minithumb || null

    let dbUpdateError = null
    let storedThumbnails = null
    let storedPrimary = null
    // Tracks whether we attempted to mark the job as error via RPC (so we can return 200 when fallback ran)
    let rpcMarkedAsError = false
    try {
      const upd = await client
        .from('product_images')
        .update({
          thumbnails: thumbnailsPayload,
          thumbnail_url: primaryThumbnail,
        })
        .eq('product_id', productId)
        .eq('image_order', 0)
      if (upd && upd.error) dbUpdateError = upd.error
    } catch (e) {
      dbUpdateError = e
    }

    // 🔄 POST-VERIFICACIÓN: Si no hubo error, verificar y corregir si faltan keys
    if (!dbUpdateError && client.from) {
      try {
        const verifyResult = await client
          .from('product_images')
          .select('thumbnails, thumbnail_url')
          .eq('product_id', productId)
          .eq('image_order', 0)
          .single()
        if (verifyResult && verifyResult.data) {
          storedThumbnails = verifyResult.data.thumbnails
          storedPrimary = verifyResult.data.thumbnail_url
          const storedKeys = storedThumbnails
            ? Object.keys(storedThumbnails)
            : []
          const expectedKeys = Object.keys(thumbnailsPayload)
          const missing = expectedKeys.filter((k) => !storedKeys.includes(k))
          // 🔧 MERGE CORRECTIVO
          if (missing.length > 0) {
            const merged = { ...(storedThumbnails || {}), ...thumbnailsPayload }
            try {
              const { error: retryErr } = await client
                .from('product_images')
                .update({ thumbnails: merged, thumbnail_url: primaryThumbnail })
                .eq('product_id', productId)
                .eq('image_order', 0)
              trace.steps.push({
                step: 'db_retry',
                error: retryErr ? retryErr.message : null,
              })
              if (!retryErr) storedThumbnails = merged
            } catch (retryEx) {
              trace.steps.push({
                step: 'db_retry_exception',
                error: (retryEx && retryEx.message) || String(retryEx),
              })
            }
          }
        }
      } catch (_) {}
    }

    if (dbUpdateError && client.rpc) {
      try {
        const rpcDbRes = await client.rpc('mark_thumbnail_job_error', {
          p_product_id: productId,
          p_error: dbUpdateError.message || 'db_update_error',
        })
        trace.steps.push({ step: 'rpc_mark_error_db_update', error: rpcDbRes && rpcDbRes.error ? (rpcDbRes.error.message || String(rpcDbRes.error)) : null })
        // Consider error marked when RPC was attempted
        rpcMarkedAsError = true
      } catch (e) {
        trace.steps.push({ step: 'rpc_mark_error_db_update_exception', error: e.message || String(e) })
        rpcMarkedAsError = true
      }
    }

    // Decide final job status: success only if we have variants OR thumbnails in DB
    const hasSuccessfulVariants = successfulVariants.size > 0
    const hasThumbnailsInDB =
      storedThumbnails && Object.keys(storedThumbnails).length > 0

    // If we need to mark an error via RPC for missing variants, record it so we can return 200
    // (rpcMarkedAsError is declared above and set when RPC attempts are made)
    if (!dbUpdateError && client.rpc) {
      if (hasSuccessfulVariants || hasThumbnailsInDB) {
        try {
          await client.rpc('mark_thumbnail_job_success', {
            p_product_id: productId,
          })
        } catch (e) {
          trace.steps.push({ step: 'rpc_success_notify_exception', error: e.message || String(e) })
        }
      } else {
        try {
          // Attempt to mark job as error via RPC; record trace and consider the job marked if the RPC was attempted
          const rpcRes = await client.rpc('mark_thumbnail_job_error', {
            p_product_id: productId,
            p_error: 'all_variants_missing_after_verification',
          })
          trace.steps.push({ step: 'rpc_mark_error', error: (rpcRes && rpcRes.error) ? (rpcRes.error.message || String(rpcRes.error)) : null })
          // Consider the job marked as error if we reached this point (RPC attempted)
          rpcMarkedAsError = true
        } catch (e) {
          trace.steps.push({ step: 'rpc_mark_error_exception', error: e.message || String(e) })
          // Even if RPC throws, we attempted the fallback: treat as marked to return 200 and avoid failing the function
          rpcMarkedAsError = true
        }
      }
    }

    const shouldReturn200 = hasSuccessfulVariants || hasThumbnailsInDB || rpcMarkedAsError
    return {
      status: shouldReturn200 ? 200 : 500,
      body: {
        success: hasSuccessfulVariants || hasThumbnailsInDB,
        partial,
        failed: successfulVariants.size === 0,
        generatedVariants: Array.from(successfulVariants),
        failedVariants: variantStatuses
          .filter((v) => !v.ok)
          .map((v) => ({ variant: v.variant, error: v.error })),
        dbUpdateError: dbUpdateError
          ? dbUpdateError.message || dbUpdateError
          : null,
        thumbnails: thumbnailsPayload,
        thumbnailUrl: primaryThumbnail,
        storedThumbnailsKeys: storedThumbnails
          ? Object.keys(storedThumbnails)
          : null,
        storedPrimaryThumbnail: storedPrimary || null,
        trace: { durationMs: Date.now() - trace.startedAt, steps: trace.steps },
      },
    }
  } catch (err) {
    if (err && err.name === 'AbortError')
      return { status: 408, body: { error: 'Image fetch timeout' } }
    throw err
  }
}

module.exports = {
  detectImageType,
  createThumbnailFromOriginal,
  processGenerateThumbnail,
}
