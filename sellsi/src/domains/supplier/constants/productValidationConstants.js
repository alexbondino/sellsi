/**
 * ============================================================================
 * PRODUCT VALIDATION CONSTANTS - CONFIGURACIÓN CENTRALIZADA
 * ============================================================================
 * 
 * Constantes centralizadas para validación de productos.
 * Garantiza consistencia entre todos los hooks y componentes.
 */

// ============================================================================
// LÍMITES NUMÉRICOS
// ============================================================================

export const PRICE_LIMITS = {
  // Límite unificado para precios (productos y tramos)
  MAX_PRICE: 10000000, // 10,000,000 CLP
  MIN_PRICE: 1,
  
  // Límite técnico de base de datos (8 dígitos)
  DB_MAX_VALUE: 99999999, // 99,999,999
}

export const QUANTITY_LIMITS = {
  MAX_STOCK: 15000,
  MIN_STOCK: 1,
  MAX_QUANTITY: 10000000, // 10,000,000 unidades
  MIN_QUANTITY: 1,
}

export const PRODUCT_LIMITS = {
  MAX_NAME_LENGTH: 40,
  MAX_DESCRIPTION_LENGTH: 3000,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 2,
  MAX_PDF_SIZE_MB: 5,
}

// ============================================================================
// TIPOS DE PRODUCTO
// ============================================================================

export const PRICING_TYPES = {
  UNIT: 'Por Unidad',
  TIER: 'Por Tramo',
}

export const PRODUCT_TYPES_DB = {
  UNIT: 'unit',
  TIER: 'tier',
  GENERAL: 'general',
}

// ============================================================================
// VALIDACIÓN DE TRAMOS
// ============================================================================

export const TIER_VALIDATION = {
  MIN_TIERS: 2,
  MAX_TIERS: 5,
  FIRST_TIER_INDEX: 0,
}

// ============================================================================
// MENSAJES DE ERROR ESTANDARIZADOS
// ============================================================================

