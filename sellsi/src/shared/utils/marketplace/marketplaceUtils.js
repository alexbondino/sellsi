/**
 * 🔧 SHARED MARKETPLACE UTILITIES
 * 
 * Centraliza funciones de marketplace que son utilizadas por múltiples dominios
 * para evitar cross-imports entre buyer ↔ marketplace y supplier ↔ marketplace
 */

// ============================================================================
// 📦 PRODUCT URL UTILITIES
// ============================================================================

/**
 * Genera URL de producto para navegación
 * Movido desde domains/marketplace/utils/productUrl.js
 */
export const generateProductUrl = (product) => {
  if (!product) return '#';
  
  const productName = product.nombre || product.name || '';
  const productId = product.id || product.product_id || '';
  
  // Sanitizar nombre para URL
  const sanitizedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `/producto/${productId}/${sanitizedName}`;
};

// ============================================================================
// 🔢 PRICE CALCULATION UTILITIES  
// ============================================================================

/**
 * Calcula precio para cantidad específica considerando tramos
 * Centralizada para evitar duplicación
 */
export const calculatePriceForQuantity = (product, quantity) => {
  if (!product || !quantity) return 0;
  
  // Si tiene tramos de precio
  if (product.priceTiers && Array.isArray(product.priceTiers) && product.priceTiers.length > 0) {
    const validTiers = product.priceTiers
      .filter(tier => tier.min_quantity && tier.price)
      .sort((a, b) => parseInt(b.min_quantity) - parseInt(a.min_quantity));
    
    for (const tier of validTiers) {
      if (quantity >= parseInt(tier.min_quantity)) {
        return parseFloat(tier.price);
      }
    }
  }
  
  // Precio base si no hay tramos o no aplica ninguno
  return parseFloat(product.price || product.precio || 0);
};

// ============================================================================
// 📊 CONSTANTS COMPARTIDAS
// ============================================================================

/**
 * Opciones de envío compartidas
 * Movido desde domains/marketplace/hooks/constants
 */
export const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    name: 'Envío Estándar',
    description: '3-5 días hábiles',
    price: 3000,
    estimatedDays: '3-5'
  },
  {
    id: 'express',
    name: 'Envío Express',
    description: '1-2 días hábiles',
    price: 7000,
    estimatedDays: '1-2'
  },
  {
    id: 'same-day',
    name: 'Mismo Día',
    description: 'Entrega el mismo día',
    price: 12000,
    estimatedDays: '0'
  }
];

/**
 * Códigos de descuento compartidos
 * Movido desde domains/marketplace/hooks/constants
 */
export const DISCOUNT_CODES = [
  {
    code: 'BIENVENIDO10',
    discount: 0.10,
    type: 'percentage',
    description: '10% de descuento para nuevos usuarios',
    minAmount: 50000
  },
  {
    code: 'VERANO2025',
    discount: 15000,
    type: 'fixed',
    description: '$15.000 de descuento',
    minAmount: 100000
  }
];
