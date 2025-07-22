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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

// Utility imports (updated paths for shared location)
import { formatPrice } from '../../../../features/marketplace/utils/formatters';
import ActionMenu from './ActionMenu';
import ProductBadges from './ProductBadges';
import StatusChip from './StatusChip';

/**
 * ProductCardSupplierContext - Renders the specific content and actions for a supplier's product card.
 * This component is an internal part of the main ProductCard.
 */
const ProductCardSupplierContext = React.memo(
  ({ product, onEdit, onDelete, onViewStats, isDeleting, isUpdating, isProcessing }) => {
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
      negociable,
      tramoMin,
      tramoMax,
      tramoPrecioMin,
      tramoPrecioMax,
      priceTiers = [], // Ensure priceTiers is available for conditional rendering
      processingStartTime,
    } = product;

    // Configure menu actions
    const menuActions = useMemo(
      () => [
        {
          icon: <EditIcon />,
          label: 'Editar producto',
          onClick: () => onEdit?.(product),
          disabled: isUpdating || isProcessing,
        },
        {
          icon: <VisibilityIcon />,
          label: 'Ver estadísticas',
          onClick: () => onViewStats?.(product),
          disabled: isProcessing,
        },
        {
          icon: <DeleteIcon />,
          label: 'Eliminar producto',
          onClick: () => onDelete?.(product),
          disabled: isDeleting || isProcessing,
          color: 'error',
        },
      ],
      [product, onEdit, onViewStats, onDelete, isUpdating, isDeleting, isProcessing]
    );

    // Configure product badges
    const productBadges = useMemo(() => {
      const badges = [];
      const isNew = () => {
        if (!updatedAt) return false;
        const daysDiff =
          (new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
      };

      if (isNew()) {
        badges.push({
          label: 'Nuevo',
          color: 'primary',
          condition: true,
        });
      }

      if (descuento > 0) {
        badges.push({
          label: `-${descuento}%`,
          color: 'error',
          condition: true,
        });
      }
      return badges;
    }, [updatedAt, descuento]);

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
              <CircularProgress
                size={40}
                sx={{ color: 'primary.main' }}
              />
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                  sx={{ mb: 0.5 }}
                >
                  <CloudUploadIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Procesando producto...
                </Typography>
              </Box>
            </Box>
          </Backdrop>
        )}

        {/* Badges del producto */}
        <ProductBadges badges={productBadges} position="top-left" />
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
        <CardContent sx={{ flexGrow: 1, p: 2, opacity: isProcessing ? 0.6 : 1 }}>
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
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.6rem',
            }}
          >
            {nombre}
          </Typography>
          {/* Precios */}
          <Box sx={{ mb: 2 }}>
            {/* Mostrar tramos si existen */}
            {priceTiers && priceTiers.length > 0 ? (
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Tramo: {tramoMin} - {tramoMax || '∞'} unidades
                </Typography>
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {tramoPrecioMin === tramoPrecioMax || !tramoPrecioMax
                    ? formatPrice(tramoPrecioMin)
                    : `${formatPrice(tramoPrecioMin)} - ${formatPrice(
                        tramoPrecioMax
                      )}`}
                </Typography>
              </Box>
            ) : (
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
            )}
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
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
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
