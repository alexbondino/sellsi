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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import IconButton from '@mui/material/IconButton';
import PriceDisplay from '../../../../../shared/components/display/price/PriceDisplay';
import { PriceTiersSkeleton } from '../skeletons/PriceSkeletons';
import { useSmartSkeleton } from '../../hooks/useSmartSkeleton';
import {
  PRICING_STYLES,
  ICON_BUTTON_CLEAN,
} from '../../styles/productPageStyles';

/**
 * ActionCard - Tarjeta de acción reutilizable para las 3 opciones CTA
 */
const ActionCard = ({
  icon,
  label,
  description,
  onClick,
  featured = false,
}) => (
  <Box
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: { xs: 1.5, sm: 2 },
      px: { xs: 1.5, sm: 2 },
      py: { xs: 1.25, sm: 1.5 },
      borderRadius: 2,
      cursor: 'pointer',
      border: featured ? '2px solid #2E52B2' : '1px solid',
      borderColor: featured ? '#2E52B2' : 'divider',
      background: 'background.paper',
      boxShadow: featured
        ? '0 2px 10px rgba(46,82,178,0.15)'
        : '0 1px 4px rgba(0,0,0,0.07)',
      transition: 'all 0.18s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: featured
          ? '0 6px 20px rgba(46,82,178,0.25)'
          : '0 4px 12px rgba(0,0,0,0.12)',
        borderColor: featured ? '#1a3a8f' : 'primary.main',
      },
      '&:active': { transform: 'translateY(0)' },
      outline: 'none',
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: '2px',
      },
    }}
  >
    {/* Icono */}
    <Box
      sx={{
        flexShrink: 0,
        width: { xs: 36, sm: 40 },
        height: { xs: 36, sm: 40 },
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(46,82,178,0.10) 0%, rgba(46,82,178,0.04) 100%)',
        color: 'primary.main',
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: { xs: '1.15rem', sm: '1.3rem' } } })}
    </Box>

    {/* Texto */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
          lineHeight: 1.3,
          color: 'text.primary',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          lineHeight: 1.3,
          color: 'text.secondary',
          mt: 0.25,
        }}
      >
        {description}
      </Typography>
    </Box>

    {/* Flecha */}
    <ArrowForwardIcon
      sx={{
        flexShrink: 0,
        fontSize: '1rem',
        color: 'text.disabled',
        transition: 'transform 0.15s ease',
        '.MuiBox-root:hover &': { transform: 'translateX(3px)' },
      }}
    />
  </Box>
);

/**
 * QuotationButtons - Cards de acción: Financiamiento, Cotización y Contacto
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
        gap: { xs: 1, sm: 1.25 },
        maxWidth: { xs: '100%', md: '77.5%' },
        width: '100%',
        ...sx,
      }}
    >
      {/* Card 1 - Financiamiento (destacada, solo si aplica) */}
      {financingEnabled && (
        <ActionCard
          icon={<AccountBalanceWalletIcon />}
          label="Solicita Financiamiento"
          description="¿Necesitas pagar a plazo?"
          onClick={onOpenFinancingModal}
          featured
        />
      )}

      {/* Card 2 - Cotización */}
      <ActionCard
        icon={<RequestQuoteIcon />}
        label="Cotiza aquí"
        description="Obtén el detalle de la operación."
        onClick={onOpenQuotationModal}
      />

      {/* Card 3 - Contacto */}
      <ActionCard
        icon={<SupportAgentIcon />}
        label="Contáctanos"
        description="¿Necesitas una condición especial?"
        onClick={onOpenContactModal}
      />
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
          sx={{ maxWidth: '100%' }}
        />
      )}
    </Box>
  );
};

export default ProductPricing;
