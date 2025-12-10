// src/shared/components/display/product-card/ProductCard.jsx
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Box, alpha } from '@mui/material';

// Common Utility Imports
import { ProductCardImage } from '../../../../components/UniversalProductImage'; // Nueva imagen universal (incluye gating viewport interno)

// Sub-components
import ProductCardBuyerContext from './ProductCardBuyerContext';
import ProductCardSupplierContext from './ProductCardSupplierContext';
import ProductCardProviderContext from './ProductCardProviderContext';
import { generateProductUrl as generateUnifiedProductUrl } from '../../../../shared/utils/product/productUrl';

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
    imagePriority = false, // Ô£à Nueva prop para controlar prioridad de imagen
    onEdit,
    onDelete,
    onViewStats,
    isDeleting = false,
    isUpdating = false,
    isProcessing = false,
    onAddToCart,
    registerProductNode,
  }) => {
    const navigate = useNavigate();
    const rootRef = React.useRef(null);

    // Estado para controlar si el modal AddToCart est├í abierto
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Common Product Data Extraction ---
    if (!product) {
      return null;
    }

    const { id, nombre, imagen } = product;

    // Register DOM node for prefetch when this card mounts (if provided)
    useEffect(() => {
      const el = rootRef.current;
      if (!el) return;
      try {
        if (registerProductNode) registerProductNode(id, el);
      } catch (_) {
        // swallow registration errors
      }
      return () => {
        // no-op for now; registerProductNode may support unregister in future
      };
      // We intentionally keep deps minimal; registerProductNode is expected to be stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // --- Memoized common elements ---
    const memoizedImage = useMemo(() => {
      // Fallback: si es provider y no hay imagen base pero s├¡ logo_url, usarlo como imagen
      let productForImage = product;
      if (type === 'provider') {
        const hasAnyImage =
          product.imagen ||
          product.image_url ||
          product.thumbnail_url ||
          (product.thumbnails && Object.keys(product.thumbnails).length > 0);
        if (!hasAnyImage && product.logo_url) {
          productForImage = { ...product, imagen: product.logo_url };
        }
      }
      return (
        <ProductCardImage
          product={productForImage}
          type={type}
          priority={imagePriority} // Ô£à Pasar prioridad din├ímica a la imagen
          alt={nombre}
        />
      );
    }, [product, type, nombre, imagePriority]); // Ô£à A├▒adir imagePriority a dependencias

    // --- Common Card Styles (can be adjusted per type if needed) ---
    const cardStyles = useMemo(
      () => ({
        // Altura responsive igual que antes
        height:
          type === 'supplier'
            ? { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 }
            : { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 },
        // Ancho: 100% en xs/sm para adaptarse al grid, valores fijos en md+
        width:
          type === 'supplier'
            ? { xs: '100%', sm: '100%', md: 220, lg: 370, xl: 360 }
            : { xs: '100%', sm: '100%', md: 220, lg: 300, xl: 320 },
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
        cursor: type === 'provider' ? 'default' : 'pointer',
        boxSizing: 'border-box',
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
          cursor: type === 'provider' ? 'default' : 'pointer',
        },
      }),
      [type, isDeleting]
    );

    // Function to generate product URL
    // Genera la URL p├║blica o privada seg├║n el contexto
    const generateProductUrl = useCallback(product => {
      return generateUnifiedProductUrl(product);
    }, []);

    // Function for card navigation (works for both buyer and supplier types)
    const handleProductClick = useCallback(
      e => {
        // Si el modal AddToCart est├í abierto, no permitir navegaci├│n
        if (isModalOpen) return;

        // Prevent navigation when clicking interactive elements inside the card
        const target = e.target;
        const clickedElement =
          (target.closest &&
            (target.closest('button') ||
              target.closest('.MuiIconButton-root') ||
              target.closest('.MuiButton-root') ||
              target.closest('[data-no-card-click]'))) ||
          (target.hasAttribute && target.hasAttribute('data-no-card-click'));

        if (clickedElement) return;

        const currentPath =
          typeof window !== 'undefined' ? window.location.pathname : '';
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
        navigate(productUrl, { state: { from: fromPath } });
      },
      [isModalOpen, navigate, product, generateProductUrl]
    );

    return (
      <Card
        ref={rootRef}
        elevation={type === 'buyer' || type === 'provider' ? 2 : 0} // Buyer y Provider tienen elevation, Supplier no
        onClick={type === 'provider' ? undefined : handleProductClick}
        sx={cardStyles}
      >
        {/* registerProductNode effect handled by the useEffect above (no inline effects in JSX) */}
        {/* Ô£à Ocultar imagen de producto en tarjetas de proveedor (Option A) */}
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
          <ProductCardProviderContext product={product} />
        )}
      </Card>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default ProductCard;
