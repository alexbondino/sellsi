/**
 * Utilidades para manejo de fechas según formato SII
 * @module utils/date.utils
 */

/**
 * Formato de fecha para SII (YYYY-MM-DD)
 * @param date - Fecha a formatear
 * @returns Fecha en formato SII
 */
export function formatearFechaSii(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formato de timestamp para SII (YYYY-MM-DDTHH:mm:ss)
 * @param date - Fecha a formatear
 * @returns Timestamp en formato ISO sin timezone
 */
export function formatearTimestampSii(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parsea una fecha en formato SII
 * @param fechaStr - Fecha en formato YYYY-MM-DD
 * @returns Objeto Date
 */
export function parsearFechaSii(fechaStr: string): Date {
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Obtiene el mes en texto para resolución SII
 * @param date - Fecha
 * @returns Nombre del mes en español
 */
export function obtenerMesTexto(date: Date = new Date()): string {
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return meses[date.getMonth()];
}

/**
 * Valida que una fecha esté dentro del rango permitido por SII
 * (No más de 2 meses en el pasado, no en el futuro)
 * @param fechaEmision - Fecha a validar
 * @returns true si la fecha es válida
 */
export function validarFechaEmision(fechaEmision: Date): boolean {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fecha = new Date(fechaEmision.getFullYear(), fechaEmision.getMonth(), fechaEmision.getDate());
  
  // No puede ser en el futuro
  if (fecha > hoy) return false;
  
  // No puede ser más de 2 meses en el pasado
  const limiteAnterior = new Date(hoy);
  limiteAnterior.setMonth(limiteAnterior.getMonth() - 2);
  
  return fecha >= limiteAnterior;
}

/**
 * Calcula días de diferencia entre dos fechas
 * @param fecha1 - Primera fecha
 * @param fecha2 - Segunda fecha (default: hoy)
 * @returns Número de días de diferencia
 */
export function diasEntreFechas(fecha1: Date, fecha2: Date = new Date()): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24;
  const diff = Math.abs(fecha2.getTime() - fecha1.getTime());
  return Math.floor(diff / MS_POR_DIA);
}

/**
 * Obtiene el período tributario actual (YYYY-MM)
 * @param date - Fecha (default: hoy)
 * @returns Período en formato YYYY-MM
 */
export function obtenerPeriodoTributario(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Genera un ID único basado en timestamp
 * @returns ID único
 */
export function generarIdUnico(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Obtiene la fecha de vencimiento del CAF (1 año desde autorización para boletas)
 * @param fechaAutorizacion - Fecha de autorización del CAF
 * @param esBoleta - Si es boleta, vence en 6 meses
 * @returns Fecha de vencimiento
 */
export function obtenerVencimientoCaf(fechaAutorizacion: Date, esBoleta: boolean = false): Date {
  const vencimiento = new Date(fechaAutorizacion);
  if (esBoleta) {
    vencimiento.setMonth(vencimiento.getMonth() + 6);
  } else {
    vencimiento.setFullYear(vencimiento.getFullYear() + 1);
  }
  return vencimiento;
}
