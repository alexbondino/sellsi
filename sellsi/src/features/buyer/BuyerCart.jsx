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
  Container,
  Button,
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ThumbUp as RecommendIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import confetti from 'canvas-confetti';
import debounce from 'lodash.debounce';
import SidebarBuyer from '../layout/SidebarBuyer';
import MarketplaceTopBar from '../layout/MarketplaceTopBar';
import useCartStore from './hooks/cartStore';
import {
  SHIPPING_OPTIONS,
  DISCOUNT_CODES,
} from '../marketplace/hooks/constants';
import {
  CartHeader,
  ShippingProgressBar,
  CartItem,
  OrderSummary,
  SavingsCalculator,
  WishlistSection,
  EmptyCartState,
} from './cart';

// ============================================================================
// ULTRA-PREMIUM BUYER CART COMPONENT - NIVEL 11/10
// ============================================================================

// Lazy loading components para optimización
const RecommendedProducts = lazy(() =>
  import('../marketplace/RecommendedProducts')
);
const PriceComparison = lazy(() => import('./PriceComparison'));

// ============================================================================
// COMPONENTES AUXILIARES OPTIMIZADOS
// ============================================================================

// Componente de notificación personalizada
const CustomToast = ({ message, type, duration = 3000 }) => {
  useEffect(() => {
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      discount: '🎉',
      shipping: '🚚',
      wishlist: '❤️',
    };

    toast(message, {
      icon: iconMap[type] || '📦',
      duration,
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontWeight: '500',
      },
    });
  }, [message, type, duration]);

  return null;
};

// Componente de animación de confetti
const ConfettiEffect = ({ trigger }) => {
  useEffect(() => {
    if (trigger) {
      const celebrate = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        });

        // Segundo disparo después de 150ms
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FF6B6B'],
          });
        }, 150);

        // Tercer disparo después de 300ms
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#4ECDC4', '#45B7D1'],
          });
        }, 300);
      };

      celebrate();
    }
  }, [trigger]);

  return null;
};

// ============================================================================
// COMPONENTE PRINCIPAL ULTRA-PREMIUM
// ============================================================================

