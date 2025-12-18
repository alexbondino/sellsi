import React, { useState } from 'react'
import {
  Paper,
  Grid,
  Box,
  Typography,
  Avatar,
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
import PriceDisplay from '../../../../shared/components/display/price/PriceDisplay'
import { StockIndicator } from '../../../../workspaces/marketplace'
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

  // Normaliza nombre de proveedor para slug de URL
  const normalizeProviderSlug = (providerName) => {
    return providerName
      ?.toLowerCase()
      ?.replace(/\s+/g, '-')
      ?.replace(/[^\w-]/g, '');
  };

  // Handler para click en nombre del proveedor
  const handleSupplierClick = React.useCallback(() => {
    const providerName = item.proveedor || item.supplier;
    const supplierId = item.supplier_id || item.supplierId;
    
    console.log('🔍 [CartItem] Click en proveedor:', {
      providerName,
      supplierId,
      item
    });
    
    if (!providerName || !supplierId) {
      console.error('❌ Falta información del proveedor:', { providerName, supplierId });
      return;
    }
    
    const proveedorSlug = normalizeProviderSlug(providerName);
    const catalogUrl = `/catalog/${proveedorSlug}/${supplierId}`;
    console.log('✅ Navegando a:', catalogUrl);
    navigate(catalogUrl);
  }, [navigate, item]);

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
    // Cuando la navegación proviene del carrito, marcar el origen como buyer/marketplace
    navigate(`/marketplace/product/${id}${slug ? `/${slug}` : ''}`, { state: { from: '/buyer/marketplace' } });
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

  // Debug flag to force-show offer badge when visiting URL with ?debugShowOffers=1
  const showOfferDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugShowOffers') === '1';

  const isOfferedFlag = !!(item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price);

  // Memoizar opciones de envío - ahora calculado dinámicamente
  const shippingData = React.useMemo(() => ({
    price: 0,
    label: 'Según región'
  }), [selectedShipping])

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
          p: { xs: 1.5, md: 1, lg: 1.5, xl: 1.5 },
          mb: { xs: 4, md: 3, lg: 4, xl: 4 },
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
            md: '100%',
            lg: '100%',
            xl: '100%',
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
                    color: '#2E52B2',
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
          spacing={{ xs: 3, md: 2, lg: 3, xl: 3 }}
          alignItems="flex-start"
          sx={{ overflow: 'hidden' }}
        >
          {' '}          {/* Imagen optimizada */}{' '}
          <Grid size={{ xs: 12, sm: 2.4, md: 2.4, lg: 2.4, xl: 2.4 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: { xs: '160px', md: '140px', lg: '160px' },
                height: { xs: '160px', md: '140px', lg: '160px' },
                mx: 'auto'
              }}
            >
              <CartItemImage
                product={item}
                height={160}
                sx={{
                  width: '100%',
                  height: '100%'
                }}
                // removed debug onLoad/onError logs
              />
            </Box>
          </Grid>{' '}          {/* Información del producto */}
          <Grid size={{ xs: 12, sm: 3.6, md: 3.6, lg: 3.6, xl: 3.6 }} >
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, md: 1.5 } }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #333, #666)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    flex: 1,
                    mb: 0,
                    minWidth: 0,
                    fontSize: { xs: '1.25rem', md: '1.1rem', lg: '1.25rem' }
                  }}
                >
                  {productData.name}
                </Typography>
                {((item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price) || showOfferDebug) && (
                  <Typography
                    data-testid="chip-ofertado-text"
                    variant="subtitle2"
                    sx={{
                      color: 'success.main',
                      fontWeight: 800,
                      ml: 0.5,
                      fontSize: { xs: '0.95rem', md: '0.8rem', lg: '0.95rem' },
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: { xs: 1, md: 0.7, lg: 1 },
                      py: { xs: '3px', md: '2px', lg: '3px' },
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: 'success.main',
                      bgcolor: 'rgba(76, 175, 80, 0.06)'
                    }}
                  >
                    OFERTADO
                  </Typography>
                )}
              </Box>
              {/* ========== INFORMACIÓN DEL PROVEEDOR ========== */}
              {/* Box contenedor del nombre y verificación del proveedor */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, md: 0.7, lg: 1 },
                  gap: { xs: 1, md: 0.7, lg: 1 },
                  fontSize: '0.9rem',
                }}
              >
                <Typography
                  variant="body1"
                  onClick={handleSupplierClick}
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', md: '0.8rem', lg: '0.9rem' },
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: 'primary.dark',
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  {item.proveedor || 'Proveedor no encontrado'}
                </Typography>
                {/* Mostrar icono si está verificado - agregando múltiples condiciones para debug */}
                {(item.proveedorVerificado || item.verified || item.supplier_verified || item.supplierVerified) && (
                  <VerifiedIcon
                    sx={{
                      fontSize: { xs: 16, md: 14, lg: 16 },
                      color: 'primary.main',
                    }}
                  />
                )}
              </Box>{' '}
              {/* (El Chip visual de 'Ofertado' fue removido; se mantiene el texto "OFERTADO") */}
              {/* Price - Usando precio dinámico basado en quantity y price_tiers */}
              <Box sx={{ mb: { xs: 2, md: 1.2, lg: 2 } }}>
                <Typography variant="body2" sx={{ color: '#222', fontWeight: 500, mb: 0.5, fontSize: { xs: '0.9rem', md: '0.8rem', lg: '0.9rem' } }}>
                  Precio Unitario:
                </Typography>
                <PriceDisplay
                  price={priceCalculations.unitPrice}
                  variant="h6"
                  sx={{ color: '#222', fontWeight: 700, fontSize: { xs: '1rem', md: '0.9rem', lg: '1rem' } }}
                />
              </Box>
              {/* Feature badges */}
              {/* Stack de badges eliminado: Chip "Verificado" removido */}
            </Box>{' '}
          </Grid>{' '}          {/* Controles y acciones */}
          <Grid size={{ xs: 12, sm: 3.2, md: 3.2, lg: 3.2, xl: 3.2 }} sx={{ marginLeft: 'auto !important' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: { xs: 1, md: 0.7, lg: 1 },
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
                  stock={productData.maxStock}
                  lowStockThreshold={Math.round((productData.maxStock || 0) * 0.2)}
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
                    fontSize: { xs: '0.9rem', md: '0.8rem', lg: '0.9rem' }
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
                    background: '#2E52B2',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: isSelectionMode ? 0.5 : 1,
                    fontSize: { xs: '1.5rem', md: '1.3rem', lg: '1.5rem' }
                  }}
                >
                  {formatPrice(priceCalculations.subtotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>{' '}          {/* Opciones de Envío */}
          <Grid size={{ xs: 12, sm: 2.8, md: 2.8, lg: 2.8, xl: 2.8 }}>
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
                width: { xs: '140px', md: '100%', lg: '140px' },
                minWidth: { xs: '140px', md: '120px', lg: '140px' },
                maxWidth: { xs: '140px', md: '100%', lg: '140px' },
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
