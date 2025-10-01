/**
 * ============================================================================
 * STORAGE HEALTH MONITOR - SISTEMA DE MONITOREO DE SALUD DEL ALMACENAMIENTO
 * ============================================================================
 * 
 * Sistema automatizado para monitorear y mantener la salud del almacenamiento:
 * - Limpieza diaria programada
 * - Detección de archivos huérfanos
 * - Reportes de estado del sistema
 * - Métricas de optimización
 */

import { supabase } from '../../../services/supabase'
import { StorageCleanupService } from './storageCleanupService'

export class StorageHealthMonitor {
  static CLEANUP_SCHEDULE = '0 2 * * *' // Todos los días a las 2 AM
  static REPORT_SCHEDULE = '0 8 * * 1'  // Lunes a las 8 AM (reporte semanal)

  /**
   * Ejecutar limpieza diaria automática
   * @returns {Promise<{success: boolean, report: Object, error?: string}>}
   */
  static async runDailyCleanup() {
    
    
    try {
      const startTime = Date.now()

      // 1. Obtener todos los productos activos
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('productid')

      if (productsError) {
        throw new Error(`Error obteniendo productos: ${productsError.message}`)
      }

      const activeProductIds = activeProducts.map(p => p.productid)
      

      // 2. Ejecutar limpieza masiva
      const cleanupResult = await StorageCleanupService.bulkCleanup(activeProductIds)

      // 3. Detectar productos huérfanos (sin imágenes)
      const orphanProducts = await this.detectOrphanProducts()

      // 4. Calcular métricas de rendimiento
      const executionTime = Date.now() - startTime
      const avgTimePerProduct = activeProductIds.length > 0 ? executionTime / activeProductIds.length : 0

      // 5. Generar reporte completo
      const report = {
        date: new Date().toISOString(),
        executionTime: `${(executionTime / 1000).toFixed(2)} segundos`,
        productsChecked: activeProductIds.length,
        filesRemoved: cleanupResult.totalCleaned,
        errors: cleanupResult.errors,
        orphanProducts: orphanProducts.length,
        storageOptimized: true,
        performance: {
          avgTimePerProduct: `${avgTimePerProduct.toFixed(2)}ms`,
          errorsFound: cleanupResult.errors.length,
          successRate: activeProductIds.length > 0 
            ? `${(((activeProductIds.length - cleanupResult.errors.length) / activeProductIds.length) * 100).toFixed(1)}%`
            : '100%'
        }
      }

      

      // 6. Guardar reporte en la base de datos (opcional)
      await this.saveCleanupReport(report)

      return { success: true, report }

    } catch (error) {
      console.error('❌ [StorageHealthMonitor] Error en limpieza diaria:', error)
      return { 
        success: false, 
        error: error.message,
        report: {
          date: new Date().toISOString(),
          executionTime: '0 segundos',
          productsChecked: 0,
          filesRemoved: 0,
          errors: [error.message],
          orphanProducts: 0,
          storageOptimized: false
        }
      }
    }
  }

  /**
   * Detectar productos sin imágenes o con referencias rotas
   * @returns {Promise<Array>} Array de productos huérfanos
   */
  static async detectOrphanProducts() {
      
    
    try {
      // Obtener productos con imágenes registradas
      const { data: productsWithImages } = await supabase
        .from('product_images')
        .select('product_id')

      // Agrupar por product_id para evitar duplicados
      const productsWithImagesSet = new Set(
        productsWithImages?.map(pi => pi.product_id) || []
      )

      // Obtener todos los productos activos
      const { data: allProducts } = await supabase
        .from('products')
        .select('productid, productnm, supplier_id, created_at')

      if (!allProducts) {
        return []
      }

      // Encontrar productos sin imágenes registradas
      const orphanProducts = allProducts.filter(product => 
        !productsWithImagesSet.has(product.productid)
      )

      

      return orphanProducts

    } catch (error) {
      console.error('❌ [StorageHealthMonitor] Error detectando productos huérfanos:', error)
      return []
    }
  }

  /**
   * Generar reporte semanal de salud del almacenamiento
   * @returns {Promise<{success: boolean, report: Object}>}
   */
  static async generateWeeklyReport() {
    

    try {
      // 1. Obtener estadísticas de productos
      const { data: productStats } = await supabase
        .from('products')
        .select('productid, created_at')

      // 2. Obtener estadísticas de imágenes
      const { data: imageStats } = await supabase
        .from('product_images')
        .select('product_id, image_url, thumbnail_url, created_at')

      // 3. Detectar productos huérfanos
      const orphanProducts = await this.detectOrphanProducts()

      // 4. Calcular métricas del Storage (simulado - requeriría API de Supabase)
      const storageMetrics = await this.estimateStorageUsage()

      // 5. Generar reporte consolidado
      const weeklyReport = {
        reportDate: new Date().toISOString(),
        period: 'última semana',
        summary: {
          totalProducts: productStats?.length || 0,
          totalImages: imageStats?.length || 0,
          orphanProducts: orphanProducts.length,
          storageHealth: orphanProducts.length === 0 ? 'Excelente' : 
                        orphanProducts.length < 10 ? 'Buena' : 'Requiere atención'
        },
        storage: storageMetrics,
        recommendations: this.generateRecommendations(orphanProducts.length, storageMetrics),
        orphanProducts: orphanProducts.slice(0, 10) // Primeros 10 para el reporte
      }

      
      return { success: true, report: weeklyReport }

    } catch (error) {
      console.error('❌ [StorageHealthMonitor] Error generando reporte semanal:', error)
      return { 
        success: false, 
        error: error.message,
        report: { 
          reportDate: new Date().toISOString(),
          error: 'Error generando reporte'
        }
      }
    }
  }

