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

// Display (Sprint 2 Fase 3 - COMPLETADO)
export {
  ProductCard,
  ProductCardBuyerContext,
  ProductCardSupplierContext,
  ProductCardProviderContext,
  ActionMenu,
  ProductBadges,
  StatusChip,
  StatsCards,
  StatCard,
  Table,
  TableRows,
  TableFilter,
  BarChart,
  PieChart,
  Banner,
  BannerProvider,
  useBanner,
  RequestList
} from './display';

// Modals (Sprint 2 Fase 3 - COMPLETADO)
export {
  PrivacyPolicyModal,
  TermsAndConditionsModal,
  ProfileImageModal,
  EditProductNameModal,
  DeleteMultipleProductsModal,
  ShippingRegionsModal,
  PaymentMethodCard,
  ContactModal
} from './modals';

// Layout (Sprint 2 Fase 3 - COMPLETADO)  
export {
  SuspenseLoader,
  AppShell,
  NotFound,
  Widget,
  BannedPageUI,
  BanInfo
} from './layout';
