// Funciones puras para construir estructuras de producto (modo oferta vs regular)
export function buildOfferProductData(offer, enrichedProduct) {
  if (!offer) return null;
  return {
    id: offer.product_id || enrichedProduct?.id,
    name: offer.product_name || enrichedProduct?.nombre || enrichedProduct?.name || 'Producto sin nombre',
    basePrice: offer.offered_price,
    originalPrice: enrichedProduct?.precio || enrichedProduct?.price,
    priceTiers: [],
    thumbnail: offer.product_image || enrichedProduct?.thumbnail || enrichedProduct?.image_url,
    thumbnailUrl: offer.product_image || enrichedProduct?.thumbnailUrl || enrichedProduct?.thumbnail_url,
    thumbnail_url: offer.product_image || enrichedProduct?.thumbnail_url,
    imagen: offer.product_image || enrichedProduct?.imagen || enrichedProduct?.image_url,
    image_url: offer.product_image || enrichedProduct?.image_url,
    thumbnails: enrichedProduct?.thumbnails,
    supplier: offer.supplier_name || enrichedProduct?.proveedor || enrichedProduct?.supplier || 'Proveedor no encontrado',
    minimumPurchase: offer.offered_quantity,
    maxPurchase: offer.offered_quantity,
    stock: offer.offered_quantity,
    shippingRegions: enrichedProduct?.shippingRegions || enrichedProduct?.delivery_regions || [],
    offer_id: offer.id,
    offer_deadline: offer.purchase_deadline,
    offer_status: offer.status,
    isOfferProduct: true,
    // Campos de envío gratis
    free_shipping_enabled: enrichedProduct?.free_shipping_enabled || enrichedProduct?.freeShippingEnabled || false,
    free_shipping_min_quantity: enrichedProduct?.free_shipping_min_quantity || enrichedProduct?.freeShippingMinQuantity || null,
  };
}

export function buildRegularProductData(enrichedProduct) {
  return {
    id: enrichedProduct?.id,
    name: enrichedProduct?.nombre || enrichedProduct?.name || 'Producto sin nombre',
    basePrice: enrichedProduct?.precio || enrichedProduct?.price || 0,
    originalPrice: enrichedProduct?.precioOriginal || enrichedProduct?.originalPrice,
    priceTiers: enrichedProduct?.priceTiers || enrichedProduct?.price_tiers || [],
    thumbnail: enrichedProduct?.thumbnail || enrichedProduct?.image_url,
    thumbnailUrl: enrichedProduct?.thumbnailUrl || enrichedProduct?.thumbnail_url,
    thumbnail_url: enrichedProduct?.thumbnail_url,
    imagen: enrichedProduct?.imagen || enrichedProduct?.image_url,
    image_url: enrichedProduct?.image_url,
    thumbnails: enrichedProduct?.thumbnails,
    supplier: enrichedProduct?.proveedor || enrichedProduct?.supplier || 'Proveedor no encontrado',
    minimumPurchase: enrichedProduct?.minimum_purchase || enrichedProduct?.compraMinima || 1,
    maxPurchase: enrichedProduct?.max_purchase || enrichedProduct?.maxPurchase || 999,
    stock: enrichedProduct?.stock || enrichedProduct?.maxStock || enrichedProduct?.productqty || 50,
    shippingRegions: enrichedProduct?.shippingRegions || enrichedProduct?.delivery_regions || [],
    isOfferProduct: false,
    // Campos de envío gratis
    free_shipping_enabled: enrichedProduct?.free_shipping_enabled || enrichedProduct?.freeShippingEnabled || false,
    free_shipping_min_quantity: enrichedProduct?.free_shipping_min_quantity || enrichedProduct?.freeShippingMinQuantity || null,
  };
}
