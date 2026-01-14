/**
 * Tests para priceFormatters
 * Validación de formateo de precios y descuentos
 */

import { formatPrice, formatCurrency, formatDiscount } from '../../../shared/utils/formatters/priceFormatters'

describe('formatPrice', () => {
  it('formatea números válidos correctamente', () => {
    expect(formatPrice(150000)).toBe('$150.000')
    expect(formatPrice(1500)).toBe('$1.500')
    expect(formatPrice(999999999)).toBe('$999.999.999')
  })

  it('maneja el cero correctamente', () => {
    expect(formatPrice(0)).toBe('$0')
  })

  it('maneja valores negativos', () => {
    expect(formatPrice(-150000)).toBe('$-150.000')
  })

  it('retorna fallback para valores inválidos', () => {
    expect(formatPrice(null)).toBe('Precio no disponible')
    expect(formatPrice(undefined)).toBe('Precio no disponible')
    expect(formatPrice(NaN)).toBe('Precio no disponible')
  })

  it('no formatea decimales (redondeo a entero)', () => {
    expect(formatPrice(150000.99)).toBe('$150.001')
    expect(formatPrice(150000.49)).toBe('$150.000')
  })
})

describe('formatCurrency', () => {
  it('es un alias de formatPrice', () => {
    expect(formatCurrency(150000)).toBe(formatPrice(150000))
    expect(formatCurrency(0)).toBe(formatPrice(0))
    expect(formatCurrency(null)).toBe(formatPrice(null))
  })
})

describe('formatDiscount', () => {
  it('calcula descuento correctamente', () => {
    expect(formatDiscount(100000, 80000)).toBe(20)
    expect(formatDiscount(100000, 50000)).toBe(50)
    expect(formatDiscount(100000, 90000)).toBe(10)
  })

  it('redondea descuentos al entero más cercano', () => {
    expect(formatDiscount(100000, 66666)).toBe(33) // 33.334% -> 33
    expect(formatDiscount(100000, 66500)).toBe(34) // 33.5% -> 34
  })

  it('retorna 0 si no hay descuento', () => {
    expect(formatDiscount(100000, 100000)).toBe(0)
    expect(formatDiscount(100000, 110000)).toBe(0)
  })

  it('retorna 0 para valores inválidos', () => {
    expect(formatDiscount(null, 50000)).toBe(0)
    expect(formatDiscount(100000, null)).toBe(0)
    expect(formatDiscount(0, 50000)).toBe(0)
  })
})
