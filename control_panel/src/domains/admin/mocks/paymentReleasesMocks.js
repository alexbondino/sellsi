/**
 * 🎭 Mocks de Datos para Testing de Liberación de Pagos
 * 
 * Contiene datos de prueba realistas para:
 * - payment_releases (solicitudes de pago)
 * - Estadísticas calculadas
 * - Escenarios de prueba (happy path, edge cases)
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Enero de 2025
 */

// ============================================
// 📊 MOCK DATA - PAYMENT RELEASES
// ============================================

export const mockPaymentReleases = [
  // 🟡 PENDIENTE - Caso Normal (3 días desde entrega)
  {
    id: 'pr_001',
    order_id: 'AF234567',
    supplier_id: 'sup_ferreteria_001',
    supplier_name: 'Ferretería Los Pinos',
    buyer_id: 'buyer_juan_123',
    buyer_name: 'Juan Pérez González',
    amount: 450000,
    status: 'pending',
    purchased_at: '2025-10-22T14:30:00Z',
    delivered_at: '2025-10-25T16:45:00Z',
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-25T16:45:05Z',
    updated_at: '2025-10-25T16:45:05Z'
  },

  // 🟡 PENDIENTE - Urgente (8 días desde entrega)
  {
    id: 'pr_002',
    order_id: 'BK891234',
    supplier_id: 'sup_distribuidora_002',
    supplier_name: 'Distribuidora Central',
    buyer_id: 'buyer_maria_456',
    buyer_name: 'María González',
    amount: 120000,
    status: 'pending',
    purchased_at: '2025-10-12T09:15:00Z',
    delivered_at: '2025-10-20T10:20:00Z',
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-20T10:20:03Z',
    updated_at: '2025-10-20T10:20:03Z'
  },

  // 🟡 PENDIENTE - Monto alto (2 días desde entrega)
  {
    id: 'pr_003',
    order_id: 'CX567890',
    supplier_id: 'sup_construccion_003',
    supplier_name: 'Construcción y Materiales S.A.',
    buyer_id: 'buyer_pedro_789',
    buyer_name: 'Pedro Martínez',
    amount: 1850000,
    status: 'pending',
    purchased_at: '2025-10-23T11:00:00Z',
    delivered_at: '2025-10-26T15:30:00Z',
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-26T15:30:08Z',
    updated_at: '2025-10-26T15:30:08Z'
  },

  // 🟢 LIBERADO - Caso exitoso con comprobante
  {
    id: 'pr_004',
    order_id: 'DY345678',
    supplier_id: 'sup_electricidad_004',
    supplier_name: 'Electricidad del Norte',
    buyer_id: 'buyer_ana_321',
    buyer_name: 'Ana López',
    amount: 320000,
    status: 'released',
    purchased_at: '2025-10-15T08:00:00Z',
    delivered_at: '2025-10-18T12:00:00Z',
    released_at: '2025-10-20T09:30:00Z',
    released_by_admin_id: 'admin_carlos_01',
    admin_name: 'Carlos Rodríguez',
    admin_notes: 'Transferido a cuenta corriente terminada en 1234. Comprobante adjunto.',
    payment_proof_url: 'https://storage.supabase.co/v1/object/public/comprobantes/pago_pr_004.pdf',
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-18T12:00:02Z',
    updated_at: '2025-10-20T09:30:15Z'
  },

  // 🟢 LIBERADO - Sin notas
  {
    id: 'pr_005',
    order_id: 'EZ456789',
    supplier_id: 'sup_pinturas_005',
    supplier_name: 'Pinturas Colormax',
    buyer_id: 'buyer_luis_654',
    buyer_name: 'Luis Hernández',
    amount: 95000,
    status: 'released',
    purchased_at: '2025-10-12T14:20:00Z',
    delivered_at: '2025-10-16T16:00:00Z',
    released_at: '2025-10-18T10:15:00Z',
    released_by_admin_id: 'admin_sofia_02',
    admin_name: 'Sofía Morales',
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-16T16:00:05Z',
    updated_at: '2025-10-18T10:15:20Z'
  },

  // 🟢 LIBERADO - Monto alto con notas detalladas
  {
    id: 'pr_006',
    order_id: 'FA567890',
    supplier_id: 'sup_maquinaria_006',
    supplier_name: 'Maquinaria Industrial Ltda.',
    buyer_id: 'buyer_roberto_987',
    buyer_name: 'Roberto Silva',
    amount: 2450000,
    status: 'released',
    purchased_at: '2025-10-05T10:00:00Z',
    delivered_at: '2025-10-10T14:30:00Z',
    released_at: '2025-10-15T11:00:00Z',
    released_by_admin_id: 'admin_carlos_01',
    admin_name: 'Carlos Rodríguez',
    admin_notes: 'Pago aprobado por gerencia. Transferencia realizada el 15/10/2025 a las 11:00. Banco Estado, cuenta corriente. Confirmación verbal del proveedor recibida.',
    payment_proof_url: 'https://storage.supabase.co/v1/object/public/comprobantes/pago_pr_006.pdf',
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-10T14:30:10Z',
    updated_at: '2025-10-15T11:00:45Z'
  },

  // 🔴 CANCELADO - Problema con el pedido
  {
    id: 'pr_007',
    order_id: 'GB678901',
    supplier_id: 'sup_herramientas_007',
    supplier_name: 'Herramientas Profesionales',
    buyer_id: 'buyer_carmen_147',
    buyer_name: 'Carmen Vargas',
    amount: 180000,
    status: 'cancelled',
    purchased_at: '2025-10-08T13:00:00Z',
    delivered_at: '2025-10-12T15:00:00Z',
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: 'Comprador reportó productos defectuosos. Se inició proceso de devolución. Pago retenido hasta resolución del caso.',
    cancelled_at: '2025-10-18T14:20:00Z',
    created_at: '2025-10-12T15:00:07Z',
    updated_at: '2025-10-18T14:20:30Z'
  },

  // 🟡 PENDIENTE - Recién entregado (hoy)
  {
    id: 'pr_008',
    order_id: 'HC789012',
    supplier_id: 'sup_jardineria_008',
    supplier_name: 'Jardinería Verde Vida',
    buyer_id: 'buyer_diego_258',
    buyer_name: 'Diego Ramírez',
    amount: 67000,
    status: 'pending',
    purchased_at: '2025-10-26T16:00:00Z',
    delivered_at: '2025-10-28T10:00:00Z',
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: '2025-10-28T10:00:02Z',
    updated_at: '2025-10-28T10:00:02Z'
  }
]

