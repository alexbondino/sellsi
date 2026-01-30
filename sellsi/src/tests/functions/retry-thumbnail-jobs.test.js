const {
  processRetryThumbnailJobs,
} = require('../../../../supabase/functions/retry-thumbnail-jobs/testable-handler')

function makeSupabase({ jobs = [], mainImage = null } = {}) {
  const calls = { rpcs: [], starts: [] }
  return {
    calls,
    from: (table) => ({
      select: (cols) => {
        // Chainable helper that supports both `.eq().eq().single()` (product_images)
        // and `.eq().lt().order().limit()` (image_thumbnail_jobs)
        const chain = {
          single: async () => ({ data: mainImage, error: null }),
          eq: (a, b) => chain,
          lt: (a, b) => chain,
          order: (a, b) => chain,
          limit: async () => ({ data: jobs, error: null }),
        }
        return chain
      },
      // not used in this shim
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
    rpc: async (name, payload) => {
      calls.rpcs.push({ name, payload })
      // simulate mark success/error/start behavior
      if (name === 'start_thumbnail_job') calls.starts.push(payload)
      return { data: null, error: null }
    },
  }
}

describe('retry-thumbnail-jobs (unit)', () => {
  test('metadata + HEAD ok -> mark success', async () => {
    const jobs = [{ product_id: 'p1' }]
    const mainImage = {
      id: 'm1',
      thumbnails: { desktop: true },
      thumbnail_url: 'https://cdn.test/p1.jpg',
      image_url: 'https://cdn.test/orig.jpg',
    }
    const supabase = makeSupabase({ jobs, mainImage })

    const fetchFn = jest.fn(async (url, opts) => {
      // HEAD to thumbnail_url
      if (opts && opts.method === 'HEAD') return { ok: true, status: 200 }
      return { ok: false }
    })

    const res = await processRetryThumbnailJobs({ supabase, fetch: fetchFn })
    expect(res.processed).toBe(1)
    expect(res.success).toBe(1)
    expect(
      supabase.calls.rpcs.some(
        (r) =>
          r.name === 'mark_thumbnail_job_success' ||
          r.payload?.p_product_id === 'p1'
      )
    ).toBe(true)
  })

  test('metadata + HEAD fail -> regenerate via generate-thumbnail', async () => {
    const jobs = [{ product_id: 'p2' }]
    const mainImage = {
      id: 'm2',
      thumbnails: { desktop: true },
      thumbnail_url: 'https://cdn.test/p2.jpg',
      image_url: 'https://cdn.test/orig2.jpg',
    }
    const supabase = makeSupabase({ jobs, mainImage })

    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') return { ok: false, status: 404 }
      // generate call
      if (url.includes('generate-thumbnail'))
        return { ok: true, json: async () => ({ success: true }) }
      return { ok: false }
    })

    const res = await processRetryThumbnailJobs({
      supabase,
      fetch: fetchFn,
      generateUrl: 'https://supabase/functions/v1/generate-thumbnail',
    })
    expect(res.processed).toBe(1)
    expect(res.retried).toBe(1)
    expect(res.success).toBe(1)
    // start_thumbnail_job should have been called (payload contains product image id)
    expect(
      supabase.calls.rpcs.some(
        (r) => r.payload && r.payload.p_product_id === 'p2'
      )
    ).toBe(true)
  })

  test('HEAD abort -> regenerate (AbortError)', async () => {
    const jobs = [{ product_id: 'p3' }]
    const mainImage = {
      id: 'm3',
      thumbnails: { desktop: true },
      thumbnail_url: 'https://cdn.test/p3.jpg',
      image_url: 'https://cdn.test/orig3.jpg',
    }
    const supabase = makeSupabase({ jobs, mainImage })

    const fetchFn = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') {
        const err = new Error('aborted')
        err.name = 'AbortError'
        throw err
      }
      if (url.includes('generate-thumbnail'))
        return { ok: true, json: async () => ({ success: true }) }
      return { ok: false }
    })

    const res = await processRetryThumbnailJobs({ supabase, fetch: fetchFn })
    expect(res.processed).toBe(1)
    expect(res.retried).toBe(1)
    expect(res.success).toBe(1)
  })
})
