/*
  E2E integration test for Supabase + Edge Function (generate-thumbnail)
  - Designed to run against a local Supabase instance started with `supabase start`
  - Requires SERVICE role key for invoking functions and admin operations
  - Place credentials in environment prior to running tests

  Notes:
  - This test is intentionally conservative and performs cleanup at the end.
  - It uploads a 1x1 PNG fixture, calls the RPC replace_product_images, invokes the Edge Function
    (served locally with `supabase functions serve generate-thumbnail`), verifies thumbnail is generated
    (HEAD request), and validates DB row fields.
*/

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
let fetchImpl
try {
  fetchImpl = require('node-fetch')
} catch (e) {
  // Node 18+ has global fetch; prefer it if available
  fetchImpl = global.fetch
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE
const SUPABASE_ANON = process.env.SUPABASE_ANON

if (!SUPABASE_URL || (!SUPABASE_SERVICE && !SUPABASE_ANON)) {
  // Tests will skip if env not configured
  console.warn('Supabase E2E: SUPABASE_URL and SUPABASE_SERVICE/SUPABASE_ANON must be set in env to run E2E tests.')
}

// Use RFC4122 UUIDs for product/supplier IDs because the RPC expects uuid types
const { randomUUID } = require('crypto')
const supplierId = randomUUID()
const productId = randomUUID()

// Load fixture base64 and decode into buffer. Prefer JPEG fixture if available.
let fixtureBuffer
try {
  const jpgPath = path.join(__dirname, 'fixtures', '1x1.jpg.base64')
  if (fs.existsSync(jpgPath)) {
    const b64 = fs.readFileSync(jpgPath, 'utf8').trim()
    fixtureBuffer = Buffer.from(b64, 'base64')
  } else {
    const pngPath = path.join(__dirname, 'fixtures', '1x1.png.base64')
    const b64 = fs.readFileSync(pngPath, 'utf8').trim()
    fixtureBuffer = Buffer.from(b64, 'base64')
  }
} catch (e) {
  throw new Error('Failed to load E2E fixture: ' + e.message)
}

jest.setTimeout(120000) // 2 minutes for retries

describe('Supabase E2E - thumbnail flow (local)', () => {
  let supabase
  const uploadedPaths = []

  beforeAll(() => {
    const key = SUPABASE_SERVICE || SUPABASE_ANON
    if (!SUPABASE_URL || !key) return
    supabase = createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
  })

  afterAll(async () => {
    if (!supabase) return
    // cleanup storage files
    try {
      for (const p of uploadedPaths) {
        await supabase.storage.from('product-images').remove([p])
      }
    } catch (e) {
      console.warn('E2E cleanup storage error', e.message)
    }
    // cleanup DB rows
    try {
      await supabase.from('product_images').delete().eq('product_id', productId)
      // delete the product we created for the test (use productid PK)
      await supabase.from('products').delete().eq('productid', productId)
    } catch (e) {
      console.warn('E2E cleanup DB error', e.message)
    }
  })

  test('upload -> rpc replace -> invoke function -> thumbnail available -> DB updated', async () => {
    if (!supabase) return console.warn('Skipping E2E: supabase client not configured')

    // quick check: ensure 'products' table exists in this database; if not, skip with helpful message
    try {
      // schema uses 'productid' as the PK column
      const probe = await supabase.from('products').select('productid').limit(1)
      if (probe.error) {
        // PostgREST returns PGRST204 when the table is missing from the schema cache
        if (probe.error.code === 'PGRST204') {
          console.warn("Supabase E2E: 'products' table not found in DB schema. Skipping E2E. Run migrations or use a test DB that has the app schema.")
          return
        }
      }
    } catch (e) {
      // if we cannot probe, skip to avoid destructive failures
      console.warn('Supabase E2E: error checking for products table, skipping E2E tests.', e.message || e)
      return
    }

  // 1) Upload an image
  const isJpeg = fixtureBuffer[0] === 0xFF && fixtureBuffer[1] === 0xD8
  const ext = isJpeg ? 'jpg' : 'png'
  const filePath = `${supplierId}/${productId}/fixture-a.${ext}`
  // include contentType to ensure correct handling
  const contentType = isJpeg ? 'image/jpeg' : 'image/png'
  const uploadRes = await supabase.storage.from('product-images').upload(filePath, fixtureBuffer, { cacheControl: '3600', upsert: true, contentType })
    expect(uploadRes.error).toBeNull()
    uploadedPaths.push(filePath)

    // 2) Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath)
    expect(urlData).toBeTruthy()
    const publicUrl = urlData.publicUrl
    expect(typeof publicUrl).toBe('string')

    // Diagnostic: fetch the public URL and inspect first bytes & content-type to ensure uploaded object is valid
    try {
      const probeResp = await (fetchImpl || fetch)(publicUrl)
      console.log('Public URL probe status', probeResp.status, probeResp.statusText)
      const probeArr = await probeResp.arrayBuffer()
      const probeBytes = new Uint8Array(probeArr)
      const contentTypeHeader = probeResp.headers && probeResp.headers.get ? probeResp.headers.get('content-type') : 'n/a'
      console.log('Public URL content-type', contentTypeHeader)
      console.log('Public URL first bytes', Array.from(probeBytes.slice(0, 16)))
      const isPng = probeBytes[0] === 0x89 && probeBytes[1] === 0x50 && probeBytes[2] === 0x4E && probeBytes[3] === 0x47
      const isJpgBytes = probeBytes[0] === 0xFF && probeBytes[1] === 0xD8
      if (!isPng && !isJpgBytes) {
        console.error('Diagnostic: uploaded object is not a PNG/JPEG or is corrupted')
        throw new Error('Uploaded object at publicUrl is not a valid PNG/JPEG')
      }
    } catch (probeErr) {
      console.error('Diagnostic fetch of publicUrl failed', probeErr && probeErr.message)
      throw probeErr
    }

    // Diagnostic: server-side download to confirm stored object bytes (avoid CDN/public URL variability)
    try {
      const { data: downloaded, error: dlErr } = await supabase.storage.from('product-images').download(filePath)
      if (dlErr) {
        console.error('Diagnostic download failed', dlErr.message)
        throw dlErr
      }
      const arr = await downloaded.arrayBuffer()
      const bytes = new Uint8Array(arr)
      // Use console.error so test runner shows the output even if console.log is muted by setup
      console.error('Diagnostic server-side first bytes', Array.from(bytes.slice(0, 16)))
        const isPngServer = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
        const isJpgServer = bytes[0] === 0xFF && bytes[1] === 0xD8
        if (!isPngServer && !isJpgServer) {
          console.error('Diagnostic: server-side downloaded object is not a PNG/JPEG or is corrupted')
          throw new Error('Server-side downloaded object is not a valid PNG/JPEG')
      }
    } catch (dle) {
      console.error('Diagnostic server-side download failed', dle && dle.message)
      throw dle
    }

    // 3) Ensure a product row exists (schema uses productid PK and productnm as name)
    // Use null supplier_id to avoid FK requirements on users table in test environments
    const insertProd = await supabase.from('products').insert([{ productid: productId, supplier_id: null, productnm: 'itest-product' }])
    if (insertProd.error) {
      // If the products table/schema isn't present in this DB, PostgREST returns PGRST204.
      if (insertProd.error.code === 'PGRST204') {
        console.warn("Supabase E2E: 'products' table/schema not found (PGRST204). Skipping E2E test.")
        return
      }
    }
    expect(insertProd.error).toBeNull()

    // 4) Call RPC to replace images for product
    const rpcName = 'replace_product_images'
    const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, { p_product_id: productId, p_supplier_id: null, p_image_urls: [publicUrl] })
    expect(rpcError).toBeNull()
    expect(Array.isArray(rpcData)).toBe(true)

    // 5) Create a short-lived signed URL so the Edge Function can fetch the object even if the bucket is private
    const { data: signedData, error: signedErr } = await supabase.storage.from('product-images').createSignedUrl(filePath, 60)
    expect(signedErr).toBeNull()
    expect(signedData).toBeTruthy()
    const signedUrl = signedData.signedUrl

    // Diagnostic: fetch the signedUrl so we know what the function will retrieve
    try {
      const signedProbe = await (fetchImpl || fetch)(signedUrl)
      console.log('Signed URL probe status', signedProbe.status, signedProbe.statusText)
      const signedArr = await signedProbe.arrayBuffer()
      const signedBytes = new Uint8Array(signedArr)
      console.log('Signed URL content-type', signedProbe.headers && signedProbe.headers.get ? signedProbe.headers.get('content-type') : 'n/a')
      console.log('Signed URL first bytes', Array.from(signedBytes.slice(0, 16)))
    } catch (spErr) {
      console.error('Signed URL probe failed', spErr && spErr.message)
    }

    // Invoke Edge Function (local serve) to generate thumbnail explicitly (some flows auto-trigger; this forces it)
    const funcUrl = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/generate-thumbnail`
    let invokeResp = null
    // Retry a few times for transient failures and gather body each attempt
    for (let attempt = 1; attempt <= 3; attempt++) {
      invokeResp = await (fetchImpl || fetch)(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE || SUPABASE_ANON}`,
        },
        // Edge function requires a non-null supplierId in the payload
        // Pass a signedUrl to ensure the function can fetch the object regardless of bucket public setting
        body: JSON.stringify({ imageUrl: signedUrl, productId, supplierId, force: true }),
      })
      if (invokeResp && invokeResp.ok) break
      // capture body for debugging
      let bodyText = '<no body>'
      try { bodyText = await invokeResp.text() } catch (e) { bodyText = `<error reading body: ${e.message}>` }
      console.error(`Edge function invocation attempt #${attempt} failed`, { status: invokeResp.status, statusText: invokeResp.statusText, body: bodyText })
      // small backoff
      await new Promise(r => setTimeout(r, 500 * attempt))
    }
    expect(invokeResp).toBeTruthy()
    if (!invokeResp.ok) {
      // capture body for debugging
      let bodyText
      try { bodyText = await invokeResp.text() } catch (e) { bodyText = `<error reading body: ${e.message}>` }
      console.error('Edge function invocation failed', { status: invokeResp.status, statusText: invokeResp.statusText, body: bodyText })
    }
    expect(invokeResp.ok).toBe(true)
    const invokeJson = await invokeResp.json()
    expect(invokeJson.thumbnailUrl).toBeTruthy()
    const thumbnailUrl = invokeJson.thumbnailUrl

    // 6) Wait for thumbnail to be available via HEAD check with retry
    const maxWait = 30000
    const start = Date.now()
    let thumbOk = false
    while (Date.now() - start < maxWait) {
      try {
        const r = await (fetchImpl || fetch)(thumbnailUrl, { method: 'HEAD' })
        if (r && (r.status === 200 || r.status === 302 || r.status === 301)) { thumbOk = true; break }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500))
    }
    expect(thumbOk).toBe(true)

    // 7) Verify DB row contains thumbnail_url and thumbnails
    const { data: recheckRows, error: reErr } = await supabase.from('product_images').select('id,image_url,thumbnail_url,thumbnails,thumbnail_signature').eq('product_id', productId)
    expect(reErr).toBeNull()
    expect(Array.isArray(recheckRows)).toBe(true)
    expect(recheckRows.length).toBeGreaterThanOrEqual(1)
    const row = recheckRows[0]
    expect(row.thumbnail_url).toBeTruthy()
    expect(row.thumbnails).toBeTruthy()
    expect(row.thumbnail_signature).toBeTruthy()
  })
})
