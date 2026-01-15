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
import InfoPopover from '../../../../shared/components/display/InfoPopover';
import FinancingIdCell from '../../../../shared/components/financing/FinancingIdCell';
import FinancingAmountsCell from '../../../../shared/components/financing/FinancingAmountsCell';
import FinancingDatesCell from '../../../../shared/components/financing/FinancingDatesCell';
import FinancingPlazosCell from '../../../../shared/components/financing/FinancingPlazosCell';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getStateConfig, getAvailableActions, getStateFilterCategory, getApprovedFinancingChip } from '../../../../shared/utils/financing/financingStates';

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
   * Renderiza el estado como chip (basado en categoría de filtro)
   */
  const renderStateChip = (status) => {
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
  const renderStatusDescription = (status) => {
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
        sx={{ color: colorMap[statusInfo.color] || 'text.secondary', whiteSpace: 'pre-line' }}
      >
        {statusInfo.label}
      </Typography>
    );
  };

  /**
   * Renderiza el estado como texto simple con color (DEPRECATED - usar renderStatusDescription)
   */
  const renderStatus = (status) => {
    return renderStatusDescription(status);
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
            <TableCell sx={headerCellSx}>ID</TableCell>
            <TableCell sx={headerCellSx}>Solicitado Por</TableCell>
            <TableCell sx={headerCellSx} align="center">Tipo de Solicitud</TableCell>
            <TableCell sx={headerCellSx} align="right">Monto</TableCell>
            <TableCell sx={headerCellSx} align="center">Plazo (días)</TableCell>
            <TableCell sx={headerCellSx} align="center">Descargables</TableCell>
            <TableCell sx={headerCellSx} align="center">Estado</TableCell>
            <TableCell sx={headerCellSx} align="center">Descripción</TableCell>
            <TableCell sx={headerCellSx} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financings.map((financing) => {
            // Preparar campos para InfoPopover
            const buyerInfoFields = [
              { label: 'Razón Social', value: financing.buyer_legal_name },
              { label: 'RUT Empresa', value: financing.buyer_legal_rut },
              { label: 'Representante Legal', value: financing.buyer_legal_representative_name },
              { label: 'RUT Representante', value: financing.buyer_legal_representative_rut },
              { label: 'Dirección', value: financing.buyer_legal_address },
              { label: 'Comuna', value: financing.buyer_legal_commune },
              { label: 'Región', value: financing.buyer_legal_region },
            ];

            return (
              <TableRow
                key={financing.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                {/* ID */}
                <TableCell>
                  <FinancingIdCell financingId={financing.id} />
                </TableCell>

                {/* Solicitado Por */}
                <TableCell>
                  <InfoPopover
                    label={financing.buyer_user_nm || financing.buyer_legal_name || 'Comprador'}
                    linkText="Ver detalle"
                    title="Información de la Empresa"
                    fields={buyerInfoFields}
                    popoverWidth={460}
                  />
                </TableCell>

                {/* Tipo de Solicitud */}
                <TableCell align="center">
                  <Tooltip
                    title="Tipo de solicitud generada por el comprador"
                    arrow
                    placement="top"
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {financing.request_type === 'express' ? 'Express' : 'Extendida'}
                    </Typography>
                  </Tooltip>
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

              {/* Estado (Chip) */}
              <TableCell align="center">
                {renderStateChip(financing.status)}
              </TableCell>

              {/* Descripción (Texto detallado) */}
              <TableCell align="center">
                {renderStatusDescription(financing.status)}
              </TableCell>

              {/* Acciones */}
              <TableCell align="center">
                {renderActions(financing)}
              </TableCell>
            </TableRow>
          );
          })}
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
 * Tabla de financiamientos aprobados
 */
const SupplierApprovedTable = ({ financings = [] }) => {
  return (
    <TableContainer component={Paper} elevation={1}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>ID</TableCell>
            <TableCell sx={headerCellSx}>Comprador</TableCell>
            <TableCell sx={headerCellSx} align="center">Montos</TableCell>
            <TableCell sx={headerCellSx} align="center">Fecha</TableCell>
            <TableCell sx={headerCellSx} align="center">Plazos</TableCell>
            <TableCell sx={headerCellSx} align="center">Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financings.map((financing) => {
            const chipInfo = getApprovedFinancingChip(financing);
            
            return (
              <TableRow
                key={financing.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  cursor: 'default',
                }}
              >
                {/* ID */}
                <TableCell>
                  <FinancingIdCell financingId={financing.id} />
                </TableCell>

                {/* Comprador */}
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {financing.buyer_name || financing.requested_by}
                  </Typography>
                </TableCell>

                {/* Montos */}
                <TableCell align="center">
                  <FinancingAmountsCell financing={financing} />
                </TableCell>

                {/* Fecha */}
                <TableCell align="center">
                  <FinancingDatesCell financing={financing} />
                </TableCell>

                {/* Plazos */}
                <TableCell align="center">
                  <FinancingPlazosCell financing={financing} />
                </TableCell>

                {/* Estado (Chip) */}
                <TableCell align="center">
                  <Chip
                    label={chipInfo.label}
                    color={chipInfo.color}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SupplierFinancingTable;
export { SupplierApprovedTable };
