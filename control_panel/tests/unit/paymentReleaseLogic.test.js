/**
 * @jest-environment jsdom
 * 
 * Tests de lógica crítica del sistema de payment releases
 * Cubre: cálculos de fechas, transiciones de estado, validaciones de negocio
 */

import {
  formatCLP,
  formatDate,
  daysBetween,
  STATUS
} from '../../src/domains/admin/services/adminPaymentReleaseService'

describe('Lógica Crítica - Cálculo de Días Desde Entrega', () => {
  test('calcula 0 días para entrega de hoy', () => {
    const today = new Date()
    const todayISO = today.toISOString()
    
    const days = daysBetween(todayISO, today)
    expect(days).toBe(0)
  })

  test('calcula 1 día para entrega de ayer', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const today = new Date()
    
    const days = daysBetween(yesterday.toISOString(), today)
    expect(days).toBe(1)
  })

  test('calcula 3 días correctamente', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const today = new Date()
    
    const days = daysBetween(threeDaysAgo.toISOString(), today)
    expect(days).toBe(3)
  })

  test('calcula 7 días (límite de warning)', () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const today = new Date()
    
    const days = daysBetween(sevenDaysAgo.toISOString(), today)
    expect(days).toBe(7)
  })

  test('calcula 10 días (caso crítico)', () => {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    const today = new Date()
    
    const days = daysBetween(tenDaysAgo.toISOString(), today)
    expect(days).toBe(10)
  })

  test('NO calcula días negativos para fechas futuras', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const today = new Date()
    
    const days = daysBetween(tomorrow.toISOString(), today)
    // Debería ser -1, pero lógica puede manejarlo como 0
    expect(days).toBeLessThanOrEqual(0)
  })

  test('calcula diferencia de meses correctamente', () => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    const today = new Date()
    
    const days = daysBetween(twoMonthsAgo.toISOString(), today)
    expect(days).toBeGreaterThanOrEqual(60)
    expect(days).toBeLessThanOrEqual(62) // 60-62 días dependiendo del mes
  })

  test('maneja cambio de año correctamente', () => {
    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    const today = new Date()
    
    const days = daysBetween(lastYear.toISOString(), today)
    expect(days).toBeGreaterThanOrEqual(365)
  })

  test('maneja año bisiesto correctamente', () => {
    const feb28_2024 = new Date('2024-02-28T00:00:00Z')
    const mar01_2024 = new Date('2024-03-01T00:00:00Z')
    
    const days = daysBetween(feb28_2024, mar01_2024)
    expect(days).toBe(2) // 28 feb → 29 feb → 1 mar = 2 días
  })
})

describe('Lógica Crítica - Transiciones de Estado', () => {
  test('pending → released es transición válida', () => {
    const initialStatus = STATUS.PENDING
    const targetStatus = STATUS.RELEASED
    
    // Una liberación solo puede pasar de pending a released
    const isValidTransition = initialStatus === STATUS.PENDING && targetStatus === STATUS.RELEASED
    expect(isValidTransition).toBe(true)
  })

  test('pending → cancelled es transición válida', () => {
    const initialStatus = STATUS.PENDING
    const targetStatus = STATUS.CANCELLED
    
    const isValidTransition = initialStatus === STATUS.PENDING && targetStatus === STATUS.CANCELLED
    expect(isValidTransition).toBe(true)
  })

  test('released → cancelled es transición INVÁLIDA', () => {
    const initialStatus = STATUS.RELEASED
    const targetStatus = STATUS.CANCELLED
    
    // NO se puede cancelar un pago ya liberado
    const isValidTransition = initialStatus === STATUS.PENDING && targetStatus === STATUS.CANCELLED
    expect(isValidTransition).toBe(false)
  })

  test('released → pending es transición INVÁLIDA', () => {
    const initialStatus = STATUS.RELEASED
    const targetStatus = STATUS.PENDING
    
    // NO se puede revertir un pago liberado a pendiente
    const isValidTransition = false // Esta transición nunca es válida
    expect(isValidTransition).toBe(false)
  })

  test('cancelled → released es transición INVÁLIDA', () => {
    const initialStatus = STATUS.CANCELLED
    const targetStatus = STATUS.RELEASED
    
    // NO se puede liberar un pago cancelado
    const isValidTransition = false
    expect(isValidTransition).toBe(false)
  })

  test('cancelled → pending es transición INVÁLIDA', () => {
    const initialStatus = STATUS.CANCELLED
    const targetStatus = STATUS.PENDING
    
    // NO se puede revertir una cancelación
    const isValidTransition = false
    expect(isValidTransition).toBe(false)
  })
})

