// 📁 shared/constants/index.js
// Barrel export principal para todas las constantes compartidas

// Content exports
export {
  termsContent,
  privacyContent
} from './content';

// ✅ CONSTANTES MIGRADAS DESDE DOMAINS
// Constantes de descuentos (migradas desde domains/marketplace)
export * from './discounts.js';

// Checkout exports
export {
  CHECKOUT_STEPS,
  CHECKOUT_FLOW,
  getStepByPath,
  getNextStep,
  getPreviousStep
} from './checkout';