// ============================================
// 📈 MOCK DATA - ESTADÍSTICAS
// ============================================

export const mockPaymentReleaseStats = {
  // Contadores
  total_count: 8,
  pending_count: 4,
  released_count: 3,
  cancelled_count: 1,

  // Montos
  total_amount: 5532000,
  pending_amount: 2487000, // pr_001 + pr_002 + pr_003 + pr_008
  released_amount: 2865000, // pr_004 + pr_005 + pr_006
  cancelled_amount: 180000, // pr_007

  // Promedios
  avg_days_to_release: 2.67, // Promedio de días entre delivered_at y released_at para liberados
  avg_amount: 691500,

  // Adicionales (opcional)
  oldest_pending_days: 8, // pr_002
  newest_pending_days: 0  // pr_008
}

// ============================================
// 🎭 ESCENARIOS DE PRUEBA
// ============================================

// Escenario 1: Solo pendientes (filtro status='pending')
export const mockPendingReleases = mockPaymentReleases.filter(r => r.status === 'pending')

// Escenario 2: Solo liberados (filtro status='released')
export const mockReleasedReleases = mockPaymentReleases.filter(r => r.status === 'released')

// Escenario 3: Solo cancelados (filtro status='cancelled')
export const mockCancelledReleases = mockPaymentReleases.filter(r => r.status === 'cancelled')

// Escenario 4: Urgentes (más de 7 días desde entrega)
export const mockUrgentReleases = [mockPaymentReleases[1]] // pr_002

