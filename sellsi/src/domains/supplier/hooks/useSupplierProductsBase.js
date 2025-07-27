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
import { updateProductSpecifications } from '../../../services/marketplace'
import { UploadService } from '../../../shared/services/upload'

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
    processing: {}, // { productId: boolean } - Para procesamiento en background
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
        .select('*, product_images(*), product_quantity_ranges(*), product_delivery_regions(*)')
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })

      if (prodError) throw prodError      // Procesar productos para incluir tramos de precio y regiones de despacho
      const processedProducts =
        products?.map((product) => ({
          ...product,
          priceTiers: product.product_quantity_ranges || [],
          images: product.product_images || [],
          delivery_regions: product.product_delivery_regions || [],
        })) || []

      set((state) => ({
        products: processedProducts,
        loading: false,
        // Preservar estados de procesamiento existentes
        operationStates: {
          ...state.operationStates,
          // No resetear processing, solo actualizar si ya no está procesando
        },
      }))

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
   * Crear nuevo producto de forma asíncrona
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

      // 1. Insertar producto principal INMEDIATAMENTE
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

      // 2. Agregar producto al estado inmediatamente con flag de procesamiento
      const tempProduct = {
        ...product,
        nombre: product.productnm,
        descripcion: product.description,
        categoria: product.category,
        precio: product.price,
        stock: product.productqty,
        imagenes: [],
        isProcessing: true, // Flag para mostrar spinner
        processingStartTime: Date.now(),
      }

      set((state) => ({
        products: [tempProduct, ...state.products],
        operationStates: {
          ...state.operationStates,
          creating: false,
          processing: {
            ...state.operationStates.processing,
            [product.productid]: true,
          },
        },
      }))

      // 3. Procesar imágenes, especificaciones y tramos EN BACKGROUND
      get().processProductInBackground(product.productid, productData)

      return { success: true, product: tempProduct }
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
   * Procesar producto en background (imágenes, especificaciones, tramos)
   */
  processProductInBackground: async (productId, productData) => {
    try {


      // Procesar imágenes si existen
      if (productData.imagenes?.length > 0) {

        await get().processProductImages(productId, productData.imagenes)
      }

      // Procesar especificaciones si existen
      if (productData.specifications?.length > 0) {

        await get().processProductSpecifications(productId, productData.specifications)
      }

      // Procesar tramos de precio si existen
      if (productData.priceTiers?.length > 0) {

        await get().processPriceTiers(productId, productData.priceTiers)
      }

      // Recargar producto actualizado
      const supplierId = localStorage.getItem('user_id')
      if (supplierId) {

        await get().loadProducts(supplierId)
      }

      // Actualizar estado de procesamiento
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          processing: {
            ...state.operationStates.processing,
            [productId]: false,
          },
        },
      }))


    } catch (error) {

      
      // Actualizar estado de error
      set((state) => ({
        operationStates: {
          ...state.operationStates,
          processing: {
            ...state.operationStates.processing,
            [productId]: false,
          },
        },
        error: `Error procesando producto: ${error.message}`,
      }))
    }
  },

  /**
   * ========================================================================
   * ACTUALIZACIÓN ROBUSTA DE PRODUCTO
   * ========================================================================
   * 
   * Maneja correctamente la transición entre modos de pricing
   */
  updateProduct: async (productId, updates) => {
    console.log('🔄 Actualizando producto:', productId)
    console.log('📝 Updates recibidos:', updates)
    
    set((state) => ({
      operationStates: {
        ...state.operationStates,
        updating: { ...state.operationStates.updating, [productId]: true },
      },
      error: null,
    }))

    try {
      const { priceTiers, imagenes, specifications, ...productFields } = updates

      console.log('🏷️  Campos del producto a actualizar:', productFields)
      console.log('📊 Price tiers:', priceTiers)
      
      // LOGGING CRÍTICO: Verificar campos de pricing
      if (productFields.product_type) {
        console.log('🔄 CAMBIO DETECTADO - product_type:', productFields.product_type)
      }
      if (productFields.price !== undefined) {
        console.log('💰 CAMBIO DETECTADO - price:', productFields.price)
      }

      // PASO 1: Actualizar campos básicos del producto
      console.log('📝 EJECUTANDO UPDATE EN SUPABASE con campos:', productFields)
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updateddt: new Date().toISOString() })
        .eq('productid', productId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error actualizando campos básicos:', error)
        throw error
      }
      
      console.log('✅ Campos básicos actualizados')

      // PASO 2: Procesar especificaciones si se proporcionan
      if (specifications) {
        console.log('📋 Procesando especificaciones...')
        await get().processProductSpecifications(productId, specifications)
      }

      // PASO 3: Procesar imágenes si se proporcionan
      if (imagenes) {
        console.log('🖼️  Procesando imágenes...')
        await get().processProductImages(productId, imagenes)
      }

      // PASO 4: Procesar tramos de precio SIEMPRE (para limpiar o crear)
      console.log('💰 Procesando price tiers...')
      await get().processPriceTiers(productId, priceTiers || [])

      // PASO 5: Recargar productos para obtener los datos actualizados
      const supplierId = localStorage.getItem('user_id')
      if (supplierId) {
        console.log('🔄 Recargando productos...')
        await get().loadProducts(supplierId)
      }

      set((state) => ({
        operationStates: {
          ...state.operationStates,
          updating: { ...state.operationStates.updating, [productId]: false },
        },
      }))

      console.log('✅ Producto actualizado exitosamente')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error en updateProduct:', error)
      
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
   * Eliminar producto (UX optimizada - elimina producto primero, limpia imágenes después)
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
      // 1. PRIMERO: Obtener URLs de imágenes ANTES de eliminar

      const { data: imageRecords, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId);

      if (fetchError) {

      } else {

      }

      // 2. Eliminar producto de la base de datos
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('productid', productId)

      if (error) throw error

      // 3. Actualizar store inmediatamente (UI responde rápido)
      const { products } = get()
      const updatedProducts = products.filter((p) => p.productid !== productId)

      set((state) => ({
        products: updatedProducts,
        operationStates: {
          ...state.operationStates,
          deleting: { ...state.operationStates.deleting, [productId]: false },
        },
      }))

      // 4. Limpiar imágenes en background usando URLs obtenidas previamente
      if (imageRecords?.length > 0) {

        get().cleanupImagesFromUrls(imageRecords).catch(error => {

        });
      } else {

      }

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

    const { data: currentImages } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', productId);

    const currentUrls = currentImages?.map(img => img.image_url) || [];// 3. ELIMINAR imágenes que ya no están en la nueva lista
    const urlsToDelete = currentUrls.filter(url => !existingUrls.includes(url));
    
    if (urlsToDelete.length > 0) {
      await get().deleteSpecificImages(productId, urlsToDelete);
    } else {
    }

    // 4. COMBINAR URLs existentes + nuevas (con thumbnails)
    const finalImageData = [];
    
    // Procesar URLs existentes (mantener con sus thumbnails actuales)
    const { data: currentImagesWithThumbnails } = await supabase
      .from('product_images')
      .select('image_url, thumbnail_url')
      .eq('product_id', productId);
    
    for (const url of existingUrls) {
      const existingImage = currentImagesWithThumbnails?.find(img => img.image_url === url);
      finalImageData.push({
        image_url: url,
        thumbnail_url: existingImage?.thumbnail_url || null
      });
    }

    // 5. SUBIR nuevas imágenes con thumbnails
    if (newImages.length > 0) {
      
      const files = newImages.map(img => img.file || img);
      
      const uploadResult = await UploadService.uploadMultipleImagesWithThumbnails(files, productId, supplierId);
      
      if (uploadResult.success && uploadResult.data) {
        for (const imageData of uploadResult.data) {
          finalImageData.push({
            image_url: imageData.publicUrl,
            thumbnail_url: imageData.thumbnailUrl || null
          });
        }
      } else {
      }
    } else {
    }
    

    // 6. REEMPLAZAR TODOS los registros en product_images
    if (finalImageData.length > 0) {


      
      // PRIMERO: Obtener URLs existentes ANTES de eliminar
      const { data: existingImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId);
      
      if (fetchError) {
        // Manejo de error silenciado
      } else {
        // Limpiar imágenes existentes del storage
        if (existingImages?.length > 0) {
          await get().cleanupImagesFromUrls(existingImages);
        }
      }
      
      // DESPUÉS: Eliminar registros de la BD
      await supabase.from('product_images').delete().eq('product_id', productId);

      // Insertar todos los registros nuevos (con thumbnails)
      const imagesToInsert = finalImageData.map((imageData) => ({
        product_id: productId,
        image_url: imageData.image_url,
        thumbnail_url: imageData.thumbnail_url
      }));

      const { data: insertedData, error } = await supabase.from('product_images').insert(imagesToInsert);
      
      if (error) {
        throw error;
      } else {
        // Verificar si realmente se insertaron
        const { data: verifyData, error: verifyError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId);
        if (verifyError) {

        } else {


        }
      }
    } else {

    }
  },
  /**
   * Procesar tramos de precio
   */
  /**
   * ========================================================================
   * PROCESAMIENTO ROBUSTO DE PRICE TIERS
   * ========================================================================
   * 
   * Maneja tanto la creación como la limpieza de tramos de precio
   * de forma profesional y sin inconsistencias.
   */
  processPriceTiers: async (productId, priceTiers) => {
    console.log('🔧 Procesando price tiers para producto:', productId)
    console.log('📊 Price tiers recibidos:', priceTiers)
    
    try {
      // PASO 1: Siempre limpiar tramos existentes primero
      console.log('🧹 Limpiando tramos existentes...')
      const { error: deleteError } = await supabase
        .from('product_quantity_ranges')
        .delete()
        .eq('product_id', productId)

      if (deleteError) {
        console.error('❌ Error limpiando tramos existentes:', deleteError)
        throw deleteError
      }
      console.log('✅ Tramos existentes limpiados')

      // PASO 2: Si no hay priceTiers o está vacío, terminar aquí (modo Por Unidad)
      if (!priceTiers || priceTiers.length === 0) {
        console.log('ℹ️  No hay price tiers para insertar (modo Por Unidad)')
        return
      }

      // PASO 3: Preparar y validar tramos para insertar
      const tiersToInsert = priceTiers
        .filter((t) => t.min && t.precio && Number(t.min) > 0 && Number(t.precio) > 0)
        .map((t, index, array) => ({
          product_id: productId,
          min_quantity: Number(t.min),
          // El último rango siempre tiene max_quantity = null (sin límite superior, limitado por stock)
          max_quantity: index === array.length - 1 ? null : (t.max ? Number(t.max) : null),
          price: Number(t.precio),
        }))

      console.log('📝 Tramos preparados para insertar:', tiersToInsert)

      // PASO 4: Insertar nuevos tramos solo si hay datos válidos
      if (tiersToInsert.length > 0) {
        console.log('💾 Insertando nuevos tramos...')
        const { error: insertError } = await supabase
          .from('product_quantity_ranges')
          .insert(tiersToInsert)

        if (insertError) {
          console.error('❌ Error insertando tramos:', insertError)
          throw insertError
        }
        console.log('✅ Tramos insertados exitosamente')
      } else {
        console.log('ℹ️  No hay tramos válidos para insertar')
      }

    } catch (error) {
      console.error('❌ Error en processPriceTiers:', error)
      throw error
    }
  },

  /**
   * Verificar si archivos existen en el storage (para debugging)
   */
  verifyFileExistence: async (filePaths) => {

    
    for (const filePath of filePaths) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .list(filePath.substring(0, filePath.lastIndexOf('/')), {
            limit: 1000,
            search: filePath.substring(filePath.lastIndexOf('/') + 1)
          });
        
        if (error) {

        } else {
          const exists = data?.length > 0;

        }
      } catch (error) {

      }
    }
  },

  /**
   * Limpiar imágenes usando URLs directas (más eficiente)
   */
  cleanupImagesFromUrls: async (imageRecords) => {


    
    try {
      // Limpiar imágenes originales
      for (const record of imageRecords) {
        if (record.image_url) {
          try {
            const urlParts = record.image_url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];

              
              // Intentar eliminar directamente sin verificación previa
              const { data: deleteData, error: deleteError } = await supabase.storage
                .from('product-images')
                .remove([filePath]);
              // No logs ni objetos huérfanos
            }
          } catch (error) {

          }
        }
        
        // Limpiar thumbnails
        if (record.thumbnail_url) {
          try {
            const urlParts = record.thumbnail_url.split('/product-images-thumbnails/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              // Intentar eliminar directamente
              const { data: deleteData, error: deleteError } = await supabase.storage
                .from('product-images-thumbnails')
                .remove([filePath]);
              // No logs ni objetos huérfanos
              if (deleteError) {
                // Manejo de error silenciado
              } else {
                // Thumbnail eliminado
              }
            } else {
              // URL no tiene formato correcto
            }
          } catch (error) {
            // Error procesando URL de thumbnail
          }
        } else {
          // No hay thumbnail_url en el registro
        }
      }
      
      // Limpiar thumbnails huérfanos del directorio
      try {
        // Obtener el directorio base del supplier/product
        const firstRecord = imageRecords[0];
        if (firstRecord && firstRecord.image_url) {
          const urlParts = firstRecord.image_url.split('/product-images/');
          if (urlParts.length > 1) {
            const directory = urlParts[1].split('/').slice(0, -1).join('/');
            
            // Listar todos los thumbnails en el directorio
            const { data: thumbnailFiles, error: listError } = await supabase.storage
              .from('product-images-thumbnails')
              .list(directory);
            
            if (!listError && thumbnailFiles && thumbnailFiles.length > 0) {
              
              // Eliminar todos los thumbnails del directorio
              const filesToDelete = thumbnailFiles.map(file => `${directory}/${file.name}`);
              const { data: bulkDeleteData, error: bulkDeleteError } = await supabase.storage
                .from('product-images-thumbnails')
                .remove(filesToDelete);
              
              if (bulkDeleteError) {
                // Error en eliminación masiva
              } else {
                // Thumbnails eliminados
              }
            } else {
              // No se encontraron thumbnails adicionales
            }
          }
        }
      } catch (error) {
        // Error limpiando thumbnails huérfanos
      }
      
      // Verificar si realmente se eliminaron
      for (const record of imageRecords) {
        if (record.image_url) {
          const urlParts = record.image_url.split('/product-images/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            const fileName = filePath.split('/').pop();
            const directory = filePath.split('/').slice(0, -1).join('/');
            const { data: checkData, error: checkError } = await supabase.storage
              .from('product-images')
              .list(directory);
            const fileExists = checkData?.some(file => file.name === fileName);
            // ...log removed...
          }
        }
        if (record.thumbnail_url) {
          const urlParts = record.thumbnail_url.split('/product-images-thumbnails/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            const fileName = filePath.split('/').pop();
            const directory = filePath.split('/').slice(0, -1).join('/');
            const { data: checkData, error: checkError } = await supabase.storage
              .from('product-images-thumbnails')
              .list(directory);
            const fileExists = checkData?.some(file => file.name === fileName);
            // ...log removed...
          }
        }
      }
      // ...log removed...
    } catch (error) {
      // ...log removed...
      throw error;
    }
  },

  /**
   * Limpiar imágenes del producto (método híbrido - BD + búsqueda directa)
   */
  cleanupProductImages: async (productId) => {
    const supplierId = localStorage.getItem('user_id')
    const folderPrefix = `${supplierId}/${productId}/`

    try {
      // MÉTODO 1: Eliminar usando registros de la BD (más confiable)
      const { data: imageRecords, error: dbError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId)

      if (dbError) {
        // ...log removed...
      } else if (imageRecords?.length > 0) {
        // ...log removed...
        
        // Eliminar imágenes originales basándose en las URLs de la BD
        for (const record of imageRecords) {
          if (record.image_url) {
            try {
              const urlParts = record.image_url.split('/product-images/')
              if (urlParts.length > 1) {
                const filePath = urlParts[1]
                const { error: deleteError } = await supabase.storage
                  .from('product-images')
                  .remove([filePath])
                // ...log removed...
              }
            } catch (error) {
              // ...log removed...
            }
          }

          // Eliminar thumbnail si existe
          if (record.thumbnail_url) {
            try {
              const thumbParts = record.thumbnail_url.split('/product-images-thumbnails/')
              if (thumbParts.length > 1) {
                const thumbPath = thumbParts[1]
                const { error: thumbError } = await supabase.storage
                  .from('product-images-thumbnails')
                  .remove([thumbPath])
                // ...log removed...
              }
            } catch (error) {
              // ...log removed...
            }
          }
        }
      } else {
        // No se encontraron registros en BD
      }

      // MÉTODO 2: Backup - buscar archivos directamente en buckets (como fallback)
      
      // Buscar en bucket principal
      const { data: bucketFiles, error: listError } = await supabase.storage
        .from('product-images')
        .list(folderPrefix, { limit: 100 })

      if (listError) {
        // Error listando bucket principal
      } else {
        if (bucketFiles?.length > 0) {
          const toDeleteFromBucket = bucketFiles.map(file => folderPrefix + file.name)
          
          const { error: deleteError } = await supabase.storage
            .from('product-images')
            .remove(toDeleteFromBucket)

          if (deleteError) {
            // Error eliminando archivos adicionales
          } else {
            // Archivos adicionales eliminados
          }
        }
      }

      // Buscar en bucket de thumbnails
      const { data: thumbnailFiles, error: listThumbError } = await supabase.storage
        .from('product-images-thumbnails')
        .list(folderPrefix, { limit: 100 })

      if (listThumbError) {
        // Error listando bucket de thumbnails
      } else {
        if (thumbnailFiles?.length > 0) {
          const toDeleteFromThumbnails = thumbnailFiles.map(file => folderPrefix + file.name)
          
          const { error: deleteThumbError } = await supabase.storage
            .from('product-images-thumbnails')
            .remove(toDeleteFromThumbnails)

          if (deleteThumbError) {
            // Error eliminando thumbnails adicionales
          } else {
            // Thumbnails adicionales eliminados
          }
        }
      }

      // MÉTODO 3: Eliminar referencias de la tabla (siempre al final)
      const { error: dbDeleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      if (dbDeleteError) {
        throw dbDeleteError
      }

    } catch (error) {
      throw error
    }
  },

  /**
   * Procesar especificaciones del producto
   */
  processProductSpecifications: async (productId, specifications) => {
    if (!specifications?.length) {
      return;
    }    // 🔧 Actualizar especificaciones del producto usando el servicio seguro
    await updateProductSpecifications(productId, specifications);
  },
  /**
   * FUNCIÓN PELIGROSA: Eliminar TODAS las imágenes existentes del producto (bucket + BD)
   */
  deleteExistingImages: async (productId) => {
    try {
      const { data: existingImages, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId);

      if (fetchError) {
        return;
      }

      if (existingImages && existingImages.length > 0) {
        // 2. Eliminar archivos del bucket principal y thumbnails
        for (const imageRecord of existingImages) {
          try {
            // Extraer la ruta del archivo de la URL
            const url = imageRecord.image_url;
            const urlParts = url.split('/product-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1]; // ej: "supplierId/productId/filename.png"
              // Eliminar del bucket principal
              const { error: deleteError } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

              // Eliminar del bucket de thumbnails
              const { error: thumbnailDeleteError } = await supabase.storage
                .from('product-images-thumbnails')
                .remove([filePath]);
            }
          } catch (error) {
          }
        }

        // 3. Eliminar registros de la BD
        const { error: dbDeleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
      }
    } catch (error) {
    }
  },

  /**
   * Eliminar imágenes específicas del producto (bucket + BD)
   */
  deleteSpecificImages: async (productId, urlsToDelete) => {
    try {
      // 1. Eliminar archivos del bucket principal y thumbnails
      for (const url of urlsToDelete) {
        try {
          const urlParts = url.split('/product-images/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            // Eliminar del bucket principal
            const { error: deleteError } = await supabase.storage
              .from('product-images')
              .remove([filePath]);

            // Eliminar del bucket de thumbnails
            const { error: thumbnailDeleteError } = await supabase.storage
              .from('product-images-thumbnails')
              .remove([filePath]);
          }
        } catch (error) {
        }
      }

      // 2. Eliminar registros específicos de la BD
      if (urlsToDelete.length > 0) {
        const { error: dbDeleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
          .in('image_url', urlsToDelete);
      }
    } catch (error) {
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
