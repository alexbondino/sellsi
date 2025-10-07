export { default as AuthCallback } from '../../../workspaces/auth/login/services/AuthCallback';
export { default as PrivateRoute } from '../../../workspaces/auth/guards/components/PrivateRoute';
export { default as OnboardingForm } from '../../../workspaces/auth/onboarding/components/OnboardingForm';
export { default as Timer } from './Timer';

export { default as useTermsModal } from '../../../workspaces/auth/register/hooks/useTermsModal';
export { default as authService } from './authService.js';
export { default as VerificationCodeInput } from './VerificationCodeInput';

// 📁 domains/auth/index.js
// Barrel exports para el dominio de autenticación

// Componentes principales mínimos (evitar re-export masivo)
export { default as Register } from '../../workspaces/auth/register/components/Register.jsx';
// Otros componentes deben importarse directamente para reducir fan-out.
// Intencionalmente NO se exportan: AuthCallback, PrivateRoute, AccountRecovery, OnboardingForm, Timer, VerificationCodeInput
// Si algún módulo externo los necesita, debe reevaluarse el contrato público antes de exponerlos.

// Wizard API (config / loader)
// Hooks / services / tipos específicos (sin wildcard)
export { useLoginForm } from '../../workspaces/auth/login/hooks/useLoginForm.js';
export { default as useTermsModal } from '../../workspaces/auth/register/hooks/useTermsModal.js';
export { default as authService } from '../../workspaces/auth/shared-services/authService.js';
export * from '../../workspaces/auth/shared-types/types.js';
export * from '../../workspaces/auth/shared-constants/constants.js';
