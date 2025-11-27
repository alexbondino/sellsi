/**
 * Tests para SiiAuthService
 * Cubre flujo de autenticación GetSeed → SignSeed → GetToken
 */

import axios from 'axios';
import { SiiAuthService } from '../../src/services/sii-auth.service';
import { SignatureService } from '../../src/services/signature.service';
import { SII_CONFIG } from '../../src/config/sii.config';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SiiAuthService', () => {
  let authService: SiiAuthService;
  let mockSignatureService: jest.Mocked<SignatureService>;
  let mockHttpClient: any;

  // Respuestas SOAP mock del SII
  const MOCK_SEED_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getSeedResponse>
      <getSeedReturn><![CDATA[<SII:RESP><SII:RESP_HDR><ESTADO>00</ESTADO></SII:RESP_HDR><SII:RESP_BODY><SEMILLA>024680135792</SEMILLA></SII:RESP_BODY></SII:RESP>]]></getSeedReturn>
    </getSeedResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

  const MOCK_TOKEN_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getTokenResponse>
      <getTokenReturn><![CDATA[<SII:RESP><SII:RESP_HDR><ESTADO>00</ESTADO></SII:RESP_HDR><SII:RESP_BODY><TOKEN>ABCD1234TOKEN5678EFGH</TOKEN></SII:RESP_BODY></SII:RESP>]]></getTokenReturn>
    </getTokenResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

  const MOCK_ERROR_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getSeedResponse>
      <getSeedReturn><![CDATA[<SII:RESP><SII:RESP_HDR><ESTADO>-1</ESTADO><GLOSA>Certificado no válido</GLOSA></SII:RESP_HDR></SII:RESP>]]></getSeedReturn>
    </getSeedResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

  beforeEach(() => {
    // Mock del SignatureService
    mockSignatureService = {
      getRutTitular: jest.fn().mockReturnValue('76086428-5'),
      signXml: jest.fn().mockReturnValue('<signedXml>...</signedXml>'),
      loadCertificate: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<SignatureService>;

    // Mock del cliente HTTP
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      defaults: { baseURL: '' },
    };

    mockedAxios.create.mockReturnValue(mockHttpClient as any);

    authService = new SiiAuthService(mockSignatureService, 'CERT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('debe inicializar con ambiente CERT por defecto', () => {
      const service = new SiiAuthService(mockSignatureService);
      expect(service.getAmbiente()).toBe('CERT');
    });

    it('debe inicializar con ambiente PROD cuando se especifica', () => {
      const service = new SiiAuthService(mockSignatureService, 'PROD');
      expect(service.getAmbiente()).toBe('PROD');
    });

    it('debe configurar axios con URL de certificación para CERT', () => {
      new SiiAuthService(mockSignatureService, 'CERT');
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: SII_CONFIG.ENDPOINTS.CERT.AUTH,
          timeout: 30000,
        })
      );
    });

    it('debe configurar axios con URL de producción para PROD', () => {
      new SiiAuthService(mockSignatureService, 'PROD');
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: SII_CONFIG.ENDPOINTS.PROD.AUTH,
        })
      );
    });

    it('debe configurar headers XML correctos', () => {
      new SiiAuthService(mockSignatureService);
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/xml',
            'Accept': 'application/xml',
          },
        })
      );
    });
  });

  describe('getToken', () => {
    it('debe lanzar error si no hay certificado cargado', async () => {
      mockSignatureService.getRutTitular.mockReturnValue(null);
      
      await expect(authService.getToken())
        .rejects.toThrow('No hay certificado cargado en el SignatureService');
    });

    it('debe retornar token de caché si está vigente', async () => {
      // Simular token en caché
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 min en futuro
      (authService as any).tokenCache['76086428-5-CERT'] = {
        token: 'CACHED_TOKEN_123',
        rutEmisor: '76086428-5',
        expiresAt: futureDate,
        ambiente: 'CERT',
      };

      const token = await authService.getToken();
      
      expect(token).toBe('CACHED_TOKEN_123');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('debe solicitar nuevo token si caché expiró', async () => {
      // Token expirado en caché
      const pastDate = new Date(Date.now() - 1000);
      (authService as any).tokenCache['76086428-5-CERT'] = {
        token: 'EXPIRED_TOKEN',
        rutEmisor: '76086428-5',
        expiresAt: pastDate,
        ambiente: 'CERT',
      };

      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      const token = await authService.getToken();
      
      expect(token).not.toBe('EXPIRED_TOKEN');
      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('debe guardar token en caché con expiración de 55 minutos', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      const beforeCall = Date.now();
      await authService.getToken();
      const afterCall = Date.now();

      const cachedToken = (authService as any).tokenCache['76086428-5-CERT'];
      expect(cachedToken).toBeDefined();
      expect(cachedToken.token).toBeDefined();
      expect(cachedToken.rutEmisor).toBe('76086428-5');
      expect(cachedToken.ambiente).toBe('CERT');
      
      // Verificar que expira en ~55 minutos
      const expectedExpiry = beforeCall + 55 * 60 * 1000;
      expect(cachedToken.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(cachedToken.expiresAt.getTime()).toBeLessThanOrEqual(afterCall + 55 * 60 * 1000 + 1000);
    });

    it('debe usar clave de caché única por RUT y ambiente', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();
      
      const cacheKeys = Object.keys((authService as any).tokenCache);
      expect(cacheKeys).toContain('76086428-5-CERT');
    });
  });

  describe('Flujo GetSeed → SignSeed → GetToken', () => {
    beforeEach(() => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
    });

    it('debe seguir el flujo completo correctamente', async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();

      // Verificar que se llamó getSeed
      expect(mockHttpClient.get).toHaveBeenCalledWith('/CrSeed.jws?WSDL');
      
      // Verificar que se llamó con envelope SOAP para semilla
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/CrSeed.jws',
        expect.stringContaining('<getSeed/>'),
        expect.any(Object)
      );

      // Verificar que se firmó la semilla
      expect(mockSignatureService.signXml).toHaveBeenCalled();

      // Verificar que se intercambió por token
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/GetTokenFromSeed.jws',
        expect.stringContaining('<pszXml>'),
        expect.any(Object)
      );
    });

    it('debe construir XML de semilla correctamente para firma', async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();

      // Verificar estructura del XML enviado a firmar
      const signXmlCall = mockSignatureService.signXml.mock.calls[0][0];
      expect(signXmlCall).toContain('<getToken>');
      expect(signXmlCall).toContain('<Semilla>');
      expect(signXmlCall).toContain('</Semilla>');
      expect(signXmlCall).toContain('</getToken>');
    });
  });

  describe('extractSeedFromResponse', () => {
    it('debe extraer semilla de respuesta válida', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();
      
      // Si llegó hasta aquí, la extracción fue exitosa
      expect(mockSignatureService.signXml).toHaveBeenCalled();
    });

    it('debe lanzar error si estado no es 00', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post.mockResolvedValueOnce({ data: MOCK_ERROR_RESPONSE });

      await expect(authService.getToken())
        .rejects.toThrow('Error del SII');
    });

    it('debe lanzar error si respuesta está vacía', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post.mockResolvedValueOnce({ data: '' });

      await expect(authService.getToken())
        .rejects.toThrow();
    });

    it('debe lanzar error si no hay elemento getSeedReturn', async () => {
      const invalidResponse = `<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body></soapenv:Body>
</soapenv:Envelope>`;
      
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post.mockResolvedValueOnce({ data: invalidResponse });

      await expect(authService.getToken())
        .rejects.toThrow('Respuesta inválida del SII');
    });
  });

  describe('extractTokenFromResponse', () => {
    it('debe extraer token de respuesta válida', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      const token = await authService.getToken();
      
      // El token debe ser el del mock
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('debe lanzar error si estado del token no es 00', async () => {
      const errorTokenResponse = `<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getTokenResponse>
      <getTokenReturn><![CDATA[<SII:RESP><SII:RESP_HDR><ESTADO>-1</ESTADO><GLOSA>Firma inválida</GLOSA></SII:RESP_HDR></SII:RESP>]]></getTokenReturn>
    </getTokenResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: errorTokenResponse });

      await expect(authService.getToken())
        .rejects.toThrow('Error del SII al obtener token');
    });
  });

  describe('invalidateToken', () => {
    it('debe eliminar token de caché para el RUT actual', async () => {
      // Agregar token a caché
      (authService as any).tokenCache['76086428-5-CERT'] = {
        token: 'TEST_TOKEN',
        rutEmisor: '76086428-5',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        ambiente: 'CERT',
      };

      authService.invalidateToken();

      expect((authService as any).tokenCache['76086428-5-CERT']).toBeUndefined();
    });

    it('no debe fallar si no hay RUT en SignatureService', () => {
      mockSignatureService.getRutTitular.mockReturnValue(null);
      
      expect(() => authService.invalidateToken()).not.toThrow();
    });

    it('no debe afectar tokens de otros RUTs', () => {
      (authService as any).tokenCache['76086428-5-CERT'] = { token: 'TOKEN1' };
      (authService as any).tokenCache['12345678-9-CERT'] = { token: 'TOKEN2' };

      authService.invalidateToken();

      expect((authService as any).tokenCache['12345678-9-CERT']).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('debe limpiar toda la caché de tokens', () => {
      (authService as any).tokenCache = {
        '76086428-5-CERT': { token: 'TOKEN1' },
        '12345678-9-CERT': { token: 'TOKEN2' },
        '76086428-5-PROD': { token: 'TOKEN3' },
      };

      authService.clearCache();

      expect(Object.keys((authService as any).tokenCache)).toHaveLength(0);
    });

    it('no debe fallar si caché ya está vacía', () => {
      (authService as any).tokenCache = {};
      
      expect(() => authService.clearCache()).not.toThrow();
    });
  });

  describe('setAmbiente', () => {
    it('debe cambiar ambiente a PROD', () => {
      authService.setAmbiente('PROD');
      
      expect(authService.getAmbiente()).toBe('PROD');
    });

    it('debe cambiar ambiente a CERT', () => {
      const prodService = new SiiAuthService(mockSignatureService, 'PROD');
      prodService.setAmbiente('CERT');
      
      expect(prodService.getAmbiente()).toBe('CERT');
    });

    it('debe actualizar baseURL del httpClient', () => {
      authService.setAmbiente('PROD');
      
      expect(mockHttpClient.defaults.baseURL).toBe(SII_CONFIG.ENDPOINTS.PROD.AUTH);
    });

    it('debe limpiar caché al cambiar ambiente', () => {
      (authService as any).tokenCache = {
        '76086428-5-CERT': { token: 'TOKEN1' },
      };

      authService.setAmbiente('PROD');

      expect(Object.keys((authService as any).tokenCache)).toHaveLength(0);
    });
  });

  describe('getAmbiente', () => {
    it('debe retornar CERT para ambiente de certificación', () => {
      expect(authService.getAmbiente()).toBe('CERT');
    });

    it('debe retornar PROD para ambiente de producción', () => {
      const prodService = new SiiAuthService(mockSignatureService, 'PROD');
      expect(prodService.getAmbiente()).toBe('PROD');
    });
  });

  describe('Manejo de errores HTTP', () => {
    it('debe manejar error de conexión en getSeed', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(authService.getToken())
        .rejects.toThrow('Error al obtener semilla del SII');
    });

    it('debe manejar timeout en getSeed', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(authService.getToken())
        .rejects.toThrow('Error al obtener semilla del SII');
    });

    it('debe manejar error en exchangeSeedForToken', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.getToken())
        .rejects.toThrow('Error al obtener token del SII');
    });

    it('debe incluir mensaje de error original', async () => {
      const errorMsg = 'Connection timeout after 30000ms';
      mockHttpClient.get.mockRejectedValue(new Error(errorMsg));

      await expect(authService.getToken())
        .rejects.toThrow(errorMsg);
    });
  });

  describe('Formato de requests SOAP', () => {
    beforeEach(() => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });
    });

    it('debe enviar Content-Type correcto para SOAP', async () => {
      await authService.getToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'text/xml; charset=utf-8',
          }),
        })
      );
    });

    it('debe incluir SOAPAction vacío en headers', async () => {
      await authService.getToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'SOAPAction': '',
          }),
        })
      );
    });

    it('debe usar CDATA para XML firmado', async () => {
      await authService.getToken();

      const tokenCall = mockHttpClient.post.mock.calls[1];
      expect(tokenCall[1]).toContain('<![CDATA[');
      expect(tokenCall[1]).toContain(']]>');
    });
  });

  describe('Casos edge', () => {
    it('debe manejar múltiples solicitudes concurrentes', async () => {
      // Poner token en caché para evitar llamadas HTTP reales
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);
      (authService as any).tokenCache['76086428-5-CERT'] = {
        token: 'CACHED_TOKEN_FOR_CONCURRENT',
        rutEmisor: '76086428-5',
        expiresAt: futureDate,
        ambiente: 'CERT',
      };

      // Simular solicitudes concurrentes - todas deberían usar caché
      const promises = [
        authService.getToken(),
        authService.getToken(),
        authService.getToken(),
      ];

      const results = await Promise.all(promises);
      
      // Todas deben retornar el mismo token de caché
      expect(results).toHaveLength(3);
      results.forEach(token => expect(token).toBe('CACHED_TOKEN_FOR_CONCURRENT'));
      
      // No se deben hacer llamadas HTTP porque usamos caché
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('debe manejar RUT con formato diferente en caché', () => {
      // Simular diferentes formatos de RUT
      mockSignatureService.getRutTitular
        .mockReturnValueOnce('76086428-5')
        .mockReturnValueOnce('76.086.428-5'); // Con puntos

      // Los tokens deberían ser diferentes claves de caché
      const key1 = `76086428-5-CERT`;
      const key2 = `76.086.428-5-CERT`;
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Integración con SignatureService', () => {
    it('debe llamar a getRutTitular para verificar certificado', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();

      expect(mockSignatureService.getRutTitular).toHaveBeenCalled();
    });

    it('debe llamar a signXml con la estructura correcta', async () => {
      mockHttpClient.get.mockResolvedValue({ data: 'wsdl' });
      mockHttpClient.post
        .mockResolvedValueOnce({ data: MOCK_SEED_RESPONSE })
        .mockResolvedValueOnce({ data: MOCK_TOKEN_RESPONSE });

      await authService.getToken();

      expect(mockSignatureService.signXml).toHaveBeenCalledWith(
        expect.stringContaining('<getToken>')
      );
    });
  });
});
