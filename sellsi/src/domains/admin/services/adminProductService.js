/**
 * 🛒 Servicio de Gestión de Productos Marketplace
 * 
 * Gestiona todas las operaciones sobre productos del marketplace:
 * - Obtener productos disponibles con filtros
 * - Eliminación de productos (individual y múltiple)
 * - Actualización de información de productos
 * - Estadísticas de productos
 * - Gestión de inventario
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'
import { supabase } from '../../../services/supabase'
import { useQueryClient } from '@tanstack/react-query'

// Cache invalidation utility - funciona sin componente React
const invalidateProductCache = (productId) => {
  try {
    // Acceder al query client global si existe
    const queryClient = window.queryClient;
    if (queryClient) {
      console.log(`🔧 [adminProductService] Invalidando cache para producto eliminado:`, productId);
      
      // Invalidar todas las queries relacionadas con thumbnails de este producto
      queryClient.invalidateQueries({
        queryKey: ['thumbnails', productId],
        exact: false
      });
      
      // También invalidar queries de productos en general para refrescar listas
      queryClient.invalidateQueries({
        queryKey: ['marketplace-products'],
        exact: false
      });
      
      // Refrescar queries de productos admin
      queryClient.invalidateQueries({
        queryKey: ['admin-products'],
        exact: false
      });
    }
  } catch (error) {
    console.warn('⚠️ Error invalidando cache del producto:', error);
  }
};

// ========================================
// 📋 GESTIÓN DE PRODUCTOS - CONSULTA
// ========================================

/**
 * Obtener productos del marketplace disponibles
 * @param {object} filters - Filtros opcionales
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getMarketplaceProducts = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Obtener productos básicos con nombres de campo correctos
    let query = supabase
      .from('products')
      .select(`
        productid,
        productnm,
        price,
        productqty,
        minimum_purchase,
        is_active,
        supplier_id,
        createddt,
        product_images (image_url, thumbnail_url, thumbnails)
      `)
      .eq('is_active', true)

    // Aplicar filtros adicionales
    if (filters.supplierId) {
      query = query.eq('supplier_id', filters.supplierId)
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters.search) {
      query = query.ilike('productnm', `%${filters.search}%`)
    }

    const { data: products, error: productsError } = await query
      .order('createddt', { ascending: false })

    if (productsError) {
      throw new Error('Error al cargar productos')
    }

    if (!products || products.length === 0) {
      return []
    }

    // Filtrar productos que cumplen la condición: stock >= compra_minima
    const availableProducts = products.filter(product => {
      const stock = product.productqty || 0
      const minPurchase = product.minimum_purchase || 1
      return stock >= minPurchase
    })

    // Obtener información de los proveedores
    const supplierIds = [...new Set(availableProducts.map(p => p.supplier_id))]
    
    let suppliersData = {}
    if (supplierIds.length > 0) {
      const { data: suppliers, error: suppliersError } = await supabase
        .from('users')
        .select('user_id, user_nm, email')
        .in('user_id', supplierIds)

      if (!suppliersError && suppliers) {
        suppliersData = suppliers.reduce((acc, supplier) => {
          acc[supplier.user_id] = supplier
          return acc
        }, {})
      }
    }

    // Formatear datos para el componente
    const formattedData = availableProducts.map(product => {
      // Obtener imagen principal
      let imagenPrincipal = null
      let thumbnailUrl = null
      let thumbnails = null
      
      if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
        imagenPrincipal = product.product_images[0].image_url
        thumbnailUrl = product.product_images[0].thumbnail_url
        thumbnails = product.product_images[0].thumbnails
      }

      return {
        product_id: product.productid,
        product_name: product.productnm || 'Producto sin nombre',
        price: product.price || 0,
        stock: product.productqty || 0,
        min_purchase: product.minimum_purchase || 1,
        supplier_name: suppliersData[product.supplier_id]?.user_nm || 'Proveedor no encontrado',
        user_id: product.supplier_id || 'N/A',
        imagen: imagenPrincipal,
        thumbnail_url: thumbnailUrl,
        thumbnails: thumbnails,
        created_at: product.createddt
      }
    })

    return formattedData
  }, 'Error al cargar productos del marketplace')
}

/**
 * Obtener detalles completos de un producto
 * @param {string} productId - ID del producto
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getProductDetails = async (productId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId) {
      throw new Error('ID del producto es requerido')
    }

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (image_url, thumbnail_url, thumbnails),
        users!supplier_id (user_nm, email, phone_nbr)
      `)
      .eq('productid', productId)
      .single()

    if (error) {
      throw new Error('Producto no encontrado')
    }

    return product
  }, 'Error obteniendo detalles del producto')
}

/**
 * Obtener estadísticas de productos del marketplace
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getProductStats = async () => {
  return AdminApiService.executeQuery(async () => {
    // Consultar todos los productos activos con nombres de campo correctos
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('productid, productqty, minimum_purchase, is_active, supplier_id')
      .eq('is_active', true)

    if (allError) {
      throw new Error('Error al cargar estadísticas')
    }

    const products = allProducts || []

    // Calcular estadísticas
    const totalProducts = products.length
    
    // Productos realmente activos: stock >= compra_minima (nueva lógica de productos activos)
    const availableProducts = products.filter(p => {
      const stock = p.productqty || 0
      const minPurchase = p.minimum_purchase || 1
      return stock >= minPurchase
    }).length
    
    // Productos con stock bajo (stock < compra_minima)
    const lowStockProducts = products.filter(p => {
      const stock = p.productqty || 0
      const minPurchase = p.minimum_purchase || 1
      return stock < minPurchase && stock > 0
    }).length
    
    // Productos sin stock
    const outOfStockProducts = products.filter(p => (p.productqty || 0) === 0).length
    
    // Proveedores activos únicos
    const activeSuppliers = new Set(products.map(p => p.supplier_id).filter(id => id)).size

    const stats = {
      totalProducts,
      availableProducts,
      lowStockProducts,
      outOfStockProducts,
      activeSuppliers
    }

    return stats
  }, 'Error al cargar estadísticas de productos')
}

// ========================================
// 🗑️ ELIMINACIÓN DE PRODUCTOS
// ========================================

/**
 * Eliminar un producto del marketplace (UX optimizada)
 * @param {string} productId - ID del producto a eliminar
 * @param {string} adminId - ID del administrador que ejecuta la eliminación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProduct = async (productId, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId) {
      throw new Error('ID del producto es requerido')
    }

    // 1. Obtener información del producto para background cleanup
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('supplier_id, productnm')
      .eq('productid', productId)
      .single()

    if (productError) {
      throw new Error('Error al obtener información del producto')
    }

    // 2. Eliminar producto de la BD
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('productid', productId)

    if (error) {
      throw new Error('Error al eliminar producto')
    }

    // 🚀 INVALIDACIÓN PROACTIVA DE CACHÉ
    invalidateProductCache(productId);

    // 3. Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.DELETE_PRODUCT, productId, {
        product_name: product.productnm,
        supplier_id: product.supplier_id
      })
    }

    // 4. Limpiar archivos del storage en background (no bloquea la respuesta)
    const folderPrefix = `${product.supplier_id}/${productId}/`
    
    // Ejecutar limpieza en background sin esperar
    Promise.all([
      // Limpiar bucket principal
      supabase.storage.from('product-images').list(folderPrefix, { limit: 100 })
        .then(({ data: bucketFiles }) => {
          if (bucketFiles?.length > 0) {
            const toDeleteFromBucket = bucketFiles.map(file => folderPrefix + file.name)
            return supabase.storage.from('product-images').remove(toDeleteFromBucket)
          }
        }),
      
      // Limpiar bucket de thumbnails
      supabase.storage.from('product-images-thumbnails').list(folderPrefix, { limit: 100 })
        .then(({ data: thumbnailFiles }) => {
          if (thumbnailFiles?.length > 0) {
            const toDeleteFromThumbnails = thumbnailFiles.map(file => folderPrefix + file.name)
            return supabase.storage.from('product-images-thumbnails').remove(toDeleteFromThumbnails)
          }
        })
    ]).catch(error => {
      console.warn('⚠️ Error limpiando archivos de storage en background:', error)
      // Solo archivos físicos, no afecta la consistencia de datos
    })

    return { deleted: true }
  }, 'Error al eliminar producto')
}

/**
 * Eliminar múltiples productos del marketplace
 * @param {string[]} productIds - Array de IDs de productos a eliminar
 * @param {string} adminId - ID del administrador que ejecuta la eliminación
 * @returns {Promise<{success: boolean, deleted: number, errors: string[], error?: string}>}
 */
