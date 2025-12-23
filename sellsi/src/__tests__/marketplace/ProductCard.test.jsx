import React from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from '../../shared/components/display/product-card/ProductCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

// Provide a shared mock navigate so tests can assert calls
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock the cart module to prevent importing real AddToCart/AddToCartModal (avoids import.meta and heavy deps)
// Strict mock: does NOT stopPropagation (we want ProductCard to handle prevention)
jest.mock('../../shared/components/cart', () => ({
  AddToCart: ({ onModalStateChange, children }) => (
    <button data-testid="add-to-cart" data-no-card-click="true" onClick={() => onModalStateChange && onModalStateChange(true)}>
      {children || 'AGREGAR'}
    </button>
  ),
}))

// Mock ActionMenu used in supplier context so we can assert action callbacks synchronously
jest.mock('../../shared/components/display/product-card/ActionMenu', () => ({
  __esModule: true,
  default: ({ actions = [] }) => (
    <div data-testid="mock-action-menu">
      {actions.map(a => (
        <button key={a.label} data-testid={`action-${a.label}`} onClick={() => a.onClick && a.onClick()} disabled={a.disabled}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}))

const createWrapper = () => {
  const qc = new QueryClient()
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProductCard', () => {
  let user

  beforeEach(() => {
    mockNavigate.mockReset()
    jest.clearAllMocks()
    user = userEvent.setup()
  })

  it('renders buyer card and calls registerProductNode on mount with the DOM node', () => {
    const register = jest.fn()
    const product = { id: 'p1', nombre: 'Test', imagen: null }
    const { container } = render(<ProductCard product={product} type="buyer" registerProductNode={register} />, { wrapper: createWrapper() })
    expect(container).toBeTruthy()
    // mount effect should call registerProductNode with an HTMLElement
    expect(register).toHaveBeenCalledWith('p1', expect.any(HTMLElement))
  })

  it('swallows errors from registerProductNode and does not throw on mount', () => {
    const badRegister = jest.fn(() => { throw new Error('boom') })
    const product = { id: 'px', nombre: 'Bad', imagen: null }
    expect(() => render(<ProductCard product={product} type="buyer" registerProductNode={badRegister} />, { wrapper: createWrapper() })).not.toThrow()
  })

  it('navigates to product page when card is clicked and modal is closed', async () => {
    const product = { id: 'p2', nombre: 'Test2', imagen: null }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const cardText = screen.getByText('Test2')
    await user.click(cardText)
    // generateProductUrl uses product.nombre to form path; assert id presence and correct base
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockNavigate.mock.calls[0][0]).toEqual(expect.stringContaining(`/marketplace/product/${product.id}`))
    // also ensure navigate was called with state object
    expect(mockNavigate.mock.calls[0][1]).toEqual(expect.objectContaining({ state: expect.any(Object) }))
  })

  it('does not navigate when AddToCart modal opens and then card is clicked', async () => {
    const product = { id: 'p3', nombre: 'Test3', imagen: null }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    // click the AddToCart button which we've mocked to call onModalStateChange(true)
    const addBtn = screen.getByTestId('add-to-cart')
    await user.click(addBtn)
    // now click card; navigation should not happen since modal is open
    const cardText = screen.getByText('Test3')
    await user.click(cardText)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clicking internal interactive elements does not trigger navigation', async () => {
    const user = userEvent.setup()
    const product = { id: 'p4', nombre: 'Test4', imagen: null }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const addBtn = screen.getByTestId('add-to-cart')
    await user.click(addBtn)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('provider type does not attach click handler (no navigation)', async () => {
    const product = { id: 'p5', nombre: 'Provider', imagen: null }
    render(<ProductCard product={product} type="provider" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    // Provider cards render an image avatar; clicking the image should NOT navigate (card has no click handler)
    const img = screen.getByRole('img')
    await user.click(img)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders image with alt text when imagen is present', () => {
    const product = { id: 'p6', nombre: 'HasImage', imagen: 'http://img' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    // ProductCardImage uses nombre as alt
    const img = screen.getByAltText('HasImage')
    expect(img).toBeInTheDocument()
  })

  it('returns null when no product is provided', () => {
    const { container } = render(<ProductCard product={null} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    expect(container.firstChild).toBeNull()
  })

  it('shows loading price state for buyer context', () => {
    const productL = { id: 'pl', nombre: 'LoadPrice', imagen: null, tiersStatus: 'loading' }
    render(<ProductCard product={productL} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    expect(screen.getAllByText(/Cargando precios/i).length).toBeGreaterThanOrEqual(1)
    cleanup()
  })

  it('shows error price state for buyer context', () => {
    // Provide a base price so isPending is false and errorTiers branch is reached
    const productE = { id: 'pe', nombre: 'ErrPrice', imagen: null, tiersStatus: 'error', precio: 1000 }
    render(<ProductCard product={productE} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    expect(screen.getAllByText(/Error al cargar precios/i).length).toBeGreaterThanOrEqual(1)
    cleanup()
  })

  it('renders price range when priceTiers are provided', () => {
    const product = { id: 'pt', nombre: 'Tiers', imagen: null, priceTiers: [{ price: 1000 }, { price: 2500 }] }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const matches = screen.getAllByText(/\$1\.000/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\$2\.500/).length).toBeGreaterThanOrEqual(1)
  })

  it('supplier action menu triggers edit/delete callbacks and respects disabled state', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const onViewStats = jest.fn()
    const product = { id: 's1', nombre: 'SupplierProduct', precio: 1000, stock: 100 }
    const { unmount } = render(
      <ProductCard product={product} type="supplier" registerProductNode={() => {}} onEdit={onEdit} onDelete={onDelete} onViewStats={onViewStats} />,
      { wrapper: createWrapper() }
    )

    // Action menu mock renders buttons for each action
    const editBtn = await screen.findByTestId('action-Editar producto')
    const deleteBtn = await screen.findByTestId('action-Eliminar producto')
    await userEvent.click(editBtn)
    await userEvent.click(deleteBtn)
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))

    // Cleanup first render, then render with deleting flag to disable delete
    unmount()

    const onDelete2 = jest.fn()
    render(
      <ProductCard product={{ ...product }} type="supplier" registerProductNode={() => {}} onEdit={onEdit} onDelete={onDelete2} isDeleting={true} />,
      { wrapper: createWrapper() }
    )
    const delBtnDisabled = await screen.findByTestId('action-Eliminar producto')
    expect(delBtnDisabled).toBeDisabled()
    await userEvent.click(delBtnDisabled)
    expect(onDelete2).not.toHaveBeenCalled()
  })

  it('provider card "VER CATÁLOGO" button navigates to provider catalog', async () => {
    const product = { supplier_id: 'prov1', user_nm: 'Mi Proveedor' }
    render(<ProductCard product={product} type="provider" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const btn = screen.getByRole('button', { name: /ver catálogo|catálogo/i })
    await userEvent.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining(`/catalog/mi-proveedor/${product.supplier_id}`), expect.any(Object))
  })

  it('registerProductNode is called once on mount and not called with null on unmount', () => {
    const register = jest.fn()
    const product = { id: 'ru1', nombre: 'RegisterMe', imagen: null }
    const { unmount } = render(<ProductCard product={product} type="buyer" registerProductNode={register} />, { wrapper: createWrapper() })
    expect(register).toHaveBeenCalledTimes(1)
    unmount()
    // no additional calls on unmount (cleanup is noop for now)
    expect(register).toHaveBeenCalledTimes(1)
  })

  it('pressing Enter on card does not trigger navigation (no keyboard handler implemented)', async () => {
    const product = { id: 'ke1', nombre: 'KeyEvent', imagen: null }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const el = screen.getByText('KeyEvent')
    el.focus()
    await user.keyboard('{Enter}')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('generates slugified product url when name has accents and special chars', async () => {
    const product = { id: 'p7', nombre: 'Ñandú café' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const el = screen.getByText('Ñandú café')
    await user.click(el)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockNavigate.mock.calls[0][0]).toEqual(expect.stringContaining(`/marketplace/product/${product.id}/nandu-cafe`))
  })

  it('space key does not trigger navigation', async () => {
    const product = { id: 'ksp1', nombre: 'SpaceKey' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const el = screen.getByText('SpaceKey')
    el.focus()
    await user.keyboard(' ')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('internal AddToCart button with data-no-card-click prevents navigation (strict mock)', async () => {
    // Our AddToCart mock now renders a button with data-no-card-click but does NOT call stopPropagation.
    const product = { id: 'dnc1', nombre: 'DataNoClick' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const addBtn = screen.getByTestId('add-to-cart')
    await user.click(addBtn)
    // ProductCard should detect data-no-card-click and avoid navigation even though the child didn't stop propagation
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // Removed fragile test that depends on internal CSS class (.MuiIconButton-root). Use accessible attributes or data-testid
  // to assert prevention of navigation instead.

  it('supplier shows processing backdrop when isProcessing=true', () => {
    const product = { id: 'proc1', nombre: 'Processing', precio: 100, stock: 12 }
    render(<ProductCard product={product} type="supplier" registerProductNode={() => {}} isProcessing={true} />, { wrapper: createWrapper() })
    expect(screen.getByText(/Procesando producto/i)).toBeInTheDocument()
  })

  it('provider avatar uses logo_url fallback and alt equals provider name', () => {
    const logo = 'http://logo.test/img.png'
    const product = { supplier_id: 'prov2', user_nm: 'Proveedor X', logo_url: logo }
    render(<ProductCard product={product} type="provider" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const img = screen.getByAltText(/Proveedor X/i)
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('img.png')
  })

  it('generates url even if nombre missing (uses id only)', async () => {
    const product = { id: 'noName1' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const img = screen.getByRole('img')
    await user.click(img)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockNavigate.mock.calls[0][0]).toEqual(expect.stringContaining(`/marketplace/product/${product.id}`))
  })

  it('works with UUID product id in URL', async () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    const product = { id: uuid, nombre: 'UUIDProd' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const el = screen.getByText('UUIDProd')
    await user.click(el)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockNavigate.mock.calls[0][0]).toEqual(expect.stringContaining(uuid))
  })

  it('sets from state based on current pathname (buyer)', async () => {
    const product = { id: 'from1', nombre: 'FromBuyer' }
    const originalPath = window.location.pathname
    window.history.pushState({}, '', '/buyer/marketplace')
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    const el = screen.getByText('FromBuyer')
    await user.click(el)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockNavigate.mock.calls[0][1]).toEqual(expect.objectContaining({ state: { from: '/buyer/marketplace' } }))
    window.history.pushState({}, '', originalPath)
  })

  it('price display shows original price and discounted price when provided', () => {
    const product = { id: 'disc1', nombre: 'Discounted', precio: 800, precioOriginal: 1000 }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} />, { wrapper: createWrapper() })
    expect(screen.getAllByText(/\$800/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\$1\.000/).length).toBeGreaterThanOrEqual(1)
  })

  it('imagePriority=true sets fetchpriority high on img', () => {
    const product = { id: 'ip1', nombre: 'PriorityImg', imagen: 'http://img' }
    render(<ProductCard product={product} type="buyer" registerProductNode={() => {}} imagePriority={true} />, { wrapper: createWrapper() })
    const img = screen.getByAltText('PriorityImg')
    // DOM attribute is lowercase 'fetchpriority'
    expect(img.getAttribute('fetchpriority')).toBe('high')
  })
})

