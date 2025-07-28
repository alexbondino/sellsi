/**
 * ============================================================================
 * CACHE MANAGEMENT SERVICE - GESTIÓN ROBUSTA DE CACHE DE IMÁGENES
 * ============================================================================
 * 
 * Servicio para gestionar y recuperar cache de React Query de manera robusta.
 * Previene corrupción de cache y garantiza experiencia de usuario consistente.
 */

import { useQueryClient } from '@tanstack/react-query';

export class CacheManagementService {
  constructor(queryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Verificar integridad del cache de imágenes de un producto
   * @param {string} productId - ID del producto
   * @returns {Promise<{isHealthy: boolean, issues: string[], repaired: boolean}>}
   */
  async verifyImageCacheIntegrity(productId) {
    const result = {
      isHealthy: true,
      issues: [],
      repaired: false
    };

    try {
      // 1. Verificar cache de imágenes principales
      const mainCacheKey = ['product-images', productId];
      const mainCache = this.queryClient.getQueryData(mainCacheKey);
      
      if (mainCache) {
        const mainIssues = this.validateImageCacheData(mainCache, 'main');
        if (mainIssues.length > 0) {
          result.isHealthy = false;
          result.issues.push(...mainIssues);
        }
      }

      // 2. Verificar cache de thumbnails
      const thumbnailKeys = this.queryClient.getQueryCache()
        .findAll(['thumbnail'])
        .filter(query => query.queryKey.includes(productId));

      for (const query of thumbnailKeys) {
        const data = query.state.data;
        if (data) {
          const thumbIssues = this.validateImageCacheData(data, 'thumbnail');
          if (thumbIssues.length > 0) {
            result.isHealthy = false;
            result.issues.push(...thumbIssues);
          }
        }
      }

      // 3. Verificar sincronización entre caches
      const syncIssues = await this.verifyCacheSynchronization(productId);
      if (syncIssues.length > 0) {
        result.isHealthy = false;
        result.issues.push(...syncIssues);
      }

      // 4. Auto-reparar si es posible
      if (!result.isHealthy) {
        const repairResult = await this.repairCorruptedCache(productId, result.issues);
        result.repaired = repairResult.success;
      }

      return result;
    } catch (error) {
      result.isHealthy = false;
      result.issues.push(`Error verificando cache: ${error.message}`);
      return result;
    }
  }

  /**
   * Validar datos de cache de imágenes
   * @param {any} data - Datos del cache
   * @param {string} type - Tipo de cache (main/thumbnail)
   * @returns {string[]} Lista de problemas encontrados
   */
  validateImageCacheData(data, type) {
    const issues = [];

    try {
      // Verificar estructura básica
      if (!data || typeof data !== 'object') {
        issues.push(`Cache ${type} tiene estructura inválida`);
        return issues;
      }

      // Para cache de imágenes principales
      if (type === 'main') {
        if (Array.isArray(data)) {
          // Verificar cada imagen en el array
          data.forEach((img, index) => {
            if (!img.image_url || typeof img.image_url !== 'string') {
              issues.push(`Imagen ${index} tiene URL inválida`);
            }
            if (!img.id) {
              issues.push(`Imagen ${index} no tiene ID`);
            }
          });
        } else {
          issues.push('Cache principal no es un array');
        }
      }

      // Para cache de thumbnails
      if (type === 'thumbnail') {
        if (typeof data === 'string') {
          // URL de thumbnail - verificar formato
          if (!data.startsWith('http') && !data.startsWith('blob:')) {
            issues.push('URL de thumbnail tiene formato inválido');
          }
        } else if (data.url) {
          // Objeto con URL
          if (!data.url.startsWith('http') && !data.url.startsWith('blob:')) {
            issues.push('URL de thumbnail en objeto tiene formato inválido');
          }
        } else {
          issues.push('Cache de thumbnail no contiene URL válida');
        }
      }

    } catch (error) {
      issues.push(`Error validando cache ${type}: ${error.message}`);
    }

    return issues;
  }

  /**
   * Verificar sincronización entre diferentes caches
   * @param {string} productId - ID del producto
   * @returns {Promise<string[]>} Lista de problemas de sincronización
   */
  async verifyCacheSynchronization(productId) {
    const issues = [];

    try {
      // Obtener todas las queries relacionadas con este producto
      const allQueries = this.queryClient.getQueryCache().findAll();
      const productQueries = allQueries.filter(query => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes(productId)
        )
      );

      // Verificar que las timestamps sean coherentes
      const timestamps = productQueries
        .map(q => q.state.dataUpdatedAt)
        .filter(t => t > 0);

      if (timestamps.length > 1) {
        const maxTimestamp = Math.max(...timestamps);
        const minTimestamp = Math.min(...timestamps);
        const timeDiff = maxTimestamp - minTimestamp;

        // Si hay más de 5 minutos de diferencia, puede haber desincronización
        if (timeDiff > 5 * 60 * 1000) {
          issues.push(`Desincronización temporal detectada: ${timeDiff}ms de diferencia`);
        }
      }

      // Verificar coherencia de estado
      const failedQueries = productQueries.filter(q => q.state.status === 'error');
      if (failedQueries.length > 0) {
        issues.push(`${failedQueries.length} queries en estado de error`);
      }

      const staleQueries = productQueries.filter(q => q.isStale());
      if (staleQueries.length > productQueries.length * 0.7) {
        issues.push(`${staleQueries.length} queries obsoletas detectadas`);
      }

    } catch (error) {
      issues.push(`Error verificando sincronización: ${error.message}`);
    }

    return issues;
  }

