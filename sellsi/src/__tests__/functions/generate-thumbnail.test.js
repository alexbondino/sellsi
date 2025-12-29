const ThumbMod = require('../../../../supabase/functions/generate-thumbnail/testable-handler.js')

// Helper: small fixtures for image signatures
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  .buffer
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).buffer
const WEBP = (() => {
  const a = new Uint8Array(12)
  a[0] = 0x52
  a[1] = 0x49
  a[2] = 0x46
  a[3] = 0x46
  a[8] = 0x57
  a[9] = 0x45
  a[10] = 0x42
  a[11] = 0x50
  return a.buffer
})()

// Deterministic dummy processor for tests
const dummyProcessor = async (buffer, w, h, variant, trace) =>
  new Uint8Array([1, 2, 3])

function makeDbClient({ mainImage } = {}) {
  return {
    from: (table) => ({
      select: (cols) => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: mainImage, error: null }),
          }),
        }),
        order: () => ({
          select: async () => ({
            data: mainImage ? [mainImage] : [],
            error: null,
          }),
        }),
      }),
      update: (payload) => ({ eq: async () => ({ data: null, error: null }) }),
      delete: () => ({ eq: async () => ({ data: null }) }),
    }),
    rpc: async () => ({ data: null, error: null }),
  }
}

