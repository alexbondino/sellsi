import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { PRODUCTOS } from '../../products'
import { createClient } from '@supabase/supabase-js'
import { extractProductIdFromSlug } from '../../marketplace/productUrl'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    let isMounted = true
    // Guardar el origen para futura referencia
    saveOriginRoute(originRoute)

    if (location.state?.from) {
      localStorage.setItem('marketplace_origin', location.state.from)
    }

    // Extraer el ID del producto del slug
    const fetchProduct = async () => {
      if (productSlug) {
        const productId = extractProductIdFromSlug(productSlug)
        // Buscar el producto por ID en los mocks
        let foundProduct = PRODUCTOS.find((p) => p.id.toString() === productId)
        if (foundProduct) {
          if (isMounted) setProduct(foundProduct)
          if (isMounted) setLoading(false)
        } else {
          // Buscar en Supabase (producto, priceTiers, imágenes, especificaciones)
          const [
            { data: product, error: prodError },
            { data: tiers },
            { data: images },
            { data: specs },
          ] = await Promise.all([
            supabase
              .from('products')
              .select('*')
              .eq('productid', productId)
              .eq('is_active', true)
              .single(),
            supabase
              .from('product_price_tiers')
              .select('*')
              .eq('product_id', productId),
            supabase
              .from('product_images')
              .select('*')
              .eq('product_id', productId),
            supabase
              .from('product_specifications')
              .select('*')
              .eq('product_id', productId),
          ])
          if (product) {
            // Obtener nombre del proveedor
            let proveedorNombre = product.supplier_id
            const { data: userData } = await supabase
              .from('users')
              .select('user_nm')
              .eq('user_id', product.supplier_id)
              .single()
            if (userData && userData.user_nm) {
              proveedorNombre = userData.user_nm
            }
            foundProduct = {
              id: product.productid,
              nombre: product.productnm,
              proveedor: proveedorNombre,
              imagen: product.image_url,
              precio: product.price,
              precioOriginal: product.precioOriginal || null,
              descuento: product.descuento || 0,
              categoria: product.category,
              tipo: product.product_type || 'nuevo',
              tipoVenta: product.tipoVenta || 'directa',
              rating: product.rating || 0,
              ventas: product.ventas || 0,
              stock: product.productqty,
              compraMinima: product.minimum_purchase,
              negociable: product.negociable,
              descripcion: product.description,
              priceTiers: tiers || [],
              imagenes: images || [],
              specifications: specs || [],
              is_active: product.is_active,
            }
            if (isMounted) setProduct(foundProduct)
            if (isMounted) setLoading(false)
            console.log('🟢 Producto encontrado en Supabase:', foundProduct)
          } else {
            if (isMounted) setProduct(null)
            if (isMounted) setLoading(false)
            console.warn(
              '🔴 Producto NO encontrado en Supabase:',
              productId,
              prodError
            )
            setTimeout(() => {
              if (isMounted) navigate(originRoute, { replace: true })
            }, 1200)
          }
        }
      } else {
        if (isMounted) setLoading(false)
      }
    }
    fetchProduct()
    return () => {
      isMounted = false
    }
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
