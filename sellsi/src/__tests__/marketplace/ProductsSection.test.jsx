import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// Gold-standard semantic mock of ProductsSectionView
jest.mock('../../workspaces/marketplace/components/sections/ProductsSection/ProductsSectionView', () => {
  return function MockProductsView({ ui, data, components }) {
    return (
      <div data-testid="products-section-view">
        <header>{ui.sectionTitle}</header>

        {data.loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {(data.renderItems || []).map(item => (
              <li key={item.id}>{item.titulo || item.id}</li>
            ))}
          </ul>
        )}

        <div data-testid="conditionals">
          {components?.NoProductsInRegionBanner}
          {(!data.renderItems || data.renderItems.length === 0) && components?.Empty}
        </div>

        <footer>{data.PaginationComponent}</footer>
      </div>
    )
  }
})

// Mock hooks that determine derived items and progressive pagination
jest.mock('../../workspaces/marketplace/components/sections/ProductsSection/ProductsSectionView')

jest.mock('../../shared/hooks/useProductsDerivation', () => ({
  useProductsDerivation: jest.fn(() => ({ items: [], providersCount: 0 }))
}))

jest.mock('../../shared/hooks/useProgressiveProducts', () => ({
  useProgressiveProducts: jest.fn(() => ({
    page: 1,
    totalPages: 1,
    pageItems: [],
    renderItems: [],
    changePage: jest.fn(),
    loadMore: jest.fn(),
    canLoadMore: false,
    isLoadingMore: false,
    paginationMeta: {}
  }))
}))

// Silence side-effecting services
jest.mock('../../services/phase1ETAGThumbnailService.js', () => ({
  getOrFetchManyMainThumbnails: jest.fn()
}))

import ProductsSection from '../../workspaces/marketplace/components/sections/ProductsSection'

const { useProductsDerivation } = require('../../shared/hooks/useProductsDerivation')
const { useProgressiveProducts } = require('../../shared/hooks/useProgressiveProducts')

