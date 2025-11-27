/**
 * Servicio de Validación XSD para DTEs
 *
 * OBLIGATORIO antes de enviar documentos al SII.
 * Valida XML contra esquemas oficiales del SII.
 *
 * @module services/xml-validator.service
 * @see CERTIFICACION.md §3
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';
import { parseString } from 'xml2js';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Resultado de validación XSD
 */
export interface ValidationResult {
  /** Si el XML es válido según el schema */
  valid: boolean;
  /** Lista de errores encontrados */
  errors: ValidationError[];
  /** Advertencias (no bloquean pero deben revisarse) */
  warnings: ValidationWarning[];
  /** Schema usado para validar */
  schemaUsed: string;
  /** Tiempo de validación en ms */
  validationTimeMs: number;
}

/**
 * Error de validación
 */
export interface ValidationError {
  /** Línea donde ocurre el error (si disponible) */
  line: number;
  /** Columna donde ocurre el error (si disponible) */
  column: number;
  /** Mensaje de error */
  message: string;
  /** Tipo de error */
  type: 'schema' | 'parsing' | 'structure' | 'missing_element' | 'invalid_value';
  /** Elemento que causó el error (si identificable) */
  element?: string;
}

/**
 * Advertencia de validación
 */
export interface ValidationWarning {
  message: string;
  element?: string;
  suggestion?: string;
}

/**
 * Tipo de documento DTE
 */
export type DTESchemaType =
  | 'DTE'
  | 'EnvioDTE'
  | 'EnvioBoleta'
  | 'ConsumoFolio'
  | 'LibroCV'
  | 'LibroBoleta'
  | 'LibroGuia'
  | 'Recibos';

/**
 * Mapeo de tipo de documento a archivo XSD
 */
