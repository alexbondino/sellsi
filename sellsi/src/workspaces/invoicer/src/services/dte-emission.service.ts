/**
 * Servicio Principal de Emisión de DTEs
 * Orquesta todo el proceso de emisión
 * @module services/dte-emission.service
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { SignatureService } from './signature.service';

// Promisificar gzip para uso async
const gzipAsync = promisify(zlib.gzip);
import { SiiAuthService } from './sii-auth.service';
import { SiiClientService } from './sii-client.service';
import { DteBuilderService, CreateDTEInput, BuildDTEResult } from './dte-builder.service';
import { CafManagerService } from './caf-manager.service';
import { DtePrintService } from './dte-print.service';
import { 
  DTEType, CAFData, 
  SiiUploadResponse, SiiTrackingResponse,
  CertificateRecord, FolioRecord 
} from '../types';
import { EmisorContext, ParsedCertificate } from '../types/certificate.types';
import { DTEPrint } from './dte-print.service';

/**
 * Configuración de reintentos para operaciones
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Configuración por defecto de reintentos
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Resultado de emitir un DTE
 */
export interface EmitDTEResult {
  success: boolean;
  folio?: number;
  tipoDte?: DTEType;
  trackId?: string;
  dteXml?: string;
  pdfBase64?: string;
  error?: string;
}

/**
 * Servicio principal para emisión de DTEs
 */
