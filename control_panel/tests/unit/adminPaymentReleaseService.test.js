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
  STATUS_LABELS
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

describe('adminPaymentReleaseService - Formatters & Utilities', () => {
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
      expect(formatCLP(-150000)).toBe('-$150.000')
    })
  })

  describe('formatDate', () => {
    test('formatea fechas ISO correctamente', () => {
      expect(formatDate('2024-10-25T15:30:00Z')).toBe('25/10/2024')
      expect(formatDate('2024-01-01T00:00:00Z')).toBe('01/01/2024')
      expect(formatDate('2024-12-31T23:59:59Z')).toBe('31/12/2024')
    })

    test('formatea objetos Date correctamente', () => {
      const date = new Date('2024-10-25T15:30:00Z')
      expect(formatDate(date)).toBe('25/10/2024')
    })

    test('maneja fechas con diferentes zonas horarias', () => {
      expect(formatDate('2024-10-25T15:30:00-03:00')).toMatch(/^25\/10\/2024$/)
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
      expect(formatDate('2024-01-05T00:00:00Z')).toBe('05/01/2024')
      expect(formatDate('2024-09-09T00:00:00Z')).toBe('09/09/2024')
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
  // Obtener referencia al mock
  const AdminApiService = require('../../src/infrastructure/api/AdminApiService').default
  
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
        expect.any(Function)
      )
      expect(result).toEqual(mockPaymentReleasesList)
    })

    test('filtra por status=pending', async () => {
      const pendingOnly = [mockPaymentReleasePending]
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(pendingOnly)
      )

      const result = await getPaymentReleases({ status: 'pending' })

      expect(result).toEqual(pendingOnly)
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
    })

    test('filtra por status=released', async () => {
      const releasedOnly = [mockPaymentReleaseReleased]
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(releasedOnly)
      )

      const result = await getPaymentReleases({ status: 'released' })

      expect(result).toEqual(releasedOnly)
      expect(result[0].status).toBe('released')
    })

    test('filtra por fecha desde', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleaseReleased])
      )

      const result = await getPaymentReleases({ date_from: '2024-10-15' })

      expect(result).toHaveLength(1)
      expect(AdminApiService.executeQuery).toHaveBeenCalled()
    })

    test('filtra por fecha hasta', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleases({ date_to: '2024-10-30' })

      expect(result).toHaveLength(1)
    })

    test('filtra por rango de fechas completo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleases({
        date_from: '2024-10-15',
        date_to: '2024-10-30'
      })

      expect(result).toHaveLength(3)
    })

    test('filtra por múltiples criterios (status + fechas)', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleases({
        status: 'pending',
        date_from: '2024-10-20',
        date_to: '2024-10-30'
      })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
    })

    test('retorna array vacío cuando no hay resultados', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleases({ status: 'nonexistent' })

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('maneja errores de la API correctamente', async () => {
      const errorMessage = 'Database connection failed'
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiError(errorMessage)
      )

      await expect(getPaymentReleases()).rejects.toThrow(errorMessage)
    })

    test('maneja null/undefined en filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleases({
        status: null,
        date_from: undefined
      })

      expect(result).toEqual(mockPaymentReleasesList)
    })
  })

  describe('getPaymentReleaseStats', () => {
    test('obtiene estadísticas sin filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockStats])
      )

      const result = await getPaymentReleaseStats()

      expect(result).toEqual(mockStats)
      expect(result.total_count).toBe(3)
      expect(result.pending_count).toBe(1)
      expect(result.released_count).toBe(1)
      expect(result.cancelled_count).toBe(1)
    })

    test('obtiene estadísticas con filtros', async () => {
      const filteredStats = {
        ...mockStats,
        total_count: 1,
        pending_count: 1,
        released_count: 0
      }
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([filteredStats])
      )

      const result = await getPaymentReleaseStats({ status: 'pending' })

      expect(result).toEqual(filteredStats)
      expect(result.pending_count).toBe(1)
    })

    test('calcula correctamente avg_days_to_release', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockStats])
      )

      const result = await getPaymentReleaseStats()

      expect(result.avg_days_to_release).toBe(2.0)
      expect(typeof result.avg_days_to_release).toBe('number')
    })

    test('retorna null cuando no hay datos', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleaseStats()

      expect(result).toBeNull()
    })

    test('maneja errores de cálculo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiError('Stats calculation failed')
      )

      await expect(getPaymentReleaseStats()).rejects.toThrow()
    })
  })

  describe('releasePayment', () => {
    const releaseId = 'pr_test_pending_001'
    const adminId = 'admin_test_001'
    const notes = 'Transferencia realizada exitosamente'
    const proofUrl = 'https://storage.test.com/proof.pdf'

    test('libera pago exitosamente con todos los parámetros', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiSuccess({ success: true })
      )

      const result = await releasePayment(releaseId, adminId, notes, proofUrl)

      expect(AdminApiService.executeRPC).toHaveBeenCalledTimes(1)
      expect(AdminApiService.executeRPC).toHaveBeenCalledWith(
        'release_supplier_payment',
        {
          p_payment_release_id: releaseId,
          p_admin_id: adminId,
          p_admin_notes: notes,
          p_payment_proof_url: proofUrl
        }
      )
      expect(result).toEqual({ success: true })
    })

    test('libera pago sin notas ni comprobante (opcional)', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiSuccess({ success: true })
      )

      const result = await releasePayment(releaseId, adminId)

      expect(AdminApiService.executeRPC).toHaveBeenCalledWith(
        'release_supplier_payment',
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
      await expect(releasePayment('', adminId)).rejects.toThrow()
      await expect(releasePayment(null, adminId)).rejects.toThrow()
      await expect(releasePayment(undefined, adminId)).rejects.toThrow()
    })

    test('rechaza liberar pago con adminId vacío', async () => {
      await expect(releasePayment(releaseId, '')).rejects.toThrow()
      await expect(releasePayment(releaseId, null)).rejects.toThrow()
      await expect(releasePayment(releaseId, undefined)).rejects.toThrow()
    })

    test('maneja error ADMIN_NOT_FOUND', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Admin not found')
      )

      await expect(
        releasePayment(releaseId, 'admin_nonexistent')
      ).rejects.toThrow('Admin not found')
    })

    test('maneja error INVALID_STATUS (ya liberado)', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Payment already released')
      )

      await expect(
        releasePayment('pr_already_released', adminId)
      ).rejects.toThrow('Payment already released')
    })

    test('maneja error INVALID_STATUS (cancelado)', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Cannot release cancelled payment')
      )

      await expect(
        releasePayment('pr_cancelled', adminId)
      ).rejects.toThrow()
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
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiSuccess({ success: true })
      )

      const result = await cancelPaymentRelease(releaseId, reason)

      expect(AdminApiService.executeRPC).toHaveBeenCalledTimes(1)
      expect(AdminApiService.executeRPC).toHaveBeenCalledWith(
        'cancel_supplier_payment_release',
        {
          p_payment_release_id: releaseId,
          p_cancellation_reason: reason
        }
      )
      expect(result.success).toBe(true)
    })

    test('rechaza cancelar sin releaseId', async () => {
      await expect(cancelPaymentRelease('', reason)).rejects.toThrow()
      await expect(cancelPaymentRelease(null, reason)).rejects.toThrow()
    })

    test('rechaza cancelar sin razón', async () => {
      await expect(cancelPaymentRelease(releaseId, '')).rejects.toThrow()
      await expect(cancelPaymentRelease(releaseId, null)).rejects.toThrow()
    })

    test('maneja error cuando ya está cancelado', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Already cancelled')
      )

      await expect(
        cancelPaymentRelease('pr_already_cancelled', reason)
      ).rejects.toThrow()
    })

    test('maneja error cuando ya está liberado', async () => {
      AdminApiService.executeRPC.mockResolvedValueOnce(
        mockApiError('Cannot cancel released payment')
      )

      await expect(
        cancelPaymentRelease('pr_already_released', reason)
      ).rejects.toThrow()
    })
  })

  describe('getPaymentReleasesReport', () => {
    test('genera reporte completo', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess(mockPaymentReleasesList)
      )

      const result = await getPaymentReleasesReport()

      expect(result).toHaveLength(3)
      expect(result).toEqual(mockPaymentReleasesList)
    })

    test('genera reporte con filtros', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([mockPaymentReleasePending])
      )

      const result = await getPaymentReleasesReport({ status: 'pending' })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
    })

    test('retorna array vacío cuando no hay datos', async () => {
      AdminApiService.executeQuery.mockResolvedValueOnce(
        mockApiSuccess([])
      )

      const result = await getPaymentReleasesReport()

      expect(result).toEqual([])
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
    expect(results[0][0].status).toBe('pending')
    expect(results[1][0].status).toBe('released')
    expect(results[2][0].status).toBe('cancelled')
  })

  test('maneja caracteres especiales en notas', async () => {
    const specialNotes = 'Nota con émojis 💰✅ y carácteres especiales: ñáéíóú, comillas "dobles", y símbolos $#@!'
    AdminApiService.executeRPC.mockResolvedValueOnce(
      mockApiSuccess({ success: true })
    )

    await expect(
      releasePayment('pr_001', 'admin_001', specialNotes)
    ).resolves.toBeDefined()
  })

  test('maneja fechas en el límite (año 2000, año 2100)', async () => {
    const release2000 = createMockPaymentRelease({
      purchased_at: '2000-01-01T00:00:00Z',
      delivered_at: '2000-01-05T00:00:00Z'
    })

    expect(formatDate(release2000.purchased_at)).toBe('01/01/2000')
    expect(daysBetween(release2000.purchased_at, release2000.delivered_at)).toBe(4)
  })

  test('maneja montos extremos (muy pequeños y muy grandes)', async () => {
    expect(formatCLP(1)).toBe('$1')
    expect(formatCLP(999999999999)).toBe('$999.999.999.999')
  })
})
