// src/components/ProductCard/ProductCardBuyerContext.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CardContent, // Keep CardContent from MUI, this refers to the MUI component
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Avatar,
  Popover,
  TextField,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

// Utility imports (adjust paths relative to this file)
import { generateProductUrl } from '../../marketplace/marketplace/productUrl'; // Adjust path
import PriceDisplay from '../../marketplace/PriceDisplay'; // Adjust path
import { useProductPriceTiers } from '../../marketplace/hooks/useProductPriceTiers'; // Adjust path
import {
  formatProductForCart,
  calculatePriceForQuantity,
} from '../../../utils/priceCalculation'; // Adjust path

/**
 * ProductCardBuyerContext - Renders the specific content and actions for a buyer's product card.
 * This component is an internal part of the main ProductCard.
 */
const ProductCardBuyerContext = React.memo(
  ({ product, onAddToCart, handleProductClick }) => {
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState(null);
    const minimumPurchase =
      product?.minimum_purchase || product?.compraMinima || 1;
    const [cantidad, setCantidad] = useState(minimumPurchase);
    const [inputValue, setInputValue] = useState(cantidad.toString());

    // Validation optimized quantity (memoized)
    const canAdd = useMemo(() => {
      const numValue = parseInt(inputValue, 10); // Always specify radix
      return !isNaN(numValue) && numValue >= minimumPurchase;
    }, [inputValue, minimumPurchase]);

    // Robust field mapping for compatibility
    const nombre = product.nombre || product.name || 'Producto sin nombre';
    const proveedor = product.proveedor || 'Proveedor no encontrado';
    const precio = product.precio || product.price || 0;
    const precioOriginal = product.precioOriginal || product.originalPrice;
    const stock = product.stock || product.maxStock || 50;
    const negociable = product.negociable || product.negotiable || false;

    // Hook to get price tiers (maintain for compatibility)
    const {
      tiers,
      loading: loadingTiers,
      error: errorTiers,
    } = useProductPriceTiers(product.id);

    // Unify source of price_tiers: prefer product's, if not, from hook
    const price_tiers = useMemo(() => {
      return product.priceTiers && product.priceTiers.length > 0
        ? product.priceTiers
        : tiers && tiers.length > 0
        ? tiers
        : [];
    }, [product.priceTiers, tiers]);

    // Calculate dynamic price based on selected quantity (memoized)
    const currentPrices = useMemo(() => {
      if (price_tiers.length > 0) {
        const unitPrice = calculatePriceForQuantity(
          cantidad,
          price_tiers,
          precio
        );
        return {
          unitPrice,
          total: unitPrice * cantidad,
        };
      }
      return {
        unitPrice: precio,
        total: precio * cantidad,
      };
    }, [cantidad, price_tiers, precio]);

    const memoizedPriceContent = useMemo(() => {
      if (loadingTiers) {
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
        const minPrice = Math.min(...price_tiers.map(t => t.price));
        const maxPrice = Math.max(...price_tiers.map(t => t.price));
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
      } else {
        // Single price (no tiers)
        return (
          <PriceDisplay
            price={precio}
            originalPrice={precioOriginal}
            variant="h5"
            color="#1976d2"
            sx={{ lineHeight: 1.1, fontSize: { xs: 14, sm: 16, md: 22 } }}
          />
        );
      }
    }, [loadingTiers, errorTiers, price_tiers, precio, precioOriginal]);

    const handleClosePopover = useCallback(() => {
      setAnchorEl(null);
      setCantidad(minimumPurchase); // Reset quantity on close
      setInputValue(minimumPurchase.toString()); // Reset input too
    }, [minimumPurchase]);

    const handleAgregarClick = useCallback(event => {
      event.stopPropagation(); // Prevent propagation to ProductCard
      event.preventDefault(); // Prevent default behavior

      // Check if user is logged in
      const userId = localStorage.getItem('user_id');
      const accountType = localStorage.getItem('account_type');
      const supplierid = localStorage.getItem('supplierid');
      const sellerid = localStorage.getItem('sellerid');

      const isLoggedIn = !!(userId || supplierid || sellerid);

      if (!isLoggedIn) {
        // If not logged in, open login modal
        toast.error('Debes iniciar sesión para agregar productos al carrito', {
          icon: '🔒',
        });
        const loginEvent = new CustomEvent('openLogin');
        window.dispatchEvent(loginEvent);
        return;
      }

      // If logged in, open quantity modal
      setAnchorEl(event.currentTarget);
    }, []);

    const handleCantidadChange = useCallback(event => {
      const value = event.target.value;
      setInputValue(value);
      const numValue = parseInt(value, 10); // Always specify radix
      if (!isNaN(numValue)) {
        setCantidad(numValue);
      }
    }, []);

    const handleIncrement = useCallback(() => {
      let numValue = parseInt(inputValue, 10); // Always specify radix
      if (isNaN(numValue)) numValue = minimumPurchase;
      if (numValue < stock) {
        numValue++;
        setInputValue(numValue.toString());
        setCantidad(numValue);
      }
    }, [inputValue, minimumPurchase, stock]);

    const handleDecrement = useCallback(() => {
      let numValue = parseInt(inputValue, 10); // Always specify radix
      if (isNaN(numValue)) numValue = minimumPurchase;
      if (numValue > minimumPurchase) {
        numValue--;
        setInputValue(numValue.toString());
        setCantidad(numValue);
      }
    }, [inputValue, minimumPurchase]);

    const handleConfirmarAgregar = useCallback(() => {
      if (onAddToCart) {
        // Create product for cart preserving real price_tiers and minimum
        const cartProduct = formatProductForCart(
          product,
          cantidad,
          price_tiers
        );
        onAddToCart(cartProduct);
      }
      handleClosePopover();
    }, [price_tiers, cantidad, onAddToCart, product, handleClosePopover]);

    return (
      <>
        <CardContent sx={{ flexGrow: 1, p: 2, pb: 1, display: 'flex', flexDirection: 'column' }}>
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
            {/* CHIP (sin avatar en mobile) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={proveedor}
                size="small"
                variant="outlined"
                color="primary"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  px: 0.5,
                  borderRadius: 1.5,
                  maxWidth: 250,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
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
                Compra mínima: {minimumPurchase.toLocaleString('es-CL')} uds.
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
            {/* CHIP + AVATAR (arriba en desktop) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  mr: 1,
                  fontSize: '0.75rem',
                  display: 'flex',
                }}
              >
                {proveedor?.charAt(0)}
              </Avatar>
              <Chip
                label={proveedor}
                size="small"
                variant="outlined"
                color="primary"
                sx={{
                  fontSize: '0.8rem',
                  height: 24,
                  px: 1.5,
                  borderRadius: 1.5,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
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
                Compra mínima: {minimumPurchase.toLocaleString('es-CL')} uds.
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
                Compra mínima: {minimumPurchase.toLocaleString('es-CL')} unidades
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
        <CardActions sx={{ p: 1.5, pt: 0.5 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            data-no-card-click="true"
            startIcon={<ShoppingCartIcon sx={{ fontSize: 16, color: 'white' }} />}
            onClick={handleAgregarClick}
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
              transition: 'opacity 0.2s',
              '&:hover': {
                backgroundColor: '#42a5f5',
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
                color: 'white',
              },
            }}
          >
            AGREGAR
          </Button>
        </CardActions>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          onClick={e => e.stopPropagation()}
          disableScrollLock={true}
          disableRestoreFocus={true}
          disableAutoFocus={true}
          PaperProps={{
            onClick: e => e.stopPropagation(),
            sx: {
              p: 2,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              minWidth: 220,
              maxWidth: 240,
              zIndex: 10000,
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              position: 'fixed',
            },
          }}
          sx={{
            zIndex: 10000,
          }}
        >
          <Box sx={{ userSelect: 'none' }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                textAlign: 'center',
                fontSize: {
                  xs: '1rem', // móvil
                  md: '1.1rem', // desktop mediano
                  xl: '1.2rem', // pantallas grandes
                },
                fontWeight: 700,
              }}
            >
              Seleccionar Cantidad
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton
                onClick={useCallback(
                  e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDecrement();
                  },
                  [handleDecrement]
                )}
                disabled={parseInt(inputValue, 10) <= minimumPurchase}
                size="small"
                sx={{
                  userSelect: 'none',
                  touchAction: 'manipulation',
                }}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                type="number"
                value={inputValue}
                onChange={handleCantidadChange}
                onBlur={useCallback(() => {
                  let numValue = parseInt(inputValue, 10); // Always specify radix
                  if (isNaN(numValue) || numValue < minimumPurchase)
                    numValue = minimumPurchase;
                  if (numValue > stock) numValue = stock;
                  setInputValue(numValue.toString());
                  setCantidad(numValue);
                }, [inputValue, minimumPurchase, stock])}
                inputProps={{
                  min: minimumPurchase,
                  max: product.stock || 9999,
                }}
                size="small"
                error={parseInt(inputValue, 10) < minimumPurchase}
                helperText={
                  parseInt(inputValue, 10) < minimumPurchase
                    ? `Mínimo ${minimumPurchase}`
                    : ''
                }
                sx={{
                  width: 100,
                  '& input': {
                    textAlign: 'center',
                    userSelect: 'text',
                  },
                }}
              />
              <IconButton
                onClick={useCallback(
                  e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIncrement();
                  },
                  [handleIncrement]
                )}
                disabled={parseInt(inputValue, 10) >= stock}
                size="small"
                sx={{
                  userSelect: 'none',
                  touchAction: 'manipulation',
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Typography
              variant="body2"
              sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}
            >
              Stock disponible: {stock}
            </Typography>
            
            {/* Mostrar precio por unidad si hay tramos de precios */}
            {price_tiers && price_tiers.length > 0 && (
              <Typography
                variant="body2"
                sx={{ 
                  mb: 2, 
                  textAlign: 'center', 
                  color: 'primary.main',
                  fontWeight: 600 
                }}
              >
                Precio: ${currentPrices.unitPrice.toLocaleString('es-CL')} por und.
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={useCallback(
                  e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClosePopover();
                  },
                  [handleClosePopover]
                )}
                fullWidth
                sx={{
                  userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                  touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={useCallback(
                  e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmarAgregar();
                  },
                  [handleConfirmarAgregar]
                )}
                disabled={!canAdd}
                fullWidth
                sx={{
                  opacity: canAdd ? 1 : 0.5,
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    backgroundColor: '#42a5f5',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {canAdd ? 'Agregar' : `Mín: ${minimumPurchase}`}
              </Button>
            </Box>
          </Box>
        </Popover>
      </>
    );
  }
);

ProductCardBuyerContext.displayName = 'ProductCardBuyerContext';

export default ProductCardBuyerContext;
