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
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import confetti from 'canvas-confetti';
import debounce from 'lodash.debounce';
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
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getDiscount = useCartStore(state => state.getDiscount);
  const getTotal = useCartStore(state => state.getTotal);
  const isInWishlist = useCartStore(state => state.isInWishlist);

  // ===== ESTADOS LOCALES OPTIMIZADOS =====
  const [showConfetti, setShowConfetti] = useState(false);
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
  // ===== CÁLCULOS MEMOIZADOS =====
  const cartCalculations = useMemo(() => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const total = getTotal();

    return { subtotal, discount, total };
  }, [items, appliedCoupons, getSubtotal, getDiscount, getTotal]);

  const cartStats = useMemo(() => {
    const stats = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      isEmpty: items.length === 0,
    };

    return stats;
  }, [items]);

  // Calcular costo total de envío individual por producto
  const productShippingCost = useMemo(() => {
    const totalShipping = items.reduce((totalShipping, item) => {
      const selectedShippingId = productShipping[item.id] || 'standard';
      const shippingOption = SHIPPING_OPTIONS.find(
        opt => opt.id === selectedShippingId
      );
      return totalShipping + (shippingOption ? shippingOption.price : 0);
    }, 0);

    return totalShipping;
  }, [items, productShipping]);

  // Total final incluyendo envío individual por producto
  const finalTotal = useMemo(() => {
    const baseTotal = cartCalculations.subtotal - cartCalculations.discount;
    const total = baseTotal + productShippingCost;

    return total;
  }, [
    cartCalculations.subtotal,
    cartCalculations.discount,
    productShippingCost,
  ]);

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

  const handleRemoveWithAnimation = useCallback(
    id => {
      const item = items.find(item => item.id === id);
      if (item) {
        removeItem(id);
        setLastAction({ type: 'remove', item });
        // Mostrar toast de confirmación
        toast.success(`${item.name} eliminado del carrito`, {
          icon: '🗑️',
          style: { background: '#fffde7', color: '#795548' },
        });
      }
    },
    [items, removeItem]
  );

  const handleAddToWishlist = useCallback(
    item => {
      if (!isInWishlist(item.id)) {
        addToWishlist(item);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 200); // OPTIMIZADO: 200ms
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
      console.log('↶ BuyerCart - Undo action');
    }
    // Implementar lógica de undo
  }, []);

  const redo = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('↷ BuyerCart - Redo action');
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
      console.log('🛒 BuyerCart - Mover de wishlist a carrito:', item.name);
    }
    // Implementar lógica para mover de wishlist a carrito
  }, []);

  const handleApplyCoupon = useCallback(() => {
    if (couponInput.trim()) {
      const beforeTotal = getTotal();
      applyCoupon(couponInput.trim());

      setTimeout(() => {
        const afterTotal = getTotal();
        if (afterTotal < beforeTotal) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 200); // OPTIMIZADO: 200ms
        }
      }, 10); // OPTIMIZADO: 10ms en lugar de 100ms
    }
  }, [couponInput, applyCoupon, getTotal]);

  const handleCheckout = useCallback(async () => {
    setIsCheckingOut(true);

    try {
      // Simular proceso de checkout
      await new Promise(resolve => setTimeout(resolve, 100)); // OPTIMIZADO: 100ms

      setShowConfetti(true);
      toast.success('¡Compra realizada con éxito!', {
        icon: '🎉',
        duration: 5000,
      });

      setTimeout(() => {
        setShowConfetti(false);
        // Clear the cart after successful checkout
        clearCart();
      }, 500); // OPTIMIZADO: 500ms en lugar de 3000ms
    } catch (error) {
      toast.error('Error en el proceso de compra', { icon: '❌' });
    } finally {
      setIsCheckingOut(false);
    }
  }, [clearCart]);

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

    // Se elimina el toast aquí para evitar duplicados, solo se muestra desde el store

    // Limpiar selección y salir del modo selección
    setSelectedItems([]);
    setIsSelectionMode(false);

    // Efecto confetti para la eliminación múltiple
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 300); // OPTIMIZADO: 300ms
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
    <Box>
      {/* <Toaster position="top-right" toastOptions={{ style: { marginTop: 72 } }} /> */}
      <ConfettiEffect trigger={showConfetti} />
      <Box sx={{ display: 'flex' }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            background: '##ffffff',
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
              <Grid container spacing={15}>
                {/* Lista de productos */}
                <Grid
                  item
                  sx={{
                    xs: 12,
                    md: 7,
                    lg: 6.5,
                    xl: 5.3,
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
                  </motion.div>
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
                        total={cartCalculations.subtotal + productShippingCost}
                        cartStats={cartStats}
                        deliveryDate={deliveryDate}
                        appliedCoupons={[]} // Ocultamos cupones
                        couponInput={''} // Ocultamos input de cupones
                        isCheckingOut={isCheckingOut}
                        // Options
                        availableCodes={[]} // Ocultamos lista de códigos
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
          </Container>
        </Box>
      </Box>
    </Box>
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