export const ERROR_MESSAGES = {
  // Errores generales
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_NUMBER: 'Debe ser un número válido',
  INVALID_INTEGER: 'Debe ser un número entero positivo',
  
  // Errores de precio
  PRICE_REQUIRED: 'El precio es requerido',
  PRICE_TOO_LOW: `El precio mínimo es ${PRICE_LIMITS.MIN_PRICE}`,
  PRICE_TOO_HIGH: `El precio no puede superar ${PRICE_LIMITS.MAX_PRICE.toLocaleString('es-CL')}`,
  PRICE_NOT_INTEGER: 'El precio debe ser un número entero positivo',
  
  // Errores de stock/cantidad
  STOCK_REQUIRED: 'El stock es requerido',
  STOCK_TOO_LOW: `El stock mínimo es ${QUANTITY_LIMITS.MIN_STOCK}`,
  STOCK_TOO_HIGH: `El stock no puede superar ${QUANTITY_LIMITS.MAX_STOCK.toLocaleString('es-CL')}`,
  QUANTITY_TOO_HIGH: `La cantidad no puede superar ${QUANTITY_LIMITS.MAX_QUANTITY.toLocaleString('es-CL')}`,
  
  // Errores de compra mínima
  MIN_PURCHASE_REQUIRED: 'La compra mínima es requerida',
  MIN_PURCHASE_EXCEEDS_STOCK: 'La compra mínima no puede ser mayor al stock disponible',
  
  // Errores de tramos
  INSUFFICIENT_TIERS: `Debe agregar al menos ${TIER_VALIDATION.MIN_TIERS} tramos válidos`,
  FIRST_TIER_MISMATCH: 'La cantidad del Tramo 1 debe ser igual a la Compra Mínima',
  TIER_QUANTITY_EXCEEDS_STOCK: 'Las cantidades de los tramos no pueden ser mayores al stock disponible',
  TIER_PRICES_TOO_HIGH: `Los precios de los tramos no pueden superar ${PRICE_LIMITS.MAX_PRICE.toLocaleString('es-CL')}`,
  TIER_PRICES_TOO_LOW: `El precio mínimo por tramo es ${PRICE_LIMITS.MIN_PRICE}`,
  TIER_QUANTITIES_INVALID: 'Las cantidades de los tramos deben ser números enteros positivos',
  TIER_PRICES_INVALID: 'Los precios de los tramos deben ser números enteros positivos',
  
  // ⭐ NUEVA VALIDACIÓN: Lógica de tramos escalonados
  TIER_QUANTITIES_NOT_ASCENDING: 'Las cantidades de los tramos deben ser ascendentes (ej: 50, 100, 200)',
  TIER_PRICES_NOT_DESCENDING: 'Los precios deben ser descendentes: compran más, pagan menos por unidad',
  
  // Errores de producto
  NAME_REQUIRED: 'El nombre del producto es requerido',
  NAME_TOO_LONG: `Máximo ${PRODUCT_LIMITS.MAX_NAME_LENGTH} caracteres`,
  DESCRIPTION_REQUIRED: 'La descripción es requerida',
  DESCRIPTION_TOO_SHORT: `Mínimo ${PRODUCT_LIMITS.MIN_DESCRIPTION_LENGTH} caracteres`,
  DESCRIPTION_TOO_LONG: `Máximo ${PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH} caracteres`,
  CATEGORY_REQUIRED: 'Selecciona una categoría',
  
  // Errores de imágenes
  IMAGES_REQUIRED: 'Debe agregar al menos una imagen',
  TOO_MANY_IMAGES: `Máximo ${PRODUCT_LIMITS.MAX_IMAGES} imágenes permitidas`,
  IMAGE_TOO_LARGE: `Algunas imágenes exceden el límite de ${PRODUCT_LIMITS.MAX_IMAGE_SIZE_MB}MB`,
  
  // Errores de documentos
  INVALID_DOCUMENTS: `Solo se permiten archivos PDF de máximo ${PRODUCT_LIMITS.MAX_PDF_SIZE_MB}MB`,
  
  // Errores de especificaciones
  INCOMPLETE_SPECIFICATIONS: 'Completa todos los valores de las especificaciones',
  
  // Errores de regiones
  SHIPPING_REGIONS_REQUIRED: 'Debe configurar al menos una región de despacho',
}

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

export const VALIDATION_UTILS = {
  /**
   * Valida si un valor está dentro de los límites numéricos
   */
  isWithinLimits: (value, min, max) => {
    const num = Number(value)
    return !isNaN(num) && num >= min && num <= max
  },
  
  /**
   * Valida si un valor es un entero positivo
   */
  isPositiveInteger: (value) => {
    const num = Number(value)
    return Number.isInteger(num) && num > 0
  },
  
  /**
   * Formatea un número para mostrar en mensajes de error
   */
  formatNumber: (number) => {
    return number.toLocaleString('es-CL')
  },
  
  /**
   * Valida si un precio está dentro de los límites permitidos
   */
  isValidPrice: (price) => {
    return VALIDATION_UTILS.isWithinLimits(price, PRICE_LIMITS.MIN_PRICE, PRICE_LIMITS.MAX_PRICE)
  },
  
  /**
   * Valida si una cantidad está dentro de los límites permitidos
   */
  isValidQuantity: (quantity) => {
    return VALIDATION_UTILS.isWithinLimits(quantity, QUANTITY_LIMITS.MIN_QUANTITY, QUANTITY_LIMITS.MAX_QUANTITY)
  },
  
  /**
   * Valida si un stock está dentro de los límites permitidos
   */
  isValidStock: (stock) => {
    return VALIDATION_UTILS.isWithinLimits(stock, QUANTITY_LIMITS.MIN_STOCK, QUANTITY_LIMITS.MAX_STOCK)
  },
}