  /**
   * Reparar cache corrompido
   * @param {string} productId - ID del producto
   * @param {string[]} issues - Lista de problemas detectados
   * @returns {Promise<{success: boolean, actions: string[]}>}
   */
  async repairCorruptedCache(productId, issues) {
    const result = {
      success: false,
      actions: []
    };

    try {
      // 1. Invalidar caches corruptos
      const corruptionKeywords = ['estructura inválida', 'URL inválida', 'formato inválido'];
      const hasCorruption = issues.some(issue => 
        corruptionKeywords.some(keyword => issue.includes(keyword))
      );

      if (hasCorruption) {
        // Invalidar cache principal
        await this.queryClient.invalidateQueries({
          queryKey: ['product-images', productId]
        });
        result.actions.push('Cache principal invalidado');

        // Invalidar thumbnails relacionados
        await this.queryClient.invalidateQueries({
          queryKey: ['thumbnail'],
          predicate: (query) => query.queryKey.includes(productId)
        });
        result.actions.push('Thumbnails invalidados');
      }

      // 2. Limpiar queries en error
      const errorKeywords = ['queries en estado de error'];
      const hasErrors = issues.some(issue => 
        errorKeywords.some(keyword => issue.includes(keyword))
      );

      if (hasErrors) {
        const failedQueries = this.queryClient.getQueryCache()
          .findAll()
          .filter(q => 
            q.state.status === 'error' && 
            q.queryKey.some(key => typeof key === 'string' && key.includes(productId))
          );

        for (const query of failedQueries) {
          this.queryClient.removeQueries({ queryKey: query.queryKey });
        }
        result.actions.push(`${failedQueries.length} queries erróneas removidas`);
      }

      // 3. Refrescar datos si hay desincronización
      const syncKeywords = ['Desincronización', 'obsoletas'];
      const hasDesync = issues.some(issue => 
        syncKeywords.some(keyword => issue.includes(keyword))
      );

      if (hasDesync) {
        // Refetch de datos principales
        await this.queryClient.refetchQueries({
          queryKey: ['product-images', productId],
          type: 'active'
        });
        result.actions.push('Datos principales actualizados');
      }

      // 4. Forzar regeneración de thumbnails si es necesario
      const thumbnailIssues = issues.filter(issue => issue.includes('thumbnail'));
      if (thumbnailIssues.length > 0) {
        // Limpiar cache de thumbnails y forzar regeneración
        await this.queryClient.invalidateQueries({
          queryKey: ['thumbnail'],
          predicate: (query) => query.queryKey.includes(productId)
        });
        result.actions.push('Regeneración de thumbnails iniciada');
      }

      result.success = result.actions.length > 0;
      
      if (result.success) {
      }

    } catch (error) {
      result.actions.push(`Error en reparación: ${error.message}`);
    }

    return result;
  }

