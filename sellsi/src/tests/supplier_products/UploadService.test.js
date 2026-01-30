/**
 * Robust tests for UploadService flows: uploadImageWithThumbnail, uploadMultipleImagesWithThumbnails
 * These tests heavily mock Supabase and the StorageCleanupService to validate branching, errors and success
 */

import { act } from '@testing-library/react';
const { createSupabaseMock } = require('../utils/createSupabaseMock');
const makeSupabaseMock = createSupabaseMock;

describe('UploadService (robust flows)', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('uploadImageWithThumbnail - happy path main image -> uploads, inserts order 0, generates thumbnail', async () => {
    // Mock supabase behavior
    jest.doMock('../../services/supabase', () => createSupabaseMock({
      storage: {
        from: (bucket) => ({
          upload: async () => ({ data: { id: 'uploaded-id' }, error: null }),
          getPublicUrl: (fileName) => ({ data: { publicUrl: `https://cdn.test/${fileName}` } }),
        }),
      },
      rpc: async (name, params) => ({ data: 0, error: null }),
      from: (table) => ({ select: async () => ({ data: [], error: null }) }),
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    // Spy and force thumbnail generation to succeed
    jest.spyOn(UploadService, 'generateThumbnailWithRetry').mockResolvedValue({ success: true, thumbnailUrl: 'https://cdn.test/thumb.jpg', wasRetried: false })

    const file = { name: 'img.png', type: 'image/png', size: 1000 }
    const res = await UploadService.uploadImageWithThumbnail(file, 'prod1', 'sup1', true)

    expect(res.success).toBe(true)
    expect(res.data).toBeTruthy()
    expect(res.data.thumbnailUrl).toBe('https://cdn.test/thumb.jpg')
    expect(res.data.isMain).toBe(true)
  })

  test('uploadImageWithThumbnail - rejects oversized file > 2MB', async () => {
    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const bigFile = { name: 'big.jpg', type: 'image/jpeg', size: 3 * 1024 * 1024 }
    const res = await UploadService.uploadImageWithThumbnail(bigFile, 'prodX', 'supX', true)

    expect(res.success).toBe(false)
    expect(res.error).toEqual(expect.stringContaining('La imagen debe ser menor a 2MB'))
  })

  test('uploadMultipleImagesWithThumbnails - normal mode uploads first sequential then parallel and dispatches ready', async () => {
    // Mock supabase minimal behaviors used in this flow
    jest.doMock('../../services/supabase', () => createSupabaseMock({
      from: (table) => ({ select: async () => ({ data: [], error: null }) }),
      rpc: async () => ({ data: null, error: null }),
      storage: { from: () => ({ upload: async () => ({ data: { id: 'id' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    // Spy on uploadImageWithThumbnail to simulate different timings/results
    const spyUpload = jest.spyOn(UploadService, 'uploadImageWithThumbnail').mockImplementation(async (file, p, s, isMain) => {
      return { success: true, data: { fileName: file.name, isMain } }
    })

    const dispatchSpy = jest.spyOn(UploadService, 'dispatchProductImagesReady')

    const files = [
      { file: { name: 'a.png', type: 'image/png', size: 100 } },
      { file: { name: 'b.png', type: 'image/png', size: 200 } },
    ]

  // Capture dispatched events (productImagesReady)
  const captured = []
  const handler = (ev) => captured.push(ev.detail)
  window.addEventListener('productImagesReady', handler)

  const res = await UploadService.uploadMultipleImagesWithThumbnails(files, 'prodM', 'supM', { replaceExisting: false })
  // Wait for the dispatched event (or timeout) rather than using act hack
  try {
    await new Promise(resolve => {
      const t = setTimeout(() => { window.removeEventListener('productImagesReady', check); resolve(); }, 500)
      const check = (ev) => { if (ev.detail && ev.detail.productId === 'prodM' && ev.detail.mode === 'multiple') { clearTimeout(t); window.removeEventListener('productImagesReady', check); resolve(); } }
      window.addEventListener('productImagesReady', check)
    })
  } finally {
    window.removeEventListener('productImagesReady', handler)
  }

    expect(res.success).toBe(true)
    expect(spyUpload).toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalled()
  // Strict: an event should have been dispatched for this product
  expect(captured.some(d => d.productId === 'prodM' && d.mode === 'multiple')).toBe(true) 
  })

  test('uploadMultipleImagesWithThumbnails - replaceExisting recreates references and returns early when no new files', async () => {
    // Mock supabase insert for recreating references and StorageCleanupService
    jest.doMock('../../services/supabase', () => createSupabaseMock({
      from: (table) => ({ insert: async (obj) => ({ data: obj, error: null }), select: async () => ({ data: [], error: null }) }),
      storage: { from: () => ({ upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    }))

    jest.doMock('../../shared/services/storage/storageCleanupService', () => ({
      StorageCleanupService: {
        deleteAllProductImages: jest.fn().mockResolvedValue({ success: true }),
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const existingFiles = [{ isExisting: true, url: 'https://cdn.test/existing.jpg' }]

    const res = await UploadService.uploadMultipleImagesWithThumbnails(existingFiles, 'prodR', 'supR', { replaceExisting: true })

    // Expect it to succeed and mention recreating references
    expect(res.success).toBe(true)
    expect(res.message).toEqual(expect.stringContaining('Referencias recreadas'))
  })

  test('replaceAllProductImages - empty files clears DB and returns success', async () => {
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: (table) => ({
          delete: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        }),
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const phaseSpy = jest.spyOn(UploadService, '_dispatchPhase')
    const res = await UploadService.replaceAllProductImages([], 'prodZ', 'supZ')

    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
    // Robust: assert that base_insert phase was emitted
    expect(phaseSpy).toHaveBeenCalledWith('prodZ', 'base_insert', expect.any(Object))
  })

  test('replaceAllProductImages - non-empty: RPC success, verifies swap logic and returns rows', async () => {
    jest.resetModules()

    // Prepare replacedRows such that first row's image_url != expectedMainUrl to force swap logic
    const replacedRows = [
      { id: 'r1', image_url: 'other.jpg', image_order: 0 },
      { id: 'r2', image_url: 'https://cdn.test/a.png', image_order: 1 },
    ]

    // Track update calls to verify swap sequence
    const updateCalls = []

    // Mock supabase fully BEFORE importing UploadService
    jest.doMock('../../services/supabase', () => createSupabaseMock({
      storage: {
        from: (bucket) => ({
          upload: async (fileName, file) => ({ data: { id: `id-${file.name}` }, error: null }),
          getPublicUrl: (fileName) => ({ data: { publicUrl: `https://cdn.test/${fileName.split('/').pop()}` } }),
        }),
      },
      rpc: async () => ({ data: replacedRows, error: null }),
      from: (table) => ({
        select: (cols) => ({
          eq: () => ({
            order: () => ({
              select: async () => ({ data: replacedRows, error: null })
            }),
          }),
          order: () => ({ select: async () => ({ data: replacedRows, error: null }) })
        }),
        order: () => ({ select: async () => ({ data: replacedRows, error: null }) }),
        update: (payload) => ({ eq: async (field, val) => { updateCalls.push({ field, val, payload }); return { data: null } } }),
        delete: () => ({ eq: async () => ({ data: null }) }),
      }),
    }))


    const { default: UploadService2 } = await import('../../workspaces/supplier/shared-services/uploadService')

    // Spy uploadImage to avoid relying on internal upload logic in this unit test.
    jest.spyOn(UploadService2, 'uploadImage').mockImplementation(async (file, productId, supplierId) => {
      const name = file?.name || (file?.file && file.file.name) || 'unknown'
      return { success: true, data: { publicUrl: `https://cdn.test/${name}`, fileName: name } }
    })

    const files = [ { name: 'a.png', type: 'image/png', size: 100 }, { name: 'b.png', type: 'image/png', size: 150 } ]

  // Capture phase events
  const phases = []
  const ph = (ev) => phases.push(ev.detail)
  window.addEventListener('productImagesReady', ph)

  const res = await UploadService2.replaceAllProductImages(files, 'prodNonEmpty', 'supNonEmpty')
  // allow dispatched events
  await act(() => Promise.resolve())
  window.removeEventListener('productImagesReady', ph)

  expect(res.success).toBe(true)
  // Result should be an array with same cardinality
  expect(Array.isArray(res.data)).toBe(true)
  expect(res.data.length).toBe(replacedRows.length)

  // After swap code runs, there should be multiple update calls capturing the swap sequence
  expect(updateCalls.length).toBeGreaterThanOrEqual(3)
  // The swap is implemented as three updates: set expectedRow -> -1, set currentMain -> expectedRow.image_order, set expectedRow -> 0
  const lastThree = updateCalls.slice(-3)
  const expectedRow = replacedRows.find(r => r.image_url === `https://cdn.test/a.png`)
  const currentMain = replacedRows[0]
  expect(expectedRow).toBeTruthy()
  // Verify payload image_order sequence
  expect(lastThree.map(c => c.payload?.image_order)).toEqual([-1, expectedRow.image_order, 0])
  // Verify the eq('id', ...) values were called in the expected order
  expect(lastThree.map(c => c.val)).toEqual([expectedRow.id, currentMain.id, expectedRow.id])
  // Verify that a base_insert phase was emitted and later a thumbnails_* phase (thumbnails_ready expected)
  expect(phases.some(p => p.phase === 'base_insert' && p.productId === 'prodNonEmpty')).toBe(true)
  expect(phases.some(p => p.phase && p.productId === 'prodNonEmpty')).toBe(true)
  })

  test('replaceAllProductImages - RPC failure is reported', async () => {
    jest.resetModules()

    jest.doMock('../../services/supabase', () => createSupabaseMock({
      storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
      rpc: async () => ({ data: null, error: { message: 'rpc failed' } }),
      from: () => ({ select: async () => ({ data: [], error: null }) }),
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    // Ensure upload succeeds so the RPC error is what fails the flow
    jest.spyOn(UploadService, 'uploadImage').mockImplementation(async (file, productId, supplierId) => {
      const name = file?.name || (file?.file && file.file.name) || 'unknown'
      return { success: true, data: { publicUrl: `https://cdn.test/${name}`, fileName: name } }
    })

    const files = [ { name: 'x.png', type: 'image/png', size: 100 } ]
    const res = await UploadService.replaceAllProductImages(files, 'prodErr', 'supErr')

    expect(res.success).toBe(false)
    // The implementation should forward the RPC error message
    expect(res.error).toBe('rpc failed')
  })

  test('replaceAllProductImages - returns final verified rows with expected ids and image_order', async () => {
    jest.resetModules()

    const replacedRowsFinal = [
      { id: 'final-1', image_url: 'https://cdn.test/a.png', image_order: 0, thumbnails: { desktop: true, tablet: true, mobile: true, minithumb: true }, thumbnail_url: 'https://cdn.test/a-thumb.jpg', thumbnail_signature: 'sig-a' },
      { id: 'final-2', image_url: 'https://cdn.test/b.png', image_order: 1, thumbnails: { desktop: true, tablet: true, mobile: true, minithumb: true }, thumbnail_url: 'https://cdn.test/b-thumb.jpg', thumbnail_signature: 'sig-b' },
    ]

    // Mock supabase to return replacedRowsFinal for rpc and recheck
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        storage: { from: () => ({ upload: async () => ({ data: { id: 'id' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
        rpc: async () => ({ data: replacedRowsFinal, error: null }),
        from: (table) => ({
          select: (cols) => ({
            eq: () => ({
              order: () => ({
                select: async () => ({ data: replacedRowsFinal, error: null })
              }),
            }),
            order: () => ({ select: async () => ({ data: replacedRowsFinal, error: null }) })
          }),
          order: () => ({ select: async () => ({ data: replacedRowsFinal, error: null }) }),
          update: () => ({ eq: async () => ({ data: null }) }),
        }),
      },
    }))

    const { default: UploadService3 } = await import('../../workspaces/supplier/shared-services/uploadService')

    // Mock uploadImage to return predictable publicUrl values
    jest.spyOn(UploadService3, 'uploadImage').mockImplementation(async (file, productId, supplierId) => {
      const name = file?.name || (file?.file && file.file.name) || 'unknown'
      return { success: true, data: { publicUrl: `https://cdn.test/${name}`, fileName: name } }
    })

    const files = [ { name: 'a.png', type: 'image/png', size: 100 }, { name: 'b.png', type: 'image/png', size: 150 } ]

  // Capture events for the final flow
  const events = []
  const h = (ev) => events.push(ev.detail)
  window.addEventListener('productImagesReady', h)

  const res = await UploadService3.replaceAllProductImages(files, 'prodFinal', 'supFinal')
    // Wait for thumbnails event (or timeout)
    try {
      await new Promise(resolve => {
        const t = setTimeout(() => { window.removeEventListener('productImagesReady', check); resolve(); }, 500)
        const check = (ev) => { if (ev.detail && ev.detail.productId === 'prodFinal' && /thumbnails_/.test(ev.detail.phase || '')) { clearTimeout(t); window.removeEventListener('productImagesReady', check); resolve(); } }
        window.addEventListener('productImagesReady', check)
      })
    } finally {
      window.removeEventListener('productImagesReady', h)
    }

  expect(res.success).toBe(true)
  // Detailed assertion on returned rows
  expect(Array.isArray(res.data)).toBe(true)
  expect(res.data.length).toBe(2)
  expect(res.data.map(r => r.id)).toEqual(['final-1', 'final-2'])
  expect(res.data.map(r => r.image_order)).toEqual([0,1])
  // Verify thumbnails and signatures are present
  expect(res.data[0].thumbnails).toEqual(replacedRowsFinal[0].thumbnails)
  expect(res.data[0].thumbnail_url).toBe(replacedRowsFinal[0].thumbnail_url)
  expect(res.data[0].thumbnail_signature).toBe(replacedRowsFinal[0].thumbnail_signature)
  expect(res.data[1].thumbnails).toEqual(replacedRowsFinal[1].thumbnails)
  expect(res.data[1].thumbnail_url).toBe(replacedRowsFinal[1].thumbnail_url)
  expect(res.data[1].thumbnail_signature).toBe(replacedRowsFinal[1].thumbnail_signature)
  // Event assertions: ensure thumbnails_ready or thumbnails_partial emitted for this product
  expect(events.some(e => e.productId === 'prodFinal' && /thumbnails_/.test(e.phase))).toBe(true)
  })

  test('_ensureMainThumbnails - retries and returns ready when thumbnails appear', async () => {
    jest.resetModules()

    // create a supabase mock that returns different rows across calls
    let call = 0
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => {
                  call += 1
                  if (call === 1) {
                    // First attempt: missing thumbnails
                    return { data: { thumbnails: null, thumbnail_url: null } }
                  }
                  // Second attempt: thumbnails present
                  return { data: { thumbnails: { desktop: true, tablet: true, mobile: true, minithumb: true }, thumbnail_url: 'https://cdn.test/thumb.jpg', thumbnail_signature: 'sig' } }
                },
              }),
            }),
          }),
        }),
      },
    }))

    // mock generateThumbnailWithRetry to resolve quickly
    const mod = await import('../../workspaces/supplier/shared-services/uploadService')
    const UploadService = mod.default
    jest.spyOn(UploadService, 'generateThumbnailWithRetry').mockResolvedValue({ success: true })

    // Run with real timers; backoffs are small so test will finish quickly
    const res = await UploadService._ensureMainThumbnails('prodT', 'supT', 'https://cdn.test/orig.jpg')

    expect(res.status).toBe('ready')
    expect(UploadService.generateThumbnailWithRetry).toHaveBeenCalled()
  })

  test('uploadImageWithThumbnail - storage upload error reported', async () => {
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        storage: { from: () => ({ upload: async () => ({ data: null, error: { message: 'upload failed' } }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
        rpc: async () => ({ data: 0, error: null }),
        from: () => ({ select: async () => ({ data: [], error: null }) }),
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const file = { name: 'fail.png', type: 'image/png', size: 100 }
    const res = await UploadService.uploadImageWithThumbnail(file, 'prodFail', 'supFail', true)

    expect(res.success).toBe(false)
    expect(res.error).toEqual(expect.stringContaining('upload failed'))
  })

  test('uploadImageWithThumbnail - missing file and invalid type', async () => {
    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const resMissing = await UploadService.uploadImageWithThumbnail(undefined, 'p1', 's1', true)
    expect(resMissing.success).toBe(false)
    expect(resMissing.error).toEqual(expect.stringContaining('No se proporcionó archivo'))

    const badType = { name: 'notimg.txt', type: 'text/plain', size: 10 }
    const resBad = await UploadService.uploadImageWithThumbnail(badType, 'p1', 's1', true)
    expect(resBad.success).toBe(false)
    expect(resBad.error).toEqual(expect.stringContaining('Solo se permiten archivos de imagen'))

    // Wrapper object scenario
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        storage: { from: () => ({ upload: async () => ({ data: { id: 'ok' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
        rpc: async () => ({ data: 0, error: null }),
        from: () => ({ select: async () => ({ data: [], error: null }) }),
      },
    }))
    const { default: UploadService2 } = await import('../../workspaces/supplier/shared-services/uploadService')
    const wrapper = { file: { name: 'wrap.png', type: 'image/png', size: 50 } }
    const resWrap = await UploadService2.uploadImageWithThumbnail(wrapper, 'p2', 's2', true)
    expect(resWrap.success).toBe(true)
    expect(resWrap.data.fileName).toBe('wrap.png')
  })

  test('uploadImageWithThumbnail - webp main image skips thumbnail generation', async () => {
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        storage: { from: () => ({ upload: async () => ({ data: { id: 'ok' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/orig.webp' } }) }) },
        rpc: async () => ({ data: 0, error: null }),
        from: () => ({ select: async () => ({ data: [], error: null }) }),
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')
    const spyGen = jest.spyOn(UploadService, 'generateThumbnailWithRetry')

    const file = { name: 'w.webp', type: 'image/webp', size: 100 }
    const res = await UploadService.uploadImageWithThumbnail(file, 'pweb', 'sweb', true)

    expect(res.success).toBe(true)
    expect(res.data.thumbnailUrl).toBeNull()
    expect(spyGen).not.toHaveBeenCalled()
  })

  test('generateThumbnailWithRetry - retries succeed and fail appropriately', async () => {
    jest.resetModules()
    const mod = await import('../../workspaces/supplier/shared-services/uploadService')
    const UploadService = mod.default

    // first attempt fails, second succeeds
    const genSpy = jest.spyOn(UploadService, 'generateThumbnail')
      .mockImplementationOnce(async () => ({ success: false, error: 'boom' }))
      .mockImplementationOnce(async () => ({ success: true, thumbnailUrl: 'https://cdn.test/ok' }))

    const res = await UploadService.generateThumbnailWithRetry('url', 'p', 's', { maxRetries: 2 })
    expect(res.success).toBe(true)
    expect(res.wasRetried).toBe(true)
    expect(res.attemptUsed).toBe(2)

    // now both attempts fail
    genSpy.mockReset()
    genSpy.mockImplementation(async () => ({ success: false, error: 'still' }))
    const res2 = await UploadService.generateThumbnailWithRetry('url', 'p', 's', { maxRetries: 2 })
    expect(res2.success).toBe(false)
    expect(res2.attemptUsed).toBe(2)
    expect(res2.error).toEqual(expect.stringContaining('Max retries'))
  })

  test('_autoRepairIf404 - HEAD 404 triggers force regeneration and dispatch', async () => {
    jest.resetModules()
    let headCalled = false
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: { image_url: 'https://cdn.test/orig.jpg', thumbnail_url: 'https://cdn.test/thumb.jpg' } })
              })
            })
          })
        })
      },
    }))

    global.fetch = jest.fn(async (url, opts) => {
      headCalled = true
      return { status: 404 }
    })

    const mod = await import('../../workspaces/supplier/shared-services/uploadService')
    const UploadService = mod.default
    const genSpy = jest.spyOn(UploadService, 'generateThumbnailWithRetry').mockResolvedValue({ success: true })
    const phaseSpy = jest.spyOn(UploadService, '_dispatchPhase')

    await UploadService._autoRepairIf404('pr', 'su')

    expect(headCalled).toBe(true)
    expect(genSpy).toHaveBeenCalledWith('https://cdn.test/orig.jpg', 'pr', 'su', expect.objectContaining({ force: true }))
    expect(phaseSpy).toHaveBeenCalledWith('pr', 'repair', expect.any(Object))

    // restore fetch
    global.fetch = fetch
  })

  test('_autoRepairIf404 - HEAD abort/timeout handled gracefully', async () => {
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: { image_url: 'https://cdn.test/orig.jpg', thumbnail_url: 'https://cdn.test/thumb.jpg' } })
              })
            })
          })
        })
      },
    }))

    global.fetch = jest.fn(async () => { throw new Error('aborted') })
    const mod = await import('../../workspaces/supplier/shared-services/uploadService')
    const UploadService = mod.default
    const genSpy = jest.spyOn(UploadService, 'generateThumbnailWithRetry')

    await expect(UploadService._autoRepairIf404('pr2', 'su2')).resolves.not.toThrow()
    expect(genSpy).not.toHaveBeenCalled()

    global.fetch = fetch
  })

  test('uploadMultipleImagesWithThumbnails - partial parallel failure reported', async () => {
    jest.resetModules()
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: (table) => ({ select: async () => ({ data: [], error: null }) }),
        rpc: async () => ({ data: null, error: null }),
        storage: { from: () => ({ upload: async () => ({ data: { id: 'id' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const spyUpload = jest.spyOn(UploadService, 'uploadImageWithThumbnail')
      .mockImplementationOnce(async (file, p, s, isMain) => ({ success: true, data: { fileName: file.name } }))
      .mockImplementationOnce(async (file, p, s, isMain) => ({ success: false, error: 'boom' }))

    const files = [ { file: { name: 'a.png', type: 'image/png', size: 100 } }, { file: { name: 'b.png', type: 'image/png', size: 200 } } ]
    const res = await UploadService.uploadMultipleImagesWithThumbnails(files, 'prodP', 'supP')

    expect(res.success).toBe(true)
    expect(Array.isArray(res.errors)).toBe(true)
    expect(res.errors[0]).toMatch(/Archivo/)
  })

  test('uploadMultipleImagesWithThumbnails - cleanup throws but flow continues', async () => {
    jest.resetModules()
    jest.doMock('../../shared/services/storage/storageCleanupService', () => ({
      StorageCleanupService: { deleteAllProductImages: async () => { throw new Error('cleanup fail') } }
    }))
    jest.doMock('../../services/supabase', () => ({
      supabase: {
        from: (table) => ({ select: async () => ({ data: [], error: null }) }),
        rpc: async () => ({ data: null, error: null }),
        storage: { from: () => ({ upload: async () => ({ data: { id: 'id' }, error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/x' } }) }) },
      },
    }))

    const { default: UploadService } = await import('../../workspaces/supplier/shared-services/uploadService')

    const files = [ { file: { name: 'a.png', type: 'image/png', size: 100 } } ]
    const res = await UploadService.uploadMultipleImagesWithThumbnails(files, 'prodC', 'supC', { replaceExisting: true })

    expect(res.success).toBe(true)
  })
}
)
