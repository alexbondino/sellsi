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
export { useSupplierProducts } from '../../../workspaces/supplier/shared-hooks/useSupplierProducts';

// ========================================
// 🔧 HOOKS ESPECIALIZADOS (Nuevos)
// ========================================
export { default as useSupplierProductsCRUD } from '../../../workspaces/supplier/shared-hooks/useSupplierProductsCRUD';
export { default as useProductImages } from './images';
export { default as useProductSpecifications } from './specifications';
// Re-export shared canonical pricing hook to avoid changing many relative imports
export { default as useProductPriceTiers } from '../../../shared/hooks/product/useProductPriceTiers';
export { default as useProductBackground } from '../../../workspaces/supplier/shared-hooks/useProductBackground';
export { default as useProductCleanup } from '../../../workspaces/supplier/shared-hooks/useProductCleanup';

// ========================================
// 📋 HOOKS MANTENIDOS (Sin cambios)
// ========================================
// useProductForm exports named hooks (useProductForm, useAddProduct, useEditProduct)
export {
  useProductForm,
  useAddProduct,
  useEditProduct,
} from '../../../workspaces/supplier/create-product/hooks/useProductForm';
export { default as useSupplierProductFilters } from '../../../workspaces/supplier/shared-hooks/useSupplierProductFilters';
// useLazyProducts file exports named hooks
export {
  useLazyProducts,
  useProductAnimations,
} from '../../../workspaces/supplier/my-products/hooks/useLazyProducts';

// ========================================
// 🏠 DASHBOARD MANAGEMENT
// ========================================
export {
  useSupplierProductsStoreComposite,
  useSupplierDashboard,
} from './dashboard-management';

// ========================================
// 🔄 LEGACY/COMPATIBILIDAD
// ========================================
// MANTENER para compatibilidad, pero marcado como deprecated
export { default as useSupplierProductsBase } from '../../../workspaces/supplier/shared-hooks/useSupplierProductsBase';
export { useSupplierProductsStoreComposite as useSupplierProductsStore } from './dashboard-management';
