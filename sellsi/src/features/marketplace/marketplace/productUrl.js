/**
 * Utility functions for product URL generation and parsing
 */

/**
 * Converts a product name to a URL-friendly slug
 * @param {string} productName - The product name
 * @returns {string} - URL-friendly slug
 */
export const createProductSlug = (productName) => {
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
  const nameSlug = createProductSlug(product.nombre)
  return `${nameSlug}-${product.id}`
}

/**
 * Generates a complete URL for product ficha tecnica
 * @param {Object} product - The product object
 * @returns {string} - Complete URL path
 */
export const generateProductUrl = (product) => {
  const slug = generateProductSlug(product)
  return `/fichatecnica/${slug}`
}

/**
 * Extracts product ID from a product slug
 * @param {string} slug - The product slug (name-id)
 * @returns {string|null} - The product ID or null if invalid
 */
export const extractProductIdFromSlug = (slug) => {
  if (!slug) return null

  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]

  // Check if the last part is a valid number (ID)
  if (/^\d+$/.test(lastPart)) {
    return lastPart
  }

  return null
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
