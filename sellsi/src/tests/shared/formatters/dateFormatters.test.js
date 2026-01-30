/**
 * Tests para dateFormatters
 * Validación de formateo de fechas
 */

import { formatDate, formatRelativeDate, formatDateTime } from '../../../shared/utils/formatters/dateFormatters'

describe('formatDate', () => {
  it('formatea fechas válidas', () => {
    const date = new Date('2026-01-10')
    const result = formatDate(date)
    expect(result).toContain('enero')
    expect(result).toContain('2026')
  })

  it('acepta strings de fecha', () => {
    const result = formatDate('2026-01-10')
    expect(result).toContain('enero')
    expect(result).toContain('2026')
  })

  it('retorna fallback para valores inválidos', () => {
    expect(formatDate(null)).toBe('Fecha no disponible')
    expect(formatDate(undefined)).toBe('Fecha no disponible')
    expect(formatDate('')).toBe('Fecha no disponible')
  })

  it('permite opciones personalizadas', () => {
    const date = new Date('2026-01-10')
    const result = formatDate(date, { month: 'short' })
    expect(result).toContain('ene')
  })

  it('usa locale es-CL', () => {
    const date = new Date('2026-01-10')
    const result = formatDate(date)
    // En español los meses tienen minúsculas
    expect(result.toLowerCase()).toContain('enero')
  })
})

describe('formatRelativeDate', () => {
  beforeAll(() => {
    // Mock Date.now para tests consistentes
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-10T12:00:00'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('formatea segundos recientes', () => {
    const date = new Date('2026-01-10T11:59:30')
    expect(formatRelativeDate(date)).toBe('hace unos segundos')
  })

  it('formatea minutos', () => {
    const date = new Date('2026-01-10T11:55:00')
    expect(formatRelativeDate(date)).toBe('hace 5 minutos')
  })

  it('formatea horas', () => {
    const date = new Date('2026-01-10T09:00:00')
    expect(formatRelativeDate(date)).toBe('hace 3 horas')
  })

  it('formatea días', () => {
    const date = new Date('2026-01-08T12:00:00')
    expect(formatRelativeDate(date)).toBe('hace 2 días')
  })

  it('formatea meses', () => {
    const date = new Date('2025-11-10T12:00:00')
    expect(formatRelativeDate(date)).toBe('hace 2 meses')
  })

  it('formatea años', () => {
    const date = new Date('2024-01-10T12:00:00')
    expect(formatRelativeDate(date)).toBe('hace 2 años')
  })

  it('retorna fallback para valores inválidos', () => {
    expect(formatRelativeDate(null)).toBe('Fecha no disponible')
    expect(formatRelativeDate(undefined)).toBe('Fecha no disponible')
  })
})

describe('formatDateTime', () => {
  it('formatea fecha y hora', () => {
    const date = new Date('2026-01-10T14:30:00')
    const result = formatDateTime(date)
    expect(result).toContain('enero')
    expect(result).toContain('2026')
    // Formato puede ser "02:30 p. m." o "14:30" dependiendo del locale
    expect(result).toMatch(/14|02/)
    expect(result).toContain('30')
  })

  it('acepta strings de fecha', () => {
    const result = formatDateTime('2026-01-10T14:30:00')
    expect(result).toContain('enero')
    expect(result).toMatch(/14|02/)
  })

  it('retorna fallback para valores inválidos', () => {
    expect(formatDateTime(null)).toBe('Fecha no disponible')
    expect(formatDateTime(undefined)).toBe('Fecha no disponible')
  })
})
