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
  Search as SearchIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PriceDisplay from '../../../marketplace/PriceDisplay/PriceDisplay'
import StockIndicator from '../../../marketplace/StockIndicator/StockIndicator'
import QuantitySelector from '../../../../shared/components/forms/QuantitySelector'
import LazyImage from '../../../../shared/components/display/LazyImage/LazyImage'
import {
  calculatePriceForQuantity,
  formatProductForCart,
} from '../../../../utils/priceCalculation'
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback'
import { CartItemImage } from '../../../../components/UniversalProductImage' // Nueva imagen universal
import ShippingDisplay from './components/ShippingDisplay'

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

const CartItem = ({
  item,
  formatPrice,
  updateQuantity,
  handleRemoveWithAnimation,
  itemVariants,
  onShippingChange, // Nueva prop para manejar cambios de envío
  // Nuevas props para selección múltiple
  isSelectionMode,
  isSelected,
  onToggleSelection,
  // Nuevas props para validación de despacho
  shippingValidation,
  isAdvancedShippingMode = false,
}) => {
  // Hook de navegación debe ir dentro del cuerpo del componente
  const navigate = useNavigate();
  // Construir slug SEO a partir del nombre del producto
  const getProductSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleViewFichaTecnica = React.useCallback(() => {
    const id = item.product_id || item.id;
    const slug = getProductSlug(item.name || item.nombre);
    navigate(`/marketplace/product/${id}${slug ? `/${slug}` : ''}`);
  }, [navigate, item]);
  const [selectedShipping, setSelectedShipping] = useState('standard')
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  
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

  // Memoizar opciones de envío - ahora calculado dinámicamente
  const shippingData = React.useMemo(() => {
    return {
      price: 0, // Se calculará dinámicamente según región
      label: 'Según región'
    }
  }, [selectedShipping])

  // Handler optimizado para cambio de cantidad
  const handleQuantityChange = React.useCallback((newQuantity) => {
    updateQuantity(item.id, newQuantity)
  }, [item.id, updateQuantity])
  
  // Handler optimizado para eliminar item
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
          p: 1.5,
          mb: 4,
          borderRadius: 1,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          border:
            isSelectionMode && isSelected
              ? '2px solid rgba(25, 118, 210, 0.6)'
              : '1px solid rgba(102, 126, 234, 0.1)',
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: '600px',
            md: '800px',
            lg: '1030px',
            xl: '1200px',
          },
          overflow: 'hidden', // Prevenir overflow horizontal
          position: 'relative',
          '&:hover': {
            border: '1px solid rgba(2, 3, 5, 0.55)', // Solo el borde oscuro al hacer hover
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
          spacing={3}
          alignItems="flex-start"
          sx={{ overflow: 'hidden' }}
        >
          {' '}          {/* Imagen optimizada */}{' '}
          <Grid size={{ xs: 12, sm: 2.4,}}>
            <Box
              sx={{
                position: 'relative',
                width: '160px',
                height: '160px',
              }}
            >
              <CartItemImage
                product={item}
                height={160}
                sx={{
                  width: '100%',
                  height: '100%'
                }}
                onLoad={() => {
                  if (process.env.NODE_ENV === 'development') {
                    // Log minimal product image fields for debugging cart visibility
                    // Avoid logging full object repeatedly if large
                    const { id, productid, product_id, imagen, image, thumbnail_url, thumbnails } = item || {};
                    // eslint-disable-next-line no-console
                    console.debug('[CART][IMAGE_LOADED]', { id: id || productid || product_id, imagen, image, thumbnail_url, hasThumbs: !!thumbnails });
                  }
                }}
                onError={() => {
                  if (process.env.NODE_ENV === 'development') {
                    const { id, productid, product_id, imagen, image, thumbnail_url, thumbnails } = item || {};
                    // eslint-disable-next-line no-console
                    console.warn('[CART][IMAGE_ERROR]', { id: id || productid || product_id, imagen, image, thumbnail_url, hasThumbs: !!thumbnails });
                  }
                }}
              />
            </Box>
          </Grid>{' '}          {/* Información del producto */}
          <Grid size={{ xs: 12, sm: 3.6 }} >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100%',
              }}
            >
              {' '}
              {/* ========== TÍTULO DEL PRODUCTO ========== */}
              {/* Este Typography contiene el título/nombre del producto */}
              {/* IMPORTANTE: Aquí está el título que debe tener el margin-top removido */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #333, #666)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                {productData.name}
              </Typography>
              {/* ========== INFORMACIÓN DEL PROVEEDOR ========== */}
              {/* Box contenedor del nombre y verificación del proveedor */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  gap: 1,
                  fontSize: '0.9rem',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {item.proveedor || 'Proveedor no encontrado'}
                </Typography>
                {/* Mostrar icono si está verificado - agregando múltiples condiciones para debug */}
                {(item.proveedorVerificado || item.verified || item.supplier_verified || item.supplierVerified) && (
                  <VerifiedIcon
                    sx={{
                      fontSize: 16,
                      color: 'primary.main',
                    }}
                  />
                )}
              </Box>{' '}
              {/* Price - Usando precio dinámico basado en quantity y price_tiers */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#222', fontWeight: 500, mb: 0.5, fontsize: '0.9rem' }}>
                  Precio Unitario:
                </Typography>
                <PriceDisplay
                  price={priceCalculations.unitPrice}
                  variant="h6"
                  sx={{ color: '#222', fontWeight: 700, fontSize: '1rem' }}
                />
              </Box>
              {/* Feature badges */}
              {/* Stack de badges eliminado: Chip "Verificado" removido */}
            </Box>{' '}
          </Grid>{' '}          {/* Controles y acciones */}
          <Grid size={{ xs: 12, sm: 3.2 }} sx={{ marginLeft: 'auto !important' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1,
                height: '100%',
                width: '100%',
                marginLeft: 'auto',
              }}
            >
              {/* Controles de cantidad centrados */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
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
                    alignSelf: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                  stockText={undefined}
                />
              </Box>
              {/* Información de stock centrada */}
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <StockIndicator
                  stock={item.maxStock - item.quantity}
                  lowStockThreshold={Math.round(item.maxStock * 0.2)}
                  showUnits={true}
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    alignSelf: 'center',
                    opacity: isSelectionMode ? 0.5 : 1,
                  }}
                />
              </Box>
              {/* Contenedor flex para Precio Total y monto alineados al centro */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  gap: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#222',
                    fontWeight: 500,
                    mb: 0,
                    textAlign: 'center',
                    fontSize: '0.9rem'

                  }}
                >
                  Precio Total:
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'success.main',
                    background: '#1976d2',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: isSelectionMode ? 0.5 : 1,
                  }}
                >
                  {formatPrice(priceCalculations.subtotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>{' '}          {/* Opciones de Envío */}
          <Grid size={{ xs: 12, sm: 2.8 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                height: '100%',
                pl: 1,
                pr: 0,
                borderLeft: '1px solid rgba(0,0,0,0.1)',
                overflow: 'visible',
                position: 'relative',
                minWidth: 0,
              }}
            >
              {/* Botón de eliminar en la esquina superior derecha */}
              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Tooltip
                  title={
                    isSelectionMode
                      ? 'Usa el modo selección para eliminar'
                      : 'Eliminar del carrito'
                  }
                  placement="right"
                >
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <IconButton
                      size="small"
                      onClick={() => setOpenDeleteModal(true)}
                      color="default"
                      disabled={isSelectionMode}
                      sx={{ bgcolor: 'transparent', border: 'none', p: 1.5, mb: 2 }}
                    >
                      <DeleteIcon sx={{ color: 'grey.600' }} />
                    </IconButton>
                  </motion.div>
                </Tooltip>
                <Tooltip title="Ver Ficha Técnica" placement="right">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleViewFichaTecnica}
                      color="primary"
                      disabled={isSelectionMode}
                      sx={{ bgcolor: 'transparent', border: 'none', p: 1.5 }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Modal
                  isOpen={openDeleteModal}
                  onClose={() => setOpenDeleteModal(false)}
                  onSubmit={() => {
                    handleRemoveWithAnimation(item.id);
                    setOpenDeleteModal(false);
                  }}
                  type={MODAL_TYPES.DELETE}
                  title="Eliminar producto del carrito"
                  submitButtonText="Eliminar"
                  cancelButtonText="Cancelar"
                  showCancelButton
                  sx={{
                    '& .MuiDialogContent-root': {
                      textAlign: 'center',
                    },
                    '& .MuiDialogActions-root': {
                      justifyContent: 'center',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    ¿Estás seguro que deseas eliminar este producto del carrito?
                  </Box>
                </Modal>
              </Box>
              {/* Despacho label and truck icon removed as requested */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '140px',
                minWidth: '140px',
                maxWidth: '140px',
                py: 1,
                px: 0,
                borderRadius: 1,
                bgcolor: 'transparent',
                border: 'none',
              }}>
                <ShippingDisplay
                  product={item}
                  shippingValidation={shippingValidation}
                  isAdvancedMode={isAdvancedShippingMode}
                  formatPrice={formatPrice}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  )
}

export default CartItem
