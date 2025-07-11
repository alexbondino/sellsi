/**
 * ============================================================================
 * SUPPLIER PRODUCTS BASE STORE - GESTIÓN BÁSICA DE PRODUCTOS
 * ============================================================================
 *
 * Store base para operaciones CRUD de productos del proveedor.
 *    console.log(`    // 4. PROCESAR URLs existentes (mantener con sus thumbnails actuales)
    for (const url of existingUrls) {
      const existingImage = currentImages?.find(img => img.image_url === url);
      finalImageData.push({
        image_url: url,
        thumbnail_url: existingImage?.thumbnail_url || null
      });
    }

    // 5. SUBIR nuevas imágenes CON THUMBNAILS
    if (newImages.length > 0) {
      console.log(`� [PROCESS IMAGES] Subiendo ${newImages.length} imágenes nuevas con thumbnails...`);
      
      const files = newImages.map(img => img.file || img);
      const uploadResult = await UploadService.uploadMultipleImagesWithThumbnails(files, productId, supplierId);
      
      if (uploadResult.success && uploadResult.data) {
        for (const imageData of uploadResult.data) {
          finalImageData.push({
            image_url: imageData.publicUrl,
            thumbnail_url: imageData.thumbnailUrl || null
          });
          console.log(`✅ Nueva imagen procesada: ${imageData.publicUrl} ${imageData.thumbnailUrl ? '(con thumbnail)' : '(sin thumbnail)'}`);
        }
      }
      
      if (uploadResult.errors) {
        console.warn('⚠️ [PROCESS IMAGES] Algunos uploads fallaron:', uploadResult.errors);
      }
    }

    console.log('📋 Datos finales para registrar:', finalImageData);mages.length} nuevas, ${existingUrls.length} existentes`);Se enf    console.log(`🔍 [PROCESS IMAGES] Análisis: ${newImages.length} nuevas, ${existingUrls.length} existentes`);
    console.log('🔍 [PROCESS IMAGES] newImages:', newImages);
    console.log('🔍 [PROCESS IMAGES] existingUrls:', existingUrls);ca únicamente en la gestión de datos sin lógica de UI.
 */

