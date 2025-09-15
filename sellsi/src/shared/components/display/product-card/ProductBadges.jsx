import React from 'react';
import { Box, Chip } from '@mui/material';
import { isNewDate } from '../../../utils/product/isNewDate';

/**
 * ProductBadges - Componente UI reutilizable para mostrar badges de productos
 *
 * @param {Array} badges - Array de objetos badge:
 *   - { label: string, color: string, condition: boolean, variant?: string }
 * @param {string} position - Posición de los badges ('top-left', 'top-right', 'bottom-left', 'bottom-right')
 * @param {object} sx - Estilos personalizados para el contenedor
 * @param {string} direction - Dirección del stack ('column', 'row')
 * @param {number} spacing - Espaciado entre badges
 */

/* Indicadores de stock, incluir dentro del componente principal "ProductCard" */
const ProductBadges = ({
  badges = [],
  position = 'top-left',
  sx = {},
  direction = 'column',
  spacing = 0.5,
}) => {
  // Filtrar badges que cumplan su condición
  const visibleBadges = badges.filter(badge => badge.condition !== false);

  if (!visibleBadges.length) return null;

  // Determinar posición
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 2,
      display: 'flex',
      flexDirection: direction,
      gap: spacing,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 8, left: 8 };
      case 'top-right':
        return { ...baseStyles, top: 8, right: 8 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 8, left: 8 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 8, right: 8 };
      default:
        return { ...baseStyles, top: 8, left: 8 };
    }
  };

  return (
    <Box sx={{ ...getPositionStyles(), ...sx }}>
      {visibleBadges.map((badge, index) => (
        <Chip
          key={badge.label || index}
          label={badge.label}
          color={badge.color || 'primary'}
          size="small"
          variant={badge.variant || 'filled'}
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 20,
            ...badge.sx,
          }}
        />
      ))}
    </Box>
  );
};

// Helper para crear badges comunes
export const createProductBadges = product => {
  const badges = [];

  // Badge de producto nuevo — usar createdAt (3 días) por convención
  if (isNewDate(product.createdAt)) {
    badges.push({
      label: 'Nuevo',
      color: 'primary',
      condition: true,
    });
  }

  // Badge de descuento
  if (product.descuento > 0) {
    badges.push({
      label: `-${product.descuento}%`,
      color: 'error',
      condition: true,
    });
  }

  // Badge de stock bajo
  if (product.stock > 0 && product.stock < 10) {
    badges.push({
      label: 'Stock bajo',
      color: 'warning',
      condition: true,
    });
  }

  // Badge de agotado
  if (product.stock === 0) {
    badges.push({
      label: 'Agotado',
      color: 'error',
      condition: true,
    });
  }

  // Badge de destacado
  if (product.featured) {
    badges.push({
      label: 'Destacado',
      color: 'secondary',
      condition: true,
    });
  }

  return badges;
};

export default ProductBadges;
