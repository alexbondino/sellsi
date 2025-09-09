/**
 * ============================================================================
 * DASHBOARD MANAGEMENT HOOKS - HOOK FUNCIONAL REFACTORIZADO
 * ============================================================================
 *
 * Usa el hook funcional nuevo que reemplaza al Zustand store original
 */

// Hook funcional nuevo y completo (named export)
export { useSupplierDashboard } from './useSupplierDashboard'

// Para compatibilidad: el hook funcional sirve para ambos casos
export { useSupplierDashboard as useSupplierProductsStoreComposite } from './useSupplierDashboard'

// Export default: fallback to named hook for compat
export { useSupplierDashboard as default } from './useSupplierDashboard'
