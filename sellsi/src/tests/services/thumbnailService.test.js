// Refactored tests: use a single top-level mock and deterministic per-test responses
const mockList = jest.fn()
const mockRemove = jest.fn()
const mockGetPublicUrl = jest.fn()

// Top-level mock for supabase: provides storage and a basic DB .from(...) stub
jest.mock('@/services/supabase.js', () => ({
  supabase: {
    from: jest.fn(() => ({ select: jest.fn().mockResolvedValue({ data: null, error: null }), update: jest.fn().mockResolvedValue({ error: null }) })),
    storage: {
      from: jest.fn(() => ({ list: mockList, remove: mockRemove, getPublicUrl: mockGetPublicUrl })),
    },
  },
}))

import ThumbnailService from '@/services/media/thumbnailService'

describe('ThumbnailService', () => {
  const OLD_ENV = process.env

  beforeAll(() => jest.resetModules())

  beforeEach(() => {
    // Keep modules isolated from other test files by resetting modules before the suite
    process.env = { ...OLD_ENV }
    global.fetch = jest.fn()

    // Reset mocks and call history to avoid cross-test contamination
    jest.clearAllMocks()
    mockList.mockReset()
    mockRemove.mockReset()
    mockGetPublicUrl.mockReset()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('generateThumbnail returns success when edge function responds with thumbnailUrl', async () => {
    const thumbnailUrl = 'https://cdn.test/thumbnail.jpg'
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ thumbnailUrl }) })

    const res = await ThumbnailService.generateThumbnail('https://img.test/orig.jpg', 'p1', 's1')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ success: true, thumbnailUrl })
  })

  test('generateThumbnail returns error when edge function responds non-ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'server error' })

    const res = await ThumbnailService.generateThumbnail('https://img.test/orig.jpg', 'p2', 's2')

    expect(res.success).toBe(false)
    expect(res.error).toEqual(expect.stringContaining('Edge Function error'))
  })

  test('generateThumbnail calls edge function with correct URL, headers and body', async () => {
    // Isolate modules so EDGE_FUNCTION_URL is built from env variables we set here
    jest.resetModules()
    const OLD_ENV = process.env
    process.env = { ...OLD_ENV, VITE_SUPABASE_URL: 'https://supabase.test', VITE_SUPABASE_ANON_KEY: 'anon-xyz' }

    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ thumbnailUrl: 'https://cdn.test/thumb.jpg' }) })

    const { default: ThumbnailServiceLocal } = await import('@/services/media/thumbnailService')

    const res = await ThumbnailServiceLocal.generateThumbnail('https://img.test/orig.jpg', 'pX', 'sX')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('https://supabase.test/functions/v1/generate-thumbnail')
    expect(opts.method).toBe('POST')
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json', Authorization: 'Bearer anon-xyz' })
    expect(JSON.parse(opts.body)).toEqual({ imageUrl: 'https://img.test/orig.jpg', productId: 'pX', supplierId: 'sX' })

    // restore env
    process.env = OLD_ENV
  })

  test('generateThumbnail handles fetch rejection gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network'))

    const res = await ThumbnailService.generateThumbnail('https://img.test/orig.jpg', 'p3', 's3')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/network/)
  })

  test('deleteThumbnail lists and removes files from supabase storage', async () => {
    mockList.mockResolvedValueOnce({ data: [{ name: 'thumbnail.jpg' }], error: null })
    mockRemove.mockResolvedValueOnce({ error: null })

    const supa = (await import('@/services/supabase.js')).supabase
    supa.storage = { from: () => ({ list: mockList, remove: mockRemove, getPublicUrl: mockGetPublicUrl }) }

    jest.resetModules()
    const { default: ThumbnailServiceLocal } = await import('@/services/media/thumbnailService')
    const res = await ThumbnailServiceLocal.deleteThumbnail('p2', 's1')

    expect(res.success).toBe(true)
    expect(mockList).toHaveBeenCalledTimes(1)
    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toHaveBeenCalledWith(['s1/p2/thumbnail.jpg'])
  })

  test('deleteThumbnail returns success when list empty and does not call remove', async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null })
    mockRemove.mockResolvedValueOnce({ error: null })

    const supa = (await import('@/services/supabase.js')).supabase
    supa.storage = { from: () => ({ list: mockList, remove: mockRemove, getPublicUrl: mockGetPublicUrl }) }

    const { default: ThumbnailServiceLocal } = await import('@/services/media/thumbnailService')
    const res = await ThumbnailServiceLocal.deleteThumbnail('p-empty', 's-empty')
    expect(res.success).toBe(true)
    expect(mockList).toHaveBeenCalledTimes(1)
    expect(mockRemove).not.toHaveBeenCalled()
  })

  test('deleteThumbnail returns error when remove fails', async () => {
    mockList.mockResolvedValueOnce({ data: [{ name: 'thumbnail.jpg' }], error: null })
    mockRemove.mockImplementation(async (paths) => {
      if (paths && paths.includes('s1/p2/thumbnail.jpg')) return { error: { message: 'denied' } }
      return { error: null }
    })

    const supa = (await import('@/services/supabase.js')).supabase
    supa.storage = { from: () => ({ list: mockList, remove: mockRemove, getPublicUrl: mockGetPublicUrl }) }

    // debug
    // eslint-disable-next-line no-console
    console.log('mockRemove before call', mockRemove.mock.calls, mockRemove.mock.results)

    jest.resetModules()
    const { default: ThumbnailServiceLocal } = await import('@/services/media/thumbnailService')
    const res = await ThumbnailServiceLocal.deleteThumbnail('p2', 's1')

    // verify remove was invoked and returned the expected error payload
    expect(mockRemove).toHaveBeenCalledTimes(1)
    const removeResult = await mockRemove.mock.results[0].value
    expect(removeResult).toEqual({ error: { message: 'denied' } })

    expect(res.success).toBe(false)
    expect(res.error).toMatch(/denied/)
  })




  describe('getThumbnailUrl fallback', () => {
    test('falls back to public URL when DB and cache do not provide a url', async () => {
      mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://cdn.test/s1/p2/thumbnail.jpg' } })

      const url = await ThumbnailService.getThumbnailUrl('p2', 's1')
      expect(url).toBe('https://cdn.test/s1/p2/thumbnail.jpg')
    })
  })
})
