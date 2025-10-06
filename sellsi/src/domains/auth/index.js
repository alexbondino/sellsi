// 📁 domains/auth/index.js
// Barrel exports para el dominio de autenticación

// Componentes principales mínimos (evitar re-export masivo)
export { default as Register } from '../../auth/register/components/Register.jsx';
// Otros componentes deben importarse directamente para reducir fan-out.
// Intencionalmente NO se exportan: AuthCallback, PrivateRoute, AccountRecovery, OnboardingForm, Timer, VerificationCodeInput
// Si algún módulo externo los necesita, debe reevaluarse el contrato público antes de exponerlos.

// Wizard API (config / loader)
// Hooks / services / tipos específicos (sin wildcard)
export { useLoginForm } from '../../auth/login/hooks/useLoginForm.js';
export { default as useTermsModal } from './hooks/useTermsModal';
export { default as authService } from './services/authService.js';
export * from './types';
export * from './constants';
