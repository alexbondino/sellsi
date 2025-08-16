/**
 * ============================================================================
 * PRODUCT BACKGROUND HOOK - PROCESAMIENTO ASÍNCRONO
 * ============================================================================
 *
 * Hook especializado en procesamiento asíncrono y operaciones en background.
 * Coordina múltiples operaciones complejas sin bloquear la UI.
 */

import { create } from 'zustand'

const useProductBackground = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  backgroundTasks: {}, // { productId: { status, progress, startTime, operations } }
  error: null,

  // ============================================================================
  // OPERACIONES EN BACKGROUND
  // ============================================================================

  /**
   * Procesar producto completo en background
   */
  processProductInBackground: async (productId, productData, hooks = {}) => {
    const { 
      imagesHook, 
      specificationsHook, 
      priceTiersHook, 
      crudHook 
    } = hooks

    // Inicializar tarea en background
    set((state) => ({
      backgroundTasks: {
        ...state.backgroundTasks,
        [productId]: {
          status: 'processing',
          progress: 0,
          startTime: Date.now(),
          operations: {
            images: productData.imagenes?.length > 0 ? 'pending' : 'skipped',
            specifications: productData.specifications?.length > 0 ? 'pending' : 'skipped',
            priceTiers: productData.priceTiers?.length > 0 ? 'pending' : 'skipped',
            reload: 'pending'
          }
        }
      },
      error: null,
    }))

    try {
      let completedOperations = 0
      const totalOperations = Object.values({
        images: productData.imagenes?.length > 0,
        specifications: productData.specifications?.length > 0,
        priceTiers: productData.priceTiers?.length > 0,
        reload: true
      }).filter(Boolean).length

      // Función para actualizar progreso
      const updateProgress = (operation, status) => {
        if (status === 'completed') completedOperations++
        
        set((state) => ({
          backgroundTasks: {
            ...state.backgroundTasks,
            [productId]: {
              ...state.backgroundTasks[productId],
              progress: Math.round((completedOperations / totalOperations) * 100),
              operations: {
                ...state.backgroundTasks[productId].operations,
                [operation]: status
              }
            }
          }
        }))
      }

      // 🔥 NUEVO: Procesar imágenes si están definidas (incluso si está vacío para limpiar)
      if (productData.imagenes !== undefined && imagesHook && typeof imagesHook.uploadImages === 'function') {
        updateProgress('images', 'processing')
        
        
        const supplierId = productData.supplier_id || localStorage.getItem('user_id')
        const result = await imagesHook.uploadImages(
          productData.imagenes || [], 
          productId, 
          supplierId,
          { replaceExisting: true } // ahora internamente hace replaceAllProductImages atómico
        )
        
        updateProgress('images', result.success ? 'completed' : 'failed')
        
        if (!result.success) {
          const errorMsg = result.error || result.errors?.join(', ') || 'Error desconocido en procesamiento de imágenes'
          throw new Error(`Error procesando imágenes: ${errorMsg}`)
        }
        
        
        
        // 🔥 NUEVO: COMUNICACIÓN INTELIGENTE EN LUGAR DE REFRESH BLOQUEADO
        if (result.success && crudHook && crudHook.refreshProduct) {
          // En lugar de refresh que causa conflicto, usar comunicación por eventos
          
          // 1. Notificar a componentes que las imágenes están disponibles
          window.dispatchEvent(new CustomEvent('productImagesReady', {
            detail: { 
              productId,
              imageCount: productData.imagenes?.length || 0,
              timestamp: Date.now()
            }
          }))
          
          // 2. Solo actualizar el estado de Zustand SIN refrescar React Query
          setTimeout(async () => {
            if (crudHook.refreshProduct) {
              const refreshResult = await crudHook.refreshProduct(productId)
              if (refreshResult.success) {
                //
              }
            }
          }, 100) // Delay mínimo para no interferir con React Query
        }
      }

      // Procesar especificaciones si existen
      if (productData.specifications?.length > 0 && specificationsHook) {
        updateProgress('specifications', 'processing')
        const result = await specificationsHook.processProductSpecifications(productId, productData.specifications)
        updateProgress('specifications', result.success ? 'completed' : 'failed')
        
        if (!result.success) {
          const errorMsg = result.error || result.errors?.join(', ') || 'Error desconocido en procesamiento de especificaciones'
          throw new Error(`Error procesando especificaciones: ${errorMsg}`)
        }
      }

      // Procesar tramos de precio si existen
      if (productData.priceTiers?.length > 0 && priceTiersHook) {
        updateProgress('priceTiers', 'processing')
        const result = await priceTiersHook.processPriceTiers(productId, productData.priceTiers)
        updateProgress('priceTiers', result.success ? 'completed' : 'failed')
        
        if (!result.success) {
          const errorMsg = result.error || result.errors?.join(', ') || 'Error desconocido en procesamiento de tramos de precio'
          throw new Error(`Error procesando tramos de precio: ${errorMsg}`)
        }
      }

      // 🔥 REFRESH FINAL DESHABILITADO: Conservar React Query cache
      updateProgress('reload', 'processing')
      if (crudHook && crudHook.refreshProduct) {
        // ❌ DESHABILITADO: await crudHook.refreshProduct(productId)
        // Razón: refreshProduct() al final sobreescribe todo el trabajo de setQueryData()
        updateProgress('reload', 'completed')
      } else if (crudHook) {
        // Fallback para backward compatibility
        const supplierId = localStorage.getItem('user_id')
        if (supplierId) {
          await crudHook.loadProducts(supplierId)
        }
      }
      updateProgress('reload', 'completed')

      // Marcar tarea como completada
      set((state) => ({
        backgroundTasks: {
          ...state.backgroundTasks,
          [productId]: {
            ...state.backgroundTasks[productId],
            status: 'completed',
            completedAt: Date.now()
          }
        }
      }))

      return { success: true }
    } catch (error) {
      // Marcar tarea como fallida
      set((state) => ({
        backgroundTasks: {
          ...state.backgroundTasks,
          [productId]: {
            ...state.backgroundTasks[productId],
            status: 'failed',
            error: error.message,
            failedAt: Date.now()
          }
        },
        error: `Error en procesamiento background: ${error.message}`,
      }))

      return { success: false, error: error.message }
    }
  },

  /**
   * Crear producto completo (CRUD + Background processing)
   */
  createCompleteProduct: async (productData, hooks = {}) => {
    const { crudHook } = hooks

    try {
      // 1. Crear producto básico primero
      if (!crudHook) {
        throw new Error('Hook CRUD requerido para crear producto')
      }

      const createResult = await crudHook.createBasicProduct(productData)
      
      if (!createResult.success) {
        const errorMsg = createResult.error || createResult.errors?.join(', ') || 'Error desconocido creando producto'
        throw new Error(errorMsg)
      }

      const productId = createResult.data.productid

      // 2. Procesar elementos complejos en background SIN ESPERAR
      if (productData.imagenes?.length > 0 || 
          productData.specifications?.length > 0 || 
          productData.priceTiers?.length > 0) {
        
        // NO esperar - procesar verdaderamente en background
        get().processProductInBackground(productId, productData, hooks)
          .catch(error => {
            set({ error: `Error procesando en background: ${error.message}` })
          })
      }

      return { success: true, data: createResult.data }
    } catch (error) {
      set({ error: `Error creando producto completo: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar producto completo (CRUD + Background processing)
   */
  updateCompleteProduct: async (productId, updates, hooks = {}) => {
  const { crudHook, priceTiersHook } = hooks

    try {
      // 1. Actualizar campos básicos primero
      if (crudHook) {
        const updateResult = await crudHook.updateBasicProduct(productId, updates)
        
        if (!updateResult.success) {
          const errorMsg = updateResult.error || updateResult.errors?.join(', ') || 'Error desconocido actualizando producto'
          throw new Error(errorMsg)
        }
      }

      // 2. CRÍTICO: Optimismo + procesar priceTiers SINCRÓNICAMENTE cuando hay cambio de pricing
      if (updates.priceTiers !== undefined && priceTiersHook) {
        // Optimistic update en memoria para evitar flash de mapeo antiguo
        try {
          if (crudHook && typeof crudHook.updateLocalProduct === 'function') {
            // Adaptar nombres si vienen en formato de formulario
            const normalizedTiers = (updates.priceTiers || []).map(t => ({
              min_quantity: t.min_quantity ?? t.min ?? null,
              max_quantity: t.max_quantity ?? t.max ?? null,
              price: t.price ?? t.precio ?? 0,
            }))
            crudHook.updateLocalProduct(productId, { priceTiers: normalizedTiers })
          }
        } catch (_) { /* noop */ }

        const priceTierResult = await priceTiersHook.processPriceTiers(productId, updates.priceTiers)
        
        if (!priceTierResult.success) {
          const errorMsg = priceTierResult.error || priceTierResult.errors?.join(', ') || 'Error desconocido procesando tramos de precio'
          throw new Error(`Error procesando priceTiers: ${errorMsg}`)
        }
        // 🔄 Refrescar producto para que product_quantity_ranges se refleje en products[] inmediatamente
        if (crudHook && crudHook.refreshProduct) {
          try { await crudHook.refreshProduct(productId) } catch (e) { /* ignore */ }
        }
      }

      // 3. 🔧 FIX CRÍTICO: Procesar imágenes SIEMPRE en modo edición (array vacío también)
          
      
      if (updates.imagenes !== undefined || updates.specifications?.length > 0) {
        
        // ESPERAR el procesamiento para asegurar que se complete
        try {
          await get().processProductInBackground(productId, updates, hooks)
          
        } catch (error) {
          
          set({ error: `Error procesando en background: ${error.message}` })
          return { success: false, error: error.message }
        }
      }

      // 4. Retornar éxito
      return { success: true }
    } catch (error) {
      set({ error: `Error actualizando producto completo: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Procesar múltiples productos en lotes
   */
  processBatchProducts: async (productsData, hooks = {}, batchSize = 3) => {
    const results = []
    const totalProducts = productsData.length

    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = productsData.slice(i, i + batchSize)
      
      // Procesar lote en paralelo
      const batchPromises = batch.map(productData => 
        get().createCompleteProduct(productData, hooks)
      )

      try {
        const batchResults = await Promise.allSettled(batchPromises)
        results.push(...batchResults)
        
        // Pequeña pausa entre lotes para no sobrecargar
        if (i + batchSize < totalProducts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        results.push({ status: 'rejected', reason: error.message })
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return {
      success: failed === 0,
      results,
      stats: {
        total: totalProducts,
        successful,
        failed
      }
    }
  },

  /**
   * Reintentar tarea fallida
   */
  retryFailedTask: async (productId, productData, hooks = {}) => {
    const state = get()
    const task = state.backgroundTasks[productId]
    
    if (!task || task.status !== 'failed') {
      return { success: false, error: 'No hay tarea fallida para reintentar' }
    }

    // Limpiar estado de error y reintentar
    set((state) => ({
      backgroundTasks: {
        ...state.backgroundTasks,
        [productId]: {
          ...task,
          status: 'retrying',
          retryAt: Date.now(),
          error: null
        }
      },
      error: null,
    }))

    return await get().processProductInBackground(productId, productData, hooks)
  },

  // ============================================================================
  // GESTIÓN DE TAREAS
  // ============================================================================

  /**
   * Obtener estado de tarea
   */
  getTaskStatus: (productId) => {
    const state = get()
    return state.backgroundTasks[productId] || null
  },

  /**
   * Limpiar tarea completada
   */
  clearCompletedTask: (productId) => {
    set((state) => ({
      backgroundTasks: {
        ...state.backgroundTasks,
        [productId]: undefined
      }
    }))
  },

  /**
   * Limpiar todas las tareas completadas
   */
  clearAllCompletedTasks: () => {
    set((state) => {
      const activeTasks = {}
      Object.entries(state.backgroundTasks).forEach(([productId, task]) => {
        if (task && task.status !== 'completed') {
          activeTasks[productId] = task
        }
      })
      
      return { backgroundTasks: activeTasks }
    })
  },

  /**
   * Cancelar tarea en progreso (si es posible)
   */
  cancelTask: (productId) => {
    set((state) => ({
      backgroundTasks: {
        ...state.backgroundTasks,
        [productId]: {
          ...state.backgroundTasks[productId],
          status: 'cancelled',
          cancelledAt: Date.now()
        }
      }
    }))
  },

  /**
   * Obtener estadísticas de tareas
   */
  getTasksStats: () => {
    const state = get()
    const tasks = Object.values(state.backgroundTasks).filter(Boolean)
    
    return {
      total: tasks.length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    }
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Verificar si hay tareas activas
   */
  hasActiveTasks: () => {
    const state = get()
    return Object.values(state.backgroundTasks).some(task => 
      task && (task.status === 'processing' || task.status === 'retrying')
    )
  },

  /**
   * Estimar tiempo restante para una tarea
   */
  estimateTimeRemaining: (productId) => {
    const state = get()
    const task = state.backgroundTasks[productId]
    
    if (!task || task.status !== 'processing') return null
    
    const elapsed = Date.now() - task.startTime
    const progress = task.progress || 0
    
    if (progress === 0) return null
    
    const estimatedTotal = (elapsed / progress) * 100
    const remaining = estimatedTotal - elapsed
    
    return Math.max(0, remaining)
  },
}))

export default useProductBackground
