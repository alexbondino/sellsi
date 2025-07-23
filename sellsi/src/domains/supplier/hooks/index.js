/**
 * ============================================================================
 * SUPPLIER HOOKS - ARQUITECTURA REFACTORIZADA
 * ============================================================================
 * 
 * NUEVOS HOOKS ESPECIALIZADOS (Post-refactor):
 * - useSupplierProducts: Facade principal
 * - useSupplierProductsCRUD: Solo CRUD básico
 * - useProductImages: Solo gestión de imágenes
 * - useProductSpecifications: Solo especificaciones
 * - useProductPriceTiers: Solo tramos de precio
 * - useProductBackground: Solo procesamiento async
 * - useProductCleanup: Solo limpieza de archivos
 * 
 * HOOKS MANTENIDOS:
 * - useSupplierProductFilters: Filtros (sin cambios)
 * - useProductForm: Formularios (sin cambios)
 * - useLazyProducts: Carga lazy (sin cambios)
 */

// ========================================
// 🎯 FACADE PRINCIPAL
// ========================================
export { default as useSupplierProducts } from './useSupplierProducts'

// ========================================
// 🔧 HOOKS ESPECIALIZADOS (Nuevos)
// ========================================
export { default as useSupplierProductsCRUD } from './crud'
export { default as useProductImages } from './images'
export { default as useProductSpecifications } from './specifications'
export { default as useProductPriceTiers } from './pricing'
export { default as useProductBackground } from './background'
export { default as useProductCleanup } from './cleanup'

// ========================================
// 📋 HOOKS MANTENIDOS (Sin cambios)
// ========================================
export { default as useProductForm } from './useProductForm'
export { default as useSupplierProductFilters } from './useSupplierProductFilters'
export { default as useLazyProducts } from './useLazyProducts'

// ========================================
// 🏠 DASHBOARD MANAGEMENT
// ========================================
export {
  useSupplierProductsStoreComposite,
  useSupplierDashboard
} from './dashboard-management'

// ========================================
// 🔄 LEGACY/COMPATIBILIDAD
// ========================================
// MANTENER para compatibilidad, pero marcado como deprecated
export { default as useSupplierProductsBase } from './useSupplierProductsBase'
export { useSupplierProductsStoreComposite as useSupplierProductsStore } from './dashboard-management'
