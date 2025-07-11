/**
 * Utilidad para determinar si un producto está realmente activo
 * Un producto está activo si:
 * 1. is_active === true (ya establecido en BD)
 * 2. stock >= compra mínima (nueva condición)
 */

/**
 * Determina si un producto está activo basado en stock y compra mínima
 * @param {Object} product - Producto a evaluar
 * @param {number} product.stock - Stock disponible del producto
 * @param {number} product.productqty - Stock disponible del producto (alternativo)
 * @param {number} product.minimum_purchase - Compra mínima requerida
 * @param {number} product.compraMinima - Compra mínima requerida (alternativo)
 * @param {boolean} product.is_active - Estado activo en BD (opcional, por defecto true)
 * @returns {boolean} - True si el producto está activo
 */
export const isProductActive = (product) => {
  if (!product) return false;
  
  // Obtener stock (soportar diferentes nombres de campo)
  const stock = product.stock ?? product.productqty ?? 0;
  
  // Obtener compra mínima (soportar diferentes nombres de campo)
  const minimumPurchase = product.minimum_purchase ?? product.compraMinima ?? 1;
  
  // Verificar que el producto esté marcado como activo en BD (por defecto true si no se especifica)
  const isActiveInDB = product.is_active !== false;
  
  // Un producto está activo si:
  // 1. Está marcado como activo en BD
  // 2. El stock es mayor o igual a la compra mínima
  return isActiveInDB && stock >= minimumPurchase;
};

/**
 * Filtra una lista de productos para obtener solo los activos
 * @param {Array} products - Lista de productos
 * @returns {Array} - Lista de productos activos
 */
export const filterActiveProducts = (products) => {
  if (!Array.isArray(products)) return [];
  
  return products.filter(isProductActive);
};

/**
 * Cuenta cuántos productos están activos en una lista
 * @param {Array} products - Lista de productos
 * @returns {number} - Número de productos activos
 */
export const countActiveProducts = (products) => {
  if (!Array.isArray(products)) return 0;
  
  return products.filter(isProductActive).length;
};

/**
 * Agrupa productos por proveedor y cuenta productos activos por proveedor
 * @param {Array} products - Lista de productos
 * @returns {Map} - Mapa con supplier_id como clave y conteo de productos activos
 */
export const getActiveProductCountByProvider = (products) => {
  if (!Array.isArray(products)) return new Map();
  
  const activeProductsCount = new Map();
  
  products.forEach(product => {
    if (isProductActive(product)) {
      const supplierId = product.supplier_id;
      const currentCount = activeProductsCount.get(supplierId) || 0;
      activeProductsCount.set(supplierId, currentCount + 1);
    }
  });
  
  return activeProductsCount;
};
