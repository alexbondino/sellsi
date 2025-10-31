/**
 * ============================================================================
 * SUPPLIER PRODUCTS CRUD HOOK - OPERACIONES BÁSICAS
 * ============================================================================
 *
 * Hook especializado únicamente en operaciones CRUD básicas de productos.
 * Se enfoca en la gestión de datos sin lógica compleja de procesamiento.
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'
import { StorageCleanupService } from '../../../../shared/services/storage/storageCleanupService'

const useSupplierProductsCRUD = create((set, get) => ({
  // ============================================================================
  // ESTADO BASE
  // ============================================================================
  products: [],
  loading: false,
  error: null,

  // Estados para operaciones específicas
  operationStates: {
    deleting: {}, // { productId: boolean }
    updating: {}, // { productId: boolean }
    creating: false,
  },

  // ============================================================================
  // ACCIONES CRUD BÁSICAS
  // ============================================================================

  /**
   * Cargar productos del proveedor
   */
  loadProducts: async (supplierId) => {
    set({ loading: true, error: null })

    const fingerprint = (obj) => {
      try {
        const normalized = typeof obj === 'string' ? obj : JSON.stringify(obj, Object.keys(obj || {}).sort())
        let hash = 5381
        for (let i = 0; i < normalized.length; i++) {
          hash = ((hash << 5) + hash) + normalized.charCodeAt(i)
          hash = hash & hash
        }
        return `fp_${Math.abs(hash)}`
      } catch (e) {
        return `fp_${String(obj)}`
      }
    }

    const inFlightMap = (typeof window !== 'undefined') ? (window.__inFlightSupabaseQueries = window.__inFlightSupabaseQueries || new Map()) : new Map()

    const productsKey = fingerprint({ type: 'products', supplierId })

    // Short TTL guard: avoid repeating a full products fetch within a small window
    // This prevents immediate retry loops that cause UI flicker and duplicated calls.
    try {
      if (typeof window !== 'undefined') {
        window.__inFlightSupabaseLastFetched = window.__inFlightSupabaseLastFetched || new Map()
        const last = window.__inFlightSupabaseLastFetched.get(productsKey)
        if (last && (Date.now() - last) < 3000) {
          const currentProducts = get().products || []
          set({ products: currentProducts, loading: false })
          return { success: true, data: currentProducts }
        }
      }
      let productsRes
      if (inFlightMap.has(productsKey)) {
        productsRes = await inFlightMap.get(productsKey)
      } else {
        const p = (async () => {
          return await supabase
            .from('products')
            .select(`
              *, 
              product_images(image_url, thumbnail_url, thumbnails, image_order).order(image_order.asc), 
              product_quantity_ranges(*), 
              product_delivery_regions(*)
            `)
            .eq('supplier_id', supplierId)
            .order('updateddt', { ascending: false })
        })()
        inFlightMap.set(productsKey, p)
        try {
          productsRes = await p
          if (typeof window !== 'undefined') {
            window.__inFlightSupabaseLastFetched = window.__inFlightSupabaseLastFetched || new Map()
            window.__inFlightSupabaseLastFetched.set(productsKey, Date.now())
          }
        } finally {
          inFlightMap.delete(productsKey)
        }
      }

  const products = productsRes?.data || []

      // Procesar productos para incluir relaciones
      let processedProducts =
        products?.map((product) => {
          const images = (product.product_images || []).slice().sort((a,b)=>(a.image_order||0)-(b.image_order||0))
          const main = images.find(img => (img.image_order||0) === 0)
          return {
            ...product,
            priceTiers: product.product_quantity_ranges || [],
            images,
            delivery_regions: product.product_delivery_regions || [],
            // Exponer thumbnails en nivel superior para hooks que esperan product.thumbnails
            thumbnails: main?.thumbnails || null,
            thumbnail_url: main?.thumbnail_url || product.thumbnail_url || null,
          }
        }) || []

      // Fallback: si TODOS los priceTiers están vacíos, intentar recuperar en un query separado (posible fallo de relación / RLS)
      const allEmpty = processedProducts.length > 0 && processedProducts.every(p => !p.priceTiers || p.priceTiers.length === 0)
      if (allEmpty) {
        const productIds = processedProducts.map(p => p.productid)
        const rangesKey = fingerprint({ type: 'product_quantity_ranges', productIds: productIds.slice().sort() })
        let rangesRes
        if (inFlightMap.has(rangesKey)) {
          rangesRes = await inFlightMap.get(rangesKey)
        } else {
          const r = (async () => {
            return await supabase
              .from('product_quantity_ranges')
              .select('*')
              .in('product_id', productIds)
              .order('min_quantity', { ascending: true })
          })()
          inFlightMap.set(rangesKey, r)
          try {
            rangesRes = await r
          } finally {
            inFlightMap.delete(rangesKey)
          }
        }
        const standaloneRanges = rangesRes?.data || []
        if (Array.isArray(standaloneRanges) && standaloneRanges.length > 0) {
          const grouped = standaloneRanges.reduce((acc, r) => {
            (acc[r.product_id] = acc[r.product_id] || []).push(r)
            return acc
          }, {})
          processedProducts.forEach(p => {
            if (grouped[p.productid]) {
              p.priceTiers = grouped[p.productid]
            }
          })
        }
      }


      // Merge defensively with existing in-memory products to preserve optimistic tiers
      try {
        const existing = get().products || []
        if (Array.isArray(existing) && existing.length > 0) {
          processedProducts = processedProducts.map(p => {
            const ex = existing.find(e => e.productid === p.productid)
            if (!ex) return p
            const mergedTiers = (p.priceTiers && p.priceTiers.length > 0) ? p.priceTiers : (ex.priceTiers || [])
            const mergedTierStatus = p.tiersStatus ?? ex.tiersStatus
            return { ...p, priceTiers: mergedTiers, tiersStatus: mergedTierStatus }
          })
        }
      } catch (_) { /* noop */ }

      set({
        products: processedProducts,
        loading: false,
      })

      return { success: true, data: processedProducts }
    } catch (error) {
      set({
        error: error.message || 'Error al cargar productos',
        loading: false,
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Crear producto básico (sin procesamiento complejo)
   */
  createBasicProduct: async (productData) => {
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        creating: true,
      },
      error: null,
    }))

    try {
      // Validaciones básicas
      if (!productData.productnm || !productData.description || !productData.category) {
        throw new Error('Faltan campos requeridos: nombre, descripción y categoría')
      }

      // Insertar producto principal
      const { data: product, error } = await supabase
        .from('products')
        .insert([
          {
            productnm: productData.productnm,
            description: productData.description,
            category: productData.category,
            productqty: productData.productqty || 0,
            supplier_id: localStorage.getItem('user_id'),
            price: productData.price || 0,
            minimum_purchase: productData.minimum_purchase || 1,
            negotiable: productData.negotiable || false,
            product_type: productData.product_type || 'general',
            createddt: new Date().toISOString(),
            updateddt: new Date().toISOString(),
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Agregar producto al estado
      const newProduct = {
        ...product,
        nombre: product.productnm,
        descripcion: product.description,
        categoria: product.category,
        precio: product.price,
        stock: product.productqty,
        images: [],
        // Optimistic: si createBasicProduct recibió priceTiers (vía createCompleteProduct), normalizarlos al shape de BD para que UI muestre rango inmediato
        priceTiers: Array.isArray(productData.priceTiers)
          ? productData.priceTiers.map(t => ({
              min_quantity: t.min_quantity ?? t.min ?? null,
              max_quantity: t.max_quantity ?? t.max ?? null,
              price: t.price ?? t.precio ?? 0,
            }))
          : [],
        // Mark tiers as loaded if we have optimistic tiers to avoid pending UI
        tiersStatus: Array.isArray(productData.priceTiers) && productData.priceTiers.length > 0 ? 'loaded' : 'idle',
        // Derive min/max price for convenience in UIs that show ranges
        minPrice: (() => {
          const arr = Array.isArray(productData.priceTiers) ? productData.priceTiers : []
          const nums = arr.map(t => Number(t.price ?? t.precio ?? 0)).filter(n => n > 0)
          return nums.length ? Math.min(...nums) : (product.price || 0)
        })(),
        maxPrice: (() => {
          const arr = Array.isArray(productData.priceTiers) ? productData.priceTiers : []
          const nums = arr.map(t => Number(t.price ?? t.precio ?? 0)).filter(n => n > 0)
          return nums.length ? Math.max(...nums) : (product.price || 0)
        })(),
        delivery_regions: [],
      }

      set((state) => ({
        products: [newProduct, ...state.products],
        operationStates: {
          ...state.operationStates,
          creating: false,
        },
      }))

      return { success: true, data: product }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          creating: false,
        },
        error: `Error creando producto: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar producto básico (sin procesamiento complejo)
   */
  updateBasicProduct: async (productId, updates) => {
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        updating: { ...state.operationStates.updating, [productId]: true },
      },
      error: null,
    }))

    try {
      // Filtrar solo campos básicos del producto
      const { priceTiers, imagenes, specifications, ...productFields } = updates

      // Actualizar campos básicos del producto
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updateddt: new Date().toISOString() })
        .eq('productid', productId)
        .select()
        .single()

      if (error) throw error

      // Actualizar estado local
      set((state) => ({
        products: state.products.map((product) =>
          product.productid === productId ? { ...product, ...data } : product
        ),
        operationStates: {
          ...state.operationStates,
          updating: { ...state.operationStates.updating, [productId]: false },
        },
      }))

      return { success: true, data }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          updating: { ...state.operationStates.updating, [productId]: false },
        },
        error: `Error actualizando producto: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Eliminar producto
   */
  deleteProduct: async (productId) => {
    console.log('[CRUD deleteProduct] start', productId)
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        deleting: { ...state.operationStates.deleting, [productId]: true },
      },
      error: null,
    }))

    try {
      const supplierId = localStorage.getItem('user_id')
      // Ejecutar RPC unificada
      const { data: result, error: rpcError } = await supabase.rpc('request_delete_product_v1', {
        p_product_id: productId,
        p_supplier_id: supplierId
      })
      if (rpcError) throw rpcError
      if (!result?.success) throw new Error(result?.error || 'Fallo eliminación')

      // Limpieza defensiva (huérfanos) sin bloquear
      let cleaned = 0
      try {
        const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)
        cleaned = cleanupResult.cleaned || 0
      } catch (_) {}

      set((state) => {
        let updated = state.products
        if (result.action === 'deleted') {
          updated = state.products.filter(p => p.productid !== productId)
        } else {
          updated = state.products.map(p => p.productid === productId ? { ...p, is_active: false, deletion_status: 'pending_delete' } : p)
        }
        return {
          products: updated,
          operationStates: {
            ...state.operationStates,
            deleting: { ...state.operationStates.deleting, [productId]: false },
          },
        }
      })

      // Edge cleanup fire & forget
      supabase.functions.invoke('cleanup-product', { body: { productId, action: result.action, supplierId } })
      return { success: true, action: result.action, cleaned }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          deleting: { ...state.operationStates.deleting, [productId]: false },
        },
        error: `Error eliminando producto: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  // ============================================================================
  // UTILIDADES DE ESTADO
  // ============================================================================

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Actualizar parcialmente un producto en memoria (optimista, sin I/O)
   */
  updateLocalProduct: (productId, partial) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.productid === productId ? { ...p, ...partial } : p
      ),
    }))
  },

  /**
   * Refrescar un producto específico
   */
  refreshProduct: async (productId) => {
  try {
      
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *, 
          product_images(image_url, thumbnail_url, thumbnails, image_order).order(image_order.asc), 
          product_quantity_ranges(*), 
          product_delivery_regions(*)
        `)
        .eq('productid', productId)
        .single()

      if (error) throw error

      

      const images = (product.product_images || []).slice().sort((a,b)=>(a.image_order||0)-(b.image_order||0))
      const main = images.find(img => (img.image_order||0) === 0)
      const processedProduct = {
        ...product,
        priceTiers: product.product_quantity_ranges || [],
        images,
        delivery_regions: product.product_delivery_regions || [],
        thumbnails: main?.thumbnails || null,
        thumbnail_url: main?.thumbnail_url || product.thumbnail_url || null,
      }

      set((state) => {
        const oldProduct = state.products.find(p => p.productid === productId) || {}
        const hasDbTiers = Array.isArray(processedProduct.priceTiers) && processedProduct.priceTiers.length > 0
        const mergedPriceTiers = hasDbTiers ? processedProduct.priceTiers : (oldProduct.priceTiers || [])
        const mergedTiersStatus = hasDbTiers ? 'loaded' : (oldProduct.tiersStatus || 'idle')
        const mergedProduct = { ...processedProduct, priceTiers: mergedPriceTiers, tiersStatus: mergedTiersStatus }

        return {
          products: state.products.map((p) =>
            p.productid === productId ? mergedProduct : p
          ),
        }
      })

      return { success: true, data: processedProduct }
    } catch (error) {
      
      set({ error: `Error refrescando producto: ${error.message}` })
      return { success: false, error: error.message }
    }
  },
}))

