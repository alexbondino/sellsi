/**
 * 🔧 Componentes del Panel Administrativo
 * 
 * Exportaciones centralizadas de todos los componentes
 * del panel de control administrativo.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

// Componentes principales
export { default as AdminLogin } from './components/AdminLogin';
export { default as AdminPanelTable } from './components/AdminPanelTable';
export { default as UserManagementTable } from './components/UserManagementTable';
export { default as AdminDashboard } from './components/AdminDashboard';
export { default as AdminStatCard } from './components/AdminStatCard';
export { default as AdminPanelHome } from './AdminPanelHome';

// Componentes de 2FA
export { default as Setup2FA } from './components/Setup2FA';
export { default as Manage2FA } from './components/Manage2FA';

// Modales
export { default as ConfirmarPagoModal } from './modals/ConfirmarPagoModal';
export { default as RechazarPagoModal } from './modals/RechazarPagoModal';
export { default as DevolverPagoModal } from './modals/DevolverPagoModal';
export { default as DetallesSolicitudModal } from './modals/DetallesSolicitudModal';
export { default as UserBanModal } from './modals/UserBanModal';

// Hooks
export { useAdminLogin } from './hooks';
