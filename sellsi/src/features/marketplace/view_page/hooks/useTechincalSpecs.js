import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { PRODUCTOS } from '../../products'

/**
 * Custom hook para manejar la lógica de negocio del componente TechnicalSpecs
 * Incluye: parsing de URL, búsqueda de producto, navegación inteligente según contexto
 *
 * NAVEGACIÓN INTELIGENTE:
 * - Detecta si viene de Marketplace o MarketplaceBuyer
 * - Mantiene el contexto de navegación durante la sesión
 * - Navega de vuelta al origen correcto
 */
export const useTechnicalSpecs = () => {
  const { productSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============================================================================
  // LÓGICA DE NAVEGACIÓN INTELIGENTE
  // ============================================================================
  /**
   * Determina la ruta de origen del usuario
   * Prioridades: 1) URL state, 2) localStorage, 3) document.referrer, 4) default
   */
  const getOriginRoute = () => {
    // 1. Verificar si viene del state de navegación (más confiable)
    if (location.state?.from) {
      console.log('🔍 Origen detectado desde state:', location.state.from)
      return location.state.from
    }

    // 2. Verificar localStorage como respaldo
    const storedOrigin = localStorage.getItem('marketplace_origin')
    if (storedOrigin) {
      console.log('🔍 Origen detectado desde localStorage:', storedOrigin)
      return storedOrigin
    }

    // 3. Determinar por document.referrer (URL anterior)
    const referrer = document.referrer
    if (referrer) {
      // Extraer la ruta del referrer
      try {
        const referrerUrl = new URL(referrer)
        const referrerPath = referrerUrl.pathname

        // Si viene de /marketplace (Marketplace general)
        if (referrerPath === '/marketplace') {
          console.log('🔍 Origen detectado desde referrer:', '/marketplace')
          return '/marketplace'
        }

        // Si viene de /buyer/marketplace (MarketplaceBuyer)
        if (referrerPath === '/buyer/marketplace') {
          console.log(
            '🔍 Origen detectado desde referrer:',
            '/buyer/marketplace'
          )
          return '/buyer/marketplace'
        }
      } catch (error) {
        console.warn('Error parsing referrer URL:', error)
      }
    }

    // 4. Verificar URL actual como último recurso
    const currentPath = window.location.pathname
    if (currentPath.includes('/buyer/')) {
      console.log('🔍 Origen detectado desde URL actual:', '/buyer/marketplace')
      return '/buyer/marketplace'
    }

    // 5. Default: Marketplace general (cambio aquí)
    console.log('🔍 Usando origen por defecto:', '/marketplace')
    return '/marketplace'
  }

  /**
   * Guarda el origen en localStorage para persistencia
   */
  const saveOriginRoute = (route) => {
    localStorage.setItem('marketplace_origin', route)
  }
  // Determinar ruta de origen
  const originRoute = getOriginRoute()

  useEffect(() => {
    // Guardar el origen para futura referencia
    saveOriginRoute(originRoute)

    // Si viene del state, también guardarlo inmediatamente en localStorage
    if (location.state?.from) {
      localStorage.setItem('marketplace_origin', location.state.from)
    }

    // Extraer el ID del producto del slug
    // El slug tiene formato: nombredelproducto-ID
    if (productSlug) {
      const slugParts = productSlug.split('-')
      const productId = slugParts[slugParts.length - 1]

      // Buscar el producto por ID
      const foundProduct = PRODUCTOS.find((p) => p.id.toString() === productId)

      if (foundProduct) {
        setProduct(foundProduct)
      } else {
        // Si no se encuentra el producto, redirigir al origen
        navigate(originRoute, { replace: true })
      }
    }
    setLoading(false)
  }, [productSlug, navigate, originRoute, location.state])

  // ============================================================================
  // HANDLERS DE NAVEGACIÓN
  // ============================================================================

  /**
   * Navega de vuelta al marketplace de origen
   */
  const handleClose = () => {
    navigate(originRoute)
  }

  /**
   * Navega a la página de inicio
   */
  const handleGoHome = () => {
    navigate('/')
  }

  /**
   * Navega al marketplace (inteligente según contexto)
   */
  const handleGoToMarketplace = () => {
    navigate(originRoute)
  }

  const handleAddToCart = (product) => {
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')
    const isLoggedIn = !!(supplierid || sellerid)

    if (!isLoggedIn) {
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }

    // TODO: Implementar lógica de agregar al carrito
    console.log('Agregando al carrito:', product)
  }

  const handleBuyNow = (product) => {
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')
    const isLoggedIn = !!(supplierid || sellerid)

    if (!isLoggedIn) {
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }

    // TODO: Implementar lógica de comprar ahora
    console.log('Comprando ahora:', product)
  }
  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================

  return {
    // Estado del producto
    product,
    loading,

    // Información de navegación
    originRoute,
    isFromBuyer: originRoute.includes('/buyer/'),
    isFromMarketplace: originRoute === '/marketplace',

    // Handlers de navegación
    handleClose,
    handleGoHome,
    handleGoToMarketplace,
    handleAddToCart,
    handleBuyNow,
  }
}
