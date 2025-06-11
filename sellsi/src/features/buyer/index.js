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
export { default as MarketplaceBuyer } from './MarketplaceBuyer.jsx'
export { default as BuyerCart } from './BuyerCart.jsx'
export { default as BuyerOrders } from './BuyerOrders.jsx'
export { default as BuyerPerformance } from './BuyerPerformance.jsx'

// Componentes auxiliares
export { default as PriceComparison } from './PriceComparison.jsx'

// Componentes reutilizables
export { default as StatCard } from './components/StatCard.jsx'

// Hooks
export { default as useCartStore } from './hooks/cartStore.js'

// Exportar todos los componentes del carrito
export * from './cart'
