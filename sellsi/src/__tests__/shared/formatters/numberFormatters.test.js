/**
 * Tests para numberFormatters
 * Validación de formateo de números y stock
 */

import { formatNumber, formatStockStatus } from '../../../shared/utils/formatters/numberFormatters'

describe('formatNumber', () => {
  it('formatea números con separadores de miles', () => {
    expect(formatNumber(1000)).toBe('1.000')
    expect(formatNumber(150000)).toBe('150.000')
    expect(formatNumber(1000000)).toBe('1.000.000')
  })

  it('maneja el cero correctamente', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('maneja números negativos', () => {
    expect(formatNumber(-150000)).toBe('-150.000')
  })

  it('retorna fallback para valores inválidos', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
    expect(formatNumber(NaN)).toBe('0')
  })

  it('formatea decimales según locale es-CL', () => {
    expect(formatNumber(1500.99)).toBe('1.500,99')
    expect(formatNumber(1500.5)).toBe('1.500,5')
  })

  it('maneja números muy grandes', () => {
    expect(formatNumber(999999999999)).toBe('999.999.999.999')
  })
})

describe('formatStockStatus', () => {
  it('retorna "Agotado" para stock 0', () => {
    const result = formatStockStatus(0)
    expect(result.label).toBe('Agotado')
    expect(result.color).toBe('error')
    expect(result.severity).toBe('high')
  })

  it('retorna "Stock crítico" para stock < 5', () => {
    const result1 = formatStockStatus(1)
    expect(result1.label).toBe('Stock crítico')
    expect(result1.color).toBe('error')
    expect(result1.severity).toBe('high')

    const result4 = formatStockStatus(4)
    expect(result4.label).toBe('Stock crítico')
  })

  it('retorna "Stock bajo" para stock < 10', () => {
    const result5 = formatStockStatus(5)
    expect(result5.label).toBe('Stock bajo')
    expect(result5.color).toBe('warning')
    expect(result5.severity).toBe('medium')

    const result9 = formatStockStatus(9)
    expect(result9.label).toBe('Stock bajo')
  })

  it('retorna "Stock disponible" para stock < 50', () => {
    const result10 = formatStockStatus(10)
    expect(result10.label).toBe('Stock disponible')
    expect(result10.color).toBe('info')
    expect(result10.severity).toBe('low')

    const result49 = formatStockStatus(49)
    expect(result49.label).toBe('Stock disponible')
  })

  it('retorna "En stock" para stock >= 50', () => {
    const result50 = formatStockStatus(50)
    expect(result50.label).toBe('En stock')
    expect(result50.color).toBe('success')
    expect(result50.severity).toBe('none')

    const result1000 = formatStockStatus(1000)
    expect(result1000.label).toBe('En stock')
  })
})
