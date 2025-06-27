/**
 * ============================================================================
 * UTILIDADES DE VALIDACIÓN DE CANTIDADES
 * ============================================================================
 * 
 * Funciones centralizadas para validar y sanitizar cantidades de productos
 * en el carrito para prevenir errores de base de datos por overflow.
 */

// Límites seguros para prevenir overflow de PostgreSQL INTEGER
export const QUANTITY_LIMITS = {
  MIN: 1,
  MAX: 15000, // Muy por debajo del límite de PostgreSQL (2,147,483,647)
  DEFAULT: 1
};

/**
 * Valida y sanitiza una cantidad para uso seguro en base de datos
 * @param {any} quantity - Cantidad a validar (puede ser string, number, etc.)
 * @param {number} min - Valor mínimo permitido (default: 1)
 * @param {number} max - Valor máximo permitido (default: 15000)
 * @returns {number} Cantidad validada y limitada
 */
export const validateQuantity = (quantity, min = QUANTITY_LIMITS.MIN, max = QUANTITY_LIMITS.MAX) => {
  // Convertir a entero
  const numQuantity = parseInt(quantity);
  
  // Validar que sea un número válido
  if (isNaN(numQuantity)) {
    console.warn(`[quantityValidation] Cantidad no numérica "${quantity}", usando ${QUANTITY_LIMITS.DEFAULT}`);
    return QUANTITY_LIMITS.DEFAULT;
  }
  
  // Aplicar límite mínimo
  if (numQuantity < min) {
    console.warn(`[quantityValidation] Cantidad ${numQuantity} menor al mínimo ${min}, ajustando`);
    return min;
  }
  
  // Aplicar límite máximo
  if (numQuantity > max) {
    console.warn(`[quantityValidation] Cantidad ${numQuantity} mayor al máximo ${max}, limitando`);
    return max;
  }
  
  return numQuantity;
};

/**
 * Valida si una cantidad está dentro de límites seguros sin modificarla
 * @param {any} quantity - Cantidad a verificar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @returns {boolean} True si la cantidad es válida
 */
export const isValidQuantity = (quantity, min = QUANTITY_LIMITS.MIN, max = QUANTITY_LIMITS.MAX) => {
  const numQuantity = parseInt(quantity);
  return !isNaN(numQuantity) && numQuantity >= min && numQuantity <= max;
};

/**
 * Sanitiza un array de items de carrito, removiendo o corrigiendo datos inválidos
 * @param {Array} items - Array de items del carrito
 * @returns {Object} Objeto con items válidos y reporte de limpieza
 */
export const sanitizeCartItems = (items) => {
  if (!Array.isArray(items)) {
    return { validItems: [], invalidCount: 0, correctedCount: 0 };
  }
  
  let invalidCount = 0;
  let correctedCount = 0;
  
  const validItems = items.filter(item => {
    // Verificar que el item tenga ID
    const hasId = item.id || item.productid || item.product_id;
    if (!hasId) {
      console.warn('[quantityValidation] Item sin ID descartado:', item);
      invalidCount++;
      return false;
    }
    
    // Verificar que tenga nombre
    const hasName = item.name || item.nombre;
    if (!hasName) {
      console.warn('[quantityValidation] Item sin nombre descartado:', item);
      invalidCount++;
      return false;
    }
    
    // Verificar cantidad
    const originalQuantity = item.quantity;
    const validatedQuantity = validateQuantity(originalQuantity);
    
    if (originalQuantity !== validatedQuantity) {
      console.warn(`[quantityValidation] Cantidad corregida: ${originalQuantity} → ${validatedQuantity}`);
      item.quantity = validatedQuantity;
      correctedCount++;
    }
    
    return true;
  });
  
  return {
    validItems,
    invalidCount,
    correctedCount,
    summary: {
      original: items.length,
      valid: validItems.length,
      removed: invalidCount,
      corrected: correctedCount
    }
  };
};

/**
 * Detecta si un error está relacionado con cantidades inválidas
 * @param {Error|string} error - Error a analizar
 * @returns {boolean} True si es un error de cantidad/overflow
 */
export const isQuantityError = (error) => {
  const message = typeof error === 'string' ? error : error?.message || '';
  
  const quantityErrorPatterns = [
    /out of range for type integer/i,
    /value .* is out of range/i,
    /invalid input syntax for.*integer/i,
    /numeric value out of range/i,
    /integer overflow/i
  ];
  
  return quantityErrorPatterns.some(pattern => pattern.test(message));
};

export default {
  validateQuantity,
  isValidQuantity,
  sanitizeCartItems,
  isQuantityError,
  QUANTITY_LIMITS
};
