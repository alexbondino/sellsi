import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../../services/supabase'
import { filterActiveProducts } from '../../../../utils/productActiveStatus'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/**
 * Hook para obtener productos del marketplace, usando mocks o backend según flag.
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Cache de tiers: productId -> array tiers
  const tiersCacheRef = useRef(new Map())
  const pendingFetchRef = useRef(new Set())
  const abortRef = useRef(null)
  const observerRef = useRef(null)
  const mountedRef = useRef(true)

  // --- Fetch inicial (sin tiers) ---
  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    setError(null)

    if (USE_MOCKS) {
      const base = PRODUCTOS.map(p => ({ ...p, priceTiers: p.priceTiers || [], minPrice: p.minPrice ?? p.precio ?? p.price ?? 0, maxPrice: p.maxPrice ?? p.precio ?? p.price ?? 0 }))
      setProducts(filterActiveProducts(base))
      setLoading(false)
      return () => { mountedRef.current = false }
    }

    const controller = new AbortController()
    abortRef.current = controller
    performance.mark?.('products_fetch_start')
    supabase
      .from('products')
      // Sólo columnas existentes + relación product_images
      .select('productid,supplier_id,productnm,price,category,product_type,productqty,minimum_purchase,negotiable,is_active,product_images(image_url,thumbnail_url,thumbnails)')
      .then(async ({ data, error }) => {
        if (controller.signal.aborted || !mountedRef.current) return
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        let usersMap = {}
        if (data && data.length > 0) {
          const supplierIds = [...new Set(data.map(p => p.supplier_id))]
          if (supplierIds.length > 0) {
            const supplierIdsStr = supplierIds.map(id => String(id).trim())
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('user_id, user_nm, logo_url, descripcion_proveedor, verified')
              .in('user_id', supplierIdsStr)
            if (!controller.signal.aborted && !usersError && usersData) {
              usersMap = Object.fromEntries(usersData.map(u => [u.user_id, { name: u.user_nm, logo_url: u.logo_url, descripcion_proveedor: u.descripcion_proveedor, verified: u.verified }]))
            }
          }
        }
        if (!mountedRef.current || controller.signal.aborted) return

        const mapped = (data || []).map(p => {
          const firstImg = p.product_images && p.product_images.length > 0 ? p.product_images[0] : null
            
          const imagenPrincipal = firstImg?.image_url || '/placeholder-product.jpg'
          const thumbnailUrl = firstImg?.thumbnail_url || null
          const thumbnails = firstImg?.thumbnails
            ? (typeof firstImg.thumbnails === 'string' ? safeParseJSON(firstImg.thumbnails) : firstImg.thumbnails)
            : null

          const basePrice = p.price || 0
          return {
            id: p.productid,
            productid: p.productid,
            supplier_id: p.supplier_id,
            nombre: p.productnm,
            proveedor: usersMap[p.supplier_id]?.name || 'Proveedor no encontrado',
            user_nm: usersMap[p.supplier_id]?.name,
            supplier_logo_url: usersMap[p.supplier_id]?.logo_url,
            logo_url: usersMap[p.supplier_id]?.logo_url,
            descripcion_proveedor: usersMap[p.supplier_id]?.descripcion_proveedor,
            verified: usersMap[p.supplier_id]?.verified || false,
            proveedorVerificado: usersMap[p.supplier_id]?.verified || false,
            imagen: imagenPrincipal,
            thumbnails,
            thumbnail_url: thumbnailUrl,
            // Fallback inicial: min/max = price hasta cargar tiers
            precio: basePrice,
            // Alias mantenido; no existe campo precioOriginal real
            precioOriginal: p.price || null,
            descuento: 0, // placeholder (no existe en schema)
            categoria: p.category,
            tipo: p.product_type || 'nuevo',
            tipoVenta: 'directa', // derivado
            rating: 0, // placeholder
            ventas: 0, // placeholder
            stock: p.productqty,
            compraMinima: p.minimum_purchase,
            minimum_purchase: p.minimum_purchase,
            negociable: p.negotiable,
            is_active: p.is_active,
            priceTiers: [], // diferido
            minPrice: basePrice,
            maxPrice: basePrice,
            tiersStatus: 'idle' // idle | loading | loaded | error
          }
        })

        const active = filterActiveProducts(mapped)
        setProducts(active)
        setLoading(false)
        performance.mark?.('products_fetch_end')
        if (performance.measure) {
          try { performance.measure('products_fetch','products_fetch_start','products_fetch_end') } catch {}
        }
      })

    return () => {
      mountedRef.current = false
      controller.abort()
    }
  }, [])

  // Utilidad segura para parsear JSON de thumbnails
  const safeParseJSON = (str) => {
    try { return JSON.parse(str) } catch { return null }
  }

  // --- Fetch diferido de tiers (batch) ---
  const fetchTiersBatch = useCallback(async (productIds) => {
    const ids = productIds.filter(id => !tiersCacheRef.current.has(id) && !pendingFetchRef.current.has(id))
    if (ids.length === 0) return
    ids.forEach(id => pendingFetchRef.current.add(id))
    const batchKey = ids.join(',')
    performance.mark?.(`tiers_fetch_start_${batchKey}`)
    try {
      const { data, error: tiersError } = await supabase
        .from('product_quantity_ranges')
        .select('*')
        .in('product_id', ids)
      if (tiersError) throw tiersError
      const grouped = new Map()
      for (const t of (data || [])) {
        if (!grouped.has(t.product_id)) grouped.set(t.product_id, [])
        grouped.get(t.product_id).push(t)
      }
      // Actualizar cache + productos
      setProducts(prev => prev.map(p => {
        if (!ids.includes(p.id)) return p
        const tiers = grouped.get(p.id) || []
        tiersCacheRef.current.set(p.id, tiers)
        if (tiers.length === 0) {
          return { ...p, priceTiers: [], tiersStatus: 'loaded' }
        }
        const precios = tiers.map(t => Number(t.price) || 0).filter(n => n > 0)
        const minPrice = precios.length ? Math.min(...precios) : p.minPrice
        const maxPrice = precios.length ? Math.max(...precios) : p.maxPrice
        return { ...p, priceTiers: tiers, minPrice, maxPrice, tiersStatus: 'loaded' }
      }))
    } catch (e) {
      console.error('[tiers] error batch', e)
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, tiersStatus: 'error' } : p))
    } finally {
      ids.forEach(id => pendingFetchRef.current.delete(id))
      const endKey = ids.join(',')
      performance.mark?.(`tiers_fetch_end_${endKey}`)
      if (performance.measure) {
        try { performance.measure(`tiers_fetch_${endKey}`,`tiers_fetch_start_${endKey}`,`tiers_fetch_end_${endKey}`) } catch {}
      }
    }
  }, [])

  // API pública: obtener tiers de un producto (trigger fetch si necesario)
  const getPriceTiers = useCallback((productId) => {
    if (tiersCacheRef.current.has(productId)) return tiersCacheRef.current.get(productId)
    // lanzar fetch individual (batch de 1) si no está
    fetchTiersBatch([productId])
    setProducts(prev => prev.map(p => p.id === productId && p.tiersStatus === 'idle' ? { ...p, tiersStatus: 'loading' } : p))
    return []
  }, [fetchTiersBatch])

  // IntersectionObserver para carga diferida automática
  const ensureObserver = useCallback(() => {
    if (observerRef.current) return observerRef.current
    if (typeof IntersectionObserver === 'undefined') return null
    observerRef.current = new IntersectionObserver((entries) => {
      const visibleIds = []
      for (const e of entries) {
        if (e.isIntersecting) {
          const pid = e.target.getAttribute('data-product-id')
          if (pid) visibleIds.push(pid)
          observerRef.current.unobserve(e.target)
        }
      }
      if (visibleIds.length) {
        // marcar loading
        setProducts(prev => prev.map(p => visibleIds.includes(String(p.id)) && p.tiersStatus === 'idle' ? { ...p, tiersStatus: 'loading' } : p))
        fetchTiersBatch(visibleIds.map(id => Number(id)))
      }
    }, { rootMargin: '150px 0px', threshold: 0.15 })
    return observerRef.current
  }, [fetchTiersBatch])

  const registerProductNode = useCallback((productId, node) => {
    if (!node) return
    const obs = ensureObserver()
    if (!obs) return // sin soporte
    // Evitar re-observar si ya cargado
    const product = products.find(p => p.id === productId)
    if (product && (product.tiersStatus === 'loaded' || product.tiersStatus === 'loading')) return
    node.setAttribute('data-product-id', String(productId))
    obs.observe(node)
  }, [ensureObserver, products])

  // Limpieza observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])

  return { products, loading, error, getPriceTiers, registerProductNode }
}

// Mock products data (unchanged)
const PRODUCTOS = [
  // ... existing mock data would go here
];