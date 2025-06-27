/**
 * ============================================================================
 * SUPPLIER PRODUCTS STORE - GESTIÓN GLOBAL DE PRODUCTOS DEL PROVEEDOR
 * ============================================================================
 *
 * Store centralizado usando Zustand para manejar el estado de productos
 * del proveedor actual. Incluye operaciones CRUD y filtros.
 *
 * CARACTERÍSTICAS:
 * - ✅ Gestión completa de productos del proveedor
 * - ✅ Operaciones CRUD (Create, Read, Update, Delete)
 * - ✅ Filtros y búsqueda
 * - ✅ Estados de carga
 * - ✅ Preparado para integración con backend
 *
 * TODO FUTURO:
 * - 🔄 Sincronización con Supabase
 * - 🔄 Optimistic updates
 * - 🔄 Cache inteligente
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'
import { insertProductSpecifications } from '../../../../services/productSpecificationsService'
import UploadService from '../../../../services/uploadService'

// Adaptar a la tabla y campos reales de products
const useSupplierProductsStore = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  products: [],
  filteredProducts: [],
  searchTerm: '',
  categoryFilter: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  loading: false,
  error: null,

  // Estados para operaciones específicas
  deleting: {}, // { productId: boolean }
  updating: {}, // { productId: boolean }

  // ============================================================================
  // ACCIONES BÁSICAS
  // ============================================================================

  /**
   * Cargar productos del proveedor desde la tabla products, incluyendo tramos de precio
   */
  loadProducts: async (supplierId) => {
    set({ loading: true, error: null })
    try {
      // Obtener productos del proveedor, incluyendo imágenes
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, product_images(*)') // Traer imágenes asociadas
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })
      if (prodError) throw prodError
      // Obtener todos los tramos de precio de estos productos
      const productIds = products.map((p) => p.productid)
      let priceTiers = []
      if (productIds.length > 0) {        const { data: tiers, error: tierError } = await supabase
          .from('product_quantity_ranges')
          .select('*')
          .in('product_id', productIds)
        if (tierError) throw tierError
        priceTiers = tiers
      }
      // Asociar tramos a cada producto
      const productsWithTiers = products.map((p) => ({
        ...p,
        priceTiers: priceTiers.filter((t) => t.product_id === p.productid),
      }))
      set({
        products: productsWithTiers,
        filteredProducts: productsWithTiers,
        loading: false,
      })
      get().applyFilters()
    } catch (error) {
      set({
        error: error.message || 'Error al cargar productos',
        loading: false,
      })
    }
  },

  /**
   * Agregar nuevo producto a la tabla products y sus tramos de precio
   */
  addProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      if (
        !productData.productnm ||
        !productData.description ||
        !productData.category
      ) {
        throw new Error(
          'Faltan campos requeridos: nombre, descripción y categoría son obligatorios'
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
            image_url: productData.image_url || '',
            createddt: new Date().toISOString(),
            updateddt: new Date().toISOString(),
            is_active: true,
          },
        ])
        .select()
        .single()
      if (error) throw error
      // 2. Subir imágenes al storage y obtener URLs públicas
      let imageUrls = []
      if (
        productData.imagenes &&
        Array.isArray(productData.imagenes) &&
        productData.imagenes.length > 0
      ) {
        const supplierId = localStorage.getItem('user_id')
        for (let i = 0; i < Math.min(productData.imagenes.length, 5); i++) {
          const img = productData.imagenes[i]
          if (img instanceof File) {
            const uploadRes = await UploadService.uploadImage(
              img,
              product.productid,
              supplierId
            )
            if (uploadRes.success) {
              imageUrls.push(uploadRes.data.publicUrl)
            }
          } else if (typeof img === 'string') {
            imageUrls.push(img)
          } else if (
            img &&
            typeof img === 'object' &&
            typeof img.url === 'string'
          ) {
            imageUrls.push(img.url)
          }
        }
      }
      // 3. Insertar imágenes en la tabla product_images
      if (imageUrls.length > 0) {
        const imagesToInsert = imageUrls.map((url, idx) => ({
          product_id: product.productid,
          image_url: url,
          is_primary: idx === 0,
          sort_order: idx,
        }))
        const { error: imgError } = await supabase
          .from('product_images')
          .insert(imagesToInsert)
        if (imgError) throw imgError
      }
      // 4. Insertar tramos de precio (priceTiers) si existen
      if (
        productData.priceTiers &&
        Array.isArray(productData.priceTiers) &&
        productData.priceTiers.length > 0
      ) {
        const tiersToInsert = productData.priceTiers
          .filter((t) => t.cantidad && t.precio)
          .map((t) => ({            product_id: product.productid,
            min_quantity: Number(t.cantidad),
            max_quantity: t.maxCantidad ? Number(t.maxCantidad) : null,
            price: Number(t.precio),
          }))

        if (tiersToInsert.length > 0) {
          const { error: tierError } = await supabase
            .from('product_quantity_ranges')
            .insert(tiersToInsert)
          if (tierError) throw tierError
        }
      }      // 5. Insertar especificaciones si existen (clave-valor) usando servicio seguro
      if (
        productData.specifications &&
        Array.isArray(productData.specifications) &&
        productData.specifications.length > 0
      ) {
        await insertProductSpecifications(
          product.productid, 
          productData.specifications, 
          productData.category || 'general'
        );
      }
      const { products } = get()
      const updatedProducts = [product, ...products]
      set({ products: updatedProducts, loading: false })
      get().applyFilters()
      return { success: true, product }
    } catch (error) {
      set({
        error: error.message || 'Error al agregar producto',
        loading: false,
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar producto existente en la tabla products
   */
  updateProduct: async (productid, updates) => {
    set((state) => ({
      updating: { ...state.updating, [productid]: true },
      error: null,
    }))
    try {
      // 1. Actualizar producto principal
      const { priceTiers, specifications, imagenes, ...productFields } = updates // quitar imagenes del update
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updateddt: new Date().toISOString() })
        .eq('productid', productid)
        .select()
        .single()
      if (error) throw error

      // 2. Obtener imágenes antiguas
      const { data: oldImgs } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productid)
      const oldUrls = (oldImgs || []).map((img) => img.image_url)

      // 3. Determinar imágenes a eliminar y a mantener
      const finalUrls = (imagenes || [])
        .filter((img) => typeof img === 'string' && img.startsWith('http'))
        .map((url) => (typeof url === 'string' ? url : url.url))
      const toDelete = oldUrls.filter((url) => !finalUrls.includes(url))
      if (toDelete.length > 0) {
        const oldPaths = toDelete.map((url) =>
          url.replace(
            /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/product-images\//,
            ''
          )
        )
        await supabase.storage.from('product-images').remove(oldPaths)
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productid)
          .in('image_url', toDelete)
      }

      // 4. Subir nuevas imágenes (tipo File) y agregar sus URLs
      let newImageUrls = [...finalUrls]
      if (imagenes && imagenes.length > 0) {
        const supplierId = localStorage.getItem('user_id')
        for (let i = 0; i < Math.min(imagenes.length, 5); i++) {
          const img = imagenes[i]
          if (img instanceof File) {
            const uploadRes = await UploadService.uploadImage(
              img,
              productid,
              supplierId
            )
            if (uploadRes.success) {
              newImageUrls.push(uploadRes.data.publicUrl)
            }
          }
        }
      }
      // Limpiar duplicados y limitar a 5
      newImageUrls = Array.from(new Set(newImageUrls)).slice(0, 5)
      // Limpiar la tabla y reinsertar solo las imágenes finales
      await supabase.from('product_images').delete().eq('product_id', productid)
      const imagesToInsert = newImageUrls.map((url, idx) => ({
        product_id: productid,
        image_url: url,
        is_primary: idx === 0,
        sort_order: idx,
      }))
      if (imagesToInsert.length > 0) {
        await supabase.from('product_images').insert(imagesToInsert)
      }

      // 5. Limpieza robusta de archivos huérfanos en el bucket
      const folderPrefix = `${localStorage.getItem('user_id')}/${productid}/`
      // Obtener todas las URLs actuales en la tabla
      const { data: imgsInTable, error: tableError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productid)
      const urlsInTable = (imgsInTable || []).map((img) => img.image_url)
      // Obtener todas las URLs que deberían existir (las finales)
      const shouldExist = new Set(
        urlsInTable
          .map((url) => {
            // Extraer el path relativo al bucket
            const match = url.match(/product-images\/(.+)/)
            return match ? match[1] : null
          })
          .filter(Boolean)
      )
      // Listar todos los archivos en la carpeta del producto
      const { data: bucketFiles } = await supabase.storage
        .from('product-images')
        .list(folderPrefix, { limit: 100 })
      // Construir paths de archivos en el bucket
      const allBucketPaths = (bucketFiles || []).map(
        (file) => folderPrefix + file.name
      )
      // Determinar archivos huérfanos (en el bucket pero no en la tabla)
      const orphanFiles = allBucketPaths.filter((path) => {
        // Solo el path relativo después de 'product-images/'
        const rel = path.replace('product-images/', '')
        return !shouldExist.has(rel)
      })
      if (orphanFiles.length > 0) {
        await supabase.storage.from('product-images').remove(orphanFiles)
      }      // 6. Eliminar tramos antiguos
      await supabase
        .from('product_quantity_ranges')
        .delete()
        .eq('product_id', productid)

      // 7. Insertar nuevos tramos si existen
      if (priceTiers && Array.isArray(priceTiers) && priceTiers.length > 0) {
        const tiersToInsert = priceTiers
          .filter((t) => t.cantidad && t.precio)
          .map((t) => ({            product_id: productid,
            min_quantity: Number(t.cantidad),
            max_quantity: t.maxCantidad ? Number(t.maxCantidad) : null,
            price: Number(t.precio),
          }))
        
        if (tiersToInsert.length > 0) {
          const { error: tierError } = await supabase
            .from('product_quantity_ranges')
            .insert(tiersToInsert)
          if (tierError) throw tierError
        }
      }

      // ...especificaciones técnicas opcional...

      const { products } = get()
      const updatedProducts = products.map((product) =>
        product.productid === productid ? { ...product, ...data } : product
      )
      set((state) => ({
        products: updatedProducts,
        updating: { ...state.updating, [productid]: false },
      }))
      get().applyFilters()
      return { success: true }
    } catch (error) {
      set((state) => ({
        updating: { ...state.updating, [productid]: false },
        error: error.message || 'Error al actualizar producto',
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Eliminar producto en la tabla products
   */
  deleteProduct: async (productid) => {
    set((state) => ({
      deleting: { ...state.deleting, [productid]: true },
      error: null,
    }))
    try {
      // 1. Eliminar imágenes del bucket y de la tabla antes de borrar el producto
      const supplierId = localStorage.getItem('user_id')
      const folderPrefix = `${supplierId}/${productid}/`
      // Listar archivos en el bucket
      const { data: bucketFiles } = await supabase.storage
        .from('product-images')
        .list(folderPrefix, { limit: 100 })
      if (bucketFiles && Array.isArray(bucketFiles) && bucketFiles.length > 0) {
        const toDeleteFromBucket = bucketFiles.map(
          (file) => folderPrefix + file.name
        )
        await supabase.storage.from('product-images').remove(toDeleteFromBucket)
      }
      // Eliminar de la tabla product_images
      await supabase.from('product_images').delete().eq('product_id', productid)
      // 2. Eliminar el producto
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('productid', productid)
      if (error) throw error
      const { products } = get()
      const updatedProducts = products.filter(
        (product) => product.productid !== productid
      )
      set((state) => ({
        products: updatedProducts,
        deleting: { ...state.deleting, [productid]: false },
      }))
      get().applyFilters()
      return { success: true }
    } catch (error) {
      set((state) => ({
        deleting: { ...state.deleting, [productid]: false },
        error: error.message || 'Error al eliminar producto',
      }))
      return { success: false, error: error.message }
    }
  },

  // ============================================================================
  // FILTROS Y BÚSQUEDA
  // ============================================================================

  /**
   * Establecer término de búsqueda
   */
  setSearchTerm: (searchTerm) => {
    set({ searchTerm })
    get().applyFilters()
  },

  /**
   * Establecer filtro de categoría
   */
  setCategoryFilter: (categoryFilter) => {
    set({ categoryFilter })
    get().applyFilters()
  },

  /**
   * Establecer ordenamiento
   */
  setSorting: (sortBy, sortOrder = 'desc') => {
    set({ sortBy, sortOrder })
    get().applyFilters()
  },

  /**
   * Aplicar todos los filtros activos
   */
  applyFilters: () => {
    const { products, searchTerm, categoryFilter, sortBy, sortOrder } = get()

    let filtered = [...products]
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (product) =>
          (product.productnm &&
            product.productnm.toLowerCase().includes(search)) ||
          (product.description &&
            product.description.toLowerCase().includes(search)) ||
          (product.category && product.category.toLowerCase().includes(search))
      )
    }
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      )
    }
    filtered.sort((a, b) => {
      let valueA = a[sortBy]
      let valueB = b[sortBy]
      if (sortBy === 'createddt' || sortBy === 'updateddt') {
        valueA = new Date(valueA)
        valueB = new Date(valueB)
      }
      if (sortBy === 'price' || sortBy === 'productqty') {
        valueA = Number(valueA) || 0
        valueB = Number(valueB) || 0
      }
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })
    set({ filteredProducts: filtered })
  },

  /**
   * Limpiar todos los filtros
   */
  clearFilters: () => {
    set({
      searchTerm: '',
      categoryFilter: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
    get().applyFilters()
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
   * Reset completo del store
   */
  reset: () => {
    set({
      products: [],
      filteredProducts: [],
      searchTerm: '',
      categoryFilter: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      loading: false,
      error: null,
      deleting: {},
      updating: {},
    })
  },

  /**
   * Devuelve los productos mapeados para la UI (id, nombre, imagen, etc.)
   */
  getUiProducts: () => {
    const { filteredProducts } = get()
    return filteredProducts.map((p) => {
      // Calcular tramo mínimo y máximo si existen
      let tramoMin = null,
        tramoMax = null,
        tramoPrecioMin = null,
        tramoPrecioMax = null
      if (p.priceTiers && p.priceTiers.length > 0) {
        // Ordenar por min_quantity ascendente
        const sorted = [...p.priceTiers].sort(
          (a, b) => a.min_quantity - b.min_quantity
        )
        tramoMin = sorted[0]?.min_quantity
        // Buscar el mayor max_quantity válido, si no hay, usar el mayor min_quantity
        const maxQ = sorted.map((t) => t.max_quantity).filter((x) => x != null)
        if (maxQ.length > 0) {
          tramoMax = Math.max(...maxQ)
        } else {
          tramoMax = sorted[sorted.length - 1]?.min_quantity
        }
        tramoPrecioMin = Math.min(...sorted.map((t) => Number(t.price)))
        tramoPrecioMax = Math.max(...sorted.map((t) => Number(t.price)))
      }
      // Obtener imágenes del producto (si existen)
      let imagenes = []
      let imagenPrincipal = p.image_url
      if (
        p.product_images &&
        Array.isArray(p.product_images) &&
        p.product_images.length > 0
      ) {
        imagenes = p.product_images.map((img) => img.image_url)
        const principal = p.product_images.find((img) => img.is_primary)
        if (principal) imagenPrincipal = principal.image_url
        else imagenPrincipal = imagenes[0]
      }
      return {
        id: p.productid,
        productid: p.productid, // ✅ Agregar productid explícito
        supplier_id: p.supplier_id, // ✅ Agregar supplier_id explícito
        nombre: p.productnm,
        imagen: imagenPrincipal,
        imagenes,
        precio: p.price,
        categoria: p.category,
        stock: p.productqty,
        descripcion: p.description,
        compraMinima: p.minimum_purchase,
        negociable: p.negociable,
        tipo: p.product_type,
        createdAt: p.createddt,
        updatedAt: p.updateddt,
        priceTiers: p.priceTiers || [],
        tramoMin,
        tramoMax,
        tramoPrecioMin,
        tramoPrecioMax,
        // Agrega más campos si la UI los necesita
      }
    })
  },
}))

export default useSupplierProductsStore
