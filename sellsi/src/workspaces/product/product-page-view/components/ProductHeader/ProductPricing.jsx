/**
 * ProductPricing - Muestra precios por volumen o precio único
 *
 * Renderiza:
 * - Tabla de tramos de precio (si existen)
 * - Precio único (si no hay tramos)
 * - Botones de cotización/contacto (si corresponde)
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
  Button,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import IconButton from '@mui/material/IconButton';
import PriceDisplay from '../../../../../shared/components/display/price/PriceDisplay';
import {
  PriceTiersSkeleton,
} from '../skeletons/PriceSkeletons';
import { useSmartSkeleton } from '../../hooks/useSmartSkeleton';
import {
  PRICING_STYLES,
  ACTION_STYLES,
  ICON_BUTTON_CLEAN,
} from '../../styles/productPageStyles';

const ProductPricing = ({
  product,
  tiers = [],
  loadingTiers = false,
  errorTiers = false,
  isLoggedIn = false,
  isOwnProduct = false,
  copied = {},
  onCopyAllTiers,
  onOpenContactModal,
  onOpenQuotationModal,
}) => {
  const showPriceSkeleton = useSmartSkeleton(loadingTiers);

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

  /**
   * Renderiza los botones de cotización/contacto
   */
  const renderQuotationButtons = () => {
    if (!isLoggedIn || isOwnProduct) return null;

    return (
      <Box sx={ACTION_STYLES.containerWithMargin}>
        <Box sx={ACTION_STYLES.row}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Necesitas alguna condición especial?
          </Typography>
          <Button
            variant="text"
            size="small"
            sx={ACTION_STYLES.textButton}
            onClick={onOpenContactModal}
          >
            Contáctanos
          </Button>
        </Box>
        <Box sx={ACTION_STYLES.row}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ¿Quieres saber los detalles de todo?
          </Typography>
          <Button
            variant="text"
            size="small"
            sx={ACTION_STYLES.textButton}
            onClick={onOpenQuotationModal}
          >
            Cotiza aquí
          </Button>
        </Box>
      </Box>
    );
  };

  // Loading state
  if (showPriceSkeleton) {
    return <PriceTiersSkeleton rows={4} />;
  }

  // Error state
  if (errorTiers) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="error.main">
          Error al cargar precios
        </Typography>
        <Tooltip title="Reintenta o revisa tu conexión" arrow>
          <ContentCopyIcon color="disabled" fontSize="small" />
        </Tooltip>
      </Box>
    );
  }

  // Tabla de tramos (si existen)
  if (tiers && tiers.length > 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={PRICING_STYLES.header}>
          <Typography variant="h6" sx={PRICING_STYLES.title}>
            Precios por volumen
          </Typography>
          <Tooltip
            title="El precio varía según la cantidad que compres. Cada tramo indica el precio unitario para ese rango de unidades."
            arrow
            placement="right"
          >
            <InfoOutlinedIcon
              color="action"
              fontSize="small"
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
          <Tooltip title="Copiar todos los precios" arrow placement="right">
            <IconButton
              size="small"
              onClick={onCopyAllTiers}
              sx={ICON_BUTTON_CLEAN}
            >
              {copied.allTiers ? (
                <CheckCircleOutlineIcon color="success" fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer component={Paper} sx={PRICING_STYLES.tableContainer}>
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
                      <TableCell
                        align="center"
                        sx={PRICING_STYLES.quantityCell}
                      >
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

        {renderQuotationButtons()}
      </Box>
    );
  }

  // Precio único (sin tramos)
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%',
      }}
    >
      <Box sx={PRICING_STYLES.headerLeft}>
        <Typography variant="h6" sx={PRICING_STYLES.title}>
          Precio
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={PRICING_STYLES.tableContainerLeft}>
        <Table size="small">
          <TableBody>
            <TableRow hover>
              <TableCell align="center" sx={PRICING_STYLES.quantityCell}>
                Por unidad
              </TableCell>
              <TableCell align="center">
                <PriceDisplay
                  price={product.precio}
                  originalPrice={product.precioOriginal}
                  variant="body1"
                  sx={PRICING_STYLES.singlePriceDisplay}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {renderQuotationButtons()}
    </Box>
  );
};

export default ProductPricing;
