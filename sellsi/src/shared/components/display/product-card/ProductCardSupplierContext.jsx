// src/shared/components/display/product-card/ProductCardSupplierContext.jsx
import React, { useMemo } from 'react';
import {
  CardContent, // Keep CardContent from MUI, this refers to the MUI component
  Typography,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
// Iconos
import EditIcon from '@mui/icons-material/Edit';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InventoryIcon from '@mui/icons-material/Inventory2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Utilidades
import { toTitleCase } from '../../../../utils/textFormatters';

// Utility imports (updated paths for shared location)
import { formatPrice } from '../../../utils/formatters';
import ActionMenu from './ActionMenu';
import ProductBadges from './ProductBadges';
import StatusChip from './StatusChip';
import { isNewDate } from '../../../utils/product/isNewDate';

/**
 * ProductCardSupplierContext - Renders the specific content and actions for a supplier's product card.
 * This component is an internal part of the main ProductCard.
 */
const ProductCardSupplierContext = React.memo(
  ({
    product,
    onEdit,
    onDelete,
    onViewStats,
    isDeleting,
    isUpdating,
    isProcessing,
  }) => {
    // Centralized deferred tiers (populated via useProducts). No per-product network hook.
    const rawTiersStatus = product.tiersStatus;
    const hasAnyTiers =
      Array.isArray(product.priceTiers) && product.priceTiers.length > 0;
    const tiersStatus = hasAnyTiers ? 'loaded' : rawTiersStatus || 'idle';
    const loadingTiers = tiersStatus === 'loading';
    const errorTiers = tiersStatus === 'error';

    // Product properties (already destructuring in main ProductCard, passed here)
    const {
      nombre,
      precio,
      precioOriginal,
      descuento,
      categoria,
      stock,
      ventas = 0,
      updatedAt,
      createdAt,
      negociable,
      tramoMin,
      tramoMax,
      tramoPrecioMin,
      tramoPrecioMax,
      priceTiers = [], // Ensure priceTiers is available for conditional rendering
      processingStartTime,
      activo, // estado actual (is_active mapeado a activo en uiProducts)
    } = product;

    // Unify source of price_tiers: prefer product's, if not, from hook (same logic as BuyerContext)
    const price_tiers = useMemo(() => {
      const tiers = product.priceTiers || [];
      // Normalize potential shapes: {min,max,precio} or {min_quantity,max_quantity,price}
      return tiers
        .map(t => ({
          min_quantity: t.min_quantity ?? t.min ?? null,
          max_quantity: t.max_quantity ?? t.max ?? null,
          price: Number(t.price ?? t.precio ?? 0) || 0,
        }))
        .filter(t => t.min_quantity != null && t.price > 0)
        .sort(
          (a, b) =>
            (Number(a.min_quantity) || 0) - (Number(b.min_quantity) || 0)
        );
    }, [product.priceTiers]);
    const effectiveMinPrice =
      product.minPrice ?? product.precio ?? product.price ?? null;
    const effectiveMaxPrice =
      product.maxPrice ?? product.precio ?? product.price ?? null;
    const hasValidBasePrice =
      (Number(effectiveMaxPrice) || 0) > 0 ||
      (Number(effectiveMinPrice) || 0) > 0;
    const isTierProduct =
      product.product_type === 'tier' || product.tipo === 'tier' || hasAnyTiers;
    // Only show loading when explicitly marked as loading
    const isPending = loadingTiers;

    // Theme + breakpoints para truncado responsive del nombre
    const theme = useTheme();
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));
    const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    // Truncar longitud según breakpoint: lg -> 30, md -> 20, sm/xs -> 20
    // Aplicar Title Case antes de truncar
    const truncatedName = useMemo(() => {
      if (!nombre) return '';
      const titleCaseName = toTitleCase(nombre);
      const max = isLg ? 30 : 20;
      return titleCaseName.length > max
        ? titleCaseName.slice(0, max - 1).trim() + '…'
        : titleCaseName;
    }, [nombre, isLg, isMd]);

    // Configure menu actions
    // Reemplazamos VisibilityIcon por ícono de pausa y mantenemos label
    const menuActions = useMemo(() => {
      const pauseLabel = activo ? 'Pausar producto' : 'Reactivar producto';
      const pauseIcon = <PauseCircleOutlineIcon />; // Podríamos cambiar a PlayArrow cuando esté pausado
      return [
        {
          icon: <EditIcon />,
          label: 'Editar producto',
          onClick: () => onEdit?.(product),
          disabled: isUpdating || isProcessing,
        },
        {
          icon: pauseIcon,
          label: pauseLabel,
          onClick: () => onViewStats?.(product), // handler de toggle activo
          disabled: isProcessing,
        },
        {
          icon: <DeleteIcon />,
          label: 'Eliminar producto',
          onClick: () => onDelete?.(product),
          disabled: isDeleting || isProcessing,
          color: 'error',
        },
      ];
    }, [
      product,
      onEdit,
      onViewStats,
      onDelete,
      isUpdating,
      isDeleting,
      isProcessing,
      activo,
    ]);

    // Configure product badges
    const productBadges = useMemo(() => {
      const badges = [];
      // Mostrar 'Nuevo' solo si el producto está activo. Usar createdAt (3 días).
      if (activo && isNewDate(product.createdAt)) {
        badges.push({ label: 'Nuevo', color: 'primary', condition: true });
      }

      if (descuento > 0) {
        badges.push({
          label: `-${descuento}%`,
          color: 'error',
          condition: true,
        });
      }
      return badges;
    }, [createdAt, descuento, activo]);

    return (
      <>
        {/* Overlay de procesamiento */}
        {isProcessing && (
          <Backdrop
            open={isProcessing}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(2px)',
              borderRadius: 'inherit',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                p: 3,
              }}
            >
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                  sx={{ mb: 0.5 }}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }}
                  />
                  Procesando producto...
                </Typography>
              </Box>
            </Box>
          </Backdrop>
        )}

        {/* Badges del producto */}
        <ProductBadges badges={productBadges} position="top-left" />
        {!activo && !isProcessing && (
          <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>
            <Chip
              label="Pausado"
              color="warning"
              size="small"
              sx={{
                fontSize: '0.78rem',
                height: 22,
                px: 0.75,
                fontWeight: 600,
              }}
            />
          </Box>
        )}
        {/* Menú de acciones */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <ActionMenu
            actions={menuActions}
            disabled={isDeleting || isUpdating || isProcessing}
            tooltip="Opciones del producto"
            sx={{
              border: '2px solid',
              borderColor: isProcessing ? 'grey.300' : 'primary.main',
              borderRadius: '12px',
              opacity: isProcessing ? 0.5 : 1,
            }}
          />
        </Box>

        {/* Contenido principal */}
        <CardContent
          sx={{ flexGrow: 1, p: 2, opacity: isProcessing ? 0.6 : 1 }}
        >
          {/* Categoría */}
          <Chip
            label={categoria}
            size="small"
            variant="outlined"
            sx={{ mb: 1, fontSize: '0.7rem', height: 20 }}
          />
          {/* Nombre del producto */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: '0.95rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '1.3rem',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
            }}
          >
            {truncatedName}
          </Typography>
          {/* Precios */}
          <Box sx={{ mb: 2 }}>
            {/* Mostrar loading de tramos */}
            {isPending && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Cargando precios...
              </Typography>
            )}

            {/* Mostrar error de tramos */}
            {errorTiers && (
              <Typography
                variant="body2"
                color="error.main"
                sx={{ fontWeight: 500 }}
              >
                Error al cargar precios
              </Typography>
            )}

            {/* Mostrar tramos si existen (usando price_tiers unificado) */}
            {!isPending &&
            !errorTiers &&
            price_tiers &&
            price_tiers.length > 0 ? (
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                >
                  Precios por volumen ({price_tiers.length} tramos)
                </Typography>
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {(() => {
                    const prices = price_tiers
                      .map(t => Number(t.price) || 0)
                      .filter(n => n > 0);
                    if (!prices.length) return formatPrice(precio || 0);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    return minPrice !== maxPrice
                      ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                      : formatPrice(minPrice);
                  })()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  Desde {price_tiers[0]?.min_quantity || 1} unidades
                </Typography>
              </Box>
            ) : !loadingTiers && !errorTiers && !isTierProduct ? (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {formatPrice(precio)}
                </Typography>
                {precioOriginal && precioOriginal > precio && (
                  <Typography
                    variant="body2"
                    sx={{
                      textDecoration: 'line-through',
                      color: 'text.secondary',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formatPrice(precioOriginal)}
                  </Typography>
                )}
              </Box>
            ) : !loadingTiers &&
              !errorTiers &&
              isTierProduct &&
              (!price_tiers || price_tiers.length === 0) ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Define los tramos de precio
              </Typography>
            ) : null}

            {negociable && (
              <Chip
                label="Precio negociable"
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
          {/* Estados y métricas */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Stock */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Stock:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 700 }}
              >
                {stock.toLocaleString('es-CL')}
              </Typography>
            </Box>

            {/* Ventas */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Ventas: {ventas} unidades
              </Typography>
            </Box>

            {/* Última actualización */}
            <Typography variant="caption" color="text.secondary">
              Actualizado: {new Date(updatedAt).toLocaleDateString('es-CL')}
            </Typography>
          </Box>
        </CardContent>
      </>
    );
  }
);

ProductCardSupplierContext.displayName = 'ProductCardSupplierContext';

export default ProductCardSupplierContext;
