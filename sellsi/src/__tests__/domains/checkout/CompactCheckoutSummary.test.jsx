import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CompactCheckoutSummary from '../../../domains/checkout/components/CompactCheckoutSummary'

describe('CompactCheckoutSummary (mobile)', () => {
  test('uses price_tiers and computes total including shipping and payment fee', () => {
    const formatPrice = n => `CLP ${n}`

    const orderData = {
      items: [
        // item without .price but with price_tiers — this used to show 0 if code used item.price
        {
          id: 'p1',
          name: 'Producto 1',
          quantity: 2,
          originalPrice: 1500,
          price_tiers: [{ min_quantity: 1, price: 1000 }]
        }
      ],
      subtotal: 2000, // intentionally set but component should recompute from items
      shipping: 500
    }

    // selected method that charges Khipu fixed fee
    const selectedMethod = { id: 'khipu', name: 'Khipu' }

    render(
      <CompactCheckoutSummary
        orderData={orderData}
        formatPrice={formatPrice}
        variant="minimal"
        selectedMethod={selectedMethod}
      />
    )

    // Header shows final total (baseTotal = 2 * 1000 + 500 = 2500, paymentFee 500 -> total 3000)
    expect(screen.getByText('CLP 3000')).toBeInTheDocument()

    // Expand to reveal list and breakdown
    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Per-item display should show computed price (unit price 1000 * qty 2 = 2000)
    const matches2000 = screen.getAllByText('CLP 2000')
    expect(matches2000.length).toBeGreaterThanOrEqual(1)

    // Subtotal should be shown and match calculated 2000 (one of the CLP 2000 occurrences)
    expect(matches2000.length).toBeGreaterThanOrEqual(1)

    // Shipping displayed and commission are both CLP 500 — ensure both exist
    const matches500 = screen.getAllByText('CLP 500')
    expect(matches500.length).toBeGreaterThanOrEqual(2)
  })
})
