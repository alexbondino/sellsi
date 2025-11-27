/**
 * Tests para la configuración del SII
 */

import { SII_CONFIG } from '../../src/config/sii.config';

describe('SII Config', () => {
  describe('SII_CONFIG', () => {
    it('debe tener tasa de IVA definida', () => {
      expect(SII_CONFIG.IVA_RATE).toBe(0.19);
    });

    it('debe tener timeout HTTP definido', () => {
      expect(SII_CONFIG.HTTP_TIMEOUT).toBeGreaterThan(0);
    });

    it('debe tener endpoints definidos', () => {
      expect(SII_CONFIG.ENDPOINTS).toBeDefined();
      expect(SII_CONFIG.ENDPOINTS.CERT).toBeDefined();
      expect(SII_CONFIG.ENDPOINTS.PROD).toBeDefined();
    });

    it('debe tener endpoints de certificación correctos', () => {
      expect(SII_CONFIG.ENDPOINTS.CERT.AUTH).toContain('palena.sii.cl');
      expect(SII_CONFIG.ENDPOINTS.CERT.DTE).toContain('palena.sii.cl');
    });

    it('debe tener endpoints de producción correctos', () => {
      // Producción usa hercules.sii.cl para DTE
      expect(SII_CONFIG.ENDPOINTS.PROD.AUTH).toContain('sii.cl');
      expect(SII_CONFIG.ENDPOINTS.PROD.DTE).toContain('sii.cl');
    });

    it('debe tener algoritmos de firma configurados', () => {
      expect(SII_CONFIG.SIGNATURE_ALGORITHM).toBeDefined();
      expect(SII_CONFIG.DIGEST_ALGORITHM).toBeDefined();
    });
  });
});
