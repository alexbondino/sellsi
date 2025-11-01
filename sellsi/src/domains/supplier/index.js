// 📁 domains/supplier/index.js
// Exportaciones centrales del dominio supplier

// Pages
export { default as ProviderHome } from '../../workspaces/supplier/home/components/Homee';
export { default as MyProducts } from './pages/my-products/MyProducts';
export { default as AddProduct } from './pages/my-products/AddProduct';
export { default as MyOrdersPage } from './pages/my-orders/MyOrdersPage';
export { default as SupplierOffers } from './pages/offers/SupplierOffers';
// Temporarily forward MarketplaceSupplier to the buyer implementation while we
// remove the legacy supplier-specific page. This keeps the domain barrel stable
// for consumers while we consolidate marketplace views.
export { default as MarketplaceSupplier } from '../buyer/pages/MarketplaceBuyer';
// Hooks - Re-export from hooks/index.js
export * from './hooks';

// Components
export { default as DashboardSummary } from './components/dashboard-summary/DashboardSummary';
