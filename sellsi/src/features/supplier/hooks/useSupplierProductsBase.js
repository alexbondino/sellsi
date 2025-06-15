/**
 * ============================================================================
 * SUPPLIER PRODUCTS BASE STORE - GESTIÓN BÁSICA DE PRODUCTOS
 * ============================================================================
 *
 * Store base para operaciones CRUD de productos del proveedor.
 * Se enfoca únicamente en la gestión de datos sin lógica de UI.
 */

import { create } from 'zustand'
import { supabase } from '../../../services/supabase'
import UploadService from '../../../services/uploadService'

const useSupplierProductsBase = create((set, get) => ({
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
  // ACCIONES CRUD
  // ============================================================================

  /**
   * Cargar productos del proveedor
   */
  loadProducts: async (supplierId) => {
    set({ loading: true, error: null })

    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, product_images(*), product_price_tiers(*)')
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })

      if (prodError) throw prodError

      // Procesar productos para incluir tramos de precio
      const processedProducts =
        products?.map((product) => ({
          ...product,
          priceTiers: product.product_price_tiers || [],
          images: product.product_images || [],
        })) || []

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
   * Crear nuevo producto
   */
  createProduct: async (productData) => {
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        creating: true,
      },
      error: null,
    }))

    try {
      // Validaciones básicas
      if (
        !productData.productnm ||
        !productData.description ||
        !productData.category
      ) {
        throw new Error(
          'Faltan campos requeridos: nombre, descripción y categoría'
        )
      }

      // 1. Insertar producto principal
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

      // 2. Procesar imágenes si existen
      if (productData.imagenes?.length > 0) {
        await get().processProductImages(
          product.productid,
          productData.imagenes
        )
      }

      // 3. Procesar tramos de precio si existen
      if (productData.priceTiers?.length > 0) {
        await get().processPriceTiers(product.productid, productData.priceTiers)
      }

      // Actualizar store
      const { products } = get()
      set((state) => ({
        products: [product, ...products],
        operationStates: {
          ...state.operationStates,
          creating: false,
        },
      }))

      return { success: true, product }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          creating: false,
        },
        error: error.message || 'Error al crear producto',
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar producto existente
   */
  updateProduct: async (productId, updates) => {
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        updating: { ...state.operationStates.updating, [productId]: true },
      },
      error: null,
    }))

    try {
      const { priceTiers, imagenes, ...productFields } = updates

      // Actualizar campos básicos del producto
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updateddt: new Date().toISOString() })
        .eq('productid', productId)
        .select()
        .single()

      if (error) throw error

      // Procesar imágenes si se proporcionan
      if (imagenes) {
        await get().processProductImages(productId, imagenes)
      }

      // Procesar tramos de precio si se proporcionan
      if (priceTiers) {
        await get().processPriceTiers(productId, priceTiers)
      }

      // Actualizar en el store
      const { products } = get()
      const updatedProducts = products.map((product) =>
        product.productid === productId ? { ...product, ...data } : product
      )

      set((state) => ({
        products: updatedProducts,
        operationStates: {
          ...state.operationStates,
          updating: { ...state.operationStates.updating, [productId]: false },
        },
      }))

      return { success: true }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          updating: { ...state.operationStates.updating, [productId]: false },
        },
        error: error.message || 'Error al actualizar producto',
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
      // Eliminar imágenes del storage primero
      await get().cleanupProductImages(productId)

      // Eliminar producto de la base de datos
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('productid', productId)

      if (error) throw error

      // Actualizar store
      const { products } = get()
      const updatedProducts = products.filter((p) => p.productid !== productId)

      set((state) => ({
        products: updatedProducts,
        operationStates: {
          ...state.operationStates,
          deleting: { ...state.operationStates.deleting, [productId]: false },
        },
      }))

      return { success: true }
    } catch (error) {
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          deleting: { ...state.operationStates.deleting, [productId]: false },
        },
        error: error.message || 'Error al eliminar producto',
      }))
      return { success: false, error: error.message }
    }
  },

  // ============================================================================
  // HELPERS INTERNOS
  // ============================================================================

  /**
   * Procesar imágenes del producto
   */
  processProductImages: async (productId, images) => {
    if (!images?.length) return

    const supplierId = localStorage.getItem('user_id')
    const imageUrls = []

    // Subir imágenes al storage
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const img = images[i]
      if (img instanceof File) {
        const uploadRes = await UploadService.uploadImage(
          img,
          productId,
          supplierId
        )
        if (uploadRes.success) {
          imageUrls.push(uploadRes.data.publicUrl)
        }
      }
    }

    // Insertar referencias en la tabla product_images
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, index) => ({
        product_id: productId,
        image_url: url,
        is_primary: index === 0,
        upload_order: index + 1,
      }))

      await supabase.from('product_images').insert(imagesToInsert)
    }
  },

  /**
   * Procesar tramos de precio
   */
  processPriceTiers: async (productId, priceTiers) => {
    if (!priceTiers?.length) return

    // Eliminar tramos existentes
    await supabase
      .from('product_price_tiers')
      .delete()
      .eq('product_id', productId)

    // Insertar nuevos tramos
    const tiersToInsert = priceTiers
      .filter((t) => t.cantidad && t.precio)
      .map((t) => ({
        product_id: productId,
        min_quantity: Number(t.cantidad),
        max_quantity: t.maxCantidad ? Number(t.maxCantidad) : null,
        price: Number(t.precio),
      }))

    if (tiersToInsert.length > 0) {
      await supabase.from('product_price_tiers').insert(tiersToInsert)
    }
  },

  /**
   * Limpiar imágenes del producto
   */
  cleanupProductImages: async (productId) => {
    const supplierId = localStorage.getItem('user_id')
    const folderPrefix = `${supplierId}/${productId}/`

    // Eliminar archivos del bucket
    const { data: bucketFiles } = await supabase.storage
      .from('product-images')
      .list(folderPrefix, { limit: 100 })

    if (bucketFiles?.length > 0) {
      const toDeleteFromBucket = bucketFiles.map(
        (file) => folderPrefix + file.name
      )
      await supabase.storage.from('product-images').remove(toDeleteFromBucket)
    }

    // Eliminar referencias de la tabla
    await supabase.from('product_images').delete().eq('product_id', productId)
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Obtener producto por ID
   */
  getProductById: (productId) => {
    const { products } = get()
    return products.find((product) => product.productid === productId)
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Reset del store
   */
  reset: () => {
    set({
      products: [],
      loading: false,
      error: null,
      operationStates: {
        deleting: {},
        updating: {},
        creating: false,
      },
    })
  },
}))

export default useSupplierProductsBase
