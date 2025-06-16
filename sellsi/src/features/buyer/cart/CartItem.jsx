import React, { useState } from 'react'
import {
  Paper,
  Grid,
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  IconButton,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Checkbox,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Verified as VerifiedIcon,
  LocalAtm as LocalAtmIcon,
  Warning as WarningIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import PriceDisplay from '../../marketplace/PriceDisplay/PriceDisplay'
import StockIndicator from '../../marketplace//StockIndicator/StockIndicator'
import { QuantitySelector } from '../../../components/shared' // ✅ Componente universal
import { SHIPPING_OPTIONS } from '../../../features/marketplace/hooks/constants'
import { getProductImageUrl } from '../../../utils/getProductImageUrl'
import {
  calculatePriceForQuantity,
  formatProductForCart,
} from '../../../utils/priceCalculation'

/*
========== GUÍA DE IDENTIFICACIÓN DE ELEMENTOS DEL CARRITO ==========

ESTRUCTURA DEL COMPONENTE CartItem:
1. Paper (contenedor principal)
   └── Grid container (3 columnas)
       ├── Grid item 1 (sm=3): IMAGEN DEL PRODUCTO
       ├── Grid item 2 (sm=5): INFORMACIÓN DEL PRODUCTO
       │   ├── Typography: TÍTULO (aquí se debe quitar margin-top)
       │   ├── Box: Información del proveedor (Avatar + Chip)
       │   ├── PriceDisplay: Precio unitario
       │   └── Stack: Badges (Verificado, Mejor precio)
       └── Grid item 3 (sm=4): CONTROLES Y ACCIONES (TODO debe ir a la derecha)
           ├── QuantitySelector: Controles de cantidad
           ├── StockIndicator: Información de stock restante
           ├── Typography: Subtotal (precio × cantidad)
           └── Stack: Botones (Favoritos, Eliminar)

PROBLEMAS IDENTIFICADOS:
- El TÍTULO tiene margin-top que debe removerse
- Los CONTROLES no están alineados a la derecha
- Ambos problemas afectan a los 3 items del carrito
*/

// Componente de imagen optimizada con lazy loading (también se puede compartir)
const OptimizedImage = ({ src, alt, sx }) => {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: '100%',        height: '100%',
        objectFit: 'cover',
        borderRadius: 1,
        backgroundColor: '#f5f5f5',
        ...sx,
      }}
    />
  )
}

// Helper robusto para obtener la imagen primaria
function resolveImageSrc(item) {
  let image = item?.image || item?.imagen
  if (!image) return '/placeholder-product.jpg'
  // Si es string (url pública o path relativo)
  if (typeof image === 'string') {
    if (image.startsWith('blob:')) return '/placeholder-product.jpg'
    return getProductImageUrl(image, item) // ✅ Pasar datos del item
  }
  // Si es objeto con url
  if (typeof image === 'object' && image !== null) {
    if (image.url && typeof image.url === 'string') {
      if (image.url.startsWith('blob:')) return '/placeholder-product.jpg'
      return getProductImageUrl(image.url, item) // ✅ Pasar datos del item
    }
    // Si es objeto con path relativo
    if (image.path && typeof image.path === 'string') {
      return getProductImageUrl(image.path, item) // ✅ Pasar datos del item
    }
  }
  return '/placeholder-product.jpg'
}

