// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la tarjeta
// - Modificar información mostrada
// - Ajustar botón "AGREGAR" (color, texto, funcionalidad)
// - Cambiar iconos o tooltips
// - Modificar badge de descuento o favoritos

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Tooltip,
  Popover,
  TextField,
  Avatar,
  Chip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { toast } from 'react-hot-toast';
import { generateProductUrl } from '../marketplace/marketplace/productUrl';
import PriceDisplay from '../marketplace/PriceDisplay';
import { useProductPriceTiers } from '../marketplace/hooks/useProductPriceTiers';
import { getProductImageUrl } from '../../utils/getProductImageUrl';
import {
  formatProductForCart,
  calculatePriceForQuantity,
} from '../../utils/priceCalculation';
import { LazyImage } from '../../components/shared';

/* Tarjeta de producto */

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const ProductCard = React.memo(({ producto, onAddToCart, onViewDetails }) => {
  const [favorito, setFavorito] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  // Obtener compra mínima
  const minimumPurchase =
    producto.minimum_purchase || producto.compraMinima || 1;
  const [cantidad, setCantidad] = useState(minimumPurchase);
  // Permitir edición libre en el input
  const [inputValue, setInputValue] = useState(cantidad.toString());
  // Validación optimizada de cantidad (memoizada)
  const canAdd = React.useMemo(() => {
    const numValue = parseInt(inputValue);
    return !isNaN(numValue) && numValue >= minimumPurchase;
  }, [inputValue, minimumPurchase]);
  const navigate = useNavigate();

  if (!producto) {
    return null;
  } // Mapeo robusto de campos para compatibilidad
  const nombre = producto.nombre || producto.name || 'Producto sin nombre';
  const proveedor = producto.proveedor || 'Proveedor no encontrado';
  const imagen = producto.imagen || producto.image;
  const precio = producto.precio || producto.price || 0;
  const precioOriginal = producto.precioOriginal || producto.originalPrice;
  const descuento = producto.descuento || producto.discount;
  const rating = producto.rating || 0;
  const ventas = producto.ventas || producto.sales || 0;
  const stock = producto.stock || producto.maxStock || 50;
  const compraMinima = producto.compraMinima || producto.minPurchase || 1;
  const negociable = producto.negociable || producto.negotiable || false;

  // Hook para obtener tramos de precios (mantener para compatibilidad)
  const {
    tiers,
    loading: loadingTiers,
    error: errorTiers,
  } = useProductPriceTiers(producto.id);
  // ===== CÁLCULO DE PRECIOS DINÁMICOS USANDO PRICE_TIERS (OPTIMIZADO) =====
  // Unificar la fuente de price_tiers: preferir la del producto, si no, la del hook
  const price_tiers = React.useMemo(() => {
    return producto.price_tiers && producto.price_tiers.length > 0
      ? producto.price_tiers
      : tiers && tiers.length > 0
      ? tiers
      : [];
  }, [producto.price_tiers, tiers]);

  // Calcular precio dinámico basado en cantidad seleccionada (memoizado)
  const currentPrices = React.useMemo(() => {
    if (price_tiers.length > 0) {
      const unitPrice = calculatePriceForQuantity(
        cantidad,
        price_tiers,
        precio
      );
      return {
        unitPrice,
        total: unitPrice * cantidad,
      };
    }
    return {
      unitPrice: precio,
      total: precio * cantidad,
    };
  }, [cantidad, price_tiers, precio]);
  const { unitPrice: currentUnitPrice, total: currentTotal } = currentPrices;

  // ✅ MEJORA DE RENDIMIENTO: Memoización del contenido de precio para evitar re-renders
  const memoizedPriceContent = React.useMemo(() => {
    if (loadingTiers) {
      return (
        <Typography variant="body2" color="text.secondary">
          Cargando precios...
        </Typography>
      );
    }

    if (errorTiers) {
      return (
        <Typography variant="body2" color="error.main">
          Error al cargar precios
        </Typography>
      );
    }

    if (tiers && tiers.length > 0) {
      // Mostrar rango de precios por tramos
      const minPrice = Math.min(...tiers.map(t => t.price));
      const maxPrice = Math.max(...tiers.map(t => t.price));
      return (
        <PriceDisplay
          price={maxPrice}
          minPrice={minPrice}
          showRange={minPrice !== maxPrice}
          variant="h5"
          color="#1976d2"
          sx={{ lineHeight: 1.1, fontSize: 22 }}
        />
      );
    } else {
      // Precio único (sin tramos)
      return (
        <PriceDisplay
          price={precio}
          originalPrice={precioOriginal}
          variant="h5"
          color="#1976d2"
          sx={{ lineHeight: 1.1, fontSize: 22 }}
        />
      );
    }
  }, [loadingTiers, errorTiers, tiers, precio, precioOriginal]);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de la función para resolver imagen
  const resolvedImageSrc = React.useMemo(() => {
    // Unifica lógica: soporta string, objeto, path relativo, url pública
    let image = producto?.imagen || producto?.image;
    if (!image) return '/placeholder-product.jpg';
    // Si es string (url pública o path relativo)
    if (typeof image === 'string') {
      if (image.startsWith('blob:')) return '/placeholder-product.jpg';
      return getProductImageUrl(image, producto); // ✅ Pasar datos del producto
    }
    // Si es objeto con url
    if (typeof image === 'object' && image !== null) {
      if (image.url && typeof image.url === 'string') {
        if (image.url.startsWith('blob:')) return '/placeholder-product.jpg';
        return getProductImageUrl(image.url, producto); // ✅ Pasar datos del producto
      }
      // Si es objeto con path relativo
      if (image.path && typeof image.path === 'string') {
        return getProductImageUrl(image.path, producto); // ✅ Pasar datos del producto
      }
    }
    return '/placeholder-product.jpg';
  }, [producto]);

  // ✅ MEJORA DE RENDIMIENTO: Memoización del componente LazyImage
  const memoizedImage = React.useMemo(
    () => (
      <LazyImage
        src={resolvedImageSrc}
        alt={nombre}
        aspectRatio="160 / 160"
        rootMargin="200px"
        objectFit="contain"
        sx={{
          p: 1.5,
          bgcolor: '#fafafa',
        }}
      />
    ),
    [resolvedImageSrc, nombre]
  );

  const toggleFavorito = () => setFavorito(!favorito);

  // Función para navegar a la ficha técnica del producto
  const handleProductClick = e => {
    // Verificar si el clic viene de un botón o elemento interactivo
    const target = e.target;
    const clickedElement =
      target.closest('button') ||
      target.closest('.MuiIconButton-root') ||
      target.closest('.MuiButton-root') ||
      target.closest('[data-no-card-click]') ||
      target.hasAttribute('data-no-card-click'); // También verificar si el elemento tiene clases de MUI que indican que es un botón
    const isMuiButton =
      target.classList.contains('MuiButton-root') ||
      target.classList.contains('MuiIconButton-root') ||
      target.closest('.MuiButton-root') ||
      target.closest('.MuiIconButton-root');

    if (clickedElement || isMuiButton) {
      return;
    }

    // Determinar el origen actual para pasar al TechnicalSpecs
    const currentPath = window.location.pathname;
    let fromPath = '/marketplace'; // Default

    // Detectar si estamos en MarketplaceBuyer
    if (currentPath.includes('/buyer/')) {
      fromPath = '/buyer/marketplace';
    } // Generar URL y navegar con estado
    const productUrl = generateProductUrl(producto);
    navigate(productUrl, {
      state: { from: fromPath },
    });
  };

  // ✅ Función optimizada para cerrar el popover
  const handleClosePopover = React.useCallback(() => {
    setAnchorEl(null);
    setCantidad(minimumPurchase); // Reset cantidad al cerrar
    setInputValue(minimumPurchase.toString()); // Reset input también
  }, [minimumPurchase]);
  // ✅ Función optimizada para manejar click en AGREGAR
  const handleAgregarClick = React.useCallback(event => {
    event.stopPropagation(); // Prevenir propagación hacia ProductCard
    event.preventDefault(); // Prevenir comportamiento por defecto

    // Verificar si el usuario está logueado
    const userId = localStorage.getItem('user_id');
    const accountType = localStorage.getItem('account_type');
    const supplierid = localStorage.getItem('supplierid');
    const sellerid = localStorage.getItem('sellerid');

    const isLoggedIn = !!(userId || supplierid || sellerid);

    if (!isLoggedIn) {
      // Si no está logueado, abrir modal de login
      toast.error('Debes iniciar sesión para agregar productos al carrito', {
        icon: '🔒',
      });
      const event = new CustomEvent('openLogin');
      window.dispatchEvent(event);
      return;
    }

    // Si está logueado, abrir modal de cantidad
    setAnchorEl(event.currentTarget);
  }, []);
  // LOG: Mostrar tramos al abrir el modal de cantidad (optimizado)
  React.useEffect(() => {
    if (anchorEl && price_tiers?.length > 0) {
      // Eliminado log de tramos disponibles
    }
  }, [anchorEl]); // Removido price_tiers de dependencias para evitar re-renders

  // ✅ Función optimizada para logging de tramos (solo cuando es necesario)
  const logAppliedTier = React.useCallback(
    numValue => {
      if (price_tiers?.length > 0) {
        const tramo = price_tiers.find(t => numValue >= t.min_quantity);
        if (tramo) {
          // Eliminado log de tramo aplicado
        }
      }
    },
    [price_tiers]
  );

  // ✅ Función optimizada para manejar cambio de cantidad
  const handleCantidadChange = React.useCallback(
    event => {
      const value = event.target.value;
      setInputValue(value);
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setCantidad(numValue);
        // LOG solo en desarrollo
      }
    },
    [logAppliedTier]
  );

  // ✅ Función optimizada para incrementar cantidad
  const handleIncrement = React.useCallback(() => {
    let numValue = parseInt(inputValue);
    if (isNaN(numValue)) numValue = minimumPurchase;
    if (numValue < stock) {
      numValue++;
      setInputValue(numValue.toString());
      setCantidad(numValue);
      // LOG solo en desarrollo
    }
  }, [inputValue, minimumPurchase, stock, logAppliedTier]);

  // ✅ Función optimizada para decrementar cantidad
  const handleDecrement = React.useCallback(() => {
    let numValue = parseInt(inputValue);
    if (isNaN(numValue)) numValue = minimumPurchase;
    if (numValue > minimumPurchase) {
      numValue--;
      setInputValue(numValue.toString());
      setCantidad(numValue);
      // LOG solo en desarrollo
    }
  }, [inputValue, minimumPurchase, logAppliedTier]); // ✅ Función optimizada para confirmar agregado al carrito
  const handleConfirmarAgregar = React.useCallback(() => {
    // LOG: Mostrar tramos y cantidad final solo en desarrollo
    if (onAddToCart) {
      // Crear producto para carrito preservando price_tiers y mínimo reales
      const cartProduct = formatProductForCart(producto, cantidad, price_tiers);
      onAddToCart(cartProduct);
    }
    handleClosePopover();
  }, [price_tiers, cantidad, onAddToCart, producto, handleClosePopover]);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del Card
  const cardStyles = React.useMemo(
    () => ({
      height: 450,
      minWidth: { xs: 100, sm: 150, md: 180, lg: 280, xl: 300 },
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      '&:hover': {
        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
        transform: 'translateY(-4px)',
      },
    }),
    []
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del IconButton favorito
  const favoriteButtonStyles = React.useMemo(
    () => ({
      position: 'absolute',
      top: 6,
      right: 6,
      zIndex: 2,
      bgcolor: 'rgba(255,255,255,0.9)',
      width: 32,
      height: 32,
      transition: 'background 0.2s, box-shadow 0.2s',
      boxShadow: 'none',
      outline: 'none',
      '&:hover': {
        bgcolor: 'rgba(255,255,255,1)',
        transform: 'scale(1.05)',
        boxShadow: 'none',
        outline: 'none',
      },
      '&:active': {
        boxShadow: 'none !important',
        outline: 'none !important',
        background: 'rgba(255,255,255,1) !important',
      },
      '&:focus': {
        boxShadow: 'none !important',
        outline: 'none !important',
        background: 'rgba(255,255,255,1) !important',
      },
      '&:focus-visible': {
        boxShadow: 'none !important',
        outline: 'none !important',
        background: 'rgba(255,255,255,1) !important',
      },
    }),
    []
  );

  return (
    <Card elevation={2} onClick={handleProductClick} sx={cardStyles}>
      {/* Icono favorito eliminado */}
      {memoizedImage}
      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        {' '}
        {/* ✅ REDUCIR: de 3 a 2 */}
        {/* Nombre - más compacto */}{' '}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mb: 0.5, // ✅ REDUCIR: de 0.1 a 0.5
            height: 48, // ✅ REDUCIR: de 65 a 48 (-17px, -26%)
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: 18, // ✅ REDUCIR: de 24 a 18 (-25%)
            lineHeight: 1.2, // ✅ REDUCIR: de 1.3 a 1.2
            color: '#1e293b',
          }}
        >
          {nombre}{' '}
        </Typography>
        {/* Nombre del Proveedor */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              mr: 1,
              fontSize: '0.75rem',
            }}
          >
            {proveedor?.charAt(0)}
          </Avatar>
          <Chip
            label={proveedor}
            size="small"
            variant="outlined"
            color="primary"
          />{' '}
        </Box>{' '}
        {/* Compra mínima */}{' '}
        <Typography
          variant="body2"
          sx={{
            mb: 1.5,
            fontSize: 12,
            fontWeight: 500,
            color: 'text.secondary',
          }}
        >
          Compra mínima: {compraMinima} unidades
        </Typography>
        {/* Precios - más compacto */}{' '}
        <Box sx={{ mb: 1.5 }}>{memoizedPriceContent}</Box>{' '}
        {/* Información adicional - más compacta */}
        <Typography
          variant="body2"
          color={stock < 10 ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 12, fontWeight: 600 }} // ✅ REDUCIR: de 16 a 12
        >
          {stock < 10 ? `¡Solo ${stock} disponibles!` : `Stock: ${stock}`}
        </Typography>{' '}
        {/* ✅ NUEVO: Botón de negociación */}
        <Box sx={{ mt: 2, mb: 0 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!negociable}
            data-no-card-click="true"
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              if (negociable) {
                // TODO: Abrir modal de negociación
              }
            }}
            onTouchStart={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              py: 0.5,
              borderRadius: 1.5,
              border: 'none',
              color: negociable ? '#2e7d32' : '#757575',
              backgroundColor: negociable
                ? 'rgba(46, 125, 50, 0.05)'
                : 'rgba(117, 117, 117, 0.05)',
              pointerEvents: 'auto', // Asegurar que el botón capture eventos
              position: 'relative',
              zIndex: 10,
              '&:hover': negociable
                ? {
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    border: 'none',
                  }
                : {
                    border: 'none',
                  },
              '&:active': {
                border: 'none !important',
                outline: 'none !important',
              },
              '&:focus': {
                border: 'none !important',
                outline: 'none !important',
              },
              '&.Mui-disabled': {
                color: '#757575',
                border: 'none',
                backgroundColor: 'rgba(117, 117, 117, 0.05)',
                pointerEvents: 'auto', // Mantener eventos incluso cuando está deshabilitado
              },
            }}
          >
            {negociable ? 'Negociable' : 'No Negociable'}
          </Button>
        </Box>
      </CardContent>{' '}
      {/* Botón agregar - más pequeño */}{' '}
      <CardActions sx={{ p: 1.5, pt: 0.5 }}>
        {' '}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          data-no-card-click="true"
          startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
          onClick={handleAgregarClick}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 0.8,
            fontSize: '0.9rem',
            color: 'rgb(0, 0, 0)',
            background:
              'linear-gradient(135deg,rgb(231, 254, 255) 0%,rgb(202, 223, 247) 100%)',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10,
            '&:hover': {
              background:
                'linear-gradient(135deg,rgb(209, 251, 254) 0%,rgb(189, 196, 247) 100%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
              transform: 'translateY(-2px)',
              border: 'none',
            },
            '&:active': {
              border: 'none !important',
              outline: 'none !important',
            },
            '&:focus': {
              border: 'none !important',
              outline: 'none !important',
            },
            '& .MuiButton-startIcon': {
              marginRight: 1,
            },
          }}
        >
          AGREGAR
        </Button>
      </CardActions>{' '}
      {/* ✅ NUEVO: Selector de cantidad - Modal que aparece al hacer click en AGREGAR */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClick={e => e.stopPropagation()} // Prevenir click en ProductCard
        disableScrollLock={true} // ✅ SOLUCIÓN: Prevenir bloqueo de scroll que causa desplazamiento
        disableRestoreFocus={true} // ✅ SOLUCIÓN: Evitar cambios de foco que afecten el layout
        disableAutoFocus={true} // ✅ SOLUCIÓN: Prevenir auto-focus que puede mover el modal
        PaperProps={{
          onClick: e => e.stopPropagation(), // Prevenir click en ProductCard
          sx: {
            p: 2,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 220,
            maxWidth: 240,
            zIndex: 10000,
            bgcolor: 'white',
            border: '1px solid #e0e0e0',
            position: 'fixed', // ✅ SOLUCIÓN: Posición fija para evitar reflow
          },
        }}
        sx={{
          zIndex: 10000,
        }}
      >
        {' '}
        <Box sx={{ userSelect: 'none' }}>
          {' '}
          {/* ✅ SOLUCIÓN: Prevenir selección de texto */}
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            Seleccionar Cantidad
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {' '}
            <IconButton
              onClick={React.useCallback(
                e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDecrement();
                },
                [handleDecrement]
              )}
              disabled={parseInt(inputValue) <= minimumPurchase}
              size="small"
              sx={{
                userSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              type="number"
              value={inputValue}
              onChange={handleCantidadChange}
              onBlur={React.useCallback(() => {
                let numValue = parseInt(inputValue);
                if (isNaN(numValue) || numValue < minimumPurchase)
                  numValue = minimumPurchase;
                if (numValue > stock) numValue = stock;
                setInputValue(numValue.toString());
                setCantidad(numValue);
              }, [inputValue, minimumPurchase, stock])}
              inputProps={{ min: minimumPurchase, max: producto.stock || 9999 }}
              size="small"
              error={parseInt(inputValue) < minimumPurchase}
              helperText={
                parseInt(inputValue) < minimumPurchase
                  ? `Mínimo ${minimumPurchase}`
                  : ''
              }
              sx={{
                width: 100,
                '& input': {
                  textAlign: 'center',
                  userSelect: 'text',
                },
              }}
            />{' '}
            <IconButton
              onClick={React.useCallback(
                e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleIncrement();
                },
                [handleIncrement]
              )}
              disabled={parseInt(inputValue) >= stock}
              size="small"
              sx={{
                userSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <Typography
            variant="body2"
            sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            Stock disponible: {stock}
          </Typography>{' '}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {' '}
            <Button
              variant="outlined"
              onClick={React.useCallback(
                e => {
                  e.preventDefault(); // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                  e.stopPropagation(); // ✅ SOLUCIÓN: Evitar propagación de eventos
                  handleClosePopover();
                },
                [handleClosePopover]
              )}
              fullWidth
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={React.useCallback(
                e => {
                  e.preventDefault(); // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                  e.stopPropagation(); // ✅ SOLUCIÓN: Evitar propagación de eventos
                  handleConfirmarAgregar();
                },
                [handleConfirmarAgregar]
              )}
              disabled={!canAdd}
              fullWidth
              sx={{
                opacity: canAdd ? 1 : 0.5,
                userSelect: 'none',
                touchAction: 'manipulation',
                transition: 'opacity 0.2s',
              }}
            >
              {canAdd ? 'Agregar' : `Mín: ${minimumPurchase}`}
            </Button>
          </Box>{' '}
        </Box>
      </Popover>
    </Card>
  );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard;
