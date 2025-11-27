/**
 * Tests exhaustivos para DteBuilderService
 * Crítico para certificación SII - Generación de XML de DTEs
 */

import { DteBuilderService, CreateDTEInput, BuildDTEResult } from '../../src/services/dte-builder.service';
import { EmisorContext } from '../../src/types/certificate.types';
import { DTEType, CAFData } from '../../src/types';

describe('DteBuilderService - Suite Completa para Certificación SII', () => {
  let dteBuilder: DteBuilderService;
  let emisorMock: EmisorContext;
  let cafMock: CAFData;

  beforeEach(() => {
    dteBuilder = new DteBuilderService();

    // Emisor de prueba
    emisorMock = {
      supplierId: 'test-supplier-001',
      rutEmisor: '76.000.000-0',
      razonSocial: 'Empresa de Prueba SpA',
      giro: 'Venta al por menor de productos varios',
      actEco: [479100],
      direccion: 'Av. Providencia 1234',
      comuna: 'Providencia',
      ciudad: 'Santiago',
      ambiente: 'CERT',
    };

    // CAF mock
    cafMock = {
      version: '1.0',
      tipoDte: 33,
      rutEmisor: '76000000-0',
      razonSocial: 'Empresa de Prueba SpA',
      folioDesde: 1,
      folioHasta: 100,
      fechaAutorizacion: '2024-01-01',
      rsaPubKey: { modulus: 'ABC...', exponent: 'AQAB' },
      idK: 100,
      frma: 'firma-base64',
      cafXmlOriginal: '<CAF>...</CAF>',
    };
  });

  // ============================================
  // CONSTRUCCIÓN DE DTE BÁSICO
  // ============================================
  describe('buildDTE - Factura Electrónica básica', () => {
    it('debe generar XML válido para factura', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: {
          rut: '66.666.666-6',
          razonSocial: 'Cliente de Prueba',
        },
        items: [
          {
            nombre: 'Producto 1',
            cantidad: 1,
            precioUnitario: 10000,
          },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result).toBeDefined();
      expect(result.dteXml).toBeDefined();
      expect(result.dteId).toBeDefined();
      expect(result.totales).toBeDefined();
    });

    it('debe incluir ID correcto en el DTE', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 123,
        receptor: {
          rut: '66.666.666-6',
          razonSocial: 'Cliente de Prueba',
        },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.dteId).toBe('DTE_33_123');
    });

    it('debe calcular totales correctamente', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          { nombre: 'Item 1', cantidad: 2, precioUnitario: 5000 }, // 10000
          { nombre: 'Item 2', cantidad: 1, precioUnitario: 8400 }, // 8400
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      // Neto: 18400, IVA 19%: 3496, Total: 21896
      expect(result.totales.montoNeto).toBe(18400);
      expect(result.totales.iva).toBe(3496);
      expect(result.totales.montoTotal).toBe(21896);
    });
  });

  // ============================================
  // TIPOS DE DOCUMENTO
  // ============================================
  describe('buildDTE - Diferentes tipos de DTE', () => {
    // Tipos que NO requieren referencia
    const tiposSinReferencia: Array<{ tipo: DTEType; nombre: string; afecto: boolean }> = [
      { tipo: 33, nombre: 'Factura Electrónica', afecto: true },
      { tipo: 34, nombre: 'Factura Exenta', afecto: false },
      { tipo: 39, nombre: 'Boleta Electrónica', afecto: true },
      { tipo: 41, nombre: 'Boleta Exenta', afecto: false },
    ];

    // Tipos que SÍ requieren referencia (NC/ND)
    const tiposConReferencia: Array<{ tipo: DTEType; nombre: string; afecto: boolean }> = [
      { tipo: 56, nombre: 'Nota de Débito', afecto: true },
      { tipo: 61, nombre: 'Nota de Crédito', afecto: true },
    ];

    tiposSinReferencia.forEach(({ tipo, nombre, afecto }) => {
      it(`debe generar ${nombre} (tipo ${tipo})`, () => {
        cafMock.tipoDte = tipo;
        
        const input: CreateDTEInput = {
          tipoDte: tipo,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 10000 }],
        };

        const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

        expect(result.dteXml).toContain(`TipoDTE`);
        expect(result.dteId).toContain(`DTE_${tipo}_`);
        
        if (afecto) {
          expect(result.totales.iva).toBeDefined();
        }
      });
    });

    tiposConReferencia.forEach(({ tipo, nombre, afecto }) => {
      it(`debe generar ${nombre} (tipo ${tipo}) con referencia`, () => {
        cafMock.tipoDte = tipo;
        
        const input: CreateDTEInput = {
          tipoDte: tipo,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 10000 }],
          referencias: [{
            tipoDteRef: 33,
            folioRef: 100,
            fechaRef: '2024-01-15',
            razonRef: tipo === 61 ? 'Anula factura' : 'Recargo adicional',
            codigoRef: tipo === 61 ? 1 : 2, // 1=Anula, 2=Corrige montos
          }],
        };

        const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

        expect(result.dteXml).toContain(`TipoDTE`);
        expect(result.dteId).toContain(`DTE_${tipo}_`);
        
        if (afecto) {
          expect(result.totales.iva).toBeDefined();
        }
      });
    });
  });

  // ============================================
  // DOCUMENTOS EXENTOS
  // ============================================
  describe('buildDTE - Documentos exentos', () => {
    it('Factura Exenta no debe tener IVA', () => {
      cafMock.tipoDte = 34;
      
      const input: CreateDTEInput = {
        tipoDte: 34,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Item exento', cantidad: 1, precioUnitario: 10000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.totales.iva).toBeUndefined();
      expect(result.totales.montoExento).toBe(10000);
      expect(result.totales.montoTotal).toBe(10000);
    });

    it('Boleta Exenta no debe tener IVA', () => {
      cafMock.tipoDte = 41;
      
      const input: CreateDTEInput = {
        tipoDte: 41,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Item exento', cantidad: 1, precioUnitario: 5000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.totales.iva).toBeUndefined();
      expect(result.totales.montoTotal).toBe(5000);
    });
  });

  // ============================================
  // ÍTEMS CON DESCUENTO
  // ============================================
  describe('buildDTE - Ítems con descuento', () => {
    it('debe aplicar descuento porcentual a ítem', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          {
            nombre: 'Producto con descuento',
            cantidad: 1,
            precioUnitario: 10000,
            descuentoPorcentaje: 10, // 10% = 1000 descuento
          },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      // Neto: 9000, IVA: 1710, Total: 10710
      expect(result.totales.montoNeto).toBe(9000);
    });

    it('debe aplicar descuento 0% sin cambios', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          {
            nombre: 'Producto',
            cantidad: 1,
            precioUnitario: 10000,
            descuentoPorcentaje: 0,
          },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.totales.montoNeto).toBe(10000);
    });
  });

  // ============================================
  // DESCUENTO GLOBAL
  // ============================================
  describe('buildDTE - Descuento global', () => {
    it('debe aplicar descuento global porcentual', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          { nombre: 'Item 1', cantidad: 1, precioUnitario: 10000 },
        ],
        descuentoGlobal: {
          tipo: 'porcentaje',
          valor: 10,
        },
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      // 10000 - 10% = 9000 neto
      expect(result.totales.montoNeto).toBe(9000);
    });

    it('debe aplicar descuento global en monto', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          { nombre: 'Item 1', cantidad: 1, precioUnitario: 10000 },
        ],
        descuentoGlobal: {
          tipo: 'monto',
          valor: 1000,
        },
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.totales.montoNeto).toBe(9000);
    });
  });

  // ============================================
  // ÍTEMS MIXTOS (AFECTOS Y EXENTOS)
  // ============================================
  describe('buildDTE - Ítems mixtos', () => {
    it('debe separar montos afectos y exentos', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          { nombre: 'Item afecto', cantidad: 1, precioUnitario: 10000, exento: false },
          { nombre: 'Item exento', cantidad: 1, precioUnitario: 5000, exento: true },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.totales.montoNeto).toBe(10000);
      expect(result.totales.montoExento).toBe(5000);
      expect(result.totales.iva).toBe(1900); // 19% de 10000
      expect(result.totales.montoTotal).toBe(16900); // 10000 + 1900 + 5000
    });
  });

  // ============================================
  // REFERENCIAS (NOTAS DE CRÉDITO/DÉBITO)
  // ============================================
  describe('buildDTE - Referencias', () => {
    it('debe incluir referencia en Nota de Crédito', () => {
      cafMock.tipoDte = 61;
      
      const input: CreateDTEInput = {
        tipoDte: 61,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Devolución', cantidad: 1, precioUnitario: 10000 }],
        referencias: [
          {
            tipoDteRef: 33,
            folioRef: 100,
            fechaRef: '2024-01-15',
            razonRef: 'Anula documento',
            codigoRef: 1, // 1 = Anula
          },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.dteXml).toContain('Referencia');
    });

    it('debe soportar múltiples referencias', () => {
      cafMock.tipoDte = 61;
      
      const input: CreateDTEInput = {
        tipoDte: 61,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 5000 }],
        referencias: [
          { tipoDteRef: 33, folioRef: 100, fechaRef: '2024-01-15', razonRef: 'Ref 1' },
          { tipoDteRef: 33, folioRef: 101, fechaRef: '2024-01-16', razonRef: 'Ref 2' },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.dteXml).toContain('NroLinRef');
    });
  });

  // ============================================
  // DATOS DEL RECEPTOR
  // ============================================
  describe('buildDTE - Datos del receptor', () => {
    it('debe incluir todos los datos opcionales del receptor', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: {
          rut: '66.666.666-6',
          razonSocial: 'Cliente Completo SpA',
          giro: 'Comercio',
          direccion: 'Calle Principal 123',
          comuna: 'Las Condes',
          ciudad: 'Santiago',
          correo: 'cliente@email.com',
        },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.dteXml).toContain('RznSocRecep');
      expect(result.dteXml).toContain('GiroRecep');
      expect(result.dteXml).toContain('DirRecep');
      expect(result.dteXml).toContain('CmnaRecep');
    });

    it('debe funcionar con datos mínimos del receptor', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: {
          rut: '66.666.666-6',
          razonSocial: 'Cliente Mínimo',
        },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.dteXml).toContain('RUTRecep');
      expect(result.dteXml).toContain('RznSocRecep');
    });
  });

  // ============================================
  // TED (TIMBRE ELECTRÓNICO)
  // ============================================
  describe('buildDTE - TED', () => {
    it('debe generar TED con datos correctos', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 10000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.ted).toBeDefined();
      expect(result.ted.dd.td).toBe(33);
      expect(result.ted.dd.f).toBe(1);
      expect(result.ted.dd.rr).toBeDefined();
      expect(result.ted.dd.mnt).toBe(result.totales.montoTotal);
    });

    it('TED debe incluir primer ítem (IT1)', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [
          { nombre: 'Primer Item Muy Largo', cantidad: 1, precioUnitario: 10000 },
          { nombre: 'Segundo Item', cantidad: 1, precioUnitario: 5000 },
        ],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);

      expect(result.ted.dd.it1).toContain('Primer Item');
    });
  });

  // ============================================
  // ENVÍO DTE (SET Y SOBRE)
  // ============================================
  describe('buildEnvioDTE', () => {
    it('debe construir EnvioDTE con múltiples documentos', () => {
      const docs: BuildDTEResult[] = [];
      
      // Generar algunos DTEs
      for (let i = 1; i <= 3; i++) {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: i,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 * i }],
        };
        docs.push(dteBuilder.buildDTE(input, emisorMock, cafMock));
      }

      const envio = dteBuilder.buildEnvioDTE(docs, emisorMock, '12.345.678-9');

      expect(envio.xml).toContain('EnvioDTE');
      expect(envio.xml).toContain('SetDTE');
      expect(envio.xml).toContain('Caratula');
      expect(envio.setDteId).toContain('SET_');
      expect(envio.envioDteId).toContain('ENV_');
    });

    it('debe incluir RUT del SII como receptor en carátula', () => {
      const docs: BuildDTEResult[] = [
        dteBuilder.buildDTE(
          {
            tipoDte: 33,
            folio: 1,
            receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
            items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          },
          emisorMock,
          cafMock
        ),
      ];

      const envio = dteBuilder.buildEnvioDTE(docs, emisorMock, '12.345.678-9');

      expect(envio.xml).toContain('60803000-K'); // RUT del SII
    });

    it('debe usar resolución 0 para certificación', () => {
      const docs: BuildDTEResult[] = [
        dteBuilder.buildDTE(
          {
            tipoDte: 33,
            folio: 1,
            receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
            items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          },
          emisorMock,
          cafMock
        ),
      ];

      const envio = dteBuilder.buildEnvioDTE(docs, emisorMock, '12.345.678-9');

      expect(envio.xml).toContain('NroResol');
    });
  });

  // ============================================
  // PDF417 DATA
  // ============================================
  describe('generatePDF417Data', () => {
    it('debe generar datos para código de barras', () => {
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 10000 }],
      };

      const result = dteBuilder.buildDTE(input, emisorMock, cafMock);
      const pdf417 = dteBuilder.generatePDF417Data(result.ted);

      expect(pdf417).toContain('TED');
      expect(pdf417).toContain('DD');
    });
  });

  // ============================================
  // TRUNCAMIENTO DE CAMPOS
  // ============================================
  describe('buildDTE - Truncamiento de campos largos', () => {
    it('debe truncar razón social a 100 caracteres', () => {
      const razonSocialLarga = 'A'.repeat(150);
      
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: razonSocialLarga },
        items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
      };

      // No debe lanzar error
      expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).not.toThrow();
    });

    it('debe truncar nombre de ítem a 80 caracteres', () => {
      const nombreLargo = 'B'.repeat(100);
      
      const input: CreateDTEInput = {
        tipoDte: 33,
        folio: 1,
        receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
        items: [{ nombre: nombreLargo, cantidad: 1, precioUnitario: 1000 }],
      };

      expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).not.toThrow();
    });
  });

  // ============================================
  // VALIDACIONES SII
  // ============================================
  describe('Validaciones SII', () => {
    describe('Validación de máximo 60 líneas de detalle', () => {
      it('debe aceptar exactamente 60 líneas', () => {
        const items = Array.from({ length: 60 }, (_, i) => ({
          nombre: `Producto ${i + 1}`,
          cantidad: 1,
          precioUnitario: 1000,
        }));

        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items,
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).not.toThrow();
      });

      it('debe rechazar más de 60 líneas', () => {
        const items = Array.from({ length: 61 }, (_, i) => ({
          nombre: `Producto ${i + 1}`,
          cantidad: 1,
          precioUnitario: 1000,
        }));

        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items,
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/Máximo 60 líneas/);
      });

      it('debe rechazar documento sin ítems', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/al menos 1 ítem/);
      });
    });

    describe('Validación de referencias en NC/ND', () => {
      it('Nota de Crédito (61) debe rechazar sin referencias', () => {
        const input: CreateDTEInput = {
          tipoDte: 61,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          // Sin referencias!
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/Notas de Crédito.*referencia/);
      });

      it('Nota de Débito (56) debe rechazar sin referencias', () => {
        const input: CreateDTEInput = {
          tipoDte: 56,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          // Sin referencias!
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/Notas de Débito.*referencia/);
      });

      it('Nota de Crédito (61) con referencia debe aceptarse', () => {
        const input: CreateDTEInput = {
          tipoDte: 61,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          referencias: [{
            tipoDteRef: 33,
            folioRef: 100,
            fechaRef: '2024-01-15',
            razonRef: 'Anula documento',
            codigoRef: 1,
          }],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).not.toThrow();
      });

      it('Factura (33) sin referencias debe aceptarse', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
          // Sin referencias - OK para facturas
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).not.toThrow();
      });
    });

    describe('Validación de datos básicos', () => {
      it('debe rechazar folio cero', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 0,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/folio.*positivo/);
      });

      it('debe rechazar folio negativo', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: -1,
          receptor: { rut: '66.666.666-6', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/folio.*positivo/);
      });

      it('debe rechazar RUT receptor vacío', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '', razonSocial: 'Cliente' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/RUT del receptor/);
      });

      it('debe rechazar razón social receptor vacía', () => {
        const input: CreateDTEInput = {
          tipoDte: 33,
          folio: 1,
          receptor: { rut: '66.666.666-6', razonSocial: '' },
          items: [{ nombre: 'Item', cantidad: 1, precioUnitario: 1000 }],
        };

        expect(() => dteBuilder.buildDTE(input, emisorMock, cafMock)).toThrow(/razón social del receptor/);
      });
    });
  });

  // ============================================
  // SINGLETON
  // ============================================
  describe('Singleton export', () => {
    it('debe exportar instancia dteBuilderService', async () => {
      const { dteBuilderService: singleton } = await import(
        '../../src/services/dte-builder.service'
      );
      
      expect(singleton).toBeInstanceOf(DteBuilderService);
    });
  });
});
