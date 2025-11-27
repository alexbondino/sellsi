/**
 * Tests para DteEmissionService
 * Cubre reintentos automáticos y transacciones atómicas
 */

import { DteEmissionService, RetryConfig } from '../../src/services/dte-emission.service';

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ error: null }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

describe('DteEmissionService', () => {
  let service: DteEmissionService;
  const MOCK_URL = 'https://mock.supabase.co';
  const MOCK_KEY = 'mock-anon-key';
  const MOCK_ENCRYPTION_KEY = '0'.repeat(64); // 32 bytes en hex

  beforeEach(() => {
    service = new DteEmissionService(MOCK_URL, MOCK_KEY, MOCK_ENCRYPTION_KEY);
    jest.clearAllMocks();
  });

  describe('Configuración de reintentos', () => {
    it('debería tener configuración por defecto', () => {
      const config = service.getRetryConfig();
      
      expect(config.maxRetries).toBe(3);
      expect(config.initialDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(30000);
      expect(config.backoffMultiplier).toBe(2);
    });

    it('debería aceptar configuración personalizada en constructor', () => {
      const customService = new DteEmissionService(
        MOCK_URL, 
        MOCK_KEY, 
        MOCK_ENCRYPTION_KEY,
        { maxRetries: 5, initialDelayMs: 500 }
      );
      
      const config = customService.getRetryConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.initialDelayMs).toBe(500);
      // Los no especificados mantienen el valor por defecto
      expect(config.maxDelayMs).toBe(30000);
    });

    it('debería permitir cambiar configuración en runtime', () => {
      service.setRetryConfig({ maxRetries: 10 });
      
      const config = service.getRetryConfig();
      expect(config.maxRetries).toBe(10);
      // Los demás no cambian
      expect(config.initialDelayMs).toBe(1000);
    });

    it('debería retornar copia de configuración (inmutabilidad)', () => {
      const config1 = service.getRetryConfig();
      config1.maxRetries = 999;
      
      const config2 = service.getRetryConfig();
      expect(config2.maxRetries).toBe(3); // No afectado por la modificación
    });
  });

  describe('Cálculo de backoff delay', () => {
    it('debería calcular exponential backoff correctamente', () => {
      // Acceder al método privado para testing
      const calculateDelay = (service as any).calculateBackoffDelay.bind(service);
      
      // Intento 0: ~1000ms (con jitter ±20%)
      const delay0 = calculateDelay(0);
      expect(delay0).toBeGreaterThanOrEqual(800);
      expect(delay0).toBeLessThanOrEqual(1200);
      
      // Intento 1: ~2000ms (1000 * 2^1)
      const delay1 = calculateDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(1600);
      expect(delay1).toBeLessThanOrEqual(2400);
      
      // Intento 2: ~4000ms (1000 * 2^2)
      const delay2 = calculateDelay(2);
      expect(delay2).toBeGreaterThanOrEqual(3200);
      expect(delay2).toBeLessThanOrEqual(4800);
    });

    it('debería respetar maxDelayMs', () => {
      service.setRetryConfig({ 
        initialDelayMs: 10000, 
        maxDelayMs: 15000,
        backoffMultiplier: 3 
      });
      
      const calculateDelay = (service as any).calculateBackoffDelay.bind(service);
      
      // Intento 2: 10000 * 3^2 = 90000, pero capeado a 15000
      const delay = calculateDelay(2);
      expect(delay).toBeLessThanOrEqual(18000); // 15000 + 20% jitter
    });
  });

  describe('Detección de errores recuperables', () => {
    it('debería identificar errores de red como recuperables', () => {
      const isRecoverable = (service as any).isRecoverableError.bind(service);
      
      expect(isRecoverable(new Error('Network error'))).toBe(true);
      expect(isRecoverable(new Error('ECONNRESET'))).toBe(true);
      expect(isRecoverable(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRecoverable(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRecoverable(new Error('socket hang up'))).toBe(true);
    });

    it('debería identificar errores de servidor como recuperables', () => {
      const isRecoverable = (service as any).isRecoverableError.bind(service);
      
      expect(isRecoverable(new Error('500 Internal Server Error'))).toBe(true);
      expect(isRecoverable(new Error('502 Bad Gateway'))).toBe(true);
      expect(isRecoverable(new Error('503 Service Unavailable'))).toBe(true);
      expect(isRecoverable(new Error('504 Gateway Timeout'))).toBe(true);
    });

    it('debería identificar rate limiting como recuperable', () => {
      const isRecoverable = (service as any).isRecoverableError.bind(service);
      
      expect(isRecoverable(new Error('Too many requests'))).toBe(true);
      expect(isRecoverable(new Error('Rate limit exceeded'))).toBe(true);
    });

    it('debería identificar errores de negocio como NO recuperables', () => {
      const isRecoverable = (service as any).isRecoverableError.bind(service);
      
      expect(isRecoverable(new Error('RUT inválido'))).toBe(false);
      expect(isRecoverable(new Error('Sin folios disponibles'))).toBe(false);
      expect(isRecoverable(new Error('Certificado expirado'))).toBe(false);
      expect(isRecoverable(new Error('Error de validación'))).toBe(false);
    });
  });

  describe('Lógica de reintentos', () => {
    it('debería ejecutar operación exitosa sin reintentos', async () => {
      const executeWithRetry = (service as any).executeWithRetry.bind(service);
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await executeWithRetry(mockOperation, 'test');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('debería reintentar en errores recuperables', async () => {
      service.setRetryConfig({ maxRetries: 2, initialDelayMs: 10 });
      const executeWithRetry = (service as any).executeWithRetry.bind(service);
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');
      
      const result = await executeWithRetry(mockOperation, 'test');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('debería fallar después de agotar reintentos', async () => {
      service.setRetryConfig({ maxRetries: 2, initialDelayMs: 10 });
      const executeWithRetry = (service as any).executeWithRetry.bind(service);
      
      const mockOperation = jest.fn()
        .mockRejectedValue(new Error('Network error'));
      
      await expect(executeWithRetry(mockOperation, 'test'))
        .rejects.toThrow('Network error');
      
      expect(mockOperation).toHaveBeenCalledTimes(3); // 1 inicial + 2 reintentos
    });

    it('NO debería reintentar errores no recuperables', async () => {
      service.setRetryConfig({ maxRetries: 5, initialDelayMs: 10 });
      const executeWithRetry = (service as any).executeWithRetry.bind(service);
      
      const mockOperation = jest.fn()
        .mockRejectedValue(new Error('RUT inválido'));
      
      await expect(executeWithRetry(mockOperation, 'test'))
        .rejects.toThrow('RUT inválido');
      
      expect(mockOperation).toHaveBeenCalledTimes(1); // Sin reintentos
    });
  });

  describe('Transacción atómica (saveDTEWithTransaction)', () => {
    it('debería intentar usar RPC save_dte_atomic', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockRpc = jest.fn().mockResolvedValue({ error: null });
      
      createClient.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        rpc: mockRpc,
      });
      
      const newService = new DteEmissionService(MOCK_URL, MOCK_KEY, MOCK_ENCRYPTION_KEY);
      
      const saveDTEWithTransaction = (newService as any).saveDTEWithTransaction.bind(newService);
      
      await saveDTEWithTransaction(
        'supplier-123',
        { 
          tipoDte: 33, 
          folio: 1,
          fechaEmision: new Date('2024-01-15'),
          receptor: { rut: '12345678-9', razonSocial: 'Test' }
        },
        { 
          totales: { montoNeto: 1000, montoExento: 0, iva: 190, montoTotal: 1190 },
          dteXml: '<DTE/>'
        },
        'track-123',
        33,
        1
      );
      
      expect(mockRpc).toHaveBeenCalledWith('save_dte_atomic', expect.objectContaining({
        p_supplier_id: 'supplier-123',
        p_tipo_dte: 33,
        p_folio: 1,
        p_track_id: 'track-123',
        p_estado: 'ENVIADO',
      }));
    });

    it('debería hacer fallback si RPC no existe', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockRpc = jest.fn()
        .mockResolvedValueOnce({ 
          error: { code: 'PGRST202', message: 'function does not exist' } 
        })
        .mockResolvedValue({ error: null }); // Para mark_folio_used
      
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: mockInsert,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: mockRpc,
      });
      
      const newService = new DteEmissionService(MOCK_URL, MOCK_KEY, MOCK_ENCRYPTION_KEY);
      const saveDTEWithTransaction = (newService as any).saveDTEWithTransaction.bind(newService);
      
      await saveDTEWithTransaction(
        'supplier-123',
        { 
          tipoDte: 33, 
          folio: 1,
          fechaEmision: new Date('2024-01-15'),
          receptor: { rut: '12345678-9', razonSocial: 'Test' }
        },
        { 
          totales: { montoNeto: 1000, montoExento: 0, iva: 190, montoTotal: 1190 },
          dteXml: '<DTE/>'
        },
        'track-123',
        33,
        1
      );
      
      // Debería haber llamado al insert como fallback
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('Constantes de configuración', () => {
    it('debería tener valores de retry razonables para SII', () => {
      const config = service.getRetryConfig();
      
      // El SII puede ser lento, 3 reintentos es razonable
      expect(config.maxRetries).toBeGreaterThanOrEqual(2);
      expect(config.maxRetries).toBeLessThanOrEqual(5);
      
      // Delay inicial de 1 segundo permite que SII se recupere
      expect(config.initialDelayMs).toBeGreaterThanOrEqual(1000);
      
      // Max delay de 30 segundos evita esperas excesivas
      expect(config.maxDelayMs).toBeLessThanOrEqual(60000);
      
      // Backoff de 2x es estándar
      expect(config.backoffMultiplier).toBe(2);
    });
  });
});
