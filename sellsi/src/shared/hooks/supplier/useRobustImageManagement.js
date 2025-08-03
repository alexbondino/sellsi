/**
 * ============================================================================
 * USE ROBUST IMAGE MANAGEMENT - HOOK PERSONALIZADO PARA GESTIÓN ROBUSTA
 * ============================================================================
 * 
 * Hook que combina todas las mejoras de gestión de imágenes:
 * - Auto-limpieza de archivos huérfanos
 * - Verificación de integridad de cache
 * - Monitoreo automático de salud
 * - Recuperación automática de errores
 */

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useProductImages from '../images/useProductImages'
import { useCacheManagement } from '../../../shared/services/cache/cacheManagementService'
import { StorageCleanupService } from '../../../shared/services/storage/storageCleanupService'

export const useRobustImageManagement = (productId, options = {}) => {
  const {
    autoCleanup = true,              // Auto-limpieza automática
    healthMonitoring = true,         // Monitoreo de salud del cache
    monitoringInterval = 60000,      // Intervalo de monitoreo (1 minuto)
    autoRepair = true,               // Auto-reparación de cache
    debugMode = false                // Logs detallados
  } = options

  const queryClient = useQueryClient()
  const productImagesStore = useProductImages()
  const cacheManagement = useCacheManagement()
  const monitoringRef = useRef(null)
  const lastHealthCheckRef = useRef(0)

  // ============================================================================
  // FUNCIONES PRINCIPALES
  // ============================================================================

  /**
   * Procesar imágenes con verificación robusta
   */
  const processImages = useCallback(async (images) => {
    if (debugMode) {
      }

    try {
      // Verificar salud del sistema antes de procesar
      const healthCheck = await runHealthCheck()
      
      if (!healthCheck.success && debugMode) {
        }

      // Procesar imágenes usando el store mejorado
      const result = await productImagesStore.processProductImages(productId, images)

      if (result.success && debugMode) {
        }

      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [productId, debugMode, productImagesStore])

  /**
   * Limpiar imágenes con verificación robusta
   */
  const cleanupImages = useCallback(async () => {
    if (debugMode) {
      }

    try {
      const result = await productImagesStore.cleanupProductImages(productId)
      
      if (result.success && debugMode) {
        }

      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [productId, debugMode, productImagesStore])

  /**
   * Ejecutar verificación completa de salud
   */
  const runHealthCheck = useCallback(async () => {
    const now = Date.now()
    
    // Evitar verificaciones muy frecuentes
    if (now - lastHealthCheckRef.current < 5000) {
      return { success: true, cached: true }
    }

    lastHealthCheckRef.current = now

    if (debugMode) {
      }

    try {
      const result = await productImagesStore.runHealthCheck(productId)
      
      if (debugMode) {
        }

      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [productId, debugMode, productImagesStore])

  /**
   * Obtener estadísticas del sistema
   */
  const getStats = useCallback(async () => {
    try {
      return await productImagesStore.getSystemStats()
    } catch (error) {
      return { error: error.message }
    }
  }, [productImagesStore])

  /**
   * Forzar regeneración completa
   */
  const forceRegeneration = useCallback(async () => {
    if (debugMode) {
      }

    try {
      // 1. Limpiar todo el cache relacionado
      await queryClient.invalidateQueries({
        queryKey: ['product-images', productId]
      })
      
      await queryClient.invalidateQueries({
        queryKey: ['thumbnail'],
        predicate: (query) => query.queryKey.includes(productId)
      })

      // 2. Limpiar archivos huérfanos
      const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)

      // 3. Refetch datos
      await queryClient.refetchQueries({
        queryKey: ['product-images', productId]
      })

      if (debugMode) {
        }

      return {
        success: true,
        cleaned: cleanupResult.cleaned,
        errors: cleanupResult.errors
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [productId, debugMode, queryClient])

  // ============================================================================
  // EFECTOS Y MONITOREO
  // ============================================================================

  /**
   * Inicializar monitoreo automático
   */
  useEffect(() => {
    if (!healthMonitoring || !productId) return

    if (debugMode) {
      }

    // Iniciar monitoreo
    const stopMonitoring = productImagesStore.startHealthMonitoring(productId, monitoringInterval)
    monitoringRef.current = stopMonitoring

    // Ejecutar primera verificación
    setTimeout(() => {
      runHealthCheck()
    }, 1000)

    return () => {
      if (monitoringRef.current) {
        monitoringRef.current()
        monitoringRef.current = null
      }
      
      if (debugMode) {
        }
    }
  }, [productId, healthMonitoring, monitoringInterval, debugMode, productImagesStore, runHealthCheck])

  /**
   * Auto-limpieza periódica
   */
  useEffect(() => {
    if (!autoCleanup || !productId) return

    const cleanupInterval = setInterval(async () => {
      try {
        const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)
        
        if (cleanupResult.cleaned > 0 && debugMode) {
          }
      } catch (error) {
        }
    }, monitoringInterval * 2) // Limpieza cada 2 intervalos de monitoreo

    return () => clearInterval(cleanupInterval)
  }, [autoCleanup, productId, monitoringInterval, debugMode])

  // ============================================================================
  // ESTADO DERIVADO
  // ============================================================================

  const isProcessing = productImagesStore.isProcessingImages(productId)
  const error = productImagesStore.error

  // ============================================================================
  // API RETORNADA
  // ============================================================================

  return {
    // Operaciones principales
    processImages,
    cleanupImages,
    forceRegeneration,
    
    // Diagnóstico y mantenimiento
    runHealthCheck,
    getStats,
    
    // Estado
    isProcessing,
    error,
    
    // Utilities
    clearError: productImagesStore.clearError,
    
    // Control de monitoreo
    stopMonitoring: () => {
      if (monitoringRef.current) {
        monitoringRef.current()
        monitoringRef.current = null
      }
    },
    
    // Configuración actual
    config: {
      autoCleanup,
      healthMonitoring,
      monitoringInterval,
      autoRepair,
      debugMode
    }
  }
}

/**
 * Hook simplificado para casos básicos
 */
export const useImageManagement = (productId) => {
  return useRobustImageManagement(productId, {
    autoCleanup: true,
    healthMonitoring: false, // Sin monitoreo para casos simples
    autoRepair: true,
    debugMode: false
  })
}

/**
 * Hook para desarrollo con logging detallado
 */
export const useImageManagementDebug = (productId) => {
  return useRobustImageManagement(productId, {
    autoCleanup: true,
    healthMonitoring: true,
    monitoringInterval: 30000, // 30 segundos en desarrollo
    autoRepair: true,
    debugMode: true
  })
}

export default useRobustImageManagement
