// 📁 domains/admin/index.js (LEGACY BARREL - en proceso de deprecación)
// Este archivo re-exporta demasiados componentes y causa ciclos internos.
// Uso externo recomendado: importar desde './domains/admin/index.public.js'.
// Uso interno: importar componentes relativos directos (./components/XYZ) o servicios puntuales.
// TODO: Eliminar componentes de tablas/modales de este barrel una vez migrados todos los importadores.

// Componentes principales
export { default as AdminLogin } from './components/AdminLogin';
export { default as AdminDashboard } from './components/AdminDashboard';
export { default as AdminGuard } from './components/AdminGuard';
export { default as FirstAdminSetup } from './components/FirstAdminSetup';

// Páginas
export { default as AdminPanelHome } from './pages/AdminPanelHome';
export { default as AdminMetrics } from './pages/AdminMetrics';

// Componentes de gestión
// (⚠️ Pendiente de eliminación) Componentes de gestión pesada - mantener temporalmente
export { default as AdminAccountCreator } from './components/AdminAccountCreator'; // TODO remove from barrel
export { default as AdminAccountManager } from './components/AdminAccountManager'; // TODO remove from barrel
export { default as AdminPanelTable } from './components/AdminPanelTable'; // TODO remove from barrel
export { default as UserManagementTable } from './components/UserManagementTable'; // TODO remove from barrel
export { default as ProductMarketplaceTable } from './components/ProductMarketplaceTable'; // TODO remove from barrel

// Componentes de estadísticas y UI
export { default as AdminStatCard } from './components/AdminStatCard';

// Componentes de 2FA
export { default as Setup2FA } from './components/Setup2FA'; // TODO remove
export { default as Manage2FA } from './components/Manage2FA'; // TODO remove

// Servicios
export * from './services';
