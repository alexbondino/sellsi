// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la tarjeta
// - Modificar información mostrada
// - Ajustar botón "AGREGAR" (color, texto, funcionalidad)
// - Cambiar iconos o tooltips
// - Modificar badge de descuento o favoritos

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { generateProductUrl } from '../marketplace/productUrl'
import PriceDisplay from '../PriceDisplay'
import { useProductPriceTiers } from '../hooks/useProductPriceTiers'
import { getProductImageUrl } from '../../../utils/getProductImageUrl'
import { formatProductForCart } from '../../../utils/priceCalculation'

const ProductCard = ({ producto, onAddToCart, onViewDetails }) => {
  const [favorito, setFavorito] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const navigate = useNavigate()
  if (!producto) {
    return null
  }

  // Mapeo robusto de campos para compatibilidad
  const nombre = producto.nombre || producto.name || 'Producto sin nombre'
  const proveedor =
    producto.proveedor ||
    producto.supplier ||
    producto.provider ||
    'Proveedor no especificado'
  const imagen = producto.imagen || producto.image
  const precio = producto.precio || producto.price || 0
  const precioOriginal = producto.precioOriginal || producto.originalPrice
  const descuento = producto.descuento || producto.discount
  const rating = producto.rating || 0
  const ventas = producto.ventas || producto.sales || 0
  const stock = producto.stock || producto.maxStock || 50
  const compraMinima = producto.compraMinima || producto.minPurchase || 1
  const negociable = producto.negociable || producto.negotiable || false

  // Hook para obtener tramos de precios
  const {
    tiers,
    loading: loadingTiers,
    error: errorTiers,
  } = useProductPriceTiers(producto.id)

  // Lógica para mostrar precios
  let priceContent
  if (loadingTiers) {
    priceContent = (
      <Typography variant="body2" color="text.secondary">
        Cargando precios...
      </Typography>
    )
  } else if (errorTiers) {
    priceContent = (
      <Typography variant="body2" color="error.main">
        Error al cargar precios
      </Typography>
    )
  } else if (tiers && tiers.length > 0) {
    // Mostrar rango de precios por tramos
    const minPrice = Math.min(...tiers.map((t) => t.price))
    const maxPrice = Math.max(...tiers.map((t) => t.price))
    priceContent = (
      <PriceDisplay
        price={maxPrice}
        minPrice={minPrice}
        showRange={minPrice !== maxPrice}
        variant="h5"
        color="#1976d2"
        sx={{ lineHeight: 1.1, fontSize: 22 }}
      />
    )
  } else {
    // Precio único (sin tramos)
    priceContent = (
      <PriceDisplay
        price={precio}
        originalPrice={precioOriginal}
        variant="h5"
        color="#1976d2"
        sx={{ lineHeight: 1.1, fontSize: 22 }}
      />
    )
  }

  const toggleFavorito = () => setFavorito(!favorito) // Función para navegar a la ficha técnica del producto
  const handleProductClick = (e) => {
    // Verificar si el clic viene de un botón o elemento interactivo
    const target = e.target
    const clickedElement =
      target.closest('button') ||
      target.closest('.MuiIconButton-root') ||
      target.closest('.MuiButton-root') ||
      target.closest('[data-no-card-click]') ||
      target.hasAttribute('data-no-card-click') // También verificar si el elemento tiene clases de MUI que indican que es un botón
    const isMuiButton =
      target.classList.contains('MuiButton-root') ||
      target.classList.contains('MuiIconButton-root') ||
      target.closest('.MuiButton-root') ||
      target.closest('.MuiIconButton-root')

    if (clickedElement || isMuiButton) {
      return
    }

    // Determinar el origen actual para pasar al TechnicalSpecs
    const currentPath = window.location.pathname
    let fromPath = '/marketplace' // Default

    // Detectar si estamos en MarketplaceBuyer
    if (currentPath.includes('/buyer/')) {
      fromPath = '/buyer/marketplace'
    }

    // Generar URL y navegar con estado
    const productUrl = generateProductUrl(producto)
    navigate(productUrl, {
      state: { from: fromPath },
    })
  }
  // ✅ NUEVA función para manejar click en AGREGAR
  const handleAgregarClick = (event) => {
    event.stopPropagation() // Prevenir propagación hacia ProductCard
    event.preventDefault() // Prevenir comportamiento por defecto
    setAnchorEl(event.currentTarget)
  }

  // ✅ NUEVA función para cerrar el popover
  const handleClosePopover = () => {
    setAnchorEl(null)
    setCantidad(1) // Reset cantidad al cerrar
  }

  // ✅ NUEVA función para manejar cambio de cantidad
  const handleCantidadChange = (event) => {
    const value = parseInt(event.target.value) || 0
    if (value >= 1 && value <= stock) {
      setCantidad(value)
    }
  }

  // ✅ NUEVA función para incrementar cantidad
  const handleIncrement = () => {
    if (cantidad < stock) {
      setCantidad(cantidad + 1)
    }
  }

  // ✅ NUEVA función para decrementar cantidad
  const handleDecrement = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1)
    }
  }

  // ✅ NUEVA función para confirmar agregado al carrito
  const handleConfirmarAgregar = () => {
    if (onAddToCart) {
      // Usar formatProductForCart para calcular precios por tramos correctamente
      const cartProduct = formatProductForCart(producto, cantidad, tiers)

      onAddToCart(cartProduct)
    }
    handleClosePopover()
  }

  function resolveImageSrc(producto) {
    // Unifica lógica: soporta string, objeto, path relativo, url pública
    let image = producto?.imagen || producto?.image
    if (!image) return '/placeholder-product.jpg'
    // Si es string (url pública o path relativo)
    if (typeof image === 'string') {
      if (image.startsWith('blob:')) return '/placeholder-product.jpg'
      return getProductImageUrl(image, producto) // ✅ Pasar datos del producto
    }
    // Si es objeto con url
    if (typeof image === 'object' && image !== null) {
      if (image.url && typeof image.url === 'string') {
        if (image.url.startsWith('blob:')) return '/placeholder-product.jpg'
        return getProductImageUrl(image.url, producto) // ✅ Pasar datos del producto
      }
      // Si es objeto con path relativo
      if (image.path && typeof image.path === 'string') {
        return getProductImageUrl(image.path, producto) // ✅ Pasar datos del producto
      }
    }
    return '/placeholder-product.jpg'
  }

  return (
    <Card
      elevation={2}
      onClick={handleProductClick}
      sx={{
        height: 450, // ✅ REDUCIR: de 620 a 480 (-140px, -23%)
        minWidth: { xs: 100, sm: 150, md: 180, lg: 280, xl: 300 }, // ✅ REDUCIR: de 400 a 360 (-40px, -10%)
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.12)', // ✅ REDUCIR sombra
          transform: 'translateY(-4px)', // ✅ REDUCIR movimiento: -6px a -4px
        },
      }}
    >
      {' '}
      {/* Icono favorito - más pequeño */}
      <IconButton
        onClick={toggleFavorito}
        sx={{
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
        }}
        size="small"
        aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        data-no-card-click="true"
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            transition: 'transform 0.25s cubic-bezier(0.4,1.3,0.6,1)',
            transform: favorito ? 'scale(1.25)' : 'scale(1)',
            filter: favorito ? 'drop-shadow(0 2px 6px #ff525299)' : 'none',
          }}
        >
          {favorito ? (
            <FavoriteIcon
              sx={{ color: '#FF5252', fontSize: 20, transition: 'color 0.2s' }}
            />
          ) : (
            <FavoriteBorderIcon
              sx={{ color: '#666', fontSize: 20, transition: 'color 0.2s' }}
            />
          )}
        </Box>
      </IconButton>
      {/* Imagen - más pequeña */}
      <CardMedia
        component="img"
        height="160"
        image={resolveImageSrc(producto)}
        alt={nombre}
        sx={{
          objectFit: 'contain',
          p: 1.5,
          bgcolor: '#fafafa',
        }}
      />
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
        <Box sx={{ mb: 1.5 }}>{priceContent}</Box>{' '}
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
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              if (negociable) {
                // TODO: Abrir modal de negociación
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              e.preventDefault()
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
        <Button
          variant="contained"
          color="primary"
          fullWidth
          data-no-card-click="true"
          startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={handleAgregarClick}
          onTouchStart={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
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
        onClick={(e) => e.stopPropagation()} // Prevenir click en ProductCard
        disableScrollLock={true} // ✅ SOLUCIÓN: Prevenir bloqueo de scroll que causa desplazamiento
        disableRestoreFocus={true} // ✅ SOLUCIÓN: Evitar cambios de foco que afecten el layout
        disableAutoFocus={true} // ✅ SOLUCIÓN: Prevenir auto-focus que puede mover el modal
        PaperProps={{
          onClick: (e) => e.stopPropagation(), // Prevenir click en ProductCard
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
            <IconButton
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleDecrement()
              }}
              disabled={cantidad <= 1}
              size="small"
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              type="number"
              value={cantidad}
              onChange={handleCantidadChange}
              inputProps={{ min: 1, max: stock }}
              sx={{
                width: 100, // Aumentado para soportar 4 dígitos
                '& input': {
                  textAlign: 'center', // Centrar el texto
                  userSelect: 'text', // ✅ SOLUCIÓN: Permitir selección solo en el input
                },
              }}
              size="small"
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleIncrement()
              }}
              disabled={cantidad >= stock}
              size="small"
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
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
            <Button
              variant="outlined"
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleClosePopover()
              }}
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
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleConfirmarAgregar()
              }}
              fullWidth
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              Agregar
            </Button>
          </Box>
        </Box>
      </Popover>
    </Card>
  )
}

export default React.memo(ProductCard)