const BuyerCart = () => {
  // ===== ZUSTAND STORE =====
  const {
    items,
    wishlist,
    isLoading,
    appliedCoupons,
    couponInput,
    selectedShipping,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    applyCoupon,
    removeCoupon,
    setShippingOption,
    getSubtotal,
    getDiscount,
    getShippingCost,
    getTotal,
    getShippingInfo,
    undo,
    redo,
    isInCart,
    isInWishlist,
    getItemCount,
    getStats,
    setCouponInput,
    setLoading,
    resetDemoCart,
    autoResetIfEmpty,
    simulateCheckout,
    getUndoInfo,
    getRedoInfo,
    getHistoryInfo,
  } = useCartStore();
  // ===== ESTADOS LOCALES =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [showWishlist, setShowWishlist] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [showSavingsCalculator, setShowSavingsCalculator] = useState(false);
  const [hasShownDemoReset, setHasShownDemoReset] = useState(false);

  // Estado para manejar envíos por producto (inicializar con envío estándar)
  const [productShipping, setProductShipping] = useState(() => {
    const initialShipping = {};
    items.forEach(item => {
      initialShipping[item.id] = 'standard';
    });
    return initialShipping;
  });

  // Estados para el sistema de selección múltiple
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

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
    // 🎭 EFECTO PARA DEMO: Reiniciar carrito si está vacío al cargar la página
    if (!hasShownDemoReset) {
      // Si el carrito está vacío, reiniciarlo con productos de muestra
      if (items.length === 0) {
        setTimeout(() => {
          autoResetIfEmpty();
          setHasShownDemoReset(true);
        }, 500); // Pequeño delay para mejor UX
      } else {
        setHasShownDemoReset(true);
      }
    }
  }, [items.length, autoResetIfEmpty, hasShownDemoReset]);
  useEffect(() => {
    // Calcular fecha estimada de entrega basada en la opción más lenta
    if (items.length > 0) {
      const today = new Date();
      let maxDeliveryDays = 0;

      // Encontrar el envío más lento entre todos los productos
      items.forEach(item => {
        const selectedShippingId = productShipping[item.id] || 'standard';
        const shippingOption = SHIPPING_OPTIONS.find(
          opt => opt.id === selectedShippingId
        );

        if (shippingOption) {
          const deliveryDays =
            shippingOption.id === 'premium'
              ? 0
              : shippingOption.id === 'express'
              ? 2
              : shippingOption.id === 'pickup'
              ? 0
              : 4;

          maxDeliveryDays = Math.max(maxDeliveryDays, deliveryDays);
        }
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
        // Si el carrito está vacío y la página tiene foco,
        // es probable que el usuario haya regresado después de checkout
        setTimeout(() => {
          autoResetIfEmpty();
        }, 1000);
      }
    };

    // Escuchar cuando la página gana foco (usuario regresa)
    window.addEventListener('focus', handlePageFocus);

    return () => {
      window.removeEventListener('focus', handlePageFocus);
    };
  }, [autoResetIfEmpty]);

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
  };
  // ===== FUNCIONES OPTIMIZADAS =====
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
    }, 100), // Reducido de 300ms a 100ms
    [updateQuantity]
  );

  const handleRemoveWithAnimation = useCallback(
    id => {
      const item = items.find(item => item.id === id);
      if (item) {
        removeItem(id);
        setLastAction({ type: 'remove', item });

        toast.success(`${item.name} eliminado del carrito`, {
          icon: '🗑️',
          action: {
            label: 'Deshacer',
            onClick: () => {
              addItem(item, item.quantity);
              toast.success('Producto restaurado', { icon: '↩️' });
            },
          },
        });
      }
    },
    [items, removeItem, addItem]
  );
  const handleAddToWishlist = useCallback(
    item => {
      if (!isInWishlist(item.id)) {
        addToWishlist(item);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
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

  const handleApplyCoupon = useCallback(() => {
    if (couponInput.trim()) {
      const beforeTotal = getTotal();
      applyCoupon(couponInput.trim());

      setTimeout(() => {
        const afterTotal = getTotal();
        if (afterTotal < beforeTotal) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
      }, 100);
    }
  }, [couponInput, applyCoupon, getTotal]);
  const handleCheckout = useCallback(async () => {
    setIsCheckingOut(true);

    try {
      // Simular proceso de checkout
      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowConfetti(true);
      toast.success('¡Compra realizada con éxito!', {
        icon: '🎉',
        duration: 5000,
      });

      setTimeout(async () => {
        setShowConfetti(false);

        // Usar el checkout simulado del store que auto-reinicia el demo
        const checkoutSuccess = await simulateCheckout();

        if (checkoutSuccess) {
          toast.success(
            '🎭 El demo se reiniciará automáticamente en unos segundos...',
            {
              icon: '⏰',
              duration: 4000,
            }
          );
        }
      }, 3000);
    } catch (error) {
      toast.error('Error en el proceso de compra', { icon: '❌' });
    } finally {
      setIsCheckingOut(false);
    }
  }, [simulateCheckout]);

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

    // Mostrar toast de confirmación
    toast.success(
      `${selectedItems.length} producto${
        selectedItems.length > 1 ? 's' : ''
      } eliminado${selectedItems.length > 1 ? 's' : ''} del carrito`,
      {
        icon: '🗑️',
        duration: 4000,
      }
    );

    // Limpiar selección y salir del modo selección
    setSelectedItems([]);
    setIsSelectionMode(false);

    // Efecto confetti para la eliminación múltiple
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  }, [selectedItems, items, removeItem]);

  // Limpiar selecciones cuando cambie la lista de items
  useEffect(() => {
    setSelectedItems(prev =>
      prev.filter(selectedId => items.some(item => item.id === selectedId))
    );
  }, [items]);

  // ===== CÁLCULOS MEMOIZADOS =====
  const cartStats = useMemo(() => getStats(), [items, getStats]);
  const subtotal = useMemo(() => getSubtotal(), [items, getSubtotal]);
  const discount = useMemo(() => getDiscount(), [appliedCoupons, getDiscount]);

  // Calcular costo total de envío individual por producto
  const productShippingCost = useMemo(() => {
    return items.reduce((totalShipping, item) => {
      const selectedShippingId = productShipping[item.id] || 'standard';
      const shippingOption = SHIPPING_OPTIONS.find(
        opt => opt.id === selectedShippingId
      );
      return totalShipping + (shippingOption ? shippingOption.price : 0);
    }, 0);
  }, [items, productShipping]);

  const shippingCost = useMemo(
    () => getShippingCost(),
    [selectedShipping, getShippingCost]
  );

  // Total modificado para incluir envío individual por producto
  const total = useMemo(() => {
    const baseTotal = subtotal - discount;
    return baseTotal + productShippingCost;
  }, [subtotal, discount, productShippingCost]);

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
        <Toaster position="top-right" />
        <MarketplaceTopBar />
        <Box sx={{ display: 'flex' }}>
          <SidebarBuyer />{' '}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              ml: '250px',
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
                maxWidth: '1200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <EmptyCartState
                wishlist={wishlist}
                resetDemoCart={resetDemoCart}
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
    <Box>
      <Toaster position="top-right" />
      <ConfettiEffect trigger={showConfetti} />
      <MarketplaceTopBar />

      <Box sx={{ display: 'flex' }}>
        <SidebarBuyer />{' '}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: '250px',
            p: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              width: '100%',
              maxWidth: '1400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
                discount={discount}
                wishlistLength={wishlist.length}
                onUndo={undo}
                onRedo={redo}
                onClearCart={clearCart}
                onResetDemo={resetDemoCart}
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
              />{' '}
              {/* Barra de progreso hacia envío gratis */}
              <ShippingProgressBar
                subtotal={subtotal}
                formatPrice={formatPrice}
                itemVariants={itemVariants}
              />{' '}
              <Grid container spacing={15}>
                {' '}
                {/* Lista de productos */}
                <Grid item xs={12} md={7} lg={6.5} xl={5.3}>
                  <AnimatePresence>
                    {' '}
                    {items.map((item, index) => (
                      <CartItem
                        key={item.id}
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
                      />
                    ))}
                  </AnimatePresence>
                  {/* Productos recomendados */}
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
                  </motion.div>{' '}
                </Grid>{' '}
                {/* Panel lateral - Resumen y opciones */}
                <Grid item xs={12} lg={5.5} xl={6.7}>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    {/* Resumen del pedido modularizado */}
                    <motion.div variants={itemVariants}>
                      {' '}
                      <OrderSummary
                        // Data props
                        subtotal={subtotal}
                        discount={discount}
                        shippingCost={productShippingCost}
                        total={total}
                        cartStats={cartStats}
                        deliveryDate={deliveryDate}
                        appliedCoupons={appliedCoupons}
                        couponInput={couponInput}
                        isCheckingOut={isCheckingOut}
                        // Options
                        availableCodes={DISCOUNT_CODES}
                        // Functions
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        setCouponInput={setCouponInput}
                        onApplyCoupon={handleApplyCoupon}
                        onRemoveCoupon={removeCoupon}
                        onCheckout={handleCheckout}
                      />
                    </motion.div>{' '}
                    {/* Calculadora de ahorros modularizada */}
                    <motion.div variants={itemVariants}>
                      <SavingsCalculator
                        subtotal={subtotal}
                        discount={discount}
                        total={total}
                        formatPrice={formatPrice}
                      />
                    </motion.div>
                  </Box>
                </Grid>
              </Grid>{' '}
              {/* Wishlist modularizada */}
              <WishlistSection
                showWishlist={showWishlist}
                wishlist={wishlist}
                formatPrice={formatPrice}
                moveToCart={moveToCart}
                removeFromWishlist={removeFromWishlist}
              />
            </motion.div>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// DATOS DE PRUEBA (Temporal - hasta conexión con Supabase)
// ============================================================================

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
