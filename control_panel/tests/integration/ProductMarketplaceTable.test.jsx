/**
 * @jest-environment jsdom
 *
 * Tests de integración para ProductMarketplaceTable
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProductMarketplaceTable from '../../src/domains/admin/components/ProductMarketplaceTable'
import * as productService from '../../src/domains/admin/services/adminProductService'

// Mock del servicio
jest.mock('../../src/domains/admin/services/adminProductService')

// Mock useBanner (solo necesitamos stub)
jest.mock('../../src/shared/components/display/banners/BannerContext', () => ({
  useBanner: () => ({ showBanner: jest.fn() })
}))

// Mock image component that uses react-query to avoid needing QueryClient in this unit test
jest.mock('../../src/components/UniversalProductImage', () => ({
  AdminTableImage: function AdminTableImage() { return null; }
}))

const createProducts = (count) => Array.from({ length: count }, (_, i) => ({
  product_id: `prod_${i + 1}`,
  product_name: `Product ${i + 1}`,
  supplier_name: `Supplier ${Math.ceil((i + 1) / 10)}`,
  supplier: `Supplier ${Math.ceil((i + 1) / 10)}`,
  price: 100 + i,
  stock: 10,
  min_purchase: 1
}))

describe('ProductMarketplaceTable - Paginación', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('muestra botones de página correctos para 2 páginas (no duplicados) y navega a página 2', async () => {
    const products = createProducts(101) // PRODUCTS_PER_PAGE = 100 -> 2 pages
    productService.getMarketplaceProducts.mockResolvedValue({ success: true, data: products })
    productService.getProductStats.mockResolvedValue({ success: true, data: { total: products.length } })

    render(<ProductMarketplaceTable />)

    // Esperar a que cargue y muestre el primer producto en la página 1
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument())

    // Debería mostrar "Página 1 de 2"
    await waitFor(() => expect(screen.getByText(/Página\s+1\s+de\s+2/)).toBeInTheDocument())

    // Botones de página 1 y 2 deben existir y ser distintos
    const btn1 = screen.getByRole('button', { name: '1' })
    const btn2 = screen.getByRole('button', { name: '2' })
    expect(btn1).toBeInTheDocument()
    expect(btn2).toBeInTheDocument()
    expect(btn1).not.toEqual(btn2)

    // Navegar a página 2
    fireEvent.click(btn2)

    // Ahora debe decir Página 2 de 2 y mostrar un producto de la página 2 (e.g., Product 101)
    await waitFor(() => expect(screen.getByText(/Página\s+2\s+de\s+2/)).toBeInTheDocument())
    expect(screen.getByText('Product 101')).toBeInTheDocument()
  })
})
