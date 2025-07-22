/**
 * ============================================================================
 * DASHBOARD MANAGEMENT HOOKS - HOOK FUNCIONAL REFACTORIZADO
 * ============================================================================
 *
 * Usa el hook funcional nuevo que reemplaza al Zustand store original
 */

// Hook funcional nuevo y completo
export { default as useSupplierDashboard } from './useSupplierDashboard'

// Para compatibilidad: el hook funcional sirve para ambos casos
export { default as useSupplierProductsStoreComposite } from './useSupplierDashboard'

// Export default: hook funcional
export { default } from './useSupplierDashboard'
