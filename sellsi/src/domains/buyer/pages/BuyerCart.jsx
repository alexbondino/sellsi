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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ThumbUp as RecommendIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { showCartSuccess, showCartError } from '../../../utils/toastHelpers';
import { useInView } from 'react-intersection-observer';
// import confetti from 'canvas-confetti';
import debounce from 'lodash.debounce';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { useAdvancedPriceCalculation, useCartStats } from '../../../shared/stores/cart';
import { calculateRealShippingCost } from '../../../utils/shippingCalculation';
import {
  CartHeader,
  ShippingProgressBar,
  CartItem,
  OrderSummary,
  SavingsCalculator,
  WishlistSection,
  EmptyCartState,
} from './cart';
import useShippingValidation from './cart/hooks/useShippingValidation';
import ShippingCompatibilityModal from './cart/components/ShippingCompatibilityModal';

// ============================================================================
// ULTRA-PREMIUM BUYER CART COMPONENT - NIVEL 11/10
import { useNavigate } from 'react-router-dom';
// ============================================================================

// Lazy loading components para optimización
const RecommendedProducts = lazy(() =>
  import('../../marketplace/pages/RecommendedProducts')
);

// ============================================================================
// COMPONENTE PRINCIPAL ULTRA-PREMIUM
// ============================================================================

const BuyerCart = () => {
  // ===== ZUSTAND STORE (SELECTORES MEMOIZADOS) =====
  const items = useCartStore(state => state.items);
  const wishlist = useCartStore(state => state.wishlist);
  const isLoading = useCartStore(state => state.isLoading);
  const appliedCoupons = useCartStore(state => state.appliedCoupons);
  const couponInput = useCartStore(state => state.couponInput);

  // Acciones memoizadas del store
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);
  const addToWishlist = useCartStore(state => state.addToWishlist);
  const removeFromWishlist = useCartStore(state => state.removeFromWishlist);
  const applyCoupon = useCartStore(state => state.applyCoupon);
  const removeCoupon = useCartStore(state => state.removeCoupon);
  const setCouponInput = useCartStore(state => state.setCouponInput);
  // const getSubtotal = useCartStore(state => state.getSubtotal); // ✅ REEMPLAZADO POR usePriceCalculation
  // const getDiscount = useCartStore(state => state.getDiscount); // ✅ REEMPLAZADO POR usePriceCalculation
  const getTotal = useCartStore(state => state.getTotal); // ⚠️ USADO EN handleApplyCoupon
  const isInWishlist = useCartStore(state => state.isInWishlist);

  // ===== ESTADOS LOCALES OPTIMIZADOS =====
  // const [showConfetti, setShowConfetti] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(null);
  // Estados para el sistema de selección múltiple (memoizados)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);

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
    shippingValidation.userRegion // Pasar región del usuario para cálculos reales
  );

  // Extraer valores para compatibilidad con código existente
  const cartCalculations = {
    subtotal: priceCalculations.subtotal,
    discount: priceCalculations.discount,
    total: priceCalculations.subtotalAfterDiscount // Total sin envío para compatibilidad
  };

  const cartStats = useCartStats(items);

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
    id => {
      if (deletedItemsRef.current.has(id)) return; // Ya se eliminó, no mostrar otro toast
      deletedItemsRef.current.add(id);
      const item = items.find(item => item.id === id);
      if (item) {
        removeItem(id);
        setLastAction({ type: 'remove', item });
        showCartSuccess(`${item.name} eliminado del carrito`, '🗑️');
      }
    },
    [items, removeItem]
  );

  const handleAddToWishlist = useCallback(
    item => {
      if (!isInWishlist(item.id)) {
        addToWishlist(item);
        // Confetti eliminado
      } else {
        removeFromWishlist(item.id);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
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
  const moveToCart = useCallback(item => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Implementar lógica para mover de wishlist a carrito
  }, []);

  const handleApplyCoupon = useCallback(() => {
    if (couponInput.trim()) {
      const beforeTotal = getTotal();
      applyCoupon(couponInput.trim());
      // Confetti eliminado
    }
  }, [couponInput, applyCoupon, getTotal]);

  const navigate = useNavigate();

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

  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.length === 0) return;

    // Obtener los nombres de los productos seleccionados para el toast
    const selectedItemsData = items.filter(item =>
      selectedItems.includes(item.id)
    );
    const itemNames = selectedItemsData.map(item => item.name).join(', ');

    // Eliminar todos los items seleccionados
    selectedItems.forEach(itemId => {
      removeItem(itemId);
    });

    // Limpiar selección y salir del modo selección
    setSelectedItems([]);
    setIsSelectionMode(false);
    // Confetti eliminado
  }, [selectedItems, items, removeItem]);

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
  if (items.length === 0 && !showWishlist) {
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
              <EmptyCartState
                wishlist={wishlist}
                setShowWishlist={setShowWishlist}
              />
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
          pt: { xs: 9, md: 10 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: SPACING_BOTTOM_MAIN,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Agrega margen izquierdo solo en desktop (md+)
          transition: 'margin-left 0.3s',
        }}
      >
        {/* <Toaster position="top-right" toastOptions={{ style: { marginTop: 72 } }} /> */}
        {/* ConfettiEffect eliminado */}
        <Box
          sx={{
            backgroundColor: 'white',
            width: '100%',
            maxWidth: {
              xs: 340,
              sm: 480,
              md: 700,
              lg: 1360,
              xl: 1560,
            },
            mx: 'auto',
            p: 3,
            mb: 6,
            border: '1.5px solid #e0e0e0',
            boxShadow: 6,
            borderRadius: 3,
          }}
        >
          {/* Header con estadísticas */}{' '}
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            {/* Header con estadísticas */}{' '}
            <CartHeader
              cartStats={cartStats}
              formatPrice={formatPrice}
              discount={cartCalculations.discount}
              wishlistLength={wishlist.length}
              onUndo={undo}
              onRedo={redo}
              onClearCart={clearCart}
              onToggleWishlist={() => setShowWishlist(!showWishlist)}
              showWishlist={showWishlist}
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
            />
            {/* Barra de progreso hacia envío gratis */}
            {/* <ShippingProgressBar
                subtotal={cartCalculations.subtotal}
                formatPrice={formatPrice}
                itemVariants={itemVariants}
              /> */}
            
            <Grid container spacing={{ xs: 2, md: 2, lg: 6, xl: 6 }}>
              {/* Lista de productos */}
              <Grid
                item
                xs={12}
                md={6}
                lg={6}
                xl={6}
                sx={{
                  width: {
                    xs: '100%',
                    md: '68%',
                    lg: '65%',
                    xl: '65%',
                  },
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
                      isInWishlist={isInWishlist}
                      handleAddToWishlist={handleAddToWishlist}
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
                sx={{
                  xs: 12,
                  lg: 5.5,
                  xl: 6.7,
                }}
              >
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                  {/* Resumen del pedido modularizado (sin códigos de descuento) */}
                  <motion.div variants={itemVariants}>
                    <OrderSummary
                      subtotal={cartCalculations.subtotal}
                      discount={0} // Ocultamos descuento por código
                      shippingCost={productShippingCost}
                      total={finalTotal}
                      cartStats={cartStats}
                      deliveryDate={deliveryDate}
                      appliedCoupons={[]} // Ocultamos cupones
                      couponInput={''} // Ocultamos input de cupones
                      isCheckingOut={isCheckingOut}
                      // Options
                      availableCodes={[]} // Ocultamos lista de códigos
                      // Shipping validation props
                      shippingValidation={shippingValidation}
                      isAdvancedShippingMode={isAdvancedShippingMode}
                      onShippingCompatibilityError={() => setCompatibilityModalOpen(true)}
                      // Shipping loading state
                      isCalculatingShipping={isCalculatingShippingCombined}
                      // ✅ NUEVA PROP para lógica de envío avanzada
                      cartItems={items}
                      userRegion={shippingValidation.userRegion}
                      // Functions
                      formatPrice={formatPrice}
                      formatDate={formatDate}
                      setCouponInput={() => {}} // No-op
                      onApplyCoupon={() => {}} // No-op
                      onRemoveCoupon={() => {}} // No-op
                      onCheckout={handleCheckout}
                      // Puedes agregar una prop extra en OrderSummary para ocultar el input de cupones si existe
                      hideCouponInput={true}
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
            {/* Wishlist modularizada */}
            <WishlistSection
              showWishlist={showWishlist}
              wishlist={wishlist}
              formatPrice={formatPrice}
              moveToCart={moveToCart}
              removeFromWishlist={removeFromWishlist}
            />
          </motion.div>
        </Box>
        
        {/* Modal de compatibilidad de envío */}
        <ShippingCompatibilityModal
          open={compatibilityModalOpen}
          onClose={() => setCompatibilityModalOpen(false)}
          incompatibleProducts={shippingValidation.incompatibleProducts}
          userRegion={shippingValidation.userRegion}
        />
      </Box>
    </ThemeProvider>
  );
};

