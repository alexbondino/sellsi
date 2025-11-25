// ============================================================================
// MARKETPLACE WORKSPACE - MAIN ENTRY POINT
// ============================================================================
// 
// Re-exportación de toda la API pública del workspace marketplace.
// Este archivo es el punto de entrada principal para importar desde
// workspaces/marketplace.
// ============================================================================

// Pages
export { Marketplace, ProviderCatalog } from './pages';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Utils
export * from './utils';

// Components - UI
export { default as FilterPanel } from './components/FilterPanel/FilterPanel.jsx';
export { default as CategoryNavigation, CATEGORIAS } from './components/CategoryNavigation/CategoryNavigation.jsx';
export { default as StockIndicator } from './components/StockIndicator';

// Components - Sections
export { SearchSection, FilterSection, ProductsSection } from './components/sections';
