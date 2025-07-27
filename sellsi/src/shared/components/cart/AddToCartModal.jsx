import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Avatar,
  Chip, 
  Stack,
  Paper,
  Divider,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Imports de componentes compartidos
import QuantitySelector from '../forms/QuantitySelector/QuantitySelector';
import PriceDisplay from '../display/price/PriceDisplay';
import { useShippingValidation } from '../../../domains/buyer/pages/cart/hooks/useShippingValidation';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';

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
  product,
  initialQuantity = 1,
  userRegion = null,
}) => {
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================
  
  const [quantity, setQuantity] = useState(initialQuantity);
  const [documentType, setDocumentType] = useState('factura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantityError, setQuantityError] = useState('');

  // Sincronizar cantidad inicial cuando se abre el modal
  useEffect(() => {
    if (open) {
      const minimumPurchase = product?.minimum_purchase || product?.compraMinima || 1;
      setQuantity(Math.max(initialQuantity, minimumPurchase));
      setQuantityError(''); // Limpiar errores al abrir
    }
  }, [open, initialQuantity, product]);

  // ============================================================================
  // DATOS DEL PRODUCTO Y VALIDACIONES
  // ============================================================================

  // Extraer datos del producto con fallbacks
  const productData = useMemo(() => ({
    id: product?.id,
    name: product?.nombre || product?.name || 'Producto sin nombre',
    basePrice: product?.precio || product?.price || 0,
    originalPrice: product?.precioOriginal || product?.originalPrice,
    priceTiers: product?.priceTiers || product?.price_tiers || [],
    thumbnail: product?.thumbnail || product?.image_url,
    supplier: product?.proveedor || product?.supplier || 'Proveedor no encontrado',
    minimumPurchase: product?.minimum_purchase || product?.compraMinima || 1,
    maxPurchase: product?.max_purchase || product?.maxPurchase || 999,
    shippingRegions: product?.shippingRegions || product?.delivery_regions || [],
  }), [product]);

  // Hook para validación de despacho - Solo necesitamos las funciones, no los estados
  const { validateProductShipping, getUserRegionName } = useShippingValidation([], false);

  // Validar despacho para el producto actual
  const shippingValidation = useMemo(() => {
    if (!userRegion || !product) return null;
    return validateProductShipping(product, userRegion);
  }, [product, userRegion, validateProductShipping]);

  // ============================================================================
  // CÁLCULOS DE PRECIOS DINÁMICOS
  // ============================================================================

  // Calcular precio actual basado en cantidad y tramos
  const currentPricing = useMemo(() => {
    const { priceTiers, basePrice } = productData;
    
    if (priceTiers.length > 0) {
      const unitPrice = calculatePriceForQuantity(quantity, priceTiers, basePrice);
      return {
        unitPrice,
        total: unitPrice * quantity,
        hasDiscountTiers: true,
      };
    }
    
    return {
      unitPrice: basePrice,
      total: basePrice * quantity,
      hasDiscountTiers: false,
    };
  }, [quantity, productData]);

  // Encontrar el tramo activo para resaltado (SOLO el que corresponde a la cantidad actual)
  const activeTier = useMemo(() => {
    const { priceTiers } = productData;
    if (priceTiers.length === 0) return null;
    
    // Buscar el tramo que corresponde exactamente a la cantidad actual
    for (const tier of priceTiers) {
      const minQty = tier.min_quantity || 1;
      const maxQty = tier.max_quantity;
      
      if (quantity >= minQty && (maxQty === null || quantity <= maxQty)) {
        return tier;
      }
    }
    
    return null;
  }, [quantity, productData.priceTiers]);

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(newQuantity);
    
    // Validar cantidad mínima
    const minPurchase = productData.minimumPurchase;
    if (newQuantity < minPurchase) {
      setQuantityError(`La cantidad mínima de compra es ${minPurchase} unidades`);
    } else {
      setQuantityError('');
    }
  }, [productData.minimumPurchase]);

  const handleDocumentTypeChange = useCallback((event) => {
    setDocumentType(event.target.value);
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Validar cantidad antes de procesar
    if (quantity < productData.minimumPurchase) {
      setQuantityError(`La cantidad mínima de compra es ${productData.minimumPurchase} unidades`);
      return;
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
      console.error('Error adding to cart:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    quantity,
    productData,
    documentType,
    currentPricing,
    activeTier,
    onAddToCart,
    onClose
  ]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  const PriceTiersDisplay = () => {
    const { priceTiers } = productData;
    
    if (priceTiers.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
            Precio único
          </Typography>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800, mt: 1 }}>
            ${productData.basePrice.toLocaleString('es-CL')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            por unidad
          </Typography>
        </Paper>
      );
    }

    // Función auxiliar para determinar el tramo activo exacto
    const getActiveTierIndex = (quantity, tiers) => {
      // Ordenar tramos por cantidad mínima
      const sortedTiers = [...tiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
      
      for (let i = 0; i < sortedTiers.length; i++) {
        const tier = sortedTiers[i];
        const minQty = tier.min_quantity || 1;
        const maxQty = tier.max_quantity;
        
        if (maxQty === null || maxQty === undefined) {
          // Último tramo: activo si quantity >= minQty
          if (quantity >= minQty) {
            return tiers.findIndex(t => t === tier);
          }
        } else {
          // Tramo intermedio: activo si minQty <= quantity <= maxQty
          if (quantity >= minQty && quantity <= maxQty) {
            return tiers.findIndex(t => t === tier);
          }
        }
      }
      return -1; // Ningún tramo activo
    };

    const activeTierIndex = getActiveTierIndex(quantity, priceTiers);

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Precios por cantidad
        </Typography>
        <Stack spacing={1}>
          {priceTiers.map((tier, index) => {
            const isActive = index === activeTierIndex;
            const minQty = tier.min_quantity || 1;
            const maxQty = tier.max_quantity;
            
            const rangeText = maxQty 
              ? `${minQty} - ${maxQty}` 
              : `${minQty}+`;

            return (
              <Paper
                key={tier.id || index}
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                sx={{
                  p: 2,
                  border: isActive ? 2 : 1,
                  borderColor: isActive ? 'primary.main' : 'grey.300',
                  bgcolor: isActive ? 'primary.50' : 'transparent',
                  cursor: 'default',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography 
                      variant="body2" 
                      color={isActive ? 'primary.main' : 'black'}
                      sx={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {rangeText} unidades
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    color={isActive ? 'primary.main' : 'black'}
                    sx={{ fontWeight: isActive ? 700 : 600 }}
                  >
                    ${tier.price.toLocaleString('es-CL')}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  };

  const QuantityErrorDisplay = () => {
    if (!quantityError) return null;

    return (
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
    );
  };

  const ProductSummary = () => (
    <Paper 
      variant="outlined" 
      sx={{ p: 2 }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={productData.thumbnail}
          alt={productData.name}
          sx={{ 
            width: 40, 
            height: 40,
            pointerEvents: 'none',
          }}
          variant="rounded"
        />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1, pointerEvents: 'none' }}>
              {productData.name}
            </Typography>
            <Box sx={{ ml: 2, pointerEvents: 'auto', position: 'relative' }}>
              <QuantitySelector
                value={quantity}
                onChange={handleQuantityChange}
                min={productData.minimumPurchase}
                max={productData.maxPurchase}
                size="small"
                orientation="horizontal"
                label="Cantidad:"
                sx={{
                  '& .MuiFormHelperText-root': {
                    display: 'none', // Ocultar mensajes de error para evitar desacople del layout
                  },
                }}
              />
              <QuantityErrorDisplay />
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ pointerEvents: 'none' }}>
            Precio unitario: ${currentPricing.unitPrice.toLocaleString('es-CL')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const DocumentTypeSelector = () => (
    <Box
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Tipo de Documento
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          value={documentType}
          onChange={handleDocumentTypeChange}
          row
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <FormControlLabel
            value="factura"
            control={<Radio size="small" />}
            label="Factura"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <FormControlLabel
            value="boleta"
            control={<Radio size="small" />}
            label="Boleta"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <FormControlLabel
            value="ninguno"
            control={<Radio size="small" />}
            label="Ninguno"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  const ShippingStatus = () => {
    if (!shippingValidation) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Configura tu región en tu perfil para ver disponibilidad de despacho
          </Typography>
        </Alert>
      );
    }

    if (shippingValidation.canShip) {
      return (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          icon={<CheckIcon />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Este producto tiene despacho hacia tu región: {getUserRegionName(userRegion)}
          </Typography>
          {shippingValidation.shippingInfo && (
            <Typography variant="caption" color="text.secondary">
              {shippingValidation.message}
            </Typography>
          )}
        </Alert>
      );
    }

    return (
      <Alert 
        severity="warning" 
        sx={{ mt: 2 }}
        icon={<WarningIcon />}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Este producto actualmente no cuenta con despacho hacia tu región
        </Typography>
        {shippingValidation.availableRegions && shippingValidation.availableRegions.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Este producto solo tiene despacho a: {shippingValidation.availableRegions.join(', ')}
          </Typography>
        )}
      </Alert>
    );
  };

  const SubtotalSection = () => (
    <Paper 
      variant="outlined" 
      sx={{ p: 2, bgcolor: 'grey.50' }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Subtotal
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${currentPricing.total.toLocaleString('es-CL')}
          </Typography>
          {currentPricing.hasDiscountTiers && (
            <Typography variant="caption" color="text.secondary">
              (${currentPricing.unitPrice.toLocaleString('es-CL')} por unidad)
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <AnimatePresence mode="wait">
      {open && (
        <Drawer
          anchor="right"
          open={open}
          onClose={handleClose}
          PaperProps={{
            component: motion.div,
            initial: { x: '100%' },
            animate: { x: 0 },
            exit: { x: '100%' },
            transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
            sx: {
              width: { xs: '100%', sm: 460, md: 518 }, // 15% más ancho: 400*1.15=460, 450*1.15=518
              maxWidth: '90vw',
              zIndex: 9999, // Mayor z-index que FAB y WhatsApp
            },
          }}
          ModalProps={{
            keepMounted: false,
            BackdropProps: {
              sx: {
                zIndex: 9998, // Backdrop justo debajo del modal
              }
            }
          }}
          sx={{
            zIndex: 9999, // También en el Drawer principal
          }}
        >
          <Box 
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => {
              // Solo evitar propagación si el click no viene de un elemento interactivo
              if (!e.target.closest('button, input, [role="button"]')) {
                e.stopPropagation();
              }
            }}
          >
            
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Selecciona la Cantidad y Tipo de documento
                </Typography>
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Stack spacing={3}>
                
                {/* 1. Precios */}
                <PriceTiersDisplay />

                {/* 2. Resumen del producto con selector de cantidad */}
                <ProductSummary />

                {/* 3. Tipo de documento */}
                <DocumentTypeSelector />

                {/* 4. Estado de despacho */}
                <ShippingStatus />

              </Stack>
            </Box>

            {/* Subtotal siempre al final */}
            <Box sx={{ p: 2, pt: 0 }}>
              <SubtotalSection />
            </Box>

            {/* Footer con botón */}
            <Box sx={{ 
              p: 2, 
              pt: 1,
              borderTop: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleAddToCart}
                disabled={
                  isProcessing || 
                  (shippingValidation && !shippingValidation.canShip) ||
                  !!quantityError
                }
                sx={{ py: 1.5 }}
              >
                {isProcessing ? 'Agregando...' : 'Agregar al Carrito'}
              </Button>
            </Box>

          </Box>
        </Drawer>
      )}
    </AnimatePresence>
  );
};

export default AddToCartModal;
