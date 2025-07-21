// 📁 shared/constants/index.js
// Barrel export principal para todas las constantes compartidas

// Content exports
export {
  termsContent,
  privacyContent
} from './content';

// Checkout exports
export {
  CHECKOUT_STEPS,
  CHECKOUT_FLOW,
  getStepByPath,
  getNextStep,
  getPreviousStep
} from './checkout';
