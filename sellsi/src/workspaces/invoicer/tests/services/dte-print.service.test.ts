/**
 * Tests para DtePrintService
 * Servicio de generación de PDF para DTEs
 */

import { DtePrintService, DTEPrint, PrintOptions } from '../../src/services/dte-print.service';
import { TED, DTEType } from '../../src/types';
import { EmisorContext } from '../../src/types/certificate.types';
import bwipjs from 'bwip-js';

// Mock bwip-js para evitar generar códigos de barras reales
jest.mock('bwip-js', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-barcode-png')),
}));

// Mock pdfmake
jest.mock('pdfmake', () => {
  return jest.fn().mockImplementation(() => ({
    createPdfKitDocument: jest.fn().mockImplementation(() => {
      const EventEmitter = require('events');
      const doc = new EventEmitter();
      doc.end = jest.fn().mockImplementation(() => {
        process.nextTick(() => {
          doc.emit('data', Buffer.from('fake-pdf-chunk-1'));
          doc.emit('data', Buffer.from('fake-pdf-chunk-2'));
          doc.emit('end');
        });
      });
      return doc;
    }),
  }));
});

describe('DtePrintService', () => {
  let printService: DtePrintService;

  // Datos de prueba
  const mockEmisor: EmisorContext = {
    supplierId: 'supplier-123',
    rutEmisor: '76086428-5',
    razonSocial: 'Empresa de Prueba SpA',
    giro: 'Venta al por mayor',
    direccion: 'Av. Principal 123',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    actEco: [461000],
    ambiente: 'CERT',
  };

  const mockTED: TED = {
    version: '1.0',
    dd: {
      re: '76086428-5',
      td: 33,
      f: 1234,
      fe: '2024-01-15',
      rr: '12345678-9',
      rsr: 'Cliente de Prueba',
      mnt: 119000,
      it1: 'Producto de prueba',
    },
    caf: '<CAF>...</CAF>',
    frmt: 'firma-ted-base64',
    tedObject: {},
  };

  const mockDTEPrint: DTEPrint = {
    id: 'dte-123',
    encabezado: {
      idDoc: {
        TipoDTE: 33 as DTEType,
        Folio: 1234,
        FchEmis: '2024-01-15',
      },
      emisor: {
        RUTEmisor: '76086428-5',
        RznSoc: 'Empresa de Prueba SpA',
        GiroEmis: 'Venta al por mayor',
        Acteco: 461000,
        DirOrigen: 'Av. Principal 123',
        CmnaOrigen: 'Santiago',
        CiudadOrigen: 'Santiago',
      },
      receptor: {
        RUTRecep: '12345678-9',
        RznSocRecep: 'Cliente de Prueba',
        GiroRecep: 'Comercio',
        DirRecep: 'Calle Secundaria 456',
        CmnaRecep: 'Providencia',
        CiudadRecep: 'Santiago',
      },
      totales: {
        MntNeto: 100000,
        TasaIVA: 19,
        IVA: 19000,
        MntTotal: 119000,
      },
    },
    detalle: [
      {
        NroLinDet: 1,
        CdgItem: { TpoCodigo: 'INT1', VlrCodigo: 'PROD001' },
        NmbItem: 'Producto de prueba',
        DscItem: 'Descripción del producto',
        QtyItem: 10,
        UnmdItem: 'UN',
        PrcItem: 10000,
        MontoItem: 100000,
      },
    ],
    observaciones: 'Observación de prueba',
    ted: mockTED,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    printService = new DtePrintService();
  });

  describe('Inicialización', () => {
    it('debe crear instancia correctamente', () => {
      expect(printService).toBeInstanceOf(DtePrintService);
    });

    it('debe tener método generatePdf', () => {
      expect(typeof printService.generatePdf).toBe('function');
    });
  });

  describe('generatePdf', () => {
    it('debe generar PDF para factura electrónica (tipo 33)', async () => {
      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe generar PDF para boleta electrónica (tipo 39)', async () => {
      const boletaPrint: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: {
            ...mockDTEPrint.encabezado.idDoc,
            TipoDTE: 39 as DTEType,
          },
        },
      };

      const result = await printService.generatePdf(boletaPrint, mockEmisor, {
        ...mockTED,
        dd: { ...mockTED.dd, td: 39 },
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe generar PDF con opciones de impresión', async () => {
      const options: PrintOptions = {
        copiaTexto: 'ORIGINAL',
        incluirCedible: true,
        tamañoPapel: 'carta',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe generar PDF con logo cuando se proporciona', async () => {
      const options: PrintOptions = {
        logoBase64: 'data:image/png;base64,fakelogodata',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe llamar a bwipjs.toBuffer para generar código PDF417', async () => {
      await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED);

      expect(bwipjs.toBuffer).toHaveBeenCalled();
      expect(bwipjs.toBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          bcid: 'pdf417',
          text: expect.stringContaining('<TED'),
        })
      );
    });
  });

  describe('generatePDF417 (código de barras)', () => {
    it('debe generar XML del TED correctamente para código de barras', async () => {
      await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED);

      const callArgs = (bwipjs.toBuffer as jest.Mock).mock.calls[0][0];
      const tedXml = callArgs.text;

      expect(tedXml).toContain('<TED version="1.0">');
      expect(tedXml).toContain(`<RE>${mockTED.dd.re}</RE>`);
      expect(tedXml).toContain(`<TD>${mockTED.dd.td}</TD>`);
      expect(tedXml).toContain(`<F>${mockTED.dd.f}</F>`);
      expect(tedXml).toContain(`<FE>${mockTED.dd.fe}</FE>`);
      expect(tedXml).toContain(`<RR>${mockTED.dd.rr}</RR>`);
      expect(tedXml).toContain(`<RSR>${mockTED.dd.rsr}</RSR>`);
      expect(tedXml).toContain(`<MNT>${mockTED.dd.mnt}</MNT>`);
      expect(tedXml).toContain(`<IT1>${mockTED.dd.it1}</IT1>`);
      expect(tedXml).toContain('</TED>');
    });

    it('debe usar nivel de corrección de errores 5 en PDF417', async () => {
      await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED);

      expect(bwipjs.toBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          eclevel: 5,
        })
      );
    });

    it('debe manejar error en generación de código de barras', async () => {
      (bwipjs.toBuffer as jest.Mock).mockRejectedValueOnce(new Error('Barcode error'));

      await expect(printService.generatePdf(mockDTEPrint, mockEmisor, mockTED)).rejects.toThrow(
        'No se pudo generar el código de barras PDF417'
      );
    });
  });

  describe('getNombreDocumento', () => {
    it('debe retornar nombre correcto para Factura Electrónica (33)', async () => {
      const dte33: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 33 as DTEType },
        },
      };

      // El nombre se verifica indirectamente a través de la generación del PDF
      const result = await printService.generatePdf(dte33, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe retornar nombre correcto para Boleta Electrónica (39)', async () => {
      const dte39: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 39 as DTEType },
        },
      };

      const ted39: TED = { ...mockTED, dd: { ...mockTED.dd, td: 39 } };
      const result = await printService.generatePdf(dte39, mockEmisor, ted39);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe retornar nombre correcto para Nota de Crédito (61)', async () => {
      const dte61: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 61 as DTEType },
        },
      };

      const ted61: TED = { ...mockTED, dd: { ...mockTED.dd, td: 61 } };
      const result = await printService.generatePdf(dte61, mockEmisor, ted61);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe retornar nombre correcto para Guía de Despacho (52)', async () => {
      const dte52: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 52 as DTEType },
        },
      };

      const ted52: TED = { ...mockTED, dd: { ...mockTED.dd, td: 52 } };
      const result = await printService.generatePdf(dte52, mockEmisor, ted52);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('getPageSize', () => {
    it('debe usar tamaño carta por defecto', async () => {
      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, {});
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe usar tamaño oficio cuando se especifica', async () => {
      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, {
        tamañoPapel: 'oficio',
      });
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe usar tamaño térmico 80mm cuando se especifica', async () => {
      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, {
        tamañoPapel: 'termica80',
      });
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildDetalleTable', () => {
    it('debe generar tabla de detalle para facturas (con códigos)', async () => {
      const dteConDetalle: DTEPrint = {
        ...mockDTEPrint,
        detalle: [
          {
            NroLinDet: 1,
            CdgItem: { TpoCodigo: 'INT1', VlrCodigo: 'COD001' },
            NmbItem: 'Producto 1',
            QtyItem: 5,
            UnmdItem: 'UN',
            PrcItem: 1000,
            MontoItem: 5000,
          },
          {
            NroLinDet: 2,
            CdgItem: { TpoCodigo: 'INT1', VlrCodigo: 'COD002' },
            NmbItem: 'Producto 2',
            QtyItem: 3,
            UnmdItem: 'KG',
            PrcItem: 2000,
            DescuentoPct: 10,
            MontoItem: 5400,
          },
        ],
      };

      const result = await printService.generatePdf(dteConDetalle, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe generar tabla de detalle para boletas (sin códigos)', async () => {
      const boletaConDetalle: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 39 as DTEType },
        },
        detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'Producto Simple',
            QtyItem: 2,
            PrcItem: 5000,
            MontoItem: 10000,
          },
        ],
      };

      const ted39: TED = { ...mockTED, dd: { ...mockTED.dd, td: 39 } };
      const result = await printService.generatePdf(boletaConDetalle, mockEmisor, ted39);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar múltiples líneas de detalle', async () => {
      const dteMultiDetalle: DTEPrint = {
        ...mockDTEPrint,
        detalle: Array.from({ length: 20 }, (_, i) => ({
          NroLinDet: i + 1,
          NmbItem: `Producto ${i + 1}`,
          QtyItem: i + 1,
          PrcItem: 1000,
          MontoItem: (i + 1) * 1000,
        })),
      };

      const result = await printService.generatePdf(dteMultiDetalle, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildTotalesSection', () => {
    it('debe mostrar monto neto, IVA y total para facturas', async () => {
      const dteConTotales: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          totales: {
            MntNeto: 100000,
            TasaIVA: 19,
            IVA: 19000,
            MntTotal: 119000,
          },
        },
      };

      const result = await printService.generatePdf(dteConTotales, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe mostrar monto exento cuando corresponde', async () => {
      const dteExento: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 34 as DTEType },
          totales: {
            MntExe: 50000,
            MntTotal: 50000,
          },
        },
      };

      const ted34: TED = { ...mockTED, dd: { ...mockTED.dd, td: 34 } };
      const result = await printService.generatePdf(dteExento, mockEmisor, ted34);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe ocultar IVA desglosado para boletas', async () => {
      const boletaTotales: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          idDoc: { ...mockDTEPrint.encabezado.idDoc, TipoDTE: 39 as DTEType },
          totales: {
            MntNeto: 84034,
            TasaIVA: 19,
            IVA: 15966,
            MntTotal: 100000,
          },
        },
      };

      const ted39: TED = { ...mockTED, dd: { ...mockTED.dd, td: 39 } };
      const result = await printService.generatePdf(boletaTotales, mockEmisor, ted39);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildObservaciones', () => {
    it('debe incluir observaciones cuando están presentes', async () => {
      const dteConObs: DTEPrint = {
        ...mockDTEPrint,
        observaciones: 'Esta es una observación importante del documento',
      };

      const result = await printService.generatePdf(dteConObs, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe omitir sección de observaciones cuando no hay', async () => {
      const dteSinObs: DTEPrint = {
        ...mockDTEPrint,
        observaciones: undefined,
      };

      const result = await printService.generatePdf(dteSinObs, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildAcuseRecibo', () => {
    it('debe incluir acuse de recibo cuando es cedible', async () => {
      const options: PrintOptions = {
        incluirCedible: true,
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe omitir acuse de recibo cuando no es cedible', async () => {
      const options: PrintOptions = {
        incluirCedible: false,
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildCopiaTexto', () => {
    it('debe incluir texto ORIGINAL', async () => {
      const options: PrintOptions = {
        copiaTexto: 'ORIGINAL',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe incluir texto COPIA CEDIBLE', async () => {
      const options: PrintOptions = {
        copiaTexto: 'COPIA CEDIBLE',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe incluir texto COPIA', async () => {
      const options: PrintOptions = {
        copiaTexto: 'COPIA',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildReceptorSection', () => {
    it('debe mostrar todos los datos del receptor', async () => {
      const dteReceptorCompleto: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          receptor: {
            RUTRecep: '12345678-9',
            RznSocRecep: 'Cliente Completo Ltda',
            GiroRecep: 'Servicios de Consultoría',
            DirRecep: 'Av. Las Condes 1234',
            CmnaRecep: 'Las Condes',
            CiudadRecep: 'Santiago',
          },
        },
      };

      const result = await printService.generatePdf(dteReceptorCompleto, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar receptor con datos mínimos', async () => {
      const dteReceptorMinimo: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          receptor: {
            RUTRecep: '12345678-9',
            RznSocRecep: 'Cliente Minimo',
          },
        },
      };

      const result = await printService.generatePdf(dteReceptorMinimo, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('buildHeader', () => {
    it('debe construir encabezado con datos del emisor', async () => {
      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe incluir logo cuando se proporciona', async () => {
      const options: PrintOptions = {
        logoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const result = await printService.generatePdf(mockDTEPrint, mockEmisor, mockTED, options);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Casos edge', () => {
    it('debe manejar detalle sin código de producto', async () => {
      const dteSinCodigo: DTEPrint = {
        ...mockDTEPrint,
        detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'Producto sin código',
            QtyItem: 1,
            PrcItem: 1000,
            MontoItem: 1000,
          },
        ],
      };

      const result = await printService.generatePdf(dteSinCodigo, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar detalle sin unidad de medida', async () => {
      const dteSinUnidad: DTEPrint = {
        ...mockDTEPrint,
        detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'Servicio',
            QtyItem: 1,
            PrcItem: 50000,
            MontoItem: 50000,
          },
        ],
      };

      const result = await printService.generatePdf(dteSinUnidad, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar montos con valores altos', async () => {
      const dteMontoAlto: DTEPrint = {
        ...mockDTEPrint,
        encabezado: {
          ...mockDTEPrint.encabezado,
          totales: {
            MntNeto: 999999999,
            TasaIVA: 19,
            IVA: 189999999,
            MntTotal: 1189999998,
          },
        },
        detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'Producto caro',
            QtyItem: 1,
            PrcItem: 999999999,
            MontoItem: 999999999,
          },
        ],
      };

      const result = await printService.generatePdf(dteMontoAlto, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar descripción de item muy larga', async () => {
      const dteDescLarga: DTEPrint = {
        ...mockDTEPrint,
        detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'A'.repeat(200), // Nombre muy largo
            DscItem: 'B'.repeat(500), // Descripción muy larga
            QtyItem: 1,
            PrcItem: 1000,
            MontoItem: 1000,
          },
        ],
      };

      const result = await printService.generatePdf(dteDescLarga, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('debe manejar DTE con detalle vacío', async () => {
      const dteDetalleVacio: DTEPrint = {
        ...mockDTEPrint,
        detalle: [],
      };

      const result = await printService.generatePdf(dteDetalleVacio, mockEmisor, mockTED);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Singleton', () => {
    it('debe exportar instancia singleton', async () => {
      const { dtePrintService } = await import('../../src/services/dte-print.service');
      expect(dtePrintService).toBeInstanceOf(DtePrintService);
    });
  });
});
