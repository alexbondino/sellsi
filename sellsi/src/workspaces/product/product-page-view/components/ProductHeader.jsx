import React, { useState, useMemo, useCallback, memo } from 'react';
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
} from '@mui/material';
import {
  LocalShipping,
  Security,
  Assignment,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getProductImageUrl } from '../../../../utils/getProductImageUrl';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useResponsiveThumbnail } from '../../../../hooks/useResponsiveThumbnail'; // Nuevo hook
import { useOptimizedUserShippingRegion } from '../../../../hooks/useOptimizedUserShippingRegion'; // Hook optimizado para región
import { useOptimizedProductOwnership } from '../hooks/useOptimizedProductOwnership'; // Hook optimizado para verificación de propiedad

import ProductImageGallery from './ProductImageGallery';
import PurchaseActions from './PurchaseActions';
import PriceDisplay from '../../../../shared/components/display/price/PriceDisplay';
// Skeleton system imports
import {
  PriceTiersSkeleton,
  SinglePriceSkeleton,
} from './skeletons/PriceSkeletons';
import { PurchaseActionsSkeleton } from './skeletons/PurchaseActionsSkeleton';
import { DocumentTypesChipsSkeleton } from './skeletons/DocumentTypesChipsSkeleton';
import { useSmartSkeleton } from '../hooks/useSmartSkeleton';
import { StockIndicator } from '../../../../workspaces/marketplace';
import QuotationModal from './QuotationModal';
import ContactModal from '../../../../shared/components/modals/ContactModal';
import ProductPricing from './ProductHeader/ProductPricing';
import { useSupplierDocumentTypes } from '../../../../shared/utils/supplierDocumentTypes';
import { formatNumber } from '../../../../shared/utils/formatters/numberFormatters';

