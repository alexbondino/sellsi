/**
 * @fileoverview SUPPLIER HOOKS - MIGRACIÓN COMPLETADA
 * Todos los hooks han sido migrados físicamente a domains/
 */

// Hooks básicos que YA EXISTEN en domains/
export { default as useSupplierProducts } from './useSupplierProducts'
export { default as useProductForm } from './useProductForm'
export { default as useSupplierProductFilters } from './useSupplierProductFilters'
export { default as useLazyProducts } from './useLazyProducts'
export { default as useSupplierProductsBase } from './useSupplierProductsBase'

// Dashboard Management hooks
export {
  useSupplierProductsStoreComposite,
  useSupplierDashboard
} from './dashboard-management'

// Re-exports para compatibilidad con imports anteriores
export { useSupplierProductsStoreComposite as useSupplierProductsStore } from './dashboard-management'
