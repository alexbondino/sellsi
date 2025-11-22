/**
 * ============================================================================
 * SHARED MARKETPLACE SECTIONS - BARREL EXPORT
 * ============================================================================
 *
 * Re-exports de secciones de marketplace para uso compartido entre buyer y supplier.
 * Futuro: Estas secciones se migrarán completamente a shared/components/marketplace
 */

// Re-export sections from domains/marketplace
export { default as SearchSection } from '../../../../domains/marketplace/pages/sections/SearchSection.jsx';
export { default as ProductsSection } from '../../../../domains/marketplace/pages/sections/ProductsSection.jsx';

// TODO: Migrar completamente estos componentes a shared cuando se refactorice la UI.
