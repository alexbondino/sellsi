// Public surface minimal del dominio admin (sin re-exportar todos los componentes internos)
// Objetivo: evitar ciclos entre componentes internos que se importaban mutuamente vía barrel completo.

export { default as AdminLogin } from './components/AdminLogin';
export { default as AdminDashboard } from './components/AdminDashboard';
export { default as AdminGuard } from './components/AdminGuard';
export { default as FirstAdminSetup } from './components/FirstAdminSetup';
export { default as AdminPanelHome } from './pages/AdminPanelHome';
export { default as AdminMetrics } from './pages/AdminMetrics';

// Servicios públicos (si son realmente consumidos fuera del dominio)
export * from './services';

// NOTA: Tablas, modales y componentes especializados quedan fuera para reducir fan-out.