const ProductHeader = React.memo(
  ({
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
      images = [], // prefer server-ordered images when available
      precio,
      stock,
      compraMinima,
      descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
    } = product;
    // Centralized deferred tiers from marketplace cache (no legacy per-product hook)
    const loadingTiers = product.tiersStatus === 'loading';
    const errorTiers = product.tiersStatus === 'error';
    const tiers = product.priceTiers || [];
    const finalTiers = tiers;

    // ✅ NUEVO: Hook para obtener thumbnail responsivo de la imagen principal
    const { thumbnailUrl: mainImageThumbnail, isLoading: thumbnailLoading } =
      useResponsiveThumbnail(product);

    // ✅ Hook para región de envío con Supabase Realtime
    const { userRegion, isLoadingUserRegion } =
      useOptimizedUserShippingRegion();

    // ✅ NUEVO: Hook optimizado para verificación de propiedad de productos - INSTANTÁNEO
    const { isProductOwnedByUser, isUserDataReady, isLoadingOwnership } =
      useOptimizedProductOwnership();

    // Hook para obtener tipos de documentos permitidos por el proveedor
    const supplierId = product?.supplier_id || product?.supplierId;
    const {
      documentTypes: supplierDocumentTypes,
      availableOptions,
      loading: loadingDocumentTypes,
      error: documentTypesError,
    } = useSupplierDocumentTypes(supplierId);

    // Debug logs removed

    const [copied, setCopied] = useState({ name: false, price: false, allTiers: false });
    // ✅ NUEVO: Estado para el modal de cotización
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
    // ✅ NUEVO: Estado para el modal de contacto
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // ✅ OPTIMIZADO: Verificación instantánea de propiedad del producto (1-5ms vs 1000ms+)
    const ownershipVerification = React.useMemo(() => {
      if (!product || !isUserDataReady) {
        return {
          isOwnProduct: false,
          checkingOwnership: isLoadingOwnership,
          reason: !product ? 'no_product' : 'loading_user_data',
        };
      }

      const verification = isProductOwnedByUser(product);
      return {
        isOwnProduct: verification.isOwned,
        checkingOwnership: false, // Siempre false porque la verificación es instantánea
        reason: verification.reason,
        confidence: verification.confidence,
        verificationTime: verification.verificationTime,
      };
    }, [product, isUserDataReady, isLoadingOwnership, isProductOwnedByUser]);

    // Extraer valores para compatibilidad con código existente
    const { isOwnProduct, checkingOwnership } = ownershipVerification;

    // Función para copiar texto al portapapeles y mostrar feedback
    const handleCopy = (type, value) => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(prev => ({ ...prev, [type]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 1200);
      });
    };

    // Función para generar el formato CSV de todos los tramos
    const generateTiersCSV = tiers => {
      const header = 'Cantidad mínima,Precio unitario';
      const rows = tiers.map(
        tier => `${tier.min_quantity},$${tier.price.toLocaleString('es-CL')}`
      );
      return [header, ...rows].join('\n');
    };

    // Función para copiar todos los tramos en formato CSV
    const handleCopyAllTiers = () => {
      if (tiers && tiers.length > 0) {
        const csvContent = generateTiersCSV(tiers);
        handleCopy('allTiers', csvContent);
      }
    };

    // ✅ NUEVO: Funciones para manejar el modal de cotización
    const handleOpenQuotationModal = () => {
      setIsQuotationModalOpen(true);
    };

    const handleCloseQuotationModal = () => {
      setIsQuotationModalOpen(false);
    };

    // ✅ NUEVO: Funciones para manejar el modal de contacto
    const handleOpenContactModal = () => {
      setIsContactModalOpen(true);
    };

    const handleCloseContactModal = () => {
      setIsContactModalOpen(false);
    };

    // ✅ NUEVO: Calcular precio unitario y cantidad por defecto para cotización
    const getQuotationDefaults = () => {
      const defaultQuantity = compraMinima || 1;
      let defaultUnitPrice = precio || 0;

      // Si hay tramos, usar el precio del primer tramo o el que corresponda a la cantidad mínima
      if (tiers && tiers.length > 0) {
        const applicableTier =
          tiers.find(tier => tier.min_quantity <= defaultQuantity) || tiers[0];
        defaultUnitPrice = applicableTier.price;
      }

      return { defaultQuantity, defaultUnitPrice };
    };

    // Reemplazado por componente reutilizable `ProductPricing`
    const showPriceSkeleton = useSmartSkeleton(loadingTiers);

    const priceContent = (
      <ProductPricing
        product={product}
        tiers={finalTiers}
        loadingTiers={loadingTiers}
        errorTiers={errorTiers}
        isLoggedIn={isLoggedIn}
        isOwnProduct={isOwnProduct}
        copied={copied}
        onCopyAllTiers={handleCopyAllTiers}
        onOpenContactModal={handleOpenContactModal}
        onOpenQuotationModal={handleOpenQuotationModal}
      />
    );

    // Memoized image resolver so effect deps remain stable.
    const resolveImageSrc = useCallback(
      image => {
        const SUPABASE_PUBLIC_URL =
          'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/product-images/';
        if (!image) return mainImageThumbnail || '/placeholder-product.jpg';
        if (typeof image === 'string') {
          if (image.startsWith(SUPABASE_PUBLIC_URL)) return image;
          if (image.startsWith('/')) return image;
          if (/^https?:\/\//.test(image)) return image;
          return getProductImageUrl(image);
        }
        if (typeof image === 'object' && image !== null) {
          if (
            image.url &&
            typeof image.url === 'string' &&
            image.url.startsWith(SUPABASE_PUBLIC_URL)
          )
            return image.url;
          if (image.image_url) return getProductImageUrl(image.image_url);
        }
        return mainImageThumbnail || '/placeholder-product.jpg';
      },
      [mainImageThumbnail]
    );

    // Ensure we always pass a server-ordered array to the gallery (memoized for stable reference).
    const orderedImages = useMemo(() => {
      if (Array.isArray(images) && images.length > 0) {
        return images
          .slice()
          .sort(
            (a, b) => ((a && a.image_order) || 0) - ((b && b.image_order) || 0)
          );
      }
      return Array.isArray(imagenes) ? imagenes.slice() : [];
    }, [images, imagenes]);

    // Main image record (first with image_order 0 else first) memoized.
    const mainImageRecord = useMemo(() => {
      return (
        orderedImages.find(img => img && img.image_order === 0) ||
        orderedImages[0] ||
        null
      );
    }, [orderedImages]);

    // Diagnostic log (only once per product to avoid noisy logs on re-renders)
    const _loggedProductsRef = React.useRef(new Set());
    // Track whether we've already synced the initial main image selection for this product
    const _initialImageSyncRef = React.useRef(false);
    try {
      const pid = product?.productid;
      if (pid && !_loggedProductsRef.current.has(pid)) {
        const diagnostic = (orderedImages || []).map((img, idx) => {
          const url =
            typeof img === 'string' ? img : img?.image_url || img?.url || '';
          const name = url
            ? url.split('/').pop()
            : (typeof img === 'object' && img?.name) || '';
          return { index: idx, name, url, image_order: img?.image_order };
        });
        // diagnostic removed
        _loggedProductsRef.current.add(pid);
      }
    } catch (e) {
      // ignore logging errors
    }

    // If the parent passed selectedIndex but it doesn't point to the server main image,
    // prefer the server main (image_order === 0). This keeps gallery selection in sync
    // when DB order changes or arrays are reshaped by other layers.
    // Effect: ensure parent selection points to server-defined main image.
    // Dependencies intentionally include orderedImages (content & order), selectedImageIndex, callback & resolver.
    // Sync parent selection to the server-defined main image ONCE when the product's
    // orderedImages are available. We intentionally avoid re-running this when
    // `selectedImageIndex` changes so we don't override user interactions (clicks).
    // This prevents the 'flash' where a user click is immediately reverted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
      if (!orderedImages.length || !onImageSelect) return;
      if (_initialImageSyncRef.current) return;
      try {
        const resolved = orderedImages.map(resolveImageSrc);
        const mainUrl = resolveImageSrc(
          mainImageRecord || imagen || orderedImages[0]
        );
        const mainIdx = resolved.findIndex(u => u === mainUrl);
        if (mainIdx >= 0 && selectedImageIndex !== mainIdx) {
          onImageSelect(mainIdx);
        }
      } catch (_) {}
      _initialImageSyncRef.current = true;
    }, [
      orderedImages,
      onImageSelect,
      resolveImageSrc,
      mainImageRecord,
      imagen,
    ]);

    return (
      // MUIV2 GRID - CONTENEDOR PRINCIPAL (MuiGrid-container)
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            width: '100%',
            gap: { xs: 2, md: 0 },
          }}
        >
          {/* En móvil: Mostrar nombre primero */}
          {isMobile && (
            <Box
              sx={{
                px: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                order: -1, // Forzar que aparezca primero
              }}
            >
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
          <Box
            sx={{
              flex: { xs: 'none', md: 1 },
              width: '100%',
              minWidth: 0,
              display: 'flex',
              justifyContent: 'center',
              px: 0,
            }}
          >
            <ProductImageGallery
              images={orderedImages.map(resolveImageSrc)}
              imagesRaw={orderedImages}
              mainImage={
                mainImageThumbnail ||
                resolveImageSrc(
                  imagen ||
                    (mainImageRecord &&
                      (mainImageRecord.image_url || mainImageRecord)) ||
                    imagenes[0]
                )
              }
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
              px: { xs: 0, md: 1 },
              width: { xs: '100%', md: '80%' },
              maxWidth: { xs: 'none', md: 580 },
              mx: { xs: 0, md: 0 },
            }}
          >
            {/* Nombre del Producto - Solo en desktop */}
            {!isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 1,
                  mb: 2,
                  width: '100%',
                }}
              >
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
                      xl: '2rem',
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
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1.5, md: 1 }, // Más gap en móvil
                  flexWrap: 'wrap',
                  width: '100%',
                  justifyContent: { xs: 'flex-start', md: 'flex-start' }, // Alineación consistente
                }}
              >
                {(() => {
                  const showDocSkeleton =
                    useSmartSkeleton(loadingDocumentTypes);
                  if (showDocSkeleton)
                    return <DocumentTypesChipsSkeleton isMobile={isMobile} />;
                  if (availableOptions && availableOptions.length > 0) {
                    // Si solo hay "ninguno", mostrar texto en negro con fuente de Stock
                    if (
                      availableOptions.length === 1 &&
                      availableOptions[0].value === 'ninguno'
                    ) {
                      return (
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.primary', fontWeight: 600 }}
                        >
                          Proveedor no ofrece documento tributario
                        </Typography>
                      );
                    }
                    return availableOptions
                      .filter(option => option.value !== 'ninguno')
                      .map(option => (
                        <Chip
                          key={option.value}
                          label={option.label}
                          size={isMobile ? 'medium' : 'small'}
                          sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            fontSize: { xs: '0.8rem', md: '0.75rem' },
                            '&:hover': { backgroundColor: 'primary.main' },
                          }}
                        />
                      ));
                  }
                  // Fallback a opciones por defecto si hay error o no hay datos
                  return (
                    <>
                      <Chip
                        label="Factura"
                        size={isMobile ? 'medium' : 'small'}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontSize: { xs: '0.8rem', md: '0.75rem' },
                          '&:hover': { backgroundColor: 'primary.main' },
                        }}
                      />
                      <Chip
                        label="Boleta"
                        size={isMobile ? 'medium' : 'small'}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontSize: { xs: '0.8rem', md: '0.75rem' },
                          '&:hover': { backgroundColor: 'primary.main' },
                        }}
                      />
                    </>
                  );
                })()}
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
                    <b>Stock:</b> {formatNumber(stock)} unidades
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
                  <b>Compra mínima:</b> {formatNumber(compraMinima)} unidades
                </Typography>
              </Box>
              
              {/* Fila 4: Badge de Despacho Gratuito (condicional) */}
              {(product.free_shipping_enabled || product.freeShippingEnabled) && 
               (product.free_shipping_min_quantity || product.freeShippingMinQuantity) && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Chip
                    icon={<LocalShipping sx={{ fontSize: 16 }} />}
                    label={`Despacho gratis desde ${formatNumber(product.free_shipping_min_quantity || product.freeShippingMinQuantity)} uds`}
                    size={isMobile ? 'medium' : 'small'}
                    sx={{
                      backgroundColor: 'success.main',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                      '&:hover': { backgroundColor: 'success.main' },
                    }}
                  />
                </Box>
              )}
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}
            >
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
                onClick={
                  isLoggedIn
                    ? () => {
                        // Convertir el nombre del proveedor a formato slug (lowercase, espacios a guiones, caracteres especiales removidos)
                        const proveedorSlug = proveedor
                          ?.toLowerCase()
                          ?.replace(/\s+/g, '-')
                          ?.replace(/[^\w\-]/g, '');
                        navigate(
                          `/catalog/${proveedorSlug}/${
                            product.supplier_id ||
                            product.supplierId ||
                            'userid'
                          }`
                        );
                      }
                    : undefined
                }
              >
                {proveedor}
              </Typography>
              {(product?.proveedorVerificado || product?.verified) && (
                <Tooltip
                  title="Este Proveedor ha sido verificado por Sellsi."
                  placement="right"
                  arrow
                >
                  <VerifiedIcon
                    sx={{
                      fontSize: 20,
                      color: 'primary.main',
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            {/* Precios and/or tramos */}
            {priceContent}

            {/* Buttons handled inside `ProductPricing` component */}

            {/* Botones de Compra */}
            {/* Solo mostrar acciones de compra si NO es supplier, ni supplier marketplace, ni mis productos, ni es producto propio */}
            {(() => {
              // Si estamos verificando la propiedad del producto, mostrar loading
              if (checkingOwnership) {
                return <PurchaseActionsSkeleton withOffer={!isOwnProduct} />;
              }

              // Verificar todas las condiciones para ocultar las purchase actions
              const shouldHidePurchaseActions =
                product.fromMyProducts ||
                product.isFromSupplierMarketplace ||
                product.isSupplier ||
                isOwnProduct;

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
                );
              }

              // No mostrar nada si se cumple alguna condición de ocultamiento
              return null;
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
    );
  }
);

ProductHeader.displayName = 'ProductHeader';

export default ProductHeader;