const SCHEMA_MAP: Record<DTESchemaType, string> = {
  DTE: 'DTE_v10.xsd',
  EnvioDTE: 'EnvioDTE_v10.xsd',
  EnvioBoleta: 'EnvioBOLETA_v11.xsd',
  ConsumoFolio: 'ConsumoFolio_v10.xsd',
  LibroCV: 'LibroCV_v10.xsd',
  LibroBoleta: 'LibroBOLETA_v10.xsd',
  LibroGuia: 'LibroGuia_v10.xsd',
  Recibos: 'Recibos_v10.xsd',
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Servicio de validación XML contra esquemas XSD del SII
 *
 * Provee dos modos de validación:
 * 1. Validación estructural (JS puro) - Rápida, sin dependencias nativas
 * 2. Validación XSD completa (xmllint) - Más estricta, requiere xmllint instalado
 *
 * @example
 * ```typescript
 * const validator = new XmlValidatorService('./schemas');
 *
 * // Validación rápida (estructura)
 * const result = validator.validateDTE(xmlString);
 *
 * // Validación estricta con XSD
 * const strictResult = validator.validateWithXSD(xmlString, 'EnvioDTE');
 *
 * // Validar y lanzar excepción si hay error
 * validator.validateOrThrow(xmlString, 'EnvioDTE');
 * ```
 */
export class XmlValidatorService {
  private schemasPath: string;
  private schemasLoaded: Set<string> = new Set();
  private xmllintAvailable: boolean | null = null;

  /**
   * Constructor
   * @param schemasPath Ruta al directorio con los XSD del SII
   */
  constructor(schemasPath: string) {
    this.schemasPath = schemasPath;
    this.loadSchemasList();
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS - VALIDACIÓN POR TIPO
  // ==========================================================================

  /**
   * Validar un DTE individual
   * @param dteXml XML del DTE
   * @returns Resultado de validación
   */
  validateDTE(dteXml: string): ValidationResult {
    return this.validate(dteXml, 'DTE');
  }

  /**
   * Validar un EnvioDTE (sobre con múltiples DTEs)
   * @param envioXml XML del EnvioDTE
   * @returns Resultado de validación
   */
  validateEnvioDTE(envioXml: string): ValidationResult {
    return this.validate(envioXml, 'EnvioDTE');
  }

  /**
   * Validar un EnvioBoleta
   * @param envioXml XML del EnvioBoleta
   * @returns Resultado de validación
   */
  validateEnvioBoleta(envioXml: string): ValidationResult {
    return this.validate(envioXml, 'EnvioBoleta');
  }

  /**
   * Validar Consumo de Folios (RCOF)
   * @param consumoXml XML del ConsumoFolio
   * @returns Resultado de validación
   */
  validateConsumoFolio(consumoXml: string): ValidationResult {
    return this.validate(consumoXml, 'ConsumoFolio');
  }

  /**
   * Validar Libro de Compra/Venta
   * @param libroXml XML del LibroCV
   * @returns Resultado de validación
   */
  validateLibroCV(libroXml: string): ValidationResult {
    return this.validate(libroXml, 'LibroCV');
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS - VALIDACIÓN GENÉRICA
  // ==========================================================================

  /**
   * Validación combinada (estructura + XSD si disponible)
   * @param xml String XML a validar
   * @param schemaType Tipo de schema a usar
   * @returns Resultado de validación
   */
  validate(xml: string, schemaType: DTESchemaType): ValidationResult {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validación de parsing básico
    const parseResult = this.validateParsing(xml);
    if (!parseResult.valid) {
      return {
        valid: false,
        errors: parseResult.errors,
        warnings: [],
        schemaUsed: SCHEMA_MAP[schemaType],
        validationTimeMs: Date.now() - startTime,
      };
    }

    // 2. Validación estructural específica del tipo
    const structureResult = this.validateStructure(xml, schemaType);
    errors.push(...structureResult.errors);
    warnings.push(...structureResult.warnings);

    // 3. Intentar validación XSD con xmllint (si disponible)
    if (this.isXmllintAvailable()) {
      const xsdResult = this.validateWithXmlLint(xml, schemaType);
      errors.push(...xsdResult.errors);
      warnings.push(...xsdResult.warnings);
    } else {
      warnings.push({
        message:
          'xmllint no disponible - validación XSD completa no ejecutada',
        suggestion:
          'Instalar xmllint para validación más estricta: apt-get install libxml2-utils',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schemaUsed: SCHEMA_MAP[schemaType],
      validationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Validar y lanzar excepción si es inválido
   * Usar antes de enviar al SII para garantizar validez
   *
   * @param xml String XML a validar
   * @param schemaType Tipo de schema
   * @throws Error si el XML no es válido
   */
  validateOrThrow(xml: string, schemaType: DTESchemaType): void {
    const result = this.validate(xml, schemaType);

    if (!result.valid) {
      const errorMessages = result.errors
        .map((e) => `[${e.type}] Línea ${e.line}: ${e.message}`)
        .join('\n');

      throw new Error(
        `XML inválido según ${result.schemaUsed}:\n${errorMessages}`
      );
    }
  }

  /**
   * Validación estricta solo con XSD (requiere xmllint)
   * @param xml String XML a validar
   * @param schemaType Tipo de schema
   * @returns Resultado de validación
   * @throws Error si xmllint no está disponible
   */
  validateStrictXSD(xml: string, schemaType: DTESchemaType): ValidationResult {
    if (!this.isXmllintAvailable()) {
      throw new Error(
        'xmllint no está disponible. Instalar con: apt-get install libxml2-utils'
      );
    }

    const startTime = Date.now();
    const result = this.validateWithXmlLint(xml, schemaType);

    return {
      valid: result.errors.length === 0,
      errors: result.errors,
      warnings: result.warnings,
      schemaUsed: SCHEMA_MAP[schemaType],
      validationTimeMs: Date.now() - startTime,
    };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - VALIDACIÓN DE PARSING
  // ==========================================================================

  /**
   * Validar que el XML sea parseable
   */
  private validateParsing(xml: string): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Verificar que no esté vacío
    if (!xml || xml.trim().length === 0) {
      errors.push({
        line: 0,
        column: 0,
        message: 'XML vacío o nulo',
        type: 'parsing',
      });
      return { valid: false, errors };
    }

    // Verificar declaración XML
    if (!xml.trim().startsWith('<?xml') && !xml.trim().startsWith('<')) {
      errors.push({
        line: 1,
        column: 0,
        message: 'El documento no parece ser XML válido',
        type: 'parsing',
      });
      return { valid: false, errors };
    }

    // Intentar parsear con xml2js de forma síncrona
    let parseError: Error | null = null;
    parseString(xml, { async: false, strict: true }, (err) => {
      if (err) {
        parseError = err as Error;
      }
    });

    if (parseError !== null) {
      const errorMessage = (parseError as Error).message || String(parseError);
      const lineMatch = errorMessage.match(/line[:\s]+(\d+)/i);
      const columnMatch = errorMessage.match(/col(?:umn)?[:\s]+(\d+)/i);

      errors.push({
        line: lineMatch ? parseInt(lineMatch[1], 10) : 0,
        column: columnMatch ? parseInt(columnMatch[1], 10) : 0,
        message: `Error de parsing: ${errorMessage}`,
        type: 'parsing',
      });
    }

    return { valid: errors.length === 0, errors };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - VALIDACIÓN ESTRUCTURAL
  // ==========================================================================

  /**
   * Validación estructural según tipo de documento
   */
  private validateStructure(
    xml: string,
    schemaType: DTESchemaType
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (schemaType) {
      case 'DTE':
        this.validateDTEStructure(xml, errors, warnings);
        break;
      case 'EnvioDTE':
        this.validateEnvioDTEStructure(xml, errors, warnings);
        break;
      case 'EnvioBoleta':
        this.validateEnvioBoletaStructure(xml, errors, warnings);
        break;
      default:
        // Validación genérica
        this.validateGenericStructure(xml, schemaType, errors, warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validar estructura de un DTE individual
   */
  private validateDTEStructure(
    xml: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Elementos obligatorios en DTE
    const requiredElements = [
      { tag: 'Documento', desc: 'Elemento raíz Documento' },
      { tag: 'Encabezado', desc: 'Encabezado del DTE' },
      { tag: 'IdDoc', desc: 'Identificación del documento' },
      { tag: 'TipoDTE', desc: 'Tipo de DTE' },
      { tag: 'Folio', desc: 'Número de folio' },
      { tag: 'FchEmis', desc: 'Fecha de emisión' },
      { tag: 'Emisor', desc: 'Datos del emisor' },
      { tag: 'RUTEmisor', desc: 'RUT del emisor' },
      { tag: 'Receptor', desc: 'Datos del receptor' },
      { tag: 'RUTRecep', desc: 'RUT del receptor' },
      { tag: 'Totales', desc: 'Totales del documento' },
      { tag: 'MntTotal', desc: 'Monto total' },
    ];

    this.checkRequiredElements(xml, requiredElements, errors);

    // Verificar atributo ID en Documento
    if (!xml.includes('ID="') && !xml.includes("ID='")) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Elemento Documento debe tener atributo ID para firma XML-DSig',
        type: 'structure',
        element: 'Documento',
      });
    }

    // Verificar que ID esté en mayúsculas (requerido por SII)
    if (xml.includes(' Id="') || xml.includes(" Id='")) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Atributo ID debe estar en MAYÚSCULAS (ID, no Id)',
        type: 'structure',
        element: 'Documento',
      });
    }

    // Verificar TED si es documento tributario electrónico
    const hasSignature = xml.includes('<Signature') || xml.includes('<ds:Signature');
    if (hasSignature && !xml.includes('<TED')) {
      warnings.push({
        message: 'Documento firmado pero sin TED (Timbre Electrónico)',
        element: 'TED',
        suggestion: 'Agregar elemento TED con DD y FRMT antes de firmar',
      });
    }
  }

  /**
   * Validar estructura de EnvioDTE
   */
  private validateEnvioDTEStructure(
    xml: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const requiredElements = [
      { tag: 'EnvioDTE', desc: 'Elemento raíz EnvioDTE' },
      { tag: 'SetDTE', desc: 'Set de DTEs' },
      { tag: 'Caratula', desc: 'Carátula del envío' },
      { tag: 'RutEmisor', desc: 'RUT del emisor en carátula' },
      { tag: 'RutEnvia', desc: 'RUT de quien envía' },
      { tag: 'FchResol', desc: 'Fecha de resolución' },
      { tag: 'NroResol', desc: 'Número de resolución' },
    ];

    this.checkRequiredElements(xml, requiredElements, errors);

    // Verificar atributo ID en SetDTE
    const setDteMatch = xml.match(/<SetDTE[^>]*>/);
    if (setDteMatch && !setDteMatch[0].includes('ID=')) {
      errors.push({
        line: 0,
        column: 0,
        message: 'SetDTE debe tener atributo ID para firma',
        type: 'structure',
        element: 'SetDTE',
      });
    }

    // Verificar que hay al menos un DTE
    if (!xml.includes('<DTE') && !xml.includes('<Documento')) {
      errors.push({
        line: 0,
        column: 0,
        message: 'EnvioDTE debe contener al menos un DTE',
        type: 'structure',
        element: 'SetDTE',
      });
    }

    // Contar DTEs
    const dteCount = (xml.match(/<DTE\s/g) || []).length;
    if (dteCount > 2000) {
      warnings.push({
        message: `EnvioDTE contiene ${dteCount} DTEs. Máximo recomendado: 2000`,
        suggestion: 'Dividir en múltiples envíos',
      });
    }
  }

  /**
   * Validar estructura de EnvioBoleta
   */
  private validateEnvioBoletaStructure(
    xml: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const requiredElements = [
      { tag: 'EnvioBOLETA', desc: 'Elemento raíz EnvioBOLETA' },
      { tag: 'SetDTE', desc: 'Set de boletas' },
      { tag: 'Caratula', desc: 'Carátula del envío' },
    ];

    this.checkRequiredElements(xml, requiredElements, errors);

    // Verificar tipos de DTE válidos para boletas (39, 41)
    const tipoDteMatches = xml.match(/<TipoDTE>(\d+)<\/TipoDTE>/g) || [];
    for (const match of tipoDteMatches) {
      const tipo = match.match(/\d+/)?.[0];
      if (tipo && !['39', '41'].includes(tipo)) {
        warnings.push({
          message: `TipoDTE ${tipo} no es boleta electrónica. Usar 39 o 41`,
          element: 'TipoDTE',
        });
      }
    }
  }

  /**
   * Validación genérica para otros tipos
   */
  private validateGenericStructure(
    xml: string,
    schemaType: DTESchemaType,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Verificar que el elemento raíz coincida con el tipo esperado
    const expectedRoot = schemaType.replace('Envio', '');
    if (!xml.includes(`<${expectedRoot}`) && !xml.includes(`<${schemaType}`)) {
      warnings.push({
        message: `No se encontró elemento raíz esperado: ${expectedRoot} o ${schemaType}`,
        suggestion: 'Verificar que el tipo de schema sea correcto',
      });
    }
  }

  /**
   * Helper para verificar elementos requeridos
   */
  private checkRequiredElements(
    xml: string,
    elements: Array<{ tag: string; desc: string }>,
    errors: ValidationError[]
  ): void {
    for (const { tag, desc } of elements) {
      // Buscar con o sin namespace
      const hasElement =
        xml.includes(`<${tag}>`) ||
        xml.includes(`<${tag} `) ||
        xml.includes(`:${tag}>`) ||
        xml.includes(`:${tag} `);

      if (!hasElement) {
        errors.push({
          line: 0,
          column: 0,
          message: `Elemento requerido no encontrado: ${desc}`,
          type: 'missing_element',
          element: tag,
        });
      }
    }
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - VALIDACIÓN CON XMLLINT
  // ==========================================================================

  /**
   * Verificar si xmllint está disponible
   */
  private isXmllintAvailable(): boolean {
    if (this.xmllintAvailable !== null) {
      return this.xmllintAvailable;
    }

    try {
      execSync('xmllint --version', { stdio: 'pipe' });
      this.xmllintAvailable = true;
    } catch {
      this.xmllintAvailable = false;
    }

    return this.xmllintAvailable;
  }

  /**
   * Validar usando xmllint externo
   */
  private validateWithXmlLint(
    xml: string,
    schemaType: DTESchemaType
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const schemaFile = SCHEMA_MAP[schemaType];
    const schemaPath = path.join(this.schemasPath, schemaFile);

    // Verificar que existe el schema
    if (!fs.existsSync(schemaPath)) {
      warnings.push({
        message: `Schema ${schemaFile} no encontrado en ${this.schemasPath}`,
        suggestion: 'Descargar schemas XSD oficiales del SII',
      });
      return { errors, warnings };
    }

    // Crear archivo temporal
    const tempFile = path.join(
      os.tmpdir(),
      `sii_validate_${Date.now()}_${Math.random().toString(36).slice(2)}.xml`
    );

    try {
      fs.writeFileSync(tempFile, xml, 'utf-8');

      // Ejecutar xmllint
      execSync(`xmllint --noout --schema "${schemaPath}" "${tempFile}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Si no hay excepción, validación exitosa
    } catch (error: unknown) {
      // xmllint retorna código != 0 si hay errores
      const stderr = (error as { stderr?: string })?.stderr || '';
      const stdout = (error as { stdout?: string })?.stdout || '';
      const errorOutput = stderr || stdout || String(error);

      // Parsear errores de xmllint
      const lines = errorOutput.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.includes('validates') && !line.includes('fails to validate')) {
          // Intentar extraer línea y columna
          const lineMatch = line.match(/:(\d+):/);
          const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 0;

          errors.push({
            line: lineNum,
            column: 0,
            message: line.trim(),
            type: 'schema',
          });
        }
      }

      // Si no se parsearon errores específicos, agregar error genérico
      if (errors.length === 0 && errorOutput.includes('fails to validate')) {
        errors.push({
          line: 0,
          column: 0,
          message: 'XML no válido según schema XSD',
          type: 'schema',
        });
      }
    } finally {
      // Limpiar archivo temporal
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {
          // Ignorar error de limpieza
        }
      }
    }

    return { errors, warnings };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - UTILIDADES
  // ==========================================================================

  /**
   * Cargar lista de schemas disponibles
   */
  private loadSchemasList(): void {
    try {
      if (fs.existsSync(this.schemasPath)) {
        const files = fs.readdirSync(this.schemasPath);
        for (const file of files) {
          if (file.endsWith('.xsd')) {
            this.schemasLoaded.add(file);
          }
        }
        console.log(
          `[XmlValidator] Schemas disponibles: ${this.schemasLoaded.size}`
        );
      } else {
        console.warn(
          `[XmlValidator] Directorio de schemas no existe: ${this.schemasPath}`
        );
      }
    } catch (error) {
      console.error('[XmlValidator] Error cargando schemas:', error);
    }
  }

  /**
   * Obtener lista de schemas cargados
   */
  getLoadedSchemas(): string[] {
    return Array.from(this.schemasLoaded);
  }

  /**
   * Verificar si un schema específico está disponible
   */
  hasSchema(schemaType: DTESchemaType): boolean {
    const schemaFile = SCHEMA_MAP[schemaType];
    return this.schemasLoaded.has(schemaFile);
  }
}

// ============================================================================
// SINGLETON PARA USO GLOBAL (OPCIONAL)
// ============================================================================

let defaultValidator: XmlValidatorService | null = null;

/**
 * Obtener instancia singleton del validador
 * @param schemasPath Ruta a schemas (solo necesario la primera vez)
 */
export function getXmlValidator(schemasPath?: string): XmlValidatorService {
  if (!defaultValidator) {
    if (!schemasPath) {
      throw new Error(
        'schemasPath requerido para inicializar XmlValidatorService'
      );
    }
    defaultValidator = new XmlValidatorService(schemasPath);
  }
  return defaultValidator;
}
