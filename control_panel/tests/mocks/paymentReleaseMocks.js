// Mocks compartidos para tests de payment releases
export const mockAdminUser = {
  id: 'admin_test_001',
  email: 'admin@test.com',
  name: 'Admin Test',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockSupplier = {
  id: 'sup_test_001',
  user_id: 'user_sup_001',
  business_name: 'Proveedor Test S.A.',
  contact_email: 'contacto@proveedortest.cl',
  phone: '+56912345678',
  status: 'active'
}

export const mockBuyer = {
  id: 'buyer_test_001',
  user_id: 'user_buyer_001',
  name: 'Comprador Test',
  email: 'comprador@test.cl'
}

export const mockOrder = {
  id: 'ORDER_TEST_001',
  supplier_id: 'sup_test_001',
  buyer_id: 'buyer_test_001',
  status: 'delivered',
  payment_status: 'paid',
  total_amount: 150000,
  purchased_at: '2025-10-20T10:00:00Z',
  delivered_at: '2025-10-25T15:30:00Z',
  created_at: '2025-10-20T10:00:00Z'
}

export const mockPaymentReleasePending = {
  id: 'pr_test_pending_001',
  order_id: 'ORDER_TEST_001',
  supplier_id: 'sup_test_001',
  supplier_name: 'Proveedor Test S.A.',
  buyer_id: 'buyer_test_001',
  buyer_name: 'Comprador Test',
  amount: 150000,
  status: 'pending',
  purchased_at: '2025-10-20T10:00:00Z',
  delivered_at: '2025-10-25T15:30:00Z',
  delivery_confirmed_at: '2025-10-25T15:30:00Z',
  days_since_delivery: 0,
  released_at: null,
  released_by_admin_id: null,
  admin_name: null,
  admin_notes: null,
  payment_proof_url: null,
  cancellation_reason: null,
  cancelled_at: null,
  created_at: '2025-10-25T15:30:10Z',
  updated_at: '2025-10-25T15:30:10Z'
}

export const mockPaymentReleaseReleased = {
  id: 'pr_test_released_001',
  order_id: 'ORDER_TEST_002',
  supplier_id: 'sup_test_001',
  supplier_name: 'Proveedor Test S.A.',
  buyer_id: 'buyer_test_001',
  buyer_name: 'Comprador Test',
  amount: 250000,
  status: 'released',
  purchased_at: '2025-10-15T10:00:00Z',
  delivered_at: '2025-10-20T14:00:00Z',
  delivery_confirmed_at: '2025-10-20T14:00:00Z',
  days_since_delivery: 2,
  released_at: '2025-10-22T11:00:00Z',
  released_by_admin_id: 'admin_test_001',
  admin_name: 'Admin Test',
  admin_notes: 'Transferencia realizada exitosamente. Comprobante enviado por correo.',
  payment_proof_url: 'https://storage.test.com/comprobantes/test.pdf',
  cancellation_reason: null,
  cancelled_at: null,
  created_at: '2025-10-20T14:00:10Z',
  updated_at: '2025-10-22T11:00:45Z'
}

export const mockPaymentReleaseCancelled = {
  id: 'pr_test_cancelled_001',
  order_id: 'ORDER_TEST_003',
  supplier_id: 'sup_test_002',
  supplier_name: 'Otro Proveedor Test',
  buyer_id: 'buyer_test_002',
  buyer_name: 'Otro Comprador',
  amount: 80000,
  status: 'cancelled',
  purchased_at: '2025-10-18T12:00:00Z',
  delivered_at: '2025-10-22T16:00:00Z',
  delivery_confirmed_at: '2025-10-22T16:00:00Z',
  days_since_delivery: 2,
  released_at: null,
  released_by_admin_id: null,
  admin_name: null,
  admin_notes: null,
  payment_proof_url: null,
  cancellation_reason: 'Producto devuelto por defectos de calidad',
  cancelled_at: '2025-10-24T10:00:00Z',
  created_at: '2025-10-22T16:00:07Z',
  updated_at: '2025-10-24T10:00:30Z'
}

export const mockPaymentReleasesList = [
  mockPaymentReleasePending,
  mockPaymentReleaseReleased,
  mockPaymentReleaseCancelled
]

export const mockStats = {
  total: 3,
  total_amount: 480000,
  pending_release: 1,
  pending_amount: 150000,
  released: 1,
  released_amount: 250000,
  cancelled: 1,
  cancelled_amount: 80000,
  avg_amount: 480000 / 3,
  avg_days_to_release: 2.0
}

// Helpers para crear mocks dinámicamente
export const createMockPaymentRelease = (overrides = {}) => ({
  id: `pr_mock_${Date.now()}`,
  order_id: `ORDER_MOCK_${Date.now()}`,
  supplier_id: 'sup_mock_001',
  supplier_name: 'Mock Supplier',
  buyer_id: 'buyer_mock_001',
  buyer_name: 'Mock Buyer',
  amount: 100000,
  status: 'pending',
  purchased_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  delivery_confirmed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  days_since_delivery: 3,
  released_at: null,
  released_by_admin_id: null,
  admin_name: null,
  admin_notes: null,
  payment_proof_url: null,
  cancellation_reason: null,
  cancelled_at: null,
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides
})

export const createMockStats = (overrides = {}) => ({
  total: 0,
  total_amount: 0,
  pending_release: 0,
  pending_amount: 0,
  released: 0,
  released_amount: 0,
  cancelled: 0,
  cancelled_amount: 0,
  avg_amount: 0,
  avg_days_to_release: 0,
  ...overrides
})

// Mock de respuestas de la API
export const mockApiSuccess = (data) => ({
  success: true,
  data
})

export const mockApiError = (message = 'Error de prueba') => ({
  success: false,
  error: message
})

// Mock delays para simular latencia
export const mockDelay = (ms = 100) => 
  new Promise(resolve => setTimeout(resolve, ms))
