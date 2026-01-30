import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'

// Mock the tracker to assert usage from the hook
const mockApply = jest.fn()
const mockGet = jest.fn().mockReturnValue(new Set(['mocked-id']))
const mockDispose = jest.fn()

jest.mock('../../../workspaces/buyer/my-orders/utils/recentlyPaidTracker', () => ({
  createRecentlyPaidTracker: () => ({
    applyOrders: mockApply,
    getRecentlyPaid: mockGet,
    dispose: mockDispose,
  })
}))

// Lazy import hook after mock
const { usePaidOrdersHighlight } = require('../../../workspaces/buyer/my-orders/hooks/usePaidOrdersHighlight')

function Harness({ orders }) {
  const recentlyPaid = usePaidOrdersHighlight(orders)
  return <div data-testid="set" data-value={Array.from(recentlyPaid).join(',')}></div>
}

describe('usePaidOrdersHighlight integration with tracker', () => {
  afterEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('uses createRecentlyPaidTracker and calls applyOrders and getRecentlyPaid', () => {
    const orders = [{ order_id: 'o1', payment_status: 'paid' }]
    render(<Harness orders={orders} />)

    // tracker.applyOrders should be called with orders
    expect(mockApply).toHaveBeenCalledWith(orders)
    // getRecentlyPaid result is returned by hook
    const el = screen.getByTestId('set')
    expect(el.getAttribute('data-value')).toBe('mocked-id')
  })

  it('calls dispose on unmount', () => {
    const { unmount } = render(<Harness orders={[]} />)
    unmount()
    expect(mockDispose).toHaveBeenCalled()
  })
})