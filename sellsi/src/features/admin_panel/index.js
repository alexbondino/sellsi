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

// Modales
export { default as ConfirmarPagoModal } from './modals/ConfirmarPagoModal';
export { default as RechazarPagoModal } from './modals/RechazarPagoModal';
export { default as DevolverPagoModal } from './modals/DevolverPagoModal';
export { default as DetallesSolicitudModal } from './modals/DetallesSolicitudModal';

// Hooks
export { useAdminLogin } from './hooks';