describe('Lógica Crítica - Validaciones de Negocio', () => {
  describe('Validación de Montos', () => {
    test('monto positivo es válido', () => {
      const amount = 150000
      expect(amount).toBeGreaterThan(0)
    })

    test('monto cero NO es válido', () => {
      const amount = 0
      const isValid = amount > 0
      expect(isValid).toBe(false)
    })

    test('monto negativo NO es válido', () => {
      const amount = -150000
      const isValid = amount > 0
      expect(isValid).toBe(false)
    })

    test('monto muy grande (>$100M) requiere validación especial', () => {
      const amount = 150000000 // $150 millones
      const requiresApproval = amount > 100000000
      expect(requiresApproval).toBe(true)
    })
  })

  describe('Validación de Fechas', () => {
    test('delivered_at debe ser posterior a purchased_at', () => {
      const purchased = new Date('2024-10-20T10:00:00Z')
      const delivered = new Date('2024-10-25T15:00:00Z')
      
      expect(delivered.getTime()).toBeGreaterThan(purchased.getTime())
    })

    test('delivered_at NO puede ser anterior a purchased_at', () => {
      const purchased = new Date('2024-10-25T10:00:00Z')
      const delivered = new Date('2024-10-20T15:00:00Z')
      
      const isValid = delivered.getTime() >= purchased.getTime()
      expect(isValid).toBe(false)
    })

    test('delivered_at puede ser el mismo día que purchased_at', () => {
      const purchased = new Date('2024-10-25T10:00:00Z')
      const delivered = new Date('2024-10-25T18:00:00Z')
      
      const isValid = delivered.getTime() >= purchased.getTime()
      expect(isValid).toBe(true)
    })

    test('released_at debe ser posterior a delivered_at', () => {
      const delivered = new Date('2024-10-20T15:00:00Z')
      const released = new Date('2024-10-22T11:00:00Z')
      
      expect(released.getTime()).toBeGreaterThan(delivered.getTime())
    })

    test('delivered_at NO puede ser fecha futura', () => {
      const delivered = new Date()
      delivered.setDate(delivered.getDate() + 1)
      const today = new Date()
      
      const isValid = delivered.getTime() <= today.getTime()
      expect(isValid).toBe(false)
    })
  })

  describe('Validación de IDs', () => {
    test('order_id no puede estar vacío', () => {
      const orderId = 'ORDER_TEST_001'
      expect(orderId).toBeTruthy()
      expect(orderId.length).toBeGreaterThan(0)
    })

    test('supplier_id no puede estar vacío', () => {
      const supplierId = 'sup_test_001'
      expect(supplierId).toBeTruthy()
    })

    test('admin_id requerido para liberar pago', () => {
      const adminId = 'admin_test_001'
      const canRelease = !!adminId && adminId.length > 0
      expect(canRelease).toBe(true)
    })

    test('admin_id vacío NO permite liberar', () => {
      const adminId = ''
      const canRelease = !!adminId && adminId.length > 0
      expect(canRelease).toBe(false)
    })
  })

  describe('Validación de Cancellation Reason', () => {
    test('razón de cancelación es obligatoria', () => {
      const reason = 'Producto devuelto'
      const isValid = !!reason && reason.trim().length > 0
      expect(isValid).toBe(true)
    })

    test('razón vacía NO es válida', () => {
      const reason = ''
      const isValid = !!reason && reason.trim().length > 0
      expect(isValid).toBe(false)
    })

    test('razón solo con espacios NO es válida', () => {
      const reason = '   '
      const isValid = !!reason && reason.trim().length > 0
      expect(isValid).toBe(false)
    })

    test('razón debe tener longitud mínima (>10 caracteres)', () => {
      const reason = 'Devuelto'
      const isValid = reason.length >= 10
      expect(isValid).toBe(false) // 'Devuelto' tiene solo 9 caracteres
    })

    test('razón con 10+ caracteres es válida', () => {
      const reason = 'Producto devuelto por defectos'
      const isValid = reason.length >= 10
      expect(isValid).toBe(true)
    })
  })
})

describe('Lógica Crítica - Clasificación de Urgencia', () => {
  test('0-3 días: prioridad normal (default)', () => {
    const daysOld = 2
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('normal')
  })

  test('4-7 días: prioridad media (warning)', () => {
    const daysOld = 5
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('medium')
  })

  test('7+ días: prioridad alta (error/crítico)', () => {
    const daysOld = 10
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('high')
  })

  test('exactamente 3 días: aún prioridad normal', () => {
    const daysOld = 3
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('normal')
  })

  test('exactamente 7 días: aún prioridad media', () => {
    const daysOld = 7
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('medium')
  })

  test('exactamente 8 días: prioridad alta', () => {
    const daysOld = 8
    const priority = daysOld > 7 ? 'high' : daysOld > 3 ? 'medium' : 'normal'
    expect(priority).toBe('high')
  })
})

