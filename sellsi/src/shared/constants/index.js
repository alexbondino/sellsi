// 📁 shared/constants/index.js
// Barrel export principal para todas las constantes compartidas

// Content exports
export {
  termsContent,
  privacyContent
} from './content';

// ✅ NUEVAS CONSTANTES MIGRADAS DESDE DOMAINS
// Constantes de envío (migradas desde domains/marketplace)
export * from './shipping.js';

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
