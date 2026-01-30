import { mockSupabase } from '../mocks/supabaseMock';

// Mock de Supabase ANTES de importar el servicio
jest.mock('../../services/supabase', () => ({
  supabase: mockSupabase
}));

import { 
  notifyOfferReceived, 
  notifyOfferResponse, 
  notifyOfferExpired 
} from '../../domains/notifications/services/notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyOfferReceived', () => {
    it('debería crear notificación cuando el proveedor recibe una oferta', async () => {
      // Respuesta realista del RPC
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'notif_1' }, error: null });
      
      const offerData = {
        id: 'offer_123',
        supplier_id: 'supplier_456',
        product: { name: 'Test Product' },
        buyer: { name: 'Test Buyer' },
        quantity: 5,
        price: 1000
      };
      
      await notifyOfferReceived(offerData);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_payload: expect.objectContaining({
          p_user_id: 'supplier_456',
          p_type: 'offer_received',
          p_title: 'Nueva oferta recibida',
          p_related_id: 'offer_123',
          p_action_url: '/supplier/offers'
        })
      }));

      // Aserción no complaciente: verificar que BODY o MESSAGE contiene comprador y producto
      const payload = mockSupabase.rpc.mock.calls[0][1].p_payload;
      const combined = String(payload.p_message || '') + ' ' + String(payload.p_body || '');
      expect(combined).toMatch(/(?=.*Test Buyer)(?=.*Test Product)/);
    });

    it('debería manejar errores al crear notificación', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      const offerData = {
        id: 'offer_123',
        supplier_id: 'supplier_456',
        product: { name: 'Test Product' },
        buyer: { name: 'Test Buyer' },
        quantity: 5,
        price: 1000
      };
      
      // No debería lanzar error, solo loggear
      await expect(notifyOfferReceived(offerData)).resolves.not.toThrow();
    });

    it('debería manejar datos faltantes graciosamente', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'notif_2' }, error: null });
      
      const incompleteOffer = {
        id: 'offer_123',
        supplier_id: 'supplier_456'
        // Faltan otros campos
      };
      
      await notifyOfferReceived(incompleteOffer);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', 
        expect.objectContaining({
          p_payload: expect.objectContaining({
            p_user_id: 'supplier_456',
            p_type: 'offer_received'
          })
        })
      );

      // No debería contener 'undefined' en el mensaje
      const payload = mockSupabase.rpc.mock.calls[0][1].p_payload;
      expect(payload.p_message).not.toContain('undefined');
    });

    it('debería devolver estructura con metadata en caso de éxito', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const offerData = {
        offer_id: 'offer_456',
        supplier_id: 'supplier_456',
        product_name: 'X',
        buyer_name: 'B',
        offered_quantity: 1,
        offered_price: 100,
        expires_at: new Date().toISOString()
      };

      const res = await notifyOfferReceived(offerData);
      expect(res).toEqual(expect.objectContaining({ success: true, related_id: 'offer_456' }));
      expect(res.metadata).toBeDefined();
      expect(res.metadata.offer_id).toBe('offer_456');
    });

    it('debería manejar rechazo del RPC (promise reject) sin lanzar', async () => {
      mockSupabase.rpc.mockRejectedValueOnce(new Error('RPC boom'));

      const offerData = {
        id: 'offer_789',
        supplier_id: 'supplier_999',
        product: { name: 'P' },
        buyer: { name: 'C' }
      };

      const res = await notifyOfferReceived(offerData);
      expect(res).toHaveProperty('error');
      expect(res.error).toBeInstanceOf(Error);
      expect(res.error.message).toBe('RPC boom');
    });

    it('debería soportar campos legacy buyer_name/product_name', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const offerData = {
        id: 'offer_legacy',
        supplier_id: 'supplier_legacy',
        buyer_name: 'Legacy Buyer',
        product_name: 'Legacy Product'
      };

      await notifyOfferReceived(offerData);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_payload: expect.objectContaining({
          p_user_id: 'supplier_legacy',
          p_type: 'offer_received',
          p_message: expect.stringContaining('Legacy Buyer')
        })
      }));
    });
  });

  describe('notifyOfferResponse', () => {
    it('debería notificar cuando una oferta es aceptada', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'n_accept' }, error: null });
      
      const offerData = {
        id: 'offer_123',
        buyer_id: 'buyer_789',
        product: { name: 'Test Product' },
        supplier: { name: 'Test Supplier' },
        quantity: 5,
        price: 1000
      };
      
      await notifyOfferResponse(offerData, 'accepted');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_payload: expect.objectContaining({
          p_user_id: 'buyer_789',
          p_type: 'offer_accepted',
          p_title: 'Oferta aceptada',
          p_related_id: 'offer_123',
          p_action_url: '/buyer/offers'
        })
      }));

      const payloadAccept = mockSupabase.rpc.mock.calls[0][1].p_payload;
      expect(String(payloadAccept.p_message || '') + ' ' + String(payloadAccept.p_body || '')).toMatch(/(?=.*Test Supplier)(?=.*Test Product)/);
    });

    it('debería notificar cuando una oferta es rechazada', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'n_rej' }, error: null });
      
      const offerData = {
        id: 'offer_123',
        buyer_id: 'buyer_789',
        product: { name: 'Test Product' },
        supplier: { name: 'Test Supplier' },
        quantity: 5,
        price: 1000
      };
      
      await notifyOfferResponse(offerData, 'rejected');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_payload: expect.objectContaining({
          p_user_id: 'buyer_789',
          p_type: 'offer_rejected',
          p_title: 'Oferta rechazada',
          p_related_id: 'offer_123',
          p_action_url: '/buyer/offers'
        })
      }));

      const payloadReject = mockSupabase.rpc.mock.calls[0][1].p_payload;
      expect(String(payloadReject.p_message || '') + ' ' + String(payloadReject.p_body || '')).toMatch(/(?=.*Test Supplier)(?=.*Test Product)/);
    });

    it('debería manejar status inválido', async () => {
      const offerData = {
        id: 'offer_123',
        buyer_id: 'buyer_789',
        product: { name: 'Test Product' },
        supplier: { name: 'Test Supplier' }
      };
      
      await notifyOfferResponse(offerData, 'invalid_status');
      
      // No debería llamar a la base de datos con status inválido
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('notifyOfferExpired', () => {
    it('debería notificar cuando una oferta expira', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const offerData = {
        offer_id: 'offer_123',
        buyer_id: 'buyer_789',
        product: { name: 'Test Product' },
        quantity: 5,
        price: 1000
      };
      
      const res = await notifyOfferExpired(offerData);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_payload: expect.objectContaining({
          p_user_id: 'buyer_789',
          p_type: 'offer_expired',
          p_title: 'Oferta expirada',
          p_message: expect.stringContaining('Tu oferta por Test Product ha expirado'),
          p_related_id: 'offer_123',
          p_action_url: '/buyer/offers'
        })
      }));

      // Verificar metadata devuelta
      expect(res).toEqual(expect.objectContaining({ success: true }));
      expect(res.metadata).toBeDefined();
      expect(res.metadata.offer_id).toBe('offer_123');
      expect(typeof res.metadata.expired_at).toBe('string');
      expect(isNaN(Date.parse(res.metadata.expired_at))).toBe(false);
    });

    it('debería manejar ofertas sin buyer_id', async () => {
      const offerData = {
        id: 'offer_123',
        product: { name: 'Test Product' },
        quantity: 5,
        price: 1000
        // Sin buyer_id
      };
      
      await notifyOfferExpired(offerData);
      
      // No debería llamar a la base de datos sin buyer_id
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });
});
