// 📁 shared/index.js
// Barrel export principal para todo el módulo shared

// Constants
export {
  termsContent,
  privacyContent,
  CHECKOUT_STEPS,
  CHECKOUT_FLOW,
  getStepByPath,
  getNextStep,
  getPreviousStep
} from './constants';

// Components
export {
  TextFormatter
} from './components';