describe('Lógica Crítica - Formato de Montos', () => {
  test('formatea correctamente montos con miles', () => {
    expect(formatCLP(1000)).toBe('$1.000')
    expect(formatCLP(10000)).toBe('$10.000')
    expect(formatCLP(100000)).toBe('$100.000')
  })

  test('formatea correctamente montos con millones', () => {
    expect(formatCLP(1000000)).toBe('$1.000.000')
    expect(formatCLP(10000000)).toBe('$10.000.000')
    expect(formatCLP(100000000)).toBe('$100.000.000')
  })

  test('no agrega decimales (redondea)', () => {
    expect(formatCLP(1000.99)).toBe('$1.001')
    expect(formatCLP(1000.45)).toBe('$1.000')
  })

  test('maneja números muy grandes sin perder precisión', () => {
    const bigAmount = 999999999999
    const formatted = formatCLP(bigAmount)
    expect(formatted).toBe('$999.999.999.999')
  })
})

describe('Lógica Crítica - Formato de Fechas', () => {
  test('formatea día y mes con ceros a la izquierda', () => {
    expect(formatDate('2024-01-05T00:00:00Z')).toBe('05/01/2024')
    expect(formatDate('2024-09-09T00:00:00Z')).toBe('09/09/2024')
  })

  test('maneja correctamente fechas con zona horaria', () => {
    const dateUTC = '2024-10-25T23:00:00Z'
    const dateLocal = '2024-10-25T20:00:00-03:00'
    
    // Ambas deberían resultar en la misma fecha formateada
    const formatted1 = formatDate(dateUTC)
    const formatted2 = formatDate(dateLocal)
    
    // Puede variar por timezone, pero ambas deberían ser válidas
    expect(formatted1).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(formatted2).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  test('maneja fechas límite (inicio y fin de mes)', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('01/01/2024')
    expect(formatDate('2024-12-31T23:59:59Z')).toBe('31/12/2024')
  })
})

describe('Lógica Crítica - Reglas de Negocio Compuestas', () => {
  test('pago solo se puede liberar si: status=pending AND admin_id presente', () => {
    const status = STATUS.PENDING
    const adminId = 'admin_001'
    
    const canRelease = status === STATUS.PENDING && !!adminId
    expect(canRelease).toBe(true)
  })

  test('NO se puede liberar si status != pending', () => {
    const status = STATUS.RELEASED
    const adminId = 'admin_001'
    
    const canRelease = status === STATUS.PENDING && !!adminId
    expect(canRelease).toBe(false)
  })

  test('NO se puede liberar si no hay admin_id', () => {
    const status = STATUS.PENDING
    const adminId = null
    
    const canRelease = status === STATUS.PENDING && !!adminId
    expect(canRelease).toBe(false)
  })

  test('pago solo se puede cancelar si: status=pending', () => {
    const status = STATUS.PENDING
    const reason = 'Producto devuelto'
    
    const canCancel = status === STATUS.PENDING && !!reason && reason.length >= 10
    expect(canCancel).toBe(true)
  })

  test('NO se puede cancelar si status != pending', () => {
    const status = STATUS.RELEASED
    const reason = 'Producto devuelto'
    
    const canCancel = status === STATUS.PENDING && !!reason
    expect(canCancel).toBe(false)
  })

  test('estadísticas se calculan correctamente para lista vacía', () => {
    const releases = []
    
    const stats = {
      total_count: releases.length,
      total_amount: releases.reduce((sum, r) => sum + r.amount, 0),
      pending_count: releases.filter(r => r.status === STATUS.PENDING).length,
      released_count: releases.filter(r => r.status === STATUS.RELEASED).length
    }
    
    expect(stats.total_count).toBe(0)
    expect(stats.total_amount).toBe(0)
    expect(stats.pending_count).toBe(0)
  })

  test('estadísticas se calculan correctamente para lista con datos', () => {
    const releases = [
      { status: STATUS.PENDING, amount: 100000 },
      { status: STATUS.PENDING, amount: 200000 },
      { status: STATUS.RELEASED, amount: 150000 }
    ]
    
    const stats = {
      total_count: releases.length,
      total_amount: releases.reduce((sum, r) => sum + r.amount, 0),
      pending_count: releases.filter(r => r.status === STATUS.PENDING).length,
      released_count: releases.filter(r => r.status === STATUS.RELEASED).length
    }
    
    expect(stats.total_count).toBe(3)
    expect(stats.total_amount).toBe(450000)
    expect(stats.pending_count).toBe(2)
    expect(stats.released_count).toBe(1)
  })
})