  /**
   * Crear backup del estado actual del cache
   * @param {string} productId - ID del producto
   * @returns {Promise<{backup: any, timestamp: number}>}
   */
  async createCacheBackup(productId) {
    try {
      const backup = {
        productImages: this.queryClient.getQueryData(['product-images', productId]),
        thumbnails: {},
        metadata: {
          timestamp: Date.now(),
          productId: productId
        }
      };

      // Backup de thumbnails
      const thumbnailQueries = this.queryClient.getQueryCache()
        .findAll(['thumbnail'])
        .filter(query => query.queryKey.includes(productId));

      for (const query of thumbnailQueries) {
        const key = JSON.stringify(query.queryKey);
        backup.thumbnails[key] = {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
          status: query.state.status
        };
      }

      // Guardar en sessionStorage como fallback
      const backupKey = `cache_backup_${productId}_${Date.now()}`;
      try {
        sessionStorage.setItem(backupKey, JSON.stringify(backup));
        backup.metadata.storageKey = backupKey;
      } catch (storageError) {
      }

      return backup;
    } catch (error) {
      return null;
    }
  }

  /**
   * Restaurar cache desde backup
   * @param {any} backup - Backup previamente creado
   * @returns {Promise<boolean>} True si la restauración fue exitosa
   */
  async restoreCacheFromBackup(backup) {
    try {
      if (!backup || !backup.metadata) {
        throw new Error('Backup inválido');
      }

      const { productId } = backup.metadata;

      // Restaurar cache principal
      if (backup.productImages) {
        this.queryClient.setQueryData(['product-images', productId], backup.productImages);
      }

      // Restaurar thumbnails
      if (backup.thumbnails) {
        for (const [keyString, data] of Object.entries(backup.thumbnails)) {
          try {
            const queryKey = JSON.parse(keyString);
            this.queryClient.setQueryData(queryKey, data.data);
          } catch (parseError) {
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitoreo continuo de salud del cache
   * @param {string} productId - ID del producto
   * @param {number} intervalMs - Intervalo de verificación en ms
   * @returns {function} Función para detener el monitoreo
   */
  startCacheHealthMonitoring(productId, intervalMs = 30000) {
    let isActive = true;
    
    const monitor = async () => {
      if (!isActive) return;

      try {
        const health = await this.verifyImageCacheIntegrity(productId);
        
        if (!health.isHealthy) {
          if (health.repaired) {
          }
        }
      } catch (error) {
      }

      // Programar siguiente verificación
      if (isActive) {
        setTimeout(monitor, intervalMs);
      }
    };

    // Iniciar monitoreo
    setTimeout(monitor, intervalMs);

    // Retornar función para detener
    return () => {
      isActive = false;
    };
  }
}

/**
 * Hook personalizado para usar el servicio de gestión de cache
 */
export const useCacheManagement = () => {
  const queryClient = useQueryClient();
  const cacheService = new CacheManagementService(queryClient);

  return {
    verifyIntegrity: (productId) => cacheService.verifyImageCacheIntegrity(productId),
    createBackup: (productId) => cacheService.createCacheBackup(productId),
    restoreBackup: (backup) => cacheService.restoreCacheFromBackup(backup),
    startMonitoring: (productId, interval) => cacheService.startCacheHealthMonitoring(productId, interval),
    repairCache: (productId, issues) => cacheService.repairCorruptedCache(productId, issues)
  };
};

export default CacheManagementService;