const CartItem = ({
  item,
  formatPrice,
  updateQuantity,
  isInWishlist,
  handleAddToWishlist,
  handleRemoveWithAnimation,
  itemVariants,
  onShippingChange, // Nueva prop para manejar cambios de envío
  // Nuevas props para selección múltiple
  isSelectionMode,
  isSelected,
  onToggleSelection,
}) => {
  const [selectedShipping, setSelectedShipping] = useState('standard')
  // ===== CÁLCULOS DE PRECIOS OPTIMIZADOS (USAR priceCalculations MEMOIZADO) =====
  // Los precios se calculan en priceCalculations para evitar recálculos innecesarios
  // Función optimizada para manejar el cambio de envío y calcular el precio
  const handleShippingChange = React.useCallback((shippingId) => {
    setSelectedShipping(shippingId)
    if (onShippingChange) {
      onShippingChange(item.id, shippingId)
    }
  }, [item.id, onShippingChange])

  // Obtener el precio del envío seleccionado  // ===== OPTIMIZACIONES DE RENDIMIENTO =====
  // Memoizar datos del producto para evitar recálculos
  const productData = React.useMemo(() => ({
    name: item.name || item.nombre || 'Producto sin nombre',
    supplier: item.supplier || item.proveedor || 'Proveedor no especificado',
    image: item.image || item.imagen || '/placeholder-product.jpg',
    price_tiers: item.price_tiers || [],
    minimum_purchase: item.minimum_purchase || item.compraMinima || 1,
    basePrice: item.originalPrice || item.precioOriginal || item.price || item.precio || 0,
    maxStock: item.maxStock || item.stock || 50
  }), [item])

  // Memoizar cálculos de precio para evitar recálculos innecesarios
  const priceCalculations = React.useMemo(() => {
    const unitPrice = calculatePriceForQuantity(item.quantity, productData.price_tiers, productData.basePrice)
    const subtotal = unitPrice * item.quantity
    return { unitPrice, subtotal }
  }, [item.quantity, productData.price_tiers, productData.basePrice])

  // Memoizar opciones de envío
  const shippingData = React.useMemo(() => {
    const selectedOption = SHIPPING_OPTIONS.find(opt => opt.id === selectedShipping)
    return {
      price: selectedOption ? selectedOption.price : 0,
      label: selectedOption ? selectedOption.label : 'Estándar'
    }
  }, [selectedShipping])

  // Handler optimizado para cambio de cantidad
  const handleQuantityChange = React.useCallback((newQuantity) => {
    updateQuantity(item.id, newQuantity)
  }, [item.id, productData.price_tiers, productData.basePrice, updateQuantity])
  // Handler optimizado para agregar a wishlist
  const handleWishlistClick = React.useCallback(() => {
    handleAddToWishlist(item)
  }, [item, handleAddToWishlist])  // Handler optimizado para eliminar item
  const handleDeleteItem = React.useCallback(() => {
    handleRemoveWithAnimation(item.id)
  }, [item.id, handleRemoveWithAnimation])

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      layoutId={`cart-item-${item.id}`}
    >
      {' '}
      {/* ========== CONTENEDOR PRINCIPAL DEL ITEM DEL CARRITO ========== */}{' '}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          border:
            isSelectionMode && isSelected
              ? '2px solid rgba(25, 118, 210, 0.6)'              : '1px solid rgba(102, 126, 234, 0.1)',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden', // Prevenir overflow horizontal
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            border:
              isSelectionMode && isSelected
                ? '2px solid rgba(25, 118, 210, 0.8)'
                : '1px solid rgba(102, 126, 234, 0.2)',
          },
        }}
      >
        {' '}
        {/* Checkbox para selección múltiple */}
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}            exit={{ opacity: 0, scale: 0 }}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                background: isSelected
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                padding: '4px',
                backdropFilter: 'blur(8px)',                border: isSelected
                  ? '2px solid rgba(25, 118, 210, 0.3)'
                  : '2px solid rgba(0, 0, 0, 0.1)',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleSelection(item.id)}
                color="primary"
                size="small"
                sx={{
                  '&.Mui-checked': {
                    color: '#1976d2',
                  },
                  '&:hover': {
                    transform: 'scale(1.1)',                  },
                }}
              />
            </Box>
          </motion.div>
        )}{' '}
        {/* ========== GRID CONTENEDOR - DIVIDE EN 4 COLUMNAS ========== */}
        {/* Columna 1: Imagen (xs=12, sm=2.4) */}
        {/* Columna 2: Información del producto (xs=12, sm=3.6) */}
        {/* Columna 3: Controles y acciones (xs=12, sm=3.2) */}
        {/* Columna 4: Opciones de envío (xs=12, sm=2.8) */}
        <Grid
          container
          spacing={2}
          alignItems="flex-start"
          sx={{ overflow: 'hidden' }}
        >
          {' '}
          {/* Imagen optimizada */}{' '}
          <Grid item xs={12} sm={2.4}>
            <Box
              sx={{
                position: 'relative',
                width: '100%', // ← Ancho flexible
                minWidth: '115px', // ← Mínimo reducido
                maxWidth: '115px', // ← Máximo mantenido
              }}
            >
              <OptimizedImage
                src={resolveImageSrc(item)}
                alt={productData.name}
                sx={{
                  height: 140,
                  width: '100%',
                  borderRadius: 2,
                  objectFit: 'contain',
                  backgroundColor: '#f9f9f9',
                }}
              />
            </Box>
          </Grid>{' '}
          {/* Información del producto */}
          <Grid item xs={12} sm={3.6} sx={{ pt: '0 !important' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
                pt: '0 !important',
                mt: '0 !important',
              }}
            >
              {' '}
              {/* ========== TÍTULO DEL PRODUCTO ========== */}
              {/* Este Typography contiene el título/nombre del producto */}
              {/* IMPORTANTE: Aquí está el título que debe tener el margin-top removido */}
              <Typography
                variant="H5"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #333, #666)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mt: '0 !important',
                  pt: '0 !important',
                  mb: 1,
                }}
              >
                {productData.name}
              </Typography>
              {/* ========== INFORMACIÓN DEL PROVEEDOR ========== */}
              {/* Box contenedor del avatar y chip del proveedor */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    fontSize: '0.75rem',
                  }}
                >
                  {(item.proveedor || 'Proveedor no encontrado').charAt(0)}
                </Avatar>
                <Chip
                  label={item.proveedor || 'Proveedor no encontrado'}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>{' '}
              {/* Price - Usando precio dinámico basado en quantity y price_tiers */}
              <PriceDisplay
                price={priceCalculations.unitPrice}
                variant="h6"
                sx={{ mb: 6 }}
              />{' '}
              {/* Feature badges */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap', gap: 0.5 }}
              >
                <Chip
                  icon={<VerifiedIcon />}
                  label="Verificado"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Box>{' '}
          </Grid>{' '}
          {/* Controles y acciones */}
          <Grid item xs={12} sm={3.2} sx={{ marginLeft: 'auto !important' }}>
            <Box
              sx={{
                display: 'flex !important',
                flexDirection: 'column !important',
                alignItems: 'flex-end !important',
                justifyContent: 'flex-start !important',
                textAlign: 'right !important',
                gap: 2,
                height: '100%',
                width: '100%',
                marginLeft: 'auto !important',
              }}
            >
              {' '}
              {/* Controles de cantidad con animaciones */}
              <Box
                sx={{
                  display: 'flex !important',
                  justifyContent: 'flex-end !important',
                  alignItems: 'center !important',                  width: '100%',
                  marginLeft: 'auto !important',
                  opacity: isSelectionMode ? 0.5 : 1,
                }}
              >
                <QuantitySelector
                  value={item.quantity}
                  onChange={handleQuantityChange}
                  min={item.minimum_purchase || item.compraMinima || 1}
                  max={item.maxStock}
                  showStockLimit={true}
                  size="small"
                  disabled={isSelectionMode}
                  sx={{
                    alignSelf: 'flex-end !important',
                    justifyContent: 'flex-end !important',
                    marginLeft: 'auto !important',
                    display: 'flex !important',
                    flexDirection: 'row !important',
                  }}
                />
              </Box>{' '}
              {/* Información de stock */}
              <StockIndicator
                stock={item.maxStock - item.quantity}
                lowStockThreshold={Math.round(item.maxStock * 0.2)}
                showUnits={true}
                variant="caption"
                sx={{
                  textAlign: 'right !important',                  alignSelf: 'flex-end !important',
                  marginLeft: 'auto !important',
                  opacity: isSelectionMode ? 0.5 : 1,
                }}
              />{' '}
              {/* Subtotal del producto - Usando precio dinámico calculado */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  textAlign: 'right !important',
                  color: 'success.main',
                  background: '#1976d2',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  alignSelf: 'flex-end !important',                  marginLeft: 'auto !important',
                  opacity: isSelectionMode ? 0.5 : 1,
                }}
              >
                {formatPrice(priceCalculations.subtotal)}
              </Typography>
              {/* Acciones */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: 'flex-end !important',
                  alignSelf: 'flex-end !important',                  marginLeft: 'auto !important',
                  opacity: isSelectionMode ? 0.3 : 1,
                }}
              >
                <Tooltip
                  title={
                    isSelectionMode
                      ? 'Usa el modo selección para eliminar'
                      : isInWishlist(item.id)
                      ? 'Quitar de favoritos'
                      : 'Agregar a favoritos'
                  }
                >                  <motion.div whileTap={{ scale: 0.95 }}>
                    <IconButton
                      size="small"
                      onClick={handleWishlistClick}
                      color="secondary"
                      disabled={isSelectionMode}
                    >
                      {isInWishlist(item.id) ? (
                        <FavoriteIcon />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  </motion.div>
                </Tooltip>
                <Tooltip
                  title={
                    isSelectionMode
                      ? 'Usa el modo selección para eliminar'
                      : 'Eliminar del carrito'
                  }
                >
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveWithAnimation(item.id)}
                      color="error"
                      disabled={isSelectionMode}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </motion.div>
                </Tooltip>{' '}
              </Stack>
            </Box>
          </Grid>{' '}
          {/* Opciones de Envío */}
          <Grid item xs={12} sm={2.8}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                height: '100%',
                pl: 1,
                pr: 0, // Reducido de 1 a 0.3 para dar más ancho
                borderLeft: '1px solid rgba(0,0,0,0.1)',
                overflow: 'visible',
                position: 'relative',
                minWidth: 0, // Permite que el contenido se contraiga
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  color: '#2563eb',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <LocalShippingIcon sx={{ fontSize: 16 }} />
                Despacho
              </Typography>{' '}
              <FormControl size="small">
                {' '}
                <Select
                  value={selectedShipping}
                  onChange={(e) => handleShippingChange(e.target.value)}
                  variant="outlined"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 200,
                        width: 'auto',
                        minWidth: '200px',
                        '& .MuiMenuItem-root': {
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    disableScrollLock: true,
                  }}
                  sx={{
                    fontSize: '0.75rem',
                    width: '140px', // Ancho fijo para evitar que se agrande
                    minWidth: '140px', // Ancho mínimo fijo
                    maxWidth: '140px', // Ancho máximo fijo
                    '& .MuiSelect-select': {
                      py: 0.5,
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiOutlinedInput-root': {
                      overflow: 'hidden',
                    },
                  }}
                >
                  {SHIPPING_OPTIONS.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold' }}
                        >
                          {option.icon} {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.price > 0
                            ? formatPrice(option.price)
                            : 'Gratis'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.days}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>{' '}
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  color: 'success.main',
                  fontWeight: 'bold',
                  fontSize: '1rem', // Aumentado a 1rem para mejor visibilidad
                }}
              >
                {SHIPPING_OPTIONS.find((opt) => opt.id === selectedShipping)
                  ?.price > 0
                  ? formatPrice(
                      SHIPPING_OPTIONS.find(
                        (opt) => opt.id === selectedShipping
                      )?.price
                    )
                  : 'Gratis'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  )
}

export default CartItem
