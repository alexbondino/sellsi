/**
 * PDF417Service - Generación de código de barras para Timbre Electrónico (TED)
 * 
 * El SII de Chile requiere que todos los DTEs incluyan un código PDF417
 * que contiene el XML del TED firmado digitalmente.
 * 
 * Especificaciones SII:
 * - Formato: PDF417
 * - Contenido: XML del TED completo
 * - Dimensiones mínimas: ~2cm x ~1cm a 150dpi
 * - Debe ser legible por escáneres estándar
 */

import bwipjs from 'bwip-js';

// ============================================
// INTERFACES
// ============================================

export interface PDF417Options {
  /** Número de columnas del código (default: 10) */
  columns?: number;
  /** Multiplicador de altura de fila (default: 2) */
  rowMultiplier?: number;
  /** Escala general del código (default: 3) */
  scale?: number;
  /** Nivel de corrección de errores 0-8 (default: 5) */
  errorLevel?: number;
  /** Altura del módulo (default: 10) */
  height?: number;
}

export interface TEDData {
  /** RUT del emisor */
  rutEmisor: string;
  /** Tipo de DTE (33, 34, 39, etc.) */
  tipoDte: number;
  /** Número de folio */
  folio: number;
  /** Fecha de emisión (YYYY-MM-DD) */
  fechaEmision: string;
  /** RUT del receptor */
  rutReceptor: string;
  /** Razón social del receptor */
  razonSocialReceptor: string;
  /** Monto total */
  montoTotal: number;
  /** Primer ítem (nombre del producto) - máx 40 chars */
  primerItem: string;
  /** Timestamp del timbre (ISO 8601) */
  timestamp: string;
  /** Firma del TED (Base64) */
  firma: string;
  /** Nodo CAF original (para incluir en DD) */
  cafXml: string;
}

export interface PDF417Result {
  /** Buffer PNG del código de barras */
  buffer: Buffer;
  /** Data URL para embeber en HTML/PDF */
  dataUrl: string;
  /** Ancho en pixels */
  width: number;
  /** Alto en pixels */
  height: number;
  /** XML del TED generado */
  tedXml: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_OPTIONS: Required<PDF417Options> = {
  columns: 10,
  rowMultiplier: 2,
  scale: 3,
  errorLevel: 5,
  height: 10,
};

// Dimensiones mínimas requeridas por SII (en pixels a escala 3)
const MIN_WIDTH_PX = 100;
const MIN_HEIGHT_PX = 50;

// Límite de caracteres para el primer ítem
const MAX_ITEM_LENGTH = 40;

// ============================================
// SERVICIO PDF417
// ============================================

export class PDF417Service {
  private options: Required<PDF417Options>;

  constructor(options?: PDF417Options) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Genera código PDF417 a partir del XML del TED
   */
  async generateFromXml(tedXml: string, options?: PDF417Options): Promise<Buffer> {
    const opts = { ...this.options, ...options };

    if (!tedXml || tedXml.trim().length === 0) {
      throw new Error('El XML del TED no puede estar vacío');
    }

    try {
      // bwip-js v4 usa toBuffer con opciones genéricas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = await (bwipjs.toBuffer as any)({
        bcid: 'pdf417',
        text: tedXml,
        scale: opts.scale,
        height: opts.height,
        includetext: false,
        // PDF417 specific options
        columns: opts.columns,
        rowmult: opts.rowMultiplier,
        eclevel: opts.errorLevel,
      });

