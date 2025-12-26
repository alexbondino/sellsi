const ThumbMod = require('../../../../supabase/functions/generate-thumbnail/testable-handler.js')

// Helpers
const JPG = new Uint8Array([0xFF,0xD8,0xFF,0xE0]).buffer

function makeMainImage() {
  return { id: 'm1', thumbnails: null }
}

// Deterministic dummy processor to make tests fully deterministic (returns small JPEG-like bytes)
const dummyProcessor = async (buffer, w, h, variant, trace) => new Uint8Array([1,2,3])

describe('generate-thumbnail integration (robustness)', () => {
  test('reupload flow: HEAD fails first, reupload attempted and succeeds', async () => {
    const main = makeMainImage()

    // Storage simulation with eventual consistency: first upload does NOT make file HEAD-ok; reupload (second upload) does
    const available = new Set()
    const uploadCalls = []
    const storage = {
      from: () => ({
        upload: async (path, data) => {
          uploadCalls.push(path)
          const calls = uploadCalls.filter(p => p === path).length
          // only mark available after second upload attempt
          if (calls > 1) available.add(path)
          return { data: { id: 'ok' }, error: null }
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path.split('/').pop()}` } })
      })
    }

    // fetch mock: HEAD checks use available set
    const fetchFn = jest.fn(async (url, opts = {}) => {
      if (opts && opts.method === 'HEAD') {
        const name = url.split('/').pop()
        const match = Array.from(available).some(p => p.endsWith(name))
        return { status: match ? 200 : 404 }
      }
      // For image fetch (not used in this test because we're using JPG fixture), but return ok for safety
      return { ok: true, arrayBuffer: async () => JPG }
    })

    // Client mock
    const client = {
      from: (table) => ({
        select: (cols) => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: main, error: null }) }) }) }),
        update: async () => ({ data: null, error: null }),
        delete: () => ({ eq: async () => ({ data: null }) })
      }),
      storage,
      rpc: async () => ({ data: null, error: null })
    }

    const env = { get: (k) => (k === 'SUPABASE_URL' ? 'https://x' : k === 'SUPABASE_ANON_KEY' ? 'anon' : null) }

    const res = await ThumbMod.processGenerateThumbnail({ imageUrl: 'https://img/123_image.jpg', productId: 'p1', supplierId: 's1' }, { env, fetch: fetchFn, createClient: () => client, imageProcessor: dummyProcessor })

    expect(res.status).toBe(200)
    // verify trace includes reupload_attempt step
    const reupload = (res.body.trace.steps || []).some(s => s.step === 'reupload_attempt')
    expect(reupload).toBe(true)
    // ensure that we called upload at least twice for some variant
    const duplicates = uploadCalls.some((p, i, arr) => arr.indexOf(p) !== i)
    expect(duplicates).toBe(true)
  })

  test('db merge flow: post-update verify missing keys and merge retry occurs', async () => {
    const main = makeMainImage()
    const uploadedUrls = {}

    const storage = {
      from: () => ({
        upload: async (path, data) => ({ data: { id: 'ok' }, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path.split('/').pop()}` } })
      })
    }

    // DB client that returns a verifyRow missing some keys, and records retry update
    let initialUpdateCalled = false
    let retryUpdateCalled = false

    const client = {
      from: (table) => {
        return {
          select: (cols) => ({
            eq: () => ({ eq: () => ({ single: async () => ({ data: main, error: null }) }) })
          }),
          update: (payload) => ({ eq: (col, val) => ({ eq: async (col2, val2) => {
            if (!initialUpdateCalled) { initialUpdateCalled = true; return { data: null, error: null } }
            retryUpdateCalled = true
            return { data: null, error: null }
          } }) }),
          delete: () => ({ eq: async () => ({ data: null }) })
        }
      },
      storage,
      rpc: async () => ({ data: null, error: null })
    }

    // We need verify select to return missing keys — to emulate that, we will override the client.from().select() used in post-verify by using a small wrapper
    // For simplicity, we patch client.from to return a special object when select includes thumbnails in the verify flow
    const origFrom = client.from
    client.from = (table) => {
      const obj = origFrom(table)
      const realSelect = obj.select
      obj.select = (cols) => {
        if (typeof cols === 'string' && cols.includes('thumbnails, thumbnail_url')) {
          return {
            eq: () => ({ eq: () => ({ single: async () => ({ data: { thumbnails: { desktop: 'https://cdn.test/existing.jpg' }, thumbnail_url: 'https://cdn.test/existing.jpg' }, error: null }) }) })
          }
        }
        return realSelect(cols)
      }
      return obj
    }

    const env = { get: (k) => (k === 'SUPABASE_URL' ? 'https://x' : k === 'SUPABASE_ANON_KEY' ? 'anon' : null) }
    const fetchFn = jest.fn(async (url, opts = {}) => {
      if (opts && opts.method === 'HEAD') return { status: 200 }
      return { ok: true, arrayBuffer: async () => JPG }
    })

    const res = await ThumbMod.processGenerateThumbnail({ imageUrl: 'https://img/123_image.jpg', productId: 'p1', supplierId: 's1' }, { env, fetch: fetchFn, createClient: () => client, imageProcessor: dummyProcessor })

    console.log('DBG RES BODY', JSON.stringify(res.body, null, 2))
    console.log('TRACE STEPS RAW:', res.body && res.body.trace && res.body.trace.steps)
    expect(res.status).toBe(200)
    // thumbnails payload should exist
    const thumbnailsKeys = Object.keys(res.body.thumbnails || {})
    if (thumbnailsKeys.length === 0) {
      throw new Error('No thumbnails generated; response body: ' + JSON.stringify(res.body))
    }
    // db retry should have been called
    // Ensure the retry update callback was called in the DB client
    expect(retryUpdateCalled).toBe(true)
    // storedThumbnailsKeys should include keys from the merged payload
    expect(Array.isArray(res.body.storedThumbnailsKeys)).toBe(true)
  })

  test('upload hard errors triggers fallback RPC mark_thumbnail_job_error', async () => {
    const main = makeMainImage()
    let rpcCalled = false
    const storage = {
      from: () => ({
        upload: async (path, data) => ({ data: null, error: { message: 'upload denied' } }),
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path.split('/').pop()}` } })
      })
    }

    const client = {
      from: (table) => ({ select: (cols) => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: main, error: null }) }) }) }), update: async () => ({ data: null, error: null }), delete: () => ({ eq: async () => ({ data: null }) }) }),
      storage,
      rpc: async (name, payload) => { if (name === 'mark_thumbnail_job_error') rpcCalled = true; return { data: null, error: null } }
    }

    const env = { get: (k) => (k === 'SUPABASE_URL' ? 'https://x' : k === 'SUPABASE_ANON_KEY' ? 'anon' : null) }
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => JPG })

    const res = await ThumbMod.processGenerateThumbnail({ imageUrl: 'https://img/123_image.jpg', productId: 'p1', supplierId: 's1' }, { env, fetch: fetchFn, createClient: () => client, imageProcessor: dummyProcessor })

    expect(res.status).toBe(200)
    expect(rpcCalled).toBe(true)
    // ensure the response indicates partial or failed variants
    expect(res.body.partial).toBe(true)
  })
})
