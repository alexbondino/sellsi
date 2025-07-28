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
import { CheckoutSummaryImage } from '../../../components/UniversalProductImage'; // Imagen universal con fallbacks
import { useShippingValidation } from '../../../domains/buyer/pages/cart/hooks/useShippingValidation';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import { supabase } from '../../../services/supabase';

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
  isLoadingUserProfile = false, // Nuevo prop para indicar si el perfil del usuario está cargando
}) => {
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================
  
  const [quantity, setQuantity] = useState(initialQuantity);
  const [documentType, setDocumentType] = useState('factura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantityError, setQuantityError] = useState('');
  const [enrichedProduct, setEnrichedProduct] = useState(product);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Función para cargar las regiones de despacho del producto
  const loadProductShippingRegions = useCallback(async (productId) => {
    if (!productId) return [];
    
    try {
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
        setEnrichedProduct(product);
        return;
      }

      // Cargar regiones de despacho desde la base de datos
      const shippingRegions = await loadProductShippingRegions(product.id);
      
      const productWithRegions = {
        ...product,
        shippingRegions,
        delivery_regions: shippingRegions,
        shipping_regions: shippingRegions,
        product_delivery_regions: shippingRegions
      };

      setEnrichedProduct(productWithRegions);
    };

    enrichProductWithRegions();
  }, [open, product, loadProductShippingRegions]);

  // Sincronizar cantidad inicial cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Calcular cantidad mínima efectiva
      let effectiveMinimum = enrichedProduct?.minimum_purchase || enrichedProduct?.compraMinima || 1;
      
      // Si hay price tiers, usar el primer tramo como mínimo
      const priceTiers = enrichedProduct?.priceTiers || enrichedProduct?.price_tiers || [];
      if (priceTiers.length > 0) {
        const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
        effectiveMinimum = sortedTiers[0]?.min_quantity || 1;
      }
      
      setQuantity(Math.max(initialQuantity, effectiveMinimum));
      setQuantityError(''); // Limpiar errores al abrir
    }
  }, [open, initialQuantity, enrichedProduct]);

  // ============================================================================
  // DATOS DEL PRODUCTO Y VALIDACIONES
  // ============================================================================

  // Extraer datos del producto con fallbacks
  const productData = useMemo(() => ({
    id: enrichedProduct?.id,
    name: enrichedProduct?.nombre || enrichedProduct?.name || 'Producto sin nombre',
    basePrice: enrichedProduct?.precio || enrichedProduct?.price || 0,
    originalPrice: enrichedProduct?.precioOriginal || enrichedProduct?.originalPrice,
    priceTiers: enrichedProduct?.priceTiers || enrichedProduct?.price_tiers || [],
    // Mapeo completo de propiedades de imagen para CheckoutSummaryImage
    thumbnail: enrichedProduct?.thumbnail || enrichedProduct?.image_url,
    thumbnailUrl: enrichedProduct?.thumbnailUrl || enrichedProduct?.thumbnail_url,
    thumbnail_url: enrichedProduct?.thumbnail_url,
    imagen: enrichedProduct?.imagen || enrichedProduct?.image_url,
    image_url: enrichedProduct?.image_url,
    thumbnails: enrichedProduct?.thumbnails,
    supplier: enrichedProduct?.proveedor || enrichedProduct?.supplier || 'Proveedor no encontrado',
    minimumPurchase: enrichedProduct?.minimum_purchase || enrichedProduct?.compraMinima || 1,
    maxPurchase: enrichedProduct?.max_purchase || enrichedProduct?.maxPurchase || 999,
    shippingRegions: enrichedProduct?.shippingRegions || enrichedProduct?.delivery_regions || [],
  }), [enrichedProduct]);

  // Hook para validación de despacho - Solo necesitamos las funciones, no los estados
  const { validateProductShipping, getUserRegionName } = useShippingValidation([], false);

  // Validar despacho para el producto actual - solo cuando tanto las regiones como el perfil estén cargados
  const shippingValidation = useMemo(() => {
    // No validar si estamos cargando regiones del producto, perfil del usuario, o no hay región del usuario
    if (!userRegion || !enrichedProduct || isLoadingRegions || isLoadingUserProfile) return null;
    return validateProductShipping(enrichedProduct, userRegion);
  }, [enrichedProduct, userRegion, validateProductShipping, isLoadingRegions, isLoadingUserProfile]);

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
    
    // Para productos con price tiers, usar el primer tramo como mínimo
    const { priceTiers } = productData;
    let effectiveMinimum = productData.minimumPurchase;
    
    if (priceTiers.length > 0) {
      // Si hay tramos, usar la cantidad mínima del primer tramo
      const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
      effectiveMinimum = sortedTiers[0]?.min_quantity || 1;
    }
    
    // Validar cantidad mínima efectiva
    if (newQuantity < effectiveMinimum) {
      setQuantityError(`La cantidad mínima de compra es ${effectiveMinimum} unidades`);
    } else {
      setQuantityError('');
    }
  }, [productData.minimumPurchase, productData.priceTiers]);

  const handleDocumentTypeChange = useCallback((event) => {
    setDocumentType(event.target.value);
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Calcular cantidad mínima efectiva basada en si hay price tiers
    const { priceTiers } = productData;
    let effectiveMinimum = productData.minimumPurchase;
    
    if (priceTiers.length > 0) {
      // Si hay tramos, usar la cantidad mínima del primer tramo
      const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
      effectiveMinimum = sortedTiers[0]?.min_quantity || 1;
    }

    // Validar cantidad antes de procesar
    if (quantity < effectiveMinimum) {
      setQuantityError(`La cantidad mínima de compra es ${effectiveMinimum} unidades`);
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
            Precio
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

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Precios antes del envío
        </Typography>
        <Stack spacing={1}>
          {priceTiers.map((tier, index) => {
            const minQty = tier.min_quantity || 1;
            const maxQty = tier.max_quantity;
            
            // LÓGICA CORREGIDA: Solo activar EL tramo que contiene exactamente la cantidad
            let isActive = false;
            
            if (maxQty === null || maxQty === undefined) {
              // Último tramo (sin máximo): activo si quantity >= minQty Y no hay tramos posteriores que apliquen
              isActive = quantity >= minQty;
              // Verificar que no hay tramos posteriores que también apliquen
              for (let i = index + 1; i < priceTiers.length; i++) {
                const laterTier = priceTiers[i];
                const laterMinQty = laterTier.min_quantity || 1;
                if (quantity >= laterMinQty) {
                  isActive = false; // Hay un tramo posterior que aplica
                  break;
                }
              }
            } else {
              // Tramo con rango definido: activo SOLO si está exactamente en el rango
              isActive = quantity >= minQty && quantity <= maxQty;
            }
            
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
        <CheckoutSummaryImage
          product={productData}
          sx={{ 
            pointerEvents: 'none',
          }}
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
                min={(() => {
                  // Calcular cantidad mínima efectiva para el QuantitySelector
                  const { priceTiers } = productData;
                  if (priceTiers.length > 0) {
                    const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
                    return sortedTiers[0]?.min_quantity || 1;
                  }
                  return productData.minimumPurchase;
                })()}
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
    // Mostrar carga mientras se cargan las regiones del producto O el perfil del usuario
    if (isLoadingRegions || isLoadingUserProfile) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Cargando información de despacho...
          </Typography>
        </Alert>
      );
    }

    // Si no hay región del usuario después de cargar el perfil, mostrar mensaje de configuración
    if (!userRegion) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Configura tu región en tu perfil para ver disponibilidad de despacho
          </Typography>
        </Alert>
      );
    }

    // Si hay región pero aún no hay validación (está procesando), seguir mostrando loading
    if (!shippingValidation) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Cargando información de despacho...
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

    // Debug: Veamos qué hay en shippingValidation
    return (
      <Alert 
        severity="warning" 
        sx={{ mt: 2 }}
        icon={<WarningIcon />}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Este producto actualmente no cuenta con despacho hacia tu región
        </Typography>
        {shippingValidation.availableRegions && shippingValidation.availableRegions.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            Este producto solo tiene despacho a: {shippingValidation.availableRegions.join(', ')}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Este producto no tiene regiones de despacho configuradas. Contáctanos a contacto@sellsi.cl para más información.
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
          onClose={handleClose} // Permitir cierre normal con X
          hideBackdrop={false}
          disableEscapeKeyDown={false} // Permitir cerrar con Escape
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
                backgroundColor: 'rgba(0, 0, 0, 0.5)', // Asegurar que sea visible
              }
            }
          }}
          sx={{
            zIndex: 9999, // También en el Drawer principal
          }}
        >
          <Box 
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  {productData.name}
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
