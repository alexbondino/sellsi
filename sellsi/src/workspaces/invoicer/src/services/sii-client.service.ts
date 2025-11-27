/**
 * Cliente HTTP para comunicación con el SII
 * Envío de DTEs y consulta de estados
 * @module services/sii-client.service
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { DOMParser } from '@xmldom/xmldom';
import { SII_CONFIG } from '../config/sii.config';
import { SiiAuthService } from './sii-auth.service';
import {
  SiiUploadResponse,
  SiiTrackingResponse,
  EstadoDTE,
  SiiError,
  ConsultaDTEResult,
  EnvioBoletaResult,
} from '../types';
import { rutParaSii } from '../utils/rut.utils';

/**
 * Configuración de reintentos
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Tamaño máximo de archivo en bytes (5MB)
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Errores que justifican un reintento
 */
const RETRYABLE_ERROR_CODES = [
  'ECONNABORTED',
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN',
];

/**
 * Códigos HTTP que justifican un reintento
 */
const RETRYABLE_HTTP_STATUS = [408, 429, 500, 502, 503, 504];

/**
 * Cliente para comunicación con servicios del SII
 */
export class SiiClientService {
  private authService: SiiAuthService;
  private httpClient: AxiosInstance;
  private ambiente: 'CERT' | 'PROD';
  private retryConfig: RetryConfig;

  constructor(authService: SiiAuthService, ambiente: 'CERT' | 'PROD' = 'CERT') {
    this.authService = authService;
    this.ambiente = ambiente;
    
    // Configuración de reintentos por defecto
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
    };

    const baseURL =
      ambiente === 'CERT'
        ? SII_CONFIG.ENDPOINTS.CERT.DTE
        : SII_CONFIG.ENDPOINTS.PROD.DTE;

