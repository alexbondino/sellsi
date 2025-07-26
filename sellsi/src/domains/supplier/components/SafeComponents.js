/**
 * ============================================================================
 * SUPPLIER COMPONENTS WITH ERROR BOUNDARIES - AUTO-WRAPPERS
 * ============================================================================
 *
 * Este archivo exporta versiones "seguras" de componentes críticos del dominio
 * Supplier, ya envueltos con Error Boundaries apropiados.
 */

import { withSupplierErrorBoundary } from '../ErrorBoundary';

// Import original components
import ProductBasicInfo from '../../pages/my-products/components/ProductBasicInfo';
import ProductInventory from '../../pages/my-products/components/ProductInventory';
import ProductImages from '../../pages/my-products/components/ProductImages';
import ProductRegions from '../../pages/my-products/components/ProductRegions';
import ProductSpecs from '../../pages/my-products/components/ProductSpecs';
import ProductResultsPanel from '../../pages/my-products/components/ProductResultsPanel';

// Create safe versions with Error Boundaries
export const SafeProductBasicInfo = withSupplierErrorBoundary(ProductBasicInfo, {
  errorBoundaryType: 'form'
});

export const SafeProductInventory = withSupplierErrorBoundary(ProductInventory, {
  errorBoundaryType: 'form'
});

export const SafeProductImages = withSupplierErrorBoundary(ProductImages, {
  errorBoundaryType: 'image'
});

export const SafeProductRegions = withSupplierErrorBoundary(ProductRegions, {
  errorBoundaryType: 'form'
});

export const SafeProductSpecs = withSupplierErrorBoundary(ProductSpecs, {
  errorBoundaryType: 'form'
});

export const SafeProductResultsPanel = withSupplierErrorBoundary(ProductResultsPanel, {
  errorBoundaryType: 'supplier'
});

/**
 * Hook para usar componentes seguros en lugar de los originales
 */
export const useSafeComponents = () => ({
  ProductBasicInfo: SafeProductBasicInfo,
  ProductInventory: SafeProductInventory,
  ProductImages: SafeProductImages,
  ProductRegions: SafeProductRegions,
  ProductSpecs: SafeProductSpecs,
  ProductResultsPanel: SafeProductResultsPanel,
});
