/**
 * ProductHeader/index.jsx - Container principal del header de producto
 *
 * Este componente orquesta todos los subcomponentes del header:
 * - ProductName
 * - ProductSupplier
 * - ProductMetadata
 * - ProductPricing
 * - ProductImageGallery
 * - PurchaseActions
 * - QuotationSection (modales)
 *
 * REFACTORIZADO: Antes era un archivo de ~800 líneas, ahora ~200 líneas
 */
import React, { useMemo, useCallback, useRef } from 'react';
import { Box } from '@mui/material';

// Subcomponentes
import ProductName from './ProductName';
import ProductSupplier from './ProductSupplier';
import ProductMetadata from './ProductMetadata';
import ProductPricing, { QuotationButtons } from './ProductPricing';
import QuotationSection from './QuotationSection';

// Componentes existentes
import ProductImageGallery from '../ProductImageGallery';
import PurchaseActions from '../PurchaseActions';
import { PurchaseActionsSkeleton } from '../skeletons/PurchaseActionsSkeleton';

// Hooks
import { useProductHeaderState } from '../../hooks/useProductHeaderState';
import { useResponsiveThumbnail } from '../../../../../hooks/useResponsiveThumbnail';
import { useOptimizedUserShippingRegion } from '../../../../../hooks/useOptimizedUserShippingRegion';
import { useOptimizedProductOwnership } from '../../hooks/useOptimizedProductOwnership';
import { useSupplierDocumentTypes } from '../../../../../shared/utils/supplierDocumentTypes';

// Utils
import { getProductImageUrl } from '../../../../../utils/getProductImageUrl';

// Estilos
import {
  HEADER_STYLES,
  INFO_STYLES,
  GALLERY_STYLES,
} from '../../styles/productPageStyles';

