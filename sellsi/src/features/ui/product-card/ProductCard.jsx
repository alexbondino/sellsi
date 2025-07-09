// src/components/ProductCard/ProductCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Box, alpha } from '@mui/material';

// Common Utility Imports (adjust paths relative to this file)
import { getProductImageUrl } from '../../../utils/getProductImageUrl'; // Adjust path
import { LazyImage } from '../../layout'; // Importar desde layout

// Sub-components (updated names)
import ProductCardBuyerContext from './ProductCardBuyerContext'; // Adjust path
import ProductCardSupplierContext from './ProductCardSupplierContext'; // Adjust path
import ProductCardProviderContext from './ProductCardProviderContext'; // Adjust path

/**
 * ProductCard - Componente de tarjeta de producto universal
 * Renders different views based on the 'type' prop ('supplier', 'buyer', or 'provider').
 *
 * @param {object} props - Component props
 * @param {object} props.product - The product data object.
 * @param {'supplier' | 'buyer' | 'provider'} props.type - The type of card to render.
 * @param {function} [props.onEdit] - Callback for edit action (supplier type).
 * @param {function} [props.onDelete] - Callback for delete action (supplier type).
 * @param {function} [props.onViewStats] - Callback for view stats action (supplier type).
 * @param {boolean} [props.isDeleting=false] - Indicates if the product is being deleted (supplier type).
 * @param {boolean} [props.isUpdating=false] - Indicates if the product is being updated (supplier type).
 * @param {function} [props.onAddToCart] - Callback for add to cart action (buyer type only).
 */
