/**
 * ============================================================================
 * USE SECURE DELETION - HOOK PARA ELIMINACIÓN SEGURA DE PRODUCTOS
 * ============================================================================
 * 
 * Hook que proporciona funcionalidad robusta y segura para eliminar productos
 * con validaciones completas, limpieza automática y auditoría detallada.
 */

import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../services/supabase'
import { StorageCleanupService } from '../services/storage/storageCleanupService'

export const useSecureDeletion = () => {
  const queryClient = useQueryClient()

  /**
   * Eliminar producto de forma segura con todas las validaciones
   * @param {string} productId - ID del producto a eliminar
   * @param {Object} context - Contexto de eliminación
   * @param {boolean} context.isAdmin - Si es eliminación por admin
   * @param {string} context.adminId - ID del admin (si aplica)
   * @param {string} context.supplierId - ID del supplier (si aplica)
   * @returns {Promise<{success: boolean, error?: string, cleaned?: number, productName?: string}>}
   */
  const deleteProductSecurely = async (productId, context = {}) => {
    const { isAdmin = false, adminId = null, supplierId = null } = context

    try {
      // 1. Verificar permisos básicos
      if (!isAdmin && !supplierId) {
        throw new Error('Permisos insuficientes para eliminación')
      }

      if (!productId) {
        throw new Error('ID del producto es requerido')
      }

      // 2. Obtener información del producto antes de eliminar
      const { data: productInfo, error: fetchError } = await supabase
        .from('products')
        .select('productid, productnm, supplier_id')
        .eq('productid', productId)
        .single()

      if (fetchError || !productInfo) {
        throw new Error('Producto no encontrado')
      }

      // 3. Verificar permisos de supplier (solo si no es admin)
      if (!isAdmin && productInfo.supplier_id !== supplierId) {
        throw new Error('No autorizado para eliminar este producto')
      }

      // 4. Limpieza pre-eliminación
      console.log(`🧹 Iniciando limpieza de archivos para producto ${productId}`)
      const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)

      // 5. Eliminar producto de la base de datos
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('productid', productId)

      if (deleteError) {
        throw new Error(`Error al eliminar producto: ${deleteError.message}`)
      }

      // 6. Invalidar caches relacionados
      try {
        await queryClient.invalidateQueries(['products'])
        await queryClient.invalidateQueries(['product-images', productId])
        await queryClient.invalidateQueries(['thumbnails', productId])
        
        console.log(`🔄 Cache invalidado para producto ${productId}`)
      } catch (cacheError) {
        console.warn('⚠️ Error invalidando cache:', cacheError)
        // No fallar por errores de cache
      }

      // 7. Log de auditoría completo
      const logEntry = {
        action: 'product_deleted_securely',
        productId,
        productName: productInfo.productnm,
        deletedBy: isAdmin ? `admin_${adminId}` : `supplier_${supplierId}`,
        filesRemoved: cleanupResult.cleaned,
        timestamp: new Date().toISOString(),
        cleanupErrors: cleanupResult.errors || []
      }

      console.log('✅ Eliminación segura completada:', logEntry)

      return {
        success: true,
        cleaned: cleanupResult.cleaned,
        productName: productInfo.productnm,
        logEntry
      }

    } catch (error) {
      console.error('❌ Error en eliminación segura:', error)
      return { 
        success: false, 
        error: error.message || 'Error desconocido en eliminación segura'
      }
    }
  }

  /**
   * Eliminar múltiples productos de forma segura
   * @param {string[]} productIds - Array de IDs de productos
   * @param {Object} context - Contexto de eliminación
   * @returns {Promise<{success: boolean, results: Array, totalCleaned: number}>}
   */
  const deleteMultipleProductsSecurely = async (productIds, context = {}) => {
    const results = []
    let totalCleaned = 0

    console.log(`🗑️ Iniciando eliminación masiva de ${productIds.length} productos`)

    for (const productId of productIds) {
      try {
        const result = await deleteProductSecurely(productId, context)
        results.push({
          productId,
          ...result
        })

        if (result.success) {
          totalCleaned += result.cleaned || 0
        }

        // Pequeño delay para no sobrecargar el sistema
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount

    console.log(`✅ Eliminación masiva completada: ${successCount} éxitos, ${failCount} fallos, ${totalCleaned} archivos limpiados`)

    return {
      success: failCount === 0,
      results,
      totalCleaned,
      summary: {
        total: productIds.length,
        success: successCount,
        failed: failCount
      }
    }
  }

  /**
   * Verificar si un usuario puede eliminar un producto
   * @param {string} productId - ID del producto
   * @param {Object} context - Contexto de permisos
   * @returns {Promise<{canDelete: boolean, reason?: string}>}
   */
  const canDeleteProduct = async (productId, context = {}) => {
    const { isAdmin = false, supplierId = null } = context

    try {
      if (!productId) {
        return { canDelete: false, reason: 'ID del producto requerido' }
      }

      // Admin puede eliminar cualquier producto
      if (isAdmin) {
        return { canDelete: true }
      }

      // Verificar si el supplier es dueño del producto
      if (!supplierId) {
        return { canDelete: false, reason: 'ID del supplier requerido' }
      }

      const { data: product } = await supabase
        .from('products')
        .select('supplier_id')
        .eq('productid', productId)
        .single()

      if (!product) {
        return { canDelete: false, reason: 'Producto no encontrado' }
      }

      if (product.supplier_id !== supplierId) {
        return { canDelete: false, reason: 'No autorizado para este producto' }
      }

      return { canDelete: true }

    } catch (error) {
      return { 
        canDelete: false, 
        reason: `Error verificando permisos: ${error.message}` 
      }
    }
  }

  return {
    deleteProductSecurely,
    deleteMultipleProductsSecurely,
    canDeleteProduct
  }
}

export default useSecureDeletion
