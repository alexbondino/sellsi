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
import { LocalShipping, Security, Assignment, Verified as VerifiedIcon } from '@mui/icons-material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { getProductImageUrl } from '../../../utils/getProductImageUrl'
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useResponsiveThumbnail } from '../../../hooks/useResponsiveThumbnail'; // Nuevo hook
import { useOptimizedUserShippingRegion } from '../../../hooks/useOptimizedUserShippingRegion'; // Hook optimizado para región
import { useOptimizedProductOwnership } from '../hooks/useOptimizedProductOwnership'; // Hook optimizado para verificación de propiedad

import ProductImageGallery from './ProductImageGallery'
import PurchaseActions from './PurchaseActions'
import PriceDisplay from '../../marketplace/PriceDisplay/PriceDisplay'
import StockIndicator from '../../marketplace/StockIndicator/StockIndicator'
import QuotationModal from './QuotationModal'
import { useProductPriceTiers } from '../../../shared/hooks/product/useProductPriceTiers';
import ContactModal from '../../../shared/components/modals/ContactModal';
import { useSupplierDocumentTypes } from '../../../shared/utils/supplierDocumentTypes';

const ProductHeader = React.memo(({
  product,
  selectedImageIndex,
  onImageSelect,
  isLoggedIn,
  fromMyProducts = false,
  isMobile = false, // Nuevo prop para responsividad
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

  // ✅ NUEVO: Hook para obtener thumbnail responsivo de la imagen principal
  const { thumbnailUrl: mainImageThumbnail, isLoading: thumbnailLoading } = useResponsiveThumbnail(product);

  // ✅ Hook para región de envío con Supabase Realtime
  const { userRegion, isLoadingUserRegion } = useOptimizedUserShippingRegion();

  // ✅ NUEVO: Hook optimizado para verificación de propiedad de productos - INSTANTÁNEO
  const { 
    isProductOwnedByUser, 
    isUserDataReady, 
    isLoadingOwnership 
  } = useOptimizedProductOwnership();

  // Hook para obtener tipos de documentos permitidos por el proveedor
  const supplierId = product?.supplier_id || product?.supplierId;
  const { 
    documentTypes: supplierDocumentTypes, 
    availableOptions, 
    loading: loadingDocumentTypes,
    error: documentTypesError 
  } = useSupplierDocumentTypes(supplierId);

  // Debug logs
  console.log('🔍 [ProductHeader] Debug supplier document types:', {
    supplierId,
    supplierDocumentTypes,
    availableOptions,
    loadingDocumentTypes,
    documentTypesError
  });

  const [copied, setCopied] = useState({ name: false, price: false })
  // ✅ NUEVO: Estado para el modal de cotización
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false)
  // ✅ NUEVO: Estado para el modal de contacto
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // ✅ OPTIMIZADO: Verificación instantánea de propiedad del producto (1-5ms vs 1000ms+)
  const ownershipVerification = React.useMemo(() => {
    if (!product || !isUserDataReady) {
      return { 
        isOwnProduct: false, 
        checkingOwnership: isLoadingOwnership,
        reason: !product ? 'no_product' : 'loading_user_data'
      };
    }
    
    const verification = isProductOwnedByUser(product);
    return {
      isOwnProduct: verification.isOwned,
      checkingOwnership: false, // Siempre false porque la verificación es instantánea
      reason: verification.reason,
      confidence: verification.confidence,
      verificationTime: verification.verificationTime
    };
  }, [product, isUserDataReady, isLoadingOwnership, isProductOwnedByUser]);

  // Extraer valores para compatibilidad con código existente
  const { isOwnProduct, checkingOwnership } = ownershipVerification;

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

  // ✅ NUEVO: Funciones para manejar el modal de cotización
  const handleOpenQuotationModal = () => {
    setIsQuotationModalOpen(true)
  }

  const handleCloseQuotationModal = () => {
    setIsQuotationModalOpen(false)
  }

  // ✅ NUEVO: Funciones para manejar el modal de contacto
  const handleOpenContactModal = () => {
    setIsContactModalOpen(true)
  }

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false)
  }

  // ✅ NUEVO: Calcular precio unitario y cantidad por defecto para cotización
  const getQuotationDefaults = () => {
    const defaultQuantity = compraMinima || 1
    let defaultUnitPrice = precio || 0

    // Si hay tramos, usar el precio del primer tramo o el que corresponda a la cantidad mínima
    if (tiers && tiers.length > 0) {
      const applicableTier = tiers.find(tier => tier.min_quantity <= defaultQuantity) || tiers[0]
      defaultUnitPrice = applicableTier.price
    }

    return { defaultQuantity, defaultUnitPrice }
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
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            Precios por volumen
          </Typography>
          <Tooltip
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
          <Tooltip title="Copiar todos los precios" arrow placement="right">
            <IconButton
              size="small"
              onClick={handleCopyAllTiers}
              sx={{
                ml: 0.5,
                boxShadow: 'none',
                outline: 'none',
                bgcolor: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  boxShadow: 'none',
                  outline: 'none',
                },
                '&:active': {
                  boxShadow: 'none !important',
                  outline: 'none !important',
                  background: 'rgba(25, 118, 210, 0.04) !important',
                },
                '&:focus': {
                  boxShadow: 'none !important',
                  outline: 'none !important',
                  background: 'rgba(25, 118, 210, 0.04) !important',
                },
                '&:focus-visible': {
                  boxShadow: 'none !important',
                  outline: 'none !important',
                  background: 'rgba(25, 118, 210, 0.04) !important',
                },
              }}
            >
              {copied.allTiers ? (
                <CheckCircleOutlineIcon color="success" fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
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
                  // Para el último tramo: "Si compras X unidades o más"
                  tooltipMessage = `Si compras ${tier.min_quantity} unidades o más, el precio unitario es $${tier.price.toLocaleString('es-CL')}`;
                  rangeText = `${tier.min_quantity}+ uds`;
                } else {
                  // Para tramos intermedios: calcular el máximo basado en el siguiente tramo
                  const nextTier = tiers[idx + 1];
                  const maxQuantity = nextTier ? nextTier.min_quantity - 1 : tier.max_quantity;
                  
                  tooltipMessage = `Si compras entre ${tier.min_quantity} y ${maxQuantity} unidades, el precio unitario es de $${tier.price.toLocaleString('es-CL')}`;
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
                        <Typography color="text.primary" fontWeight={700}>
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
        
        {/* Botón de Cotización para tramos - Solo si está logueado */}
        {isLoggedIn && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', mt: 2, mb: 4, width: '100%', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Necesitas alguna condición especial?
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
                onClick={handleOpenContactModal}
              >
                Contáctanos
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Quieres saber los detalles de todo?
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
                onClick={handleOpenQuotationModal}
              >
                Cotiza aquí
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    )
  } else {
    // Precio único (sin tramos) - Con box similar a los tramos
    priceContent = (
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        width: '100%'
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            mb: 1,
            width: '100%'
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            Precio
          </Typography>
        </Box>
        
        {/* Tabla para precio unitario con mismo estilo que tramos */}
        <TableContainer
          component={Paper}
          sx={{ 
            maxWidth: 400, 
            mb: 2,
            width: 'fit-content'
          }}
        >
          <Table size="small">
            <TableBody>
              <TableRow hover>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Por unidad
                </TableCell>
                <TableCell align="center">
                  <PriceDisplay
                    price={product.precio}
                    originalPrice={product.precioOriginal}
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '1rem',
                      '& .MuiTypography-root': {
                        color: 'text.primary',
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  function resolveImageSrc(image) {
    const SUPABASE_PUBLIC_URL =
      'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/product-images/'
    
    if (!image) return mainImageThumbnail || '/placeholder-product.jpg'
    
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
          return mainImageThumbnail || '/placeholder-product.jpg'
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
    
    return mainImageThumbnail || '/placeholder-product.jpg'
  }
  return (
    // MUIV2 GRID - CONTENEDOR PRINCIPAL (MuiGrid-container)
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        width: '100%',
        gap: { xs: 2, md: 0 }
      }}>
        {/* En móvil: Mostrar nombre primero */}
        {isMobile && (
          <Box sx={{ 
            px: 2, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%',
            order: -1 // Forzar que aparezca primero
          }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                lineHeight: 1.2, // Reducir lineHeight
                mt: 4, // Reducir padding vertical
                fontSize: '1.25rem',
                wordBreak: 'break-word',
                hyphens: 'auto',
                textAlign: 'center',
                width: '100%',
              }}
            >
              {nombre}
            </Typography>
            {/* Botón de copiar nombre eliminado en mobile */}
          </Box>
        )}

        {/* Galería de imágenes */}
        <Box sx={{
          flex: { xs: 'none', md: 1 },
          width: '100%',
          minWidth: 0,
          display: 'flex',
          justifyContent: 'center',
          px: 0,
        }}>
          <ProductImageGallery
            images={imagenes.map(resolveImageSrc)}
            mainImage={mainImageThumbnail || resolveImageSrc(imagen)}
            selectedIndex={selectedImageIndex}
            onImageSelect={onImageSelect}
            productName={nombre}
            isMobile={isMobile}
          />
        </Box>

        {/* Información del Producto */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            px: { xs: 2, md: 1 },
            width: { xs: '100%', md: '80%' },
            maxWidth: { xs: 'none', md: 580 },
            mx: { xs: 0, md: 0 },
          }}
        >
          {/* Nombre del Producto - Solo en desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1, mb: 2, width: '100%' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  lineHeight: 1.2,
                  px: 0,
                  py: 1,
                  fontSize: { 
                    md: '1.5rem', 
                    lg: '1.7rem', 
                    xl: '2rem' 
                  },
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {nombre}
              </Typography>
            </Box>
          )}

          {/* Nueva Box: Stock, Compra mínima y Chips de facturación */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'column' }, // Siempre columna
              alignItems: 'flex-start',
              mb: 3,
              width: '100%', // Full width en móvil
              maxWidth: { xs: 'none', md: 500 }, // Sin maxWidth en móvil
              gap: { xs: 2, md: 1 }, // Más gap en móvil
            }}
          >
            {/* Fila 1: Chips de facturación dinámicos */}
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1.5, md: 1 }, // Más gap en móvil
              flexWrap: 'wrap', 
              width: '100%',
              justifyContent: { xs: 'flex-start', md: 'flex-start' } // Alineación consistente
            }}>
              {loadingDocumentTypes ? (
                <Typography variant="body2" color="text.secondary">
                  Cargando opciones...
                </Typography>
              ) : availableOptions && availableOptions.length > 0 ? (
                // Si solo hay "ninguno", no mostrar ningún chip
                availableOptions.length === 1 && availableOptions[0].value === 'ninguno' ? null : (
                  availableOptions
                    .filter(option => option.value !== 'ninguno') // Excluir "ninguno" de los chips
                    .map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        size={isMobile ? "medium" : "small"}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontSize: { xs: '0.8rem', md: '0.75rem' },
                          '&:hover': {
                            backgroundColor: 'primary.main',
                          },
                        }}
                      />
                    ))
                )
              ) : (
                // Fallback a opciones por defecto si hay error o no hay datos
                <>
                  <Chip
                    label="Factura"
                    size={isMobile ? "medium" : "small"}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    }}
                  />
                  <Chip
                    label="Boleta"
                    size={isMobile ? "medium" : "small"}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    }}
                  />
                  <Chip
                    label="Ninguno"
                    size={isMobile ? "medium" : "small"}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    }}
                  />
                </>
              )}
            </Box>
            {/* Fila 2: Stock */}
            <Box sx={{ width: '100%' }}>
              {stock === 0 ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Assignment sx={{ fontSize: 18, color: 'error.main' }} />
                  Producto agotado
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                  }}
                >
                  <b>Stock:</b> {stock} unidades
                </Typography>
              )}
            </Box>
            {/* Fila 3: Compra mínima */}
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                }}
              >
                <b>Compra mínima:</b> {compraMinima} unidades
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
            <Avatar
              src={product?.logo_url || product?.supplier_logo_url}
              sx={{
                width: 40,
                height: 40,
                fontSize: '1rem',
              }}
            >
              {proveedor?.charAt(0)}
            </Avatar>
            <Typography
              variant="body1"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                cursor: isLoggedIn ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: isLoggedIn ? 'underline' : 'none',
                },
              }}
              onClick={isLoggedIn ? () => {
                // Convertir el nombre del proveedor a formato slug (lowercase, espacios a guiones, caracteres especiales removidos)
                const proveedorSlug = proveedor
                  ?.toLowerCase()
                  ?.replace(/\s+/g, '-')
                  ?.replace(/[^\w\-]/g, '');
                navigate(`/catalog/${proveedorSlug}/${product.supplier_id || product.supplierId || 'userid'}`);
              } : undefined}
            >
              {proveedor}
            </Typography>
            {(product?.proveedorVerificado || product?.verified) && (
              <VerifiedIcon
                sx={{
                  fontSize: 20,
                  color: 'primary.main',
                }}
              />
            )}
          </Box>
          {/* Precios and/or tramos */}
          {priceContent}
          
          {/* Botón de Cotización - Solo para precio único y si está logueado */}
          {!(tiers && tiers.length > 0) && isLoggedIn && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', mb: 4, width: '100%', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Necesitas alguna condición especial?
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
                onClick={handleOpenContactModal}
              >
                Contáctanos
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ¿Quieres saber los detalles de todo?
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
                onClick={handleOpenQuotationModal}
              >
                Cotiza aquí
              </Button>
            </Box>
          </Box>
          )}
          
          {/* Botones de Compra */}
          {/* Solo mostrar acciones de compra si NO es supplier, ni supplier marketplace, ni mis productos, ni es producto propio */}
          {(() => {
            // Si estamos verificando la propiedad del producto, mostrar loading
            if (checkingOwnership) {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )
            }
            
            // Verificar todas las condiciones para ocultar las purchase actions
            const shouldHidePurchaseActions = 
              product.fromMyProducts || 
              product.isFromSupplierMarketplace || 
              product.isSupplier || 
              isOwnProduct
            
            // Solo mostrar PurchaseActions si no se cumple ninguna condición de ocultamiento
            if (!shouldHidePurchaseActions) {
              return (
                <PurchaseActions
                  stock={stock}
                  product={product}
                  tiers={finalTiers}
                  isLoggedIn={isLoggedIn}
                  userRegion={userRegion}
                  isLoadingUserProfile={isLoadingUserRegion}
                />
              )
            }
            
            // No mostrar nada si se cumple alguna condición de ocultamiento
            return null
          })()}
        </Box>
      </Box>

      {/* Modal de Cotización */}
      <QuotationModal
        open={isQuotationModalOpen}
        onClose={handleCloseQuotationModal}
        product={product}
        quantity={getQuotationDefaults().defaultQuantity}
        unitPrice={getQuotationDefaults().defaultUnitPrice}
        tiers={finalTiers}
      />
      {/* Modal de Contacto */}
      <ContactModal
        open={isContactModalOpen}
        onClose={handleCloseContactModal}
      />
    </Box>
  )
})

ProductHeader.displayName = 'ProductHeader'

export default ProductHeader
