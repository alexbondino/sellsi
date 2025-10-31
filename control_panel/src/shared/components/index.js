// 📁 shared/components/index.js
// Barrel export MÍNIMO para Admin Panel

// Forms - Solo lo que usa el admin
export {
  PrimaryButton
} from './forms';

// Feedback - Solo lo que usa el admin
export {
  Modal,
  MODAL_TYPES,
  LoadingOverlay,
  SecurityBadge,
  PasswordRequirements
} from './feedback';

// Display - Solo tabla y estadísticas para admin
export {
  StatsCards,
  StatCard,
  Table,
  TableRows,
  TableFilter,
  RequestList
} from './display';

// Modals - Solo los que usa el admin
export {
  EditProductNameModal,
  DeleteMultipleProductsModal
} from './modals';

// Layout - Mínimo para admin
export { default as SuspenseLoader } from './layout/SuspenseLoader';
export { default as Widget } from './layout/Widget';
