// 📁 domains/admin/index.js
// Exportaciones del dominio de administración

// Componentes principales
export { default as AdminLogin } from './components/AdminLogin';
export { default as AdminDashboard } from './components/AdminDashboard';
export { default as AdminGuard } from './components/AdminGuard';
export { default as FirstAdminSetup } from './components/FirstAdminSetup';

// Páginas
export { default as AdminPanelHome } from './pages/AdminPanelHome';

// Componentes de gestión
export { default as AdminAccountCreator } from './components/AdminAccountCreator';
export { default as AdminAccountManager } from './components/AdminAccountManager';
export { default as AdminPanelTable } from './components/AdminPanelTable';
export { default as UserManagementTable } from './components/UserManagementTable';
export { default as ProductMarketplaceTable } from './components/ProductMarketplaceTable';

// Componentes de estadísticas y UI
export { default as AdminStatCard } from './components/AdminStatCard';

// Componentes de 2FA
export { default as Setup2FA } from './components/Setup2FA';
export { default as Manage2FA } from './components/Manage2FA';

// Servicios
export * from './services';
