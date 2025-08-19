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
  SelectChip,
  TaxDocumentSelector,
  BillingInfoForm
} from './forms';

// Feedback (Sprint 2 Fase 2 - COMPLETADO)
export {
  Modal,
  MODAL_TYPES,
  LoadingOverlay,
  SecurityBadge,
  PasswordRequirements
} from './feedback';

// Navigation core exports (refactor: evitamos re-exportar TopBar/SideBar/MobileBar para reducir ciclos)
export { Wizard, Stepper, useWizard } from './navigation/wizard';
export { default as CheckoutProgressStepper } from './navigation/CheckoutProgressStepper';
export { default as ScrollToTop, setSkipScrollToTopOnce } from './navigation/ScrollToTop';
export { default as Switch } from './navigation/Switch';

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

// Layout (refactor: no re-exportar AppShell para evitar dependencias cruzadas con hooks que importan este barrel)
export { default as SuspenseLoader } from './layout/SuspenseLoader';
export { default as NotFound } from './layout/NotFound';
export { default as Widget } from './layout/Widget';
export { default as BannedPageUI } from './layout/bannedpage/BannedPageUI';
export { default as BanInfo } from './layout/bannedpage/BanInfo';

// Cart (Nuevos componentes)
export {
  AddToCart,
  AddToCartModal
} from './cart';
