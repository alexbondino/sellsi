/**
 * ============================================================================
 * UTILIDADES PARA CÁLCULO DE PRECIOS POR TRAMOS
 * ============================================================================
 *
 * Funciones utilitarias para calcular precios basados en cantidad
 * y tramos de precios del producto.
 */

/**
 * Calcula el precio unitario para una cantidad específica según los tramos
 * @param {number} quantity - Cantidad de productos
 * @param {Array} tiers - Array de tramos de precios
 * @param {number} basePrice - Precio base del producto (si no hay tramos)
 * @returns {number} Precio unitario
 */
export const calculatePriceForQuantity = (
  quantity,
  tiers = [],
  basePrice = 0
) => {
  // Si no hay tramos, devolver el precio base
  if (!tiers || tiers.length === 0) {
    return basePrice
  }

  // Ordenar tramos por cantidad mínima descendente para encontrar el mejor precio
  const sortedTiers = [...tiers].sort((a, b) => {
    const aMin = a.min_quantity || a.cantidad_minima || 0
    const bMin = b.min_quantity || b.cantidad_minima || 0
    return bMin - aMin // Descendente
  })
  
  // Buscar el primer tramo cuya cantidad mínima sea menor o igual a la cantidad solicitada
  for (const tier of sortedTiers) {
    const minQty = tier.min_quantity || tier.cantidad_minima || 0
    const tierPrice = tier.price || tier.precio || 0

    if (quantity >= minQty) {
      return tierPrice
    }
  }

  return basePrice
}

/**
 * Normaliza y ordena los price tiers según un modo especificado.
 * @param {Array} tiers - Array original de tramos (no se muta)
 * @param {string} mode - 'price_desc' | 'min_desc' | 'min_asc'
 * @returns {Array} Nuevo array ordenado
 */
export const normalizePriceTiers = (tiers = [], mode = 'price_desc') => {
  if (!Array.isArray(tiers)) return []
  const copy = tiers.slice().filter(t => t && (t.price != null || t.precio != null || t.min_quantity != null || t.cantidad_minima != null))
  const getMin = t => t.min_quantity ?? t.cantidad_minima ?? t.min ?? 0
  const getPrice = t => t.price ?? t.precio ?? 0
  if (mode === 'price_desc') {
    return copy.sort((a, b) => {
      const d = getPrice(b) - getPrice(a)
      if (d !== 0) return d
      return getMin(a) - getMin(b) // tie-break: menor min primero
    })
  }
  if (mode === 'min_desc') {
    return copy.sort((a, b) => getMin(b) - getMin(a))
  }
  if (mode === 'min_asc') {
    return copy.sort((a, b) => getMin(a) - getMin(b))
  }
  return copy
}

/**
 * Calcula el precio total para una cantidad específica
 * @param {number} quantity - Cantidad de productos
 * @param {Array} tiers - Array de tramos de precios
 * @param {number} basePrice - Precio base del producto
 * @returns {Object} { unitPrice, totalPrice }
 */
export const calculateTotalPriceForQuantity = (
  quantity,
  tiers = [],
  basePrice = 0
) => {
  const unitPrice = calculatePriceForQuantity(quantity, tiers, basePrice)
  const totalPrice = unitPrice * quantity

  return {
    unitPrice,
    totalPrice,
    quantity,
  }
}

/**
 * Formatea un producto para agregarlo al carrito con el precio correcto
 * @param {Object} product - Producto base
 * @param {number} quantity - Cantidad seleccionada
 * @param {Array} tiers - Tramos de precios
 * @returns {Object} Producto formateado para el carrito
 */
export const formatProductForCart = (product, quantity, tiers = []) => {
  const basePrice = product.precio || product.price || 0
  const safeTiers = Array.isArray(tiers) ? tiers.map(t => ({ ...t })) : []

  const { unitPrice, totalPrice } = calculateTotalPriceForQuantity(quantity, safeTiers, basePrice)

  // Determinar tramo aplicado SIN mutar el array original
  const appliedTier = [...safeTiers]
    .sort((a, b) => {
      const aMin = a.min_quantity || a.cantidad_minima || 0
      const bMin = b.min_quantity || b.cantidad_minima || 0
      return bMin - aMin
    })
    .find(tier => {
      const minQty = tier.min_quantity || tier.cantidad_minima || 0
      return quantity >= minQty
    }) || null

  const finalImage = product.imagen || product.image || '/placeholder-product.jpg'

  const finalPriceTiers = product.price_tiers || safeTiers || [{ min_quantity: 1, price: basePrice }]

  return {
    ...product,
    id: product.id,
    name: product.nombre || product.name,
    price: unitPrice,
    image: finalImage,
    supplier: product.proveedor || product.supplier || product.provider || 'Proveedor no especificado',
    maxStock: product.stock || product.maxStock || 50,
    quantity,
    price_tiers: finalPriceTiers,
    minimum_purchase: product.minimum_purchase || product.compraMinima || 1,
    cantidadSeleccionada: quantity,
    precioUnitario: unitPrice,
    precioTotal: totalPrice,
    precioOriginal: basePrice,
    tramoAplicado: appliedTier,
  }
}

/**
 * Obtiene información de descuento si aplica
 * @param {number} quantity - Cantidad
 * @param {Array} tiers - Tramos de precios
 * @param {number} basePrice - Precio base
 * @returns {Object|null} Información del descuento o null
 */
export const getDiscountInfo = (quantity, tiers = [], basePrice = 0) => {
  const currentPrice = calculatePriceForQuantity(quantity, tiers, basePrice)

  if (currentPrice < basePrice) {
    const discountAmount = basePrice - currentPrice
    const discountPercentage = ((discountAmount / basePrice) * 100).toFixed(1)

    return {
      hasDiscount: true,
      originalPrice: basePrice,
      discountedPrice: currentPrice,
      discountAmount,
      discountPercentage: parseFloat(discountPercentage),
      savingsTotal: discountAmount * quantity,
    }
  }

  return null
}

/**
 * ============================================================================
 * UTILIDADES PARA ACCESO A PRICE_TIERS
 * ============================================================================
 */

/**
 * Obtiene los price_tiers de un producto (desde cualquier componente)
 * @param {Object} product - Producto
 * @returns {Array} Array de price_tiers
 */
export const getProductPriceTiers = (product) => {
  return product?.price_tiers || []
}

/**
 * Verifica si un producto tiene price_tiers configurados
 * @param {Object} product - Producto
 * @returns {boolean} True si tiene price_tiers
 */
export const hasProductPriceTiers = (product) => {
  const tiers = getProductPriceTiers(product)
  return tiers.length > 0
}

/**
 * Obtiene el precio mínimo y máximo de un producto según sus tiers
 * @param {Object} product - Producto
 * @returns {Object} { minPrice, maxPrice }
 */
export const getProductPriceRange = (product) => {
  const tiers = getProductPriceTiers(product)
  const basePrice = product.price || product.precio || 0

  if (tiers.length === 0) {
    return { minPrice: basePrice, maxPrice: basePrice }
  }

  const prices = tiers.map((tier) => tier.price || 0)
  return {
    minPrice: Math.min(...prices, basePrice),
    maxPrice: Math.max(...prices, basePrice),
  }
}

/**
 * ============================================================================
 * UTILIDADES EXISTENTES PARA CÁLCULO DE PRECIOS POR TRAMOS
 * ============================================================================
 */
