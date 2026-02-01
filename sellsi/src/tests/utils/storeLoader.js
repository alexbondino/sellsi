module.exports = {
  loadPriceTiersStore: () => {
    const useProductPriceTiers = require('../../workspaces/supplier/shared-hooks/useProductPriceTiers').default
    return useProductPriceTiers.getState()
  }
}
