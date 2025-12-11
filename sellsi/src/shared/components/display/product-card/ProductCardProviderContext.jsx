// src/shared/components/display/product-card/ProductCardProviderContext.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
} from '@mui/material';
import { Visibility as VisibilityIcon, Verified as VerifiedIcon } from '@mui/icons-material';
import { PRODUCTS_TEXTS } from '../../../constants/productsTexts';
// Note: provider cards DO NOT render product thumbnails. We intentionally avoid
// using `ProductCardImage`/`UniversalProductImage` here to prevent thumbnail
// hooks and product image fallbacks from executing. Provider cards should
// display only the provider avatar (or the Sellsi logo as fallback).

/**
 * ProductCardProviderContext - Renders the specific content and actions for a provider's product card.
 * This component is an internal part of the main ProductCard.
 * Shows only provider information: logo, name, and description.
 */
const ProductCardProviderContext = React.memo(({ product }) => {
  const navigate = useNavigate();

  const {
    supplier_id,
    user_nm,
    proveedor,
    logo_url,
    product_count,
    descripcion_proveedor,
    verified,
  } = product || {};

  // Memoize provider name
  const providerName = React.useMemo(
    () => user_nm || proveedor || `Proveedor #${supplier_id}`,
    [user_nm, proveedor, supplier_id]
  );

  // Decide avatar priority for provider cards (STRICT: only avatar/profile/logo fields)
  // ✅ Confía en productAdapter para el fallback (supplierLogo ya incluye fallback a logo Sellsi)
  const avatarSrc = React.useMemo(() => {
    if (!product) return '/Logos/sellsi_logo_transparent.webp';
    const tryPaths = [
      product.supplier_logo_url, // ✅ Viene del adapter con fallback incluido
      product.user?.avatar,
      product.user?.profile?.avatar || product.user?.profile?.logo_url,
      product.avatar,
      product.logo_url,
      product.supplierLogo,
    ];
    for (const v of tryPaths) {
      if (v && typeof v === 'string' && v.trim().length > 0) return v;
    }
    // ✅ Fallback de seguridad (no debería llegar aquí si productAdapter funciona)
    return '/Logos/sellsi_logo_transparent.webp';
  }, [product]);

  // We intentionally do NOT create a productForImage here.

  return (
    <>
      {/* Provider avatar: render a plain <img> inside a responsive box to avoid
          invoking UniversalProductImage and thumbnail hooks. */}
      <Box sx={{ width: '100%', height: { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 }, minHeight: { xs: 142 }, boxSizing: 'border-box' }}>
        <Box
          component="img"
          src={avatarSrc}
          alt={providerName}
          sx={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            bgcolor: '#fff',
            p: { xs: 1, sm: 1.2, md: 1.5 },
          }}
        />
      </Box>

      <CardContent
        sx={{
          p: { xs: 1, sm: 1.5 },
          pb: '8px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Provider Name */}
        {providerName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 1.5 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.4rem' },
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'primary.main',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              {providerName}
            </Typography>
            {verified && (
              <VerifiedIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: 'primary.main', flexShrink: 0 }} />
            )}
          </Box>
        )}

        {/* Provider description */}
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 8, sm: 7, md: 6, lg: 8 },
            WebkitBoxOrient: 'vertical',
            // Changed from 'justify' to 'left' to avoid uneven word spacing
            // when text is narrow; 'start' can be used for RTL-awareness.
            textAlign: 'left',
            mb: 0.5,
            color: 'text.primary',
            fontWeight: 400,
          }}
        >
          {descripcion_proveedor && descripcion_proveedor.trim().length > 0
            ? descripcion_proveedor
            : PRODUCTS_TEXTS.providerNoDescription}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          p: { xs: 1, sm: 1.5 },
          pt: 0,
          justifyContent: 'center',
        }}
      >
        {/* Review Catalog Button - same as ADD button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          data-no-card-click="true"
          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            const currentPath = window.location.pathname;
            let fromPath = '/marketplace';

            if (currentPath.includes('/buyer/')) {
              fromPath = '/buyer/marketplace';
            } else if (currentPath.includes('/supplier/')) {
              fromPath = '/supplier/marketplace';
            }

            const userNmSlug = (user_nm || proveedor || `proveedor-${supplier_id}`)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            const catalogUrl = `/catalog/${userNmSlug}/${supplier_id}`;

            navigate(catalogUrl, {
              state: { from: fromPath },
            });
          }}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 0.8,
            fontSize: '0.9rem',
            color: 'white',
            backgroundColor: 'primary.main',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'primary.dark',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
              transform: 'translateY(-2px)',
              border: 'none',
            },
            '&:active': {
              border: 'none !important',
              outline: 'none !important',
            },
            '&:focus': {
              border: 'none !important',
              outline: 'none !important',
            },
            '& .MuiButton-startIcon': {
              marginRight: 1,
            },
          }}
        >
          VER CATALOGO
        </Button>
      </CardActions>
    </>
  );
});

// Custom comparison for React.memo
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.product.supplier_id === nextProps.product.supplier_id &&
    prevProps.product.logo_url === nextProps.product.logo_url &&
    prevProps.product.user_nm === nextProps.product.user_nm &&
    prevProps.product.proveedor === nextProps.product.proveedor &&
    prevProps.product.descripcion_proveedor === nextProps.product.descripcion_proveedor &&
    prevProps.product.product_count === nextProps.product.product_count &&
    prevProps.product.verified === nextProps.product.verified
  );
};

ProductCardProviderContext.displayName = 'ProductCardProviderContext';

export default React.memo(ProductCardProviderContext, areEqual);
