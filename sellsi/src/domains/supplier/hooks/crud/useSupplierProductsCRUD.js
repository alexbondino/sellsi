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

    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select(`
          *, 
          product_images(image_url, thumbnail_url, thumbnails).order(image_order.asc), 
          product_quantity_ranges(*), 
          product_delivery_regions(*)
        `)
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })

      if (prodError) throw prodError

      // Debug: log raw product_quantity_ranges counts
      

      // Procesar productos para incluir relaciones
      const processedProducts =
        products?.map((product) => ({
          ...product,
          priceTiers: product.product_quantity_ranges || [],
          images: product.product_images || [],
          delivery_regions: product.product_delivery_regions || [],
        })) || []

      // Fallback: si TODOS los priceTiers están vacíos, intentar recuperar en un query separado (posible fallo de relación / RLS)
      const allEmpty = processedProducts.length > 0 && processedProducts.every(p => !p.priceTiers || p.priceTiers.length === 0)
  if (allEmpty) {
        const productIds = processedProducts.map(p => p.productid)
        const { data: standaloneRanges, error: rangesError } = await supabase
          .from('product_quantity_ranges')
          .select('*')
          .in('product_id', productIds)
          .order('min_quantity', { ascending: true })
        if (!rangesError && Array.isArray(standaloneRanges) && standaloneRanges.length > 0) {
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
        // Optimistic: si createBasicProduct recibió priceTiers (vía createCompleteProduct) conservarlos para que stats detecten tramos
        priceTiers: Array.isArray(productData.priceTiers) ? productData.priceTiers : [],
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
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        deleting: { ...state.operationStates.deleting, [productId]: true },
      },
      error: null,
    }))

    try {
      // 1. Limpiar archivos huérfanos ANTES de eliminar
      const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)

      // 2. Eliminar producto de BD
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('productid', productId)

      if (error) throw error

      // 3. Log de limpieza para auditoría
      

      // Remover producto del estado
      set((state) => ({
        products: state.products.filter((product) => product.productid !== productId),
        operationStates: {
          ...state.operationStates,
          deleting: { ...state.operationStates.deleting, [productId]: false },
        },
      }))

      return { success: true, cleaned: cleanupResult.cleaned }
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
          product_images(image_url, thumbnail_url, thumbnails).order(image_order.asc), 
          product_quantity_ranges(*), 
          product_delivery_regions(*)
        `)
        .eq('productid', productId)
        .single()

      if (error) throw error

      

      const processedProduct = {
        ...product,
        priceTiers: product.product_quantity_ranges || [],
        images: product.product_images || [],
        delivery_regions: product.product_delivery_regions || [],
      }

      set((state) => {
  const oldProduct = state.products.find(p => p.productid === productId)
        
        return {
          products: state.products.map((p) =>
            p.productid === productId ? processedProduct : p
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
