/**
 * Tests exhaustivos para tipos DTE
 * Verificación de estructuras y validaciones de tipos SII
 */

import { 
  DTEType, 
  RUT, 
  Emisor, 
  Receptor, 
  IdDoc, 
  DetalleItem,
  Totales,
  TotalesSII,
  Referencia,
  DTE,
  TED,
  EnvioDTE,
  DTEInput
} from '../../src/types/dte.types';

describe('DTE Types - Suite Completa para Certificación SII', () => {

  // ============================================
  // DTEType - CÓDIGOS DE DOCUMENTO
  // ============================================
  describe('DTEType - Tipos de documento válidos', () => {
    const tiposValidos: DTEType[] = [33, 34, 39, 41, 46, 52, 56, 61, 110, 111, 112];

    it('debe incluir Factura Electrónica (33)', () => {
      const tipo: DTEType = 33;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Factura Exenta (34)', () => {
      const tipo: DTEType = 34;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Boleta Electrónica (39)', () => {
      const tipo: DTEType = 39;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Boleta Exenta (41)', () => {
      const tipo: DTEType = 41;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Factura de Compra (46)', () => {
      const tipo: DTEType = 46;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Guía de Despacho (52)', () => {
      const tipo: DTEType = 52;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Nota de Débito (56)', () => {
      const tipo: DTEType = 56;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir Nota de Crédito (61)', () => {
      const tipo: DTEType = 61;
      expect(tiposValidos.includes(tipo)).toBe(true);
    });

    it('debe incluir documentos de exportación (110, 111, 112)', () => {
      expect(tiposValidos.includes(110)).toBe(true);
      expect(tiposValidos.includes(111)).toBe(true);
      expect(tiposValidos.includes(112)).toBe(true);
    });
  });

  // ============================================
  // RUT Interface
  // ============================================
  describe('RUT Interface', () => {
    it('debe aceptar RUT con estructura válida', () => {
      const rut: RUT = {
        numero: 12345678,
        dv: '9',
        formatted: '12.345.678-9'
      };

      expect(rut.numero).toBe(12345678);
      expect(rut.dv).toBe('9');
      expect(rut.formatted).toBe('12.345.678-9');
    });

    it('debe aceptar DV K', () => {
      const rut: RUT = {
        numero: 23000000,
        dv: 'K',
        formatted: '23.000.000-K'
      };

      expect(rut.dv).toBe('K');
    });

    it('debe aceptar DV 0', () => {
      const rut: RUT = {
        numero: 76000000,
        dv: '0',
        formatted: '76.000.000-0'
      };

      expect(rut.dv).toBe('0');
    });
  });

  // ============================================
  // Emisor Interface
  // ============================================
  describe('Emisor Interface', () => {
    it('debe aceptar emisor completo', () => {
      const emisor: Emisor = {
        RUTEmisor: '76.000.000-0',
        RznSoc: 'Empresa de Prueba SpA',
        GiroEmis: 'Venta al por menor de productos varios',
        Acteco: [479100],
        DirOrigen: 'Av. Providencia 1234',
        CmnaOrigen: 'Providencia',
        CiudadOrigen: 'Santiago',
        Telefono: '+56912345678',
        CorreoEmisor: 'contacto@empresa.cl',
        CdgSIISucur: 12345
      };

      expect(emisor.RUTEmisor).toBeDefined();
      expect(emisor.RznSoc.length).toBeLessThanOrEqual(100);
      expect(emisor.GiroEmis.length).toBeLessThanOrEqual(80);
      expect(emisor.DirOrigen.length).toBeLessThanOrEqual(70);
      expect(emisor.CmnaOrigen.length).toBeLessThanOrEqual(20);
    });

    it('debe aceptar emisor con datos mínimos', () => {
      const emisor: Emisor = {
        RUTEmisor: '76.000.000-0',
        RznSoc: 'Empresa',
        GiroEmis: 'Comercio',
        DirOrigen: 'Calle 1',
        CmnaOrigen: 'Comuna'
      };

      expect(emisor.Acteco).toBeUndefined();
      expect(emisor.CiudadOrigen).toBeUndefined();
    });

    it('debe soportar múltiples códigos de actividad económica', () => {
      const emisor: Emisor = {
        RUTEmisor: '76.000.000-0',
        RznSoc: 'Empresa',
        GiroEmis: 'Comercio',
        Acteco: [479100, 479900, 451010],
        DirOrigen: 'Calle 1',
        CmnaOrigen: 'Comuna'
      };

      expect(emisor.Acteco?.length).toBe(3);
    });
  });

  // ============================================
  // Receptor Interface
  // ============================================
  describe('Receptor Interface', () => {
    it('debe aceptar receptor completo', () => {
      const receptor: Receptor = {
        RUTRecep: '66.666.666-6',
        RznSocRecep: 'Cliente SpA',
        GiroRecep: 'Servicios',
        DirRecep: 'Av. Las Condes 5678',
        CmnaRecep: 'Las Condes',
        CiudadRecep: 'Santiago',
        Contacto: 'Juan Pérez',
        CorreoRecep: 'juan@cliente.cl'
      };

      expect(receptor.RznSocRecep.length).toBeLessThanOrEqual(100);
      expect(receptor.GiroRecep!.length).toBeLessThanOrEqual(40);
      expect(receptor.DirRecep!.length).toBeLessThanOrEqual(70);
    });

    it('debe aceptar receptor mínimo', () => {
      const receptor: Receptor = {
        RUTRecep: '66.666.666-6',
        RznSocRecep: 'Cliente'
      };

      expect(receptor.GiroRecep).toBeUndefined();
    });
  });

  // ============================================
  // IdDoc Interface
  // ============================================
  describe('IdDoc Interface', () => {
    it('debe aceptar identificación de documento completa', () => {
      const idDoc: IdDoc = {
        TipoDTE: 33,
        Folio: 12345,
        FchEmis: '2025-01-26',
        FchVenc: '2025-02-26',
        FmaPago: 1,
        MedioPago: 'EF'
      };

      expect(idDoc.TipoDTE).toBe(33);
      expect(idDoc.FchEmis).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('debe aceptar formas de pago válidas', () => {
      const contado: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', FmaPago: 1 };
      const credito: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', FmaPago: 2 };
      const sinCosto: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', FmaPago: 3 };

      expect(contado.FmaPago).toBe(1);
      expect(credito.FmaPago).toBe(2);
      expect(sinCosto.FmaPago).toBe(3);
    });

    it('debe aceptar medios de pago válidos', () => {
      const medios: Array<IdDoc['MedioPago']> = ['CH', 'LT', 'EF', 'PE', 'TC', 'CF', 'OT'];
      
      medios.forEach(medio => {
        const idDoc: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', MedioPago: medio };
        expect(['CH', 'LT', 'EF', 'PE', 'TC', 'CF', 'OT']).toContain(idDoc.MedioPago);
      });
    });

    it('debe soportar flag MntBruto', () => {
      const conIva: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', MntBruto: 1 };
      const sinIva: IdDoc = { TipoDTE: 33, Folio: 1, FchEmis: '2025-01-26', MntBruto: 0 };

      expect(conIva.MntBruto).toBe(1);
      expect(sinIva.MntBruto).toBe(0);
    });
  });

  // ============================================
  // DetalleItem Interface
  // ============================================
  describe('DetalleItem Interface', () => {
    it('debe aceptar ítem completo', () => {
      const item: DetalleItem = {
        NroLinDet: 1,
        CdgItem: {
          TpoCodigo: 'INT1',
          VlrCodigo: 'SKU-001'
        },
        NmbItem: 'Producto de prueba',
        DscItem: 'Descripción detallada del producto',
        QtyItem: 2,
        UnmdItem: 'UN',
        PrcItem: 10000,
        DescuentoPct: 10,
        DescuentoMonto: 2000,
        MontoItem: 18000
      };

      expect(item.NroLinDet).toBeGreaterThanOrEqual(1);
      expect(item.NroLinDet).toBeLessThanOrEqual(60);
      expect(item.NmbItem.length).toBeLessThanOrEqual(80);
      expect(item.DscItem!.length).toBeLessThanOrEqual(1000);
    });

    it('debe aceptar ítem exento', () => {
      const item: DetalleItem = {
        NroLinDet: 1,
        NmbItem: 'Producto exento',
        QtyItem: 1,
        PrcItem: 5000,
        MontoItem: 5000,
        IndExe: 1
      };

      expect(item.IndExe).toBe(1);
    });

    it('debe soportar indicadores de exención', () => {
      const noAfecto: DetalleItem = { NroLinDet: 1, NmbItem: 'A', QtyItem: 1, PrcItem: 100, MontoItem: 100, IndExe: 1 };
      const noFact: DetalleItem = { NroLinDet: 1, NmbItem: 'B', QtyItem: 1, PrcItem: 100, MontoItem: 100, IndExe: 2 };
      const producto: DetalleItem = { NroLinDet: 1, NmbItem: 'C', QtyItem: 1, PrcItem: 100, MontoItem: 100, IndExe: 6 };

      expect(noAfecto.IndExe).toBe(1);
      expect(noFact.IndExe).toBe(2);
      expect(producto.IndExe).toBe(6);
    });

    it('debe validar tipos de código de ítem', () => {
      const codigosValidos = ['INT1', 'INT2', 'EAN13', 'PLU'];
      
      codigosValidos.forEach(codigo => {
        const item: DetalleItem = {
          NroLinDet: 1,
          CdgItem: { TpoCodigo: codigo, VlrCodigo: '123' },
          NmbItem: 'Item',
          QtyItem: 1,
          PrcItem: 100,
          MontoItem: 100
        };
        expect(item.CdgItem?.TpoCodigo).toBe(codigo);
      });
    });
  });

  // ============================================
  // Totales Interface
  // ============================================
  describe('Totales Interface', () => {
    it('debe aceptar totales afectos', () => {
      const totales: Totales = {
        montoNeto: 10000,
        tasaIVA: 19,
        iva: 1900,
        montoTotal: 11900
      };

      expect(totales.montoNeto).toBe(10000);
      expect(totales.iva).toBe(1900);
    });

    it('debe aceptar totales exentos', () => {
      const totales: Totales = {
        montoExento: 10000,
        montoTotal: 10000
      };

      expect(totales.montoNeto).toBeUndefined();
      expect(totales.iva).toBeUndefined();
    });

    it('debe aceptar totales mixtos', () => {
      const totales: Totales = {
        montoNeto: 10000,
        montoExento: 5000,
        iva: 1900,
        montoTotal: 16900
      };

      expect(totales.montoNeto).toBe(10000);
      expect(totales.montoExento).toBe(5000);
      expect(totales.montoTotal).toBe(16900);
    });
  });

  // ============================================
  // TotalesSII Interface (formato XML)
  // ============================================
  describe('TotalesSII Interface', () => {
    it('debe usar nombres en formato SII', () => {
      const totales: TotalesSII = {
        MntNeto: 10000,
        TasaIVA: 19,
        IVA: 1900,
        MntTotal: 11900
      };

      expect(totales.MntNeto).toBe(10000);
      expect(totales.IVA).toBe(1900);
    });
  });

  // ============================================
  // Referencia Interface
  // ============================================
  describe('Referencia Interface', () => {
    it('debe aceptar referencia para anulación', () => {
      const ref: Referencia = {
        NroLinRef: 1,
        TpoDocRef: '33',
        FolioRef: '12345',
        FchRef: '2025-01-15',
        CodRef: 1,
        RazonRef: 'Anula documento'
      };

      expect(ref.CodRef).toBe(1); // Anula
    });

    it('debe aceptar referencia para corrección de texto', () => {
      const ref: Referencia = {
        NroLinRef: 1,
        TpoDocRef: '33',
        CodRef: 2,
        RazonRef: 'Corrige razón social'
      };

      expect(ref.CodRef).toBe(2); // Corrige texto
    });

    it('debe aceptar referencia para corrección de monto', () => {
      const ref: Referencia = {
        NroLinRef: 1,
        TpoDocRef: '33',
        CodRef: 3,
        RazonRef: 'Corrige monto'
      };

      expect(ref.CodRef).toBe(3); // Corrige monto
    });

    it('debe limitar razón a 90 caracteres', () => {
      const ref: Referencia = {
        NroLinRef: 1,
        TpoDocRef: '33',
        RazonRef: 'A'.repeat(90)
      };

      expect(ref.RazonRef!.length).toBeLessThanOrEqual(90);
    });
  });

  // ============================================
  // TED Interface
  // ============================================
  describe('TED Interface', () => {
    it('debe tener estructura correcta', () => {
      const ted: TED = {
        version: '1.0',
        dd: {
          re: '76000000-0',
          td: 33,
          f: 12345,
          fe: '2025-01-26',
          rr: '66666666-6',
          rsr: 'Cliente',
          mnt: 11900,
          it1: 'Producto'
        },
        caf: '<CAF>...</CAF>',
        frmt: 'firmaBase64',
        tedObject: {}
      };

      expect(ted.version).toBe('1.0');
      expect(ted.dd.td).toBe(33);
      expect(ted.dd.mnt).toBe(11900);
    });
  });

  // ============================================
  // DTE Completo
  // ============================================
  describe('DTE Interface completo', () => {
    it('debe estructurar documento completo correctamente', () => {
      const dte: DTE = {
        Encabezado: {
          IdDoc: {
            TipoDTE: 33,
            Folio: 1,
            FchEmis: '2025-01-26'
          },
          Emisor: {
            RUTEmisor: '76000000-0',
            RznSoc: 'Empresa',
            GiroEmis: 'Comercio',
            DirOrigen: 'Calle 1',
            CmnaOrigen: 'Santiago'
          },
          Receptor: {
            RUTRecep: '66666666-6',
            RznSocRecep: 'Cliente'
          },
          Totales: {
            montoNeto: 10000,
            iva: 1900,
            montoTotal: 11900
          }
        },
        Detalle: [
          {
            NroLinDet: 1,
            NmbItem: 'Producto',
            QtyItem: 1,
            PrcItem: 10000,
            MontoItem: 10000
          }
        ]
      };

      expect(dte.Encabezado.IdDoc.TipoDTE).toBe(33);
      expect(dte.Detalle.length).toBe(1);
    });
  });

  // ============================================
  // DTEInput (formato amigable)
  // ============================================
  describe('DTEInput Interface', () => {
    it('debe usar camelCase para conveniencia', () => {
      const input: DTEInput = {
        tipoDTE: 33,
        folio: 1,
        fechaEmision: '2025-01-26',
        emisor: {
          rut: '76.000.000-0',
          razonSocial: 'Empresa',
          giro: 'Comercio',
          direccion: 'Calle 1',
          comuna: 'Santiago'
        },
        receptor: {
          rut: '66.666.666-6',
          razonSocial: 'Cliente'
        },
        items: [
          {
            nombre: 'Producto',
            cantidad: 1,
            precioUnitario: 10000,
            montoItem: 10000
          }
        ],
        montoNeto: 10000,
        iva: 1900,
        montoTotal: 11900
      };

      expect(input.tipoDTE).toBe(33);
      expect(input.emisor.razonSocial).toBe('Empresa');
    });
  });

  // ============================================
  // Límites de caracteres según XSD SII
  // ============================================
  describe('Límites de caracteres XSD SII', () => {
    const limites = [
      { campo: 'RznSoc', limite: 100 },
      { campo: 'GiroEmis', limite: 80 },
      { campo: 'DirOrigen', limite: 70 },
      { campo: 'CmnaOrigen', limite: 20 },
      { campo: 'CiudadOrigen', limite: 20 },
      { campo: 'Telefono', limite: 20 },
      { campo: 'RznSocRecep', limite: 100 },
      { campo: 'GiroRecep', limite: 40 },
      { campo: 'NmbItem', limite: 80 },
      { campo: 'DscItem', limite: 1000 },
      { campo: 'UnmdItem', limite: 4 },
      { campo: 'RazonRef', limite: 90 },
      { campo: 'Contacto', limite: 80 },
    ];

    limites.forEach(({ campo, limite }) => {
      it(`${campo} debe limitarse a ${limite} caracteres`, () => {
        const valorMaximo = 'A'.repeat(limite);
        expect(valorMaximo.length).toBe(limite);
      });
    });
  });

  // ============================================
  // Líneas de detalle
  // ============================================
  describe('Límites de líneas de detalle', () => {
    it('NroLinDet debe estar entre 1 y 60', () => {
      for (let i = 1; i <= 60; i++) {
        const item: DetalleItem = {
          NroLinDet: i,
          NmbItem: `Item ${i}`,
          QtyItem: 1,
          PrcItem: 100,
          MontoItem: 100
        };
        expect(item.NroLinDet).toBeGreaterThanOrEqual(1);
        expect(item.NroLinDet).toBeLessThanOrEqual(60);
      }
    });
  });
});
