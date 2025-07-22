// 📁 shared/components/index.js
// Barrel export principal para componentes compartidos

// Formatters
export { TextFormatter } from './formatters';

// Forms (Sprint 2 Fase 1 - COMPLETADO)
export {
  CountrySelector,
  PrimaryButton,
  FileUploader,
  ImageUploader,
  LogoUploader,
  SearchBar,
  SelectChip
} from './forms';

// Feedback (Sprint 2 Fase 2 - COMPLETADO)
export {
  Modal,
  MODAL_TYPES,
  LoadingOverlay,
  SecurityBadge,
  PasswordRequirements
} from './feedback';

// Navigation (Sprint 2 Fase 2 - COMPLETADO)
export {
  Wizard,
  Stepper,
  useWizard,
  CheckoutProgressStepper,
  ScrollToTop,
  setSkipScrollToTopOnce,
  Switch
} from './navigation';