describe('ProductsSection', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('renders the section view with expected props and respects memoized ui shape', () => {
    const props = {
      seccionActiva: 'nuevos',
      setSeccionActiva: () => {},
      totalProductos: 0,
      productosOrdenados: [],
      resetFiltros: () => {},
      titleMarginLeft: 0,
      loading: false,
      error: null,
      isProviderView: false,
      getPriceTiers: () => {},
      registerProductNode: () => {},
    }

    const products = [ { id: '1', titulo: 'Producto A' }, { id: '2', titulo: 'Producto B' } ]
    useProgressiveProducts.mockReturnValue({ renderItems: products, page: 1, totalPages: 1, paginationMeta: { startIndex: 0, endIndex: products.length - 1, PRODUCTS_PER_PAGE: 8 } })

    render(<ProductsSection {...props} />)

    // User-centric assertions
    expect(screen.getByText('Producto A')).toBeInTheDocument()
    expect(screen.getByText('Producto B')).toBeInTheDocument()
    expect(screen.getByText(/Nuevos/i)).toBeInTheDocument()
  })

  it('passes only recent products to view when seccionActiva is "nuevos"', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const recent = new Date(now - (oneDayMs * 1)).toISOString();
    const old = new Date(now - (oneDayMs * 10)).toISOString();

    const productos = [
      { id: 'a', createdAt: recent, titulo: 'Recent Product' },
      { id: 'b', createdAt: old, titulo: 'Old Product' }
    ];

    // stub hooks to return derived items and progressive renderItems
    useProductsDerivation.mockReturnValue({ items: productos, providersCount: 0 })
    useProgressiveProducts.mockReturnValue({
      page: 1,
      totalPages: 1,
      pageItems: productos,
      renderItems: productos.filter(p => p.id === 'a'),
      changePage: jest.fn(),
      loadMore: jest.fn(),
      canLoadMore: false,
      isLoadingMore: false,
      paginationMeta: { startIndex: 0, endIndex: 0, PRODUCTS_PER_PAGE: 8 }
    })

    const props = {
      seccionActiva: 'nuevos',
      setSeccionActiva: () => {},
      totalProductos: productos.length,
      productosOrdenados: productos,
      resetFiltros: () => {},
      titleMarginLeft: 0,
      loading: false,
      error: null,
      isProviderView: false,
      getPriceTiers: () => {},
      registerProductNode: () => {},
    };

    render(<ProductsSection {...props} />)

    // UI-level assertions
    expect(screen.getByText('Recent Product')).toBeInTheDocument()
    expect(screen.queryByText('Old Product')).toBeNull()
    expect(screen.getByText(/Nuevos/i)).toBeInTheDocument()

    // verify components flags via rendered DOM
    expect(screen.queryByTestId('banner')).toBeNull()
    expect(screen.queryByTestId('empty')).toBeNull()

    // cleanup mock to avoid affecting other tests
    useProductsDerivation.mockReturnValue({ items: [], providersCount: 0 })
    useProgressiveProducts.mockReturnValue({
      page: 1,
      totalPages: 1,
      pageItems: [],
      renderItems: [],
      changePage: jest.fn(),
      loadMore: jest.fn(),
      canLoadMore: false,
      isLoadingMore: false,
      paginationMeta: {}
    })
    // Provider and Region title tests
    cleanup()
    render(<ProductsSection {...{ ...props, isProviderView: true }} />)
    const headerNode = screen.getByTestId('products-section-view').querySelector('header')
    expect(headerNode).toBeTruthy()
    expect(headerNode.textContent).toMatch(/Proveedores/i)

    cleanup()
    render(<ProductsSection {...{ ...props, isProviderView: false, filtros: { shippingRegions: 'antofagasta' } }} />)
    expect(screen.getByText(/II Región/i)).toBeInTheDocument()

    // verify PaginationComponent when totalPages > 1 and simulate interaction
    const changeMock = jest.fn()
    // create fake PaginationComponent that renders a button labeled 'Ir a pagina 2'
    const FakePagination = (<div><button onClick={() => changeMock(2)}>Ir a pagina 2</button><button>2</button></div>)
    useProgressiveProducts.mockReturnValue({
      page: 1,
      totalPages: 3,
      pageItems: productos,
      renderItems: productos,
      changePage: changeMock,
      loadMore: jest.fn(),
      canLoadMore: false,
      isLoadingMore: false,
      paginationMeta: {},
      PaginationComponent: FakePagination
    })

    // cleanup previous render to avoid duplicate nodes
    cleanup()
    render(<ProductsSection {...props} />)

    // Pagination component is rendered; click the page '2' button (accessible name is '2')
    const btn2 = screen.getByLabelText(/Ir a p.*ina 2/i)
    expect(btn2).toBeTruthy()
    fireEvent.click(btn2)
    expect(changeMock).toHaveBeenCalledWith(2)

    // ensure resetFiltros is wired to Empty component's button
    const resetMock = jest.fn()
    useProgressiveProducts.mockReturnValue({
      page: 1,
      totalPages: 1,
      pageItems: [],
      renderItems: [],
      changePage: jest.fn(),
      loadMore: jest.fn(),
      canLoadMore: false,
      isLoadingMore: false,
      paginationMeta: {}
    })

    const propsWithReset = { ...props, resetFiltros: resetMock }
    cleanup()
    render(<ProductsSection {...propsWithReset} />)

    // Empty component should be rendered into DOM and contain a button with 'Limpiar' text
    const resetBtn = screen.getByRole('button', { name: /limpiar/i })
    expect(resetBtn).toBeInTheDocument()
    fireEvent.click(resetBtn)
    expect(resetMock).toHaveBeenCalled()

    // Banner test: when region banner is enabled and userRegion set
    cleanup()
    const propsBanner = { ...props, showNoProductsInRegionBanner: true, userRegion: 'antofagasta' }
    useProgressiveProducts.mockReturnValue({ renderItems: [], page: 1, totalPages: 1, paginationMeta: { startIndex: 0, endIndex: 0, PRODUCTS_PER_PAGE: 8 } })
    render(<ProductsSection {...propsBanner} />)
    expect(screen.getByText(/No hay productos disponibles para despacho/i)).toBeInTheDocument()
    expect(screen.getByText(/II Región/i)).toBeInTheDocument()
  } )
})
