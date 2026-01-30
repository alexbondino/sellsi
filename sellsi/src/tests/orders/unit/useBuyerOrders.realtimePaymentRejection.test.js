import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { useBuyerOrders } from '../../../workspaces/buyer/my-orders/hooks/useBuyerOrders'
import { act } from 'react'

// Mocks
const mockGetPaymentOrdersForBuyer = jest.fn()
let savedSubscribeCallback = null
const mockSubscribeToBuyerPaymentOrders = jest.fn((buyerId, cb) => {
  savedSubscribeCallback = cb
  return () => {}
})
const mockGetPaymentStatusesForBuyer = jest.fn()

jest.mock('../../../services/user', () => ({
  orderService: {
    getPaymentOrdersForBuyer: (...a) => mockGetPaymentOrdersForBuyer(...a),
    subscribeToBuyerPaymentOrders: (...a) => mockSubscribeToBuyerPaymentOrders(...a),
    getPaymentStatusesForBuyer: (...a) => mockGetPaymentStatusesForBuyer(...a),
  }
}))

jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: jest.fn()
  }
}))

const BUYER_ID = '123e4567-e89b-12d3-a456-426614174000'

function Harness() {
  const { orders, fetchOrders } = useBuyerOrders(BUYER_ID)
  return (
    <div>
      <button data-testid="refetch" onClick={() => fetchOrders()}></button>
      <div data-testid="orders-root">
        {orders.map(o => (
          <div key={o.order_id + '-' + (o.supplier_id || 'none')} data-order data-order-id={o.order_id} data-payment-status={o.payment_status} data-rejection={o.payment_rejection_reason || ''}></div>
        ))}
      </div>
    </div>
  )
}

describe('useBuyerOrders realtime payment rejection propagation', () => {
  it('actualiza payment_status y payment_rejection_reason en UPDATE realtime', async () => {
    // Initial fetch returns one order pending
    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: [{ order_id: 'o1', id: 'o1', payment_status: 'pending', created_at: new Date().toISOString(), items: [] }] })

    const { getByTestId, container } = render(<Harness />)

    // Trigger initial fetch
    fireEvent.click(getByTestId('refetch'))

    await waitFor(() => {
      const el = container.querySelector('[data-order-id="o1"]')
      expect(el).toBeTruthy()
      expect(el.getAttribute('data-payment-status')).toBe('pending')
    })

    // Simulate realtime UPDATE payload with rejected status and reason
    expect(typeof savedSubscribeCallback).toBe('function')
    const payload = { eventType: 'UPDATE', new: { id: 'o1', payment_status: 'rejected', payment_rejection_reason: 'Comprobante inválido', payment_method: 'bank_transfer', updated_at: new Date().toISOString() } }

    // Call the saved callback to simulate realtime update (wrap in act to avoid warnings)
    act(() => savedSubscribeCallback(payload))

    // Wait for state update
    await waitFor(() => {
      const el = container.querySelector('[data-order-id="o1"]')
      expect(el.getAttribute('data-payment-status')).toBe('rejected')
      expect(el.getAttribute('data-rejection')).toBe('Comprobante inválido')
    })
  })
})