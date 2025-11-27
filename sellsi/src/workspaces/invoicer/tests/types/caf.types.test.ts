/**
 * Tests exhaustivos para tipos CAF
 * Verificación de estructuras de Código de Autorización de Folios
 */

import { 
  CAFData, 
  FolioRecord, 
  NextFolioResult, 
  CAFStats 
} from '../../src/types/caf.types';
import { DTEType } from '../../src/types/dte.types';

describe('CAF Types - Suite Completa para Certificación SII', () => {

  // ============================================
  // CAFData Interface
  // ============================================
  describe('CAFData Interface', () => {
    it('debe aceptar CAF completo', () => {
      const caf: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa de Prueba SpA',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-15',
        rsaPubKey: {
          modulus: 'base64ModulusString...',
          exponent: 'AQAB'
        },
        idK: 100,
        frma: 'base64SignatureString...',
        cafXmlOriginal: '<?xml version="1.0"?><AUTORIZACION>...</AUTORIZACION>'
      };

      expect(caf.version).toBe('1.0');
      expect(caf.tipoDte).toBe(33);
      expect(caf.folioDesde).toBeLessThan(caf.folioHasta);
    });

    it('debe soportar todos los tipos de DTE', () => {
      const tipos: DTEType[] = [33, 34, 39, 41, 46, 52, 56, 61];

      tipos.forEach(tipo => {
        const caf: CAFData = {
          version: '1.0',
          tipoDte: tipo,
          rutEmisor: '76000000-0',
          razonSocial: 'Empresa',
          folioDesde: 1,
          folioHasta: 100,
          fechaAutorizacion: '2024-01-01',
          rsaPubKey: { modulus: 'M', exponent: 'E' },
          idK: 1,
          frma: 'firma',
          cafXmlOriginal: '<CAF/>'
        };

        expect(caf.tipoDte).toBe(tipo);
      });
    });

    it('rsaPubKey debe contener modulus y exponent', () => {
      const caf: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-01',
        rsaPubKey: {
          modulus: 'ABCDEFmodulus123==',
          exponent: 'AQAB'
        },
        idK: 100,
        frma: 'firma',
        cafXmlOriginal: '<CAF/>'
      };

      expect(caf.rsaPubKey.modulus).toBeDefined();
      expect(caf.rsaPubKey.exponent).toBeDefined();
      // AQAB es el exponente común 65537 en Base64
      expect(caf.rsaPubKey.exponent).toBe('AQAB');
    });

    it('debe preservar XML original para TED', () => {
      const xmlOriginal = `<?xml version="1.0" encoding="ISO-8859-1"?>
<AUTORIZACION>
  <CAF version="1.0">
    <DA>...</DA>
    <FRMA>...</FRMA>
  </CAF>
</AUTORIZACION>`;

      const caf: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-01',
        rsaPubKey: { modulus: 'M', exponent: 'E' },
        idK: 1,
        frma: 'firma',
        cafXmlOriginal: xmlOriginal
      };

      expect(caf.cafXmlOriginal).toContain('<AUTORIZACION>');
      expect(caf.cafXmlOriginal).toContain('<CAF');
    });
  });

  // ============================================
  // FolioRecord Interface
  // ============================================
  describe('FolioRecord Interface', () => {
    it('debe representar registro de base de datos', () => {
      const record: FolioRecord = {
        id: 'uuid-12345',
        supplierId: 'supplier-uuid',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 25,
        cafXmlEncrypted: 'base64EncryptedCAF...',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-15',
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      };

      expect(record.id).toBeDefined();
      expect(record.supplierId).toBeDefined();
      expect(record.isActive).toBe(true);
      expect(record.agotado).toBe(false);
    });

    it('debe rastrear folio actual', () => {
      const record: FolioRecord = {
        id: '1',
        supplierId: 'sup1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 50, // Ya se usaron 49 folios
        cafXmlEncrypted: 'encrypted',
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      };

      // folioActual es el próximo a usar
      const foliosUsados = record.folioActual - record.folioDesde;
      const foliosDisponibles = record.folioHasta - record.folioActual + 1;

      expect(foliosUsados).toBe(49);
      expect(foliosDisponibles).toBe(51);
    });

    it('debe indicar cuando está agotado', () => {
      const recordAgotado: FolioRecord = {
        id: '1',
        supplierId: 'sup1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 101, // Ya superó el máximo
        cafXmlEncrypted: 'encrypted',
        isActive: false,
        agotado: true,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      };

      expect(recordAgotado.agotado).toBe(true);
      expect(recordAgotado.isActive).toBe(false);
    });

    it('debe almacenar CAF cifrado', () => {
      const record: FolioRecord = {
        id: '1',
        supplierId: 'sup1',
        tipoDte: 33,
        folioDesde: 1,
        folioHasta: 100,
        folioActual: 1,
        cafXmlEncrypted: 'SGVsbG8gV29ybGQ=', // "Hello World" en Base64
        isActive: true,
        agotado: false,
        fechaAutorizacion: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Debe ser Base64 válido
      expect(record.cafXmlEncrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  // ============================================
  // NextFolioResult Interface
  // ============================================
  describe('NextFolioResult Interface', () => {
    it('debe contener folio y datos del CAF', () => {
      const cafData: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-01',
        rsaPubKey: { modulus: 'M', exponent: 'E' },
        idK: 1,
        frma: 'firma',
        cafXmlOriginal: '<CAF/>'
      };

      const result: NextFolioResult = {
        folio: 25,
        cafXml: '<CAF>...</CAF>',
        cafData: cafData
      };

      expect(result.folio).toBe(25);
      expect(result.cafXml).toContain('<CAF');
      expect(result.cafData.tipoDte).toBe(33);
    });

    it('folio debe estar dentro del rango del CAF', () => {
      const cafData: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa',
        folioDesde: 100,
        folioHasta: 200,
        fechaAutorizacion: '2024-01-01',
        rsaPubKey: { modulus: 'M', exponent: 'E' },
        idK: 1,
        frma: 'firma',
        cafXmlOriginal: '<CAF/>'
      };

      const result: NextFolioResult = {
        folio: 150,
        cafXml: '<CAF/>',
        cafData: cafData
      };

      expect(result.folio).toBeGreaterThanOrEqual(cafData.folioDesde);
      expect(result.folio).toBeLessThanOrEqual(cafData.folioHasta);
    });
  });

  // ============================================
  // CAFStats Interface
  // ============================================
  describe('CAFStats Interface', () => {
    it('debe calcular estadísticas correctamente', () => {
      const stats: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 100,
        usados: 75,
        disponibles: 25,
        porcentajeUsado: 75.00,
        alertaBaja: true
      };

      expect(stats.totalAutorizados).toBe(100);
      expect(stats.usados + stats.disponibles).toBe(stats.totalAutorizados);
      expect(stats.porcentajeUsado).toBe(75);
    });

    it('alertaBaja debe ser true si disponibles < 100', () => {
      const statsConAlerta: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 200,
        usados: 150,
        disponibles: 50,
        porcentajeUsado: 75,
        alertaBaja: true
      };

      expect(statsConAlerta.disponibles).toBeLessThan(100);
      expect(statsConAlerta.alertaBaja).toBe(true);
    });

    it('alertaBaja debe ser false si disponibles >= 100', () => {
      const statsSinAlerta: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 500,
        usados: 200,
        disponibles: 300,
        porcentajeUsado: 40,
        alertaBaja: false
      };

      expect(statsSinAlerta.disponibles).toBeGreaterThanOrEqual(100);
      expect(statsSinAlerta.alertaBaja).toBe(false);
    });

    it('porcentajeUsado debe tener precisión de 2 decimales', () => {
      const stats: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 3,
        usados: 1,
        disponibles: 2,
        porcentajeUsado: 33.33, // 1/3 * 100
        alertaBaja: true
      };

      // Verificar que tiene máximo 2 decimales
      const decimales = (stats.porcentajeUsado.toString().split('.')[1] || '').length;
      expect(decimales).toBeLessThanOrEqual(2);
    });

    it('debe funcionar con CAF nuevo (0% usado)', () => {
      const statsNuevo: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 100,
        usados: 0,
        disponibles: 100,
        porcentajeUsado: 0,
        alertaBaja: false
      };

      expect(statsNuevo.usados).toBe(0);
      expect(statsNuevo.porcentajeUsado).toBe(0);
    });

    it('debe funcionar con CAF agotado (100% usado)', () => {
      const statsAgotado: CAFStats = {
        tipoDte: 33,
        totalAutorizados: 100,
        usados: 100,
        disponibles: 0,
        porcentajeUsado: 100,
        alertaBaja: true
      };

      expect(statsAgotado.disponibles).toBe(0);
      expect(statsAgotado.porcentajeUsado).toBe(100);
    });
  });

  // ============================================
  // Casos de uso reales
  // ============================================
  describe('Casos de uso para certificación SII', () => {
    it('flujo de obtención de folio', () => {
      // Simular flujo completo
      
      // 1. CAF cargado desde XML
      const cafData: CAFData = {
        version: '1.0',
        tipoDte: 33,
        rutEmisor: '76000000-0',
        razonSocial: 'Empresa Certificada SpA',
        folioDesde: 1,
        folioHasta: 100,
        fechaAutorizacion: '2024-01-15',
        rsaPubKey: { modulus: 'MOD123', exponent: 'AQAB' },
        idK: 100,
        frma: 'FIRMA_SII',
        cafXmlOriginal: '<CAF>...</CAF>'
      };

      // 2. Registro en BD
      const record: FolioRecord = {
        id: 'caf-001',
        supplierId: 'empresa-001',
        tipoDte: cafData.tipoDte,
        folioDesde: cafData.folioDesde,
        folioHasta: cafData.folioHasta,
        folioActual: 1,
        cafXmlEncrypted: 'encrypted_caf',
        isActive: true,
        agotado: false,
        fechaAutorizacion: cafData.fechaAutorizacion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. Obtener siguiente folio
      const nextFolio: NextFolioResult = {
        folio: record.folioActual,
        cafXml: cafData.cafXmlOriginal,
        cafData: cafData
      };

      // 4. Actualizar registro
      record.folioActual++;
      record.updatedAt = new Date().toISOString();

      // 5. Verificar estadísticas
      const stats: CAFStats = {
        tipoDte: record.tipoDte,
        totalAutorizados: record.folioHasta - record.folioDesde + 1,
        usados: record.folioActual - record.folioDesde,
        disponibles: record.folioHasta - record.folioActual + 1,
        porcentajeUsado: ((record.folioActual - record.folioDesde) / (record.folioHasta - record.folioDesde + 1)) * 100,
        alertaBaja: (record.folioHasta - record.folioActual + 1) < 100
      };

      expect(nextFolio.folio).toBe(1);
      expect(stats.usados).toBe(1);
      expect(stats.disponibles).toBe(99);
    });

    it('múltiples CAFs del mismo tipo', () => {
      // Empresa puede tener múltiples CAFs del mismo tipo
      const cafs: FolioRecord[] = [
        {
          id: 'caf-1',
          supplierId: 'emp-1',
          tipoDte: 33,
          folioDesde: 1,
          folioHasta: 100,
          folioActual: 101, // Agotado
          cafXmlEncrypted: 'enc1',
          isActive: false,
          agotado: true,
          fechaAutorizacion: '2023-01-01',
          createdAt: '2023-01-01',
          updatedAt: '2023-12-31'
        },
        {
          id: 'caf-2',
          supplierId: 'emp-1',
          tipoDte: 33,
          folioDesde: 101,
          folioHasta: 200,
          folioActual: 150, // En uso
          cafXmlEncrypted: 'enc2',
          isActive: true,
          agotado: false,
          fechaAutorizacion: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-26'
        }
      ];

      // Solo el activo debe usarse
      const cafActivo = cafs.find(c => c.isActive);
      expect(cafActivo?.id).toBe('caf-2');
      expect(cafActivo?.folioActual).toBe(150);
    });
  });
});
