/**
 * Tipos para certificados digitales
 * @module types/certificate.types
 */

/**
 * Certificado digital parseado
 */
export interface ParsedCertificate {
  /** Titular del certificado */
  subject: {
    commonName: string;
    serialNumber: string;   // RUT del titular
    organization?: string;
    country: string;
  };
  
  /** Emisor del certificado */
  issuer: {
    commonName: string;
    organization: string;
    country: string;
  };
  
  /** Número de serie del certificado */
  serialNumber: string;
  
  /** Fechas de validez */
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  
  /** Huella digital SHA-256 */
  fingerprint: string;
  
  /** Certificado en formato PEM */
  pem: string;
  
  /** Clave privada en formato PEM (si disponible) */
  privateKeyPem?: string;
}

/**
 * Registro de certificado en base de datos
 */
export interface CertificateRecord {
  id: string;
  supplierId: string;
  rutTitular: string;
  nombreTitular: string;
  
  /** PFX cifrado con AES-256-GCM (Base64) */
  pfxEncrypted: string;
  
  /** IV para descifrado (Base64) */
  iv: string;
  
  /** Tag de autenticación (Base64) */
  authTag: string;
  
  /** Hash de la passphrase cifrada */
  passphraseHash: string;
  
  /** Fechas de validez */
  validFrom: string;
  validTo: string;
  
  /** Huella digital para identificación */
  fingerprint: string;
  
  /** Estado del certificado */
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para subir un certificado
 */
export interface CertificateUploadData {
  pfxBase64: string;
  passphrase: string;
  supplierId: string;
}

/**
 * Resultado de validación de certificado
 */
export interface CertificateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  certificate?: ParsedCertificate;
}

/**
 * Contexto del emisor para multi-tenant
 */
export interface EmisorContext {
  supplierId: string;
  rutEmisor: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  actEco: number[];        // Códigos actividad económica
  sucursal?: string;       // Nombre de sucursal
  codigoSucursal?: number; // Código SII de sucursal
  ambiente: 'CERT' | 'PROD';
  
  /** Certificado cargado (solo en memoria durante operación) */
  certificate?: ParsedCertificate;
}

/**
 * Información mínima del certificado para mostrar
 */
export interface CertificateSummary {
  id: string;
  rutTitular: string;
  nombreTitular: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  diasRestantes: number;
  estado: 'vigente' | 'por_vencer' | 'vencido';
}
