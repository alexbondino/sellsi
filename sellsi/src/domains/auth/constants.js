// 📁 domains/auth/constants.js
// Constantes del dominio de autenticación

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/crear-cuenta',
  RECOVERY: '/recover',
  CALLBACK: '/auth/callback',
  ONBOARDING: '/onboarding'
};

export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github'
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  REQUIRED_FIELDS: ['email', 'password']
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  WEAK_PASSWORD: 'weak_password',
  NETWORK_ERROR: 'network_error'
};
