/**
 * Configuración de endpoints y constantes del SII
 * @module config/sii.config
 */

export type SiiEnvironment = 'CERT' | 'PROD';

export interface SiiEndpoints {
  BASE_URL: string;
  GET_SEED: string;
  GET_TOKEN: string;
  UPLOAD_DTE: string;
  QUERY_STATUS: string;
  QUERY_DTE: string;
}

export const SII_ENDPOINTS: Record<SiiEnvironment, SiiEndpoints> = {
  // Ambiente de Certificación (pruebas)
  CERT: {
    BASE_URL: 'https://palena.sii.cl',
    GET_SEED: '/DTEWS/CrSeed.jws?wsdl',
    GET_TOKEN: '/DTEWS/GetTokenFromSeed.jws?wsdl',
    UPLOAD_DTE: '/cgi_dte/UPL/DTEUpload',
    QUERY_STATUS: '/DTEWS/QueryEstUp.jws?wsdl',
    QUERY_DTE: '/DTEWS/QueryEstDte.jws?wsdl',
  },
  // Ambiente de Producción
  PROD: {
    BASE_URL: 'https://maullin.sii.cl',
    GET_SEED: '/DTEWS/CrSeed.jws?wsdl',
    GET_TOKEN: '/DTEWS/GetTokenFromSeed.jws?wsdl',
    UPLOAD_DTE: '/cgi_dte/UPL/DTEUpload',
    QUERY_STATUS: '/DTEWS/QueryEstUp.jws?wsdl',
    QUERY_DTE: '/DTEWS/QueryEstDte.jws?wsdl',
  },
};

/**
 * Configuración general del SII
 */
export const SII_CONFIG = {
  /** Tasa de IVA en Chile (19%) */
  IVA_RATE: 0.19,
  
  /** Timeout para requests HTTP (ms) */
  HTTP_TIMEOUT: 30000,
  
  /** Reintentos máximos en caso de error */
  MAX_RETRIES: 3,
  
  /** Delay base para backoff exponencial (ms) */
  RETRY_DELAY_BASE: 1000,
  
  /** Tiempo de vida del token SII (segundos) */
  TOKEN_TTL: 3600,
  
  /** Algoritmo de firma */
  SIGNATURE_ALGORITHM: 'RSA-SHA1',
  
  /** Algoritmo de digest */
  DIGEST_ALGORITHM: 'SHA1',
  
  /** Canonicalización */
  CANONICALIZATION_ALGORITHM: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  
  /** Transform para firma */
  TRANSFORM_ALGORITHM: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
  
  /** Endpoints por ambiente */
  ENDPOINTS: {
    CERT: {
      AUTH: 'https://palena.sii.cl',
      DTE: 'https://palena.sii.cl',
    },
    PROD: {
      AUTH: 'https://hercules.sii.cl',
      DTE: 'https://rahue.sii.cl',
    },
  },
};

/**
 * Códigos de tipo de documento tributario
 */
export const DTE_TYPES = {
  FACTURA_ELECTRONICA: 33,
  FACTURA_EXENTA: 34,
  BOLETA_ELECTRONICA: 39,
  BOLETA_EXENTA: 41,
  LIQUIDACION_FACTURA: 46,
  GUIA_DESPACHO: 52,
  NOTA_DEBITO: 56,
  NOTA_CREDITO: 61,
  FACTURA_COMPRA: 46,
  FACTURA_EXPORTACION: 110,
  NOTA_DEBITO_EXPORTACION: 111,
  NOTA_CREDITO_EXPORTACION: 112,
} as const;

/**
 * Estados de respuesta del SII
 */
export const SII_ESTADOS = {
  EPR: 'Envío Procesado',
  RCH: 'Rechazado',
  RPR: 'Reparo',
  RFR: 'Rechazado por Firma',
  RCT: 'Rechazado por Contenido',
  SOK: 'Schema OK',
  CRT: 'Certificado OK',
  FOK: 'Firma OK',
  PRD: 'Procesado',
} as const;

export type SiiEstado = keyof typeof SII_ESTADOS;
