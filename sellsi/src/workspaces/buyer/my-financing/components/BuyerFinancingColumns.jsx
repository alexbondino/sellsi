/**
 * ============================================================================
 * BUYER FINANCING COLUMNS CONFIG
 * ============================================================================
 * 
 * Configuración de columnas para la tabla de financiamientos del Buyer.
 * Define estructura y renderizado de columnas específicas del buyer.
 */

import React from 'react';
import { Typography, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import ActionIconButton from '../../../../shared/components/buttons/ActionIconButton';
import PaymentIcon from '@mui/icons-material/Payment';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getStateConfig, getAvailableActions } from '../../../../shared/utils/financing/financingStates';
import { getFinancingDaysStatus } from '../../../../shared/utils/financingDaysLogic';

/**
 * Mapeo de colores MUI a colores de texto
 */
const colorMap = {
  warning: 'warning.main',
  success: 'success.main',
  error: 'error.main',
  info: 'info.main',
  default: 'text.secondary',
};

/**
 * Renderiza el estado como texto con color
 */
export const renderStatus = (status) => {
  const statusInfo = getStateConfig(status, 'buyer');

  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ color: colorMap[statusInfo.color] || 'text.secondary' }}
    >
      {statusInfo.label}
    </Typography>
  );
};

/**
 * Renderiza los botones de acción para buyer
 */
export const renderBuyerActions = (financing, handlers) => {
  const { onViewReason, onCancel, onSign } = handlers;
  const availableActions = getAvailableActions(financing.status, 'buyer');

  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
      {availableActions.includes('sign') && (
        <ActionIconButton
          tooltip="Firmar documento"
          variant="primary"
          onClick={() => onSign?.(financing)}
          ariaLabel="Firmar documento"
        >
          <DrawIcon fontSize="small" />
        </ActionIconButton>
      )}

      {availableActions.includes('cancel') && (
        <ActionIconButton
          tooltip="Cancelar operación"
          variant="error"
          onClick={() => onCancel?.(financing)}
          ariaLabel="Cancelar operación"
        >
          <CloseIcon fontSize="small" />
        </ActionIconButton>
      )}

      {availableActions.includes('view_reason') && (
        <ActionIconButton
          tooltip="Ver motivo"
          variant="info"
          onClick={() => onViewReason?.(financing)}
          ariaLabel="Ver motivo"
        >
          <VisibilityIcon fontSize="small" />
        </ActionIconButton>
      )}
    </Box>
  );
};

/**
 * Configuración de columnas para tabla desktop
 */
export const getBuyerTableColumns = () => [
  {
    key: 'supplier_name',
    label: 'Proveedor',
    align: 'left',
    render: (financing) => (
      <Typography variant="body2" fontWeight={500}>
        {financing.supplier_name}
      </Typography>
    ),
  },
  {
    key: 'amount',
    label: 'Monto Pactado',
    align: 'right',
    render: (financing) => (
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {formatPrice(financing.amount)}
      </Typography>
    ),
  },
  {
    key: 'term_days',
    label: 'Plazo',
    align: 'center',
    render: (financing) => (
      <Typography variant="body2">
        {financing.term_days} días
      </Typography>
    ),
  },
  {
    key: 'download',
    label: 'Descargables',
    align: 'center',
    render: (financing, handlers) => (
      <ActionIconButton
        tooltip="Descargar documentos"
        variant="primary"
        onClick={() => handlers?.onDownload?.(financing)}
        ariaLabel="Descargar documentos"
      >
        <DownloadIcon fontSize="small" />
      </ActionIconButton>
    ),
  },
  {
    key: 'status',
    label: 'Estado',
    align: 'center',
    render: (financing) => renderStatus(financing.status),
  },
  {
    key: 'actions',
    label: 'Acciones',
    align: 'center',
    render: (financing, handlers) => renderBuyerActions(financing, handlers),
  },
];

/**
 * Configuración de campos para mobile card
 */
export const getBuyerCardFields = () => [
  {
    label: 'Monto',
    key: 'amount',
    render: (financing) => formatPrice(financing.amount),
    fontWeight: 600,
  },
  {
    label: 'Plazo',
    key: 'term_days',
    render: (financing) => `${financing.term_days} días`,
  },
];

/**
 * ============================================================================
 * COLUMNAS PARA FINANCIAMIENTOS APROBADOS (BUYER)
 * ============================================================================
 */

/**
 * Renderiza días de vigencia con color según lógica de negocio:
 * - Verde: lejos de expirar (días restantes > umbral de warning)
 * - Naranja: cercano a expirar (días restantes <= umbral según plazo)
 * - Rojo: expirado (0 días)
 * 
 * Los umbrales de warning varían según el plazo otorgado:
 * - 1-7 días: warning 1 día antes
 * - 8-15 días: warning 3 días antes
 * - 16-44 días: warning 7 días antes
 * - 45+ días: warning 10 días antes
 */
const renderDaysRemaining = (financing) => {
  const { daysRemaining, status } = getFinancingDaysStatus(
    financing.approved_at,
    financing.term_days
  );
  
  // Mapeo de estado a color MUI
  const colorMap = {
    success: 'success.main', // Verde: lejos de expirar
    warning: 'warning.main', // Naranja: cercano a expirar según umbral
    error: 'error.main'      // Rojo: expirado (0 días)
  };
  
  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ color: colorMap[status] }}
    >
      {daysRemaining} días
    </Typography>
  );
};

/**
 * Columnas para tabla de financiamientos aprobados
 */
export const buyerApprovedColumns = [
  {
    key: 'supplier_name',
    label: 'Proveedor',
    align: 'left',
    render: (financing) => (
      <Typography variant="body2" fontWeight={500}>
        {financing.supplier_name}
      </Typography>
    ),
  },
  {
    key: 'amount',
    label: 'Monto Otorgado',
    align: 'right',
    render: (financing) => (
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {formatPrice(financing.amount)}
      </Typography>
    ),
  },
  {
    key: 'amount_used',
    label: 'Monto Utilizado',
    align: 'right',
    render: (financing) => (
      <Typography variant="body2" fontWeight={500}>
        {formatPrice(financing.amount_used || 0)}
      </Typography>
    ),
  },
  {
    key: 'term_days',
    label: 'Plazo Otorgado',
    align: 'center',
    render: (financing) => (
      <Typography variant="body2">
        {financing.term_days} días
      </Typography>
    ),
  },
  {
    key: 'days_remaining',
    label: 'Días de Vigencia',
    align: 'center',
    render: (financing) => renderDaysRemaining(financing),
  },
  {
    key: 'payment_status',
    label: 'Estado',
    align: 'center',
    render: (financing) => (
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          color: financing.payment_status === 'paid' ? 'success.main' : 'warning.main'
        }}
      >
        {financing.payment_status === 'paid' ? 'Pagado' : 'Pendiente de Pago'}
      </Typography>
    ),
  },
  {
    key: 'actions',
    label: 'Pagar en línea',
    align: 'center',
    render: (financing, handlers) => (
      <ActionIconButton
        tooltip="Pagar en línea"
        variant="primary"
        onClick={() => handlers?.onPayOnline?.(financing)}
        ariaLabel="Pagar en línea"
        disabled={financing.payment_status === 'paid'}
      >
        <PaymentIcon fontSize="small" />
      </ActionIconButton>
    ),
  },
];
