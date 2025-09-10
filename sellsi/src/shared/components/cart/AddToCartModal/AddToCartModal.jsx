import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  Alert,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Imports de componentes compartidos
import QuantitySelector from '../../forms/QuantitySelector/QuantitySelector';
// Helper de logging solo en desarrollo
const devLog = (...args) => { if (process.env.NODE_ENV === 'development') console.info(...args); };
import { CheckoutSummaryImage } from '../../../../components/UniversalProductImage'; // Imagen universal con fallbacks
// useUnifiedShippingValidation reemplazado por hook especializado interno
import { normalizePriceTiers } from '../../../../utils/priceCalculation';
import { supabase } from '../../../../services/supabase';
import { useBillingInfoValidation } from '../../../hooks/profile/useBillingInfoValidation';
import { useSupplierDocumentTypes } from '../../../utils/supplierDocumentTypes';
// --- Lógica pura extraída (Phase 1) ---
import { buildOfferProductData, buildRegularProductData } from './logic/productBuilders';
import { computeQuantityBounds } from './logic/quantity';
import { computePricing, findActiveTier } from './logic/pricing';
import { shouldDisableButton } from './logic/disableButtonRules';
import { useProductShippingValidationOnOpen } from './logic/hooks/useProductShippingValidationOnOpen';
import { useQuantityManagement } from './logic/hooks/useQuantityManagement';
import { PriceTiersDisplay } from './components/PriceTiersDisplay';
import { OfferPriceDisplay } from './components/OfferPriceDisplay';
import { DocumentTypeSelector } from './components/DocumentTypeSelector';
import { ShippingStatus } from './components/ShippingStatus';
import { SubtotalSection } from './components/SubtotalSection';
import useCartStore from '../../../stores/cart/cartStore';

// ===============================================
// Estilos extraídos (optimizan recreación de objetos sx)
// ===============================================
const drawerPaperBaseSx = {
  width: { xs: '100%', sm: 460, md: 518 },
  maxWidth: '90vw',
  zIndex: 9999,
};

