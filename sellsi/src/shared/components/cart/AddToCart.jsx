import React, { useState, useCallback } from 'react';
import { Button, IconButton } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

// Components
import AddToCartModal from './AddToCartModal';

// Hooks and services
import { showCartSuccess, showCartError } from '../../../utils/toastHelpers';
import useCartStore from '../../stores/cart/cartStore';
import { formatProductForCart } from '../../../utils/priceCalculation';

/**
 * ============================================================================
 * COMPONENTE ADDTOCART - ORQUESTADOR PRINCIPAL
 * ============================================================================
 * 
 * Componente orquestador que maneja la funcionalidad de "Agregar al Carrito".
 * Puede renderizarse como botón o ícono y abre el modal de selección.
 * 
 * CARACTERÍSTICAS:
 * - ✅ Orquestador modular y reutilizable
 * - ✅ Integración con modal deslizante
 * - ✅ Múltiples variantes de presentación
 * - ✅ Gestión de estado global del carrito
 * - ✅ Manejo de errores y notificaciones
 */

const AddToCart = ({
  product,
  variant = 'button', // 'button' | 'icon' | 'text'
  size = 'medium',
  fullWidth = false,
  disabled = false,
  initialQuantity = 1,
  userRegion = null,
  onSuccess,
  onError,
  children,
  sx = {},
  ...buttonProps
}) => {
  // ============================================================================
  // ESTADOS Y HOOKS
  // ============================================================================
  
  const [modalOpen, setModalOpen] = useState(false);
  const addToCart = useCartStore(state => state.addToCart);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenModal = useCallback(() => {
    if (!disabled && product) {
      setModalOpen(true);
    }
  }, [disabled, product]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleAddToCart = useCallback(async (cartItem) => {
    try {
      // Formatear el producto para el carrito
      const formattedProduct = formatProductForCart({
        ...product,
        ...cartItem,
      });

      // Agregar al store del carrito
      addToCart(formattedProduct);

      // Mostrar notificación de éxito
      showCartSuccess(
        `${formattedProduct.name} agregado al carrito`,
        {
          quantity: cartItem.quantity,
          unitPrice: cartItem.unitPrice,
        }
      );

      // Callback de éxito personalizado
      if (onSuccess) {
        onSuccess(formattedProduct);
      }

    } catch (error) {
      console.error('Error adding product to cart:', error);
      
      // Mostrar notificación de error
      showCartError(
        'Error al agregar el producto al carrito',
        error.message
      );

      // Callback de error personalizado
      if (onError) {
        onError(error);
      }
    }
  }, [product, addToCart, onSuccess, onError]);

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  if (!product) {
    console.warn('AddToCart: No product provided');
    return null;
  }

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <IconButton
          onClick={handleOpenModal}
          disabled={disabled}
          size={size}
          sx={sx}
          {...buttonProps}
        >
          <ShoppingCartIcon />
        </IconButton>
      );
    }

    if (variant === 'text') {
      return (
        <Button
          onClick={handleOpenModal}
          disabled={disabled}
          size={size}
          fullWidth={fullWidth}
          sx={sx}
          {...buttonProps}
        >
          {children || 'Agregar al Carrito'}
        </Button>
      );
    }

    // Default: variant === 'button'
    return (
      <Button
        variant="contained"
        onClick={handleOpenModal}
        disabled={disabled}
        size={size}
        fullWidth={fullWidth}
        startIcon={<ShoppingCartIcon />}
        sx={sx}
        {...buttonProps}
      >
        {children || 'Agregar al Carrito'}
      </Button>
    );
  };

  return (
    <>
      {renderButton()}
      
      <AddToCartModal
        open={modalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
        product={product}
        initialQuantity={initialQuantity}
        userRegion={userRegion}
      />
    </>
  );
};

export default AddToCart;
