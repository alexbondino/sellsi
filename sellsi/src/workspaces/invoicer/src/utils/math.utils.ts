/**
 * Utilidades matemáticas para cálculos de DTE
 * @module utils/math.utils
 */

import Decimal from 'decimal.js';

// Configurar Decimal.js para precisión financiera
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Redondea un número al entero más cercano (regla SII)
 * @param valor - Valor a redondear
 * @returns Valor redondeado
 */
export function redondearSii(valor: number): number {
  return new Decimal(valor).round().toNumber();
}

/**
 * Calcula el IVA de un monto neto
 * @param montoNeto - Monto neto
 * @param tasaIva - Tasa de IVA (default: 0.19)
 * @returns Monto del IVA redondeado
 */
export function calcularIva(montoNeto: number, tasaIva: number = 0.19): number {
  const iva = new Decimal(montoNeto).times(tasaIva);
  return iva.round().toNumber();
}

/**
 * Calcula el monto neto desde un monto con IVA
 * @param montoConIva - Monto total con IVA
 * @param tasaIva - Tasa de IVA (default: 0.19)
 * @returns Monto neto redondeado
 */
export function calcularNetoDesdeTotal(montoConIva: number, tasaIva: number = 0.19): number {
  const neto = new Decimal(montoConIva).div(new Decimal(1).plus(tasaIva));
  return neto.round().toNumber();
}

/**
 * Calcula el monto total (neto + IVA)
 * @param montoNeto - Monto neto
 * @param tasaIva - Tasa de IVA (default: 0.19)
 * @returns Monto total redondeado
 */
export function calcularTotal(montoNeto: number, tasaIva: number = 0.19): number {
  const neto = new Decimal(montoNeto);
  const iva = neto.times(tasaIva).round();
  return neto.plus(iva).toNumber();
}

/**
 * Calcula el monto de un ítem (cantidad * precio - descuento)
 * @param cantidad - Cantidad
 * @param precioUnitario - Precio unitario
 * @param descuentoPorcentaje - Descuento en porcentaje (0-100)
 * @returns Monto del ítem redondeado
 */
export function calcularMontoItem(
  cantidad: number,
  precioUnitario: number,
  descuentoPorcentaje: number = 0
): number {
  const subtotal = new Decimal(cantidad).times(precioUnitario);
  
  if (descuentoPorcentaje > 0) {
    const descuento = subtotal.times(descuentoPorcentaje).div(100);
    return subtotal.minus(descuento).round().toNumber();
  }
  
  return subtotal.round().toNumber();
}

/**
 * Suma varios montos con precisión decimal
 * @param montos - Array de montos a sumar
 * @returns Suma total redondeada
 */
export function sumarMontos(montos: number[]): number {
  return montos
    .reduce((acc, monto) => acc.plus(monto), new Decimal(0))
    .round()
    .toNumber();
}

/**
 * Valida que los totales de un DTE sean consistentes
 * @param montoNeto - Monto neto declarado
 * @param iva - IVA declarado
 * @param montoTotal - Monto total declarado
 * @param tasaIva - Tasa de IVA (default: 0.19)
 * @returns true si los totales son consistentes
 */
export function validarTotales(
  montoNeto: number,
  iva: number,
  montoTotal: number,
  tasaIva: number = 0.19
): boolean {
  const ivaCalculado = calcularIva(montoNeto, tasaIva);
  const totalCalculado = montoNeto + ivaCalculado;
  
  // Permitir diferencia de ±1 por redondeo
  const diffIva = Math.abs(iva - ivaCalculado);
  const diffTotal = Math.abs(montoTotal - totalCalculado);
  
  return diffIva <= 1 && diffTotal <= 1;
}

/**
 * Formatea un monto como string con separador de miles
 * @param monto - Monto a formatear
 * @param decimales - Número de decimales (default: 0)
 * @returns Monto formateado (ej: "1.234.567")
 */
export function formatearMonto(monto: number, decimales: number = 0): string {
  return new Decimal(monto)
    .toFixed(decimales)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Calcula el porcentaje de un valor sobre un total
 * @param valor - Valor
 * @param total - Total
 * @returns Porcentaje (0-100)
 */
export function calcularPorcentaje(valor: number, total: number): number {
  if (total === 0) return 0;
  return new Decimal(valor).times(100).div(total).toNumber();
}
