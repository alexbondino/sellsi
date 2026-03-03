import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Tooltip } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

// Components
import AddToCartModal from './AddToCartModal/AddToCartModal';
import ShippingInfoValidationModal, {
  useShippingInfoModal,
} from '../validation/ShippingInfoValidationModal/ShippingInfoValidationModal';

// Hooks and services
import {
  showCartSuccess,
  showCartError,
  showErrorToast,
} from '../../../utils/toastHelpers';
import useCartStore from '../../stores/cart/cartStore';
import { formatProductForCart } from '../../../utils/priceCalculation';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../infrastructure/providers/UnifiedAuthProvider';
import { waitForAuthStable } from '../../../infrastructure/auth/AuthReadyCoordinator';

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
  const navigate = useNavigate();
  const { isBuyer } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldRenderCartModal, setShouldRenderCartModal] = useState(false);
  const [shouldRenderShippingModal, setShouldRenderShippingModal] = useState(false);
  const openingRef = React.useRef(false); // reentrancy guard
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
    refresh: refreshShippingValidation,
  } = useShippingInfoModal();

  // Detectar si la oferta ya está en el carrito para bloquear flujo UI
  const offerId = offer?.id || offer?.offer_id || offer?.offerId || null;
  const isOfferInCart = useCartStore(state => {
    if (!offerId) return false;
    return (state.items || []).some(
      it =>
        it &&
        (it.offer_id || it.offerId) &&
        String(it.offer_id || it.offerId) === String(offerId)
    );
  });

  const isOwnProduct = useMemo(() => {
    if (!product) return false;
    const supplierId =
      product.supplier_id || product.supplierId || product.supplierID;
    if (!supplierId || !currentUserId) return false;
    return supplierId === currentUserId;
  }, [product, currentUserId]);

  // Obtener sesión inicial para poder deshabilitar si es producto propio
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setCurrentUserId(session?.user?.id || null);
        }
      } catch (e) {
        if (mounted) setCurrentUserId(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenModal = useCallback(async () => {
    if (openingRef.current) return; // prevent double entry
    openingRef.current = true;
    // Si es una oferta y ya existe en el carrito, no abrir modal y avisar
    if (offerId && isOfferInCart) {
      showErrorToast('Esta oferta ya se encuentra en tu carrito');
      openingRef.current = false;
      return;
    }
    
    // 🕐 VALIDAR EXPIRACIÓN DE OFERTA antes de permitir agregar al carrito
    if (offer) {
      const deadline = offer.purchase_deadline || offer.expires_at;
      if (deadline) {
        const deadlineMs = new Date(deadline).getTime();
        if (!Number.isNaN(deadlineMs) && deadlineMs < Date.now()) {
          showErrorToast('Esta oferta ha caducado y no puede agregarse al carrito', {
            icon: '⏰',
          });
          openingRef.current = false;
          return;
        }
      }
    }

    if (!disabled && product) {
      try {
        // 🔒 VERIFICAR SESIÓN PRIMERO (antes de validar shipping)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        // Si NO hay sesión, mostrar modal de login
        if (!session || !session.user) {
          console.log('🔒 [AddToCart] No session detected, showing login modal');
          showErrorToast('Debes iniciar sesión para agregar productos al carrito', {
            icon: '🔒',
          });
          // Disparar evento para abrir Login modal
          const event = new CustomEvent('openLogin');
          window.dispatchEvent(event);
          console.log('📤 [AddToCart] openLogin event dispatched');
          openingRef.current = false;
          return; // Salir inmediatamente - no validar shipping sin sesión
        }

        // ✅ Solo si hay sesión válida, validar shipping
        // ⚡ PERF/UX: NO bloquear el click esperando "auth estable" o validaciones determinísticas.
        // Ese await generaba exactamente el síntoma reportado: click → 2-3s de espera → recién abre Drawer.
        // Disparamos estabilización en background (best-effort) y hacemos un gate rápido.
        try {
          waitForAuthStable(3000);
        } catch (_) {}

        // Gate fast-first: si la validación está loading no bloqueamos la apertura.
        // Esto prioriza UX instantánea en el click de carrito.
        let didOpenShipping = false;
        if (!shippingIsLoading) {
          didOpenShipping = openIfIncomplete();
        }

        if (didOpenShipping || shippingIsOpen) {
          if (onModalStateChange) onModalStateChange(true);
          openingRef.current = false;
          return;
        }

        setModalOpen(true);
        if (onModalStateChange) onModalStateChange(true);
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        showErrorToast(
          'Error al verificar sesión. Por favor, inténtalo de nuevo.'
        );
        openingRef.current = false;
      } finally {
        // liberar guard si no se abrió shipping; si se abrió, ya liberamos antes
        if (!shippingIsOpen) openingRef.current = false;
      }
    }
  }, [
    disabled,
    product,
    onModalStateChange,
    openIfIncomplete,
    shippingIsOpen,
    shippingIsLoading,
    offerId,
    isOfferInCart,
  ]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    if (onModalStateChange) {
      onModalStateChange(false);
    }
  }, [onModalStateChange]);

  // Asegurar propagación de estado al cerrar el modal de shipping
  const handleCloseShippingWrapped = useCallback(() => {
    try {
      handleCloseShipping();
    } catch (_) {}
    if (onModalStateChange) onModalStateChange(false);
  }, [handleCloseShipping, onModalStateChange]);

  // Si el usuario decide configurar despacho, también consideramos el modal "cerrado" a efectos de bloqueo
  const handleConfigureShippingWrapped = useCallback(() => {
    try {
      handleConfigureShipping();
    } catch (_) {}
    if (onModalStateChange) onModalStateChange(false);
  }, [handleConfigureShipping, onModalStateChange]);

  // ✅ Handler para redirección directa a perfil/facturación cuando falta billing info
  const handleRequireBillingInfo = useCallback(({ missingFields }) => {
    console.log('📝 [AddToCart] Falta información de facturación:', missingFields);
    // Cerrar cualquier modal abierto
    setModalOpen(false);
    if (onModalStateChange) onModalStateChange(false);
    // Redirigir directamente al perfil con sección de facturación destacada
    // Detectar rol para usar la ruta correcta
    const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
    navigate(`${profilePath}?section=billing&highlight=true`);
  }, [navigate, onModalStateChange, isBuyer]);

  // Mantener sincronizado el estado de apertura hacia el consumidor (card/grid) por si abre/cierra por otros caminos
  useEffect(() => {
    if (!onModalStateChange) return;
    onModalStateChange(Boolean(shippingIsOpen || modalOpen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingIsOpen, modalOpen]);

  // ⚡ PERF + BUGFIX: Lazy-mount sin romper el scroll-lock de MUI.
  // Si desmontamos el Drawer inmediatamente al cerrar, MUI puede no alcanzar a restaurar
  // el `overflow` del body (especialmente con transiciones).
  useEffect(() => {
    if (modalOpen) {
      setShouldRenderCartModal(true);
      return;
    }
    if (!shouldRenderCartModal) return;
    const t = setTimeout(() => setShouldRenderCartModal(false), 450);
    return () => clearTimeout(t);
  }, [modalOpen, shouldRenderCartModal]);

  useEffect(() => {
    if (shippingIsOpen) {
      setShouldRenderShippingModal(true);
      return;
    }
    if (!shouldRenderShippingModal) return;
    const t = setTimeout(() => setShouldRenderShippingModal(false), 450);
    return () => clearTimeout(t);
  }, [shippingIsOpen, shouldRenderShippingModal]);

  const handleAddToCart = useCallback(
    async cartItem => {
      try {
        const isOffered = !!(
          cartItem.isOfferProduct ||
          cartItem.offer_id ||
          cartItem.offered_price
        );
        let finalProduct;
        if (isOffered) {
          // Construir un item especial que conserve la semántica de la oferta.
          // IMPORTANTÍSIMO: usar un id único distinto del product.id base para que
          // no se fusione con la línea regular del mismo producto.
          const offerId =
            cartItem.offer_id ||
            cartItem.offerId ||
            `offer-${cartItem.id || product.id}`;
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
            proveedor:
              product.proveedor ||
              product.supplier ||
              cartItem.supplier_name ||
              'Proveedor no especificado',
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
            metadata: {
              ...(product.metadata || {}),
              isOffered: true,
              offer_id: offerId,
            },
            // Imagenes (mantener las que ya existan)
            image:
              product.image ||
              product.imagen ||
              cartItem.thumbnail ||
              cartItem.thumbnail_url ||
              '/placeholder-product.jpg',
            imagen: product.imagen || product.image,
            thumbnail_url: product.thumbnail_url || cartItem.thumbnail_url,
            // Documento
            document_type: (() => {
              const v = String(
                cartItem.documentType || cartItem.document_type || ''
              ).toLowerCase();
              return v === 'boleta' || v === 'factura' ? v : 'ninguno';
            })(),
            // Datos auxiliares usados en UI/tests
            cantidadSeleccionada: cartItem.quantity,
            precioUnitario: cartItem.unitPrice,
            precioTotal: cartItem.totalPrice,
            selectedTier: null,
            addedAt: new Date().toISOString(),
          };

          console.log(
            '📦 [AddToCart] Producto OFERTADO final para carrito:',
            finalProduct
          );
          await addItem(finalProduct, cartItem.quantity);
        } else {
          // Flujo normal (sin oferta) mantiene lógica existente
          const formattedProduct = formatProductForCart(
            product,
            cartItem.quantity,
            cartItem.priceTiers ||
              product.priceTiers ||
              product.price_tiers ||
              []
          );
          finalProduct = {
            ...formattedProduct,
            document_type: (() => {
              const v = String(
                cartItem.documentType || cartItem.document_type || ''
              ).toLowerCase();
              return v === 'boleta' || v === 'factura' ? v : 'ninguno';
            })(),
            selectedTier: cartItem.selectedTier,
            unitPrice: cartItem.unitPrice,
            totalPrice: cartItem.totalPrice,
          };
          await addItem(finalProduct, cartItem.quantity);
        }

        // Optimistic: emit event so offers list (if listening) can mark status=reserved immediately
        try {
          if (isOffered) {
            const offerIdOptimistic =
              cartItem.offer_id || cartItem.offerId || cartItem.id;
            window.dispatchEvent(
              new CustomEvent('offer-status-optimistic', {
                detail: { offer_id: offerIdOptimistic, status: 'reserved' },
              })
            );
          }
        } catch (_) {}

        // Mostrar notificación de éxito
        showCartSuccess(
          `Agregado al carrito: ${finalProduct.name} (${
            cartItem.quantity
          } unidades${isOffered ? ' - OFERTA' : ''})`
        );

        // Callback de éxito personalizado
        if (onSuccess) {
          onSuccess(finalProduct);
        }
      } catch (error) {
        // Mostrar notificación de error
        showCartError('Error al agregar el producto al carrito', error.message);

        // Callback de error personalizado
        if (onError) {
          onError(error);
        }
      }
    },
    [product, addItem, onSuccess, onError]
  );

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
    const disabledReason = isOfferInCart
      ? 'Esta oferta ya se encuentra en tu carrito'
      : null;
    const wrapWithTooltip = node => {
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
          data-no-card-click="true"
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
          data-no-card-click="true"
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
        data-no-card-click="true"
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

      {/* ⚡ PERF: No montar modales pesados cuando están cerrados.
          AddToCart se renderiza dentro de muchas ProductCards; si montamos 100+
          Drawers/Modals ocultos, cualquier re-render/focus/restore dispara paint global. */}
      {shouldRenderCartModal ? (
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
          onRequireBillingInfo={handleRequireBillingInfo}
        />
      ) : null}

      {shouldRenderShippingModal ? (
        <ShippingInfoValidationModal
          isOpen={shippingIsOpen}
          onClose={handleCloseShippingWrapped}
          onGoToShipping={handleConfigureShippingWrapped}
          loading={shippingIsLoading}
          missingFieldLabels={missingFieldLabels}
        />
      ) : null}
    </>
  );
};

export default AddToCart;