// ============================================================================
// MOCK DATA - PRODUCTOS DEMO PARA EL CARRITO
// ============================================================================
// TODO: Esta data será reemplazada por productos reales de Supabase
// Se usa para demostrar funcionalidad del carrito sin conexión a BD

const MOCK_CART_ITEMS = [
  {
    id: 1,
    name: 'LATE HARVEST DOÑA AURORA 6 unidades',
    price: 45990,
    image: '/Marketplace productos/lavadora.jpg',
    supplier: 'Viña Doña Aurora',
    maxStock: 15,
    rating: 4.8,
    reviews: 89,
    discount: 20,
    category: 'Vinos y Bebidas',
    description: 'Vino de cosecha tardía premium, 6 botellas de 750ml cada una',
  },
  {
    id: 2,
    name: 'DOÑA AURORA BREBAJE ARTESANAL PAIS 6 unidades',
    price: 750000,
    image: '/Marketplace productos/notebookasustuf.jpg',
    supplier: 'PC Factory',
    maxStock: 8,
    rating: 4.6,
    reviews: 124,
    discount: 15,
    category: 'Vinos y Bebidas',
    description:
      'Vino artesanal de la variedad País, 6 botellas de 750ml cada una',
  },
  {
    id: 3,
    name: 'LATE HARVEST DOÑA AURORA 6 unidades',
    price: 45990,
    image: '/Marketplace productos/lavadora.jpg',
    supplier: 'Viña Doña Aurora',
    maxStock: 15,
    rating: 4.8,
    reviews: 89,
    category: 'Vinos y Bebidas',
    description: 'Vino de cosecha tardía premium, 6 botellas de 750ml cada una',
  },
];

export default memo(BuyerCart);
