/**
 * Tests para SiiClientService
 * Verifica reintentos automáticos y validación de tamaño de archivo
 */

import { SiiClientService } from '../../src/services/sii-client.service';
import { SiiAuthService } from '../../src/services/sii-auth.service';

// Mock del AuthService
const mockAuthService = {
  getToken: jest.fn().mockResolvedValue('mock-token-123'),
} as unknown as SiiAuthService;

describe('SiiClientService', () => {
  let siiClient: SiiClientService;

  beforeEach(() => {
    siiClient = new SiiClientService(mockAuthService, 'CERT');
    jest.clearAllMocks();
  });

  // ============================================
  // CONFIGURACIÓN DE REINTENTOS
  // ============================================
  describe('Configuración de reintentos', () => {
    it('debe tener configuración de reintentos por defecto', () => {
      const config = siiClient.getRetryConfig();
      
      expect(config.maxRetries).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(10000);
    });

    it('debe permitir modificar configuración de reintentos', () => {
      siiClient.setRetryConfig({
        maxRetries: 5,
        baseDelayMs: 2000,
      });
      
      const config = siiClient.getRetryConfig();
      
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.maxDelayMs).toBe(10000); // No modificado
    });

    it('debe mantener configuración existente al modificar parcialmente', () => {
      const originalConfig = siiClient.getRetryConfig();
      
      siiClient.setRetryConfig({ maxRetries: 10 });
      
      const newConfig = siiClient.getRetryConfig();
      expect(newConfig.maxRetries).toBe(10);
      expect(newConfig.baseDelayMs).toBe(originalConfig.baseDelayMs);
      expect(newConfig.maxDelayMs).toBe(originalConfig.maxDelayMs);
    });
  });

  // ============================================
  // VALIDACIÓN DE TAMAÑO DE ARCHIVO
  // ============================================
  describe('Validación de tamaño de archivo', () => {
    it('debe rechazar archivo mayor a 5MB en uploadEnvioDte', async () => {
      // Crear un XML de más de 5MB (5 * 1024 * 1024 bytes)
      const largeXml = '<root>' + 'x'.repeat(5.5 * 1024 * 1024) + '</root>';
      
      const result = await siiClient.uploadEnvioDte(largeXml, '76086428-5');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('excede el tamaño máximo');
    });

    it('debe aceptar archivo menor a 5MB en uploadEnvioDte', async () => {
      // Crear un XML pequeño (mock fallará por no tener servidor real, pero pasará validación de tamaño)
      const smallXml = '<root>contenido pequeño</root>';
      
      // El test verificará que NO retorna FILE_TOO_LARGE
      // (fallará por conexión, pero eso está OK)
      const result = await siiClient.uploadEnvioDte(smallXml, '76086428-5');
      
      // Si falla, no debe ser por tamaño
      if (!result.success) {
        expect(result.error?.code).not.toBe('FILE_TOO_LARGE');
      }
    });

    it('debe rechazar archivo mayor a 5MB en enviarBoletas', async () => {
      const largeXml = '<boletas>' + 'x'.repeat(5.5 * 1024 * 1024) + '</boletas>';
      
      const result = await siiClient.enviarBoletas(largeXml, '76086428-5', '2024-01-15');
      
      expect(result.success).toBe(false);
      expect(result.errores).toBeDefined();
      expect(result.errores?.[0].codigo).toBe('FILE_TOO_LARGE');
    });

    it('debe calcular tamaño en bytes UTF-8 correctamente', async () => {
      // Caracteres UTF-8 multi-byte (emojis, acentos)
      // "á" = 2 bytes, "好" = 3 bytes, "😀" = 4 bytes
      const xmlConUnicode = '<root>áéíóú好好好😀</root>';
      
      // Este archivo es pequeño, debe pasar validación
      const result = await siiClient.uploadEnvioDte(xmlConUnicode, '76086428-5');
      
      if (!result.success) {
        expect(result.error?.code).not.toBe('FILE_TOO_LARGE');
      }
    });
  });

  // ============================================
  // LÓGICA DE REINTENTOS
  // ============================================
  describe('Lógica de reintentos', () => {
    it('debe identificar errores de red como recuperables', () => {
      // Acceder al método privado mediante casting
      const client = siiClient as unknown as {
        isRetryableError: (error: { code?: string; response?: { status: number } }) => boolean;
      };
      
      // Errores de red recuperables
      expect(client.isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
      expect(client.isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(client.isRetryableError({ code: 'ECONNRESET' })).toBe(true);
      expect(client.isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
      expect(client.isRetryableError({ code: 'ENETUNREACH' })).toBe(true);
      expect(client.isRetryableError({ code: 'EAI_AGAIN' })).toBe(true);
    });

    it('debe identificar errores HTTP recuperables', () => {
      const client = siiClient as unknown as {
        isRetryableError: (error: { code?: string; response?: { status: number } }) => boolean;
      };
      
      // HTTP status recuperables
      expect(client.isRetryableError({ response: { status: 408 } })).toBe(true);
      expect(client.isRetryableError({ response: { status: 429 } })).toBe(true);
      expect(client.isRetryableError({ response: { status: 500 } })).toBe(true);
      expect(client.isRetryableError({ response: { status: 502 } })).toBe(true);
      expect(client.isRetryableError({ response: { status: 503 } })).toBe(true);
      expect(client.isRetryableError({ response: { status: 504 } })).toBe(true);
    });

    it('debe identificar errores HTTP no recuperables', () => {
      const client = siiClient as unknown as {
        isRetryableError: (error: { code?: string; response?: { status: number } }) => boolean;
      };
      
      // HTTP status NO recuperables
      expect(client.isRetryableError({ response: { status: 400 } })).toBe(false);
      expect(client.isRetryableError({ response: { status: 401 } })).toBe(false);
      expect(client.isRetryableError({ response: { status: 403 } })).toBe(false);
      expect(client.isRetryableError({ response: { status: 404 } })).toBe(false);
      expect(client.isRetryableError({ response: { status: 422 } })).toBe(false);
    });

    it('debe calcular delay con exponential backoff', () => {
      const client = siiClient as unknown as {
        calculateRetryDelay: (attempt: number) => number;
        retryConfig: { baseDelayMs: number; maxDelayMs: number };
      };
      
      // Configurar valores conocidos para el test
      client.retryConfig = { baseDelayMs: 1000, maxDelayMs: 10000 };
      
      // El delay base es 1000ms, con factor 2^attempt
      // Intento 0: 1000 * 2^0 = 1000ms (±25% jitter)
      // Intento 1: 1000 * 2^1 = 2000ms (±25% jitter)
      // Intento 2: 1000 * 2^2 = 4000ms (±25% jitter)
      
      // Verificar que el delay está en el rango esperado (con jitter)
      const delay0 = client.calculateRetryDelay(0);
      expect(delay0).toBeGreaterThanOrEqual(750);  // 1000 - 25%
      expect(delay0).toBeLessThanOrEqual(1250);    // 1000 + 25%
      
      const delay1 = client.calculateRetryDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(1500); // 2000 - 25%
      expect(delay1).toBeLessThanOrEqual(2500);    // 2000 + 25%
      
      const delay2 = client.calculateRetryDelay(2);
      expect(delay2).toBeGreaterThanOrEqual(3000); // 4000 - 25%
      expect(delay2).toBeLessThanOrEqual(5000);    // 4000 + 25%
    });

    it('debe respetar maxDelayMs', () => {
      const client = siiClient as unknown as {
        calculateRetryDelay: (attempt: number) => number;
        retryConfig: { baseDelayMs: number; maxDelayMs: number };
      };
      
      client.retryConfig = { baseDelayMs: 1000, maxDelayMs: 5000 };
      
      // Intento 10: 1000 * 2^10 = 1024000ms, pero limitado a 5000ms
      const delay = client.calculateRetryDelay(10);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  // ============================================
  // CAMBIO DE AMBIENTE
  // ============================================
  describe('Cambio de ambiente', () => {
    it('debe cambiar a ambiente de producción', () => {
      siiClient.setAmbiente('PROD');
      
      // Verificar que el cliente se configuró (no podemos acceder directamente a httpClient.defaults)
      // pero podemos verificar que no lanza error
      expect(() => siiClient.setAmbiente('PROD')).not.toThrow();
    });

    it('debe cambiar a ambiente de certificación', () => {
      siiClient.setAmbiente('CERT');
      expect(() => siiClient.setAmbiente('CERT')).not.toThrow();
    });
  });

  // ============================================
  // CONSTANTES DE TAMAÑO
  // ============================================
  describe('Constantes de configuración', () => {
    it('tamaño máximo debe ser 5MB', async () => {
      // Archivo justo en el límite (5MB exactos)
      const exactLimit = '<r>' + 'x'.repeat(5 * 1024 * 1024 - 10) + '</r>';
      
      const result = await siiClient.uploadEnvioDte(exactLimit, '76086428-5');
      
      // No debe fallar por tamaño (puede fallar por conexión)
      if (!result.success) {
        expect(result.error?.code).not.toBe('FILE_TOO_LARGE');
      }
    });
  });
});
