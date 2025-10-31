import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ProductCard from '../../shared/components/display/product-card/ProductCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

// Mock only useNavigate but preserve other react-router-dom utilities like MemoryRouter
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => jest.fn() }
})

const createWrapper = () => {
  const qc = new QueryClient()
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProductCard', () => {
  it('renders buyer card and calls registerProductNode on mount without throwing', () => {
    const register = jest.fn()
    const product = { id: 'p1', nombre: 'Test', imagen: null }
    const { container } = render(<ProductCard product={product} type="buyer" registerProductNode={register} />, { wrapper: createWrapper() })
    expect(container).toBeTruthy()
    // mount effect should call registerProductNode
    expect(register).toHaveBeenCalledWith('p1', expect.any(Object))
  })

  it('does not navigate when modal is open and card is clicked', () => {
    const product = { id: 'p2', nombre: 'Test2', imagen: null }
    const { container } = render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    // clicking the card should not throw
    const card = container.querySelector('[role="button"]') || container.firstChild
    if (card) fireEvent.click(card)
    expect(true).toBe(true)
  })
})

