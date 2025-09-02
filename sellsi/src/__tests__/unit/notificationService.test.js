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
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
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
        p_user_id: 'supplier_456',
        p_type: 'offer_received',
        p_title: 'Nueva oferta recibida',
        p_message: expect.stringContaining('Test Buyer ha realizado una oferta'),
        p_related_id: 'offer_123',
        p_action_url: '/supplier/offers'
      }));
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
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const incompleteOffer = {
        id: 'offer_123',
        supplier_id: 'supplier_456'
        // Faltan otros campos
      };
      
      await notifyOfferReceived(incompleteOffer);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', 
        expect.objectContaining({
          p_user_id: 'supplier_456',
          p_type: 'offer_received'
        })
      );
    });
  });

  describe('notifyOfferResponse', () => {
    it('debería notificar cuando una oferta es aceptada', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
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
        p_user_id: 'buyer_789',
        p_type: 'offer_accepted',
        p_title: 'Oferta aceptada',
        p_message: expect.stringContaining('Test Supplier ha aceptado tu oferta'),
        p_related_id: 'offer_123',
        p_action_url: '/buyer/offers'
      }));
    });

    it('debería notificar cuando una oferta es rechazada', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
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
        p_user_id: 'buyer_789',
        p_type: 'offer_rejected',
        p_title: 'Oferta rechazada',
        p_message: expect.stringContaining('Test Supplier ha rechazado tu oferta'),
        p_related_id: 'offer_123',
        p_action_url: '/buyer/offers'
      }));
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
        id: 'offer_123',
        buyer_id: 'buyer_789',
        product: { name: 'Test Product' },
        quantity: 5,
        price: 1000
      };
      
      await notifyOfferExpired(offerData);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_user_id: 'buyer_789',
        p_type: 'offer_expired',
        p_title: 'Oferta expirada',
        p_message: expect.stringContaining('Tu oferta por Test Product ha expirado'),
        p_related_id: 'offer_123',
        p_action_url: '/buyer/offers'
      }));
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
