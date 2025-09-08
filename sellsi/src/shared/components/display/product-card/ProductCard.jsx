// src/shared/components/display/product-card/ProductCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Box, alpha } from '@mui/material';

// Common Utility Imports
import { ProductCardImage } from '../../../../components/UniversalProductImage'; // Nueva imagen universal (incluye gating viewport interno)

// Sub-components
import ProductCardBuyerContext from './ProductCardBuyerContext';
import ProductCardSupplierContext from './ProductCardSupplierContext';
import ProductCardProviderContext from './ProductCardProviderContext';

/**
 * ProductCard - Componente de tarjeta de producto universal
 * Renders different views based on the 'type' prop ('supplier', 'buyer', or 'provider').
 *
 * @param {object} props - Component props
 * @param {object} props.product - The product data object.
 * @param {'supplier' | 'buyer' | 'provider'} props.type - The type of card to render.
 * @param {boolean} [props.imagePriority=false] - Si la imagen debe tener alta prioridad (fetchpriority="high")
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
    imagePriority = false, // ✅ Nueva prop para controlar prioridad de imagen
    onEdit,
    onDelete,
    onViewStats,
    isDeleting = false,
    isUpdating = false,
    isProcessing = false,
    onAddToCart,
  }) => {
    const navigate = useNavigate();
    
    // Estado para controlar si el modal AddToCart está abierto
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Common Product Data Extraction ---
    if (!product) {
      return null;
    }

    const { id, nombre, imagen } = product;

    // --- Memoized common elements ---
    const memoizedImage = useMemo(() => {
      // Fallback: si es provider y no hay imagen base pero sí logo_url, usarlo como imagen
      let productForImage = product
      if (type === 'provider') {
        const hasAnyImage = product.imagen || product.image_url || product.thumbnail_url || (product.thumbnails && Object.keys(product.thumbnails).length > 0)
        if (!hasAnyImage && product.logo_url) {
          productForImage = { ...product, imagen: product.logo_url }
        }
      }
      return (
        <ProductCardImage
          product={productForImage}
          type={type}
          priority={imagePriority} // ✅ Pasar prioridad dinámica a la imagen
          alt={nombre}
        />
      )
    }, [product, type, nombre, imagePriority]) // ✅ Añadir imagePriority a dependencias

    // --- Common Card Styles (can be adjusted per type if needed) ---
    const cardStyles = useMemo(
      () => ({
        // 🎯 ALTURA RESPONSIVE DE LA TARJETA
        height: type === 'supplier' ? 
          { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 } : 
          { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 },
        // 🎯 ANCHO RESPONSIVE ÚNICO DE LA TARJETA
        width: type === 'supplier'
          ? { xs: 180, sm: 195, md: 220, lg: 370, xl: 360 }
          : { xs: 180, sm: 195, md: 220, lg: 300, xl: 320 }, // buyer y provider usan las mismas dimensiones
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
          cursor: type === 'provider' ? 'default' : 'pointer', // No pointer en hover para provider
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
        
        // Si el modal AddToCart está abierto, no permitir navegación
        if (isModalOpen) {
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
      [navigate, product, generateProductUrl, type, isModalOpen] // Updated dependencies
    );

    return (
      <Card
        elevation={type === 'buyer' || type === 'provider' ? 2 : 0} // Buyer y Provider tienen elevation, Supplier no
        onClick={handleProductClick}
        sx={cardStyles}
      >
  {/* ✅ Ocultar imagen de producto en tarjetas de proveedor (Option A) */}
  {type !== 'provider' && memoizedImage}
        {type === 'supplier' && (
          <ProductCardSupplierContext
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewStats={onViewStats}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
            isProcessing={isProcessing}
          />
        )}
        {type === 'buyer' && (
          <ProductCardBuyerContext
            product={product}
            handleProductClick={handleProductClick}
            onModalStateChange={setIsModalOpen}
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
