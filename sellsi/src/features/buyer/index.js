/**
 * ============================================================================
 * ÍNDICE DE COMPONENTES BUYER - EXPORTACIONES CENTRALIZADAS
 * ============================================================================
 *
 * Archivo de barrel que centraliza las exportaciones de todos los componentes
 * relacionados con la funcionalidad de comprador (buyer).
 *
 * Facilita los imports y mantiene una estructura limpia de dependencias.
 */

// Componentes principales
export { default as BuyerMarketplace } from './marketplace/BuyerMarketplace.jsx';
export { default as BuyerCart } from './my-cart/BuyerCart.jsx';
export { default as BuyerRequests } from './my-requests/BuyerRequests.jsx';
export { default as BuyerPerformance } from './my-performance/BuyerPerformance.jsx';

// Componentes auxiliares
export { default as PriceComparison } from './PriceComparison.jsx';

// Componentes reutilizables
export { default as StatCard } from './components/StatCard.jsx';

// Hooks
export { default as useCartStore } from './hooks/cartStore.js';

// Exportar todos los componentes del carrito
export * from './cart';
