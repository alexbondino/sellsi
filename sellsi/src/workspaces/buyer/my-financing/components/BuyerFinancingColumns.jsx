/**
 * ============================================================================
 * BUYER FINANCING COLUMNS CONFIG
 * ============================================================================
 * 
 * Configuración de columnas para la tabla de financiamientos del Buyer.
 * Define estructura y renderizado de columnas específicas del buyer.
 */

import React from 'react';
import { Typography, Box, Chip, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import ActionIconButton from '../../../../shared/components/buttons/ActionIconButton';
import PaymentIcon from '@mui/icons-material/Payment';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getStateConfig, getAvailableActions, getStateFilterCategory, getApprovedFinancingChip } from '../../../../shared/utils/financing/financingStates';
import FinancingIdCell from '../../../../shared/components/financing/FinancingIdCell';
import FinancingAmountsCell from '../../../../shared/components/financing/FinancingAmountsCell';
import FinancingDatesCell from '../../../../shared/components/financing/FinancingDatesCell';
import FinancingPlazosCell from '../../../../shared/components/financing/FinancingPlazosCell';
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
 * Renderiza el estado como chip (basado en categoría de filtro)
 */
export const renderStateChip = (status) => {
  const filterCategory = getStateFilterCategory(status);

  return (
    <Chip
      label={filterCategory.label}
      color={filterCategory.color}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

/**
 * Renderiza la descripción del estado (texto detallado según rol)
 */
export const renderStatusDescription = (status) => {
  const statusInfo = getStateConfig(status, 'buyer');

  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ color: colorMap[statusInfo.color] || 'text.secondary', whiteSpace: 'pre-line' }}
    >
      {statusInfo.label}
    </Typography>
  );
};

/**
 * Renderiza el estado como texto con color (DEPRECATED - usar renderStatusDescription)
 */
export const renderStatus = (status) => {
  return renderStatusDescription(status);
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
    key: 'id',
    label: 'ID',
    align: 'left',
    render: (financing) => <FinancingIdCell financingId={financing.id} />,
  },
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
    key: 'request_type',
    label: 'Tipo de Solicitud',
    align: 'center',
    render: (financing) => (
      <Tooltip
        title="Tipo de solicitud que generaste"
        arrow
        placement="top"
      >
        <Typography variant="body2" fontWeight={500}>
          {financing.request_type === 'express' ? 'Express' : 'Extendida'}
        </Typography>
      </Tooltip>
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
    key: 'state_chip',
    label: 'Estado',
    align: 'center',
    render: (financing) => renderStateChip(financing.status),
  },
  {
    key: 'status_description',
    label: 'Descripción',
    align: 'center',
    render: (financing) => renderStatusDescription(financing.status),
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
 * Columnas para tabla de financiamientos aprobados
 */
export const buyerApprovedColumns = [
  {
    key: 'id',
    label: 'ID',
    align: 'left',
    render: (financing) => <FinancingIdCell financingId={financing.id} />,
  },
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
    key: 'amounts',
    label: 'Montos',
    align: 'center',
    render: (financing) => <FinancingAmountsCell financing={financing} />,
  },
  {
    key: 'dates',
    label: 'Fecha',
    align: 'center',
    render: (financing) => <FinancingDatesCell financing={financing} />,
  },
  {
    key: 'plazos',
    label: 'Plazos',
    align: 'center',
    render: (financing) => <FinancingPlazosCell financing={financing} />,
  },
  {
    key: 'payment_status',
    label: 'Estado',
    align: 'center',
    render: (financing) => {
      const chipInfo = getApprovedFinancingChip(financing);
      return (
        <Chip
          label={chipInfo.label}
          color={chipInfo.color}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    },
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
