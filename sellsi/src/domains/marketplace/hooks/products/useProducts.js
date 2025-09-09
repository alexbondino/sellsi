import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../../services/supabase'
import { filterActiveProducts } from '../../../../utils/productActiveStatus'

// --- Parche mínimo anti redundancia (StrictMode + doble montaje) ---
// Cache in-memory muy simple con TTL + dedupe de petición en vuelo.
// Mantener extremadamente ligero para futura migración a un service dedicado.
const PRODUCTS_CACHE_TTL = 60_000; // 60s (ajustable)
let productsCache = { data: null, fetchedAt: 0, inFlight: null };

function isCacheFresh() {
  return productsCache.data && (Date.now() - productsCache.fetchedAt) < PRODUCTS_CACHE_TTL;
}

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
  // Instrumentation for debugging network counts (temporary)
  const metricsRef = useRef({ priceSummaryCalls: 0, tiersBatchCalls: 0 })

  // --- Fetch inicial (sin tiers) ---
  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    setError(null)

    // MOCK path sin cambios
    if (USE_MOCKS) {
      const base = PRODUCTOS.map(p => ({ ...p, priceTiers: p.priceTiers || [], minPrice: p.minPrice ?? p.precio ?? p.price ?? 0, maxPrice: p.maxPrice ?? p.precio ?? p.price ?? 0 }))
      setProducts(filterActiveProducts(base))
      setLoading(false)
      return () => { mountedRef.current = false }
    }

    const controller = new AbortController()
    abortRef.current = controller
    performance.mark?.('products_fetch_start')

    // Si cache fresca, usar y disparar refresh en background (stale-while-revalidate mínimo)
    if (isCacheFresh()) {
      setProducts(productsCache.data)
      setLoading(false)
      // Revalidate en background sin bloquear UI
      refreshProducts(controller, setProducts, setError)
    } else {
      refreshProducts(controller, setProducts, setError, true)
    }

    return () => {
      mountedRef.current = false
      controller.abort()
    }
  }, [])

  // Función externa para refrescar (dedup + eq is_active true)
  const refreshProducts = useCallback(async (controller, setProductsCb, setErrorCb, setLoadingInitially = false) => {
    try {
      if (isCacheFresh() || controller.signal.aborted) return
      if (productsCache.inFlight) {
        const data = await productsCache.inFlight
        if (!controller.signal.aborted && mountedRef.current) {
          setProductsCb(data)
          setLoading(false)
        }
        return
      }
      if (setLoadingInitially) setLoading(true)

      productsCache.inFlight = (async () => {
        const { data, error } = await supabase
          .from('products')
          .select('productid,supplier_id,productnm,price,category,product_type,productqty,minimum_purchase,negotiable,is_active,product_images(image_url,thumbnail_url,thumbnails)')
          .eq('is_active', true) // filtro directo para reducir payload
        if (error) throw new Error(error.message)

        // Enriquecer proveedores (embedding futuro)
        let usersMap = {}
        if (data && data.length > 0) {
          const supplierIds = [...new Set(data.map(p => p.supplier_id).filter(Boolean))]
          if (supplierIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('user_id, user_nm, logo_url, descripcion_proveedor, verified')
              .in('user_id', supplierIds.map(id => String(id)))
            if (!usersError && usersData) {
              usersMap = Object.fromEntries(usersData.map(u => [u.user_id, { name: u.user_nm, logo_url: u.logo_url, descripcion_proveedor: u.descripcion_proveedor, verified: u.verified }]))
            }
          }
        }

        const mapped = (data || []).map(p => {
          const firstImg = p.product_images && p.product_images.length > 0 ? p.product_images[0] : null
          const imagenPrincipal = firstImg?.image_url || '/placeholder-product.jpg'
          const thumbnailUrl = firstImg?.thumbnail_url || null
          const thumbnails = firstImg?.thumbnails ? (typeof firstImg.thumbnails === 'string' ? safeParseJSON(firstImg.thumbnails) : firstImg.thumbnails) : null
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
            precio: basePrice,
            precioOriginal: p.price || null,
            descuento: 0,
            categoria: p.category,
            tipo: p.product_type || 'nuevo',
            tipoVenta: 'directa',
            rating: 0,
            ventas: 0,
            stock: p.productqty,
            compraMinima: p.minimum_purchase,
            minimum_purchase: p.minimum_purchase,
            // Conservamos nombre de propiedad "negociable" pero la columna real es 'negotiable'
            negociable: p.negotiable,
            is_active: p.is_active,
            priceTiers: [],
            minPrice: basePrice,
            maxPrice: basePrice,
            tiersStatus: 'idle'
          }
        })
        const active = filterActiveProducts(mapped) // por compatibilidad (debería ya estar filtrado)
        return active
      })()

      const result = await productsCache.inFlight
      productsCache.data = result
      productsCache.fetchedAt = Date.now()
      productsCache.inFlight = null
      if (!controller.signal.aborted && mountedRef.current) {
        setProductsCb(result)
        setLoading(false)
        try { fetchPriceSummaries(result.map(p => p.id)) } catch {}
        performance.mark?.('products_fetch_end')
        if (performance.measure) { try { performance.measure('products_fetch','products_fetch_start','products_fetch_end') } catch {} }
      }
    } catch (e) {
      productsCache.inFlight = null
      if (!controller.signal.aborted && mountedRef.current) {
        setErrorCb(e.message || 'Error cargando productos')
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Utilidad segura para parsear JSON de thumbnails
  const safeParseJSON = (str) => {
    try { return JSON.parse(str) } catch { return null }
  }

  // --- Fetch summaries from backend view (min/max/tiers_count) ---
  const fetchPriceSummaries = useCallback(async (productIds) => {
    const ids = (productIds || [])
      .map((id) => (id == null ? '' : String(id).trim()))
      .filter((s) => s && s.toLowerCase() !== 'nan')
    if (ids.length === 0) return
    // Instrumentation
    try {
      metricsRef.current.priceSummaryCalls += 1
      console.debug(`[useProducts] fetchPriceSummaries called (#${metricsRef.current.priceSummaryCalls}) ids=${ids.length}`, ids.slice(0,10))
    } catch (_) {}
    try {
      const { data, error } = await supabase
        .from('product_price_summary')
        .select('productid,min_price,max_price,tiers_count,has_variable_pricing')
        .in('productid', ids)
      if (error) throw error
      const byId = new Map((data || []).map(d => [String(d.productid), d]))
      setProducts(prev => prev.map(p => {
        const s = byId.get(String(p.id))
        if (!s) return p
        const minPrice = s.min_price != null ? Number(s.min_price) : p.minPrice
        const maxPrice = s.max_price != null ? Number(s.max_price) : p.maxPrice
        const tiersCount = s.tiers_count != null ? Number(s.tiers_count) : 0
        const hasVariable = !!s.has_variable_pricing
        const nextStatus = tiersCount === 0 ? 'loaded' : (p.tiersStatus === 'idle' ? 'idle' : p.tiersStatus)
        return { ...p, minPrice, maxPrice, tiers_count: tiersCount, has_variable_pricing: hasVariable, tiersStatus: nextStatus }
      }))
    } catch (e) {
      console.error('[price summaries] error', e)
    }
  }, [])

  // --- Fetch diferido de tiers (batch) ---
  const fetchTiersBatch = useCallback(async (productIds) => {
    // Normalize incoming ids to strings and filter invalids (empty / 'NaN')
    const incoming = (productIds || []).map(id => (id == null ? '' : String(id).trim()))
    // If we already fetched price summaries, avoid requesting tiers for products that have 0 tiers
    const ids = incoming.filter(id => {
      if (!id || id.toLowerCase() === 'nan') return false
      if (tiersCacheRef.current.has(id) || pendingFetchRef.current.has(id)) return false
      // Consult current products state for known tiers_count
      const prod = products.find(p => String(p.id) === id)
      if (prod && prod.tiers_count === 0) return false // skip known empty
      return true
    })
    if (ids.length === 0) return
    ids.forEach(id => pendingFetchRef.current.add(id))
    // Instrumentation
    try {
      metricsRef.current.tiersBatchCalls += 1
      console.debug(`[useProducts] fetchTiersBatch called (#${metricsRef.current.tiersBatchCalls}) ids=${ids.length}`, ids.slice(0,20))
    } catch (_) {}
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
        const key = t.product_id == null ? '' : String(t.product_id).trim()
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(t)
      }
      // Actualizar cache + productos
      setProducts(prev => prev.map(p => {
        const pid = String(p.id)
        if (!ids.includes(pid)) return p
        const tiers = grouped.get(pid) || []
        tiersCacheRef.current.set(pid, tiers)
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
      try {
        console.debug(`[useProducts] fetchTiersBatch finished (#${metricsRef.current.tiersBatchCalls}) ids=${ids.length}`)
      } catch (_) {}
      performance.mark?.(`tiers_fetch_end_${endKey}`)
      if (performance.measure) {
        try { performance.measure(`tiers_fetch_${endKey}`,`tiers_fetch_start_${endKey}`,`tiers_fetch_end_${endKey}`) } catch {}
      }
    }
  }, [])

  // API pública: obtener tiers de un producto (trigger fetch si necesario)
  const getPriceTiers = useCallback((productId) => {
  const pid = productId == null ? '' : String(productId).trim()
  if (!pid || pid.toLowerCase() === 'nan') return []
  if (tiersCacheRef.current.has(pid)) return tiersCacheRef.current.get(pid)
  // lanzar fetch individual (batch de 1) si no está
  fetchTiersBatch([pid])
  setProducts(prev => prev.map(p => String(p.id) === pid && p.tiersStatus === 'idle' ? { ...p, tiersStatus: 'loading' } : p))
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
          if (pid) visibleIds.push(String(pid))
          observerRef.current.unobserve(e.target)
        }
      }
      if (visibleIds.length) {
        // marcar loading
        setProducts(prev => prev.map(p => visibleIds.includes(String(p.id)) && p.tiersStatus === 'idle' ? { ...p, tiersStatus: 'loading' } : p))
        // pass string ids directly (don't coerce to Number for UUIDs)
        fetchTiersBatch(visibleIds)
      }
    }, { rootMargin: '150px 0px', threshold: 0.15 })
    return observerRef.current
  }, [fetchTiersBatch])

  const registerProductNode = useCallback((productId, node) => {
    if (!node) return
    const obs = ensureObserver()
    if (!obs) return // sin soporte
    // Evitar re-observar si ya cargado
    const product = products.find(p => String(p.id) === String(productId))
    if (product) {
      if (product.tiersStatus === 'loaded' || product.tiersStatus === 'loading') return
      // If we already know this product has zero tiers, no need to observe
      if (product.tiers_count === 0) return
    }
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