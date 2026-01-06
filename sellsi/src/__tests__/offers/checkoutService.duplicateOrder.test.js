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
const mockOrderMaybeSingle = jest.fn();
const mockCartMaybeSingle = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSingle = jest.fn();
const mockGetUserProfile = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: (table, ...args) => {
      mockSupabaseFrom(table, ...args);

      // Comportamiento específico por tabla
      if (table === 'orders') {
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
                      maybeSingle: () => mockOrderMaybeSingle()
                    };
                  },
                  maybeSingle: () => mockOrderMaybeSingle()
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

      if (table === 'carts') {
        return {
          select: (...selectArgs) => {
            mockSelect(...selectArgs);
            return {
              eq: (...eqArgs) => {
                mockEq(...eqArgs);
                return {
                  maybeSingle: () => mockCartMaybeSingle()
                };
              }
            };
          }
        };
      }

      // Fallback genérico
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
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

// Mock de profileService (used en createOrder via import())
jest.mock('../../services/user/profileService', () => ({
  getUserProfile: (...args) => mockGetUserProfile(...args)
}));

// Importar después de los mocks
import checkoutService from '../../domains/checkout/services/checkoutService';

describe('checkoutService - Duplicate Order Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Defaults to avoid null pointer errors in happy-path tests
    mockCartMaybeSingle.mockResolvedValue({ data: { user_id: 'user-123' }, error: null });
    mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'new-order' }, error: null });
    mockGetUserProfile.mockResolvedValue({ data: {} });
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

    it('validateMinimumPurchase lanza MINIMUM_PURCHASE_VIOLATION cuando no cumple', async () => {
      // Item without offer should count toward minimum
      const items = [
        { product_id: 'p1', supplier_id: 's1', quantity: 1, price: 100, minimum_purchase_amount: 500 }
      ];

      await expect(checkoutService.validateMinimumPurchase(items)).rejects.toThrow('MINIMUM_PURCHASE_VIOLATION');
    });

    it('retorna null si no hay orden pending existente', async () => {
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      
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
        khipu_payment_url: 'https://khipu.com/pay/123',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cancellation_reason: expect.stringContaining('zombie')
      }));
    });

    it('khipu_expires_at exactamente ahora se considera expirado', async () => {
      const now = new Date();
      const existingOrder = {
        id: 'order-now',
        items: [{ product_id: 'prod-1', quantity: 2 }],
        total: 10000,
        payment_method: 'khipu',
        khipu_expires_at: now.toISOString(), // exactly now
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });

      const result = await checkoutService.getOrReuseExistingOrder('cart-123', [{ product_id: 'prod-1', quantity: 2 }]);
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'expired' }));
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
        flow_payment_url: 'https://flow.cl/pay/abc123',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
      const currentItems = [{ product_id: 'prod-1', quantity: 2 }];
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', currentItems);
      
      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        payment_status: 'expired',
        cancellation_reason: expect.stringContaining('zombie')
      }));
    });

    it('fail-open: retorna null si hay error de DB', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Network error' } });
      
      const result = await checkoutService.getOrReuseExistingOrder('cart-123', []);
      
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    // -------------- New tests: cart ownership --------------
    it('validateCartOwnership: lanza CART_NOT_FOUND cuando no existe cart', async () => {
      mockCartMaybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(checkoutService.validateCartOwnership('cart-999', 'user-1')).rejects.toThrow('CART_NOT_FOUND');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('carts');
    });

    it('validateCartOwnership: lanza CART_OWNERSHIP_VIOLATION y trackUserAction cuando user difiere', async () => {
      mockCartMaybeSingle.mockResolvedValue({ data: { user_id: 'someone-else' }, error: null });
      const { trackUserAction } = require('../../services/security');
      await expect(checkoutService.validateCartOwnership('cart-123', 'user-1')).rejects.toThrow('CART_OWNERSHIP_VIOLATION');
      expect(trackUserAction).toHaveBeenCalledWith('cart_ownership_violation', expect.objectContaining({ cartId: 'cart-123', userId: 'user-1' }));
    });
  });

  // =========================================================================
  // createOrder() - Integración
  // =========================================================================
  describe('createOrder() integration', () => {
    beforeEach(() => {
      // Por defecto, el cart pertenece al usuario que crea la orden
      mockCartMaybeSingle.mockResolvedValue({ data: { user_id: 'user-123' }, error: null });
    });

    it('reutiliza orden existente si getOrReuseExistingOrder la encuentra', async () => {
      const existingOrder = {
        id: 'order-existing',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        total: 5000,
        khipu_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };
      mockOrderMaybeSingle.mockResolvedValue({ data: existingOrder, error: null });
      
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
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      
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

    it('enriquece direcciones desde perfil cuando faltan', async () => {
      // Ensure no existing order
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      const newOrder = { id: 'order-enriched', total: 5000 };
      mockSingle.mockResolvedValue({ data: newOrder, error: null });

      // Ensure profile returns shipping data for enrichment
      mockGetUserProfile.mockResolvedValue({ data: { shipping_address: '123 Main', shipping_region: 'RM', shipping_commune: 'Santiago', shipping_number: '10' } });

      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 5000
      };

      const result = await checkoutService.createOrder(orderData);
      expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ shipping_address: expect.objectContaining({ address: '123 Main' }) }));
      expect(result).toEqual(newOrder);
    });

    it('createOrder: lanza si INSERT falla', async () => {
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 5000
      };

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(checkoutService.createOrder(orderData)).rejects.toThrow(/No se pudo crear la orden: Insert failed/);
      expect(mockInsert).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    // NEW TEST: Bank transfer payment fee and grand total
    it('createOrder: incluye payment_fee y grand_total para transferencia bancaria', async () => {
      // No hay orden existente
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      
      const newOrder = { 
        id: 'order-bank-transfer', 
        total: 10000, 
        payment_fee: 50,
        grand_total: 10050,
        payment_method: 'bank_transfer'
      };
      mockSingle.mockResolvedValue({ data: newOrder, error: null });

      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 10000,
        paymentMethod: 'bank_transfer',
        paymentFee: 50,  // 0.5% de 10000
        grandTotal: 10050
      };

      const result = await checkoutService.createOrder(orderData);
      
      // Verificar que INSERT incluye payment_fee y grand_total
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_fee: 50,
          grand_total: 10050,
          payment_method: 'bank_transfer'
        })
      );
      
      expect(result).toEqual(newOrder);
    });

    it('createOrder: payment_fee y grand_total son null si no se especifican', async () => {
      // No hay orden existente
      mockOrderMaybeSingle.mockResolvedValue({ data: null, error: null });
      
      const newOrder = { 
        id: 'order-khipu', 
        total: 5000,
        payment_method: 'khipu'
      };
      mockSingle.mockResolvedValue({ data: newOrder, error: null });

      const orderData = {
        cartId: 'cart-123',
        items: [{ product_id: 'prod-1', quantity: 1 }],
        userId: 'user-123',
        total: 5000,
        paymentMethod: 'khipu'
        // No paymentFee ni grandTotal
      };

      await checkoutService.createOrder(orderData);
      
      // Verificar que INSERT incluye payment_fee y grand_total como null
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_fee: null,
          grand_total: null
        })
      );
    });
  });
});