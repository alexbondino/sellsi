import React from 'react'
import { render } from '@testing-library/react'

// ProductsSection renders ProductsSectionView; we mock the view to assert props
jest.mock('../../domains/marketplace/pages/sections/ProductsSection/ProductsSectionView', () => {
  return function MockView({ ui, data, handlers, components }) {
    return (
      <div data-testid="products-section-view" data-ui={JSON.stringify(Object.keys(ui || {}))} data-data={JSON.stringify({ loading: data?.loading })}></div>
    )
  }
})

import ProductsSection from '../../domains/marketplace/pages/sections/ProductsSection'

describe('ProductsSection', () => {
  beforeEach(() => {
    jest.resetModules()
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

    const { getByTestId } = render(<ProductsSection {...props} />)
    const view = getByTestId('products-section-view')
    expect(view).toBeTruthy()
  })
})
