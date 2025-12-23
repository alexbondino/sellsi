import React from 'react'
import { render, screen, within, fireEvent } from '@testing-library/react'
import MobilePaymentLayout from '../../../domains/checkout/components/MobilePaymentLayout'

describe('MobilePaymentLayout', () => {
  test('bottom bar shows computed total for selected method and CTA enabled', () => {
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

    // Bottom bar should show the computed total (3000) and the CTA should be enabled
    const bottomBar = screen.getByTestId('payment-bottom-bar')
    expect(within(bottomBar).getByTestId('payment-bottom-total')).toHaveTextContent('CLP 3000')

    const cta = within(bottomBar).getByTestId('payment-cta')
    expect(cta).toBeEnabled()
    expect(cta).toHaveTextContent(/^Confirmar Pago$/i)
  })

  test('CTA is disabled when no payment method selected', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [], shipping: 0 }
    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={[]}
        selectedMethodId={null}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={false}
        formatPrice={formatPrice}
      />
    )

    const bottomBar = screen.getByTestId('payment-bottom-bar')
    const cta = within(bottomBar).getByTestId('payment-cta')
    expect(cta).toBeDisabled()
  })

  test('CTA shows processing and is disabled when isProcessing=true', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [], shipping: 0 }
    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={[{ id: 'khipu', name: 'Khipu' }]}
        selectedMethodId={'khipu'}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={true}
        formatPrice={formatPrice}
      />
    )

    const bottomBar = screen.getByTestId('payment-bottom-bar')
    const cta = within(bottomBar).getByTestId('payment-cta')
    expect(cta).toBeDisabled()
    expect(cta).toHaveTextContent(/^Procesando\.\.\.$|Cargando/)
  })

  test('renders available payment methods and displays their fees', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [], shipping: 0 }
    const methods = [
      { id: 'khipu', name: 'Khipu', fees: { fixed: 500 } },
      { id: 'flow', name: 'Flow', fees: { percentage: 3.8 } }
    ]

    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={methods}
        selectedMethodId={null}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={false}
        formatPrice={formatPrice}
      />
    )

    // Both method names should be visible
    expect(screen.getByText('Khipu')).toBeInTheDocument()
    expect(screen.getByText('Flow')).toBeInTheDocument()

    // Commission displays per-method: assert fee labels exist
    expect(screen.getByText('CLP 500')).toBeInTheDocument()
    expect(screen.getByText(/3\.8%/)).toBeInTheDocument()
  })

  test('normalizes currentStep when passed as string id', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [], shipping: 0 }

    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={[]}
        selectedMethodId={null}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={false}
        formatPrice={formatPrice}
        currentStep={'payment_method'}
      />
    )

    // MobilePaymentHeader should show 'Paso 2 de 3'
    expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument()
  })

  test('clicking a payment method calls onMethodSelect', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [], shipping: 0 }
    const mockSelect = jest.fn()
    const methods = [{ id: 'khipu', name: 'Khipu' }, { id: 'flow', name: 'Flow' }]

    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={methods}
        selectedMethodId={null}
        onMethodSelect={mockSelect}
        onBack={() => {}}
        onContinue={() => {}}
        isProcessing={false}
        formatPrice={formatPrice}
      />
    )

    // Click the Khipu card (click the element that contains the name)
    const khipuEl = screen.getByText('Khipu')
    fireEvent.click(khipuEl.closest('div'))
    expect(mockSelect).toHaveBeenCalledWith('khipu')
  })

  test('clicking CTA calls onContinue', () => {
    const formatPrice = n => `CLP ${n}`
    const orderData = { items: [ { id: 'p1', name: 'P1', quantity: 1, price_tiers: [{ min_quantity: 1, price: 1000 }] } ], shipping: 0 }
    const mockContinue = jest.fn()

    render(
      <MobilePaymentLayout
        orderData={orderData}
        availableMethods={[{ id: 'khipu', name: 'Khipu' }]}
        selectedMethodId={'khipu'}
        onMethodSelect={() => {}}
        onBack={() => {}}
        onContinue={mockContinue}
        isProcessing={false}
        formatPrice={formatPrice}
      />
    )

    const bottomBar = screen.getByTestId('payment-bottom-bar')
    const cta = within(bottomBar).getByTestId('payment-cta')
    fireEvent.click(cta)
    expect(mockContinue).toHaveBeenCalled()
  })
})
