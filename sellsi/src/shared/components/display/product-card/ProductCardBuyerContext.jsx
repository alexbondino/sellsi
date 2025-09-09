// src/shared/components/display/product-card/ProductCardBuyerContext.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CardContent, // Keep CardContent from MUI, this refers to the MUI component
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

// Custom hooks - OPTIMIZADO: Usar hook optimizado con caché global
import { useOptimizedUserShippingRegion } from '../../../../hooks/useOptimizedUserShippingRegion';

// Utility imports (updated paths for shared location)
import { showErrorToast } from '../../../../utils/toastHelpers';
import { generateProductUrl } from '../../../utils/product/productUrl';
import PriceDisplay from '../price/PriceDisplay';
import {
  formatProductForCart,
  calculatePriceForQuantity,
} from '../../../../utils/priceCalculation';
import { AddToCart } from '../../cart';

/**
 * ProductCardBuyerContext - Renders the specific content and actions for a buyer's product card.
 * This component is an internal part of the main ProductCard.
 */
const ProductCardBuyerContext = React.memo(
  ({ product, /* onAddToCart (REMOVED to prevent double add) */ handleProductClick, onModalStateChange }) => {
    const navigate = useNavigate();

    // ✅ OPTIMIZADO: Usar hook optimizado con caché global
    const { userRegion, isLoadingUserRegion } = useOptimizedUserShippingRegion();
    
    const minimumPurchase =
      product?.minimum_purchase || product?.compraMinima || 1;

    // Robust field mapping for compatibility
    const nombre = product.nombre || product.name || 'Producto sin nombre';
    const proveedor = product.proveedor || 'Proveedor no encontrado';
    const precio = product.precio || product.price || 0;
    const precioOriginal = product.precioOriginal || product.originalPrice;
    const stock = product.stock || product.maxStock || 50;
    const negociable = product.negociable || product.negotiable || false;
    const proveedorVerificado = product.verified || product.proveedorVerificado || product.supplierVerified || false;

  // Centralized: product.priceTiers now populated (deferred) by useProducts batching logic
  const price_tiers = product.priceTiers || [];
  const tiersStatus = product.tiersStatus; // 'idle' | 'loading' | 'loaded' | 'error'
  const loadingTiers = tiersStatus === 'loading';
  const errorTiers = tiersStatus === 'error';

  // Prefer min/max if available; fallback to base price. If we have no valid price yet,
  // consider the tiers as pending (show "Cargando precios...") instead of showing 0.
  const effectiveMinPrice = product.minPrice ?? precio ?? product.price ?? null;
  const effectiveMaxPrice = product.maxPrice ?? precio ?? product.price ?? null;
  const hasValidBasePrice = (Number(effectiveMaxPrice) || 0) > 0 || (Number(effectiveMinPrice) || 0) > 0;
  const isPending = loadingTiers || (tiersStatus === 'idle' && !hasValidBasePrice);

  const memoizedPriceContent = useMemo(() => {
    if (isPending) {
      return (
        <Typography variant="body2" color="text.secondary">
          Cargando precios...
        </Typography>
      );
    }

    if (errorTiers) {
      return (
        <Typography variant="body2" color="error.main">
          Error al cargar precios
        </Typography>
      );
    }

    if (price_tiers && price_tiers.length > 0) {
      // Show price range by tiers
      const minPrice = Math.min(...price_tiers.map(t => Number(t.price) || 0));
      const maxPrice = Math.max(...price_tiers.map(t => Number(t.price) || 0));
      return (
        <PriceDisplay
          price={maxPrice}
          minPrice={minPrice}
          showRange={minPrice !== maxPrice}
          variant="h5"
          color="#1976d2"
          sx={{ lineHeight: 1.1, fontSize: { xs: 14, sm: 16, md: 22 } }}
        />
      );
    }

    // Single price (no tiers) - use effective fallback price rather than raw precio which may be 0
    const displayPrice = hasValidBasePrice ? (effectiveMaxPrice ?? effectiveMinPrice ?? 0) : 0;
    return (
      <PriceDisplay
        price={displayPrice}
        originalPrice={precioOriginal}
        variant="h5"
        color="#1976d2"
        sx={{ lineHeight: 1.1, fontSize: { xs: 14, sm: 16, md: 22 } }}
      />
    );
  }, [isPending, errorTiers, price_tiers, hasValidBasePrice, effectiveMaxPrice, effectiveMinPrice, precioOriginal]);
 
  return (
      <Box sx={{ height: '100%' }}>
        <CardContent sx={{ flexGrow: 1, p: 2, pb: { xs: 6, md: 9 }, display: 'flex', flexDirection: 'column' }}>
          {/* Product name always at the top */}
          <Box sx={{ mb: { xs: 0.5, md: 1 } }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                minHeight: 48,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: { xs: 14, md: 17.5 },
                lineHeight: 1.2,
                color: '#1e293b',
              }}
            >
              {nombre}
            </Typography>
          </Box>
          {/* Info section: responsive order */}
          {/* MOBILE: chip, compra minima, precio, stock distribuidos uniformemente */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'flex', md: 'none' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              gap: 1,
              // minHeight and flexGrow removed to let image use full space
            }}
          >
            {/* PROVIDER NAME (sin avatar ni chip en mobile) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary', display: 'inline' }}
                component="span"
              >
                por{' '}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', display: 'inline' }}
                component="span"
              >
                {proveedor}
              </Typography>
              {proveedorVerificado && (
                <VerifiedIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: '#1976d2' 
                  }} 
                />
              )}
            </Box>
            {/* MINIMUM PURCHASE */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'text.secondary',
                }}
              >
                Compra Mín: {minimumPurchase.toLocaleString('es-CL')} uds.
              </Typography>
            </Box>
            {/* PRICE DISPLAY */}
            <Box>{memoizedPriceContent}</Box>
            {/* STOCK */}
            <Box>
              <Typography
                variant="body2"
                color={stock < 10 ? 'error.main' : 'text.secondary'}
                sx={{ fontSize: 12, fontWeight: 600 }}
              >
                {stock < 10 ? `¡Solo ${stock.toLocaleString('es-CL')} disponibles!` : `Stock: ${stock.toLocaleString('es-CL')}`}
              </Typography>
            </Box>
          </Box>
          {/* DESKTOP: layout y orden original, SIN nombre duplicado */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              gap: 0.5,
              mb: 1.5,
              flexGrow: 1,
              // height removed to allow image to use more space
              // minHeight and flexGrow removed to let image use full space
            }}
          >
            {/* PROVIDER NAME + VERIFICATION (sin avatar ni chip en desktop) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary', display: 'inline' }}
                component="span"
              >
                por{' '}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', display: 'inline' }}
                component="span"
              >
                {proveedor}
              </Typography>
              {proveedorVerificado && (
                <VerifiedIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: '#1976d2' 
                  }} 
                />
              )}
            </Box>
            {/* MINIMUM PURCHASE */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'text.secondary',
                  display: 'none',
                }}
              >
                Compra Mín: {minimumPurchase.toLocaleString('es-CL')} uds.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                Compra Mín: {minimumPurchase.toLocaleString('es-CL')} unidades
              </Typography>
            </Box>
            {/* PRICE DISPLAY */}
            <Box>{memoizedPriceContent}</Box>
            {/* STOCK (abajo en desktop) */}
            <Box>
              <Typography
                variant="body2"
                color={stock < 10 ? 'error.main' : 'text.secondary'}
                sx={{ fontSize: 12, fontWeight: 600 }}
              >
                {stock < 10 ? `¡Solo ${stock.toLocaleString('es-CL')} disponibles!` : `Stock: ${stock.toLocaleString('es-CL')}`}
              </Typography>
            </Box>
          </Box>
          {/*
          <Box sx={{ mt: 2, mb: 0 }}>
            <Button
              variant="contained"
              fullWidth
              disabled={!negociable}
              data-no-card-click="true"
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (negociable) {
                  // TODO: Abrir modal de negociación
                  // ...log eliminado...
                }
              }}
              onTouchStart={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                py: 0.5,
                borderRadius: 1.5,
                border: 'none',
                color: negociable ? '#2e7d32' : '#757575',
                backgroundColor: negociable
                  ? 'rgba(46, 125, 50, 0.05)'
                  : 'rgba(117, 117, 117, 0.05)',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10,
                '&:hover': negociable
                  ? {
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                      border: 'none',
                    }
                  : {
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
                '&.Mui-disabled': {
                  color: '#757575',
                  border: 'none',
                  backgroundColor: 'rgba(117, 117, 117, 0.05)',
                  pointerEvents: 'auto',
                },
              }}
            >
              {negociable ? 'Negociable' : 'No Negociable'}
            </Button>
          </Box>
          */}
        </CardContent>
        <CardActions
          sx={{
            // Position absolute so the button keeps a fixed distance from the bottom of the card
            position: 'absolute',
            left: '16px',
            right: '16px',
            bottom: '10px',
            // Remove internal padding to avoid extra height
            p: 0,
            pt: 0,
            display: 'flex',
          }}
        >
          <AddToCart
            product={product}
            variant="button"
            fullWidth
            size="medium"
            initialQuantity={minimumPurchase}
            userRegion={userRegion}
            isLoadingUserProfile={isLoadingUserRegion}
            onModalStateChange={onModalStateChange}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: 0.8,
              fontSize: '0.9rem',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            AGREGAR
          </AddToCart>
        </CardActions>
      </Box>
    );
  }
);

ProductCardBuyerContext.displayName = 'ProductCardBuyerContext';

export default ProductCardBuyerContext;
