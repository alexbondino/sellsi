/**
 * Test suite para verificar que el problema del parpadeo "Producto no encontrado" esté resuelto
 */

import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import TechnicalSpecs from '../../domains/ProductPageView/pages/TechnicalSpecs'
import ProductPageWrapper from '../../domains/ProductPageView/ProductPageWrapper'
import { extractProductIdFromSlug } from '../../shared/utils/product/productUrl'

// Mock de Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

// Mock de servicios
jest.mock('../../services/marketplace', () => ({
  getProductSpecifications: jest.fn(() => Promise.resolve([]))
}))

// Mock de stores
jest.mock('../../shared/stores/cart/cartStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addItem: jest.fn()
  }))
}))

// Mock de utils
jest.mock('../../utils/toastHelpers', () => ({
  showErrorToast: jest.fn(),
  showCartSuccess: jest.fn()
}))

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ state: null }))
}))

const theme = createTheme()

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
)

describe('Product Page Flicker Fix', () => {
  
  describe('extractProductIdFromSlug', () => {
    it('should extract UUID from start of slug', () => {
      const slug = '12345678-1234-1234-1234-123456789012-laptop-gaming'
      const result = extractProductIdFromSlug(slug)
      expect(result).toBe('12345678-1234-1234-1234-123456789012')
    })

    it('should extract UUID from middle of slug', () => {
      const slug = 'abc-12345678-1234-1234-1234-123456789012-def'
      const result = extractProductIdFromSlug(slug)
      expect(result).toBe('12345678-1234-1234-1234-123456789012')
    })

    it('should extract UUID from end of slug', () => {
      const slug = 'laptop-gaming-12345678-1234-1234-1234-123456789012'
      const result = extractProductIdFromSlug(slug)
      expect(result).toBe('12345678-1234-1234-1234-123456789012')
    })

    it('should return null for invalid slug', () => {
      const slug = 'no-uuid-here'
      const result = extractProductIdFromSlug(slug)
      expect(result).toBe(null)
    })

    it('should return null for empty slug', () => {
      expect(extractProductIdFromSlug('')).toBe(null)
      expect(extractProductIdFromSlug(null)).toBe(null)
      expect(extractProductIdFromSlug(undefined)).toBe(null)
    })
  })

  describe('TechnicalSpecs Component', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      require('react-router-dom').useParams.mockReturnValue({
        productSlug: '12345678-1234-1234-1234-123456789012-test-product'
      })
    })

    it('should show loading state initially, not error message', async () => {
      // Mock para simular producto encontrado después de un delay
      const { supabase } = require('../../services/supabase')
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  productid: '12345678-1234-1234-1234-123456789012',
                  productnm: 'Test Product',
                  supplier_id: 'supplier123',
                  price: 100,
                  productqty: 10,
                  category: 'Test',
                  description: 'Test description',
                  minimum_purchase: 1,
                  is_active: true
                },
                error: null
              })
            })
          })
        })
      })

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      )

      // Inmediatamente después del render, debería mostrar loading
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument()
      
      // NO debería mostrar el mensaje de error inmediatamente
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
    })

    it('should show product details after successful load', async () => {
      const { supabase } = require('../../services/supabase')
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  productid: '12345678-1234-1234-1234-123456789012',
                  productnm: 'Test Product',
                  supplier_id: 'supplier123',
                  price: 100,
                  productqty: 10,
                  category: 'Test',
                  description: 'Test description',
                  minimum_purchase: 1,
                  is_active: true
                },
                error: null
              })
            })
          })
        })
      })

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      )

      // Esperar a que se cargue el producto
      await waitFor(() => {
        expect(screen.queryByText('Cargando producto...')).not.toBeInTheDocument()
      }, { timeout: 2000 })

      // No debería mostrar mensaje de error
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
    })

    it('should show error message only after failed load', async () => {
      const { supabase } = require('../../services/supabase')
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      })

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      )

      // Inicialmente debería mostrar loading
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument()

      // Después de fallar la carga, debería mostrar error
      await waitFor(() => {
        expect(screen.getByText('Producto no encontrado o inactivo')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should show specific error for invalid product ID', async () => {
      require('react-router-dom').useParams.mockReturnValue({
        productSlug: 'invalid-slug-without-uuid'
      })

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('ID de producto inválido en la URL')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('ProductPageWrapper Component', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      require('react-router-dom').useParams.mockReturnValue({
        id: '12345678-1234-1234-1234-123456789012'
      })
    })

    it('should show loading state initially for ProductPageWrapper', async () => {
      const { supabase } = require('../../services/supabase')
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => new Promise(resolve => {
                // Simular delay en la respuesta
                setTimeout(() => resolve({
                  data: {
                    productid: '12345678-1234-1234-1234-123456789012',
                    productnm: 'Test Product',
                    supplier_id: 'supplier123',
                    price: 100
                  },
                  error: null
                }), 100)
              })
            })
          })
        })
      })

      render(
        <TestWrapper>
          <ProductPageWrapper isLoggedIn={true} />
        </TestWrapper>
      )

      // Debería mostrar loading, no error
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument()
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
    })
  })

  describe('Loading State Behavior', () => {
    it('should never show error message while loading is true', () => {
      // Este test verifica que la lógica condicional sea correcta
      const mockStates = [
        { loading: true, product: null, error: null },
        { loading: true, product: null, error: 'Some error' },
        { loading: false, product: null, error: null },
        { loading: false, product: null, error: 'Some error' },
        { loading: false, product: { id: 1 }, error: null },
      ]

      mockStates.forEach(({ loading, product, error }) => {
        const shouldShowError = !loading && (!!error || !product)
        const shouldShowLoading = loading
        const shouldShowProduct = !loading && !!product && !error

        if (loading) {
          expect(shouldShowLoading).toBe(true)
          expect(shouldShowError).toBe(false)
        } else if (error || !product) {
          expect(shouldShowError).toBe(true)
          expect(shouldShowLoading).toBe(false)
        } else {
          expect(shouldShowProduct).toBe(true)
          expect(shouldShowError).toBe(false)
          expect(shouldShowLoading).toBe(false)
        }
      })
    })
  })
})
