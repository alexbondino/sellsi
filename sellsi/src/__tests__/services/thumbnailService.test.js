import ThumbnailService from '@/services/media/thumbnailService'

describe('ThumbnailService', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = OLD_ENV
    jest.resetAllMocks()
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

  test('deleteThumbnail lists and removes files from supabase storage', async () => {
    // Mock supabase client used inside the service
    const mockList = [{ name: 's1/p2/thumbnail.jpg' }]
    const mockRemove = { error: null }
    jest.doMock('@/services/supabase.js', () => ({
      supabase: {
        storage: {
          from: () => ({
            list: async () => ({ data: mockList, error: null }),
            remove: async (paths) => ({ error: null }),
          }),
        },
      },
    }))

    // Re-import service with mocked supabase
    const svc = (await import('@/services/media/thumbnailService')).default

    const res = await svc.deleteThumbnail('p2', 's1')
    expect(res.success).toBe(true)
  })
})
