// 📁 features/ui/index.js
// Componentes UI específicos que permanecen en features/ui (no migrados a shared)

// Advanced Loading Components (específicos de UI)
export {
  ProductCardSkeleton,
  ProductSkeletonGrid,
  InitialLoadingState,
  LoadMoreState,
  ScrollProgress,
  EmptyProductsState,
} from './AdvancedLoading';

// Price Tiers (componente específico de pricing)
export { default as PriceTiers } from './PriceTiers';

// Shipping Regions Display (componente específico de shipping)
export { default as ShippingRegionsDisplay } from './ShippingRegionsDisplay';

// Re-exportar hooks de UI si existen
export * from './hooks';

// 📝 NOTA: La mayoría de componentes UI han sido migrados a shared/components/
// Para usar componentes migrados, importar desde shared/components/