export class DteEmissionService {
  private supabase: SupabaseClient;
  private signatureService: SignatureService;
  private authService: SiiAuthService;
  private clientService: SiiClientService;
  private builderService: DteBuilderService;
  private cafManager: CafManagerService;
  private printService: DtePrintService;
  private retryConfig: RetryConfig;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private encryptionKey: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.signatureService = new SignatureService();
    this.builderService = new DteBuilderService();
    this.cafManager = new CafManagerService();
    this.printService = new DtePrintService();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    // Auth y Client se inicializan después de cargar certificado
    this.authService = null as unknown as SiiAuthService;
    this.clientService = null as unknown as SiiClientService;
  }

  /**
   * Configura los reintentos en runtime
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Obtiene la configuración actual de reintentos
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   * Usa exponential backoff con jitter
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (!this.isRecoverableError(lastError) || attempt === this.retryConfig.maxRetries) {
          throw lastError;
        }
        
        const delay = this.calculateBackoffDelay(attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError || new Error(`Operación fallida después de ${this.retryConfig.maxRetries} reintentos: ${context}`);
  }

  /**
   * Calcula el delay con exponential backoff y jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.initialDelayMs * 
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);
    // Agregar jitter de ±20%
    const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);
    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Determina si un error es recuperable (se puede reintentar)
   */
  private isRecoverableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const recoverablePatterns = [
      'network', 'timeout', 'econnreset', 'econnrefused',
      'enotfound', 'etimedout', 'socket hang up',
      '500', '502', '503', '504', 'service unavailable',
      'too many requests', 'rate limit'
    ];
    return recoverablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Guarda DTE y actualiza folio en una transacción atómica
   */
  private async saveDTEWithTransaction(
    supplierId: string,
    input: CreateDTEInput,
    buildResult: BuildDTEResult,
    trackId: string,
    tipoDte: DTEType,
    folio: number
  ): Promise<void> {
    // Usar RPC para transacción atómica
    const { error } = await this.supabase.rpc('save_dte_atomic', {
      p_supplier_id: supplierId,
      p_tipo_dte: tipoDte,
      p_folio: folio,
      p_fecha_emision: input.fechaEmision?.toISOString() || new Date().toISOString(),
      p_rut_receptor: input.receptor.rut,
      p_razon_social_receptor: input.receptor.razonSocial,
      p_monto_neto: buildResult.totales.montoNeto,
      p_monto_exento: buildResult.totales.montoExento,
      p_iva: buildResult.totales.iva,
      p_monto_total: buildResult.totales.montoTotal,
      p_track_id: trackId,
      p_estado: 'ENVIADO',
      p_xml_firmado: buildResult.dteXml,
    });

    if (error) {
      // Fallback a operaciones separadas si el RPC no existe
      if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('does not exist')) {
        await this.saveDTEFallback(supplierId, input, buildResult, trackId, tipoDte, folio);
      } else {
        throw new Error(`Error al guardar DTE: ${error.message}`);
      }
    }
  }

  /**
   * Fallback para guardar DTE cuando no existe el RPC de transacción
   */
  private async saveDTEFallback(
    supplierId: string,
    input: CreateDTEInput,
    buildResult: BuildDTEResult,
    trackId: string,
    tipoDte: DTEType,
    folio: number
  ): Promise<void> {
    // Guardar DTE primero
    await this.saveDTE(supplierId, input, buildResult, trackId);
    // Luego marcar folio como usado
    await this.markFolioUsed(supplierId, tipoDte, folio);
  }

  /**
   * Emite un DTE completo
   * @param supplierId - ID del proveedor
   * @param input - Datos del documento
   * @returns Resultado de la emisión
   */
  async emitDTE(supplierId: string, input: CreateDTEInput): Promise<EmitDTEResult> {
    try {
      // 1. Cargar contexto del emisor
      const emisor = await this.loadEmisorContext(supplierId);

      // 2. Cargar y configurar certificado
      await this.loadCertificate(supplierId);

      // 3. Inicializar servicios de autenticación
      this.initAuthServices(emisor.ambiente);

      // 4. Obtener siguiente folio disponible
      const { folio, cafData } = await this.getNextFolio(supplierId, input.tipoDte);
      input.folio = folio;

      // 5. Construir el DTE (sin firma TED aún)
      let buildResult = this.builderService.buildDTE(input, emisor, cafData);

      // 5.1 Firmar el TED con RSA-SHA1
      const timestamp = new Date().toISOString();
      const ddCanonical = this.builderService.buildCanonicalDD(buildResult.ted, timestamp);
      const tedSignature = this.signatureService.signTED(ddCanonical);
      
      // 5.2 Actualizar el DTE con el TED firmado
      buildResult = this.builderService.updateTEDWithSignature(buildResult, tedSignature, timestamp);

      // 6. Firmar el documento DTE completo
      const signedDteXml = this.signatureService.signDte(buildResult.dteXml, buildResult.dteId);

      // 7. Construir EnvioDTE
      const rutEnvia = this.signatureService.getRutTitular()!;
      const { xml: envioDteXml, setDteId, envioDteId } = this.builderService.buildEnvioDTE(
        [buildResult],
        emisor,
        rutEnvia
      );

      // 8. Firmar EnvioDTE
      const signedEnvioDte = this.signatureService.signSetDte(
        this.signatureService.signSetDte(envioDteXml, setDteId),
        envioDteId
      );

      // 9. Enviar al SII con reintentos automáticos
      const uploadResult = await this.executeWithRetry(
        () => this.clientService.uploadEnvioDte(signedEnvioDte, emisor.rutEmisor),
        'Upload DTE al SII'
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error?.message || 'Error al enviar al SII',
        };
      }

      // 10-11. Guardar en BD y actualizar folio en transacción atómica
      await this.saveDTEWithTransaction(
        supplierId, input, buildResult, uploadResult.trackId!, input.tipoDte, folio
      );

      // 12. Generar PDF
      const dte = this.buildDTEObject(input, emisor, buildResult);
      const pdfBuffer = await this.printService.generatePdf(
        dte,
        emisor,
        buildResult.ted,
        { copiaTexto: 'ORIGINAL' }
      );

      return {
        success: true,
        folio,
        tipoDte: input.tipoDte,
        trackId: uploadResult.trackId,
        dteXml: signedDteXml,
        pdfBase64: pdfBuffer.toString('base64'),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      // Limpiar datos sensibles
      this.signatureService.clear();
    }
  }

  /**
   * Carga el contexto del emisor desde la base de datos
   */
  private async loadEmisorContext(supplierId: string): Promise<EmisorContext> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error || !data) {
      throw new Error('No se encontró el proveedor');
    }

    // Obtener configuración de facturación
    const { data: configData } = await this.supabase
      .from('supplier_billing_config')
      .select('*')
      .eq('supplier_id', supplierId)
      .single();

    return {
      supplierId,
      rutEmisor: data.rut || configData?.rut_emisor,
      razonSocial: data.business_name || data.name,
      giro: configData?.giro || 'Comercio al por menor',
      direccion: configData?.direccion || data.address || '',
      comuna: configData?.comuna || '',
      ciudad: configData?.ciudad || '',
      actEco: configData?.actividades_economicas || [469000],
      sucursal: configData?.sucursal,
      codigoSucursal: configData?.codigo_sucursal,
      ambiente: configData?.ambiente || 'CERT',
    };
  }

  /**
   * Carga el certificado del proveedor
   */
  private async loadCertificate(supplierId: string): Promise<ParsedCertificate> {
    const { data, error } = await this.supabase
      .from('supplier_certificates')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('No hay certificado activo configurado');
    }

    const record = data as CertificateRecord;

    // Descifrar el PFX
    const pfxBase64 = this.decryptPfx(record.pfxEncrypted, record.iv, record.authTag);
    
    // Obtener passphrase (en producción, usar vault o similar)
    const passphrase = await this.getPassphrase(supplierId);

    return this.signatureService.loadCertificate(pfxBase64, passphrase);
  }

  /**
   * Descifra el PFX almacenado
   */
  private decryptPfx(encryptedBase64: string, ivBase64: string, authTagBase64: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex'),
      Buffer.from(ivBase64, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
    
    let decrypted = decipher.update(encryptedBase64, 'base64', 'base64');
    decrypted += decipher.final('base64');
    
    return decrypted;
  }

  /**
   * Obtiene la passphrase del certificado (implementar según vault)
   */
  private async getPassphrase(supplierId: string): Promise<string> {
    // En producción: usar vault, KMS, etc.
    const { data } = await this.supabase
      .from('supplier_secrets')
      .select('certificate_passphrase')
      .eq('supplier_id', supplierId)
      .single();
    
    if (!data?.certificate_passphrase) {
      throw new Error('No se encontró la contraseña del certificado');
    }

    // Descifrar passphrase almacenada
    return data.certificate_passphrase;
  }

  /**
   * Inicializa los servicios de autenticación
   */
  private initAuthServices(ambiente: 'CERT' | 'PROD'): void {
    this.authService = new SiiAuthService(this.signatureService, ambiente);
    this.clientService = new SiiClientService(this.authService, ambiente);
  }

  /**
   * Obtiene el siguiente folio disponible
   */
  private async getNextFolio(
    supplierId: string,
    tipoDte: DTEType
  ): Promise<{ folio: number; cafData: CAFData }> {
    // Usar RPC para obtener folio de forma atómica
    const { data, error } = await this.supabase.rpc('get_next_folio', {
      p_supplier_id: supplierId,
      p_tipo_dte: tipoDte,
    });

    if (error || !data) {
      throw new Error('No hay folios disponibles para este tipo de documento');
    }

    const record = data as FolioRecord;
    
    // Descifrar CAF
    const cafXml = this.decryptCaf(record.cafXmlEncrypted);
    const cafData = this.cafManager.parseCAF(cafXml);

    return {
      folio: record.folioActual,
      cafData,
    };
  }

  /**
   * Descifra el CAF almacenado
   */
  private decryptCaf(encryptedBase64: string): string {
    // Implementar según esquema de cifrado usado
    // Simplificado para ejemplo
    return Buffer.from(encryptedBase64, 'base64').toString('utf-8');
  }

  /**
   * Guarda el DTE en la base de datos
   * El XML firmado se comprime con gzip y codifica en Base64 para optimizar almacenamiento
   */
  private async saveDTE(
    supplierId: string,
    input: CreateDTEInput,
    buildResult: BuildDTEResult,
    trackId: string
  ): Promise<void> {
    // Comprimir XML con gzip nivel 9 (máxima compresión)
    const xmlComprimido = await this.compressXml(buildResult.dteXml);
    
    await this.supabase.from('supplier_dtes').insert({
      supplier_id: supplierId,
      tipo_dte: input.tipoDte,
      folio: input.folio,
      fecha_emision: input.fechaEmision || new Date(),
      rut_receptor: input.receptor.rut,
      razon_social_receptor: input.receptor.razonSocial,
      monto_neto: buildResult.totales.montoNeto,
      monto_exento: buildResult.totales.montoExento,
      iva: buildResult.totales.iva,
      monto_total: buildResult.totales.montoTotal,
      track_id: trackId,
      estado: 'ENVIADO',
      xml_firmado: xmlComprimido, // XML comprimido con gzip, Base64
    });
  }

  /**
   * Comprime un string XML con gzip y lo codifica en Base64
   * Reduce significativamente el tamaño de almacenamiento (~70-80% compresión típica)
   * 
   * @param xml - XML original sin comprimir
   * @returns XML comprimido con gzip, codificado en Base64
   */
  private async compressXml(xml: string): Promise<string> {
    const buffer = Buffer.from(xml, 'utf-8');
    const compressed = await gzipAsync(buffer, { level: 9 });
    return compressed.toString('base64');
  }

  /**
   * Descomprime un XML almacenado (gzip + Base64)
   * 
   * @param compressedBase64 - XML comprimido en Base64
   * @returns XML original descomprimido
   */
  async decompressXml(compressedBase64: string): Promise<string> {
    const gunzipAsync = promisify(zlib.gunzip);
    const compressed = Buffer.from(compressedBase64, 'base64');
    const decompressed = await gunzipAsync(compressed);
    return decompressed.toString('utf-8');
  }

  /**
   * Marca un folio como usado
   */
  private async markFolioUsed(
    supplierId: string,
    tipoDte: DTEType,
    folio: number
  ): Promise<void> {
    await this.supabase.rpc('mark_folio_used', {
      p_supplier_id: supplierId,
      p_tipo_dte: tipoDte,
      p_folio: folio,
    });
  }

  /**
   * Construye el objeto DTE para generación de PDF
   */
  private buildDTEObject(
    input: CreateDTEInput,
    emisor: EmisorContext,
    buildResult: BuildDTEResult
  ): DTEPrint {
    return {
      id: buildResult.dteId,
      encabezado: {
        idDoc: {
          TipoDTE: input.tipoDte,
          Folio: input.folio!,
          FchEmis: input.fechaEmision?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        },
        emisor: {
          RUTEmisor: emisor.rutEmisor,
          RznSoc: emisor.razonSocial,
          GiroEmis: emisor.giro,
          Acteco: emisor.actEco[0],
          DirOrigen: emisor.direccion,
          CmnaOrigen: emisor.comuna,
          CiudadOrigen: emisor.ciudad,
        },
        receptor: {
          RUTRecep: input.receptor.rut,
          RznSocRecep: input.receptor.razonSocial,
          GiroRecep: input.receptor.giro,
          DirRecep: input.receptor.direccion,
          CmnaRecep: input.receptor.comuna,
          CiudadRecep: input.receptor.ciudad,
        },
        totales: {
          MntNeto: buildResult.totales.montoNeto,
          MntExe: buildResult.totales.montoExento,
          TasaIVA: buildResult.totales.tasaIVA,
          IVA: buildResult.totales.iva,
          MntTotal: buildResult.totales.montoTotal,
        },
      },
      detalle: input.items.map((item, i) => ({
        NroLinDet: i + 1,
        NmbItem: item.nombre,
        QtyItem: item.cantidad,
        PrcItem: item.precioUnitario,
        MontoItem: Math.round(item.cantidad * item.precioUnitario),
      })),
      ted: buildResult.ted,
    };
  }

  /**
   * Consulta el estado de un DTE enviado con reintentos automáticos
   */
  async checkDTEStatus(supplierId: string, trackId: string): Promise<SiiTrackingResponse> {
    const emisor = await this.loadEmisorContext(supplierId);
    await this.loadCertificate(supplierId);
    this.initAuthServices(emisor.ambiente);
    
    return this.executeWithRetry(
      () => this.clientService.getTrackingStatus(trackId, emisor.rutEmisor),
      'Consulta estado DTE'
    );
  }
}
