/**
 * @jest-environment jsdom
 * 
 * Tests unitarios exhaustivos para adminPaymentReleaseService
 * Cubre: formatters, utilidades, CRUD, edge cases, manejo de errores
 */

import {
  getPaymentReleases,
  getPaymentReleaseStats,
  releasePayment,
  cancelPaymentRelease,
  getPaymentReleasesReport,
  formatCLP,
  formatDate,
  daysBetween,
  STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  computePayout
} from '../../src/domains/admin/services/adminPaymentReleaseService'

import {
  mockPaymentReleasePending,
  mockPaymentReleaseReleased,
  mockPaymentReleaseCancelled,
  mockPaymentReleasesList,
  mockStats,
  mockApiSuccess,
  mockApiError,
  createMockPaymentRelease
} from '../mocks/paymentReleaseMocks'

// Mock de Supabase
global.fetch = jest.fn()

// Mock del AdminApiService para tests unitarios (visibilidad global)
const AdminApiService = require('../../src/domains/admin/services/adminApiService').AdminApiService || require('../../src/domains/admin/services/adminApiService').default
AdminApiService.executeQuery = jest.fn(async (fn) => {
  try {
    const result = await fn()
    if (typeof result === 'object' && result && 'success' in result) return result
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
AdminApiService.executeRPC = jest.fn()
const { supabase } = require('../../src/services/supabase')

describe('adminPaymentReleaseService - Formatters & Utilities', () => {
  test('computePayout calcula comisión y payout correctamente', () => {
    const res = computePayout(100000)
    expect(res.commission).toBe(3000)
    expect(res.payout).toBe(97000)

    const res2 = computePayout('150000')
    expect(res2.commission).toBe(4500)
    expect(res2.payout).toBe(145500)

    const res3 = computePayout(null)
    expect(res3.commission).toBe(0)
    expect(res3.payout).toBe(0)
  })
  describe('formatCLP', () => {
    test('formatea números positivos correctamente', () => {
      expect(formatCLP(150000)).toBe('$150.000')
      expect(formatCLP(1500000)).toBe('$1.500.000')
      expect(formatCLP(999)).toBe('$999')
      expect(formatCLP(1000000000)).toBe('$1.000.000.000')
    })

    test('formatea cero correctamente', () => {
      expect(formatCLP(0)).toBe('$0')
    })

    test('formatea números decimales (redondea)', () => {
      expect(formatCLP(150000.99)).toBe('$150.001')
      expect(formatCLP(150000.45)).toBe('$150.000')
    })

    test('maneja valores null/undefined', () => {
      expect(formatCLP(null)).toBe('$0')
      expect(formatCLP(undefined)).toBe('$0')
    })

    test('maneja strings numéricos', () => {
      expect(formatCLP('150000')).toBe('$150.000')
      expect(formatCLP('1500000')).toBe('$1.500.000')
    })

    test('maneja valores inválidos', () => {
      expect(formatCLP('invalid')).toBe('$0')
      expect(formatCLP(NaN)).toBe('$0')
      expect(formatCLP(Infinity)).toBe('$0')
    })

    test('maneja números negativos (edge case)', () => {
      expect(formatCLP(-150000)).toBe('$-150.000')
    })
  })

  describe('formatDate', () => {
    test('formatea fechas ISO correctamente', () => {
      const f1 = formatDate('2024-10-25T15:30:00Z')
      const f2 = formatDate('2024-01-01T00:00:00Z')
      const f3 = formatDate('2024-12-31T23:59:59Z')

      expect(typeof f1).toBe('string')
      expect(f1).not.toBe('N/A')

      expect(typeof f2).toBe('string')
      expect(f2).not.toBe('N/A')

      expect(typeof f3).toBe('string')
      expect(f3).not.toBe('N/A')
    })

    test('formatea objetos Date correctamente', () => {
      const date = new Date('2024-10-25T15:30:00Z')
      const formatted = formatDate(date)
      expect(typeof formatted).toBe('string')
      expect(formatted).toMatch(/25.*2024/)
    })

    test('maneja fechas con diferentes zonas horarias', () => {
      const formatted = formatDate('2024-10-25T15:30:00-03:00')
      expect(typeof formatted).toBe('string')
      expect(formatted).toMatch(/25.*2024/)
    })

    test('maneja valores null/undefined', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })

    test('maneja strings vacíos', () => {
      expect(formatDate('')).toBe('N/A')
    })

    test('maneja fechas inválidas', () => {
      expect(formatDate('invalid-date')).toBe('N/A')
      expect(formatDate('2024-13-01')).toBe('N/A') // Mes inválido
    })

    test('formatea correctamente con días/meses de un dígito', () => {
      const f1 = formatDate('2024-01-05T00:00:00Z')
      const f2 = formatDate('2024-09-09T00:00:00Z')
      expect(typeof f1).toBe('string')
      expect(f1).not.toBe('N/A')
      expect(typeof f2).toBe('string')
      expect(f2).not.toBe('N/A')
    })
  })

  describe('daysBetween', () => {
    test('calcula diferencia de días correctamente', () => {
      const date1 = '2024-10-20T10:00:00Z'
      const date2 = '2024-10-25T10:00:00Z'
      expect(daysBetween(date1, date2)).toBe(5)
    })

    test('calcula diferencia con fechas invertidas (resultado negativo)', () => {
      const date1 = '2024-10-25T10:00:00Z'
      const date2 = '2024-10-20T10:00:00Z'
      expect(daysBetween(date1, date2)).toBe(-5)
    })

    test('retorna 0 para fechas iguales', () => {
      const date = '2024-10-25T10:00:00Z'
      expect(daysBetween(date, date)).toBe(0)
    })

    test('ignora las horas (solo cuenta días completos)', () => {
      const date1 = '2024-10-25T23:59:59Z'
      const date2 = '2024-10-26T00:00:01Z'
      expect(daysBetween(date1, date2)).toBe(1)
    })

    test('maneja diferencias de meses/años', () => {
      const date1 = '2024-01-01T00:00:00Z'
      const date2 = '2024-12-31T00:00:00Z'
      expect(daysBetween(date1, date2)).toBe(365) // 2024 es año bisiesto
    })

    test('maneja fechas con objetos Date', () => {
      const date1 = new Date('2024-10-20')
      const date2 = new Date('2024-10-25')
      expect(daysBetween(date1, date2)).toBe(5)
    })

    test('retorna 0 para valores inválidos', () => {
      expect(daysBetween(null, null)).toBe(0)
      expect(daysBetween('invalid', '2024-10-25')).toBe(0)
      expect(daysBetween('2024-10-25', 'invalid')).toBe(0)
    })
  })

  describe('STATUS constants', () => {
    test('define todos los estados correctamente', () => {
      expect(STATUS.PENDING).toBe('pending')
      expect(STATUS.RELEASED).toBe('released')
      expect(STATUS.CANCELLED).toBe('cancelled')
    })

    test('STATUS_COLORS mapea correctamente', () => {
      expect(STATUS_COLORS[STATUS.PENDING]).toBe('warning')
      expect(STATUS_COLORS[STATUS.RELEASED]).toBe('success')
      expect(STATUS_COLORS[STATUS.CANCELLED]).toBe('error')
    })

    test('STATUS_LABELS mapea correctamente', () => {
      expect(STATUS_LABELS[STATUS.PENDING]).toBe('Pendiente')
      expect(STATUS_LABELS[STATUS.RELEASED]).toBe('Liberado')
      expect(STATUS_LABELS[STATUS.CANCELLED]).toBe('Cancelado')
    })
  })
})

describe('adminPaymentReleaseService - CRUD Operations', () => {
  // Obtener referencia al mock (usar el servicio real dentro del dominio admin)
  const AdminApiService = require('../../src/domains/admin/services/adminApiService').AdminApiService || require('../../src/domains/admin/services/adminApiService').default
  // Reemplazar métodos estáticos por mocks para poder controlar respuestas en tests unitarios
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPaymentReleases', () => {
    test('obtiene lista completa sin filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleases()

      expect(AdminApiService.executeQuery).toHaveBeenCalledTimes(1)
      expect(AdminApiService.executeQuery).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(String)
      )
      expect(result.data).toEqual(mockPaymentReleasesList)
    })

    test('filtra por status=pending', async () => {
      const pendingOnly = [mockPaymentReleasePending]
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(pendingOnly)
      )

      const result = await getPaymentReleases({ status: 'pending' })

      expect(result.data).toEqual(pendingOnly)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('pending')
    })

    test('filtra por status=released', async () => {
      const releasedOnly = [mockPaymentReleaseReleased]
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(releasedOnly)
      )

      const result = await getPaymentReleases({ status: 'released' })

      expect(result.data).toEqual(releasedOnly)
      expect(result.data[0].status).toBe('released')
    })

    test('filtra por fecha desde', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleaseReleased])
      )

      const result = await getPaymentReleases({ dateFrom: '2024-10-15' })

      expect(result.data).toHaveLength(1)
      expect(AdminApiService.executeQuery).toHaveBeenCalled()
    })

    test('filtra por fecha hasta', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleases({ dateTo: '2024-10-30' })

      expect(result.data).toHaveLength(1)
    })

    test('filtra por rango de fechas completo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleases({
        dateFrom: '2024-10-15',
        dateTo: '2024-10-30'
      })

      expect(result.data).toHaveLength(3)
    })

    test('filtra por múltiples criterios (status + fechas)', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleases({
        status: 'pending',
        dateFrom: '2024-10-20',
        dateTo: '2024-10-30'
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('pending')
    })

    test('retorna array vacío cuando no hay resultados', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleases({ status: 'nonexistent' })

      expect(result.data).toEqual([])
      expect(result.data).toHaveLength(0)
    })

    test('maneja errores de la API correctamente', async () => {
      const errorMessage = 'Database connection failed'
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiError(errorMessage)
      )

      const result = await getPaymentReleases()
      expect(result.success).toBe(false)
      expect(result.error).toMatch(errorMessage)
    })

    test('maneja null/undefined en filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleases({
        status: null,
        date_from: undefined
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPaymentReleasesList)
    })
  })

  describe('getPaymentReleaseStats', () => {
    test('obtiene estadísticas sin filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockStats])
      )

      const result = await getPaymentReleaseStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockStats])
      expect(result.data[0].total).toBe(3)
      expect(result.data[0].pending_release).toBe(1)
      expect(result.data[0].released).toBe(1)
      expect(result.data[0].cancelled).toBe(1)
    })

    test('obtiene estadísticas con filtros', async () => {
      const filteredStats = {
        ...mockStats,
        total: 1,
        pending_release: 1,
        released: 0
      }
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([filteredStats])
      )

      const result = await getPaymentReleaseStats({ status: 'pending' })

      expect(result.success).toBe(true)
      expect(result.data[0]).toEqual(filteredStats)
      expect(result.data[0].pending_release).toBe(1)
    })

    test('calcula correctamente avg_days_to_release', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockStats])
      )

      const result = await getPaymentReleaseStats()

      expect(result.success).toBe(true)
      expect(result.data[0].avg_days_to_release).toBe(2.0)
      expect(typeof result.data[0].avg_days_to_release).toBe('number')
    })

    test('retorna arreglo vacío cuando no hay datos', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleaseStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    test('maneja errores de cálculo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiError('Stats calculation failed')
      )

      const res = await getPaymentReleaseStats()
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Stats calculation failed/)
    })
  })

  describe('releasePayment', () => {
    const releaseId = 'pr_test_pending_001'
    const adminId = 'admin_test_001'
    const notes = 'Transferencia realizada exitosamente'
    const proofUrl = 'https://storage.test.com/proof.pdf'

    test('libera pago exitosamente con todos los parámetros', async () => {
      // Asegurar que executeQuery ejecuta la función interna en este test
      AdminApiService.executeQuery.mockImplementationOnce(async (fn) => {
        try {
          const r = await fn()
          return { success: true, data: r }
        } catch (e) {
          return { success: false, error: e.message }
        }
      })

      supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const result = await releasePayment(releaseId, adminId, notes, proofUrl)

      expect(supabase.rpc).toHaveBeenCalledTimes(1)
      expect(supabase.rpc).toHaveBeenCalledWith('release_supplier_payment', {
        p_payment_release_id: releaseId,
        p_admin_id: adminId,
        p_admin_notes: notes,
        p_payment_proof_url: proofUrl
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ success: true })
    })

    test('libera pago sin notas ni comprobante (opcional)', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const result = await releasePayment(releaseId, adminId)

      expect(supabase.rpc).toHaveBeenCalledWith('release_supplier_payment',
        expect.objectContaining({
          p_payment_release_id: releaseId,
          p_admin_id: adminId,
          p_admin_notes: null,
          p_payment_proof_url: null
        })
      )
      expect(result.success).toBe(true)
    })

    test('rechaza liberar pago con releaseId vacío', async () => {
      const res1 = await releasePayment('', adminId)
      expect(res1.success).toBe(false)

      const res2 = await releasePayment(null, adminId)
      expect(res2.success).toBe(false)

      const res3 = await releasePayment(undefined, adminId)
      expect(res3.success).toBe(false)
    })

    test('rechaza liberar pago con adminId vacío', async () => {
      const r1 = await releasePayment(releaseId, '')
      expect(r1.success).toBe(false)

      const r2 = await releasePayment(releaseId, null)
      expect(r2.success).toBe(false)

      const r3 = await releasePayment(releaseId, undefined)
      expect(r3.success).toBe(false)
    })

    test('maneja error ADMIN_NOT_FOUND', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'ADMIN_NOT_FOUND' } })

      const res = await releasePayment(releaseId, 'admin_nonexistent')
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Administrador/)
    })

    test('maneja error INVALID_STATUS (ya liberado)', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'INVALID_STATUS: Payment already released' } })

      const res = await releasePayment('pr_already_released', adminId)
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/procesad/i)
    })

    test('maneja error INVALID_STATUS (cancelado)', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'INVALID_STATUS: Cannot release cancelled payment' } })

      const res = await releasePayment('pr_cancelled', adminId)
      expect(res.success).toBe(false)
    })

    test('valida longitud máxima de notas (si aplica)', async () => {
      const longNotes = 'a'.repeat(10000) // Notas muy largas
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiSuccess({ success: true })
      )

      // Debería funcionar (Postgres TEXT permite mucho texto)
      await expect(
        releasePayment(releaseId, adminId, longNotes)
      ).resolves.toBeDefined()
    })
  })

  describe('cancelPaymentRelease', () => {
    const releaseId = 'pr_test_pending_001'
    const reason = 'Producto devuelto por defectos'

    test('cancela liberación exitosamente', async () => {
      // Asegurar que executeQuery ejecuta la función interna en este test
      AdminApiService.executeQuery.mockImplementationOnce(async (fn) => {
        try {
          const r = await fn()
          return { success: true, data: r }
        } catch (e) {
          return { success: false, error: e.message }
        }
      })

      supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const result = await cancelPaymentRelease(releaseId, 'admin_test_001', reason)

      expect(supabase.rpc).toHaveBeenCalledTimes(1)
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_supplier_payment_release', {
        p_payment_release_id: releaseId,
        p_admin_id: 'admin_test_001',
        p_cancel_reason: reason
      })
      expect(result.success).toBe(true)
    })

    test('rechaza cancelar sin releaseId', async () => {
      const r1 = await cancelPaymentRelease('', reason)
      expect(r1.success).toBe(false)

      const r2 = await cancelPaymentRelease(null, reason)
      expect(r2.success).toBe(false)
    })

    test('rechaza cancelar sin razón', async () => {
      const r1 = await cancelPaymentRelease(releaseId, '')
      expect(r1.success).toBe(false)

      const r2 = await cancelPaymentRelease(releaseId, null)
      expect(r2.success).toBe(false)
    })

    test('maneja error cuando ya está cancelado', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Already cancelled')
      )

      const res = await cancelPaymentRelease('pr_already_cancelled', reason)
      expect(res.success).toBe(false)
    })

    test('maneja error cuando ya está liberado', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Cannot cancel released payment')
      )

      const res = await cancelPaymentRelease('pr_already_released', reason)
      expect(res.success).toBe(false)
    })
  })

  describe('getPaymentReleasesReport', () => {
    test('genera reporte completo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleasesReport()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data).toEqual(mockPaymentReleasesList)
    })

    test('genera reporte con filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleasesReport({ status: 'pending' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('pending')
    })

    test('retorna array vacío cuando no hay datos', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleasesReport()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })
})

