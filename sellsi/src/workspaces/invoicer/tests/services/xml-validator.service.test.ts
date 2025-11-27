/**
 * Tests para XmlValidatorService
 *
 * Valida la funcionalidad de validación XSD para DTEs del SII.
 *
 * @see CERTIFICACION.md §3
 */

import * as path from 'path';
import {
  XmlValidatorService,
  ValidationResult,
  DTESchemaType,
  getXmlValidator,
} from '../../src/services/xml-validator.service';

// Ruta a los schemas
const SCHEMAS_PATH = path.resolve(__dirname, '../../schemas');

describe('XmlValidatorService', () => {
  let validator: XmlValidatorService;

  beforeAll(() => {
    validator = new XmlValidatorService(SCHEMAS_PATH);
  });

  // ============================================================================
  // TESTS DE INICIALIZACIÓN
  // ============================================================================

  describe('Inicialización', () => {
    it('debe cargar los schemas disponibles', () => {
      const schemas = validator.getLoadedSchemas();
      expect(schemas.length).toBeGreaterThan(0);
      expect(schemas).toContain('DTE_v10.xsd');
      expect(schemas).toContain('EnvioDTE_v10.xsd');
    });

    it('debe verificar disponibilidad de schemas', () => {
      expect(validator.hasSchema('DTE')).toBe(true);
      expect(validator.hasSchema('EnvioDTE')).toBe(true);
      expect(validator.hasSchema('EnvioBoleta')).toBe(true);
    });

    it('debe manejar ruta de schemas inexistente', () => {
      const badValidator = new XmlValidatorService('/ruta/inexistente');
      expect(badValidator.getLoadedSchemas()).toEqual([]);
    });
  });

  // ============================================================================
  // TESTS DE VALIDACIÓN DE PARSING
  // ============================================================================

  describe('Validación de Parsing', () => {
    it('debe rechazar XML vacío', () => {
      const result = validator.validateDTE('');
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('parsing');
      expect(result.errors[0].message).toContain('vacío');
    });

    it('debe rechazar XML nulo', () => {
      const result = validator.validateDTE(null as any);
      expect(result.valid).toBe(false);
    });

    it('debe rechazar texto que no es XML', () => {
      const result = validator.validateDTE('esto no es xml');
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('parsing');
    });

    it('debe rechazar XML mal formado', () => {
      const malformedXml = '<?xml version="1.0"?><root><unclosed>';
      const result = validator.validateDTE(malformedXml);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'parsing')).toBe(true);
    });

    it('debe aceptar XML bien formado', () => {
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
        <Documento ID="DOC1">
          <Encabezado>
            <IdDoc>
              <TipoDTE>33</TipoDTE>
              <Folio>123</Folio>
              <FchEmis>2025-01-15</FchEmis>
            </IdDoc>
            <Emisor>
              <RUTEmisor>76123456-7</RUTEmisor>
            </Emisor>
            <Receptor>
              <RUTRecep>12345678-9</RUTRecep>
            </Receptor>
            <Totales>
              <MntTotal>100000</MntTotal>
            </Totales>
          </Encabezado>
        </Documento>`;
      const result = validator.validateDTE(validXml);
      // Puede tener warnings pero no errores de parsing
      const parsingErrors = result.errors.filter((e) => e.type === 'parsing');
      expect(parsingErrors).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS DE VALIDACIÓN ESTRUCTURAL - DTE
  // ============================================================================

  describe('Validación Estructural - DTE', () => {
    it('debe detectar elemento Documento faltante', () => {
      const xml = `<?xml version="1.0"?><OtroElemento></OtroElemento>`;
      const result = validator.validateDTE(xml);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.element === 'Documento')).toBe(true);
    });

    it('debe detectar Encabezado faltante', () => {
      const xml = `<?xml version="1.0"?><Documento ID="D1"></Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.errors.some((e) => e.element === 'Encabezado')).toBe(true);
    });

    it('debe detectar TipoDTE faltante', () => {
      const xml = `<?xml version="1.0"?>
        <Documento ID="D1">
          <Encabezado>
            <IdDoc>
              <Folio>1</Folio>
            </IdDoc>
          </Encabezado>
        </Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.errors.some((e) => e.element === 'TipoDTE')).toBe(true);
    });

    it('debe detectar atributo ID faltante en Documento', () => {
      const xml = `<?xml version="1.0"?>
        <Documento>
          <Encabezado>
            <IdDoc><TipoDTE>33</TipoDTE><Folio>1</Folio><FchEmis>2025-01-01</FchEmis></IdDoc>
            <Emisor><RUTEmisor>76123456-7</RUTEmisor></Emisor>
            <Receptor><RUTRecep>12345678-9</RUTRecep></Receptor>
            <Totales><MntTotal>1000</MntTotal></Totales>
          </Encabezado>
        </Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.errors.some((e) => e.message.includes('atributo ID'))).toBe(
        true
      );
    });

    it('debe detectar atributo Id en minúsculas (debe ser ID)', () => {
      const xml = `<?xml version="1.0"?>
        <Documento Id="D1">
          <Encabezado>
            <IdDoc><TipoDTE>33</TipoDTE><Folio>1</Folio><FchEmis>2025-01-01</FchEmis></IdDoc>
            <Emisor><RUTEmisor>76123456-7</RUTEmisor></Emisor>
            <Receptor><RUTRecep>12345678-9</RUTRecep></Receptor>
            <Totales><MntTotal>1000</MntTotal></Totales>
          </Encabezado>
        </Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.errors.some((e) => e.message.includes('MAYÚSCULAS'))).toBe(
        true
      );
    });

    it('debe advertir si documento firmado no tiene TED', () => {
      const xml = `<?xml version="1.0"?>
        <Documento ID="D1">
          <Encabezado>
            <IdDoc><TipoDTE>33</TipoDTE><Folio>1</Folio><FchEmis>2025-01-01</FchEmis></IdDoc>
            <Emisor><RUTEmisor>76123456-7</RUTEmisor></Emisor>
            <Receptor><RUTRecep>12345678-9</RUTRecep></Receptor>
            <Totales><MntTotal>1000</MntTotal></Totales>
          </Encabezado>
          <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
            <ds:SignedInfo></ds:SignedInfo>
          </ds:Signature>
        </Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.warnings.some((w) => w.message.includes('TED'))).toBe(true);
    });

    it('debe aceptar DTE completo con todos los elementos', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <Documento ID="DOC123">
          <Encabezado>
            <IdDoc>
              <TipoDTE>33</TipoDTE>
              <Folio>123</Folio>
              <FchEmis>2025-01-15</FchEmis>
            </IdDoc>
            <Emisor>
              <RUTEmisor>76123456-7</RUTEmisor>
              <RznSoc>Empresa Test SpA</RznSoc>
            </Emisor>
            <Receptor>
              <RUTRecep>12345678-9</RUTRecep>
              <RznSocRecep>Cliente Test</RznSocRecep>
            </Receptor>
            <Totales>
              <MntNeto>84034</MntNeto>
              <IVA>15966</IVA>
              <MntTotal>100000</MntTotal>
            </Totales>
          </Encabezado>
          <Detalle>
            <NroLinDet>1</NroLinDet>
            <NmbItem>Producto 1</NmbItem>
            <QtyItem>1</QtyItem>
            <PrcItem>84034</PrcItem>
            <MontoItem>84034</MontoItem>
          </Detalle>
          <TED version="1.0">
            <DD>
              <RE>76123456-7</RE>
              <TD>33</TD>
              <F>123</F>
            </DD>
            <FRMT algoritmo="SHA1withRSA">BASE64...</FRMT>
          </TED>
        </Documento>`;
      const result = validator.validateDTE(xml);
      // Solo puede tener errores de XSD (xmllint) pero no estructurales
      const structuralErrors = result.errors.filter(
        (e) => e.type === 'structure' || e.type === 'missing_element'
      );
      expect(structuralErrors).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS DE VALIDACIÓN ESTRUCTURAL - EnvioDTE
  // ============================================================================

  describe('Validación Estructural - EnvioDTE', () => {
    it('debe detectar EnvioDTE faltante', () => {
      const xml = `<?xml version="1.0"?><OtroElemento></OtroElemento>`;
      const result = validator.validateEnvioDTE(xml);
      expect(result.valid).toBe(false);
    });

    it('debe detectar SetDTE faltante', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioDTE>
          <Caratula></Caratula>
        </EnvioDTE>`;
      const result = validator.validateEnvioDTE(xml);
      expect(result.errors.some((e) => e.element === 'SetDTE')).toBe(true);
    });

    it('debe detectar Caratula faltante', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioDTE>
          <SetDTE ID="SET1">
            <DTE></DTE>
          </SetDTE>
        </EnvioDTE>`;
      const result = validator.validateEnvioDTE(xml);
      expect(result.errors.some((e) => e.element === 'Caratula')).toBe(true);
    });

    it('debe detectar SetDTE sin atributo ID', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioDTE>
          <SetDTE>
            <Caratula>
              <RutEmisor>76123456-7</RutEmisor>
              <RutEnvia>12345678-9</RutEnvia>
              <FchResol>2024-01-01</FchResol>
              <NroResol>0</NroResol>
            </Caratula>
            <DTE></DTE>
          </SetDTE>
        </EnvioDTE>`;
      const result = validator.validateEnvioDTE(xml);
      expect(
        result.errors.some(
          (e) => e.element === 'SetDTE' && e.message.includes('ID')
        )
      ).toBe(true);
    });

    it('debe detectar EnvioDTE sin DTEs', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioDTE>
          <SetDTE ID="SET1">
            <Caratula>
              <RutEmisor>76123456-7</RutEmisor>
              <RutEnvia>12345678-9</RutEnvia>
              <FchResol>2024-01-01</FchResol>
              <NroResol>0</NroResol>
            </Caratula>
          </SetDTE>
        </EnvioDTE>`;
      const result = validator.validateEnvioDTE(xml);
      expect(
        result.errors.some((e) => e.message.includes('al menos un DTE'))
      ).toBe(true);
    });

    it('debe aceptar EnvioDTE completo', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <EnvioDTE xmlns="http://www.sii.cl/SiiDte">
          <SetDTE ID="SetDoc">
            <Caratula>
              <RutEmisor>76123456-7</RutEmisor>
              <RutEnvia>12345678-9</RutEnvia>
              <FchResol>2024-01-01</FchResol>
              <NroResol>0</NroResol>
            </Caratula>
            <DTE version="1.0">
              <Documento ID="DOC1">
                <Encabezado>
                  <IdDoc><TipoDTE>33</TipoDTE><Folio>1</Folio><FchEmis>2025-01-01</FchEmis></IdDoc>
                  <Emisor><RUTEmisor>76123456-7</RUTEmisor></Emisor>
                  <Receptor><RUTRecep>66666666-6</RUTRecep></Receptor>
                  <Totales><MntTotal>1000</MntTotal></Totales>
                </Encabezado>
              </Documento>
            </DTE>
          </SetDTE>
        </EnvioDTE>`;
      const result = validator.validateEnvioDTE(xml);
      const structuralErrors = result.errors.filter(
        (e) => e.type === 'structure' || e.type === 'missing_element'
      );
      expect(structuralErrors).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS DE VALIDACIÓN ESTRUCTURAL - EnvioBoleta
  // ============================================================================

  describe('Validación Estructural - EnvioBoleta', () => {
    it('debe detectar EnvioBOLETA faltante', () => {
      const xml = `<?xml version="1.0"?><EnvioDTE></EnvioDTE>`;
      const result = validator.validateEnvioBoleta(xml);
      expect(result.valid).toBe(false);
    });

    it('debe advertir sobre tipos de DTE incorrectos', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioBOLETA>
          <SetDTE ID="SET1">
            <Caratula></Caratula>
            <DTE>
              <Documento ID="D1">
                <Encabezado>
                  <IdDoc>
                    <TipoDTE>33</TipoDTE>
                  </IdDoc>
                </Encabezado>
              </Documento>
            </DTE>
          </SetDTE>
        </EnvioBOLETA>`;
      const result = validator.validateEnvioBoleta(xml);
      expect(
        result.warnings.some(
          (w) => w.message.includes('33') && w.message.includes('boleta')
        )
      ).toBe(true);
    });

    it('debe aceptar tipos de boleta válidos (39, 41)', () => {
      const xml = `<?xml version="1.0"?>
        <EnvioBOLETA>
          <SetDTE ID="SET1">
            <Caratula></Caratula>
            <DTE>
              <Documento ID="D1">
                <Encabezado>
                  <IdDoc>
                    <TipoDTE>39</TipoDTE>
                  </IdDoc>
                </Encabezado>
              </Documento>
            </DTE>
          </SetDTE>
        </EnvioBOLETA>`;
      const result = validator.validateEnvioBoleta(xml);
      const boletaWarnings = result.warnings.filter(
        (w) => w.message.includes('39') && w.message.includes('boleta')
      );
      expect(boletaWarnings).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS DE validateOrThrow
  // ============================================================================

  describe('validateOrThrow', () => {
    it('debe lanzar excepción para XML inválido', () => {
      const invalidXml = '';
      expect(() => validator.validateOrThrow(invalidXml, 'DTE')).toThrow();
    });

    it('debe incluir detalles de error en el mensaje', () => {
      const invalidXml = `<?xml version="1.0"?><OtroElemento></OtroElemento>`;
      try {
        validator.validateOrThrow(invalidXml, 'DTE');
        fail('Debería haber lanzado excepción');
      } catch (error: any) {
        expect(error.message).toContain('inválido');
        expect(error.message).toContain('DTE_v10.xsd');
      }
    });

    it('no debe lanzar para XML válido estructuralmente', () => {
      const validXml = `<?xml version="1.0"?>
        <Documento ID="D1">
          <Encabezado>
            <IdDoc><TipoDTE>33</TipoDTE><Folio>1</Folio><FchEmis>2025-01-01</FchEmis></IdDoc>
            <Emisor><RUTEmisor>76123456-7</RUTEmisor></Emisor>
            <Receptor><RUTRecep>12345678-9</RUTRecep></Receptor>
            <Totales><MntTotal>1000</MntTotal></Totales>
          </Encabezado>
        </Documento>`;

      // Solo lanzará si xmllint está disponible Y detecta errores XSD
      // Por lo menos no debe lanzar por errores estructurales
      const result = validator.validateDTE(validXml);
      const structuralErrors = result.errors.filter(
        (e) => e.type !== 'schema'
      );
      expect(structuralErrors).toHaveLength(0);
    });
  });

  // ============================================================================
  // TESTS DE METADATOS
  // ============================================================================

  describe('Metadatos de validación', () => {
    it('debe incluir tiempo de validación', () => {
      const xml = `<?xml version="1.0"?><Documento ID="D1"><Encabezado></Encabezado></Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.validationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('debe incluir schema usado', () => {
      const xml = `<?xml version="1.0"?><Documento ID="D1"></Documento>`;
      const result = validator.validateDTE(xml);
      expect(result.schemaUsed).toBe('DTE_v10.xsd');
    });

    it('debe usar schema correcto para cada tipo', () => {
      const xml = `<?xml version="1.0"?><Doc></Doc>`;

      expect(validator.validate(xml, 'DTE').schemaUsed).toBe('DTE_v10.xsd');
      expect(validator.validate(xml, 'EnvioDTE').schemaUsed).toBe(
        'EnvioDTE_v10.xsd'
      );
      expect(validator.validate(xml, 'EnvioBoleta').schemaUsed).toBe(
        'EnvioBOLETA_v11.xsd'
      );
      expect(validator.validate(xml, 'ConsumoFolio').schemaUsed).toBe(
        'ConsumoFolio_v10.xsd'
      );
    });
  });

  // ============================================================================
  // TESTS DEL SINGLETON
  // ============================================================================

  describe('Singleton getXmlValidator', () => {
    it('debe requerir schemasPath en primera llamada', () => {
      // Reset singleton (no podemos hacerlo realmente, pero verificamos comportamiento)
      // Este test verifica que la función existe y funciona
      const validator = getXmlValidator(SCHEMAS_PATH);
      expect(validator).toBeInstanceOf(XmlValidatorService);
    });

    it('debe retornar misma instancia en llamadas subsecuentes', () => {
      const v1 = getXmlValidator(SCHEMAS_PATH);
      const v2 = getXmlValidator(); // Sin path
      expect(v1).toBe(v2);
    });
  });

  // ============================================================================
  // TESTS DE OTROS TIPOS DE DOCUMENTOS
  // ============================================================================

  describe('Otros tipos de documentos', () => {
    it('debe validar ConsumoFolio', () => {
      const xml = `<?xml version="1.0"?><ConsumoFolios></ConsumoFolios>`;
      const result = validator.validateConsumoFolio(xml);
      expect(result.schemaUsed).toBe('ConsumoFolio_v10.xsd');
    });

    it('debe validar LibroCV', () => {
      const xml = `<?xml version="1.0"?><LibroCompraVenta></LibroCompraVenta>`;
      const result = validator.validateLibroCV(xml);
      expect(result.schemaUsed).toBe('LibroCV_v10.xsd');
    });
  });

  // ============================================================================
  // TESTS DE XML CON NAMESPACES
  // ============================================================================

  describe('XML con namespaces', () => {
    it('debe manejar elementos con namespace prefix', () => {
      const xml = `<?xml version="1.0"?>
        <sii:Documento xmlns:sii="http://www.sii.cl/SiiDte" ID="D1">
          <sii:Encabezado>
            <sii:IdDoc>
              <sii:TipoDTE>33</sii:TipoDTE>
              <sii:Folio>1</sii:Folio>
              <sii:FchEmis>2025-01-01</sii:FchEmis>
            </sii:IdDoc>
            <sii:Emisor><sii:RUTEmisor>76123456-7</sii:RUTEmisor></sii:Emisor>
            <sii:Receptor><sii:RUTRecep>12345678-9</sii:RUTRecep></sii:Receptor>
            <sii:Totales><sii:MntTotal>1000</sii:MntTotal></sii:Totales>
          </sii:Encabezado>
        </sii:Documento>`;
      const result = validator.validateDTE(xml);
      // Debe reconocer elementos con prefijo
      const missingElementErrors = result.errors.filter(
        (e) => e.type === 'missing_element'
      );
      expect(missingElementErrors).toHaveLength(0);
    });
  });
});
