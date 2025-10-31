/**
 * Componentes de validación
 */
// Re-export directly from the implementation file to avoid relying on
// the presence of a subfolder `index.js`. This makes it safe to remove
// the subfolder barrel later.
export { 
  TransferInfoValidationModal, 
  useTransferInfoModal 
} from './TransferInfoValidationModal/TransferInfoValidationModal';
