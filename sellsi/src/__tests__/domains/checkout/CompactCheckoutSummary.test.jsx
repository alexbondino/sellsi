import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
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
    const totalEl = screen.getByText('CLP 3000')
    expect(totalEl).toBeInTheDocument()

    // Expand to reveal list and breakdown (click on the total's button)
    const clickTarget = totalEl.closest('button') || screen.getByRole('button')
    fireEvent.click(clickTarget)

    // Per-item display should show computed price (unit price 1000 * qty 2 = 2000) near the product name
    const productRow = screen.getByText('Producto 1').closest('div')
    expect(within(productRow).getByText('CLP 2000')).toBeInTheDocument()

    // Subtotal row should show the recomputed subtotal (2000)
    const subtotalRow = screen.getByText('Subtotal').parentElement
    expect(within(subtotalRow).getByText('CLP 2000')).toBeInTheDocument()

    // Shipping displayed and commission should be individually asserted
    const envioRow = screen.getByText('Envío').parentElement
    expect(within(envioRow).getByText('CLP 500')).toBeInTheDocument()

    const comisionRow = screen.getByText('Comisión').parentElement
    expect(within(comisionRow).getByText('CLP 500')).toBeInTheDocument()
  })

  test('shows FREE shipping label and correct total when shipping is 0', () => {
    const formatPrice = n => `CLP ${n}`

    const orderData = {
      items: [ { id: 'p1', name: 'X', quantity: 2, price_tiers: [{ min_quantity: 1, price: 1000 }] } ],
      shipping: 0
    }

    render(
      <CompactCheckoutSummary orderData={orderData} formatPrice={formatPrice} variant="minimal" />
    )

    // Header shows the total (2000) — query it within the card button to avoid ambiguous matches
    const button = screen.getByRole('button')
    expect(within(button).getByText('CLP 2000')).toBeInTheDocument()

    // Expand and check shipping row shows '¡GRATIS!'
    fireEvent.click(button)

    const envioRow = screen.getByText('Envío').parentElement
    expect(within(envioRow).getByText('¡GRATIS!')).toBeInTheDocument()
  })

  test('shows "+N productos más" when more than 3 items in the order', () => {
    const formatPrice = n => `CLP ${n}`
    const items = Array.from({ length: 5 }).map((_, i) => ({ id: `p${i}`, name: `P${i}`, quantity: 1, price: 100 }))

    const orderData = { items, shipping: 0 }

    render(<CompactCheckoutSummary orderData={orderData} formatPrice={formatPrice} variant="minimal" />)

    // Use the card button header to avoid matching subtotal/other identical labels
    const btn = screen.getByRole('button')
    expect(within(btn).getByText('CLP 500')).toBeInTheDocument()
    fireEvent.click(btn)

    expect(screen.getByText('+2 productos más')).toBeInTheDocument()
  })

  test('calculates Flow percent-based payment fee correctly', () => {
    const formatPrice = n => `CLP ${n}`

    const items = [ { id: 'p1', name: 'Flow Item', quantity: 2, price_tiers: [{ min_quantity: 1, price: 1000 }] } ]
    const shipping = 150
    const orderData = { items, shipping }

    // base = subtotal(2000) + shipping(150) = 2150
    const base = 2000 + shipping
    const fee = Math.round(base * 0.038) // flow percent fee as in component
    const expectedTotal = base + fee

    const { rerender } = render(
      <CompactCheckoutSummary
        orderData={orderData}
        formatPrice={formatPrice}
        variant="minimal"
        selectedMethod={{ id: 'flow', name: 'Flow Payments' }}
      />
    )

    // Header total should reflect percent-based fee
    const btn = screen.getByRole('button')
    expect(within(btn).getByText(`CLP ${expectedTotal}`)).toBeInTheDocument()

    // Expand and ensure Commission row shows the computed fee
    fireEvent.click(btn)
    const comRow = screen.getByText('Comisión').parentElement
    expect(within(comRow).getByText(`CLP ${fee}`)).toBeInTheDocument()

    // Also assert that when selectedMethod is omitted no 'Comisión' row exists (use rerender)
    rerender(<CompactCheckoutSummary orderData={orderData} formatPrice={formatPrice} variant="minimal" />)
    const btn2 = screen.getByRole('button')
    fireEvent.click(btn2)
    expect(screen.queryByText('Comisión')).not.toBeInTheDocument()
  })

  test('shows offered item indicator and tooltip when item is offered', async () => {
    const formatPrice = n => `CLP ${n}`
    const items = [ { id: 'p1', name: 'Oferta', quantity: 1, price_tiers: [{ min_quantity: 1, price: 500 }], offer_id: 'o1' } ]
    const orderData = { items, shipping: 0 }

    render(<CompactCheckoutSummary orderData={orderData} formatPrice={formatPrice} variant="minimal" />)

    const btn = screen.getByRole('button')
    fireEvent.click(btn)

    // There should be an indicator dot
    const indicator = screen.getByTestId('offered-indicator')
    expect(indicator).toBeInTheDocument()

    // Hover to open tooltip and assert text
    fireEvent.mouseOver(indicator)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Este producto es ofertado')
  })

  test('handles string originalPrice and default formatPrice', () => {
    // default formatPrice is provided by the component; omit formatPrice here
    const items = [ { id: 'p1', name: 'StrPrice', quantity: 2, originalPrice: '1500', price_tiers: [{ min_quantity: 1, price: 1000 }] } ]
    const orderData = { items, shipping: 0 }
    render(<CompactCheckoutSummary orderData={orderData} variant="minimal" />)

    const btn = screen.getByRole('button')
    // total = 2 * 1000 = 2000
    expect(within(btn).getByText('CLP 2000')).toBeInTheDocument()
  })

  test('handles empty order gracefully', () => {
    const formatPrice = n => `CLP ${n}`
    render(<CompactCheckoutSummary orderData={{ items: [], shipping: 0 }} formatPrice={formatPrice} variant="minimal" />)

    // Header shows 0 productos and total CLP 0
    expect(screen.getByText(/0\s*producto/)).toBeInTheDocument()
    const btn = screen.getByRole('button')
    expect(within(btn).getByText('CLP 0')).toBeInTheDocument()
  })
})
