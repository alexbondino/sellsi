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
import { useUnifiedShippingValidation } from '../../hooks/shipping/useUnifiedShippingValidation';
import { calculatePriceForQuantity, normalizePriceTiers } from '../../../utils/priceCalculation';
import { supabase } from '../../../services/supabase';
import { useSupplierDocumentTypes } from '../../utils/supplierDocumentTypes';

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
  product,
  initialQuantity = 1,
  userRegion = null,
  isLoadingUserProfile = false, // Nuevo prop para indicar si el perfil del usuario está cargando
  isOwnProduct = false, // Nuevo: deshabilitar agregar si es producto propio
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
        // Clonar arrays de tiers si existen para evitar mutaciones compartidas
        priceTiers: product?.priceTiers ? product.priceTiers.map(t => ({ ...t })) : product?.priceTiers,
        price_tiers: product?.price_tiers ? product.price_tiers.map(t => ({ ...t })) : product?.price_tiers,
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
    stock: enrichedProduct?.stock || enrichedProduct?.maxStock || enrichedProduct?.productqty || 50,
    shippingRegions: enrichedProduct?.shippingRegions || enrichedProduct?.delivery_regions || [],
  }), [enrichedProduct]);

  // Hook para validación de despacho optimizado - Solo bajo demanda
  const { validateSingleProduct, getUserRegionName, userRegion: hookUserRegion } = useUnifiedShippingValidation();

  // Usar la región del hook o la prop (fallback)
  const effectiveUserRegion = hookUserRegion || userRegion;

  // Estado para validación de shipping (solo cuando se necesite)
  const [shippingValidation, setShippingValidation] = useState(null);
  const [isValidatingShipping, setIsValidatingShipping] = useState(false);

  // Función para validar shipping solo cuando se abre el modal
  const validateShippingOnDemand = useCallback(async () => {
    if (!effectiveUserRegion || !enrichedProduct || isLoadingRegions || isLoadingUserProfile) {
      setShippingValidation(null);
      return;
    }

    setIsValidatingShipping(true);
    try {
      const validation = validateSingleProduct(enrichedProduct);
      setShippingValidation(validation);
    } catch (error) {
      console.error('Error validating shipping:', error);
      setShippingValidation(null);
    } finally {
      setIsValidatingShipping(false);
    }
  }, [enrichedProduct, effectiveUserRegion, validateSingleProduct, isLoadingRegions, isLoadingUserProfile]);

  // Validar shipping solo cuando se abre el modal y los datos están listos
  useEffect(() => {
    if (open && !isLoadingRegions && !isLoadingUserProfile && effectiveUserRegion && enrichedProduct) {
      // ESPERAR UN TICK para asegurar que las regiones se hayan cargado completamente
      const timer = setTimeout(() => {
        validateShippingOnDemand();
      }, 100); // Pequeño delay para asegurar sincronización
      
      return () => clearTimeout(timer);
    } else {
      setShippingValidation(null);
    }
  }, [open, isLoadingRegions, isLoadingUserProfile, effectiveUserRegion, enrichedProduct, validateShippingOnDemand]);

  // ============================================================================
  // CÁLCULOS DE PRECIOS DINÁMICOS
  // ============================================================================

  // Normalizar tiers para UI (precio DESC estable). Solo recalcula cuando cambia la referencia original
  const displayPriceTiers = useMemo(() => normalizePriceTiers(productData.priceTiers, 'price_desc'), [productData.priceTiers]);

  // Calcular precio actual basado en cantidad y tramos (usar tiers originales para consistencia de cálculo)
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
    if (!productData.priceTiers || productData.priceTiers.length === 0) return null;
    return productData.priceTiers.find(tier => {
      const minQty = tier.min_quantity || 1;
      const maxQty = tier.max_quantity;
      return quantity >= minQty && (maxQty == null || quantity <= maxQty);
    }) || null;
  }, [quantity, productData.priceTiers]);

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(newQuantity);
    
    // Para productos con price tiers, usar el primer tramo como mínimo
    const { priceTiers, stock } = productData;
    let effectiveMinimum = productData.minimumPurchase;
    let effectiveMaximum = Math.min(productData.maxPurchase, stock);
    
    if (priceTiers.length > 0) {
      // Si hay tramos, usar la cantidad mínima del primer tramo
      const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
      effectiveMinimum = sortedTiers[0]?.min_quantity || 1;
    }
    
    // Validar cantidad mínima efectiva
    if (newQuantity < effectiveMinimum) {
      setQuantityError(`La cantidad mínima de compra es ${effectiveMinimum} unidades`);
    } 
    // Validar cantidad máxima contra stock disponible
    else if (newQuantity > effectiveMaximum) {
      setQuantityError(`La cantidad máxima disponible es ${effectiveMaximum} unidades`);
    } 
    else {
      setQuantityError('');
    }
  }, [productData.minimumPurchase, productData.priceTiers, productData.maxPurchase, productData.stock]);

  const handleDocumentTypeChange = useCallback((event) => {
    setDocumentType(event.target.value);
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Calcular cantidad mínima efectiva basada en si hay price tiers
    const { priceTiers, stock } = productData;
    let effectiveMinimum = productData.minimumPurchase;
    let effectiveMaximum = Math.min(productData.maxPurchase, stock);
    
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

    // Validar cantidad máxima contra stock disponible
    if (quantity > effectiveMaximum) {
      setQuantityError(`La cantidad máxima disponible es ${effectiveMaximum} unidades`);
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
      console.error('❌ [AddToCartModal] Error al agregar producto al carrito:', error);
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
  const priceTiers = displayPriceTiers;
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
          Precio antes de envío
        </Typography>
  <Stack spacing={1} sx={tiersContainerSx}>
          {priceTiers.map((tier, index) => {
            const minQty = tier.min_quantity || 1;
            const maxQty = tier.max_quantity;
            // Highlight independiente del orden: solo evaluar rango
            const isActive = quantity >= minQty && (maxQty == null || quantity <= maxQty);
            
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
                sx={tierPaperSx(isActive)}
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

  // Cantidades mínima y máxima memorizadas para pasar props primitivas estables
  const quantityBounds = useMemo(() => {
    const { priceTiers } = productData;
    let minQ = productData.minimumPurchase;
    if (priceTiers.length > 0) {
      const sortedTiers = [...priceTiers].sort((a, b) => (a.min_quantity || 1) - (b.min_quantity || 1));
      minQ = sortedTiers[0]?.min_quantity || 1;
    }
    const maxQ = Math.min(productData.maxPurchase, productData.stock);
    return { minQ, maxQ };
  }, [productData]);

  const DocumentTypeSelector = () => {
    // Si está cargando los tipos de documentos del proveedor
    if (loadingDocumentTypes) {
      return (
        <Box
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Tipo de Documento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cargando opciones...
          </Typography>
        </Box>
      );
    }

    // Si hay error cargando los tipos de documentos o no hay availableOptions
    if (documentTypesError || !availableOptions || availableOptions.length === 0) {
      return (
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
                label="No ofrecer documento tributario"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </RadioGroup>
          </FormControl>
        </Box>
      );
    }

    // Si solo hay "ninguno" como opción, mostrar texto explicativo
    if (availableOptions.length === 1 && availableOptions[0].value === 'ninguno') {
      return (
        <Box
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Tipo de Documento
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
            }}
          >
            Proveedor no ofrece documento tributario
          </Typography>
        </Box>
      );
    }

    // Mostrar solo las opciones disponibles para este proveedor (excluyendo caso de solo "ninguno")
    return (
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
            {availableOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={option.label}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
    );
  };

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
    if (!effectiveUserRegion) {
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
            Este producto tiene despacho hacia tu región: {getUserRegionName(effectiveUserRegion)}
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

      {/* Línea separada para el costo de envío: etiqueta izquierda, precio derecha (igual que Subtotal) */}
      {shippingValidation?.canShip && shippingValidation?.shippingInfo?.cost != null && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Envío
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${shippingValidation.shippingInfo.cost.toLocaleString('es-CL')}
          </Typography>
        </Stack>
      )}
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
                  Resumen del Pedido
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ color: 'common.white' }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Stack spacing={3}>
                
                {/* 1. Precios */}
                <PriceTiersDisplay />

                {/* 2. Resumen del producto con selector de cantidad (memoizado) */}
                <ProductSummary
                  productData={productData}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                  quantityError={quantityError}
                  minQuantity={quantityBounds.minQ}
                  maxQuantity={quantityBounds.maxQ}
                />

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
                  isOwnProduct ||
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
