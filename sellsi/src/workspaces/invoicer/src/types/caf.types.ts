/**
 * Tipos para Código de Autorización de Folios (CAF)
 * @module types/caf.types
 */

import { DTEType } from './dte.types';

/**
 * Datos del CAF parseado
 */
export interface CAFData {
  version: string;
  tipoDte: DTEType;
  rutEmisor: string;
  razonSocial: string;
  folioDesde: number;
  folioHasta: number;
  fechaAutorizacion: string;
  
  /** Clave pública del SII (para verificar FRMA) */
  rsaPubKey: {
    modulus: string;      // Base64
    exponent: string;     // Base64
  };
  
  /** ID de la clave */
  idK: number;
  
  /** Firma del SII sobre los datos del CAF */
  frma: string;
  
  /** XML original del CAF (para incluir en TED) */
  cafXmlOriginal: string;
}

/**
 * Registro de folio en base de datos
 */
export interface FolioRecord {
  id: string;
  supplierId: string;
  tipoDte: DTEType;
  folioDesde: number;
  folioHasta: number;
  folioActual: number;
  cafXmlEncrypted: string;  // Base64 del XML cifrado
  isActive: boolean;
  agotado: boolean;
  fechaAutorizacion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de obtener siguiente folio
 */
export interface NextFolioResult {
  folio: number;
  cafXml: string;
  cafData: CAFData;
}

/**
 * Estadísticas de uso de CAF
 */
export interface CAFStats {
  tipoDte: DTEType;
  totalAutorizados: number;
  usados: number;
  disponibles: number;
  porcentajeUsado: number;
  alertaBaja: boolean;      // true si < 100 disponibles
}
