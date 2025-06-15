/**
 * ============================================================================
 * COMPONENTES COMPARTIDOS - EXPORTACIONES CENTRALIZADAS
 * ============================================================================
 *
 * Archivo barrel que centraliza las exportaciones de componentes reutilizables
 * utilizados en múltiples features del sistema.
 */

export { default as QuantitySelector } from './QuantitySelector.jsx'
export { default as LazyImage } from './LazyImage.jsx'
export { 
  default as VirtualizedProductGrid, 
  SmartProductGrid,
  VirtualizedSupplierGrid,
  SmartSupplierGrid 
} from './VirtualizedProductGrid.jsx'