  /**
   * Estimar uso del almacenamiento (simulado)
   * @returns {Promise<Object>} Métricas de almacenamiento
   */
  static async estimateStorageUsage() {
    try {
      // En un entorno real, esto consumiría APIs de Supabase Storage
      // Por ahora, estimamos basado en la cantidad de imágenes
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')

      const estimatedImageSize = (images?.length || 0) * 0.5 // 500KB promedio por imagen
      const estimatedThumbnailSize = (images?.length || 0) * 0.05 // 50KB promedio por thumbnail

      return {
        estimatedTotalSize: `${(estimatedImageSize + estimatedThumbnailSize).toFixed(1)} MB`,
        imageFiles: images?.length || 0,
        thumbnailFiles: images?.length || 0,
        efficiency: 'Óptima' // Placeholder
      }
    } catch (error) {
      return {
        estimatedTotalSize: 'Desconocido',
        imageFiles: 0,
        thumbnailFiles: 0,
        efficiency: 'Error calculando'
      }
    }
  }

  /**
   * Generar recomendaciones basadas en métricas
   * @param {number} orphanCount - Número de productos huérfanos
   * @param {Object} storageMetrics - Métricas de almacenamiento
   * @returns {Array} Array de recomendaciones
   */
  static generateRecommendations(orphanCount, storageMetrics) {
    const recommendations = []

    if (orphanCount > 0) {
      recommendations.push({
        priority: orphanCount > 20 ? 'Alta' : 'Media',
        action: 'Limpiar productos huérfanos',
        description: `${orphanCount} productos sin imágenes detectados`,
        command: 'StorageHealthMonitor.cleanupOrphanProducts()'
      })
    }

    if (storageMetrics.imageFiles > 1000) {
      recommendations.push({
        priority: 'Baja',
        action: 'Optimizar almacenamiento',
        description: 'Considerar compresión adicional de imágenes',
        command: 'Implementar compresión WebP'
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'Info',
        action: 'Mantener monitoreo',
        description: 'Sistema en estado óptimo',
        command: 'Continuar con limpieza automática'
      })
    }

    return recommendations
  }

  /**
   * Guardar reporte de limpieza en base de datos
   * @param {Object} report - Reporte de limpieza
   * @returns {Promise<void>}
   */
  static async saveCleanupReport(report) {
    try {
      // Opcional: Guardar reportes en una tabla dedicada
      // await supabase.from('storage_cleanup_reports').insert(report)
      
    } catch (error) {
      console.warn('⚠️ [StorageHealthMonitor] Error guardando reporte:', error.message)
    }
  }

  /**
   * Limpiar productos huérfanos específicamente
   * @returns {Promise<{success: boolean, cleaned: number}>}
   */
  static async cleanupOrphanProducts() {
    

    try {
      const orphanProducts = await this.detectOrphanProducts()
      
      if (orphanProducts.length === 0) {
        
        return { success: true, cleaned: 0 }
      }

      // Limpiar cada producto huérfano
      let totalCleaned = 0
      for (const product of orphanProducts) {
        try {
          const cleanupResult = await StorageCleanupService.cleanupProductOrphans(product.productid)
          totalCleaned += cleanupResult.cleaned
        } catch (error) {
          console.warn(`⚠️ [StorageHealthMonitor] Error limpiando producto ${product.productid}:`, error.message)
        }
      }

      
      return { success: true, cleaned: totalCleaned }

    } catch (error) {
      console.error('❌ [StorageHealthMonitor] Error en limpieza de huérfanos:', error)
      return { success: false, cleaned: 0, error: error.message }
    }
  }

  /**
   * Obtener métricas de rendimiento del sistema
   * @returns {Promise<Object>} Métricas actuales
   */
  static async getSystemMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        products: {
          total: 0,
          withImages: 0,
          orphans: 0
        },
        storage: {
          estimatedSize: '0 MB',
          efficiency: 'Calculando...'
        },
        lastCleanup: 'Nunca',
        systemHealth: 'Buena'
      }

      // Obtener datos en paralelo
      const [
        { data: products },
        { data: productImages },
        orphanProducts
      ] = await Promise.all([
        supabase.from('products').select('productid'),
        supabase.from('product_images').select('product_id').limit(1000),
        this.detectOrphanProducts()
      ])

      // Actualizar métricas
      metrics.products.total = products?.length || 0
      metrics.products.withImages = new Set(productImages?.map(pi => pi.product_id) || []).size
      metrics.products.orphans = orphanProducts.length

      // Calcular salud del sistema
      if (metrics.products.orphans === 0) {
        metrics.systemHealth = 'Excelente'
      } else if (metrics.products.orphans < 10) {
        metrics.systemHealth = 'Buena'
      } else {
        metrics.systemHealth = 'Requiere atención'
      }

      return metrics

    } catch (error) {
      console.error('❌ [StorageHealthMonitor] Error obteniendo métricas:', error)
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        systemHealth: 'Error'
      }
    }
  }
}

export default StorageHealthMonitor
