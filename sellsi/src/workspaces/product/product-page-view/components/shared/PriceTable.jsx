/**
 * PriceTable - Tabla genérica de precios por cantidad/volumen
 *
 * @example
 * // Tabla de tramos
 * <PriceTable
 *   tiers={[
 *     { min_quantity: 1, price: 1000 },
 *     { min_quantity: 10, price: 900 },
 *   ]}
 * />
 *
 * // Con botón de copiar
 * <PriceTable tiers={tiers} showCopyButton onCopy={handleCopy} />
 */
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { PRICING_STYLES, ICON_BUTTON_CLEAN } from '../../styles/productPageStyles';

const PriceTable = ({
  tiers = [],
  title = 'Precios por volumen',
  showTitle = true,
  showInfoTooltip = true,
  showCopyButton = false,
  copied = false,
  onCopy,
  infoTooltipText = 'El precio varía según la cantidad que compres. Cada tramo indica el precio unitario para ese rango de unidades.',
  maxWidth = 400,
  centered = true,
  sx = {},
}) => {
  if (!tiers || tiers.length === 0) {
    return null;
  }

  /**
   * Genera el texto del rango y tooltip para cada tramo
   */
  const getTierDisplay = (tier, idx, allTiers) => {
    const isLastTier = idx === allTiers.length - 1;

    if (isLastTier) {
      return {
        rangeText: `${tier.min_quantity}+ uds`,
        tooltipMessage: `Si compras ${
          tier.min_quantity
        } unidades o más, el precio unitario es $${tier.price.toLocaleString(
          'es-CL'
        )}`,
      };
    }

    const nextTier = allTiers[idx + 1];
    const maxQuantity = nextTier
      ? nextTier.min_quantity - 1
      : tier.max_quantity;

    return {
      rangeText: `${tier.min_quantity} - ${maxQuantity} uds`,
      tooltipMessage: `Si compras entre ${
        tier.min_quantity
      } y ${maxQuantity} unidades, el precio unitario es de $${tier.price.toLocaleString(
        'es-CL'
      )}`,
    };
  };

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {showTitle && (
        <Box sx={centered ? PRICING_STYLES.header : PRICING_STYLES.headerLeft}>
          <Typography variant="h6" sx={PRICING_STYLES.title}>
            {title}
          </Typography>

          {showInfoTooltip && (
            <Tooltip title={infoTooltipText} arrow placement="right">
              <InfoOutlinedIcon
                color="action"
                fontSize="small"
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          )}

          {showCopyButton && onCopy && (
            <Tooltip title="Copiar todos los precios" arrow placement="right">
              <IconButton size="small" onClick={onCopy} sx={ICON_BUTTON_CLEAN}>
                {copied ? (
                  <CheckCircleOutlineIcon color="success" fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={
          centered
            ? { ...PRICING_STYLES.tableContainer, maxWidth }
            : { ...PRICING_STYLES.tableContainerLeft, maxWidth }
        }
      >
        <Table size="small">
          <TableBody>
            {tiers.map((tier, idx) => {
              const { rangeText, tooltipMessage } = getTierDisplay(
                tier,
                idx,
                tiers
              );

              return (
                <Tooltip
                  key={idx}
                  title={tooltipMessage}
                  arrow
                  placement="right"
                >
                  <TableRow hover sx={{ cursor: 'help' }}>
                    <TableCell align="center" sx={PRICING_STYLES.quantityCell}>
                      {rangeText}
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="text.primary" fontWeight={700}>
                        ${tier.price.toLocaleString('es-CL')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </Tooltip>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PriceTable;
