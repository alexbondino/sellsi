import { splitOrderBySupplier } from '../../../domains/orders/shared/splitOrderBySupplier'

describe('splitOrderBySupplier - propagation of payment fields', () => {
  it('propagates payment_method and payment_rejection_reason when items missing (no items)', () => {
    const order = {
      id: 'o-no-items',
      items: [],
      status: 'pending',
      payment_status: 'rejected',
      payment_method: 'bank_transfer',
      payment_rejection_reason: 'Comprobante inválido',
      created_at: new Date().toISOString(),
    }

    const parts = splitOrderBySupplier(order)
    expect(Array.isArray(parts)).toBe(true)
    expect(parts).toHaveLength(1)

    const p = parts[0]
    expect(p.payment_method).toBe('bank_transfer')
    expect(p.payment_rejection_reason).toBe('Comprobante inválido')
    expect(p.payment_status).toBe('rejected')
  })

  it('propagates payment fields in single-supplier case', () => {
    const order = {
      id: 'o-single',
      items: [
        { product: { supplier_id: 's1' }, product_id: 'p1', quantity: 1, price_at_addition: 100 }
      ],
      status: 'pending',
      payment_status: 'rejected',
      payment_method: 'bank_transfer',
      payment_rejection_reason: 'Fondos insuficientes',
      created_at: new Date().toISOString(),
    }

    const parts = splitOrderBySupplier(order)
    expect(parts).toHaveLength(1)
    const p = parts[0]
    expect(p.supplier_id).toBe('s1')
    expect(p.payment_method).toBe('bank_transfer')
    expect(p.payment_rejection_reason).toBe('Fondos insuficientes')
    expect(p.payment_status).toBe('rejected')
  })

  it('propagates payment fields to each part in multi-supplier case', () => {
    const order = {
      id: 'o-multi',
      items: [
        { product: { supplier_id: 's1' }, product_id: 'p1', quantity: 1, price_at_addition: 100 },
        { product: { supplier_id: 's2' }, product_id: 'p2', quantity: 2, price_at_addition: 50 }
      ],
      status: 'pending',
      payment_status: 'rejected',
      payment_method: 'bank_transfer',
      payment_rejection_reason: 'Referencia no válida',
      created_at: new Date().toISOString(),
    }

    const parts = splitOrderBySupplier(order)
    expect(parts.length).toBe(2)
    // Expect two parts (one per supplier) - include serialized parts in message to help debug failures
    expect(parts.length).toBe(2)
    const supplierIds = parts.map(p => p.supplier_id || p.supplierId || null).sort()
    // Debug: print parts content on failure to inspect actual shapes
    if (supplierIds.length !== 2 || supplierIds[0] !== 's1' || supplierIds[1] !== 's2') {
      // eslint-disable-next-line no-console
      console.error('splitOrderBySupplier returned unexpected parts:', JSON.stringify(parts, null, 2))
    }
    expect(supplierIds).toEqual(['s1', 's2'])

    // Ensure that both parts carry the payment fields
    expect(parts.length).toBe(2)
    expect(parts.every(p => p.payment_method === 'bank_transfer')).toBe(true)
    expect(parts.every(p => p.payment_rejection_reason === 'Referencia no válida')).toBe(true)
    expect(parts.every(p => p.payment_status === 'rejected')).toBe(true)
  })
})