const drawerHeaderSx = {
  p: 2,
  borderBottom: 1,
  borderColor: 'primary.dark',
  bgcolor: 'primary.main',
  color: 'common.white',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const layoutRootSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

// Factory para estilos dependientes de estado
const tierPaperSx = (isActive) => ({
  p: 2,
  border: isActive ? 2 : 1,
  borderColor: isActive ? 'primary.main' : 'grey.300',
  bgcolor: isActive ? 'primary.50' : 'transparent',
  cursor: 'default',
});

// Estilos del contenedor de tiers (antes inline medium, ahora factory por posible dependencia futura)
const tiersContainerSx = {
  // Mantener literal: no depende de props/estado actualmente
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  // Si se vuelve dinámico (e.g. responsive condicional) convertir en función
};

// PaperProps del Drawer (objeto grande extraído para evitar recreación inline)
const drawerPaperProps = {
  component: motion.div,
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
  sx: drawerPaperBaseSx,
};

// Sx estable para imagen resumen (evita re-render por nuevo objeto)
const checkoutSummaryImageSx = {
  width: 50,
  height: 50,
  objectFit: 'contain',
  pointerEvents: 'none',
};

// ============================================================================
// COMPONENTE EXTRAÍDO: ProductSummary
// Motivo: Evitar recreación de la definición en cada render del modal que
// provocaba remount del subtree (incluyendo la imagen) e impedía que React.memo
// en CheckoutSummaryImage hiciera efecto. Al extraerlo a nivel de módulo y
// memoizarlo, los cambios de cantidad ya no fuerzan re-render de la imagen.
// ============================================================================
const ProductSummary = React.memo(function ProductSummary({
  productData,
  quantity,
  onQuantityChange,
  quantityError,
  minQuantity,
  maxQuantity,
  isOfferMode = false,
  offer = null,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      onClick={(e) => { e.stopPropagation(); }}
      onMouseDown={(e) => { e.stopPropagation(); }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckoutSummaryImage
            product={productData}
            sx={checkoutSummaryImageSx}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1, pointerEvents: 'none' }}>
              {productData.name}
            </Typography>
            
            {/* Mostrar selector de cantidad solo si NO es modo oferta */}
            {!isOfferMode && (
              <Box sx={{ ml: 2, pointerEvents: 'auto', position: 'relative' }}>
                <QuantitySelector
                  value={quantity}
                  onChange={onQuantityChange}
                  min={minQuantity}
                  max={maxQuantity}
                  size="small"
                  orientation="horizontal"
                  label="Cantidad:"
                  sx={{
                    '& .MuiFormHelperText-root': { display: 'none' },
                  }}
                />
                {quantityError && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      mt: 0.5,
                      zIndex: 10,
                      minWidth: 200,
                    }}
                  >
                    <Alert severity="error" variant="filled" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      {quantityError}
                    </Alert>
                  </Box>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.75rem',
                    pointerEvents: 'none'
                  }}
                >
                  Stock: {productData.stock.toLocaleString('es-CL')}
                </Typography>
              </Box>
            )}

            {/* Mostrar información de cantidad fija si ES modo oferta */}
            {isOfferMode && offer && (
              <Box sx={{ ml: 2, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Cantidad fija: {offer.offered_quantity}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  (No modificable)
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
});

/**
 * ============================================================================
 * MODAL AGREGAR AL CARRITO - COMPONENTE UNIVERSAL
 * ============================================================================
 * 
 * Modal deslizante que permite seleccionar cantidad, tipo de documento y
 * muestra información completa del producto antes de agregarlo al carrito.
 * 
 * CARACTERÍSTICAS:
 * - ✅ Animación slide desde la derecha
 * - ✅ Selector de cantidad integrado
 * - ✅ Precios por tramos dinámicos
 * - ✅ Validación de despacho por región
 * - ✅ Selector de tipo de documento
 * - ✅ Cálculo de subtotal en tiempo real
 * - ✅ Diseño responsive y accesible
 */

const AddToCartModal = ({
  open,
  onClose,
  onAddToCart,
  onSuccess, // Nuevo: callback específico para ofertas
  product,
  offer = null, // Nuevo: datos de la oferta si es un producto ofertado
  initialQuantity = 1,
  userRegion = null,
  isLoadingUserProfile = false, // Nuevo prop para indicar si el perfil del usuario está cargando
  isOwnProduct = false, // Nuevo: deshabilitar agregar si es producto propio
  onRequireBillingInfo = null, // Nuevo: callback cuando falta billing info y se requiere factura
}) => {
  // Validación de Billing (solo interesa si usuario selecciona factura)
  const { isComplete: isBillingComplete, isLoading: isLoadingBilling, missingFieldLabels: missingBillingLabels } = useBillingInfoValidation();
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================

  const [documentType, setDocumentType] = useState('factura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrichedProduct, setEnrichedProduct] = useState(product);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Determinar si es un producto ofertado
  const isOfferMode = Boolean(offer);

  // Defensive: comprobar si la oferta ya existe en el carrito
  const offerId = offer?.id || offer?.offer_id || offer?.offerId || null;
  const isOfferInCart = useCartStore(state => {
    if (!offerId) return false;
    return (state.items || []).some(it => it && (it.offer_id || it.offerId) && String(it.offer_id || it.offerId) === String(offerId));
  });

  // Inicialización de la gestión de cantidad (hook personalizado). Se hace
  // después de declarar `enrichedProduct` e `isOfferMode` para evitar usar
  // variables antes de su inicialización (evita ReferenceError).
  const { quantity, setQuantity, quantityError, setQuantityError, handleQuantityChange: handleQuantityChangeHook } = useQuantityManagement({
    open,
    isOfferMode,
    offer,
    enrichedProduct,
    initialQuantity,
  });

  // Hook para obtener tipos de documentos permitidos por el proveedor
  const supplierId = enrichedProduct?.supplier_id || enrichedProduct?.supplierId;
  const { 
    documentTypes: supplierDocumentTypes, 
    availableOptions, 
    loading: loadingDocumentTypes,
    error: documentTypesError 
  } = useSupplierDocumentTypes(supplierId);



  // Función para cargar las regiones de despacho del producto
  const loadProductShippingRegions = useCallback(async (productId) => {
    if (!productId) return [];
    
    try {
  devLog('[AddToCartModal] loadProductShippingRegions start', { productId });
    setIsLoadingRegions(true);
      const { data, error } = await supabase
        .from('product_delivery_regions')
        .select('id, region, price, delivery_days')
        .eq('product_id', productId);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
  devLog('[AddToCartModal] loadProductShippingRegions error', error);
      return [];
    } finally {
      setIsLoadingRegions(false);
    }
  }, []);

  // Enriquecer el producto con regiones de despacho cuando se abre el modal
  useEffect(() => {
    const enrichProductWithRegions = async () => {
      if (!open || !product?.id) return;

      // Si el producto ya tiene regiones, no necesitamos cargarlas
      if (product.shippingRegions?.length > 0 || 
          product.delivery_regions?.length > 0 || 
          product.shipping_regions?.length > 0 ||
          product.product_delivery_regions?.length > 0) {
  devLog('[AddToCartModal] enrichProductWithRegions - product already has regions', { productId: product.id, existingRegions: product.shippingRegions?.length || product.delivery_regions?.length || product.shipping_regions?.length });
        setEnrichedProduct(product);
        return;
      }

      // Cargar regiones de despacho desde la base de datos
      const shippingRegions = await loadProductShippingRegions(product.id);

      const productWithRegions = {
        ...product,
        // Clonar arrays de tiers si existen para evitar mutaciones compartidas
        priceTiers: product?.priceTiers ? product.priceTiers.map(t => ({ ...t })) : product?.priceTiers,
        price_tiers: product?.price_tiers ? product.price_tiers.map(t => ({ ...t })) : product?.price_tiers,
        shippingRegions,
        delivery_regions: shippingRegions,
        shipping_regions: shippingRegions,
        product_delivery_regions: shippingRegions
      };

  devLog('[AddToCartModal] enrichProductWithRegions - enriched product set', { productId: product.id, regionsLoaded: (productWithRegions.shippingRegions || []).length });
  setEnrichedProduct(productWithRegions);
    };

    enrichProductWithRegions();
  }, [open, product, loadProductShippingRegions]);

  // (inicialización de cantidad movida al hook useQuantityManagement)

  // Establecer tipo de documento inicial basándose en opciones disponibles del proveedor
  useEffect(() => {
    if (open && availableOptions && availableOptions.length > 0) {
      // Si el tipo actual no está disponible para este proveedor, usar el primero disponible
      const currentIsAvailable = availableOptions.some(option => option.value === documentType);
      if (!currentIsAvailable) {
        setDocumentType(availableOptions[0].value);
      }
    }
  }, [open, availableOptions, documentType]);

  // ============================================================================
  // DATOS DEL PRODUCTO Y VALIDACIONES
  // ============================================================================

  // Extraer datos del producto con fallbacks
  const productData = useMemo(() => (isOfferMode && offer ? buildOfferProductData(offer, enrichedProduct) : buildRegularProductData(enrichedProduct)), [enrichedProduct, offer, isOfferMode]);

  const { shippingValidation, isValidatingShipping, justOpened, effectiveUserRegion, getUserRegionName, isLoadingUserRegion } = useProductShippingValidationOnOpen({
    open,
    enrichedProduct,
    userRegionProp: userRegion,
    isLoadingRegions,
    isLoadingUserProfile,
  });

  // ============================================================================
  // CÁLCULOS DE PRECIOS DINÁMICOS
  // ============================================================================

  // Normalizar tiers para UI (precio DESC estable). Solo recalcula cuando cambia la referencia original
  const displayPriceTiers = useMemo(() => normalizePriceTiers(productData.priceTiers, 'price_desc'), [productData.priceTiers]);

  // Calcular precio actual usando lógica pura extraída
  const currentPricing = useMemo(() => computePricing(productData.priceTiers, productData.basePrice, quantity), [productData.priceTiers, productData.basePrice, quantity]);

  // Encontrar el tramo activo para resaltado (SOLO el que corresponde a la cantidad actual)
  const activeTier = useMemo(() => findActiveTier(productData.priceTiers, quantity), [productData.priceTiers, quantity]);

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  const handleQuantityChange = useCallback((newQuantity) => handleQuantityChangeHook(newQuantity, productData), [handleQuantityChangeHook, productData]);

  const handleDocumentTypeChange = useCallback((event) => {
    setDocumentType(event.target.value);
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Si es modo oferta, usar el callback específico para ofertas
    if (isOfferMode && onSuccess) {
      setIsProcessing(true);
      try {
        await onSuccess();
        return; // onSuccess debe manejar el cierre del modal
      } catch (error) {
        console.error('❌ [AddToCartModal] Error al procesar oferta:', error);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Modo normal: validaciones de cantidad
  const { minQ, maxQ } = computeQuantityBounds(productData);
  if (quantity < minQ) { setQuantityError(`La cantidad mínima de compra es ${minQ} unidades`); return; }
  if (quantity > maxQ) { setQuantityError(`La cantidad máxima disponible es ${maxQ} unidades`); return; }

    // Bloqueo previo: si se selecciona factura y billing incompleto
    if (documentType === 'factura') {
      if (isLoadingBilling) return; // esperar
      if (!isBillingComplete) {
        // Cerrar modal actual y disparar callback para abrir modal de billing
        if (onRequireBillingInfo) {
          onClose();
          onRequireBillingInfo({ missingFields: missingBillingLabels });
        }
        return; // No agregar
      }
    }

    setIsProcessing(true);
    
    try {
      const cartItem = {
        ...productData,
        quantity,
        documentType,
        unitPrice: currentPricing.unitPrice,
        totalPrice: currentPricing.total,
        selectedTier: activeTier,
      };
      
      await onAddToCart(cartItem);
      onClose();
    } catch (error) {
      console.error('❌ [AddToCartModal] Error al agregar producto al carrito:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isOfferMode,
    onSuccess,
    quantity,
    productData,
    documentType,
    currentPricing,
    activeTier,
    onAddToCart,
    onClose,
    isBillingComplete,
    isLoadingBilling,
    missingBillingLabels,
    onRequireBillingInfo
  ]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  const quantityBounds = useMemo(() => computeQuantityBounds(productData), [productData]);

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <AnimatePresence mode="wait">
      {open && (
        <Drawer
          anchor="right"
          open={open}
          onClose={handleClose} // Permitir cierre normal con X
          hideBackdrop={false}
          disableEscapeKeyDown={false} // Permitir cerrar con Escape
          PaperProps={drawerPaperProps}
          ModalProps={{
            keepMounted: false,
            BackdropProps: {
              sx: {
                zIndex: 9998, // Backdrop justo debajo del modal
                backgroundColor: 'rgba(0, 0, 0, 0.5)', // Asegurar que sea visible
              }
            }
          }}
          sx={{
            zIndex: 9999, // También en el Drawer principal
          }}
        >
          <Box 
            sx={layoutRootSx}
          >
            
            {/* Header */}
            <Box sx={drawerHeaderSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>
                  {isOfferMode ? 'Confirmar Oferta Aceptada' : 'Resumen del Pedido'}
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ color: 'common.white' }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Stack spacing={3}>
                
                {/* 1. Precios (ofertas o regulares) */}
                {isOfferMode ? (
                  <OfferPriceDisplay offer={offer} productData={productData} isOfferMode={isOfferMode} />
                ) : (
                  <PriceTiersDisplay productData={productData} priceTiers={displayPriceTiers} quantity={quantity} />
                )}

                {/* 2. Resumen del producto con selector de cantidad (memoizado) */}
                <ProductSummary
                  productData={productData}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                  quantityError={quantityError}
                  minQuantity={quantityBounds.minQ}
                  maxQuantity={quantityBounds.maxQ}
                  isOfferMode={isOfferMode}
                  offer={offer}
                />

                {/* 3. Tipo de documento (solo si no es oferta o si el proveedor lo permite) */}
                {(!isOfferMode || availableOptions?.length > 0) && (
                  <DocumentTypeSelector
                    loadingDocumentTypes={loadingDocumentTypes}
                    documentTypesError={documentTypesError}
                    availableOptions={availableOptions}
                    documentType={documentType}
                    onChange={handleDocumentTypeChange}
                  />
                )}

                {/* 4. Estado de despacho */}
                <ShippingStatus
                  isLoadingRegions={isLoadingRegions}
                  isLoadingUserProfile={isLoadingUserProfile}
                  effectiveUserRegion={effectiveUserRegion}
                  justOpened={justOpened}
                  shippingValidation={shippingValidation}
                  getUserRegionName={getUserRegionName}
                />

              </Stack>
            </Box>

            {/* Subtotal siempre al final */}
            <Box sx={{ p: 2, pt: 0 }}>
              <SubtotalSection currentPricing={currentPricing} shippingValidation={shippingValidation} />
            </Box>

            {/* Footer con botón */}
            <Box sx={{ 
              p: 2, 
              pt: 1,
              borderTop: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              {/**
               * Reglas de deshabilitación del botón:
               * - Producto propio
               * - Procesando
               * - Validación explícita indica que NO se puede despachar
               * - Cantidad inválida (solo para productos normales)
               * - Región de usuario NO configurada (nuevo requisito)
               *   Nota: Cuando la región no está configurada, shippingValidation permanece null
               *   porque la validación on-demand se salta (early return). Antes esto dejaba el botón habilitado.
               */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleAddToCart}
                disabled={shouldDisableButton({
                  isOwnProduct,
                  isProcessing,
                  shippingValidation,
                  isOfferMode,
                  quantityError,
                  effectiveUserRegion,
                  isLoadingUserProfile,
                  isLoadingUserRegion,
                  justOpened,
                }) || (isOfferMode && isOfferInCart)}
                sx={{ py: 1.5 }}
              >
                {isProcessing ? 
                  (isOfferMode ? 'Procesando oferta...' : 'Agregando...') : 
                  (isOfferMode ? 
                    'Confirmar Oferta' : 
                    (documentType === 'factura' && !isBillingComplete ? 'Completar Facturación' : 'Agregar al Carrito')
                  )
                }
              </Button>
            </Box>

          </Box>
        </Drawer>
      )}
    </AnimatePresence>
  );
};

export default AddToCartModal;
