// 📁 domains/supplier/index.js
// Exportaciones centrales del dominio supplier

// Pages
export { default as ProviderHome } from './pages/home/ProviderHome';
export { default as MyProducts } from './pages/my-products/MyProducts';
export { default as AddProduct } from './pages/my-products/AddProduct';
export { default as MyOrdersPage } from './pages/my-orders/MyOrdersPage';
export { default as MarketplaceSupplier } from './pages/MarketplaceSupplier';
export { default as SupplierProfile } from './pages/SupplierProfile';

// Hooks - Re-export from hooks/index.js
export * from './hooks';

// Components
export { default as DashboardSummary } from './components/dashboard-summary/DashboardSummary';
