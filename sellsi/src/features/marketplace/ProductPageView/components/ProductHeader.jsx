import React, { useState, useMemo, memo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import { LocalShipping, Security, Assignment } from '@mui/icons-material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { getProductImageUrl } from '../../../../utils/getProductImageUrl'
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ProductImageGallery from './ProductImageGallery'
import PurchaseActions from './PurchaseActions'
import PriceDisplay from '../../PriceDisplay'
import StockIndicator from '../../StockIndicator'
import { useProductPriceTiers } from '../../hooks/useProductPriceTiers'

const ProductHeader = React.memo(({
  product,
  selectedImageIndex,
  onImageSelect,
  onAddToCart,
  isLoggedIn,
  fromMyProducts = false,
}) => {
  const navigate = useNavigate();

  const {
    nombre,
    proveedor,
    imagen,
    imagenes = [],
    precio,
    stock,
    compraMinima,
    descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
  } = product
  const {
    tiers,
    loading: loadingTiers,
    error: errorTiers,
  } = useProductPriceTiers(product.id)

  // Usar tramos del producto si existen, sino usar los del hook
  const finalTiers = product.priceTiers || tiers || []

  const [copied, setCopied] = useState({ name: false, price: false })
  // Función para copiar texto al portapapeles y mostrar feedback
  const handleCopy = (type, value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied((prev) => ({ ...prev, [type]: true }))
      setTimeout(() => setCopied((prev) => ({ ...prev, [type]: false })), 1200)
    })
  }

  // Función para generar el formato CSV de todos los tramos
  const generateTiersCSV = (tiers) => {
    const header = 'Cantidad mínima,Precio unitario'
    const rows = tiers.map(
      (tier) => `${tier.min_quantity},$${tier.price.toLocaleString('es-CL')}`
    )
    return [header, ...rows].join('\n')
  }

  // Función para copiar todos los tramos en formato CSV
  const handleCopyAllTiers = () => {
    if (tiers && tiers.length > 0) {
      const csvContent = generateTiersCSV(tiers)
      handleCopy('allTiers', csvContent)
    }
  }

  // Lógica para mostrar precios y tramos
  let priceContent
  if (loadingTiers) {
    priceContent = (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 24 }}
      >
        <CircularProgress color="primary" size={18} />
      </Box>
    )
  } else if (errorTiers) {
    priceContent = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="error.main">
          Error al cargar precios
        </Typography>
        <Tooltip title="Reintenta o revisa tu conexión" arrow>
          <ContentCopyIcon color="disabled" fontSize="small" />
        </Tooltip>
      </Box>
    )
  } else if (tiers && tiers.length > 0) {
    // Mostrar tabla de tramos
    priceContent = (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            Precios por cantidad
          </Typography>          <Tooltip
            title="El precio varía según la cantidad que compres. Cada tramo indica el precio unitario para ese rango de unidades."
            arrow
            placement="right"
          >
            <InfoOutlinedIcon
              color="action"
              fontSize="small"
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>        <TableContainer
          component={Paper}
          sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}
        >
          <Table size="small">
            <TableBody>
              {tiers.map((tier, idx) => {
                // Determinar el mensaje del tooltip basado en si es el último tramo
                const isLastTier = idx === tiers.length - 1;
                let tooltipMessage;
                let rangeText;
                
                if (isLastTier) {
                  // Para el último tramo: "Si tú compras X unidades o más"
                  tooltipMessage = `Si compras ${tier.min_quantity} unidades o más, el precio unitario es $${tier.price.toLocaleString('es-CL')}`;
                  rangeText = `${tier.min_quantity}+ uds`;
                } else {
                  // Para tramos intermedios: calcular el máximo basado en el siguiente tramo
                  const nextTier = tiers[idx + 1];
                  const maxQuantity = nextTier ? nextTier.min_quantity - 1 : tier.max_quantity;
                  
                  tooltipMessage = `Si tú compras entre ${tier.min_quantity} y ${maxQuantity} unidades, el precio unitario es de $${tier.price.toLocaleString('es-CL')}`;
                  rangeText = `${tier.min_quantity} - ${maxQuantity} uds`;
                }                return (
                  <Tooltip
                    key={idx}
                    title={tooltipMessage}
                    arrow
                    placement="right"
                  >
                    <TableRow hover sx={{ cursor: 'help' }}>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {rangeText}
                      </TableCell>
                      <TableCell align="center">
                        <Typography color="primary" fontWeight={700}>
                          ${tier.price.toLocaleString('es-CL')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </Tooltip>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Botón para copiar todos los tramos */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyAllTiers}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                borderColor: 'primary.main',
              },
            }}
          >
            {copied.allTiers ? (
              <>
                <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
                ¡Copiado!
              </>
            ) : (
              'Copiar todos los precios'
            )}
          </Button>
        </Box>
      </Box>
    )
  } else {
    // Precio único (sin tramos)
    priceContent = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <PriceDisplay
          price={product.precio}
          originalPrice={product.precioOriginal}
          variant="h2"
        />
        <Tooltip title="Copiar precio" arrow>
          <IconButton
            size="small"
            onClick={() =>
              handleCopy('price', product.precio.toLocaleString('es-CL'))
            }
            sx={{
              boxShadow: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
                boxShadow: 'none',
                outline: 'none',
              },
              '&:active': {
                boxShadow: 'none !important',
                outline: 'none !important',
                background: 'rgba(0,0,0,0.04) !important',
              },
              '&:focus': {
                boxShadow: 'none !important',
                outline: 'none !important',
                background: 'rgba(0,0,0,0.04) !important',
              },
              '&:focus-visible': {
                boxShadow: 'none !important',
                outline: 'none !important',
                background: 'rgba(0,0,0,0.04) !important',
              },
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box
          sx={{
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircleOutlineIcon
            color="success"
            fontSize="small"
            sx={{
              visibility: copied.price ? 'visible' : 'hidden',
              transition: 'visibility 0.2s',
            }}
          />
        </Box>
      </Box>
    )
  }

  function resolveImageSrc(image) {
    const SUPABASE_PUBLIC_URL =
      'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/product-images/'
    if (!image) return '/placeholder-product.jpg'
    if (typeof image === 'string') {
      if (image.startsWith(SUPABASE_PUBLIC_URL)) return image
      if (image.startsWith('/')) return image
      if (/^https?:\/\//.test(image)) return image
      return getProductImageUrl(image)
    }
    if (typeof image === 'object' && image !== null) {
      if (typeof image === 'string') {
        try {
          image = JSON.parse(image)
        } catch (e) {
          return '/placeholder-product.jpg'
        }
      }
      if (
        image.url &&
        typeof image.url === 'string' &&
        image.url.startsWith(SUPABASE_PUBLIC_URL)
      ) {
        return image.url
      }
      if (image.image_url) return getProductImageUrl(image.image_url)
    }
    return '/placeholder-product.jpg'
  }
  return (
    // MUIV2 GRID - CONTENEDOR PRINCIPAL (MuiGrid-container)
    <Grid
      container
      spacing={8}
      sx={{ alignItems: 'flex-start', width: '100%', maxWidth: '100%', mx: 0 }}
    >
      <Grid
        size={{ xs: 12, sm: 6, md: 6, lg: 5 }}
        sx={{ display: 'flex', justifyContent: 'right' }}      >        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            minHeight: '600px',
            ml: { xs: 0, sm: 2, md: 0, lg: 16, xl: 20 }, // Reducir el margin left
            p: 0, // Sin padding para eliminar cualquier espacio
          }}
        >
          <ProductImageGallery
            images={imagenes.map(resolveImageSrc)}
            mainImage={resolveImageSrc(imagen)}
            selectedIndex={selectedImageIndex}
            onImageSelect={onImageSelect}
            productName={nombre}
          />
        </Box>      </Grid>
      {/* Información del Producto */}
      <Grid
        size={{ xs: 12, sm: 6, md: 6, lg: 7, xl: 6 }}
        sx={{ display: 'flex', justifyContent: 'center' }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 2, sm: 2, md: 1 },
            maxWidth: { lg: 450, xl: 500 }, // Reducir el ancho máximo
          }}
        >          {/* Nombre del Producto */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {nombre}
            </Typography>
            <Tooltip title="Copiar nombre del producto" arrow>
              <IconButton
                size="small"
                onClick={() => handleCopy('name', nombre)}
                sx={{
                  boxShadow: 'none',
                  outline: 'none',
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                    boxShadow: 'none',
                    outline: 'none',
                  },
                  '&:active': {
                    boxShadow: 'none !important',
                    outline: 'none !important',
                    background: 'rgba(0,0,0,0.04) !important',
                  },
                  '&:focus': {
                    boxShadow: 'none !important',
                    outline: 'none !important',
                    background: 'rgba(0,0,0,0.04) !important',
                  },
                  '&:focus-visible': {
                    boxShadow: 'none !important',
                    outline: 'none !important',
                    background: 'rgba(0,0,0,0.04) !important',
                  },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                width: 24,
                height: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleOutlineIcon
                color="success"
                fontSize="small"
                sx={{
                  visibility: copied.name ? 'visible' : 'hidden',
                  transition: 'visibility 0.2s',
                }}
              />
            </Box>
          </Box>
          {/* Nombre del Proveedor */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
          {/* Compra mínima */}
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              fontSize: 16,
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            Compra mínima: {compraMinima} unidades
          </Typography>{' '}
          {/* Precios y/o tramos */}
          {priceContent}
          {/* Descripción */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            {descripcion}
          </Typography>{' '}
          {/* Stock mejorado */}
          <Box sx={{ mb: 4 }}>
            {stock === 0 ? (
              <Typography
                variant="h6"
                color="error"
                sx={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Assignment sx={{ fontSize: 24, color: 'error.main' }} />
                Producto agotado
              </Typography>
            ) : (
              <StockIndicator stock={stock} showUnits={true} />
            )}
          </Box>{' '}
          {/* Botones de Compra */}
          {/* Solo mostrar acciones de compra si NO es supplier, ni supplier marketplace, ni mis productos */}
          {!(product.fromMyProducts || product.isFromSupplierMarketplace || product.isSupplier) && (
            <PurchaseActions
              onAddToCart={onAddToCart}
              stock={stock}
              product={product}
              tiers={finalTiers}
              isLoggedIn={isLoggedIn}
            />
          )}
        </Box>
      </Grid>
    </Grid>
  )
})

ProductHeader.displayName = 'ProductHeader'

export default ProductHeader
