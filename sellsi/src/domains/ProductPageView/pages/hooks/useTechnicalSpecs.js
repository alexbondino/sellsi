import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../../../services/supabase'
import { getProductSpecifications } from '../../../../services/marketplace'
import { extractProductIdFromSlug } from '../../../../shared/utils/product/productUrl'
import useCartStore from '../../../../shared/stores/cart/cartStore'
import { formatProductForCart } from '../../../../utils/priceCalculation'
import { showErrorToast } from '../../../../utils/toastHelpers'

// Definir PRODUCTOS mock si no existe import
const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Producto de ejemplo',
    descripcion: 'Descripción de ejemplo',
    precio: 10000,
    // Agrega los campos necesarios según el uso real
  },
  // Puedes agregar más productos mock aquí
]

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
  const [error, setError] = useState(null) // 🆕 Agregar estado de error
  // 🔍 DETECTAR ORIGEN: Agregar detección de fromMyProducts
  const fromMyProducts = location.state?.from === '/supplier/myproducts'
  // Log de sesión/localStorage relevante
  const userId = localStorage.getItem('user_id')
  const accountType = localStorage.getItem('account_type')
  const supplierid = localStorage.getItem('supplierid')
  const sellerid = localStorage.getItem('sellerid')
  const isLoggedIn = !!(userId || supplierid || sellerid)
  // Debug log removed

  // Hook del carrito
  const addItem = useCartStore((state) => state.addItem)

  // ============================================================================
  // LÓGICA DE NAVEGACIÓN INTELIGENTE
  // ============================================================================
  /**
   * Determina la ruta de origen del usuario
   * Prioridades: 1) URL state, 2) localStorage, 3) document.referrer, 4) default
   */ const getOriginRoute = () => {
    // 1. Verificar si viene del state de navegación (más confiable)
    if (location.state?.from) {
      return location.state.from
    }

    // 2. Verificar localStorage como respaldo
    const storedOrigin = localStorage.getItem('marketplace_origin')
    if (storedOrigin) {
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
          return '/marketplace'
        }

        // Si viene de /buyer/marketplace (MarketplaceBuyer)
        if (referrerPath === '/buyer/marketplace') {
          return '/buyer/marketplace'
        }
      } catch (error) {
        // Debug log removed
      }
    }

    // 4. Verificar URL actual como último recurso
    const currentPath = window.location.pathname
    if (currentPath.includes('/buyer/')) {
      return '/buyer/marketplace'
    }

    // 5. Default: Marketplace general (cambio aquí)
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
  // Debug log removed

  useEffect(() => {
    let isMounted = true
    // Guardar el origen para futura referencia
    saveOriginRoute(originRoute)

    if (location.state?.from) {
      localStorage.setItem('marketplace_origin', location.state.from)
    }

    // Extraer el ID del producto del slug
    const fetchProduct = async () => {
      // 🆕 Resetear estados al inicio
      if (isMounted) {
        setError(null)
        setProduct(null)
        setLoading(true)
      }

      if (!productSlug) {
        if (isMounted) {
          setError('No se proporcionó un slug de producto')
          setLoading(false)
        }
        return
      }

      const productId = extractProductIdFromSlug(productSlug)
      
      if (!productId) {
        if (isMounted) {
          setError('ID de producto inválido en la URL')
          setLoading(false)
        }
        return
      }

      // Buscar el producto por ID en los mocks
      let foundProduct = PRODUCTOS.find((p) => p.id.toString() === productId)
      if (foundProduct) {
        if (isMounted) {
          setProduct(foundProduct)
          setLoading(false)
        }
        return
      }

      // Buscar en Supabase (producto, priceTiers, imágenes, especificaciones)
      try {
        const [
          { data: product, error: prodError },
          { data: tiers },
          { data: images },
          specs,
        ] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('productid', productId)
            .eq('is_active', true)
            .single(),
          supabase
            .from('product_quantity_ranges')
            .select('*')
            .eq('product_id', productId),
          supabase
            .from('product_images')
            .select('*')
            .eq('product_id', productId),
          getProductSpecifications(productId),
        ])

        if (product && !prodError) {
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
          // ✅ Obtener imagen primaria de product_images
          let imagenPrincipal = product.image_url

          if (images && Array.isArray(images) && images.length > 0) {
            const principal = images.find((img) => img.is_primary)
            if (principal) {
              imagenPrincipal = principal.image_url
            } else {
              imagenPrincipal = images[0].image_url
            }
          }

          foundProduct = {
            id: product.productid,
            nombre: product.productnm,
            proveedor: proveedorNombre,
            imagen: imagenPrincipal,
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
          
          if (isMounted) {
            setProduct(foundProduct)
            setLoading(false)
          }
        } else {
          if (isMounted) {
            setError('Producto no encontrado o inactivo')
            setLoading(false)
            // 🆕 Delay opcional antes de navegar de vuelta
            setTimeout(() => {
              if (isMounted) navigate(originRoute, { replace: true })
            }, 1200)
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        if (isMounted) {
          setError('Error al cargar el producto')
          setLoading(false)
        }
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
   */ const handleGoToMarketplace = () => {
    navigate(originRoute)
  }
  const handleAddToCart = (cartProduct) => {
    // Verificar sesión (nueva lógica)
    const userId = localStorage.getItem('user_id')
    const accountType = localStorage.getItem('account_type') // Verificar también las claves antiguas por compatibilidad
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')

    const isLoggedIn = !!(userId || supplierid || sellerid)

    if (!isLoggedIn) {
      showErrorToast('Debes iniciar sesión para agregar productos al carrito', {
        icon: '🔒',
      })
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }

    // Si recibimos un producto ya formateado (con tramos de precios calculados)
    if (cartProduct && cartProduct.cantidadSeleccionada) {
      // Formatear para el cartStore
      const productForCart = {
        id: cartProduct.id,
        name: cartProduct.nombre || cartProduct.name,
        price:
          cartProduct.precioUnitario || cartProduct.precio || cartProduct.price,
        image:
          cartProduct.imagen || cartProduct.image || '/placeholder-product.jpg',
        maxStock: cartProduct.stock || 50,
        supplier:
          cartProduct.proveedor || cartProduct.supplier || cartProduct.provider,
        originalPrice: cartProduct.precioOriginal,
        // Información adicional de tramos
        tierPrice: cartProduct.precioUnitario,
        appliedTier: cartProduct.tramoAplicado,
        totalPrice: cartProduct.precioTotal,
      }

      addItem(productForCart, cartProduct.cantidadSeleccionada)
      // No mostrar toast aquí porque el cartStore ya lo maneja
    } else {
      // Fallback para producto básico (sin tramos calculados)
      const basicProduct = cartProduct || product
      const productForCart = {
        id: basicProduct.id,
        name: basicProduct.nombre || basicProduct.name,
        price: basicProduct.precio || basicProduct.price,
        image:
          basicProduct.imagen ||
          basicProduct.image ||
          '/placeholder-product.jpg',
        maxStock: basicProduct.stock || 50,
        supplier:
          basicProduct.proveedor ||
          basicProduct.supplier ||
          basicProduct.provider,
      }

      addItem(productForCart, 1)
      // No mostrar toast aquí porque el cartStore ya lo maneja
    }
  }
  const handleBuyNow = (cartProduct) => {
    // Verificar sesión (nueva lógica)
    const userId = localStorage.getItem('user_id')
    const accountType = localStorage.getItem('account_type')

    // Verificar también las claves antiguas por compatibilidad
    const supplierid = localStorage.getItem('supplierid')
    const sellerid = localStorage.getItem('sellerid')

    const isLoggedIn = !!(userId || supplierid || sellerid)

    if (!isLoggedIn) {
      showErrorToast('Debes iniciar sesión para comprar productos', {
        icon: '🔒',
      })
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }

    // Primero agregar al carrito    handleAddToCart(cartProduct)

    // TODO: Navegar a checkout o proceso de compra inmediata
  }
  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================
  return {
    // Estado del producto
    product,
    loading,
    error, // 🆕 Agregar estado de error

    // Información de navegación
    originRoute,
    isFromBuyer: originRoute.includes('/buyer/'),
    isFromMarketplace: originRoute === '/marketplace',
    fromMyProducts, // 🔍 Agregar el flag

    // Handlers de navegación
    handleClose,
    handleGoHome,
    handleGoToMarketplace,
    handleAddToCart,
    handleBuyNow,
  }
}
