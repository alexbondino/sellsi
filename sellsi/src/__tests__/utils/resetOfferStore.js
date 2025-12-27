// Utility to reset offer store to a known baseline for tests
export function resetOfferStore() {
  // Require at runtime to avoid module hoisting issues in tests
  // and to ensure we operate on the live store instance
  // eslint-disable-next-line global-require
  const { useOfferStore } = require('../../stores/offerStore');
  useOfferStore.setState({
    buyerOffers: [],
    supplierOffers: [],
    loading: false,
    error: null,
    _cache: { buyer: new Map(), supplier: new Map() },
    _inFlight: { buyer: new Map(), supplier: new Map() }
  });
}