import { create } from 'zustand'
import { supabase } from '../../../services/supabase'
import { updateProductSpecifications } from '../../../services/productSpecificationsService'
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

    try {      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, product_images(*), product_quantity_ranges(*)')
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })

      if (prodError) throw prodError      // Procesar productos para incluir tramos de precio
      const processedProducts =
        products?.map((product) => ({
          ...product,
          priceTiers: product.product_quantity_ranges || [],
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

      if (error) throw error      // 2. Procesar imágenes si existen
      if (productData.imagenes?.length > 0) {
        await get().processProductImages(
          product.productid,
          productData.imagenes
        )
      }      // 3. Procesar especificaciones si existen
      if (productData.specifications?.length > 0) {
        await get().processProductSpecifications(product.productid, productData.specifications)
      }

      // 4. Procesar tramos de precio si existen
      if (productData.priceTiers?.length > 0) {
        await get().processPriceTiers(product.productid, productData.priceTiers)
      }

      // 5. Recargar productos para obtener los datos actualizados con imágenes
      const supplierId = localStorage.getItem('user_id')
      if (supplierId) {
        await get().loadProducts(supplierId)
      }

      set((state) => ({
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
   */  updateProduct: async (productId, updates) => {
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        updating: { ...state.operationStates.updating, [productId]: true },
      },
      error: null,
    }))

    try {
      const { priceTiers, imagenes, specifications, ...productFields } = updates

      // Actualizar campos básicos del producto
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updateddt: new Date().toISOString() })
        .eq('productid', productId)
        .select()
        .single()

      if (error) throw error// Procesar especificaciones si se proporcionan
      if (specifications) {
        await get().processProductSpecifications(productId, specifications)
      }

      // Procesar imágenes si se proporcionan
      if (imagenes) {
        await get().processProductImages(productId, imagenes)
      }

      // Procesar tramos de precio si se proporcionan
      if (priceTiers) {
        await get().processPriceTiers(productId, priceTiers)
      }

      // Recargar productos para obtener los datos actualizados con imágenes
      const supplierId = localStorage.getItem('user_id')
      if (supplierId) {
        await get().loadProducts(supplierId)
      }

      set((state) => ({
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
   * Procesar imágenes del producto (versión inteligente)
   */
  processProductImages: async (productId, images) => {
    if (!images?.length) {
      return;
    }

    const supplierId = localStorage.getItem('user_id')
    const finalImageUrls = []

    // 1. SEPARAR imágenes nuevas (archivos) de existentes (URLs)
    const newImages = []       // Archivos que hay que subir
    const existingUrls = []    // URLs que ya existen y se mantienen

    for (const img of images) {
      if (img && img.file instanceof File) {
        newImages.push(img)
      } else if (img instanceof File) {
        newImages.push(img)
      } else if (typeof img === 'string') {
        existingUrls.push(img)
      } else if (img && typeof img.url === 'string') {
        existingUrls.push(img.url)
      }
    }

    console.log(`� Análisis: ${newImages.length} nuevas, ${existingUrls.length} existentes`);    // 2. OBTENER imágenes actuales de la BD para comparar
    const { data: currentImages } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId);

    const currentUrls = currentImages?.map(img => img.image_url) || [];// 3. ELIMINAR imágenes que ya no están en la nueva lista
    const urlsToDelete = currentUrls.filter(url => !existingUrls.includes(url));
    console.log('🗑️ [PROCESS IMAGES] URLs actuales en BD:', currentUrls);
    console.log('🗑️ [PROCESS IMAGES] URLs a mantener:', existingUrls);
    console.log('🗑️ [PROCESS IMAGES] URLs a eliminar:', urlsToDelete);
    
    if (urlsToDelete.length > 0) {
      console.log(`🗑️ [PROCESS IMAGES] ELIMINANDO SELECTIVAMENTE ${urlsToDelete.length} imágenes no utilizadas`);
      await get().deleteSpecificImages(productId, urlsToDelete);
    } else {
      console.log('✅ [PROCESS IMAGES] No hay imágenes para eliminar - todas se mantienen');
    }

    // 4. SUBIR nuevas imágenes
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i]
      console.log(`� Subiendo imagen nueva ${i + 1}:`, img);
      
      const file = img.file || img;
      const uploadRes = await UploadService.uploadImage(file, productId, supplierId)
      
      if (uploadRes.success) {
        finalImageUrls.push(uploadRes.data.publicUrl)
        console.log(`✅ Nueva imagen subida: ${uploadRes.data.publicUrl}`);
      } else {
        console.error(`❌ Error subiendo imagen ${i + 1}:`, uploadRes.error);
      }
    }

    // 5. COMBINAR URLs existentes + nuevas
    const allImageUrls = [...existingUrls, ...finalImageUrls];
    console.log('� URLs finales para registrar:', allImageUrls);

    // 6. REEMPLAZAR TODOS los registros en product_images
    if (allImageUrls.length > 0) {
      // Eliminar todos los registros actuales
      await supabase.from('product_images').delete().eq('product_id', productId);

      // Insertar todos los registros nuevos
      const imagesToInsert = allImageUrls.map((url) => ({
        product_id: productId,
        image_url: url,
      }));

      console.log('💾 Registrando en product_images:', imagesToInsert);
      const { error } = await supabase.from('product_images').insert(imagesToInsert);
      
      if (error) {
        console.error('❌ Error registrando en product_images:', error);
      } else {
        console.log('✅ Imágenes registradas exitosamente');
      }
    }
  },
  /**
   * Procesar tramos de precio
   */
  processPriceTiers: async (productId, priceTiers) => {
    if (!priceTiers?.length) return

    // Preparar tramos para insertar
    const tiersToInsert = priceTiers
      .filter((t) => t.cantidad && t.precio)
      .map((t) => ({
        product_id: productId,
        min_quantity: Number(t.cantidad),
        max_quantity: t.maxCantidad ? Number(t.maxCantidad) : null,
        price: Number(t.precio),
      }))

    // Eliminar tramos existentes
    await supabase
      .from('product_quantity_ranges')
      .delete()
      .eq('product_id', productId)

    // Insertar nuevos tramos
    if (tiersToInsert.length > 0) {
      await supabase.from('product_quantity_ranges').insert(tiersToInsert)
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

  /**
   * Procesar especificaciones del producto
   */
  processProductSpecifications: async (productId, specifications) => {
    if (!specifications?.length) {
      console.log('⚠️ No hay especificaciones para procesar');
      return;
    }    // 🔧 Actualizar especificaciones del producto usando el servicio seguro
    await updateProductSpecifications(productId, specifications);
  },
  /**
   * FUNCIÓN PELIGROSA: Eliminar TODAS las imágenes existentes del producto (bucket + BD)
   */
  deleteExistingImages: async (productId) => {
    try {
      console.log('🚨 [DELETE ALL] ATENCIÓN: Se está llamando deleteExistingImages');
      console.log('🚨 [DELETE ALL] Esto borrará TODAS las imágenes del producto:', productId);
      console.log('🚨 [DELETE ALL] Stack trace:', new Error().stack);
      console.log('🗑️ Eliminando imágenes existentes del producto:', productId);      // 1. Obtener imágenes existentes de la BD
      const { data: existingImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchError) {
        console.error('❌ Error obteniendo imágenes existentes:', fetchError);
        return;
      }

      if (existingImages && existingImages.length > 0) {
        console.log(`🗑️ Encontradas ${existingImages.length} imágenes para eliminar`);
        
        // 2. Eliminar archivos del bucket
        for (const imageRecord of existingImages) {
          try {
            // Extraer la ruta del archivo de la URL
            const url = imageRecord.image_url;
            const urlParts = url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1]; // ej: "supplierId/productId/filename.png"
              
              console.log('🗑️ Eliminando archivo del bucket:', filePath);
              const { error: deleteError } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

              if (deleteError) {
                console.error('❌ Error eliminando archivo del bucket:', deleteError);
              } else {
                console.log('✅ Archivo eliminado del bucket:', filePath);
              }
            }
          } catch (error) {
            console.error('❌ Error procesando eliminación de archivo:', error);
          }
        }

        // 3. Eliminar registros de la BD
        const { error: dbDeleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        if (dbDeleteError) {
          console.error('❌ Error eliminando registros de BD:', dbDeleteError);
        } else {
          console.log('✅ Registros de BD eliminados exitosamente');
        }
      } else {
        console.log('ℹ️ No hay imágenes existentes para eliminar');
      }
    } catch (error) {
      console.error('❌ Error en deleteExistingImages:', error);
    }
  },

  /**
   * Eliminar imágenes específicas del producto (bucket + BD)
   */
  deleteSpecificImages: async (productId, urlsToDelete) => {
    try {
      console.log('🗑️ Eliminando imágenes específicas:', urlsToDelete);
      
      // 1. Eliminar archivos del bucket
      for (const url of urlsToDelete) {
        try {
          const urlParts = url.split('/product-images/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            
            console.log('🗑️ Eliminando archivo específico del bucket:', filePath);
            const { error: deleteError } = await supabase.storage
              .from('product-images')
              .remove([filePath]);

            if (deleteError) {
              console.error('❌ Error eliminando archivo específico del bucket:', deleteError);
            } else {
              console.log('✅ Archivo específico eliminado del bucket:', filePath);
            }
          }
        } catch (error) {
          console.error('❌ Error procesando eliminación de archivo específico:', error);
        }
      }

      // 2. Eliminar registros específicos de la BD
      if (urlsToDelete.length > 0) {
        const { error: dbDeleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
          .in('image_url', urlsToDelete);

        if (dbDeleteError) {
          console.error('❌ Error eliminando registros específicos de BD:', dbDeleteError);
        } else {
          console.log('✅ Registros específicos de BD eliminados exitosamente');
        }
      }
    } catch (error) {
      console.error('❌ Error en deleteSpecificImages:', error);
    }
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