const ProductCard = React.memo(
  ({
    product,
    type,
    onEdit,
    onDelete,
    onViewStats,
    isDeleting = false,
    isUpdating = false,
    onAddToCart,
  }) => {
    const navigate = useNavigate();

    // --- Common Product Data Extraction ---
    if (!product) {
      // console.warn('ProductCard received no product data. Returning null.'); // Keep this for debugging
      return null;
    }

    const { id, nombre, imagen } = product;

    // --- Memoized common elements ---
    const resolvedImageSrc = useMemo(() => {
      let img = product?.imagen || product?.image;
      if (!img) return '/placeholder-product.jpg';
      if (typeof img === 'string') {
        if (img.startsWith('blob:')) return '/placeholder-product.jpg';
        return getProductImageUrl(img, product);
      }
      if (typeof img === 'object' && img !== null) {
        if (img.url && typeof img.url === 'string') {
          if (img.url.startsWith('blob:')) return '/placeholder-product.jpg';
          return getProductImageUrl(img.url, product);
        }
        if (img.path && typeof img.path === 'string') {
          return getProductImageUrl(img.path, product);
        }
      }
      return '/placeholder-product.jpg';
    }, [product]);

    const memoizedImage = useMemo(
      () => (
        <LazyImage
          src={resolvedImageSrc}
          alt={nombre}
          // aspectRatio eliminado para que height y width funcionen sin restricciones
          rootMargin="150px"
          objectFit="contain"
          sx={{
            maxWidth: '100%',
            height: type === 'supplier' ? 
              { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 } :
              { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 },
            bgcolor: '#fafafa',
            // 🎯 PADDING RESPONSIVE
            p: type === 'supplier' ? 
              { xs: 0.5, sm: 0.8, md: 1, lg: 0 } : 
              { xs: 1, sm: 1.2, md: 1.5, lg: 0},
            display: 'block',
            mx: 'auto',
            border: theme => `1px solid ${theme.palette.primary.main}`,
          }}
        />
      ),
      [resolvedImageSrc, nombre, type]
    );

    // --- Common Card Styles (can be adjusted per type if needed) ---
    const cardStyles = useMemo(
      () => ({
        // 🎯 ALTURA RESPONSIVE DE LA TARJETA
        height: type === 'supplier' ? 
          { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 } : 
          { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 },
        // 🎯 ANCHO RESPONSIVE ÚNICO DE LA TARJETA
        width: type === 'supplier'
          ? { xs: 175, sm: 190, md: 220, lg: 370, xl: 360 }
          : { xs: 175, sm: 190, md: 220, lg: 300, xl: 320 }, // buyer y provider usan las mismas dimensiones
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        opacity: isDeleting ? 0.5 : 1,
        transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
        cursor: type === 'provider' ? 'default' : 'pointer', // Solo cursor pointer si no es provider
        '&:hover': {
          transform: isDeleting
            ? 'scale(0.95)'
            : type === 'supplier'
            ? 'translateY(-4px)'
            : 'translateY(-4px)',
          boxShadow: theme =>
            `0 8px 25px ${alpha(
              type === 'supplier'
                ? theme.palette.primary.main
                : theme.palette.primary.main,
              0.15
            )}`,
          borderColor: type === 'supplier' ? 'primary.main' : 'primary.main',
          cursor: 'pointer', // Mantener cursor pointer en hover
        },
      }),
      [type, isDeleting]
    );

    // Function to generate product URL
    // Genera la URL pública o privada según el contexto
    const generateProductUrl = useCallback((product) => {
      const productId = product.id || product.product_id;
      const productName = (product.nombre || product.name || '').toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const productSlug = `${productId}${productName ? `-${productName}` : ''}`;
      const currentPath = window.location.pathname;
      // Si estamos en el marketplace público, usar la ruta pública
      if (currentPath === '/marketplace' || currentPath === '/') {
        return `/technicalspecs/${productSlug}`;
      }
      // Si estamos en la lista de productos del supplier, mantener contexto supplier
      if (currentPath === '/supplier/myproducts') {
        return `/supplier/myproducts/product/${productSlug}`;
      }
      // Si estamos en el contexto de provider, usar rutas de provider
      if (currentPath.includes('/provider/')) {
        return `/provider/marketplace/product/${productSlug}`;
      }
      // Si estamos en dashboard buyer/supplier, usar la ruta privada por defecto
      return `/marketplace/product/${productId}${productName ? `/${productName}` : ''}`;
    }, []);

    // Function for card navigation (works for both buyer and supplier types)
    const handleProductClick = useCallback(
      e => {
        // Si es tipo provider, no permitir navegación de la card
        if (type === 'provider') {
          return;
        }
        
        // This logic applies to both 'buyer' and 'supplier' types
        // but prevent navigation if click originated from an interactive element
        const target = e.target;
        const clickedElement =
          target.closest('button') ||
          target.closest('.MuiIconButton-root') ||
          target.closest('.MuiButton-root') ||
          target.closest('[data-no-card-click]') ||
          target.hasAttribute('data-no-card-click');

        if (clickedElement) {
          return;
        }


        const currentPath = window.location.pathname;
        let fromPath = '/marketplace';

        if (currentPath.includes('/buyer/')) {
          fromPath = '/buyer/marketplace';
        } else if (currentPath === '/supplier/marketplace') {
          fromPath = '/supplier/marketplace';
        } else if (currentPath === '/supplier/myproducts') {
          fromPath = '/supplier/myproducts';
        } else if (currentPath.includes('/provider/')) {
          fromPath = '/provider/marketplace';
        }

        const productUrl = generateProductUrl(product);
        navigate(productUrl, {
          state: { from: fromPath },
        });
      },
      [navigate, product, generateProductUrl] // Updated dependencies
    );

    return (
      <Card
        elevation={type === 'buyer' || type === 'provider' ? 2 : 0} // Buyer y Provider tienen elevation, Supplier no
        onClick={handleProductClick}
        sx={cardStyles}
      >
        {/* ✅ Solo mostrar imagen del producto para tipos 'supplier' y 'buyer', no para 'provider' */}
        {type !== 'provider' && memoizedImage}
        {type === 'supplier' && (
          <ProductCardSupplierContext
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewStats={onViewStats}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
          />
        )}
        {type === 'buyer' && (
          <ProductCardBuyerContext
            product={product}
            onAddToCart={onAddToCart}
            handleProductClick={handleProductClick} // Pass down if buyer context needs to know about this
          />
        )}
        {type === 'provider' && (
          <ProductCardProviderContext
            product={product}
          />
        )}
      </Card>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default ProductCard;
