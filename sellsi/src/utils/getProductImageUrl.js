// utils/getProductImageUrl.js
import { supabase } from '../services/supabase'

/**
 * Obtiene la URL pública de una imagen de producto desde Supabase Storage.
 * Soporta: URL absoluta, path relativo, objeto imagen, blob, null.
 * @param {string|object} image - Path, URL o objeto de la imagen
 * @param {object} productData - Datos del producto (opcional) con supplier_id y productid
 * @returns {string} URL pública lista para usar en <img />
 */
export function getProductImageUrl(image, productData = null) {
  if (!image) return '/placeholder-product.jpg'
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
