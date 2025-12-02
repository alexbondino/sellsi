import {
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Work as WorkIcon,
  Close as CloseIcon,
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
  ORDER_CANCEL: 'orderCancel',
  QUOTATION: 'quotation', // Nuevo: Modal de cotización con header azul sellsi
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
    case MODAL_TYPES.ORDER_CANCEL:
      return {
        icon: CloseIcon,
        iconColor: 'error.main',
        iconBgColor: null,
        confirmColor: 'error',
        confirmText: 'Cancelar',
      };
    case MODAL_TYPES.QUOTATION:
      return {
        icon: InfoIcon,
        iconColor: '#fff',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Sí, descargar',
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

// Nota: formatCurrency vive en src/shared/utils/formatters
// Ruta correcta relativa (subir 3 niveles a src/shared):
import { formatCurrency } from '../../../utils/formatters';
import { getRegionDisplay } from '../../../../utils/regionNames';
import { getCommuneDisplay } from '../../../../utils/communeNames';

// --- Helper Functions ---
export const formatAddress = address => {
  if (!address) return 'Sin dirección';

  if (typeof address === 'string') {
    return address.trim() || 'Sin dirección';
  }

  const safe = v => {
    if (!v) return '';
    const s = String(v).trim();
    return /no especificad/i.test(s) ? '' : s;
  };

  // Normalizar posibles alias
  const street = safe(
    address.street || address.address || address.calle || address.address_line
  );
  const number = safe(
    address.number || address.numero || address.address_number
  );
  const dept = safe(
    address.department ||
      address.depto ||
      address.departmento ||
      address.apartment
  );
  const communeRaw = safe(
    address.commune ||
      address.comuna ||
      address.city ||
      address.shipping_commune
  );
  const regionRaw = safe(
    address.region ||
      address.shipping_region ||
      address.estado ||
      address.provincia
  );

  const commune = communeRaw ? getCommuneDisplay(communeRaw) : '';
  const region = regionRaw
    ? getRegionDisplay(regionRaw, { withPrefix: true })
    : '';

  const streetLine = [street, number, dept].filter(Boolean).join(' ');

  const parts = [streetLine, commune, region].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Sin dirección';
};

export { formatCurrency };
