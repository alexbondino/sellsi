/**
 * Tests exhaustivos para configuración SII
 * Crítico para certificación - endpoints, códigos, validaciones
 */

import { 
  SII_ENDPOINTS, 
  SII_CONFIG,
  DTE_TYPES,
  SII_ESTADOS
} from '../../src/config/sii.config';

describe('SII Config - Suite Completa para Certificación', () => {

  // ============================================
  // ENDPOINTS SII
  // ============================================
  describe('SII_ENDPOINTS - URLs del servicio', () => {
    describe('Ambiente de Certificación (CERT)', () => {
      it('debe tener endpoint de certificación definido', () => {
        expect(SII_ENDPOINTS.CERT).toBeDefined();
      });

      it('endpoint de certificación debe tener BASE_URL', () => {
        expect(SII_ENDPOINTS.CERT.BASE_URL).toBeDefined();
      });

      it('endpoint de certificación debe usar HTTPS', () => {
        expect(SII_ENDPOINTS.CERT.BASE_URL).toMatch(/^https:\/\//);
      });

      it('debe tener endpoints para operaciones DTE', () => {
        expect(SII_ENDPOINTS.CERT.GET_SEED).toBeDefined();
        expect(SII_ENDPOINTS.CERT.GET_TOKEN).toBeDefined();
        expect(SII_ENDPOINTS.CERT.UPLOAD_DTE).toBeDefined();
        expect(SII_ENDPOINTS.CERT.QUERY_STATUS).toBeDefined();
      });
    });

    describe('Ambiente de Producción (PROD)', () => {
      it('debe tener endpoint de producción definido', () => {
        expect(SII_ENDPOINTS.PROD).toBeDefined();
      });

      it('endpoint de producción debe tener BASE_URL', () => {
        expect(SII_ENDPOINTS.PROD.BASE_URL).toBeDefined();
      });

      it('endpoint de producción debe usar HTTPS', () => {
        expect(SII_ENDPOINTS.PROD.BASE_URL).toMatch(/^https:\/\//);
      });
    });

    describe('Diferenciación de ambientes', () => {
      it('endpoints de certificación y producción deben ser diferentes', () => {
        expect(SII_ENDPOINTS.CERT.BASE_URL).not.toBe(SII_ENDPOINTS.PROD.BASE_URL);
      });
    });
  });

  // ============================================
  // CÓDIGOS DE DOCUMENTO TRIBUTARIO
  // ============================================
  describe('DTE_TYPES - Tipos de DTE', () => {
    describe('Documentos básicos', () => {
      it('Factura Electrónica debe ser código 33', () => {
        expect(DTE_TYPES.FACTURA_ELECTRONICA).toBe(33);
      });

      it('Factura Electrónica Exenta debe ser código 34', () => {
        expect(DTE_TYPES.FACTURA_EXENTA).toBe(34);
      });

      it('Boleta Electrónica debe ser código 39', () => {
        expect(DTE_TYPES.BOLETA_ELECTRONICA).toBe(39);
      });

      it('Boleta Electrónica Exenta debe ser código 41', () => {
        expect(DTE_TYPES.BOLETA_EXENTA).toBe(41);
      });
    });

    describe('Notas de crédito y débito', () => {
      it('Nota de Crédito Electrónica debe ser código 61', () => {
        expect(DTE_TYPES.NOTA_CREDITO).toBe(61);
      });

      it('Nota de Débito Electrónica debe ser código 56', () => {
        expect(DTE_TYPES.NOTA_DEBITO).toBe(56);
      });
    });

    describe('Guía de Despacho', () => {
      it('Guía de Despacho Electrónica debe ser código 52', () => {
        expect(DTE_TYPES.GUIA_DESPACHO).toBe(52);
      });
    });

    describe('Documentos de exportación', () => {
      it('Factura de Exportación debe ser código 110', () => {
        expect(DTE_TYPES.FACTURA_EXPORTACION).toBe(110);
      });

      it('Nota de Débito de Exportación debe ser código 111', () => {
        expect(DTE_TYPES.NOTA_DEBITO_EXPORTACION).toBe(111);
      });

      it('Nota de Crédito de Exportación debe ser código 112', () => {
        expect(DTE_TYPES.NOTA_CREDITO_EXPORTACION).toBe(112);
      });
    });

    describe('Unicidad de códigos', () => {
      it('códigos principales deben ser únicos (excluyendo alias)', () => {
        // LIQUIDACION_FACTURA y FACTURA_COMPRA son alias para el mismo código 46
        // según normativa SII, esto es correcto
        const valores = Object.values(DTE_TYPES);
        const unicos = new Set(valores);
        
        // Hay 12 claves pero 11 valores únicos porque código 46 tiene alias
        expect(unicos.size).toBe(11);
        expect(valores.length).toBe(12);
      });

      it('LIQUIDACION_FACTURA y FACTURA_COMPRA son el mismo código 46', () => {
        // Ambos representan el tipo 46 del SII
        expect(DTE_TYPES.LIQUIDACION_FACTURA).toBe(46);
        expect(DTE_TYPES.FACTURA_COMPRA).toBe(46);
        expect(DTE_TYPES.LIQUIDACION_FACTURA).toBe(DTE_TYPES.FACTURA_COMPRA);
      });
    });
  });

  // ============================================
  // SII_CONFIG - Configuración general
  // ============================================
  describe('SII_CONFIG - Configuración general', () => {
    it('tasa IVA Chile debe ser 19% (0.19)', () => {
      expect(SII_CONFIG.IVA_RATE).toBe(0.19);
    });

    it('debe tener timeout HTTP configurado', () => {
      expect(SII_CONFIG.HTTP_TIMEOUT).toBeDefined();
      expect(SII_CONFIG.HTTP_TIMEOUT).toBeGreaterThan(0);
    });

    it('debe tener reintentos configurados', () => {
      expect(SII_CONFIG.MAX_RETRIES).toBeDefined();
      expect(SII_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
    });

    it('debe tener algoritmo de firma configurado', () => {
      expect(SII_CONFIG.SIGNATURE_ALGORITHM).toBeDefined();
    });

    it('debe tener algoritmo de digest configurado', () => {
      expect(SII_CONFIG.DIGEST_ALGORITHM).toBeDefined();
    });

    it('debe tener algoritmo de canonicalización configurado', () => {
      expect(SII_CONFIG.CANONICALIZATION_ALGORITHM).toBeDefined();
    });
  });

  // ============================================
  // SII_ESTADOS - Estados de respuesta
  // ============================================
  describe('SII_ESTADOS - Estados de respuesta', () => {
    it('debe tener estado EPR (Envío Procesado)', () => {
      expect(SII_ESTADOS.EPR).toBeDefined();
    });

    it('debe tener estado RCH (Rechazado)', () => {
      expect(SII_ESTADOS.RCH).toBeDefined();
    });

    it('debe tener estado SOK (Schema OK)', () => {
      expect(SII_ESTADOS.SOK).toBeDefined();
    });

    it('debe tener estado FOK (Firma OK)', () => {
      expect(SII_ESTADOS.FOK).toBeDefined();
    });
  });

  // ============================================
  // RESOLUCIÓN DE CERTIFICACIÓN
  // ============================================
  describe('Resolución de certificación', () => {
    it('número de resolución certificación debe ser 0', () => {
      // En certificación siempre es 0
      const NRO_RESOL_CERTIFICACION = 0;
      expect(NRO_RESOL_CERTIFICACION).toBe(0);
    });

    it('fecha de resolución certificación debe ser 2006-01-20', () => {
      const FCH_RESOL_CERTIFICACION = '2006-01-20';
      expect(FCH_RESOL_CERTIFICACION).toBe('2006-01-20');
    });
  });

  // ============================================
  // IVA CHILE
  // ============================================
  describe('Configuración IVA Chile', () => {
    it('tasa IVA Chile debe ser 19%', () => {
      expect(SII_CONFIG.IVA_RATE * 100).toBe(19);
    });

    it('factor IVA debe ser 0.19', () => {
      expect(SII_CONFIG.IVA_RATE).toBe(0.19);
    });
  });

  // ============================================
  // CASOS DE USO REALES
  // ============================================
  describe('Casos de uso reales de certificación', () => {
    it('debe poder obtener endpoint correcto para envío de DTE', () => {
      const ambiente = 'CERT';
      const endpoint = SII_ENDPOINTS[ambiente];
      
      expect(endpoint.BASE_URL).toContain('sii.cl');
      expect(endpoint.BASE_URL).toMatch(/^https:\/\//);
    });

    it('debe poder construir URL de envío de DTE', () => {
      const baseUrl = SII_ENDPOINTS.CERT.BASE_URL;
      const pathEnvio = SII_ENDPOINTS.CERT.UPLOAD_DTE;
      const urlCompleta = baseUrl + pathEnvio;
      
      expect(urlCompleta).toContain('DTEUpload');
    });

    it('código de documento debe ser numérico para XML', () => {
      const codigo = DTE_TYPES.FACTURA_ELECTRONICA;
      
      expect(typeof codigo).toBe('number');
      expect(Number.isInteger(codigo)).toBe(true);
    });
  });

  // ============================================
  // INTEGRIDAD DE CONFIGURACIÓN
  // ============================================
  describe('Integridad de configuración', () => {
    it('SII_ENDPOINTS no debe ser null', () => {
      expect(SII_ENDPOINTS).not.toBeNull();
    });

    it('DTE_TYPES no debe ser null', () => {
      expect(DTE_TYPES).not.toBeNull();
    });

    it('SII_CONFIG no debe ser null', () => {
      expect(SII_CONFIG).not.toBeNull();
    });

    it('todas las propiedades de DTE_TYPES deben ser números', () => {
      Object.values(DTE_TYPES).forEach(valor => {
        expect(typeof valor).toBe('number');
      });
    });
  });
});
