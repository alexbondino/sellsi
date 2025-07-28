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
  isLoadingUserProfile = false,
  onSuccess,
  onError,
  onModalStateChange, // Callback para comunicar cuando el modal se abre/cierra
  children,
  sx = {},
  ...buttonProps
}) => {
  // ============================================================================
  // ESTADOS Y HOOKS
  // ============================================================================
  
  const [modalOpen, setModalOpen] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenModal = useCallback(() => {
    if (!disabled && product) {
      setModalOpen(true);
      if (onModalStateChange) {
        onModalStateChange(true);
      }
    }
  }, [disabled, product, onModalStateChange]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    if (onModalStateChange) {
      onModalStateChange(false);
    }
  }, [onModalStateChange]);

  const handleAddToCart = useCallback(async (cartItem) => {
    try {
      console.log('🛒 [AddToCart] Datos recibidos del modal:', cartItem);
      
      // Formatear el producto para el carrito con los parámetros correctos
      const formattedProduct = formatProductForCart(
        product, // producto base
        cartItem.quantity, // cantidad seleccionada
        cartItem.priceTiers || product.priceTiers || product.price_tiers || [] // tramos de precios
      );

      // Agregar información adicional del modal
      const finalProduct = {
        ...formattedProduct,
        documentType: cartItem.documentType,
        selectedTier: cartItem.selectedTier,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
      };

      console.log('📦 [AddToCart] Producto final para carrito:', finalProduct);

      // Agregar al store del carrito usando addItem(product, quantity)
      await addItem(finalProduct, cartItem.quantity);

      // Mostrar notificación de éxito
      showCartSuccess(
        `${finalProduct.name} agregado al carrito (${cartItem.quantity} unidades)`
      );

      // Callback de éxito personalizado
      if (onSuccess) {
        onSuccess(formattedProduct);
      }

    } catch (error) {
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
  }, [product, addItem, onSuccess, onError]);

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  if (!product) {
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
        isLoadingUserProfile={isLoadingUserProfile}
      />
    </>
  );
};

export default AddToCart;
