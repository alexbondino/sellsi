// Utility to create a robust mock for Zustand stores used in tests.
// Usage:
// const { mockStore, applyMock } = createZustandMock({ cart: [] });
// mockStore.mockReturnValue({ cart: [...] });
// applyMock(); // will jest.doMock the actual store path used by components

exports.createZustandMock = (initialState = {}) => {
  const mockStore = jest.fn(() => ({ ...initialState }));

  const applyMock = (modulePath = '../../shared/stores/cart/cartStore') => {
    jest.doMock(modulePath, () => ({
      __esModule: true,
      default: (selector) => {
        const state = { ...initialState, ...mockStore() };
        return typeof selector === 'function' ? selector(state) : state;
      },
    }));
  };

  return { mockStore, applyMock };
};
