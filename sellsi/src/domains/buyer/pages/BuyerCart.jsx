import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  lazy,
  Suspense,
} from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Backdrop,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ThumbUp as RecommendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { showCartSuccess, showCartError } from '../../../utils/toastHelpers';
import { useInView } from 'react-intersection-observer';
import debounce from 'lodash.debounce';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { useAdvancedPriceCalculation, useCartStats } from '../../../shared/stores/cart';
import { calculateRealShippingCost } from '../../../utils/shippingCalculation';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import {
  CartHeader,
  ShippingProgressBar,
  CartItem,
  OrderSummary,
  EmptyCartState,
} from './cart';
import MobileCartLayout from './cart/components/MobileCartLayout';
import useShippingValidation from './cart/hooks/useShippingValidation';
import ShippingCompatibilityModal from './cart/components/ShippingCompatibilityModal';

// ============================================================================
// ULTRA-PREMIUM BUYER CART COMPONENT - NIVEL 11/10
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../../infrastructure/providers';
// ============================================================================

// Lazy loading components para optimización
// RecommendedProducts removed (legacy); dynamic import deleted to avoid build error

// ============================================================================
// COMPONENTE PRINCIPAL ULTRA-PREMIUM
// ============================================================================

const BuyerCart = () => {
  // ===== ZUSTAND STORE (SELECTORES MEMOIZADOS) =====
  const items = useCartStore(state => state.items);
  const isLoading = useCartStore(state => state.isLoading);
  const isBackendSynced = useCartStore(state => state.isBackendSynced);

  // Acciones memoizadas del store
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const removeItemsBatch = useCartStore(state => state.removeItemsBatch);
  const clearCart = useCartStore(state => state.clearCart);
  // const getSubtotal = useCartStore(state => state.getSubtotal); // ✅ REEMPLAZADO POR usePriceCalculation
  // const getDiscount = useCartStore(state => state.getDiscount); // ✅ REEMPLAZADO POR usePriceCalculation

  // ===== ESTADOS LOCALES OPTIMIZADOS =====
  
  const [lastAction, setLastAction] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(null);
  // Estados para el sistema de selección múltiple (memoizados)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Estado para manejar envíos por producto (optimizado)
  const [productShipping, setProductShipping] = useState(() => {
    const initialShipping = {};
    items.forEach(item => {
      initialShipping[item.id] = 'standard';
    });
    return initialShipping;
  });

  // ===== ESTADO PARA COSTO REAL DE ENVÍO =====
  const [realShippingCost, setRealShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // ===== SHIPPING VALIDATION HOOK =====
  const [compatibilityModalOpen, setCompatibilityModalOpen] = useState(false);
  // ✅ NUEVO: Modo avanzado por defecto, sin toggle
  const isAdvancedShippingMode = true;
  const shippingValidation = useShippingValidation(items, isAdvancedShippingMode);

  // ⚡ FIX CRÍTICO: Mantener último valor conocido de userRegion para evitar
  // pérdida de estado al minimizar/restaurar navegador
  const [stableUserRegion, setStableUserRegion] = useState(null);
  
  React.useEffect(() => {
    console.log('🔍 [BuyerCart] stableUserRegion effect:', {
      hookValue: shippingValidation.userRegion,
      currentStable: stableUserRegion,
      willUpdate: shippingValidation.userRegion && shippingValidation.userRegion !== stableUserRegion
    });
    // Solo actualizar si hay un nuevo valor válido
    if (shippingValidation.userRegion && shippingValidation.userRegion !== stableUserRegion) {
      console.log('✅ [BuyerCart] Actualizando stableUserRegion a:', shippingValidation.userRegion);
      setStableUserRegion(shippingValidation.userRegion);
    }
    // NO actualizar a null si ya teníamos un valor
  }, [shippingValidation.userRegion, stableUserRegion]);

  // ===== DEBUGGING: Log para verificar que las regiones se están cargando =====
  React.useEffect(() => {
    if (isAdvancedShippingMode && items.length > 0) {
      // Log removido para producción
    }
  }, [items, isAdvancedShippingMode, shippingValidation]);

  // ===== CÁLCULOS UNIFICADOS CON HOOK =====
  const priceCalculations = useAdvancedPriceCalculation(
    items,
    productShipping,
    isAdvancedShippingMode ? null : realShippingCost,
    stableUserRegion // ⚡ Usar valor estable en lugar de directamente de shippingValidation
  );

  // Extraer valores para compatibilidad con código existente
  const cartCalculations = {
    subtotal: priceCalculations.subtotal,
    total: priceCalculations.subtotalAfterDiscount // Total sin envío para compatibilidad
  };

  const cartStats = useCartStats(items);

  // ===== VALIDACIÓN DE COMPRA MÍNIMA POR PROVEEDOR =====
  const supplierMinimumValidation = useMemo(() => {
    // Agrupar productos por proveedor y calcular totales
    const bySupplier = items.reduce((acc, item) => {
      const supplierId = item.supplier_id || item.supplierId;
      const supplierName = item.proveedor || item.supplier || `Proveedor #${supplierId}`;
      const minimumAmount = item.minimum_purchase_amount || 0;
      
      if (!supplierId) return acc; // Skip items sin supplier_id
      
      if (!acc[supplierId]) {
        acc[supplierId] = {
          name: supplierName,
          minimumAmount: minimumAmount,
          currentTotal: 0,
          products: []
        };
      }
      
      // Sumar total del producto SIN incluir envío
      // Considerar price tiers si existen (misma lógica que sumSubtotal)
      let itemTotal = 0;
      if (item.price_tiers && item.price_tiers.length > 0) {
        const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0;
        const calculatedPrice = calculatePriceForQuantity(item.quantity, item.price_tiers, basePrice);
        itemTotal = calculatedPrice * (item.quantity || 0);
      } else {
        itemTotal = (Number(item.price) || 0) * (item.quantity || 0);
      }
      
      acc[supplierId].currentTotal += itemTotal;
      acc[supplierId].products.push(item);
      
      return acc;
    }, {});
    
    // Filtrar solo los proveedores que NO cumplen con el mínimo
    const violations = Object.entries(bySupplier)
      .filter(([id, data]) => data.minimumAmount > 0 && data.currentTotal < data.minimumAmount)
      .map(([id, data]) => ({
        supplierId: id,
        supplierName: data.name,
        minimumAmount: data.minimumAmount,
        currentTotal: data.currentTotal,
        missing: data.minimumAmount - data.currentTotal,
        products: data.products
      }));
    
    return {
      hasViolations: violations.length > 0,
      violations: violations,
      count: violations.length
    };
  }, [items]);

  // ===== CALCULAR COSTO REAL DE ENVÍO (SOLO MODO SIMPLE) =====
  useEffect(() => {
    const calculateShipping = async () => {
      if (items.length === 0 || isAdvancedShippingMode) {
        setRealShippingCost(0);
        setIsCalculatingShipping(false);
        return;
      }

      setIsCalculatingShipping(true);

      try {
        const cost = await calculateRealShippingCost(items);
        setRealShippingCost(cost);
      } catch (error) {
        // Usar cálculo del hook como fallback
        setRealShippingCost(0); // El hook manejará el cálculo
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShipping();
  }, [items, isAdvancedShippingMode]);

  // Usar cálculos del hook para envío y total final
  const productShippingCost = priceCalculations.shipping;
  const finalTotal = priceCalculations.total;
  
  // Combinar estados de cálculo: local (modo simple) + hook (modo avanzado)
  const isShippingBeingCalculated = isAdvancedShippingMode 
    ? priceCalculations.isShippingCalculating 
    : isCalculatingShipping;
  
  // Combinar estados de cálculo: tanto el del hook como el local
  const isCalculatingShippingCombined = isCalculatingShipping || priceCalculations.isShippingCalculating;

  // ===== ANIMACIONES =====
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1 });

  // ===== EFECTO PARA SINCRONIZAR SHIPPING CON ITEMS DEL CARRITO =====
  useEffect(() => {
    // Sincronizar productShipping cuando se agreguen/quiten productos
    setProductShipping(prev => {
      const newShipping = { ...prev };

      // Agregar envío estándar para nuevos productos
      items.forEach(item => {
        if (!newShipping[item.id]) {
          newShipping[item.id] = 'standard';
        }
      });

      // Remover envíos de productos que ya no están en el carrito
      Object.keys(newShipping).forEach(productId => {
        if (!items.find(item => item.id === productId)) {
          delete newShipping[productId];
        }
      });

      return newShipping;
    });
  }, [items]);

  // ===== EFECTOS =====
  useEffect(() => {
    // Calcular fecha estimada de entrega basada en la opción más lenta
    if (items.length > 0) {
      const today = new Date();
      let maxDeliveryDays = 0;

      // Encontrar el envío más lento entre todos los productos
      items.forEach(item => {
        const selectedShippingId = productShipping[item.id] || 'standard';
        // Cálculo dinámico de envío - ya no depende de SHIPPING_OPTIONS
        const deliveryDays = 3; // Valor por defecto, será calculado dinámicamente
        maxDeliveryDays = Math.max(maxDeliveryDays, deliveryDays);
      });

      const estimatedDate = new Date(today);
      estimatedDate.setDate(today.getDate() + maxDeliveryDays);
      setDeliveryDate(estimatedDate);
    }
  }, [items, productShipping]);
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  // ===== EFECTO PARA DETECTAR REGRESO DESPUÉS DE CHECKOUT =====
  useEffect(() => {
    // Detectar si el usuario regresa a una página de carrito vacío
    // (probablemente después de un checkout exitoso)
    const handlePageFocus = () => {
      const currentItems = useCartStore.getState().items;
      if (currentItems.length === 0 && document.hasFocus()) {
        // Solo mostrar notificación de bienvenida si el carrito está vacío
      }
    };

    // Escuchar cuando la página gana foco (usuario regresa)
    window.addEventListener('focus', handlePageFocus);

    return () => {
      window.removeEventListener('focus', handlePageFocus);
    };
  }, []);

  // ===== ANIMACIONES FRAMER MOTION =====
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
    exit: {
      x: -300,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  }; // ===== FUNCIONES OPTIMIZADAS =====
  // Función optimizada para actualización inmediata de cantidad
  const handleQuantityChange = useCallback(
    (id, quantity) => {
      // Actualizar inmediatamente para mejor UX
      updateQuantity(id, quantity);
      setLastAction({ type: 'quantity', id, quantity });
    },
    [updateQuantity]
  );

  // Versión con debounce reducido solo para casos específicos
  const debouncedUpdateQuantity = useCallback(
    debounce((id, quantity) => {
      updateQuantity(id, quantity);
      setLastAction({ type: 'quantity', id, quantity });
    }, 10), // OPTIMIZADO: 10ms para máxima velocidad
    [updateQuantity]
  );

  // Set para evitar múltiples toasts por item eliminado
  const deletedItemsRef = React.useRef(new Set());
  const handleRemoveWithAnimation = useCallback(
    async (id) => {
      if (deletedItemsRef.current.has(id)) return; // Ya se eliminó, no mostrar otro toast
      deletedItemsRef.current.add(id);
      const item = items.find(item => item.id === id);
      if (!item) return;

      setLastAction({ type: 'remove', item });

      try {
        // If backend is synced, wait for actual deletion confirmation
        if (isBackendSynced) {
          const result = await removeItem(id);
          if (result) {
            showCartSuccess(`${item.name} eliminado del carrito`, '🗑️');
          } else {
            // Backend removal failed - show error and clear from deleted set so user can retry
            deletedItemsRef.current.delete(id);
            showCartError('No se pudo eliminar el producto. Intenta de nuevo.');
          }
        } else {
          // Local removal - immediate UX
          await removeItem(id);
          showCartSuccess(`${item.name} eliminado del carrito`, '🗑️');
        }
      } catch (error) {
        deletedItemsRef.current.delete(id);
        showCartError('Error al eliminar el producto');
      }
    },
    [items, removeItem, isBackendSynced]
  );

  // Manejar cambios de envío por producto
  const handleProductShippingChange = useCallback((productId, shippingId) => {
    setProductShipping(prev => ({
      ...prev,
      [productId]: shippingId,
    }));
  }, []);
  // ===== FUNCIONES PLACEHOLDER PARA HISTORIAL (OPTIMIZADAS) =====
  // TODO: Implementar historial completo de acciones del carrito
  const undo = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Implementar lógica de undo
  }, []);

  const redo = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Implementar lógica de redo
  }, []);

  const getUndoInfo = useCallback(
    () => ({
      canUndo: false,
      action: null,
    }),
    []
  );

  const getRedoInfo = useCallback(
    () => ({
      canRedo: false,
      action: null,
    }),
    []
  );

  const getHistoryInfo = useCallback(
    () => ({
      history: [],
      currentIndex: 0,
    }),
    []
  );

  const navigate = useNavigate();
  const { currentAppRole } = useRole();
  const theme = useTheme();

  // ===== DETECCIÓN DE MOBILE =====
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleBack = useCallback(() => {
    // Si está en modo supplier, volver a supplier/home
    // Si está en modo buyer, volver a /buyer/marketplace
    if (currentAppRole === 'supplier') {
      navigate('/supplier/home');
    } else {
      navigate('/buyer/marketplace');
    }
  }, [navigate, currentAppRole]);

  const handleCheckout = useCallback(async () => {
    // Validar compatibilidad de envío antes del checkout
    if (isAdvancedShippingMode && !shippingValidation.isCartCompatible) {
      setCompatibilityModalOpen(true);
      return;
    }

    setIsCheckingOut(true);

    try {
      // Simular proceso de checkout
      await new Promise(resolve => setTimeout(resolve, 100)); // OPTIMIZADO: 100ms
      // toast de éxito eliminado, solo navegación

      // No limpiar el carrito después del checkout

      // Navegar al método de pago
      navigate('/buyer/paymentmethod');
    } catch (error) {
      showCartError('Error en el proceso de compra');
    } finally {
      setIsCheckingOut(false);
    }
  }, [clearCart, isAdvancedShippingMode, shippingValidation.isCartCompatible]);

  // ===== FUNCIONES DE SELECCIÓN MÚLTIPLE =====
  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      // Al salir del modo selección, limpiar selecciones
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const handleToggleItemSelection = useCallback(itemId => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      // Si ya están todos seleccionados, deseleccionar todo
      setSelectedItems([]);
    } else {
      // Seleccionar todos los items
      setSelectedItems(items.map(item => item.id));
    }
  }, [selectedItems.length, items]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    await removeItemsBatch(selectedItems);
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, [selectedItems, removeItemsBatch]);

  // Limpiar selecciones cuando cambie la lista de items
  useEffect(() => {
    setSelectedItems(prev =>
      prev.filter(selectedId => items.some(item => item.id === selectedId))
    );
  }, [items]);

  // ===== FORMATEO Y UTILIDADES MEMOIZADAS =====
  const formatPrice = useCallback(price => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatDate = useCallback(date => {
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }, []);
  // ===== RENDERIZADO DE ESTADO VACÍO =====
  if (items.length === 0) {
    return (
      <Box>
        {/* <Toaster position="top-right" toastOptions={{ style: { marginTop: 72 } }} /> */}
        <Box sx={{ display: 'flex' }}>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              ml: 0,
              p: 3,
              backgroundColor:
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              minHeight: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {' '}
              <EmptyCartState />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
  // ===== RENDERIZADO PRINCIPAL =====
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          // Remover padding horizontal en mobile para permitir edge-to-edge real
          px: { xs: 0, sm: 0, md: 2, lg: 4, xl: 4 },
          pb: isMobile ? 0 : SPACING_BOTTOM_MAIN,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Agrega margen izquierdo solo en desktop (md+)
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          transition: 'margin-left 0.3s',
        }}
      >
        {/* Layout condicional: móvil vs desktop */}
        {isMobile ? (
          <Box sx={{ width: '100%', maxWidth: '100%', px: 0, mx: 'auto' }}>
            <MobileCartLayout
              items={items}
              calculations={{
                subtotal: cartCalculations.subtotal,
                shipping: productShippingCost,
                total: finalTotal,
                discount: 0
              }}
              cartStats={cartStats}
              onCheckout={handleCheckout}
              onBack={handleBack}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveWithAnimation}
              formatPrice={formatPrice}
              isCheckingOut={isCheckingOut}
            />
          </Box>
        ) : (
          /* Layout desktop ORIGINAL restaurado */
          <Box
            sx={{
              backgroundColor: { xs: 'transparent', md: 'white' },
              width: '100%',
              maxWidth: '100%',
              mx: 'auto',
              p: { xs: 0, md: 2, lg: 3, xl: 3 },
              mb: { xs: 3, md: 6 },
              border: { xs: 'none', md: '1.5px solid #e0e0e0' },
              boxShadow: { xs: 'none', md: 6 },
              borderRadius: { xs: 0, md: 3 },
            }}
          >
            <motion.div
              ref={ref}
              variants={containerVariants}
              initial="hidden"
              animate={controls}
            >
              {/* Header con estadísticas */}
              <CartHeader
                cartStats={cartStats}
                formatPrice={formatPrice}
                discount={0}
                onBack={handleBack}
                onUndo={undo}
                onRedo={redo}
                onClearCart={clearCart}
                undoInfo={getUndoInfo()}
                redoInfo={getRedoInfo()}
                historyInfo={getHistoryInfo()}
                // Nuevas props para selección múltiple
                isSelectionMode={isSelectionMode}
                selectedItems={selectedItems}
                onToggleSelectionMode={handleToggleSelectionMode}
                onSelectAll={handleSelectAll}
                onDeleteSelected={handleDeleteSelected}
                totalItems={items.length}
                // Validación de compra mínima por proveedor
                supplierMinimumValidation={supplierMinimumValidation}
              />
              
              {/* Barra de progreso hacia envío gratis */}
              {/* <ShippingProgressBar
                  subtotal={cartCalculations.subtotal}
                  formatPrice={formatPrice}
                  itemVariants={itemVariants}
                /> */}
              
              <Grid
                container
                spacing={{ xs: 2, md: 1.5, lg: 2, xl: 3 }}
                sx={{
                  flexWrap: { xs: 'wrap', sm: 'wrap', md: 'nowrap' },
                  alignItems: 'flex-start'
                }}
              >
                {/* Lista de productos */}
                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={9.6}
                  lg={9.6}
                  xl={9.6}
                  sx={{
                    order: { xs: 1 },
                    flexBasis: { xs: '100%', md: '72%', lg: '75%', xl: '75%' },
                    maxWidth: { xs: '100%', md: '72%', lg: '75%', xl: '75%' },
                  }}
                >
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <CartItem
                        key={
                          item.id ||
                          item.product_id ||
                          item.cart_items_id ||
                          `item-${index}`
                        }
                        item={item}
                        formatPrice={formatPrice}
                        updateQuantity={handleQuantityChange}
                        handleRemoveWithAnimation={handleRemoveWithAnimation}
                        itemVariants={itemVariants}
                        onShippingChange={handleProductShippingChange}
                        // Nuevas props para selección múltiple
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedItems.includes(item.id)}
                        onToggleSelection={handleToggleItemSelection}
                        // Nuevas props para validación de envío
                        shippingValidation={shippingValidation}
                        isAdvancedShippingMode={isAdvancedShippingMode}
                      />
                    ))}
                  </AnimatePresence>
                  {/* Productos recomendados */}
                  {false && (
                    <motion.div variants={itemVariants}>
                      <Accordion sx={{ mt: 3, borderRadius: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <RecommendIcon
                              sx={{ mr: 1, color: 'primary.main' }}
                            />
                            <Typography variant="h6">
                              Productos Recomendados para Ti
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Suspense fallback={<CircularProgress />}>
                            {/* Aquí iría el componente de productos recomendados */}
                            <Typography>
                              Productos recomendados basados en tu carrito...
                            </Typography>
                          </Suspense>
                        </AccordionDetails>
                      </Accordion>
                    </motion.div>
                  )}
                </Grid>
                {/* Panel lateral - Resumen y opciones */}
                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={2.4}
                  lg={2.4}
                  xl={2.4}
                  sx={{
                    order: { xs: 2 },
                    mt: { xs: 2, sm: 2, md: 0 },
                    flexBasis: { xs: '100%', md: '28%', lg: '25%', xl: '25%' },
                    maxWidth: { xs: '100%', md: '28%', lg: '25%', xl: '25%' },
                  }}
                >
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    {/* Resumen del pedido modularizado (sin códigos de descuento) */}
                    <motion.div variants={itemVariants}>
                      <OrderSummary
                        subtotal={cartCalculations.subtotal}
                        discount={0}
                        shippingCost={productShippingCost}
                        total={finalTotal}
                        cartStats={cartStats}
                        deliveryDate={deliveryDate}
                        isCheckingOut={isCheckingOut}
                        shippingValidation={shippingValidation}
                        isAdvancedShippingMode={isAdvancedShippingMode}
                        onShippingCompatibilityError={() => setCompatibilityModalOpen(true)}
                        isCalculatingShipping={isCalculatingShippingCombined}
                        cartItems={items}
                        userRegion={stableUserRegion}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        onCheckout={handleCheckout}
                      />
                    </motion.div>
                    {/* Calculadora de ahorros modularizada */}
                    {/*
                      <motion.div variants={itemVariants}>
                        <SavingsCalculator
                          subtotal={cartCalculations.subtotal}
                          discount={cartCalculations.discount}
                          total={finalTotal}
                          formatPrice={formatPrice}
                        />
                      </motion.div>
                      */}
                  </Box>
                </Grid>
              </Grid>
            </motion.div>
          </Box>
        )}

        {/* Modal de compatibilidad de envío */}
        <ShippingCompatibilityModal
          open={compatibilityModalOpen}
          onClose={() => setCompatibilityModalOpen(false)}
          incompatibleProducts={shippingValidation.incompatibleProducts}
          userRegion={stableUserRegion}
        />
      </Box>
    </ThemeProvider>
  );
};

export default memo(BuyerCart);
