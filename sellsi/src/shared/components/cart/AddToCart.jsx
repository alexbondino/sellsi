import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

// Components
import AddToCartModal from './AddToCartModal/AddToCartModal';
import ShippingInfoValidationModal, { useShippingInfoModal } from '../validation/ShippingInfoValidationModal/ShippingInfoValidationModal';

// Hooks and services
import { showCartSuccess, showCartError, showErrorToast } from '../../../utils/toastHelpers';
import useCartStore from '../../stores/cart/cartStore';
import { formatProductForCart } from '../../../utils/priceCalculation';
import { supabase } from '../../../services/supabase';

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
  offer = null,
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const addItem = useCartStore(state => state.addItem);

  // Hook para controlar modal de validación de shipping (si falta configurar)
  const {
    isOpen: shippingIsOpen,
    openIfIncomplete,
    isLoading: shippingIsLoading,
    missingFieldLabels,
    handleConfigureShipping,
    handleClose: handleCloseShipping,
  } = useShippingInfoModal();

  // Detectar si la oferta ya está en el carrito para bloquear flujo UI
  const offerId = offer?.id || offer?.offer_id || offer?.offerId || null;
  const isOfferInCart = useCartStore(state => {
    if (!offerId) return false;
    return (state.items || []).some(it => it && (it.offer_id || it.offerId) && String(it.offer_id || it.offerId) === String(offerId));
  });

  const isOwnProduct = useMemo(() => {
    if (!product) return false;
    const supplierId = product.supplier_id || product.supplierId || product.supplierID;
    if (!supplierId || !currentUserId) return false;
    return supplierId === currentUserId;
  }, [product, currentUserId]);

  // Obtener sesión inicial para poder deshabilitar si es producto propio
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setCurrentUserId(session?.user?.id || null);
        }
      } catch (e) {
        if (mounted) setCurrentUserId(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenModal = useCallback(async () => {
    // Si es una oferta y ya existe en el carrito, no abrir modal y avisar
    if (offerId && isOfferInCart) {
      showErrorToast('Esta oferta ya se encuentra en tu carrito');
      return;
    }

    if (!disabled && product) {
      // Verificar sesión antes de abrir el modal
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Antes de abrir el modal de selección, verificar si el usuario tiene
        // la información de despacho completa. Si no la tiene, abrir el
        // modal de validación de shipping y NO abrir el AddToCartModal.
        const didOpenShipping = openIfIncomplete();
        if (didOpenShipping) {
          if (onModalStateChange) onModalStateChange(true);
          return;
        }

        setModalOpen(true);
        if (onModalStateChange) {
          onModalStateChange(true);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        showErrorToast('Error al verificar sesión. Por favor, inténtalo de nuevo.');
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
      const isOffered = !!(cartItem.isOfferProduct || cartItem.offer_id || cartItem.offered_price);
      let finalProduct;
      if (isOffered) {
        // Construir un item especial que conserve la semántica de la oferta.
        // IMPORTANTÍSIMO: usar un id único distinto del product.id base para que
        // no se fusione con la línea regular del mismo producto.
        const offerId = cartItem.offer_id || cartItem.offerId || `offer-${cartItem.id || product.id}`;
        const compositeId = `${product.id}::offer::${offerId}`;

        finalProduct = {
          // Identificadores
          id: compositeId,
          // productid is the actual base product identifier expected by backend
          productid: product.id,
          product_id: product.id,
          offer_id: offerId,
          // Nombres / visual
            name: cartItem.name || product.name || product.nombre,
          proveedor: product.proveedor || product.supplier || cartItem.supplier_name || 'Proveedor no especificado',
          // Precios (precio ofertado fijo)
          price: cartItem.unitPrice, // usado por CartItem
          precio: cartItem.unitPrice,
          offered_price: cartItem.unitPrice,
          price_at_addition: cartItem.unitPrice,
          // Cantidades fijas de la oferta
          quantity: cartItem.quantity,
          offered_quantity: cartItem.quantity,
          minimum_purchase: cartItem.quantity,
          maxStock: cartItem.quantity,
          stock: cartItem.quantity,
          // Evitar recalculo de tiers (un solo tramo fijo)
          price_tiers: [{ min_quantity: 1, price: cartItem.unitPrice }],
          // Flags de UI
          isOffered: true,
          isOfferProduct: true,
          metadata: { ...(product.metadata || {}), isOffered: true, offer_id: offerId },
          // Imagenes (mantener las que ya existan)
          image: product.image || product.imagen || cartItem.thumbnail || cartItem.thumbnail_url || '/placeholder-product.jpg',
          imagen: product.imagen || product.image,
          thumbnail_url: product.thumbnail_url || cartItem.thumbnail_url,
          // Documento
          document_type: (() => {
            const v = String(cartItem.documentType || cartItem.document_type || '').toLowerCase();
            return v === 'boleta' || v === 'factura' ? v : 'ninguno';
          })(),
          // Datos auxiliares usados en UI/tests
          cantidadSeleccionada: cartItem.quantity,
          precioUnitario: cartItem.unitPrice,
          precioTotal: cartItem.totalPrice,
          selectedTier: null,
          addedAt: new Date().toISOString(),
        };

        console.log('📦 [AddToCart] Producto OFERTADO final para carrito:', finalProduct);
        await addItem(finalProduct, cartItem.quantity);
      } else {
        // Flujo normal (sin oferta) mantiene lógica existente
        const formattedProduct = formatProductForCart(
          product,
          cartItem.quantity,
          cartItem.priceTiers || product.priceTiers || product.price_tiers || []
        );
        finalProduct = {
          ...formattedProduct,
          document_type: (() => {
            const v = String(cartItem.documentType || cartItem.document_type || '').toLowerCase();
            return v === 'boleta' || v === 'factura' ? v : 'ninguno';
          })(),
          selectedTier: cartItem.selectedTier,
          unitPrice: cartItem.unitPrice,
          totalPrice: cartItem.totalPrice,
        };
        console.log('📦 [AddToCart] Producto REGULAR final para carrito:', finalProduct);
        await addItem(finalProduct, cartItem.quantity);
      }

      // Optimistic: emit event so offers list (if listening) can mark status=reserved immediately
      try {
        if (isOffered) {
          const offerIdOptimistic = cartItem.offer_id || cartItem.offerId || cartItem.id;
          window.dispatchEvent(new CustomEvent('offer-status-optimistic', { detail: { offer_id: offerIdOptimistic, status: 'reserved' } }));
        }
      } catch(_) {}

      // Mostrar notificación de éxito
      showCartSuccess(
        `Agregado al carrito: ${finalProduct.name} (${cartItem.quantity} unidades${isOffered ? ' - OFERTA' : ''})`
      );

      // Callback de éxito personalizado
      if (onSuccess) {
        onSuccess(finalProduct);
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
    const disabledReason = isOfferInCart ? 'Esta oferta ya se encuentra en tu carrito' : null;
    const wrapWithTooltip = (node) => {
      if (!disabledReason) return node;
      return (
        <Tooltip title={disabledReason} arrow>
          <span style={{ display: 'inline-block' }}>{node}</span>
        </Tooltip>
      );
    };

    if (variant === 'icon') {
      const el = (
        <IconButton
          onClick={handleOpenModal}
          disabled={disabled || isOfferInCart}
          size={size}
          sx={sx}
          {...buttonProps}
        >
          <ShoppingCartIcon />
        </IconButton>
      );
      return wrapWithTooltip(el);
    }

    if (variant === 'text') {
      const el = (
        <Button
          onClick={handleOpenModal}
          disabled={disabled || isOfferInCart}
          size={size}
          fullWidth={fullWidth}
          sx={sx}
          {...buttonProps}
        >
          {children || 'Agregar al Carrito'}
        </Button>
      );
      return wrapWithTooltip(el);
    }

    // Default: variant === 'button'
    const el = (
      <Button
        variant="contained"
        onClick={handleOpenModal}
        disabled={disabled || isOfferInCart}
        size={size}
        fullWidth={fullWidth}
        startIcon={<ShoppingCartIcon />}
        sx={sx}
        {...buttonProps}
      >
        {children || 'Agregar al Carrito'}
      </Button>
    );
    return wrapWithTooltip(el);
  };

  return (
    <>
      {renderButton()}
      
      <AddToCartModal
        open={modalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
        product={product}
  offer={offer}
        initialQuantity={initialQuantity}
        userRegion={userRegion}
        isLoadingUserProfile={isLoadingUserProfile}
  isOwnProduct={isOwnProduct}
      />
      <ShippingInfoValidationModal
        isOpen={shippingIsOpen}
        onClose={handleCloseShipping}
        onGoToShipping={handleConfigureShipping}
        loading={shippingIsLoading}
        missingFieldLabels={missingFieldLabels}
      />
    </>
  );
};

export default AddToCart;