// Escenario 5: Montos altos (>= $1,000,000)
export const mockHighAmountReleases = mockPaymentReleases.filter(r => r.amount >= 1000000)

// Escenario 6: Vacío (sin resultados)
export const mockEmptyReleases = []

// ============================================
// 🛠️ UTILIDADES DE TESTING
// ============================================

/**
 * Genera un mock de payment_release con datos aleatorios
 */
export const generateMockRelease = (overrides = {}) => {
  const baseId = Math.random().toString(36).substr(2, 9)
  return {
    id: `pr_${baseId}`,
    order_id: `ORD_${baseId.toUpperCase()}`,
    supplier_id: `sup_${baseId}`,
    supplier_name: `Proveedor ${baseId.substr(0, 4).toUpperCase()}`,
    buyer_id: `buyer_${baseId}`,
    buyer_name: `Comprador ${baseId.substr(0, 4)}`,
    amount: Math.floor(Math.random() * 1000000) + 50000,
    status: 'pending',
    purchased_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
    delivered_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
    released_at: null,
    released_by_admin_id: null,
    admin_name: null,
    admin_notes: null,
    payment_proof_url: null,
    cancellation_reason: null,
    cancelled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Genera un array de N mocks aleatorios
 */
export const generateMockReleases = (count = 10) => {
  return Array.from({ length: count }, () => generateMockRelease())
}

/**
 * Simula delay de red
 */
export const mockDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simula respuesta de API con delay
 */
export const mockApiResponse = async (data, delayMs = 800) => {
  await mockDelay(delayMs)
  return { data, error: null }
}

/**
 * Simula error de API
 */
export const mockApiError = async (errorMessage = 'Error de conexión', delayMs = 500) => {
  await mockDelay(delayMs)
  return { data: null, error: new Error(errorMessage) }
}

// ============================================
// 📝 DATOS PARA MODALES
// ============================================

// Mock para ReleasePaymentModal (release pendiente)
export const mockReleaseForModal = mockPaymentReleases[0] // pr_001 (pendiente)

// Mock para PaymentReleaseDetailsModal (release liberado con todos los datos)
export const mockReleaseForDetailsModal = mockPaymentReleases[3] // pr_004 (liberado con comprobante)

// Mock para PaymentReleaseDetailsModal (release cancelado)
export const mockCancelledReleaseForModal = mockPaymentReleases[6] // pr_007 (cancelado)

// ============================================
// 🧪 CONSTANTES DE TESTING
// ============================================

export const MOCK_ADMIN_ID = 'admin_test_001'
export const MOCK_ADMIN_NAME = 'Admin de Prueba'

export const MOCK_RELEASE_NOTES = 'Pago liberado en testing. Transferencia realizada correctamente.'
export const MOCK_PROOF_URL = 'https://storage.supabase.co/v1/object/public/comprobantes/test_comprobante.pdf'

export const MOCK_CANCELLATION_REASON = 'Orden cancelada por el comprador. Reembolso procesado.'

// ============================================
// 📦 EXPORTAR TODO
// ============================================

export default {
  releases: mockPaymentReleases,
  stats: mockPaymentReleaseStats,
  pending: mockPendingReleases,
  released: mockReleasedReleases,
  cancelled: mockCancelledReleases,
  urgent: mockUrgentReleases,
  highAmount: mockHighAmountReleases,
  empty: mockEmptyReleases,
  
  // Utilidades
  generateMockRelease,
  generateMockReleases,
  mockDelay,
  mockApiResponse,
  mockApiError,
  
  // Para modales
  forModal: mockReleaseForModal,
  forDetailsModal: mockReleaseForDetailsModal,
  forCancelledModal: mockCancelledReleaseForModal,
  
  // Constantes
  MOCK_ADMIN_ID,
  MOCK_ADMIN_NAME,
  MOCK_RELEASE_NOTES,
  MOCK_PROOF_URL,
  MOCK_CANCELLATION_REASON
}
