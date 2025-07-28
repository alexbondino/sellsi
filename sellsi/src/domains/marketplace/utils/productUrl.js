/**
 * ============================================================================
 * DEPRECATED - RE-EXPORT FROM SHARED
 * ============================================================================
 * 
 * Este archivo re-exporta desde shared para mantener compatibilidad.
 * ⚠️ DEPRECADO: Usa import desde shared/utils/product/productUrl directamente
 */

// Re-export all functions from shared location
export * from '../../../shared/utils/product/productUrl'

// Legacy default export for compatibility
import productUrlUtils from '../../../shared/utils/product/productUrl'
export default productUrlUtils

/**
 * Generates a complete product URL slug including ID
 * @param {Object} product - The product object
 * @returns {string} - Complete slug for URL (name-id)
 */
export const generateProductSlug = (product) => {
  if (!product) {
    return 'producto-sin-datos'
  }

  // Intentar varios campos posibles para el nombre
  const productName =
    product.nombre || product.name || product.productnm || 'Producto sin nombre'
  const productId = product.id || product.productid || 'sin-id'

  const nameSlug = createProductSlug(productName)
  return `${nameSlug}-${productId}`
}

/**
 * Generates a complete URL for product Technical Specs
 * @param {Object} product - The product object
 * @returns {string} - Complete URL path
 */
export const generateProductUrl = (product) => {
  const slug = generateProductSlug(product)
  return `/technicalspecs/${slug}`
}

/**
 * Extracts product ID from a product slug
 * @param {string} slug - The product slug (name-id)
 * @returns {string|null} - The product ID (UUID) or null if invalid
 */
export const extractProductIdFromSlug = (slug) => {
  if (!slug) return null;
  // UUID v4 standard length is 36 characters
  const uuidLength = 36;
  if (slug.length < uuidLength) return null;
  const candidate = slug.slice(0, uuidLength);
  // Simple UUID v4 validation
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(candidate)) {
    return candidate;
  }
  return null;
}

/**
 * Validates if a slug matches a product
 * @param {string} slug - The URL slug
 * @param {Object} product - The product object
 * @returns {boolean} - True if slug matches product
 */
export const validateProductSlug = (slug, product) => {
  if (!slug || !product) return false

  const expectedSlug = generateProductSlug(product)
  return slug === expectedSlug
}
