/**
 * ============================================================================
 * PRODUCT VALIDATOR - VALIDADOR CENTRALIZADO Y ROBUSTO
 * ============================================================================
 * 
 * Validador profesional que garantiza consistencia y robustez
 * en todas las validaciones de productos.
 */

import {
  PRICE_LIMITS,
  QUANTITY_LIMITS,
  PRODUCT_LIMITS,
  PRICING_TYPES,
  TIER_VALIDATION,
  ERROR_MESSAGES,
  VALIDATION_UTILS,
} from '../constants/productValidationConstants'

export class ProductValidator {
  /**
   * ========================================================================
   * MÉTODO PRINCIPAL DE VALIDACIÓN
   * ========================================================================
   */
  static validateProduct(formData, options = {}) {
    const errors = {}
    
    // Validaciones básicas
    this._validateBasicInfo(formData, errors)
    this._validateInventory(formData, errors)
    this._validatePricing(formData, errors)
    this._validateImages(formData, errors)
    this._validateOptionalFields(formData, errors)
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      hasErrors: Object.keys(errors).length > 0,
    }
  }

  /**
   * ========================================================================
   * VALIDACIONES ESPECÍFICAS
   * ========================================================================
   */

  /**
   * Validar información básica del producto
   */
  static _validateBasicInfo(formData, errors) {
    // Nombre del producto
    if (!formData.nombre?.trim()) {
      errors.nombre = ERROR_MESSAGES.NAME_REQUIRED
    } else if (formData.nombre.length > PRODUCT_LIMITS.MAX_NAME_LENGTH) {
      errors.nombre = ERROR_MESSAGES.NAME_TOO_LONG
    }

    // Descripción
    if (!formData.descripcion?.trim()) {
      errors.descripcion = ERROR_MESSAGES.DESCRIPTION_REQUIRED
    } else if (formData.descripcion.length < PRODUCT_LIMITS.MIN_DESCRIPTION_LENGTH) {
      errors.descripcion = ERROR_MESSAGES.DESCRIPTION_TOO_SHORT
    } else if (formData.descripcion.length > PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH) {
      errors.descripcion = ERROR_MESSAGES.DESCRIPTION_TOO_LONG
    }

    // Categoría
    if (!formData.categoria) {
      errors.categoria = ERROR_MESSAGES.CATEGORY_REQUIRED
    }
  }

  /**
   * Validar inventario y stock
   */
  static _validateInventory(formData, errors) {
    // Stock
    if (!formData.stock) {
      errors.stock = ERROR_MESSAGES.STOCK_REQUIRED
    } else {
      const stock = parseInt(formData.stock)
      if (isNaN(stock) || stock < QUANTITY_LIMITS.MIN_STOCK) {
        errors.stock = ERROR_MESSAGES.STOCK_TOO_LOW
      } else if (stock > QUANTITY_LIMITS.MAX_STOCK) {
        errors.stock = ERROR_MESSAGES.STOCK_TOO_HIGH
      } else if (!Number.isInteger(parseFloat(formData.stock))) {
        errors.stock = ERROR_MESSAGES.INVALID_INTEGER
      }
    }

    // Compra mínima
    if (!formData.compraMinima) {
      errors.compraMinima = ERROR_MESSAGES.MIN_PURCHASE_REQUIRED
    } else {
      const compraMinima = parseInt(formData.compraMinima)
      const stock = parseInt(formData.stock || 0)
      
      if (isNaN(compraMinima) || compraMinima < QUANTITY_LIMITS.MIN_QUANTITY) {
        errors.compraMinima = ERROR_MESSAGES.STOCK_TOO_LOW
      } else if (compraMinima > QUANTITY_LIMITS.MAX_STOCK) {
        errors.compraMinima = ERROR_MESSAGES.STOCK_TOO_HIGH
      } else if (!Number.isInteger(parseFloat(formData.compraMinima))) {
        errors.compraMinima = ERROR_MESSAGES.INVALID_INTEGER
      } else if (compraMinima > stock) {
        errors.compraMinima = ERROR_MESSAGES.MIN_PURCHASE_EXCEEDS_STOCK
      }
    }
  }

  /**
   * Validar precios según el tipo de pricing
   */
  static _validatePricing(formData, errors) {
    if (formData.pricingType === PRICING_TYPES.UNIT) {
      this._validateUnitPricing(formData, errors)
    } else if (formData.pricingType === PRICING_TYPES.TIER) {
      this._validateTierPricing(formData, errors)
    }
  }

  /**
   * Validar pricing por unidad
   */
  static _validateUnitPricing(formData, errors) {
    if (!formData.precioUnidad || isNaN(Number(formData.precioUnidad))) {
      errors.precioUnidad = ERROR_MESSAGES.PRICE_REQUIRED
    } else {
      const precio = parseFloat(formData.precioUnidad)
      
      if (precio < PRICE_LIMITS.MIN_PRICE) {
        errors.precioUnidad = ERROR_MESSAGES.PRICE_TOO_LOW
      } else if (precio > PRICE_LIMITS.MAX_PRICE) {
        errors.precioUnidad = ERROR_MESSAGES.PRICE_TOO_HIGH
      } else if (!Number.isInteger(precio)) {
        errors.precioUnidad = ERROR_MESSAGES.PRICE_NOT_INTEGER
      }
    }
  }

  /**
   * Validar pricing por tramos
   */
  static _validateTierPricing(formData, errors) {
    const validTramos = formData.tramos?.filter(
      t => t.cantidad !== '' && t.precio !== '' && 
           !isNaN(Number(t.cantidad)) && !isNaN(Number(t.precio))
    ) || []

    // Verificar cantidad mínima de tramos
    if (validTramos.length < TIER_VALIDATION.MIN_TIERS) {
      errors.tramos = ERROR_MESSAGES.INSUFFICIENT_TIERS
      return
    }

    // Validar que el primer tramo coincida con la compra mínima
    const compraMinima = parseInt(formData.compraMinima || 0)
    const firstTramo = formData.tramos?.[TIER_VALIDATION.FIRST_TIER_INDEX]
    
    if (!firstTramo?.cantidad || parseInt(firstTramo.cantidad) !== compraMinima) {
      errors.tramos = ERROR_MESSAGES.FIRST_TIER_MISMATCH
      return
    }

    // Validar límites de precios
    const tramosConPrecioAlto = validTramos.filter(
      t => parseFloat(t.precio) > PRICE_LIMITS.MAX_PRICE
    )
    if (tramosConPrecioAlto.length > 0) {
      errors.tramos = ERROR_MESSAGES.TIER_PRICES_TOO_HIGH
      return
    }

    // Validar que las cantidades no excedan el stock
    const stockNumber = parseInt(formData.stock || 0)
    const tramosExcedStock = validTramos.filter(
      tramo => parseInt(tramo.cantidad) > stockNumber
    )
    if (tramosExcedStock.length > 0) {
      errors.tramos = ERROR_MESSAGES.TIER_QUANTITY_EXCEEDS_STOCK
      return
    }

    // Validar precios mínimos
    const tramosConPrecioBajo = validTramos.filter(
      t => parseFloat(t.precio) < PRICE_LIMITS.MIN_PRICE
    )
    if (tramosConPrecioBajo.length > 0) {
      errors.tramos = ERROR_MESSAGES.TIER_PRICES_TOO_LOW
      return
    }

    // Validar que las cantidades sean enteros positivos
    const tramosConCantidadInvalida = validTramos.filter(
      t => !Number.isInteger(parseFloat(t.cantidad)) || parseInt(t.cantidad) < 1
    )
    if (tramosConCantidadInvalida.length > 0) {
      errors.tramos = ERROR_MESSAGES.TIER_QUANTITIES_INVALID
      return
    }

    // ⭐ NUEVA VALIDACIÓN: Cantidades ascendentes y precios descendentes
    this._validateTierProgression(validTramos, errors)
  }

  /**
   * 🎯 VALIDAR PROGRESIÓN DE TRAMOS: Cantidades ↑ y Precios ↓
   * Lógica: "Compras más, pagas menos por unidad"
   */
  static _validateTierProgression(validTramos, errors) {
    if (validTramos.length < 2) return // No hay suficientes tramos para comparar
    
    // Validar cantidades ascendentes
    for (let i = 1; i < validTramos.length; i++) {
      const currentQuantity = parseInt(validTramos[i].cantidad)
      const previousQuantity = parseInt(validTramos[i - 1].cantidad)
      
      if (currentQuantity <= previousQuantity) {
        errors.tramos = ERROR_MESSAGES.TIER_QUANTITIES_NOT_ASCENDING
        return
      }
    }
    
    // Validar precios descendentes
    for (let i = 1; i < validTramos.length; i++) {
      const currentPrice = parseFloat(validTramos[i].precio)
      const previousPrice = parseFloat(validTramos[i - 1].precio)
      
      if (currentPrice >= previousPrice) {
        errors.tramos = ERROR_MESSAGES.TIER_PRICES_NOT_DESCENDING
        return
      }
    }

    // Validar que los precios sean enteros positivos
    const tramosConPrecioInvalido = validTramos.filter(
      t => !Number.isInteger(parseFloat(t.precio)) || parseFloat(t.precio) < 1
    )
    if (tramosConPrecioInvalido.length > 0) {
      errors.tramos = ERROR_MESSAGES.TIER_PRICES_INVALID
      return
    }
  }

  /**
   * Validar imágenes
   */
  static _validateImages(formData, errors) {
    if (!formData.imagenes?.length) {
      errors.imagenes = ERROR_MESSAGES.IMAGES_REQUIRED
    } else if (formData.imagenes.length > PRODUCT_LIMITS.MAX_IMAGES) {
      errors.imagenes = ERROR_MESSAGES.TOO_MANY_IMAGES
    } else {
      // Validar tamaño de cada imagen
      const oversizedImages = formData.imagenes.filter(
        img => img.file && img.file.size > PRODUCT_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024
      )
      if (oversizedImages.length > 0) {
        errors.imagenes = ERROR_MESSAGES.IMAGE_TOO_LARGE
      }
    }
  }

  /**
   * Validar campos opcionales
   */
  static _validateOptionalFields(formData, errors) {
    // Documentos PDF
    if (formData.documentos?.length > 0) {
      const validDocuments = formData.documentos.filter(
        doc => doc.file && 
               doc.file.type === 'application/pdf' && 
               doc.file.size <= PRODUCT_LIMITS.MAX_PDF_SIZE_MB * 1024 * 1024
      )
      if (validDocuments.length !== formData.documentos.length) {
        errors.documentos = ERROR_MESSAGES.INVALID_DOCUMENTS
      }
    }

    // Especificaciones
    if (formData.specifications?.some(s => s.key && !s.value)) {
      errors.specifications = ERROR_MESSAGES.INCOMPLETE_SPECIFICATIONS
    }

    // Regiones de despacho
    if (!formData.shippingRegions?.length) {
      errors.shippingRegions = ERROR_MESSAGES.SHIPPING_REGIONS_REQUIRED
    }
  }

  /**
   * ========================================================================
   * UTILIDADES DE VALIDACIÓN
   * ========================================================================
   */

  /**
   * Validar un campo específico
   */
  static validateField(fieldName, value, formData = {}) {
    const tempFormData = { ...formData, [fieldName]: value }
    const result = this.validateProduct(tempFormData)
    return result.errors[fieldName] || null
  }

  /**
   * Verificar si un producto es válido para guardado
   */
  static isProductReadyForSave(formData) {
    const result = this.validateProduct(formData)
    return result.isValid
  }

  /**
   * Obtener resumen de errores
   */
  static getErrorSummary(errors) {
    const errorCount = Object.keys(errors).length
    if (errorCount === 0) return 'Sin errores'
    if (errorCount === 1) return '1 error encontrado'
    return `${errorCount} errores encontrados`
  }
}
