// utils/getProductImageUrl.js
import { supabase } from '../services/supabase'

/**
 * Obtiene la URL pública de una imagen de producto desde Supabase Storage.
 * Soporta: URL absoluta, path relativo, objeto imagen, blob, null.
 * @param {string|object} image - Path, URL o objeto de la imagen
 * @param {object} productData - Datos del producto (opcional) con supplier_id y productid
 * @param {boolean} useThumbnail - Si usar thumbnail cuando esté disponible
 * @returns {string} URL pública lista para usar en <img />
 */
export function getProductImageUrl(image, productData = null, useThumbnail = false) {
  if (!image) return '/placeholder-product.jpg'
  
  // ✅ NUEVO: Si hay thumbnail disponible y se solicita, usarlo
  if (useThumbnail && productData?.thumbnail_url) {
    return productData.thumbnail_url
  }

  // Si es objeto con url
  if (typeof image === 'object' && image !== null) {
    if (image.url && typeof image.url === 'string') {
      if (image.url.startsWith('blob:')) return '/placeholder-product.jpg'
      if (/^https?:\/\//.test(image.url)) return image.url
      // Si es path relativo
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(image.url)
      return data?.publicUrl || '/placeholder-product.jpg'
    }
    // Si es objeto con file y name (caso local, no subir)
    if (image.file && image.name) return '/placeholder-product.jpg'
    // Si es objeto con path relativo
    if (image.path && typeof image.path === 'string') {
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(image.path)
      return data?.publicUrl || '/placeholder-product.jpg'
    }
    return '/placeholder-product.jpg'
  }

  // Si es string
  if (typeof image === 'string') {
    if (image.startsWith('blob:')) return '/placeholder-product.jpg'
    if (/^https?:\/\//.test(image)) return image

    // Si es path relativo y tenemos datos del producto, construir la URL correcta
    if (productData && productData.supplier_id && productData.productid) {
      // Extraer solo el filename del path
      const filename = image.split('/').pop()
      const correctPath = `${productData.supplier_id}/${productData.productid}/${filename}`
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(correctPath)
      return data?.publicUrl || '/placeholder-product.jpg'
    }

    // Si es path relativo sin datos del producto, usar tal como viene
    const { data } = supabase.storage.from('product-images').getPublicUrl(image)
    return data?.publicUrl || '/placeholder-product.jpg'
  }
  return '/placeholder-product.jpg'
}

/**
 * ✅ NUEVO: Obtiene la URL del thumbnail de un producto si está disponible
 * @param {object} productData - Datos del producto con thumbnail_url
 * @param {string} fallbackImage - Imagen original como fallback
 * @returns {string} URL del thumbnail o imagen original
 */
export function getProductThumbnailUrl(productData, fallbackImage = null) {
  // Prioridad: thumbnail_url > imagen original > placeholder
  if (productData?.thumbnail_url) {
    return productData.thumbnail_url
  }
  
  if (fallbackImage) {
    return getProductImageUrl(fallbackImage, productData, false)
  }
  
  return '/placeholder-product.jpg'
}

/**
 * ✅ NUEVO: Obtiene la mejor imagen disponible (thumbnail o original)
 * @param {object} productData - Datos del producto completo
 * @param {boolean} preferThumbnail - Si preferir thumbnail cuando esté disponible
 * @returns {string} URL de la mejor imagen disponible
 */
export function getBestProductImageUrl(productData, preferThumbnail = true) {
  if (!productData) return '/placeholder-product.jpg'
  
  // Si prefiere thumbnail y está disponible
  if (preferThumbnail && productData.thumbnail_url) {
    return productData.thumbnail_url
  }
  
  // Usar imagen original
  const originalImage = productData.imagen || productData.image
  return getProductImageUrl(originalImage, productData, false)
}
