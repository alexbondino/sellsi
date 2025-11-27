/**
 * Utilidades para manejo de RUT chileno
 * @module utils/rut.utils
 */

/**
 * Calcula el dígito verificador de un RUT
 * @param rutNumber - Número del RUT sin dígito verificador
 * @returns Dígito verificador ('0'-'9' o 'K')
 */
export function calcularDV(rutNumber: number): string {
  let suma = 0;
  let multiplicador = 2;
  let rut = rutNumber;

  while (rut > 0) {
    suma += (rut % 10) * multiplicador;
    rut = Math.floor(rut / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dv = 11 - resto;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Formatea un RUT con puntos y guión
 * @param rut - RUT en cualquier formato
 * @returns RUT formateado (ej: "12.345.678-9")
 */
export function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2) return rut;

  const dv = limpio.slice(-1);
  const numero = limpio.slice(0, -1);
  
  // Agregar puntos de miles
  const formateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formateado}-${dv}`;
}

/**
 * Limpia un RUT dejando solo números y K
 * @param rut - RUT en cualquier formato
 * @returns RUT limpio sin puntos ni guión
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Valida un RUT chileno
 * @param rut - RUT a validar
 * @returns true si el RUT es válido
 */
export function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  
  if (limpio.length < 2) return false;
  
  const dv = limpio.slice(-1);
  const numero = parseInt(limpio.slice(0, -1), 10);
  
  if (isNaN(numero) || numero < 1000000) return false;
  
  return calcularDV(numero) === dv;
}

/**
 * Obtiene el número y DV de un RUT
 * @param rut - RUT en cualquier formato
 * @returns Objeto con número y dígito verificador
 */
export function parsearRut(rut: string): { numero: number; dv: string } | null {
  const limpio = limpiarRut(rut);
  
  if (limpio.length < 2) return null;
  
  const dv = limpio.slice(-1);
  const numero = parseInt(limpio.slice(0, -1), 10);
  
  if (isNaN(numero)) return null;
  
  return { numero, dv };
}

/**
 * Formatea RUT para XML del SII (sin puntos, con guión)
 * @param rut - RUT en cualquier formato
 * @returns RUT para SII (ej: "12345678-9")
 */
export function rutParaSii(rut: string): string {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2) return rut;
  
  const dv = limpio.slice(-1);
  const numero = limpio.slice(0, -1);
  
  return `${numero}-${dv}`;
}

/**
 * Obtiene solo el número del RUT (sin DV)
 * @param rut - RUT en cualquier formato
 * @returns Número del RUT
 */
export function obtenerNumeroRut(rut: string): number {
  const limpio = limpiarRut(rut);
  return parseInt(limpio.slice(0, -1), 10);
}

/**
 * Verifica si dos RUTs son iguales (independiente del formato)
 * @param rut1 - Primer RUT
 * @param rut2 - Segundo RUT
 * @returns true si son el mismo RUT
 */
export function sonMismoRut(rut1: string, rut2: string): boolean {
  return limpiarRut(rut1) === limpiarRut(rut2);
}
