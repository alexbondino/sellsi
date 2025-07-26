// 📁 domains/auth/index.js
// Barrel exports para el dominio de autenticación

// Componentes principales
export { default as Login } from './components/Login';
export { default as Register } from './components/Register';
export { default as AuthCallback } from './components/AuthCallback';
export { default as PrivateRoute } from './components/PrivateRoute';
export { default as AccountRecovery } from './components/AccountRecovery';

// Hooks de autenticación
export * from './hooks';

// Services de autenticación
export * from './services';

// Tipos y constantes
export * from './types';
export * from './constants';
