/**
 * ============================================================================
 * PRODUCT URL UTILITIES - FUNCIONES COMPARTIDAS PARA URLS DE PRODUCTOS
 * ============================================================================
 * 
 * Utilidades migradas desde domains/marketplace para uso compartido.
 * Evita cross-imports de shared components hacia domains específicos.
 */

/**
 * Converts a product name to a URL-friendly slug
 * @param {string} productName - The product name
 * @returns {string} - URL-friendly slug
 */
export const createProductSlug = (productName) => {
  if (!productName || typeof productName !== 'string') {
    return 'producto-sin-nombre'
  }

  return productName
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

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

export default {
  createProductSlug,
  generateProductSlug,
  generateProductUrl,
  extractProductIdFromSlug,
  validateProductSlug
}