export default useSupplierProductsCRUD

// Listener global para actualizar thumbnails tras edge function sin recargar lista completa
let __CRUD_THUMBS_LISTENER_ATTACHED = false;
try {
  if (typeof window !== 'undefined' && !__CRUD_THUMBS_LISTENER_ATTACHED) {
    window.addEventListener('productImagesReady', async (ev) => {
      try {
        const detail = ev?.detail;
        if (!detail || !detail.productId) return;
        // Si viene phase y NO es de thumbnails finales, ignorar. Si no hay phase (legacy), continuar.
        if (detail.phase && !/^thumbnails_/.test(detail.phase)) return;
        const productId = detail.productId;
        const { data, error } = await supabase
          .from('product_images')
          .select('thumbnails, thumbnail_url')
          .eq('product_id', productId)
          .eq('image_order', 0)
          .single();
        if (error || !data || !data.thumbnails) return;
        useSupplierProductsCRUD.setState((state) => ({
          products: state.products.map(p => p.productid === productId ? { ...p, thumbnails: data.thumbnails, thumbnail_url: data.thumbnail_url } : p)
        }));
      } catch (_) { /* noop */ }
    });
    __CRUD_THUMBS_LISTENER_ATTACHED = true;
  }
} catch (_) { /* noop */ }
