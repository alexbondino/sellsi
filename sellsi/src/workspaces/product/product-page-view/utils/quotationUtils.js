/**
 * Calcula el precio unitario basado en la cantidad y los tramos de precios
 * @param {number} quantity - Cantidad seleccionada
 * @param {Array} tiers - Array de tramos de precios
 * @param {number} basePrice - Precio base del producto (si no tiene tramos)
 * @returns {number} - Precio unitario correspondiente
 */
export const calculateUnitPrice = (quantity, tiers = [], basePrice = 0) => {
  // Si no hay tramos o están vacíos, usar el precio base
  if (!tiers || tiers.length === 0) {
    return basePrice
  }

  // Ordenar tramos por cantidad mínima (de menor a mayor)
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)

  // Encontrar el tramo correspondiente a la cantidad
  let selectedTier = null
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i]
    
    // Si es el último tramo y la cantidad es mayor o igual al mínimo
    if (i === sortedTiers.length - 1) {
      if (quantity >= tier.min_quantity) {
        selectedTier = tier
        break
      }
    } else {
      // Si la cantidad está dentro del rango del tramo
      const nextTier = sortedTiers[i + 1]
      if (quantity >= tier.min_quantity && quantity < nextTier.min_quantity) {
        selectedTier = tier
        break
      }
    }
  }

  // Si no se encontró un tramo válido, usar el primer tramo (más bajo)
  if (!selectedTier) {
    selectedTier = sortedTiers[0]
  }

  return selectedTier ? selectedTier.price : basePrice
}

/**
 * Valida si una cantidad es válida para un producto
 * @param {number} quantity - Cantidad a validar
 * @param {number} minimumPurchase - Compra mínima del producto
 * @param {number} stock - Stock disponible del producto
 * @returns {boolean} - True si la cantidad es válida
 */
export const isValidQuantity = (quantity, minimumPurchase = 1, stock = 0) => {
  return quantity >= minimumPurchase && quantity <= stock && quantity > 0
}

/**
 * Formatea un precio para mostrar en la UI
 * @param {number} price - Precio a formatear
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0'
  }
  return `$${price.toLocaleString('es-CL')}`
}

/**
 * Calcula el resumen de la cotización
 * @param {number} quantity - Cantidad
 * @param {number} unitPrice - Precio unitario
 * @returns {Object} - Objeto con totalNeto, iva y total
 */
export const calculateQuotationSummary = (quantity, unitPrice) => {
  const totalNeto = quantity * unitPrice
  const iva = totalNeto * 0.19
  const total = totalNeto + iva

  return {
    totalNeto,
    iva,
    total
  }
}
