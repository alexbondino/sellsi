/**
 * ============================================================================
 * CART HISTORY HOOK - GESTIÓN DE HISTORIAL Y UNDO/REDO
 * ============================================================================
 *
 * Hook independiente para manejar el historial de acciones del carrito.
 * Incluye funcionalidades de undo/redo y seguimiento de acciones.
 */

import { create } from 'zustand'

// Helper function para describir acciones del historial
const getActionDescription = (actionType, actionData) => {
  switch (actionType) {
    case 'addItem':
      return `Agregado: ${actionData.productName || 'Producto'} (${
        actionData.quantity || 1
      })`
    case 'removeItem':
      return `Eliminado: ${actionData.productName || 'Producto'}`
    case 'updateQuantity':
      return `Cantidad cambiada: ${actionData.productName || 'Producto'} (${
        actionData.oldQuantity || '?'
      } → ${actionData.newQuantity || '?'})`
    case 'applyCoupon':
      return `Cupón aplicado: ${actionData.couponCode || 'Desconocido'}`
    case 'removeCoupon':
      return `Cupón removido: ${actionData.couponCode || 'Desconocido'}`
    case 'clearCart':
      return `Carrito limpiado (${actionData.itemCount || 0} productos)`
    case 'setShipping':
      return `Envío cambiado: ${actionData.shippingName || 'Desconocido'}`
    default:
      return 'Acción en el carrito'
  }
}

/**
 * Hook para gestión de historial del carrito
 */
const useCartHistory = create((set, get) => ({
  // Estado del historial
  history: [],
  historyIndex: -1,

  // === FUNCIONES DE HISTORIAL ===

  /**
   * Guardar estado en historial con información detallada
   * @param {Object} currentState - Estado actual del carrito
   * @param {string} actionType - Tipo de acción realizada
   * @param {Object} actionData - Datos adicionales de la acción
   */
  saveToHistory: (currentState, actionType = 'unknown', actionData = {}) => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)

    // Crear snapshot con información detallada
    const snapshot = {
      items: [...(currentState.items || [])],
      appliedCoupons: [...(currentState.appliedCoupons || [])],
      selectedShipping: currentState.selectedShipping || 'standard',
      timestamp: Date.now(),
      action: {
        type: actionType,
        data: actionData,
        description: getActionDescription(actionType, actionData),
      },
    }

    newHistory.push(snapshot)

    // Mantener solo los últimos 30 estados
    if (newHistory.length > 30) {
      newHistory.shift()
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  /**
   * Obtener información sobre la próxima acción a deshacer
   */
  getUndoInfo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const currentSnapshot = state.history[state.historyIndex]
      return {
        canUndo: true,
        action: currentSnapshot.action,
        timestamp: currentSnapshot.timestamp,
      }
    }
    return { canUndo: false }
  },

  /**
   * Obtener información sobre la próxima acción a rehacer
   */
  getRedoInfo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const nextSnapshot = state.history[state.historyIndex + 1]
      return {
        canRedo: true,
        action: nextSnapshot.action,
        timestamp: nextSnapshot.timestamp,
      }
    }
    return { canRedo: false }
  },

  /**
   * Obtener historial completo con información
   */
  getHistoryInfo: () => {
    const state = get()
    return {
      totalStates: state.history.length,
      currentIndex: state.historyIndex,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
      recentActions: state.history.slice(-10).map((snapshot) => ({
        description: snapshot.action?.description || 'Acción desconocida',
        timestamp: snapshot.timestamp,
        type: snapshot.action?.type || 'unknown',
      })),
    }
  },

  /**
   * Deshacer acción
   * @param {Function} onRestore - Callback para restaurar el estado en el store principal
   */
  undo: (onRestore) => {
    const state = get()
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1]

      // Restaurar estado en el store principal
      if (onRestore && typeof onRestore === 'function') {
        onRestore({
          items: [...previousState.items],
          appliedCoupons: [...previousState.appliedCoupons],
          selectedShipping: previousState.selectedShipping,
        })
      }

      set({
        historyIndex: state.historyIndex - 1,
      })

      toast.success('Acción deshecha', { icon: '↩️' })
      return true
    }
    return false
  },

  /**
   * Rehacer acción
   * @param {Function} onRestore - Callback para restaurar el estado en el store principal
   */
  redo: (onRestore) => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1]

      // Restaurar estado en el store principal
      if (onRestore && typeof onRestore === 'function') {
        onRestore({
          items: [...nextState.items],
          appliedCoupons: [...nextState.appliedCoupons],
          selectedShipping: nextState.selectedShipping,
        })
      }

      set({
        historyIndex: state.historyIndex + 1,
      })

      toast.success('Acción rehecha', { icon: '↪️' })
      return true
    }
    return false
  },

  /**
   * Limpiar historial
   */
  clearHistory: () => {
    set({
      history: [],
      historyIndex: -1,
    })
  },

  /**
   * Resetear historial (para demos)
   */
  resetHistory: () => {
    set({
      history: [],
      historyIndex: -1,
    })
  },
}))

export default useCartHistory
