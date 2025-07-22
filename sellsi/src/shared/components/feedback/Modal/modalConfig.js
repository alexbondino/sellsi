import {
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Work as WorkIcon,
} from '@mui/icons-material';

// --- Configuración de tipos de modal para flexibilidad ---
export const MODAL_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  DELETE: 'delete',
  ORDER_CHECK: 'orderCheck',
  ORDER_TRUCK: 'orderTruck',
  ORDER_BRIEFCASE: 'orderBriefcase',
};

export const getModalConfig = type => {
  switch (type) {
    case MODAL_TYPES.DELETE:
      return {
        icon: DeleteIcon,
        iconColor: '#f44336',
        iconBgColor: 'rgba(244, 67, 54, 0.1)',
        confirmColor: 'error',
        confirmText: 'Eliminar',
        showWarningIcon: false,
      };
    case MODAL_TYPES.WARNING:
      return {
        icon: WarningIcon,
        iconColor: '#ff9800',
        iconBgColor: 'rgba(255, 152, 0, 0.1)',
        confirmColor: 'warning',
        confirmText: 'Continuar',
      };
    case MODAL_TYPES.SUCCESS:
      return {
        icon: CheckCircleIcon,
        iconColor: '#4caf50',
        iconBgColor: 'rgba(76, 175, 80, 0.1)',
        confirmColor: 'success',
        confirmText: 'Aceptar',
      };
    case MODAL_TYPES.ORDER_CHECK:
      return {
        icon: CheckIcon,
        iconColor: 'success.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.ORDER_TRUCK:
      return {
        icon: LocalShippingIcon,
        iconColor: 'primary.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.ORDER_BRIEFCASE:
      return {
        icon: WorkIcon,
        iconColor: 'secondary.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.INFO:
    default:
      return {
        icon: InfoIcon,
        iconColor: '#2196f3',
        iconBgColor: 'rgba(33, 150, 243, 0.1)',
        confirmColor: 'primary',
        confirmText: 'Aceptar',
      };
  }
};

// --- Helper Functions ---
export const formatAddress = address => {
  return `${address.street}, ${address.city}, ${address.region}`;
};

export const formatCurrency = amount => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};
