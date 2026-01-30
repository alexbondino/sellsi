// Helper to load a fresh instance of useProductSpecifications with mocked service
module.exports = {
  loadIsolatedSpecStore: (serviceOverrides = {}) => {
    jest.resetModules()
    jest.clearAllMocks()
    // Mock the exact module imported by the hook implementation so our override is effective
    jest.doMock('../../workspaces/marketplace/services/productSpecificationsService', () => ({
      updateProductSpecifications: jest.fn(() => Promise.resolve(true)),
      ...serviceOverrides
    }))

    const store = require('../../workspaces/supplier/shared-hooks/useProductSpecifications').default.getState()
    return store
  }
}