      return Buffer.from(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error generando PDF417: ${message}`);
    }
  }

  /**
   * Genera código PDF417 con resultado completo incluyendo dimensiones y data URL
   */
  async generateWithMetadata(tedXml: string, options?: PDF417Options): Promise<PDF417Result> {
    const buffer = await this.generateFromXml(tedXml, options);
    
    // Obtener dimensiones del PNG
    const dimensions = this.getPngDimensions(buffer);
    
    // Generar data URL
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    return {
      buffer,
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      tedXml,
    };
  }

  /**
   * Genera el XML del TED a partir de los datos
   */
  buildTEDXml(data: TEDData): string {
    // Truncar primer item si es necesario
    const item1 = data.primerItem.substring(0, MAX_ITEM_LENGTH);
    
    // Construir XML del TED según especificación SII
    const tedXml = `<TED version="1.0">
  <DD>
    <RE>${this.escapeXml(data.rutEmisor)}</RE>
    <TD>${data.tipoDte}</TD>
    <F>${data.folio}</F>
    <FE>${data.fechaEmision}</FE>
    <RR>${this.escapeXml(data.rutReceptor)}</RR>
    <RSR>${this.escapeXml(data.razonSocialReceptor)}</RSR>
    <MNT>${data.montoTotal}</MNT>
    <IT1>${this.escapeXml(item1)}</IT1>
    ${data.cafXml}
    <TSTED>${data.timestamp}</TSTED>
  </DD>
  <FRMT algoritmo="SHA1withRSA">${data.firma}</FRMT>
</TED>`;

    return tedXml;
  }

  /**
   * Genera PDF417 completo a partir de los datos del TED
   */
  async generateTED(data: TEDData, options?: PDF417Options): Promise<PDF417Result> {
    const tedXml = this.buildTEDXml(data);
    return this.generateWithMetadata(tedXml, options);
  }

  /**
   * Genera solo el Data URL (para uso directo en HTML/PDF)
   */
  async generateDataUrl(tedXml: string, options?: PDF417Options): Promise<string> {
    const buffer = await this.generateFromXml(tedXml, options);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Valida que el código generado cumpla especificaciones SII
   */
  async validateDimensions(buffer: Buffer): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dimensions = this.getPngDimensions(buffer);

    if (dimensions.width < MIN_WIDTH_PX) {
      errors.push(`Ancho insuficiente: ${dimensions.width}px < ${MIN_WIDTH_PX}px mínimo`);
    }

    if (dimensions.height < MIN_HEIGHT_PX) {
      errors.push(`Alto insuficiente: ${dimensions.height}px < ${MIN_HEIGHT_PX}px mínimo`);
    }

    // Advertencia si es muy grande (podría no caber en el PDF)
    if (dimensions.width > 500) {
      warnings.push(`Ancho muy grande: ${dimensions.width}px - verificar que cabe en el documento`);
    }

    if (dimensions.height > 200) {
      warnings.push(`Alto muy grande: ${dimensions.height}px - verificar que cabe en el documento`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida los datos del TED antes de generar
   */
  validateTEDData(data: TEDData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar RUT emisor
    if (!data.rutEmisor || !this.isValidRut(data.rutEmisor)) {
      errors.push('RUT del emisor inválido');
    }

    // Validar tipo DTE
    const tiposValidos = [33, 34, 39, 41, 46, 52, 56, 61, 110, 111, 112];
    if (!tiposValidos.includes(data.tipoDte)) {
      errors.push(`Tipo de DTE inválido: ${data.tipoDte}`);
    }

    // Validar folio
    if (!data.folio || data.folio < 1) {
      errors.push('Folio debe ser mayor a 0');
    }

    // Validar fecha
    if (!this.isValidDate(data.fechaEmision)) {
      errors.push('Fecha de emisión inválida (formato: YYYY-MM-DD)');
    }

    // Validar RUT receptor
    if (!data.rutReceptor || !this.isValidRut(data.rutReceptor)) {
      errors.push('RUT del receptor inválido');
    }

    // Validar razón social
    if (!data.razonSocialReceptor || data.razonSocialReceptor.trim().length === 0) {
      errors.push('Razón social del receptor es requerida');
    }

    // Validar monto
    if (data.montoTotal < 0) {
      errors.push('Monto total no puede ser negativo');
    }

    // Validar primer item
    if (!data.primerItem || data.primerItem.trim().length === 0) {
      errors.push('Primer ítem es requerido');
    } else if (data.primerItem.length > MAX_ITEM_LENGTH) {
      warnings.push(`Primer ítem será truncado a ${MAX_ITEM_LENGTH} caracteres`);
    }

    // Validar timestamp
    if (!data.timestamp) {
      errors.push('Timestamp es requerido');
    }

    // Validar firma
    if (!data.firma || data.firma.trim().length === 0) {
      errors.push('Firma del TED es requerida');
    }

    // Validar CAF
    if (!data.cafXml || !data.cafXml.includes('<CAF')) {
      errors.push('XML del CAF es requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Obtiene las opciones actuales
   */
  getOptions(): Required<PDF417Options> {
    return { ...this.options };
  }

  /**
   * Actualiza las opciones por defecto
   */
  setOptions(options: PDF417Options): void {
    this.options = { ...this.options, ...options };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Extrae dimensiones de un PNG a partir de su header
   * PNG header: 8 bytes signature + IHDR chunk con width/height
   */
  private getPngDimensions(buffer: Buffer): { width: number; height: number } {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    // Luego IHDR chunk: length (4) + 'IHDR' (4) + width (4) + height (4)
    
    if (buffer.length < 24) {
      throw new Error('Buffer PNG inválido: muy pequeño');
    }

    // Verificar signature PNG
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    if (!buffer.subarray(0, 8).equals(pngSignature)) {
      throw new Error('Buffer no es un PNG válido');
    }

    // IHDR chunk comienza en byte 8
    // bytes 8-11: length del chunk
    // bytes 12-15: 'IHDR'
    // bytes 16-19: width (big-endian)
    // bytes 20-23: height (big-endian)
    
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Valida formato de RUT chileno (simplificado)
   */
  private isValidRut(rut: string): boolean {
    // Formato esperado: 12345678-9 o 12.345.678-9
    const cleaned = rut.replace(/\./g, '').replace(/-/g, '');
    return /^\d{7,8}[\dkK]$/.test(cleaned);
  }

  /**
   * Valida formato de fecha YYYY-MM-DD
   */
  private isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const pdf417Service = new PDF417Service();
