/**
 * ============================================================================
 * MY-FINANCING COMPONENTS INDEX
 * ============================================================================
 * 
 * Re-exporta todos los componentes del módulo de financiamiento para
 * facilitar las importaciones en otros módulos.
 */

// Componentes principales de lista y tabla
export { default as BuyerFinancingsList } from './BuyerFinancingsList';
export { default as BuyerFinancingTable } from './BuyerFinancingTable';
export * from './BuyerFinancingColumns';

// Componente orquestador principal (legacy - para futuro refactor)
export { default as FinancingModals } from './FinancingModals';

// Modales individuales (en caso de que se necesiten por separado)
export { default as FinancingRequestModal } from './FinancingRequestModal';
export { default as ExtendedRequestModal } from './ExtendedRequestModal';
export { default as ExpressRequestModal } from './ExpressRequestModal';

