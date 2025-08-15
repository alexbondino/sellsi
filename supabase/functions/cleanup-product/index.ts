// cleanup-product Edge Function
// Purpose: Post-deletion storage cleanup (defensive) and soft-delete image purge
// Action types:
//  - deleted: product removed physically -> ensure no leftover images
//  - soft_deleted: product archived -> ensure only tiny thumbnail (if any) persists in product record

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { withMetrics } from '../_shared/metrics.ts'

const allowedOrigins = [
  'https://sellsi.cl',
  'https://staging-sellsi.vercel.app',
  // Development origins (multi-port)
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004'
]

function buildCors(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}

serve((req: Request) => withMetrics('cleanup-product', req, async () => {
  const origin = req.headers.get('origin')
  const cors = buildCors(origin)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { productId, action, supplierId } = await req.json()
    if (!productId || !action) {
      return new Response(JSON.stringify({ error: 'productId y action requeridos' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Variables de entorno faltantes' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Simple minimal client (fetch-based) for storage listing/removal
    const storageBase = `${supabaseUrl}/storage/v1`;

    const IMAGE_BUCKET = 'product-images'
    const THUMB_BUCKET = 'product-images-thumbnails'
    const DOC_BUCKET   = 'product-documents'

    if (!supplierId) {
      // We still succeed (deletion already done) but report that deep cleanup skipped
      return new Response(JSON.stringify({ success: true, action, skipped: true, reason: 'supplierId faltante para limpieza profunda' }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // Helper: list objects for a given prefix (non recursive – our layout is supplier/product/* )
    async function list(bucket: string, prefix: string): Promise<string[]> {
      const payload = { prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }
      const res = await fetch(`${storageBase}/object/list/${bucket}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        console.warn('[cleanup-product] list error', bucket, prefix, await res.text())
        return []
      }
      const data = await res.json() as Array<{ name: string; id?: string }>
      // If the API returns folders, we only expect files within supplierId/productId/ so build full path
      return data
        .filter(obj => obj && obj.name && !obj.name.endsWith('/'))
        .map(obj => `${supplierId}/${productId}/${obj.name}`)
    }

    // Helper: remove list of paths in a bucket
    async function remove(bucket: string, paths: string[]): Promise<number> {
      if (paths.length === 0) return 0
      const res = await fetch(`${storageBase}/object/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ bucket, paths })
      })
      if (!res.ok) {
        console.warn('[cleanup-product] remove error', bucket, await res.text())
        return 0
      }
      return paths.length
    }

    // Build prefixes we will attempt (both with and without trailing slash because of edge cases)
    const basePrefix = `${supplierId}/${productId}`
    const prefixes = [basePrefix, `${basePrefix}/`]

    // Collect paths per bucket
    const imgPaths: string[] = []
    const thumbPaths: string[] = []
    const docPaths: string[] = []

    for (const p of prefixes) {
      const listedImg = await list(IMAGE_BUCKET, p)
      for (const path of listedImg) if (!imgPaths.includes(path)) imgPaths.push(path)
      const listedThumb = await list(THUMB_BUCKET, p)
      for (const path of listedThumb) if (!thumbPaths.includes(path)) thumbPaths.push(path)
      if (action === 'deleted') { // documents only on full delete
        const listedDocs = await list(DOC_BUCKET, p)
        for (const path of listedDocs) if (!docPaths.includes(path)) docPaths.push(path)
      }
    }

    // Execute removals (soft_deleted also purges all images; tiny already stored inline in products table)
    const removedImages = await remove(IMAGE_BUCKET, imgPaths)
    const removedThumbs = await remove(THUMB_BUCKET, thumbPaths)
    const removedDocs   = action === 'deleted' ? await remove(DOC_BUCKET, docPaths) : 0

    return new Response(JSON.stringify({
      success: true,
      action,
      removed: {
        images: removedImages,
        thumbnails: removedThumbs,
        documents: removedDocs
      }
    }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })

  } catch (e) {
    console.error('[cleanup-product] error', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
}))
