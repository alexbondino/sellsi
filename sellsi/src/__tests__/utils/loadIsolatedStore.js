// Helper to load a fresh instance of useProductSpecifications with mocked service
module.exports = {
  loadIsolatedSpecStore: (serviceOverrides = {}) => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.doMock('../../workspaces/marketplace/services', () => ({
      updateProductSpecifications: jest.fn(() => Promise.resolve(true)),
      ...serviceOverrides
    }))

    const store = require('../../workspaces/supplier/shared-hooks/useProductSpecifications').default.getState()
    return store
  }
}
