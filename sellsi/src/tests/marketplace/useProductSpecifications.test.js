const { createDeferred } = require('../utils/deferred')
const { loadIsolatedSpecStore } = require('../utils/loadIsolatedStore')

describe('useProductSpecifications hook - robustness and race tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('validateSpecifications removes invalid entries and reports errors', () => {
    const store = loadIsolatedSpecStore()
    const input = [
      { nombre: '', valor: 'v' },
      { nombre: 'Good', valor: '' },
      { nombre: 'Naughty💥', valor: '1' },
      { nombre: 'Ok', valor: 'Val' }
    ];

    const res = store.validateSpecifications(input)
    expect(res.isValid).toBe(false)
    expect(Array.isArray(res.errors)).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(1)
  });

  test('bulkValidateAndClean eliminates duplicates and reports duplicatesRemoved', () => {
    const store = loadIsolatedSpecStore()
    const input = [
      { nombre: 'A', valor: '1' },
      { nombre: 'a', valor: '1' },
      { nombre: 'B', valor: '2' },
    ];

    const res = store.bulkValidateAndClean(input)
    expect(res.duplicatesRemoved).toBe(1)
    expect(res.data.length).toBe(2)
  });

  test('processProductSpecifications sets processing flag and clears it after completion (race safety)', async () => {
    // Use deferred to make test deterministic
    const deferred = createDeferred()
    const updateMock = jest.fn(() => deferred.promise)
    const store = loadIsolatedSpecStore({ updateProductSpecifications: updateMock })

    const promise = store.processProductSpecifications('p-1', [{ nombre: ' X ', valor: ' 1 ' }])
    // Immediately check processing flag
    expect(store.isProcessingSpecs('p-1')).toBe(true)

    // resolve the service
    deferred.resolve(true)
    await promise

    // After completion flag must be false
    expect(store.isProcessingSpecs('p-1')).toBe(false)
    expect(updateMock).toHaveBeenCalled()
  })

  test('concurrent process calls for same product serialize processing flag correctly', async () => {
    const deferred = createDeferred()
    const updateMock = jest.fn(() => deferred.promise)
    const store = loadIsolatedSpecStore({ updateProductSpecifications: updateMock })

    const p1 = store.processProductSpecifications('p-2', [{ nombre: 'X', valor: '1' }]);
    const p2 = store.processProductSpecifications('p-2', [{ nombre: 'Y', valor: '2' }]);

    // While any is in flight, the flag should be true
    expect(store.isProcessingSpecs('p-2')).toBe(true);

    // resolve the single DB promise
    deferred.resolve(true)
    await Promise.all([p1, p2])
    expect(store.isProcessingSpecs('p-2')).toBe(false)
    expect(updateMock).toHaveBeenCalled()
  })

  test('processProductSpecifications handles service rejection and sets error', async () => {
    const updateMock = jest.fn(() => Promise.reject(new Error('svc fail')))
    const store = loadIsolatedSpecStore({ updateProductSpecifications: updateMock })

    const res = await store.processProductSpecifications('p-fail', [{ nombre: 'A', valor: '1' }])
    expect(res.success).toBe(false)
    expect(store.isProcessingSpecs('p-fail')).toBe(false)
    const fresh = require('../../workspaces/supplier/shared-hooks/useProductSpecifications').default.getState()
    expect(typeof fresh.error).toBe('string')
    expect(fresh.error).toMatch(/svc fail|Error procesando especificaciones/)
  })

  test('processProductSpecifications sends sanitized payload to service (trim + mapping + defaults)', async () => {
    const updateMock = jest.fn(() => Promise.resolve(true))
    const store = loadIsolatedSpecStore({ updateProductSpecifications: updateMock })

    const input = [
      { nombre: '  Name  ', valor: '  Val  ', descripcion: '  desc  ', categoria: '  ', unidad: '  ' }
    ]

    const res = await store.processProductSpecifications('p-payload', input)
    expect(res.success).toBe(true)
    expect(updateMock).toHaveBeenCalled()

    const call = updateMock.mock.calls[0]
    expect(call[0]).toBe('p-payload')
    const sentSpecs = call[1]
    expect(Array.isArray(sentSpecs)).toBe(true)
    expect(sentSpecs[0].key).toBe('Name')
    expect(sentSpecs[0].value).toBe('Val')
    expect(sentSpecs[0].descripcion).toBe('desc')
    // categoria should normalize blank -> 'general'
    expect(sentSpecs[0].categoria).toBe('general')
  })
});
