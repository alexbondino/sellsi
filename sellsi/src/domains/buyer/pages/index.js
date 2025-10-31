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
export { default as BuyerOffers } from './offers/BuyerOffers.jsx'

// Componentes reutilizables
// BuyerPerformance removed (file not present)
// StatCard domain-specific removed; use shared StatCard from `shared/components/display/statistics` instead

// Hooks
export { default as useCartStore } from '../../shared/stores/cart/cartStore.js'

// Exportar todos los componentes del carrito
export * from './cart'
