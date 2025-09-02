// Mock de Supabase para testing
export const mockSupabase = {
  rpc: jest.fn((fnName, args) => {
    switch (fnName) {
      case 'count_monthly_offers':
        return Promise.resolve({ data: 1, error: null });
      case 'create_offer':
        return Promise.resolve({ data: { success: true, offer_id: 'offer_test', expires_at: new Date(Date.now()+48*3600*1000).toISOString() }, error: null });
      case 'get_buyer_offers':
      case 'get_supplier_offers':
        return Promise.resolve({ data: [], error: null });
      case 'create_notification':
        return Promise.resolve({ data: { id: 'notif_1' }, error: null });
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
    created_at: '2025-09-02T10:00:00Z',
    expires_at: '2025-09-04T10:00:00Z'
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
