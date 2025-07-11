// src/components/ProductCard/ProductCardSupplierContext.jsx
import React, { useMemo } from 'react';
import {
  CardContent, // Keep CardContent from MUI, this refers to the MUI component
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

// Utility imports (adjust paths relative to this file)
import { formatPrice } from '../../marketplace/utils/formatters'; // Adjust path
import ActionMenu from './ActionMenu'; // Adjust path
import ProductBadges from './ProductBadges'; // Adjust path
import StatusChip from './StatusChip'; // Adjust path

/**
 * ProductCardSupplierContext - Renders the specific content and actions for a supplier's product card.
 * This component is an internal part of the main ProductCard.
 */
const ProductCardSupplierContext = React.memo(
  ({ product, onEdit, onDelete, onViewStats, isDeleting, isUpdating }) => {
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
    } = product;

    // Configure menu actions
    const menuActions = useMemo(
      () => [
        {
          icon: <EditIcon />,
          label: 'Editar producto',
          onClick: () => onEdit?.(product),
          disabled: isUpdating,
        },
        {
          icon: <VisibilityIcon />,
          label: 'Ver estadísticas',
          onClick: () => onViewStats?.(product),
        },
        {
          icon: <DeleteIcon />,
          label: 'Eliminar producto',
          onClick: () => onDelete?.(product),
          disabled: isDeleting,
          color: 'error',
        },
      ],
      [product, onEdit, onViewStats, onDelete, isUpdating, isDeleting]
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
        {/* Badges del producto */}
        <ProductBadges badges={productBadges} position="top-left" />
        {/* Menú de acciones */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <ActionMenu
            actions={menuActions}
            disabled={isDeleting || isUpdating}
            tooltip="Opciones del producto"
            sx={{
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: '12px',
            }}
          />
        </Box>

        {/* Contenido principal */}
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
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
