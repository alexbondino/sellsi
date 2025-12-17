/**
 * Tests para checkoutService - Manejo de órdenes duplicadas
 * 
 * Verifica:
 * - _hashItems(): genera hash correcto de items
 * - getOrReuseExistingOrder(): reutiliza órdenes pending válidas
 * - createOrder(): integración con verificación de orden existente
 */

// Mock de Supabase
const mockSupabaseFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSingle = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: (...args) => {
      mockSupabaseFrom(...args);
      return {
        select: (...selectArgs) => {
          mockSelect(...selectArgs);
          return {
            eq: (...eqArgs) => {
              mockEq(...eqArgs);
              return {
                eq: (...eq2Args) => {
                  mockEq(...eq2Args);
                  return {
                    maybeSingle: () => mockMaybeSingle()
                  };
                },
                maybeSingle: () => mockMaybeSingle()
              };
            }
          };
        },
        insert: (...insertArgs) => {
          mockInsert(...insertArgs);
          return {
            select: () => ({
              single: () => mockSingle()
            })
          };
        },
        update: (...updateArgs) => {
          mockUpdate(...updateArgs);
          return {
            eq: () => ({ eq: () => Promise.resolve({ error: null }) })
          };
        }
      };
    }
  }
}));

// Mock de trackUserAction
jest.mock('../../services/security', () => ({
  trackUserAction: jest.fn(() => Promise.resolve())
}));

// Mock de PAYMENT_STATUS
jest.mock('../../domains/checkout/constants/paymentMethods', () => ({
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed'
  }
}));

// Mock de khipuService
jest.mock('../../domains/checkout/services/khipuService', () => ({
  default: {
    createPaymentOrder: jest.fn(),
    validateAmount: jest.fn(() => true)
  }
}));

// Importar después de los mocks
import checkoutService from '../../domains/checkout/services/checkoutService';

describe('checkoutService - Duplicate Order Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // _hashItems()
  // =========================================================================
  describe('_hashItems()', () => {
    it('genera hash vacío para items null o undefined', () => {
      expect(checkoutService._hashItems(null)).toBe('');
      expect(checkoutService._hashItems(undefined)).toBe('');
      expect(checkoutService._hashItems([])).toBe('');
    });

    it('genera hash correcto con product_id', () => {
      const items = [
        { product_id: 'abc-123', quantity: 2 },
        { product_id: 'def-456', quantity: 1 }
      ];
      const hash = checkoutService._hashItems(items);
      // Ordenado alfabéticamente
      expect(hash).toBe('abc-123:2|def-456:1');
    });

    it('genera hash correcto con productid (alias)', () => {
      const items = [
        { productid: 'abc-123', quantity: 2 },
        { productid: 'def-456', quantity: 1 }
      ];
      const hash = checkoutService._hashItems(items);
      expect(hash).toBe('abc-123:2|def-456:1');
    });

    it('genera hash correcto con id (fallback)', () => {
      const items = [
        { id: 'abc-123', quantity: 2 },
        { id: 'def-456', quantity: 1 }
      ];
      const hash = checkoutService._hashItems(items);
      expect(hash).toBe('abc-123:2|def-456:1');
    });

    it('prioriza product_id sobre productid sobre id', () => {
      const items = [
        { product_id: 'correct', productid: 'wrong1', id: 'wrong2', quantity: 1 }
      ];
      const hash = checkoutService._hashItems(items);
      expect(hash).toBe('correct:1');
    });

    it('ordena items para hash consistente', () => {
      const items1 = [
        { product_id: 'zzz', quantity: 1 },
        { product_id: 'aaa', quantity: 2 }
      ];
      const items2 = [
        { product_id: 'aaa', quantity: 2 },
        { product_id: 'zzz', quantity: 1 }
      ];
      expect(checkoutService._hashItems(items1)).toBe(checkoutService._hashItems(items2));
    });

    it('diferencia items por cantidad', () => {
      const items1 = [{ product_id: 'abc', quantity: 1 }];
      const items2 = [{ product_id: 'abc', quantity: 2 }];
      expect(checkoutService._hashItems(items1)).not.toBe(checkoutService._hashItems(items2));
    });
  });

  // =========================================================================
  // getOrReuseExistingOrder()
  // =========================================================================
  describe('getOrReuseExistingOrder()', () => {
    it('retorna null si cartId es null/undefined', async () => {
      const result = await checkoutService.getOrReuseExistingOrder(null, []);
      expect(result).toBeNull();
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('retorna null si no hay orden pending existente', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', []);
      
      expect(result).toBeNull();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('orders');
    });

    it('retorna orden existente si items coinciden', async () => {
      const existingOrder = {
        id: 'order-123',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'khipu',
        khipu_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // +10 min
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toEqual(existingOrder);
    });

    it('retorna null y expira orden si items cambiaron', async () => {
      const existingOrder = {
        id: 'order-123',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'khipu',
        khipu_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      // Items diferentes
      const currentItems = [{ product_id: 'prod-1', quantity: 5 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'expired',
        status: 'cancelled',
        cancellation_reason: 'cart items changed'
      }));
    });

    it('retorna null y expira orden si khipu_expires_at pasó', async () => {
      const existingOrder = {
        id: 'order-123',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'khipu',
        khipu_expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // -5 min (expirado)
        payment_status: 'pending',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'expired'
      }));
    });

    it('detecta orden zombie (>5 min sin khipu_expires_at)', async () => {
      const existingOrder = {
        id: 'order-123',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'khipu',
        khipu_expires_at: null, // Sin khipu_expires_at
        payment_status: 'pending',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 min atrás
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cancellation_reason: expect.stringContaining('zombie')
      }));
    });

    // =========================================================================
    // Tests para Flow
    // =========================================================================
    it('retorna orden Flow válida (flow_expires_at > ahora)', async () => {
      const existingOrder = {
        id: 'order-flow-1',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'flow',
        flow_expires_at: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // +25 min
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toEqual(existingOrder);
    });

    it('retorna null y expira orden Flow si flow_expires_at pasó', async () => {
      const existingOrder = {
        id: 'order-flow-2',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'flow',
        flow_expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // -5 min (expirado)
        payment_status: 'pending',
        created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'expired',
        cancellation_reason: expect.stringContaining('payment window expired')
      }));
    });

    it('detecta orden Flow zombie (>5 min sin flow_expires_at)', async () => {
      const existingOrder = {
        id: 'order-flow-3',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'flow',
        flow_expires_at: null, // Sin flow_expires_at
        payment_status: 'pending',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 min atrás
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'expired',
        cancellation_reason: expect.stringContaining('zombie')
      }));
    });

    it('fail-open: retorna null si hay error de DB', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Network error' } });
      
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', []);
      
      expect(result).toBeNull();
      // No debería lanzar excepción
    });
  });

  // =========================================================================
  // createOrder() - Integración
  // =========================================================================
  describe('createOrder() integration', () => {
    it('reutiliza orden existente si getOrReuseExistingOrder la encuentra', async () => {
      const existingOrder = {
        id: 'order-existing',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        total: 5000,
        khipu_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 5000
      };
      
      const result = await checkoutService.createOrder(orderData);
      
      expect(result).toEqual(existingOrder);
      // No debería haber INSERT
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('crea nueva orden si no hay orden existente', async () => {
      // getOrReuseExistingOrder retorna null
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      
      // INSERT exitoso
      const newOrder = { id: 'order-new', total: 5000 };
      mockSingle.mockResolvedValue({ data: newOrder, error: null });
      
      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 5000
      };
      
      const result = await checkoutService.createOrder(orderData);
      
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(newOrder);
    });
  });
});