describe('generate-thumbnail handler (unit)', () => {
  test('missing params -> 400', async () => {
    const res = await ThumbMod.processGenerateThumbnail(
      {},
      {
        env: { get: () => null },
        fetch: () => {},
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Missing required parameters/)
  })

  test('fetch non-ok -> 400', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, statusText: 'err' })
    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Failed to fetch image')
  })

  test('fetch timeout -> 408', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('aborted'), { name: 'AbortError' })
      )
    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(408)
    expect(res.body.error).toBe('Image fetch timeout')
  })

  test('empty buffer -> 400', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Empty image data')
  })

  test('gif -> 422 unsupported', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: async () => GIF })
    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('unsupported_image_type')
  })

  test('webp -> ignored 200', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: async () => WEBP })
    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(200)
    expect(res.body.ignored).toBe(true)
  })

  test('all variants fail -> NO_VARIANTS_GENERATED (422)', async () => {
    const main = { id: 'm1', thumbnails: null }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: async () => JPG })

    // Inject an imageProcessor that throws to simulate decode/generation errors (DI instead of spying)
    const throwingProcessor = async () => {
      throw new Error('decode fail')
    }

    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => db,
        imageProcessor: throwingProcessor,
      }
    )
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('NO_VARIANTS_GENERATED')
  })

  test('upload partial -> partial true and failedVariants present', async () => {
    const main = { id: 'm1', thumbnails: null }
    // Storage mock: desktop and tablet succeed, mobile fails with error
    const storage = {
      from: () => ({
        upload: async (path, data) => {
          if (path.includes('_mobile_'))
            return { data: null, error: { message: 'upload denied' } }
          return { data: { id: 'ok' }, error: null }
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://cdn.test/${path.split('/').pop()}` },
        }),
      }),
    }
    const client = {
      from: (table) => ({
        select: (cols) => ({
          eq: () => ({
            eq: () => ({ single: async () => ({ data: main, error: null }) }),
          }),
        }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null }) }),
      }),
      storage,
      rpc: async () => ({ data: null, error: null }),
    }
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') return { ok: true, status: 200 }
      return { ok: true, arrayBuffer: async () => JPG }
    })

    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => client,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(200)
    expect(res.body.partial).toBe(true)
    expect(Array.isArray(res.body.failedVariants)).toBe(true)
    expect(res.body.failedVariants.some((f) => f.variant === 'mobile')).toBe(
      true
    )
  })

  test('upload throws -> 500 and returns error', async () => {
    const main = { id: 'm1', thumbnails: null }
    const storage = {
      from: () => ({
        upload: async () => {
          throw new Error('storage exception')
        },
        getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }),
      }),
    }
    const client = {
      from: (table) => ({
        select: (cols) => ({
          eq: () => ({
            eq: () => ({ single: async () => ({ data: main, error: null }) }),
          }),
        }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null }) }),
      }),
      storage,
      rpc: async () => ({ data: null, error: null }),
    }
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') return { ok: true, status: 200 }
      return { ok: true, arrayBuffer: async () => JPG }
    })

    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => client,
        imageProcessor: dummyProcessor,
      }
    )
    // After stricter validation, all-throw uploads should yield a 500 with failed variants
    expect(res.status).toBe(500)
    expect(res.body.partial).toBe(true)
    expect(res.body.failed).toBe(true)
    expect(
      res.body.failedVariants.some((f) => /storage exception/.test(f.error))
    ).toBe(true)
  })

  test('all uploads fail -> mark job error and return 500', async () => {
    const main = { id: 'm1', thumbnails: null }
    const storage = {
      from: () => ({
        upload: async () => ({
          data: null,
          error: { message: 'upload denied' },
        }),
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://cdn.test/${path.split('/').pop()}` },
        }),
      }),
    }

    let rpcCalled = null
    const client = {
      from: (table) => ({
        select: (cols) => ({
          eq: () => ({
            eq: () => ({ single: async () => ({ data: main, error: null }) }),
          }),
        }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null }) }),
      }),
      storage,
      rpc: async (name, payload) => {
        rpcCalled = { name, payload }
        return { data: null, error: null }
      },
    }

    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') return { ok: true, status: 200 }
      return { ok: true, arrayBuffer: async () => JPG }
    })

    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => client,
        imageProcessor: dummyProcessor,
      }
    )

    expect(res.status).toBe(500)
    expect(res.body.success).toBeFalsy()
    expect(res.body.failed).toBe(true)
    expect(rpcCalled && rpcCalled.name === 'mark_thumbnail_job_error').toBe(
      true
    )
    expect(
      rpcCalled && rpcCalled.payload && rpcCalled.payload.p_product_id === 'p1'
    ).toBe(true)
  })

  test('db update error -> returns success with dbUpdateError and calls rpc', async () => {
    const main = { id: 'm1', thumbnails: null }
    let rpcCalled = false
    const storage = {
      from: () => ({
        upload: async () => ({ data: { id: 'ok' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }),
      }),
    }
    const client = {
      from: (table) => ({
        select: (cols) => ({
          eq: () => ({
            eq: () => ({ single: async () => ({ data: main, error: null }) }),
          }),
        }),
        update: async () => ({ data: null, error: { message: 'db fail' } }),
        delete: () => ({ eq: async () => ({ data: null }) }),
      }),
      storage,
      rpc: async () => {
        rpcCalled = true
        return { data: null, error: null }
      },
    }
    const env = {
      get: (k) =>
        k === 'SUPABASE_URL'
          ? 'https://x'
          : k === 'SUPABASE_ANON_KEY'
          ? 'anon'
          : null,
    }
    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') return { ok: true, status: 200 }
      return { ok: true, arrayBuffer: async () => JPG }
    })

    const res = await ThumbMod.processGenerateThumbnail(
      { imageUrl: 'https://img', productId: 'p1', supplierId: 's1' },
      {
        env,
        fetch: fetchFn,
        createClient: () => client,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(200)
    expect(res.body.dbUpdateError).toBeTruthy()
    expect(rpcCalled).toBe(true)
  })

  test('idempotent exit with signature mismatch + cooldown -> 200 (cooldown)', async () => {
    const main = {
      id: 'm1',
      thumbnails: {
        desktop: true,
        tablet: true,
        mobile: true,
        minithumb: true,
      },
      thumbnail_url: 'https://x/t.jpg',
      thumbnail_signature: 'old',
      updated_at: new Date().toISOString(),
    }
    const db = makeDbClient({ mainImage: main })
    const env = {
      get: (k) => {
        if (k === 'SUPABASE_URL') return 'https://x'
        if (k === 'SUPABASE_ANON_KEY') return 'anon'
        if (k === 'ENABLE_SIGNATURE_ENFORCE') return 'true'
        if (k === 'SIGNATURE_ENFORCE_COOLDOWN_MS') return `${100000}` // large cooldown
        return null
      },
    }
    const res = await ThumbMod.processGenerateThumbnail(
      {
        imageUrl: 'https://cdn.example/newname.jpg',
        productId: 'p1',
        supplierId: 's1',
        force: false,
      },
      {
        env,
        fetch: async () => {},
        createClient: () => db,
        imageProcessor: dummyProcessor,
      }
    )
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/idempotente/)
    expect(res.body.cooldownActive).toBe(true)
  })
})