const ProductHeader = React.memo(
  ({
    product,
    selectedImageIndex,
    onImageSelect,
    isLoggedIn,
    fromMyProducts = false,
    isMobile = false,
  }) => {
    // Destructure product data
    const {
      nombre,
      proveedor,
      imagen,
      imagenes = [],
      images = [],
      precio,
      stock,
      compraMinima,
    } = product;

    // Tiers data from marketplace cache
    const loadingTiers = product.tiersStatus === 'loading';
    const errorTiers = product.tiersStatus === 'error';
    const tiers = product.priceTiers || [];

    // ========================================================================
    // HOOKS
    // ========================================================================

    // Estado centralizado del header
    const {
      isQuotationModalOpen,
      isContactModalOpen,
      copied,
      handleCopyAllTiers,
      openQuotationModal,
      closeQuotationModal,
      openContactModal,
      closeContactModal,
      getQuotationDefaults,
    } = useProductHeaderState();

    // Thumbnail responsivo
    const { thumbnailUrl: mainImageThumbnail } =
      useResponsiveThumbnail(product);

    // Región de envío del usuario
    const { userRegion, isLoadingUserRegion } =
      useOptimizedUserShippingRegion();

    // Verificación de propiedad del producto
    const { isProductOwnedByUser, isUserDataReady, isLoadingOwnership } =
      useOptimizedProductOwnership();

    // Tipos de documentos del proveedor
    const supplierId = product?.supplier_id || product?.supplierId;
    const { availableOptions, loading: loadingDocumentTypes } =
      useSupplierDocumentTypes(supplierId);

    // ========================================================================
    // OWNERSHIP VERIFICATION
    // ========================================================================

    const ownershipVerification = useMemo(() => {
      if (!product || !isUserDataReady) {
        return {
          isOwnProduct: false,
          checkingOwnership: isLoadingOwnership,
        };
      }

      const verification = isProductOwnedByUser(product);
      return {
        isOwnProduct: verification.isOwned,
        checkingOwnership: false,
      };
    }, [product, isUserDataReady, isLoadingOwnership, isProductOwnedByUser]);

    const { isOwnProduct, checkingOwnership } = ownershipVerification;

    // ========================================================================
    // IMAGE RESOLUTION
    // ========================================================================

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

    // Ordered images array
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

    // Main image record
    const mainImageRecord = useMemo(() => {
      return (
        orderedImages.find(img => img && img.image_order === 0) ||
        orderedImages[0] ||
        null
      );
    }, [orderedImages]);

    // Initial image sync
    const _initialImageSyncRef = useRef(false);

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

    // ========================================================================
    // QUOTATION DEFAULTS
    // ========================================================================

    const quotationDefaults = useMemo(
      () => getQuotationDefaults(product, tiers),
      [product, tiers, getQuotationDefaults]
    );

    // ========================================================================
    // PURCHASE ACTIONS VISIBILITY
    // ========================================================================

    const shouldHidePurchaseActions =
      product.fromMyProducts ||
      product.isFromSupplierMarketplace ||
      product.isSupplier ||
      isOwnProduct;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
      <Box sx={HEADER_STYLES.container}>
        <Box sx={HEADER_STYLES.flexContainer}>
          {/* En móvil: Mostrar nombre primero */}
          {isMobile && <ProductName nombre={nombre} isMobile />}

          {/* Galería de imágenes */}
          <Box sx={GALLERY_STYLES.container}>
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
          <Box sx={INFO_STYLES.container}>
            {/* Nombre del Producto - Solo en desktop */}
            {!isMobile && <ProductName nombre={nombre} />}

            {/* Metadata: Stock, Compra mínima, Chips - Solo en desktop */}
            {!isMobile && (
              <ProductMetadata
                stock={stock}
                compraMinima={compraMinima}
                availableOptions={availableOptions}
                loadingDocumentTypes={loadingDocumentTypes}
                isMobile={isMobile}
                supplierMinimumAmount={
                  product.minimum_purchase_amount ||
                  product.supplier_minimum_purchase_amount ||
                  0
                }
              />
            )}

            {/* Proveedor - Solo en desktop */}
            {!isMobile && (
              <ProductSupplier
                proveedor={proveedor}
                logoUrl={product?.logo_url || product?.supplier_logo_url}
                isVerified={product?.proveedorVerificado || product?.verified}
                isLoggedIn={isLoggedIn}
                supplierId={product.supplier_id || product.supplierId}
              />
            )}

            {/* Precios y/o tramos */}
            <ProductPricing
              product={product}
              tiers={tiers}
              loadingTiers={loadingTiers}
              errorTiers={errorTiers}
              isLoggedIn={isLoggedIn}
              isOwnProduct={isOwnProduct}
              copied={copied}
              onCopyAllTiers={() => handleCopyAllTiers(tiers)}
              onOpenContactModal={openContactModal}
              onOpenQuotationModal={openQuotationModal}
            />

            {/* Botones de Compra */}
            {(() => {
              if (checkingOwnership) {
                return <PurchaseActionsSkeleton withOffer={!isOwnProduct} />;
              }

              if (!shouldHidePurchaseActions) {
                return (
                  <PurchaseActions
                    stock={stock}
                    product={product}
                    tiers={tiers}
                    isLoggedIn={isLoggedIn}
                    userRegion={userRegion}
                    isLoadingUserProfile={isLoadingUserRegion}
                  />
                );
              }

              return null;
            })()}

            {/* Botones de Cotización - Solo en mobile (después de botones de compra) */}
            {isMobile && (
              <QuotationButtons
                isLoggedIn={isLoggedIn}
                isOwnProduct={isOwnProduct}
                onOpenContactModal={openContactModal}
                onOpenQuotationModal={openQuotationModal}
                sx={{ mt: 2, mb: 2 }}
              />
            )}

            {/* Metadata: Stock, Compra mínima, Chips - Solo en mobile (después de botones) */}
            {isMobile && (
              <ProductMetadata
                stock={stock}
                compraMinima={compraMinima}
                availableOptions={availableOptions}
                loadingDocumentTypes={loadingDocumentTypes}
                isMobile={isMobile}
                supplierMinimumAmount={
                  product.minimum_purchase_amount ||
                  product.supplier_minimum_purchase_amount ||
                  0
                }
              />
            )}

            {/* Proveedor - Solo en mobile (después de metadata) */}
            {isMobile && (
              <ProductSupplier
                proveedor={proveedor}
                logoUrl={product?.logo_url || product?.supplier_logo_url}
                isVerified={product?.proveedorVerificado || product?.verified}
                isLoggedIn={isLoggedIn}
                supplierId={product.supplier_id || product.supplierId}
              />
            )}
          </Box>
        </Box>

        {/* Modales de Cotización y Contacto */}
        <QuotationSection
          product={product}
          tiers={tiers}
          isQuotationModalOpen={isQuotationModalOpen}
          isContactModalOpen={isContactModalOpen}
          onCloseQuotationModal={closeQuotationModal}
          onCloseContactModal={closeContactModal}
          quotationDefaults={quotationDefaults}
        />
      </Box>
    );
  }
);

ProductHeader.displayName = 'ProductHeader';

export default ProductHeader;
