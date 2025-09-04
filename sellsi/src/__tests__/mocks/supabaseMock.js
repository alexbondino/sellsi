// Mock de Supabase para testing
// Estado interno para simular conteos en offer_limits tras refactor
const __offerLimitsState = {
  // key: buyer|product|month -> count
  productCounts: new Map(),
  // key: buyer|supplier|month -> count (aggregado proveedor)
  supplierCounts: new Map(),
  // registrar orden cronológico de inserts para testear race (debug)
  log: []
};

export const mockSupabase = {
  __offerLimitsState,
  rpc: jest.fn((fnName, args) => {
    switch (fnName) {
      case 'count_monthly_offers':
        return Promise.resolve({ data: 1, error: null });
      case 'validate_offer_limits': {
        const { p_buyer_id, p_supplier_id, p_product_id } = args || {};
        const month = new Date().toISOString().slice(0,7);
        const prodKey = `${p_buyer_id}|${p_product_id}|${month}`;
        const suppKey = `${p_buyer_id}|${p_supplier_id}|${month}`;
        const product_count = __offerLimitsState.productCounts.get(prodKey) || 0;
        const supplier_count = __offerLimitsState.supplierCounts.get(suppKey) || 0;
        const product_limit = 3;
        const supplier_limit = 5;
        const allowed = product_count < product_limit && supplier_count < supplier_limit;
        return Promise.resolve({ data: {
          allowed,
          product_count,
            supplier_count,
            product_limit,
            supplier_limit,
            reason: allowed ? null : (product_count >= product_limit ? 'Se alcanzó el límite mensual de ofertas (producto)' : 'Se alcanzó el límite mensual de ofertas con este proveedor')
        }, error: null });
      }
      case 'create_offer': {
        // Simular nueva lógica: incrementa conteos producto y proveedor (NULL) sin duplicar
        const { p_buyer_id, p_supplier_id, p_product_id } = args || {};
        const month = new Date().toISOString().slice(0,7); // YYYY-MM
        const prodKey = `${p_buyer_id}|${p_product_id}|${month}`;
        const suppKey = `${p_buyer_id}|${p_supplier_id}|${month}`;
        const currentProd = __offerLimitsState.productCounts.get(prodKey) || 0;
        const currentSupp = __offerLimitsState.supplierCounts.get(suppKey) || 0;
        __offerLimitsState.productCounts.set(prodKey, currentProd + 1);
        __offerLimitsState.supplierCounts.set(suppKey, currentSupp + 1);
        __offerLimitsState.log.push({ t: Date.now(), prodKey, suppKey });
        return Promise.resolve({ data: { success: true, offer_id: `offer_${currentProd+1}`, expires_at: new Date(Date.now()+48*3600*1000).toISOString() }, error: null });
      }
      case 'get_buyer_offers':
      case 'get_supplier_offers':
        return Promise.resolve({ data: [], error: null });
      case 'create_notification': {
        // Ahora exige p_payload explícito (sin fallback legacy)
        const payload = args?.p_payload || {};
        return Promise.resolve({ data: { id: 'notif_1', user_id: payload.p_user_id, type: payload.p_type }, error: null });
      }
      default:
        return Promise.resolve({ data: null, error: null });
    }
  }),
  channel: jest.fn(() => ({ on: jest.fn(() => ({ subscribe: jest.fn(() => ({ id: 'sub_mock' })) })), subscribe: jest.fn(() => ({ id: 'sub_mock' })) })),
  removeChannel: jest.fn(() => {}),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    insert: jest.fn(() => ({
      data: null,
      error: null
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
};

// Mock data para ofertas
export const mockOfferData = {
  validOffer: {
    id: 'offer_123',
    product_id: 'prod_456',
    buyer_id: 'buyer_789',
    supplier_id: 'supplier_101',
    quantity: 5,
    price: 1000,
    message: 'Test offer message',
    status: 'pending',
  created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
  },
  validProduct: {
    id: 'prod_456',
    name: 'Test Product',
    price: 1200,
    supplier_id: 'supplier_101',
    stock: 10
  },
  validUser: {
    id: 'buyer_789',
    name: 'Test Buyer',
    email: 'test@example.com',
    role: 'buyer'
  }
};

// Mock de localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