    this.httpClient = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/xml',
        Accept: 'application/xml',
      },
    });
  }

  /**
   * Valida el tamaño del archivo XML antes de enviarlo
   * @param xmlContent - Contenido XML a validar
   * @throws Error si el archivo excede el tamaño máximo
   */
  private validateFileSize(xmlContent: string): void {
    const sizeInBytes = Buffer.byteLength(xmlContent, 'utf-8');
    if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      throw new Error(
        `El archivo XML excede el tamaño máximo permitido. ` +
        `Tamaño: ${sizeMB}MB, Máximo: 5MB`
      );
    }
  }

  /**
   * Determina si un error es recuperable y merece reintento
   * @param error - Error de Axios
   * @returns true si el error es recuperable
   */
  private isRetryableError(error: AxiosError): boolean {
    // Error de red/conexión
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }
    
    // Error HTTP recuperable
    if (error.response && RETRYABLE_HTTP_STATUS.includes(error.response.status)) {
      return true;
    }
    
    return false;
  }

  /**
   * Calcula el delay para el siguiente reintento (exponential backoff con jitter)
   * @param attempt - Número de intento (0-indexed)
   * @returns Delay en milisegundos
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    
    // Añadir jitter aleatorio (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    
    // Limitar al máximo configurado
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Espera un tiempo determinado
   * @param ms - Milisegundos a esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta una operación HTTP con reintentos automáticos
   * @param operation - Función que ejecuta la operación
   * @param operationName - Nombre de la operación para logging
   * @returns Resultado de la operación
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: AxiosError | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const axiosError = error as AxiosError;
        lastError = axiosError;
        
        // Si no es recuperable o es el último intento, no reintentar
        if (!this.isRetryableError(axiosError) || attempt === this.retryConfig.maxRetries) {
          throw error;
        }
        
        // Calcular delay y esperar
        const delay = this.calculateRetryDelay(attempt);
        console.warn(
          `[SiiClient] ${operationName} - Intento ${attempt + 1}/${this.retryConfig.maxRetries + 1} falló. ` +
          `Reintentando en ${Math.round(delay)}ms. Error: ${axiosError.code || axiosError.message}`
        );
        
        await this.sleep(delay);
      }
    }
    
    // Si llegamos aquí, todos los reintentos fallaron
    throw lastError;
  }

  /**
   * Configura los parámetros de reintento
   * @param config - Nueva configuración de reintentos
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
   * Envía un EnvioDTE al SII
   * @param envioDteXml - XML del EnvioDTE firmado
   * @param rutEmisor - RUT del emisor
   * @returns Respuesta con trackId
   */
  async uploadEnvioDte(envioDteXml: string, rutEmisor: string): Promise<SiiUploadResponse> {
    // Validar tamaño del archivo antes de enviar
    try {
      this.validateFileSize(envioDteXml);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: error instanceof Error ? error.message : 'Archivo demasiado grande',
        },
      };
    }

    try {
      return await this.executeWithRetry(async () => {
        const token = await this.authService.getToken();
        const rutFormateado = rutParaSii(rutEmisor);
        const [rutNum, rutDv] = rutFormateado.split('-');

        const endpoint =
          this.ambiente === 'CERT'
            ? '/cgi_dte/UPL/DTEUpload'
            : '/cgi_dte/UPL/DTEUpload';

        const response = await this.httpClient.post(endpoint, envioDteXml, {
          headers: {
            Cookie: `TOKEN=${token}`,
            'Content-Type': 'multipart/form-data',
          },
          params: {
            RUTCOMPANY: rutNum,
            DVCOMPANY: rutDv,
            RUTCONTADOR: rutNum,
            DVCONTADOR: rutDv,
          },
        });

        return this.parseUploadResponse(response.data);
      }, 'uploadEnvioDte');
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Parsea la respuesta de upload
   */
  private parseUploadResponse(responseXml: string): SiiUploadResponse {
    try {
      const doc = new DOMParser().parseFromString(responseXml, 'application/xml');

      const status = doc.getElementsByTagName('STATUS')[0]?.textContent;
      const trackId = doc.getElementsByTagName('TRACKID')[0]?.textContent;
      const timestamp = doc.getElementsByTagName('TIMESTAMP')[0]?.textContent;

      if (status === '0' && trackId) {
        return {
          success: true,
          trackId,
          timestamp: timestamp || new Date().toISOString(),
        };
      }

      const glosa = doc.getElementsByTagName('GLOSA')[0]?.textContent;
      return {
        success: false,
        error: {
          code: status || 'UNKNOWN',
          message: glosa || 'Error desconocido al subir DTE',
        },
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Error al parsear respuesta del SII',
        },
      };
    }
  }

  /**
   * Consulta el estado de un envío
   * @param trackId - ID de tracking
   * @param rutEmisor - RUT del emisor
   */
  async getTrackingStatus(trackId: string, rutEmisor: string): Promise<SiiTrackingResponse> {
    return this.executeWithRetry(async () => {
      const token = await this.authService.getToken();
      const rutFormateado = rutParaSii(rutEmisor);
      const [rutNum, rutDv] = rutFormateado.split('-');

      const endpoint = `/cgi_dte/UPL/QueryEstUp.cgi`;

      const response = await this.httpClient.get(endpoint, {
        headers: {
          Cookie: `TOKEN=${token}`,
        },
        params: {
          RUTCOMPANY: rutNum,
          DVCOMPANY: rutDv,
          TRACKID: trackId,
        },
      });

      return this.parseTrackingResponse(response.data, trackId);
    }, 'getTrackingStatus');
  }

  /**
   * Parsea la respuesta de tracking
   */
  private parseTrackingResponse(responseXml: string, trackId: string): SiiTrackingResponse {
    const doc = new DOMParser().parseFromString(responseXml, 'application/xml');

    const estadoEnvio = doc.getElementsByTagName('ESTADO')[0]?.textContent || 'DNK';
    const glosa = doc.getElementsByTagName('GLOSA_ESTADO')[0]?.textContent || '';
    const fechaProceso = doc.getElementsByTagName('FECHA_RECEPCION')[0]?.textContent;

    // Parsear detalles de cada DTE
    const detalles = doc.getElementsByTagName('DETALLE_REP_RECH');
    const detalleDtes: SiiTrackingResponse['detalleDtes'] = [];

    for (let i = 0; i < detalles.length; i++) {
      const det = detalles[i];
      detalleDtes.push({
        tipoDte: parseInt(det.getElementsByTagName('TIPO')[0]?.textContent || '0', 10),
        folio: parseInt(det.getElementsByTagName('FOLIO')[0]?.textContent || '0', 10),
        estado: det.getElementsByTagName('ESTADO')[0]?.textContent as EstadoDTE || 'DNK',
        glosa: det.getElementsByTagName('GLOSA')[0]?.textContent || '',
      });
    }

    return {
      trackId,
      estado: estadoEnvio as EstadoDTE,
      glosa,
      fechaProceso,
      detalleDtes: detalleDtes.length > 0 ? detalleDtes : undefined,
    };
  }

  /**
   * Consulta el estado de un DTE específico
   */
  async consultarDte(
    rutEmisor: string,
    tipoDte: number,
    folio: number,
    fechaEmision: string,
    montoTotal: number
  ): Promise<ConsultaDTEResult> {
    return this.executeWithRetry(async () => {
      const token = await this.authService.getToken();
      const rutFormateado = rutParaSii(rutEmisor);
      const [rutNum, rutDv] = rutFormateado.split('-');

      const endpoint = `/cgi_dte/CONSULTADTECM/consultadtecm.cgi`;

      const response = await this.httpClient.get(endpoint, {
        headers: {
          Cookie: `TOKEN=${token}`,
        },
        params: {
          RUTEMISOR: rutNum,
          DVEMISOR: rutDv,
          TIPODTE: tipoDte,
          FOLIO: folio,
          FECHAEMISION: fechaEmision,
          MONTOTOTAL: montoTotal,
        },
      });

      return this.parseConsultaDteResponse(response.data);
    }, 'consultarDte');
  }

  /**
   * Parsea respuesta de consulta DTE
   */
  private parseConsultaDteResponse(responseXml: string): ConsultaDTEResult {
    const doc = new DOMParser().parseFromString(responseXml, 'application/xml');

    const estado = doc.getElementsByTagName('ESTADO')[0]?.textContent as EstadoDTE || 'DNK';
    const glosa = doc.getElementsByTagName('GLOSA')[0]?.textContent || '';

    return {
      rutEmisor: doc.getElementsByTagName('RUT_EMISOR')[0]?.textContent || '',
      tipoDte: parseInt(doc.getElementsByTagName('TIPO_DTE')[0]?.textContent || '0', 10),
      folio: parseInt(doc.getElementsByTagName('FOLIO')[0]?.textContent || '0', 10),
      fechaEmision: doc.getElementsByTagName('FECHA_EMISION')[0]?.textContent || '',
      estado,
      glosa,
      montoTotal: parseInt(doc.getElementsByTagName('MONTO_TOTAL')[0]?.textContent || '0', 10),
      receptor: {
        rut: doc.getElementsByTagName('RUT_RECEPTOR')[0]?.textContent || '',
        razonSocial: doc.getElementsByTagName('RAZON_SOCIAL_RECEPTOR')[0]?.textContent || '',
      },
    };
  }

  /**
   * Envía boletas electrónicas (proceso especial)
   * Las boletas se envían en lotes diarios
   */
  async enviarBoletas(
    boletasXml: string,
    rutEmisor: string,
    fecha: string
  ): Promise<EnvioBoletaResult> {
    // Validar tamaño del archivo antes de enviar
    try {
      this.validateFileSize(boletasXml);
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        cantidadBoletas: 0,
        montoTotal: 0,
        errores: [{
          codigo: 'FILE_TOO_LARGE',
          descripcion: error instanceof Error ? error.message : 'Archivo demasiado grande',
        }],
      };
    }

    try {
      return await this.executeWithRetry(async () => {
        const token = await this.authService.getToken();
        const rutFormateado = rutParaSii(rutEmisor);
        const [rutNum, rutDv] = rutFormateado.split('-');

        const endpoint = `/cgi_boleta/EnvioBOLETA.cgi`;

        const response = await this.httpClient.post(endpoint, boletasXml, {
          headers: {
            Cookie: `TOKEN=${token}`,
            'Content-Type': 'application/xml',
          },
          params: {
            RUTCOMPANY: rutNum,
            DVCOMPANY: rutDv,
            FECHA: fecha,
          },
        });

        return this.parseBoletaResponse(response.data);
      }, 'enviarBoletas');
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        cantidadBoletas: 0,
        montoTotal: 0,
        errores: [this.extractErrorFromAxios(error as AxiosError)],
      };
    }
  }

  /**
   * Parsea respuesta de envío de boletas
   */
  private parseBoletaResponse(responseXml: string): EnvioBoletaResult {
    try {
      const doc = new DOMParser().parseFromString(responseXml, 'application/xml');

      const estado = doc.getElementsByTagName('ESTADO')[0]?.textContent;
      const trackId = doc.getElementsByTagName('TRACKID')[0]?.textContent;

      if (estado === '0' && trackId) {
        return {
          success: true,
          trackId,
          timestamp: new Date().toISOString(),
          cantidadBoletas: parseInt(
            doc.getElementsByTagName('CANTIDAD')[0]?.textContent || '0',
            10
          ),
          montoTotal: parseInt(
            doc.getElementsByTagName('MONTO_TOTAL')[0]?.textContent || '0',
            10
          ),
        };
      }

      const glosa = doc.getElementsByTagName('GLOSA')[0]?.textContent;
      return {
        success: false,
        timestamp: new Date().toISOString(),
        cantidadBoletas: 0,
        montoTotal: 0,
        errores: [
          {
            codigo: estado || 'UNKNOWN',
            descripcion: glosa || 'Error al enviar boletas',
          },
        ],
      };
    } catch {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        cantidadBoletas: 0,
        montoTotal: 0,
        errores: [
          {
            codigo: 'PARSE_ERROR',
            descripcion: 'Error al parsear respuesta de boletas',
          },
        ],
      };
    }
  }

  /**
   * Maneja errores de Axios
   */
  private handleError(error: AxiosError): SiiUploadResponse {
    const siiError = this.extractErrorFromAxios(error);
    return {
      success: false,
      error: {
        code: siiError.codigo,
        message: siiError.descripcion,
      },
    };
  }

  /**
   * Crea un error estructurado
   */
  private createError(error: AxiosError): Error {
    const siiError = this.extractErrorFromAxios(error);
    return new Error(`${siiError.codigo}: ${siiError.descripcion}`);
  }

  /**
   * Extrae información de error de Axios
   */
  private extractErrorFromAxios(error: AxiosError): SiiError {
    if (error.response) {
      return {
        codigo: `HTTP_${error.response.status}`,
        descripcion: `Error HTTP ${error.response.status}: ${error.response.statusText}`,
        detalle: typeof error.response.data === 'string' ? error.response.data : undefined,
      };
    }
    if (error.code === 'ECONNABORTED') {
      return {
        codigo: 'TIMEOUT',
        descripcion: 'Tiempo de espera agotado al comunicarse con el SII',
      };
    }
    return {
      codigo: error.code || 'NETWORK_ERROR',
      descripcion: error.message || 'Error de red al comunicarse con el SII',
    };
  }

  /**
   * Cambia el ambiente
   */
  setAmbiente(ambiente: 'CERT' | 'PROD'): void {
    this.ambiente = ambiente;
    this.httpClient.defaults.baseURL =
      ambiente === 'CERT'
        ? SII_CONFIG.ENDPOINTS.CERT.DTE
        : SII_CONFIG.ENDPOINTS.PROD.DTE;
  }
}
