import React from 'react'
import { render, screen } from '@testing-library/react'
import { PriceTiersDisplay } from '../../shared/components/cart/AddToCartModal/components/PriceTiersDisplay'

describe('PriceTiersDisplay', () => {
  it('renders base price when no tiers provided', () => {
    const productData = { basePrice: 15000 }
    const { getByText } = render(<PriceTiersDisplay productData={productData} priceTiers={[]} quantity={1} />)
    expect(getByText(/Precio/i)).toBeTruthy()
    expect(getByText(/15.000/)).toBeTruthy()
  })

  it('highlights active tier according to quantity', () => {
    const productData = { basePrice: 10000 }
    const tiers = [
      { id: 't1', min_quantity: 1, price: 10000 },
      { id: 't2', min_quantity: 10, price: 9000 },
      { id: 't3', min_quantity: 50, price: 8000 },
    ]
    render(<PriceTiersDisplay productData={productData} priceTiers={tiers} quantity={12} />)
    // expect the tier that contains 12 (t2) to render its price
    expect(screen.getByText(/9.000/)).toBeTruthy()
  })

  it('can render a large number of tiers without throwing (performance smoke)', () => {
    const productData = { basePrice: 1 }
    const tiers = new Array(1000).fill(0).map((_, i) => ({ id: `t${i}`, min_quantity: i + 1, price: i + 1 }))
    const { container } = render(<PriceTiersDisplay productData={productData} priceTiers={tiers} quantity={500} />)
    // a basic smoke: component mounted and produced markup
    expect(container.firstChild).toBeTruthy()
  })
})
