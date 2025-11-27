/**
 * Tipos para respuestas del SII
 * @module types/sii.types
 */

/**
 * Estado de un DTE según SII
 */
export type EstadoDTE = 
  | 'EPR' // Envío procesado correctamente (aceptado)
  | 'EAM' // Envío aceptado con advertencias menores
  | 'EMR' // Envío aceptado con advertencias que NO afectan la validez
  | 'RCT' // Rechazado por errores de contenido
  | 'RFR' // Rechazado por error de firma
  | 'RCH' // Rechazado
  | 'DNK' // Envío no encontrado
  | 'SOK' // DTE individual recibido sin error
  | 'RPR' // DTE en reparo (aceptado con reparos)
  | '-11' // DTE anulado
  | 'PENDIENTE'; // Aún no procesado

/**
 * Respuesta del SII al envío de EnvioDTE
 */
export interface SiiUploadResponse {
  success: boolean;
  trackId?: string;     // ID de tracking para consultar estado
  timestamp?: string;
  error?: {
    code: string;
    message: string;
    detail?: string;
  };
}

/**
 * Respuesta de estado de envío
 */
export interface SiiTrackingResponse {
  trackId: string;
  estado: EstadoDTE;
  glosa: string;
  fechaProceso?: string;
  detalleDtes?: SiiDteStatus[];
  numAtencion?: number;
}

/**
 * Estado individual de cada DTE en un envío
 */
export interface SiiDteStatus {
  tipoDte: number;
  folio: number;
  estado: EstadoDTE;
  glosa: string;
  errores?: SiiError[];
}

/**
 * Error del SII
 */
export interface SiiError {
  codigo: string;
  descripcion: string;
  detalle?: string;
}

/**
 * Token de autenticación del SII
 */
export interface SiiToken {
  token: string;
  rutEmisor: string;
  expiresAt: Date;
  ambiente: 'CERT' | 'PROD';
}

/**
 * Resultado de verificación de estado DTE
 */
export interface ConsultaDTEResult {
  rutEmisor: string;
  tipoDte: number;
  folio: number;
  fechaEmision: string;
  estado: EstadoDTE;
  glosa: string;
  montoTotal: number;
  receptor: {
    rut: string;
    razonSocial: string;
  };
}

/**
 * Resultado del envío de boletas
 */
export interface EnvioBoletaResult {
  success: boolean;
  trackId?: string;
  timestamp: string;
  cantidadBoletas: number;
  montoTotal: number;
  errores?: SiiError[];
}

/**
 * Respuesta de consulta de contribuyente
 */
export interface ContribuyenteInfo {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  correo?: string;
  autorizadoEmitir: boolean;
  tiposAutorizados: number[];
}
