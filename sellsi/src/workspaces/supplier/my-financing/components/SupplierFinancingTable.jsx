/**
 * ============================================================================
 * SUPPLIER FINANCING TABLE COMPONENT
 * ============================================================================
 * 
 * Tabla de solicitudes de financiamiento para proveedores.
 * Componente de presentación puro (stateless) que recibe datos vía props.
 * 
 * Columnas:
 * 1. Solicitado Por (string)
 * 2. Monto (currency formatted)
 * 3. Plazo (días)
 * 4. Datos Empresa (string)
 * 5. Descargables (botón)
 * 6. Estado (chip)
 * 7. Acciones (botones: Aceptar, Rechazar, Firmar)
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Button,
  Box,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ActionIconButton from '../../../../shared/components/buttons/ActionIconButton';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getStateConfig, getAvailableActions } from '../../../../shared/utils/financing/financingStates';

/**
 * Estilos de cabecera de tabla
 */
const headerCellSx = {
  fontWeight: 600,
  backgroundColor: 'grey.100',
  color: 'text.primary',
  fontSize: '0.875rem',
  py: 1.5,
};

/**
 * Componente de tabla para financiamientos
 */
const SupplierFinancingTable = ({
  financings = [],
  onApprove,
  onReject,
  onSign,
  onCancel,
  onViewReason,
  onDownload,
}) => {
  /**
   * Renderiza el estado como texto simple con color
   */
  const renderStatus = (status) => {
    const statusInfo = getStateConfig(status, 'supplier');
    
    // Mapeo de colores MUI a colores de texto
    const colorMap = {
      warning: 'warning.main',
      success: 'success.main',
      error: 'error.main',
      info: 'info.main',
      default: 'text.secondary',
    };

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
   * Renderiza los botones de acción según el estado
   */
  const renderActions = (financing) => {
    const availableActions = getAvailableActions(financing.status, 'supplier');

    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {availableActions.includes('approve') && (
          <ActionIconButton
            tooltip="Aprobar solicitud"
            variant="success"
            onClick={() => onApprove?.(financing)}
            ariaLabel="Aprobar solicitud"
          >
            <CheckIcon fontSize="small" />
          </ActionIconButton>
        )}

        {availableActions.includes('reject') && (
          <ActionIconButton
            tooltip="Rechazar solicitud"
            variant="error"
            onClick={() => onReject?.(financing)}
            ariaLabel="Rechazar solicitud"
          >
            <CloseIcon fontSize="small" />
          </ActionIconButton>
        )}

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

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>Solicitado Por</TableCell>
            <TableCell sx={headerCellSx} align="right">Monto</TableCell>
            <TableCell sx={headerCellSx} align="center">Plazo (días)</TableCell>
            <TableCell sx={headerCellSx}>Datos Empresa</TableCell>
            <TableCell sx={headerCellSx} align="center">Descargables</TableCell>
            <TableCell sx={headerCellSx} align="center">Estado</TableCell>
            <TableCell sx={headerCellSx} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financings.map((financing) => (
            <TableRow
              key={financing.id}
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              {/* Solicitado Por */}
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {financing.requested_by}
                </Typography>
              </TableCell>

              {/* Monto */}
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {formatPrice(financing.amount)}
                </Typography>
              </TableCell>

              {/* Plazo */}
              <TableCell align="center">
                <Typography variant="body2">
                  {financing.term_days}
                </Typography>
              </TableCell>

              {/* Datos Empresa */}
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {financing.business_data}
                </Typography>
              </TableCell>

              {/* Descargables */}
              <TableCell align="center">
                <ActionIconButton
                  tooltip="Descargar documentos"
                  variant="primary"
                  onClick={() => onDownload?.(financing)}
                  ariaLabel="Descargar documentos"
                >
                  <DownloadIcon fontSize="small" />
                </ActionIconButton>
              </TableCell>

              {/* Estado */}
              <TableCell align="center">
                {renderStatus(financing.status)}
              </TableCell>

              {/* Acciones */}
              <TableCell align="center">
                {renderActions(financing)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * ============================================================================
 * TABLA PARA FINANCIAMIENTOS APROBADOS (SUPPLIER)
 * ============================================================================
 */

/**
 * Calcula días de vigencia restantes
 */
const calculateDaysRemaining = (approvedDate, termDays) => {
  if (!approvedDate) return termDays;
  
  const approved = new Date(approvedDate);
  const expiryDate = new Date(approved);
  expiryDate.setDate(expiryDate.getDate() + termDays);
  
  const today = new Date();
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Renderiza días de vigencia con color
 */
const renderDaysRemaining = (financing) => {
  const daysRemaining = calculateDaysRemaining(financing.approved_at, financing.term_days);
  
  let color = 'success.main';
  if (daysRemaining <= 7) color = 'error.main';
  else if (daysRemaining <= 15) color = 'warning.main';
  
  return (
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ color }}
    >
      {daysRemaining} días
    </Typography>
  );
};

/**
 * Tabla de financiamientos aprobados
 */
const SupplierApprovedTable = ({ financings = [] }) => {
  return (
    <TableContainer component={Paper} elevation={1}>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>Comprador</TableCell>
            <TableCell sx={headerCellSx} align="right">Monto Otorgado</TableCell>
            <TableCell sx={headerCellSx} align="right">Monto Utilizado</TableCell>
            <TableCell sx={headerCellSx} align="center">Plazo Otorgado</TableCell>
            <TableCell sx={headerCellSx} align="center">Días de Vigencia</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financings.map((financing) => (
            <TableRow
              key={financing.id}
              hover
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                cursor: 'default',
              }}
            >
              {/* Comprador */}
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {financing.buyer_name || financing.requested_by}
                </Typography>
              </TableCell>

              {/* Monto Otorgado */}
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {formatPrice(financing.amount)}
                </Typography>
              </TableCell>

              {/* Monto Utilizado */}
              <TableCell align="right">
                <Typography variant="body2" fontWeight={500}>
                  {formatPrice(financing.amount_used || 0)}
                </Typography>
              </TableCell>

              {/* Plazo Otorgado */}
              <TableCell align="center">
                <Typography variant="body2">
                  {financing.term_days} días
                </Typography>
              </TableCell>

              {/* Días de Vigencia */}
              <TableCell align="center">
                {renderDaysRemaining(financing)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SupplierFinancingTable;
export { SupplierApprovedTable };
