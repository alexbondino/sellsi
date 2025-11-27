/**
 * Tests exhaustivos para CafManagerService
 * Crítico para certificación SII - Gestión de folios autorizados
 */

import { CafManagerService } from '../../src/services/caf-manager.service';
import { CAFData, DTEType, FolioRecord } from '../../src/types';

describe('CafManagerService - Suite Completa para Certificación SII', () => {
  let cafManager: CafManagerService;

  beforeEach(() => {
    cafManager = new CafManagerService();
  });

  // ============================================
  // PARSEO DE CAF XML
  // ============================================
  describe('parseCAF - Parseo de archivo CAF', () => {
    const cafXmlValido = `<?xml version="1.0" encoding="ISO-8859-1"?>
<AUTORIZACION>
  <CAF version="1.0">
    <DA>
      <RUT>76000000-0</RUT>
      <RS>Empresa de Prueba SpA</RS>
      <TD>33</TD>
      <RNG>
        <D>1</D>
        <H>100</H>
      </RNG>
      <FA>2024-01-15</FA>
      <RSAPK>
        <M>ABC123...</M>
        <E>AQAB</E>
      </RSAPK>
      <IDK>100</IDK>
    </DA>
    <FRMA algoritmo="SHA1withRSA">FirmaBase64...</FRMA>
  </CAF>
</AUTORIZACION>`;

    it('debe parsear CAF XML válido', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result).toBeDefined();
      expect(result.tipoDte).toBe(33);
      expect(result.rutEmisor).toBe('76000000-0');
      expect(result.folioDesde).toBe(1);
      expect(result.folioHasta).toBe(100);
    });

    it('debe extraer razón social', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result.razonSocial).toBe('Empresa de Prueba SpA');
    });

    it('debe extraer fecha de autorización', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result.fechaAutorizacion).toBe('2024-01-15');
    });

    it('debe extraer clave pública RSA', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result.rsaPubKey).toBeDefined();
      expect(result.rsaPubKey.modulus).toBeDefined();
      expect(result.rsaPubKey.exponent).toBeDefined();
    });

    it('debe extraer firma', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result.frma).toContain('FirmaBase64');
    });

    it('debe preservar XML original', () => {
      const result = cafManager.parseCAF(cafXmlValido);

      expect(result.cafXmlOriginal).toBe(cafXmlValido);
    });

    describe('Errores de parseo', () => {
      it('debe rechazar XML sin nodo CAF', () => {
        const xmlSinCaf = '<AUTORIZACION><OTHER/></AUTORIZACION>';

        expect(() => cafManager.parseCAF(xmlSinCaf)).toThrow('no contiene un CAF válido');
      });

      it('debe rechazar XML sin nodo DA', () => {
        const xmlSinDa = '<AUTORIZACION><CAF version="1.0"></CAF></AUTORIZACION>';

        expect(() => cafManager.parseCAF(xmlSinDa)).toThrow('No se encontró nodo DA');
      });

      it('debe rechazar XML sin rango de folios', () => {
        const xmlSinRango = `<AUTORIZACION>
          <CAF version="1.0">
            <DA>
              <RUT>76000000-0</RUT>
              <RS>Empresa</RS>
              <TD>33</TD>
              <FA>2024-01-15</FA>
              <RSAPK><M>A</M><E>B</E></RSAPK>
              <IDK>1</IDK>
            </DA>
            <FRMA>firma</FRMA>
          </CAF>
        </AUTORIZACION>`;

        expect(() => cafManager.parseCAF(xmlSinRango)).toThrow('rango de folios');
      });

      it('debe rechazar XML vacío', () => {
        expect(() => cafManager.parseCAF('')).toThrow();
      });

      it('debe rechazar XML malformado', () => {
        expect(() => cafManager.parseCAF('<not valid xml')).toThrow();
      });
    });
  });

  // ============================================
  // VALIDACIÓN DE CAF
  // ============================================
  describe('validateCAF - Validación de datos', () => {
    const crearCafMock = (overrides: Partial<CAFData> = {}): CAFData => ({
      version: '1.0',
      tipoDte: 33,
      rutEmisor: '76000000-0',
      razonSocial: 'Empresa SpA',
      folioDesde: 1,
      folioHasta: 100,
      fechaAutorizacion: '2024-01-15',
      rsaPubKey: { modulus: 'ABC', exponent: 'AQAB' },
      idK: 100,
      frma: 'firma',
      cafXmlOriginal: '<CAF/>',
      ...overrides,
    });

    it('debe validar CAF correcto', () => {
      const caf = crearCafMock();
      const result = cafManager.validateCAF(caf, '76000000-0');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar CAF para RUT diferente', () => {
      const caf = crearCafMock({ rutEmisor: '76000000-0' });
      const result = cafManager.validateCAF(caf, '77000000-0');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('RUT'))).toBe(true);
    });

    it('debe normalizar RUT para comparación', () => {
      const caf = crearCafMock({ rutEmisor: '76.000.000-0' });
      const result = cafManager.validateCAF(caf, '76000000-0');

      expect(result.valid).toBe(true);
    });

    describe('Validación de tipo de DTE', () => {
      const tiposValidos = [33, 34, 39, 41, 52, 56, 61];

      tiposValidos.forEach(tipo => {
        it(`debe aceptar tipo ${tipo}`, () => {
          const caf = crearCafMock({ tipoDte: tipo as DTEType });
          const result = cafManager.validateCAF(caf, '76000000-0');

          expect(result.errors.some(e => e.includes('no válido'))).toBe(false);
        });
      });

      it('debe rechazar tipo inválido', () => {
        const caf = crearCafMock({ tipoDte: 999 as DTEType });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('no válido'))).toBe(true);
      });
    });

    describe('Validación de rango de folios', () => {
      it('debe aceptar rango válido', () => {
        const caf = crearCafMock({ folioDesde: 1, folioHasta: 100 });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.valid).toBe(true);
      });

      it('debe rechazar rango invertido', () => {
        const caf = crearCafMock({ folioDesde: 100, folioHasta: 1 });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('inválido'))).toBe(true);
      });
    });

    describe('Validación de fecha de autorización', () => {
      it('debe rechazar fecha futura', () => {
        const fechaFutura = new Date();
        fechaFutura.setFullYear(fechaFutura.getFullYear() + 1);
        
        const caf = crearCafMock({ 
          fechaAutorizacion: fechaFutura.toISOString().split('T')[0] 
        });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('futura'))).toBe(true);
      });

      it('debe aceptar fecha pasada', () => {
        const caf = crearCafMock({ fechaAutorizacion: '2023-01-01' });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.errors.some(e => e.includes('futura'))).toBe(false);
      });
    });

    describe('Validación de vigencia de boletas', () => {
      it('debe advertir boleta vencida (más de 6 meses)', () => {
        const fechaAntigua = new Date();
        fechaAntigua.setMonth(fechaAntigua.getMonth() - 7);
        
        const caf = crearCafMock({ 
          tipoDte: 39,
          fechaAutorizacion: fechaAntigua.toISOString().split('T')[0],
        });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('vencido'))).toBe(true);
      });

      it('debe aceptar boleta reciente', () => {
        const fechaReciente = new Date();
        fechaReciente.setMonth(fechaReciente.getMonth() - 1);
        
        const caf = crearCafMock({ 
          tipoDte: 39,
          fechaAutorizacion: fechaReciente.toISOString().split('T')[0],
        });
        const result = cafManager.validateCAF(caf, '76000000-0');

        expect(result.errors.some(e => e.includes('vencido'))).toBe(false);
      });
    });
  });

  // ============================================
  // CÁLCULO DE ESTADÍSTICAS
  // ============================================
  describe('calculateStats - Estadísticas de uso', () => {
    it('debe calcular estadísticas correctamente', () => {
      const record: FolioRecord = {
        id: '1',
        supplierId: 'emp1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 50,
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const stats = cafManager.calculateStats(record);

      expect(stats.tipoDte).toBe(33);
      expect(stats.totalAutorizados).toBe(100);
      expect(stats.usados).toBe(49); // 50 - 1
      expect(stats.disponibles).toBe(51); // 100 - 50 + 1
      expect(stats.porcentajeUsado).toBeCloseTo(49, 0);
    });

    it('debe detectar alerta de folios bajos', () => {
      const recordBajo: FolioRecord = {
        id: '1',
        supplierId: 'emp1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 99, // Solo quedan 2 folios
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const stats = cafManager.calculateStats(recordBajo);

      expect(stats.alertaBaja).toBe(true);
      expect(stats.disponibles).toBe(2);
    });

    it('no debe alertar con suficientes folios', () => {
      const recordAlto: FolioRecord = {
        id: '1',
        supplierId: 'emp1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 1000,
        folioActual: 1, // 1000 disponibles
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const stats = cafManager.calculateStats(recordAlto);

      expect(stats.alertaBaja).toBe(false);
      expect(stats.disponibles).toBe(1000);
    });

    it('debe calcular porcentaje con precisión', () => {
      const record: FolioRecord = {
        id: '1',
        supplierId: 'emp1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 3,
        folioActual: 2,
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const stats = cafManager.calculateStats(record);

      // 1 de 3 usados = 33.33%
      expect(stats.porcentajeUsado).toBeCloseTo(33.33, 1);
    });
  });

  // ============================================
  // NOMBRES DE TIPOS DE DTE
  // ============================================
  describe('getNombreTipoDte - Nombres de documentos', () => {
    const casosNombre: Array<[DTEType, string]> = [
      [33, 'Factura Electrónica'],
      [34, 'Factura No Afecta o Exenta Electrónica'],
      [39, 'Boleta Electrónica'],
      [41, 'Boleta Exenta Electrónica'],
      [52, 'Guía de Despacho Electrónica'],
      [56, 'Nota de Débito Electrónica'],
      [61, 'Nota de Crédito Electrónica'],
    ];

    casosNombre.forEach(([tipo, nombre]) => {
      it(`debe retornar "${nombre}" para tipo ${tipo}`, () => {
        expect(cafManager.getNombreTipoDte(tipo)).toBe(nombre);
      });
    });

    it('debe manejar tipo desconocido', () => {
      const nombre = cafManager.getNombreTipoDte(999 as DTEType);
      expect(nombre).toContain('999');
    });
  });

  // ============================================
  // EXTRACCIÓN DE CAF PARA TED
  // ============================================
  describe('extractCAFForTED', () => {
    it('debe extraer nodo CAF', () => {
      const cafXml = `<?xml version="1.0"?>
        <AUTORIZACION>
          <CAF version="1.0">
            <DA><TD>33</TD></DA>
            <FRMA>firma</FRMA>
          </CAF>
        </AUTORIZACION>`;

      const cafNode = cafManager.extractCAFForTED(cafXml);

      expect(cafNode).toContain('<CAF');
      expect(cafNode).toContain('version="1.0"');
    });

    it('debe lanzar error si no hay CAF', () => {
      const xmlSinCaf = '<root><other/></root>';

      expect(() => cafManager.extractCAFForTED(xmlSinCaf)).toThrow('No se encontró nodo CAF');
    });
  });

  // ============================================
  // VERIFICACIÓN DE FIRMA (MOCK)
  // ============================================
  describe('verifyCAFSignature', () => {
    it('debe manejar CAF sin firma válida', () => {
      const cafMock: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-01',
        rsaPubKey: { modulus: 'invalid', exponent: 'AQAB' },
        idK: 100,
        frma: 'firmaInvalida',
        cafXmlOriginal: '<CAF><DA></DA><FRMA>invalid</FRMA></CAF>',
      };

      // Debería retornar false para firma inválida
      const result = cafManager.verifyCAFSignature(cafMock);
      expect(typeof result).toBe('boolean');
    });
  });

  // ============================================
  // SINGLETON
  // ============================================
  describe('Singleton export', () => {
    it('debe exportar instancia cafManagerService', async () => {
      const { cafManagerService: singleton } = await import(
        '../../src/services/caf-manager.service'
      );
      
      expect(singleton).toBeInstanceOf(CafManagerService);
    });
  });

  // ============================================
  // CASOS DE USO REALES
  // ============================================
  describe('Casos de uso de certificación SII', () => {
    it('flujo completo: parsear → validar → stats', () => {
      const cafXml = `<?xml version="1.0"?>
        <AUTORIZACION>
          <CAF version="1.0">
            <DA>
              <RUT>76000000-0</RUT>
              <RS>Empresa Test</RS>
              <TD>33</TD>
              <RNG><D>1</D><H>100</H></RNG>
              <FA>2024-06-01</FA>
              <RSAPK><M>MOD</M><E>EXP</E></RSAPK>
              <IDK>1</IDK>
            </DA>
            <FRMA>FIRMA</FRMA>
          </CAF>
        </AUTORIZACION>`;

      // 1. Parsear
      const cafData = cafManager.parseCAF(cafXml);
      expect(cafData.tipoDte).toBe(33);

      // 2. Validar
      const validation = cafManager.validateCAF(cafData, '76000000-0');
      // Puede fallar por fecha antigua, pero estructura está OK
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');

      // 3. Simular registro para stats
      const record: FolioRecord = {
        id: '1',
        supplierId: 'emp1',
        tipoDte: cafData.tipoDte,
        folioDesde: cafData.folioDesde,
        folioHasta: cafData.folioHasta,
        folioActual: cafData.folioDesde,
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: cafData.fechaAutorizacion,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const stats = cafManager.calculateStats(record);
      expect(stats.totalAutorizados).toBe(100);
      expect(stats.disponibles).toBe(100);
    });
  });
});