describe('adminPaymentReleaseService - Edge Cases & Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('maneja timeout de conexión', async () => {
    AdminApiService.executeQuery.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    )

    await expect(getPaymentReleases()).rejects.toThrow('Request timeout')
  })

  test('maneja respuestas con formato inesperado', async () => {
    AdminApiService.executeQuery.mockResolvedValueOnce({
      data: 'invalid_format',
      error: null
    })

    const result = await getPaymentReleases()
    // Debería manejar gracefully
    expect(result).toBeDefined()
  })

  test('maneja múltiples llamadas concurrentes', async () => {
    AdminApiService.executeQuery
      .mockResolvedValueOnce(mockApiSuccess([mockPaymentReleasePending]))
      .mockResolvedValueOnce(mockApiSuccess([mockPaymentReleaseReleased]))
      .mockResolvedValueOnce(mockApiSuccess([mockPaymentReleaseCancelled]))

    const results = await Promise.all([
      getPaymentReleases({ status: 'pending' }),
      getPaymentReleases({ status: 'released' }),
      getPaymentReleases({ status: 'cancelled' })
    ])

    expect(results).toHaveLength(3)
    expect(results[0].data[0].status).toBe('pending')
    expect(results[1].data[0].status).toBe('released')
    expect(results[2].data[0].status).toBe('cancelled')
  })

  test('maneja fechas en el límite (año 2000, año 2100)', async () => {
    const release2000 = createMockPaymentRelease({
      purchased_at: '2000-01-01T00:00:00Z',
      delivered_at: '2000-01-05T00:00:00Z'
    })

    // Evitar aserciones frágiles respecto a la zona horaria del entorno
    expect(formatDate(release2000.purchased_at)).toEqual(expect.any(String))
    expect(daysBetween(release2000.purchased_at, release2000.delivered_at)).toBe(4)
  })

  test('maneja montos extremos (muy pequeños y muy grandes)', async () => {
    expect(formatCLP(1)).toBe('$1')
    expect(formatCLP(999999999999)).toBe('$999.999.999.999')
  })
})
