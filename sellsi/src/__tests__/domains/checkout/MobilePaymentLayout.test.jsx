import React from 'react'
import { render, screen } from '@testing-library/react'
import MobilePaymentLayout from '../../../domains/checkout/components/MobilePaymentLayout'

describe('MobilePaymentLayout', () => {
  test('bottom bar total includes payment fee for selected method', () => {
    const formatPrice = n => `CLP ${n}`

    const orderData = {
      items: [
        { id: 'p1', name: 'Producto 1', quantity: 2, originalPrice: 1500, price_tiers: [{ min_quantity: 1, price: 1000 }] }
      ],
      shipping: 500,
      total: 99999
    }

    const methods = [{ id: 'khipu', name: 'Khipu' }, { id: 'flow', name: 'Flow' }]

    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={methods}
        selectedMethodId={'khipu'}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={false}
        formatPrice={formatPrice}
      />
    )

    // for khipu: baseTotal = (2x1000) + 500 = 2500 ; fee = 500 => total = 3000
    expect(screen.getAllByText('CLP 3000').length).toBeGreaterThanOrEqual(1)
  })
})
