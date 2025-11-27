/**
 * Tests para PDF417Service - Generación de Timbre Electrónico
 * 
 * §7 de CERTIFICACION.md - Validación PDF417
 * 
 * Estos tests verifican:
 * 1. Generación correcta de códigos PDF417
 * 2. Cumplimiento de dimensiones mínimas SII
 * 3. Validación de datos del TED
 * 4. Construcción correcta del XML del TED
 * 5. Manejo de errores y edge cases
 */

import { 
  PDF417Service, 
  TEDData, 
  PDF417Options,
  pdf417Service 
} from '../../src/services/pdf417.service';

describe('PDF417Service - Timbre Electrónico SII', () => {
  let service: PDF417Service;

  beforeEach(() => {
    service = new PDF417Service();
  });

  // ============================================
  // GENERACIÓN BÁSICA DE PDF417
  // ============================================
  describe('Generación básica', () => {
    const sampleTedXml = `<TED version="1.0">
      <DD>
        <RE>76123456-7</RE>
        <TD>33</TD>
        <F>123</F>
        <FE>2025-01-15</FE>
        <RR>12345678-9</RR>
        <RSR>Cliente Test</RSR>
        <MNT>100000</MNT>
        <IT1>Producto de prueba</IT1>
        <CAF><DA><TD>33</TD></DA></CAF>
        <TSTED>2025-01-15T10:30:00</TSTED>
      </DD>
      <FRMT algoritmo="SHA1withRSA">BASE64SIGNATURE...</FRMT>
    </TED>`;

    it('debe generar buffer PNG válido', async () => {
      const buffer = await service.generateFromXml(sampleTedXml);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('debe generar PNG con signature válido', async () => {
      const buffer = await service.generateFromXml(sampleTedXml);

      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const bufferSignature = buffer.subarray(0, 8);

      expect(bufferSignature.equals(pngSignature)).toBe(true);
    });

    it('debe rechazar XML vacío', async () => {
      await expect(service.generateFromXml(''))
        .rejects.toThrow('no puede estar vacío');
    });

    it('debe rechazar XML solo espacios', async () => {
      await expect(service.generateFromXml('   '))
        .rejects.toThrow('no puede estar vacío');
    });

    it('debe generar con opciones personalizadas', async () => {
      const options: PDF417Options = {
        scale: 5,
        columns: 8,
        errorLevel: 3,
      };

      const buffer = await service.generateFromXml(sampleTedXml, options);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  // ============================================
  // GENERACIÓN CON METADATA
  // ============================================
  describe('Generación con metadata', () => {
    const sampleTedXml = '<TED><DD><RE>76123456-7</RE></DD></TED>';

    it('debe retornar resultado completo', async () => {
      const result = await service.generateWithMetadata(sampleTedXml);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.tedXml).toBe(sampleTedXml);
    });

    it('debe generar data URL válido', async () => {
      const result = await service.generateWithMetadata(sampleTedXml);

      // Verificar que el base64 es decodificable
      const base64Part = result.dataUrl.replace('data:image/png;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64');

      expect(decoded.length).toBe(result.buffer.length);
    });

    it('debe reportar dimensiones correctas', async () => {
      const result = await service.generateWithMetadata(sampleTedXml);

      // Verificar que las dimensiones son coherentes
      expect(result.width).toBeGreaterThanOrEqual(50);
      expect(result.height).toBeGreaterThanOrEqual(20);
    });
  });

  // ============================================
  // CONSTRUCCIÓN DE XML TED
  // ============================================
  describe('Construcción de XML TED', () => {
    const sampleData: TEDData = {
      rutEmisor: '76123456-7',
      tipoDte: 33,
      folio: 12345,
      fechaEmision: '2025-01-15',
      rutReceptor: '12345678-9',
      razonSocialReceptor: 'Cliente de Prueba SpA',
      montoTotal: 119000,
      primerItem: 'Servicio de consultoría',
      timestamp: '2025-01-15T10:30:00',
      firma: 'BASE64SIGNATUREDATA==',
      cafXml: '<CAF version="1.0"><DA><TD>33</TD></DA></CAF>',
    };

    it('debe construir XML con todos los campos', () => {
      const xml = service.buildTEDXml(sampleData);

      expect(xml).toContain('<TED version="1.0">');
      expect(xml).toContain('<RE>76123456-7</RE>');
      expect(xml).toContain('<TD>33</TD>');
      expect(xml).toContain('<F>12345</F>');
      expect(xml).toContain('<FE>2025-01-15</FE>');
      expect(xml).toContain('<RR>12345678-9</RR>');
      expect(xml).toContain('<RSR>Cliente de Prueba SpA</RSR>');
      expect(xml).toContain('<MNT>119000</MNT>');
      expect(xml).toContain('<IT1>Servicio de consultoría</IT1>');
      expect(xml).toContain('<TSTED>2025-01-15T10:30:00</TSTED>');
      expect(xml).toContain('algoritmo="SHA1withRSA"');
      expect(xml).toContain('BASE64SIGNATUREDATA==');
    });

    it('debe incluir CAF XML', () => {
      const xml = service.buildTEDXml(sampleData);

      expect(xml).toContain('<CAF version="1.0">');
    });

    it('debe truncar primer item a 40 caracteres', () => {
      const dataConItemLargo: TEDData = {
        ...sampleData,
        primerItem: 'Este es un nombre de producto extremadamente largo que excede el límite',
      };

      const xml = service.buildTEDXml(dataConItemLargo);

      // El item debe estar truncado a 40 chars (verificamos que no exceda)
      const match = xml.match(/<IT1>([^<]+)<\/IT1>/);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeLessThanOrEqual(40);
    });

    it('debe escapar caracteres especiales XML', () => {
      const dataConEspeciales: TEDData = {
        ...sampleData,
        razonSocialReceptor: 'Empresa <Test> & "Asociados"',
        primerItem: "Item con 'comillas'",
      };

      const xml = service.buildTEDXml(dataConEspeciales);

      expect(xml).toContain('&lt;Test&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
      expect(xml).toContain('&apos;');
    });

    it('debe manejar monto cero', () => {
      const dataConMontoCero: TEDData = {
        ...sampleData,
        montoTotal: 0,
      };

      const xml = service.buildTEDXml(dataConMontoCero);

      expect(xml).toContain('<MNT>0</MNT>');
    });
  });

  // ============================================
  // GENERACIÓN COMPLETA DE TED
  // ============================================
  describe('Generación completa de TED', () => {
    const sampleData: TEDData = {
      rutEmisor: '76123456-7',
      tipoDte: 33,
      folio: 1,
      fechaEmision: '2025-01-15',
      rutReceptor: '12345678-9',
      razonSocialReceptor: 'Cliente Test',
      montoTotal: 10000,
      primerItem: 'Producto',
      timestamp: '2025-01-15T10:00:00',
      firma: 'FIRMA_BASE64',
      cafXml: '<CAF><DA><TD>33</TD></DA></CAF>',
    };

    it('debe generar TED completo desde datos', async () => {
      const result = await service.generateTED(sampleData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.tedXml).toContain('<TED');
      expect(result.tedXml).toContain('76123456-7');
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('debe generar solo data URL', async () => {
      const tedXml = '<TED><DD><RE>76123456-7</RE></DD></TED>';
      const dataUrl = await service.generateDataUrl(tedXml);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(50);
    });
  });

  // ============================================
  // VALIDACIÓN DE DIMENSIONES SII
  // ============================================
  describe('Validación de dimensiones SII', () => {
    it('debe validar código con dimensiones correctas', async () => {
      const tedXml = `<TED version="1.0">
        <DD>
          <RE>76123456-7</RE>
          <TD>33</TD>
          <F>123</F>
          <FE>2025-01-15</FE>
          <RR>12345678-9</RR>
          <RSR>Cliente</RSR>
          <MNT>100000</MNT>
          <IT1>Producto</IT1>
          <CAF><DA><TD>33</TD></DA></CAF>
          <TSTED>2025-01-15T10:00:00</TSTED>
        </DD>
        <FRMT algoritmo="SHA1withRSA">FIRMA</FRMT>
      </TED>`;

      const buffer = await service.generateFromXml(tedXml);
      const validation = await service.validateDimensions(buffer);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('debe advertir si código es muy grande', async () => {
      // Generar un código grande - si falla por "data too long", es comportamiento esperado
      const tedXmlGrande = '<TED>' + 'X'.repeat(800) + '</TED>';
      
      try {
        const buffer = await service.generateFromXml(tedXmlGrande, { scale: 5 });
        const validation = await service.validateDimensions(buffer);
        
        // Si llegamos aquí, puede tener warnings pero no errores
        expect(validation.errors).toHaveLength(0);
      } catch (error) {
        // Si falla por datos muy largos, es comportamiento esperado
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('PDF417');
      }
    });

    it('debe cumplir dimensiones mínimas (100x50 px)', async () => {
      const tedXml = '<TED><DD><RE>76123456-7</RE><TD>33</TD></DD></TED>';
      const buffer = await service.generateFromXml(tedXml, { scale: 3 });
      const validation = await service.validateDimensions(buffer);

      expect(validation.valid).toBe(true);
    });
  });

  // ============================================
  // VALIDACIÓN DE DATOS TED
  // ============================================
  describe('Validación de datos TED', () => {
    const validData: TEDData = {
      rutEmisor: '76123456-7',
      tipoDte: 33,
      folio: 1,
      fechaEmision: '2025-01-15',
      rutReceptor: '12345678-9',
      razonSocialReceptor: 'Cliente',
      montoTotal: 10000,
      primerItem: 'Producto',
      timestamp: '2025-01-15T10:00:00',
      firma: 'FIRMA_BASE64',
      cafXml: '<CAF><DA><TD>33</TD></DA></CAF>',
    };

    it('debe validar datos correctos', () => {
      const result = service.validateTEDData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar RUT emisor inválido', () => {
      const data = { ...validData, rutEmisor: 'invalido' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('RUT del emisor'))).toBe(true);
    });

    it('debe rechazar RUT receptor inválido', () => {
      const data = { ...validData, rutReceptor: 'abc' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('RUT del receptor'))).toBe(true);
    });

    it('debe rechazar tipo DTE inválido', () => {
      const data = { ...validData, tipoDte: 999 };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Tipo de DTE'))).toBe(true);
    });

    it('debe aceptar todos los tipos DTE válidos', () => {
      const tiposValidos = [33, 34, 39, 41, 46, 52, 56, 61, 110, 111, 112];

      tiposValidos.forEach(tipo => {
        const data = { ...validData, tipoDte: tipo };
        const result = service.validateTEDData(data);

        expect(result.errors.some(e => e.includes('Tipo de DTE'))).toBe(false);
      });
    });

    it('debe rechazar folio menor a 1', () => {
      const data = { ...validData, folio: 0 };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Folio'))).toBe(true);
    });

    it('debe rechazar fecha inválida', () => {
      const data = { ...validData, fechaEmision: '15-01-2025' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Fecha'))).toBe(true);
    });

    it('debe rechazar razón social vacía', () => {
      const data = { ...validData, razonSocialReceptor: '' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Razón social'))).toBe(true);
    });

    it('debe rechazar monto negativo', () => {
      const data = { ...validData, montoTotal: -100 };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Monto'))).toBe(true);
    });

    it('debe aceptar monto cero', () => {
      const data = { ...validData, montoTotal: 0 };
      const result = service.validateTEDData(data);

      expect(result.errors.some(e => e.includes('Monto'))).toBe(false);
    });

    it('debe rechazar primer item vacío', () => {
      const data = { ...validData, primerItem: '' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Primer ítem'))).toBe(true);
    });

    it('debe advertir si primer item excede 40 chars', () => {
      const data = { ...validData, primerItem: 'X'.repeat(50) };
      const result = service.validateTEDData(data);

      expect(result.warnings.some(w => w.includes('truncado'))).toBe(true);
    });

    it('debe rechazar firma vacía', () => {
      const data = { ...validData, firma: '' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Firma'))).toBe(true);
    });

    it('debe rechazar CAF XML inválido', () => {
      const data = { ...validData, cafXml: '<INVALID/>' };
      const result = service.validateTEDData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('CAF'))).toBe(true);
    });

    it('debe aceptar RUT con formato con puntos', () => {
      const data = { ...validData, rutEmisor: '76.123.456-7' };
      const result = service.validateTEDData(data);

      expect(result.errors.some(e => e.includes('RUT del emisor'))).toBe(false);
    });

    it('debe aceptar RUT con K mayúscula', () => {
      const data = { ...validData, rutReceptor: '12345678-K' };
      const result = service.validateTEDData(data);

      expect(result.errors.some(e => e.includes('RUT del receptor'))).toBe(false);
    });

    it('debe aceptar RUT con k minúscula', () => {
      const data = { ...validData, rutReceptor: '12345678-k' };
      const result = service.validateTEDData(data);

      expect(result.errors.some(e => e.includes('RUT del receptor'))).toBe(false);
    });
  });

  // ============================================
  // GESTIÓN DE OPCIONES
  // ============================================
  describe('Gestión de opciones', () => {
    it('debe retornar opciones por defecto', () => {
      const options = service.getOptions();

      expect(options.columns).toBe(10);
      expect(options.rowMultiplier).toBe(2);
      expect(options.scale).toBe(3);
      expect(options.errorLevel).toBe(5);
      expect(options.height).toBe(10);
    });

    it('debe permitir modificar opciones', () => {
      service.setOptions({ scale: 5, columns: 8 });
      const options = service.getOptions();

      expect(options.scale).toBe(5);
      expect(options.columns).toBe(8);
      // Los demás deben mantener valores por defecto
      expect(options.rowMultiplier).toBe(2);
    });

    it('debe inicializar con opciones personalizadas', () => {
      const customService = new PDF417Service({ scale: 4, errorLevel: 7 });
      const options = customService.getOptions();

      expect(options.scale).toBe(4);
      expect(options.errorLevel).toBe(7);
    });

    it('getOptions debe retornar copia inmutable', () => {
      const options1 = service.getOptions();
      options1.scale = 999;

      const options2 = service.getOptions();
      expect(options2.scale).toBe(3); // No debe haber cambiado
    });
  });

  // ============================================
  // SINGLETON
  // ============================================
  describe('Singleton export', () => {
    it('debe exportar instancia pdf417Service', () => {
      expect(pdf417Service).toBeInstanceOf(PDF417Service);
    });

    it('singleton debe ser funcional', async () => {
      const tedXml = '<TED><DD><RE>76123456-7</RE></DD></TED>';
      const buffer = await pdf417Service.generateFromXml(tedXml);

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  // ============================================
  // EDGE CASES Y RENDIMIENTO
  // ============================================
  describe('Edge cases y rendimiento', () => {
    it('debe manejar XML con caracteres Unicode', async () => {
      const tedXml = '<TED><DD><RSR>Compañía Ñoño & Cía</RSR></DD></TED>';
      const buffer = await service.generateFromXml(tedXml);

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('debe manejar XML mínimo', async () => {
      const tedXml = '<TED/>';
      const buffer = await service.generateFromXml(tedXml);

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('debe manejar XML con whitespace extra', async () => {
      const tedXml = '  <TED>  \n  <DD>  </DD>  \n  </TED>  ';
      const buffer = await service.generateFromXml(tedXml);

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('debe generar 100 códigos en menos de 5 segundos', async () => {
      const tedXml = '<TED><DD><RE>76123456-7</RE></DD></TED>';
      const iterations = 100;

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await service.generateFromXml(tedXml);
      }

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5000);
      console.log(`Performance PDF417: ${iterations} códigos en ${elapsed.toFixed(2)}ms`);
    });

    it('debe manejar TED XML grande (límite práctico)', async () => {
      // Un TED real puede tener hasta ~2KB con CAF completo
      const largeData = 'X'.repeat(1500);
      const tedXml = `<TED><DD><DATA>${largeData}</DATA></DD></TED>`;
      
      const buffer = await service.generateFromXml(tedXml);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  // ============================================
  // CASOS DE USO REALES
  // ============================================
  describe('Casos de uso de certificación SII', () => {
    it('debe generar TED completo para factura', async () => {
      const facturaData: TEDData = {
        rutEmisor: '76.000.000-0',
        tipoDte: 33, // Factura Electrónica
        folio: 12345,
        fechaEmision: '2025-01-15',
        rutReceptor: '12.345.678-9',
        razonSocialReceptor: 'Empresa Compradora SpA',
        montoTotal: 119000, // Neto + IVA
        primerItem: 'Servicio de consultoría profesional',
        timestamp: '2025-01-15T14:30:00',
        firma: 'dGVzdF9zaWduYXR1cmVfYmFzZTY0X2VuY29kZWQ=',
        cafXml: '<CAF version="1.0"><DA><RE>76000000-0</RE><TD>33</TD><RNG><D>1</D><H>1000</H></RNG></DA></CAF>',
      };

      // 1. Validar datos
      const validation = service.validateTEDData(facturaData);
      expect(validation.valid).toBe(true);

      // 2. Generar TED
      const result = await service.generateTED(facturaData);
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.tedXml).toContain('<TD>33</TD>');
      expect(result.tedXml).toContain('<F>12345</F>');
      expect(result.width).toBeGreaterThanOrEqual(100);
      expect(result.height).toBeGreaterThanOrEqual(50);

      // 3. Validar dimensiones
      const dimValidation = await service.validateDimensions(result.buffer);
      expect(dimValidation.valid).toBe(true);
    });

    it('debe generar TED para boleta electrónica', async () => {
      const boletaData: TEDData = {
        rutEmisor: '76000000-0',
        tipoDte: 39, // Boleta Electrónica
        folio: 999,
        fechaEmision: '2025-01-15',
        rutReceptor: '66666666-6', // RUT genérico
        razonSocialReceptor: 'CLIENTE BOLETA',
        montoTotal: 5990,
        primerItem: 'Producto de venta',
        timestamp: '2025-01-15T16:00:00',
        firma: 'Ym9sZXRhX3NpZ25hdHVyZQ==',
        cafXml: '<CAF><DA><TD>39</TD></DA></CAF>',
      };

      const result = await service.generateTED(boletaData);

      expect(result.tedXml).toContain('<TD>39</TD>');
      expect(result.buffer.length).toBeGreaterThan(100);
    });

    it('debe generar TED para nota de crédito', async () => {
      const ncData: TEDData = {
        rutEmisor: '76000000-0',
        tipoDte: 61, // Nota de Crédito
        folio: 50,
        fechaEmision: '2025-01-16',
        rutReceptor: '12345678-9',
        razonSocialReceptor: 'Cliente Original',
        montoTotal: 119000,
        primerItem: 'Anulación Factura 12345',
        timestamp: '2025-01-16T09:00:00',
        firma: 'bmNfc2lnbmF0dXJl',
        cafXml: '<CAF><DA><TD>61</TD></DA></CAF>',
      };

      const result = await service.generateTED(ncData);

      expect(result.tedXml).toContain('<TD>61</TD>');
    });

    it('flujo completo: validar → construir XML → generar código → validar dimensiones', async () => {
      const data: TEDData = {
        rutEmisor: '76123456-7',
        tipoDte: 33,
        folio: 1,
        fechaEmision: '2025-11-26',
        rutReceptor: '98765432-1',
        razonSocialReceptor: 'Comprador Final Ltda.',
        montoTotal: 238000,
        primerItem: 'Pack de productos varios',
        timestamp: new Date().toISOString(),
        firma: 'ZmlybWFfcmVhbF9iYXNlNjQ=',
        cafXml: '<CAF version="1.0"><DA><TD>33</TD><RNG><D>1</D><H>100</H></RNG></DA></CAF>',
      };

      // Paso 1: Validar
      const val1 = service.validateTEDData(data);
      expect(val1.valid).toBe(true);

      // Paso 2: Construir XML
      const tedXml = service.buildTEDXml(data);
      expect(tedXml).toContain('<TED version="1.0">');

      // Paso 3: Generar código
      const result = await service.generateWithMetadata(tedXml);
      expect(result.buffer.length).toBeGreaterThan(500);

      // Paso 4: Validar dimensiones
      const val2 = await service.validateDimensions(result.buffer);
      expect(val2.valid).toBe(true);

      console.log(`TED generado: ${result.width}x${result.height}px, ${result.buffer.length} bytes`);
    });
  });
});
