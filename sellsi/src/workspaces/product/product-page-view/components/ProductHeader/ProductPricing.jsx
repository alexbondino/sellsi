/**
 * ProductPricing - Muestra precios por volumen o precio único
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import IconButton from '@mui/material/IconButton';
import PriceDisplay from '../../../../../shared/components/display/price/PriceDisplay';
import { PriceTiersSkeleton } from '../skeletons/PriceSkeletons';
import { useSmartSkeleton } from '../../hooks/useSmartSkeleton';
import {
  PRICING_STYLES,
  ICON_BUTTON_CLEAN,
} from '../../styles/productPageStyles';

/**
 * QuotationButtons - Botones de contacto y cotización
 * Exportado para reutilizar en mobile y desktop
 */
export const QuotationButtons = ({
  isLoggedIn,
  isOwnProduct,
  onOpenContactModal,
  onOpenQuotationModal,
  onOpenFinancingModal,
  financingEnabled = false,
  sx = {},
}) => {
  if (!isLoggedIn || isOwnProduct) return null;

  return (
    <Box
      sx={{
        mt: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        ...sx,
      }}
    >
      {/* Fila 1 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          lineHeight: 1.2,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', lineHeight: 1.2 }}
        >
          ¿Necesitas solicitar alguna condición especial?
        </Typography>

        <Button
          variant="text"
          size="small"
          onClick={onOpenContactModal}
          sx={{
            fontWeight: 600,
            minHeight: 'auto',
            py: 0,
          }}
        >
          Contáctanos
        </Button>
      </Box>

      {/* Fila 2 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          lineHeight: 1.2,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', lineHeight: 1.2 }}
        >
          Obtén el detalle de la operación
        </Typography>

        <Button
          variant="text"
          size="small"
          onClick={onOpenQuotationModal}
          sx={{
            fontWeight: 600,
            minHeight: 'auto',
            py: 0,
          }}
        >
          Cotiza aquí
        </Button>
      </Box>

      {/* Fila 3 - Financiamiento */}
      {financingEnabled && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            lineHeight: 1.2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', lineHeight: 1.2 }}
          >
            ¿Necesitas pagar a plazo?
          </Typography>

          <Button
            variant="text"
            size="small"
            onClick={onOpenFinancingModal}
            sx={{
              fontWeight: 600,
              minHeight: 'auto',
              py: 0,
            }}
          >
            Solicita Financiamiento
          </Button>
        </Box>
      )}
    </Box>
  );
};

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
  onOpenFinancingModal,
  financingEnabled = false,
}) => {
  const showPriceSkeleton = useSmartSkeleton(loadingTiers);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getTierDisplay = (tier, idx, allTiers) => {
    const isLast = idx === allTiers.length - 1;

    if (isLast) {
      return {
        rangeText: `${tier.min_quantity}+ uds`,
        tooltipMessage: `Desde ${
          tier.min_quantity
        } unidades el precio unitario es $${tier.price.toLocaleString(
          'es-CL'
        )}`,
      };
    }

    const nextTier = allTiers[idx + 1];
    const maxQty = nextTier.min_quantity - 1;

    return {
      rangeText: `${tier.min_quantity} - ${maxQty} uds`,
      tooltipMessage: `Entre ${
        tier.min_quantity
      } y ${maxQty} unidades el precio unitario es $${tier.price.toLocaleString(
        'es-CL'
      )}`,
    };
  };

  if (showPriceSkeleton) return <PriceTiersSkeleton rows={4} />;

  if (errorTiers) {
    return (
      <Typography variant="body2" color="error.main" align="center" mb={2}>
        Error al cargar precios
      </Typography>
    );
  }

  if (tiers.length > 0) {
    return (
      <Box
        sx={{ mb: { xs: 2.5, md: 3 }, mt: { xs: 2.5, md: 0 }, width: '100%' }}
      >
        <Box sx={PRICING_STYLES.header}>
          <Typography variant="h6" sx={PRICING_STYLES.title}>
            Precios por volumen
          </Typography>

          <Tooltip title="El precio varía según la cantidad" arrow>
            <InfoOutlinedIcon fontSize="small" />
          </Tooltip>

          <Tooltip title="Copiar todos los precios" arrow>
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

        <TableContainer
          component={Paper}
          sx={{
            ...PRICING_STYLES.tableContainer,
            mb: 0, // 🔥 elimina espacio inferior de la tabla
          }}
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
                  <Tooltip key={idx} title={tooltipMessage} arrow>
                    <TableRow hover sx={{ cursor: 'help' }}>
                      <TableCell
                        align="center"
                        sx={PRICING_STYLES.quantityCell}
                      >
                        {rangeText}
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={700}>
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

        {!isMobile && (
          <QuotationButtons
            isLoggedIn={isLoggedIn}
            isOwnProduct={isOwnProduct}
            onOpenContactModal={onOpenContactModal}
            onOpenQuotationModal={onOpenQuotationModal}
            onOpenFinancingModal={onOpenFinancingModal}
            financingEnabled={financingEnabled}
          />
        )}
      </Box>
    );
  }

  // Precio único (por completitud)
  return (
    <Box
      sx={{
        mb: { xs: 2.5, md: 3 },
        mt: { xs: 2.5, md: 0 },
        width: { xs: '100%', md: '77.5%' },
      }}
    >
      <TableContainer component={Paper} sx={{ mb: 0 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell align="center">Por unidad</TableCell>
              <TableCell align="center">
                <PriceDisplay price={product.precio} variant="body1" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {!isMobile && (
        <QuotationButtons
          isLoggedIn={isLoggedIn}
          isOwnProduct={isOwnProduct}
          onOpenContactModal={onOpenContactModal}
          onOpenQuotationModal={onOpenQuotationModal}
          onOpenFinancingModal={onOpenFinancingModal}
          financingEnabled={financingEnabled}
        />
      )}
    </Box>
  );
};

export default ProductPricing;