export const deleteMultipleProducts = async (productIds, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productIds || productIds.length === 0) {
      throw new Error('No se proporcionaron productos para eliminar')
    }

    let deletedCount = 0
    const errors = []

    // Eliminar productos uno por uno para mejor control de errores
    for (const productId of productIds) {
      try {
        const result = await deleteProduct(productId, adminId)
        if (result.success) {
          deletedCount++
        } else {
          errors.push(`Error eliminando producto ${productId}: ${result.error}`)
        }
      } catch (error) {
        errors.push(`Error eliminando producto ${productId}: ${error.message}`)
      }
    }

    return {
      deleted: deletedCount,
      errors,
      totalRequested: productIds.length
    }
  }, 'Error en eliminación múltiple de productos')
}

// ========================================
// ✏️ ACTUALIZACIÓN DE PRODUCTOS
// ========================================

/**
 * Actualizar nombre de producto
 * @param {string} productId - ID del producto
 * @param {string} newName - Nuevo nombre del producto
 * @param {string} adminId - ID del administrador que ejecuta la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProductName = async (productId, newName, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId || !newName) {
      throw new Error('ID del producto y nuevo nombre son requeridos')
    }

    if (newName.trim().length < 3) {
      throw new Error('El nombre del producto debe tener al menos 3 caracteres')
    }

    if (newName.trim().length > 100) {
      throw new Error('El nombre del producto no puede exceder 100 caracteres')
    }

    // Obtener nombre anterior para auditoría
    const { data: currentProduct } = await supabase
      .from('products')
      .select('productnm')
      .eq('productid', productId)
      .single()

    const { error } = await supabase
      .from('products')
      .update({ 
        productnm: newName.trim(),
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      throw new Error('Error al actualizar el nombre del producto')
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UPDATE_PRODUCT, productId, {
        field_updated: 'product_name',
        old_value: currentProduct?.productnm,
        new_value: newName.trim()
      })
    }

    return { updated: true }
  }, 'Error al actualizar nombre del producto')
}

/**
 * Actualizar precio de producto
 * @param {string} productId - ID del producto
 * @param {number} newPrice - Nuevo precio del producto
 * @param {string} adminId - ID del administrador que ejecuta la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProductPrice = async (productId, newPrice, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId || newPrice === undefined) {
      throw new Error('ID del producto y nuevo precio son requeridos')
    }

    if (newPrice < 0) {
      throw new Error('El precio no puede ser negativo')
    }

    if (newPrice > 99999999) {
      throw new Error('El precio excede el máximo permitido')
    }

    // Obtener precio anterior para auditoría
    const { data: currentProduct } = await supabase
      .from('products')
      .select('price')
      .eq('productid', productId)
      .single()

    const { error } = await supabase
      .from('products')
      .update({ 
        price: newPrice,
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      throw new Error('Error al actualizar el precio del producto')
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UPDATE_PRODUCT, productId, {
        field_updated: 'price',
        old_value: currentProduct?.price,
        new_value: newPrice
      })
    }

    return { updated: true }
  }, 'Error al actualizar precio del producto')
}

/**
 * Actualizar stock de producto
 * @param {string} productId - ID del producto
 * @param {number} newStock - Nuevo stock del producto
 * @param {string} adminId - ID del administrador que ejecuta la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProductStock = async (productId, newStock, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId || newStock === undefined) {
      throw new Error('ID del producto y nuevo stock son requeridos')
    }

    if (newStock < 0) {
      throw new Error('El stock no puede ser negativo')
    }

    if (!Number.isInteger(newStock)) {
      throw new Error('El stock debe ser un número entero')
    }

    // Obtener stock anterior para auditoría
    const { data: currentProduct } = await supabase
      .from('products')
      .select('productqty')
      .eq('productid', productId)
      .single()

    const { error } = await supabase
      .from('products')
      .update({ 
        productqty: newStock,
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      throw new Error('Error al actualizar el stock del producto')
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UPDATE_PRODUCT, productId, {
        field_updated: 'stock',
        old_value: currentProduct?.productqty,
        new_value: newStock
      })
    }

    return { updated: true }
  }, 'Error al actualizar stock del producto')
}

/**
 * Activar/Desactivar producto
 * @param {string} productId - ID del producto
 * @param {boolean} isActive - Estado activo del producto
 * @param {string} adminId - ID del administrador que ejecuta la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const toggleProductStatus = async (productId, isActive, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!productId || isActive === undefined) {
      throw new Error('ID del producto y estado activo son requeridos')
    }

    const { error } = await supabase
      .from('products')
      .update({ 
        is_active: isActive,
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      throw new Error('Error al actualizar estado del producto')
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UPDATE_PRODUCT, productId, {
        field_updated: 'is_active',
        new_value: isActive,
        action: isActive ? 'activated' : 'deactivated'
      })
    }

    return { updated: true }
  }, 'Error al actualizar estado del producto')
}

// ========================================
// 📊 ANÁLISIS Y REPORTES
// ========================================

/**
 * Obtener productos con stock bajo
 * @param {number} threshold - Umbral de stock bajo (default: 5)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getLowStockProducts = async (threshold = 5) => {
  return AdminApiService.executeQuery(async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        productid,
        productnm,
        productqty,
        minimum_purchase,
        supplier_id,
        users!supplier_id (user_nm, email)
      `)
      .eq('is_active', true)
      .lte('productqty', threshold)
      .order('productqty', { ascending: true })

    if (error) {
      throw new Error('Error obteniendo productos con stock bajo')
    }

    return products || []
  }, 'Error obteniendo productos con stock bajo')
}

/**
 * Obtener productos más vendidos (simulado - requiere tabla de ventas)
 * @param {number} limit - Límite de productos a retornar
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getTopSellingProducts = async (limit = 10) => {
  return AdminApiService.executeQuery(async () => {
    // TODO: Implementar cuando se tenga tabla de ventas/órdenes
    // Por ahora retornamos productos ordenados por fecha de creación
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        productid,
        productnm,
        price,
        productqty,
        supplier_id,
        createddt,
        users!supplier_id (user_nm)
      `)
      .eq('is_active', true)
      .order('createddt', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Error obteniendo productos más populares')
    }

    return products || []
  }, 'Error obteniendo productos más populares')
}

/**
 * Obtener reporte de productos por proveedor
 * @param {string} supplierId - ID del proveedor (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getProductsBySupplierReport = async (supplierId = null) => {
  return AdminApiService.executeQuery(async () => {
    let query = supabase
      .from('products')
      .select(`
        supplier_id,
        productid,
        productnm,
        price,
        productqty,
        is_active,
        users!supplier_id (user_nm, email)
      `)

    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    const { data: products, error } = await query
      .order('supplier_id', { ascending: true })

    if (error) {
      throw new Error('Error generando reporte por proveedor')
    }

    // Agrupar por proveedor
    const report = {}
    products?.forEach(product => {
      const supplierId = product.supplier_id
      if (!report[supplierId]) {
        report[supplierId] = {
          supplier_info: product.users,
          total_products: 0,
          active_products: 0,
          total_value: 0,
          products: []
        }
      }

      report[supplierId].total_products++
      if (product.is_active) {
        report[supplierId].active_products++
      }
      report[supplierId].total_value += (product.price || 0) * (product.productqty || 0)
      report[supplierId].products.push(product)
    })

    return report
  }, 'Error generando reporte por proveedor')
}

// ========================================
// 🔧 UTILIDADES Y VALIDACIONES
// ========================================

/**
 * Validar datos de producto
 * @param {object} productData - Datos del producto a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateProductData = (productData) => {
  const errors = []
  
  if (!productData.productnm || productData.productnm.trim().length < 3) {
    errors.push('El nombre del producto debe tener al menos 3 caracteres')
  }
  
  if (productData.productnm && productData.productnm.trim().length > 100) {
    errors.push('El nombre del producto no puede exceder 100 caracteres')
  }

  if (productData.price !== undefined && (productData.price < 0 || productData.price > 10000000)) {
    errors.push('El precio debe estar entre 0 y 10,000,000')
  }
  
  if (productData.productqty !== undefined && (productData.productqty < 0 || !Number.isInteger(productData.productqty))) {
    errors.push('La cantidad debe ser un número entero mayor o igual a 0')
  }
  
  if (productData.minimum_purchase !== undefined && (productData.minimum_purchase < 1 || !Number.isInteger(productData.minimum_purchase))) {
    errors.push('La compra mínima debe ser un número entero mayor a 0')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Calcular disponibilidad real de producto
 * @param {number} stock - Stock actual
 * @param {number} minimumPurchase - Compra mínima
 * @returns {{available: boolean, canSell: number}}
 */
export const calculateProductAvailability = (stock = 0, minimumPurchase = 1) => {
  const available = stock >= minimumPurchase
  const canSell = available ? Math.floor(stock / minimumPurchase) * minimumPurchase : 0
  
  return { available, canSell }
}
