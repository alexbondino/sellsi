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

    // Compra mínima - solo requerida para productos con pricing por unidad
    if (formData.pricingType !== PRICING_TYPES.TIER) {
      // Solo validar compraMinima si NO es pricing por tramos
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
    // Para productos con pricing por tramos, la compra mínima se define automáticamente
    // por el primer tramo, por lo que no es necesaria como campo separado
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
      t => t.min !== '' && t.precio !== '' && 
           !isNaN(Number(t.min)) && !isNaN(Number(t.precio))
    ) || []

    // Verificar cantidad mínima de tramos
    if (validTramos.length < TIER_VALIDATION.MIN_TIERS) {
      errors.tramos = ERROR_MESSAGES.INSUFFICIENT_TIERS
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

    // Validar que las cantidades mínimas no excedan el stock
    const stockNumber = parseInt(formData.stock || 0)
    const tramosExcedStock = validTramos.filter(
      tramo => parseInt(tramo.min) > stockNumber
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
      t => !Number.isInteger(parseFloat(t.min)) || parseInt(t.min) < 1
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
      const currentQuantity = parseInt(validTramos[i].min)
      const previousQuantity = parseInt(validTramos[i - 1].min)
      
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

  /**
   * ========================================================================
   * GENERADOR DE MENSAJES DE ERROR CONTEXTUALES
   * ========================================================================
   * Analiza los errores y genera mensajes específicos y contextuales para el usuario.
   * Movido desde AddProduct.jsx para centralizar la lógica de mensajes.
   * 
   * @param {Object} validationErrors - Objeto con errores de validación
   * @returns {string|null} - Mensaje contextual específico o null si no hay errores
   */
  static generateContextualMessage(validationErrors) {
    console.log('🔍 [ProductValidator.generateContextualMessage] Procesando errores:', validationErrors)
    
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return null;
    }

    const errorKeys = Object.keys(validationErrors);
    console.log('🔑 [ProductValidator.generateContextualMessage] Error keys:', errorKeys)
    
    const hasTramoErrors = errorKeys.includes('tramos');
    const hasBasicFieldErrors = errorKeys.some(key => 
      ['nombre', 'descripcion', 'categoria', 'stock', 'compraMinima', 'precioUnidad'].includes(key)
    );
    const hasImageErrors = errorKeys.includes('imagenes');
    const hasRegionErrors = errorKeys.includes('shippingRegions');

    console.log('🔍 [ProductValidator.generateContextualMessage] Tipos de errores detectados:', {
      hasTramoErrors,
      hasBasicFieldErrors,
      hasImageErrors,
      hasRegionErrors
    })

    // Construir mensaje específico
    const messages = [];

    if (hasTramoErrors) {
      const tramoError = validationErrors.tramos;
      
      // Detectar tipo específico de error en tramos
      if (tramoError.includes('ascendentes')) {
        messages.push('🔢 Las cantidades de los tramos deben ser ascendentes (ej: 50, 100, 200)');
      } else if (tramoError.includes('descendentes') || tramoError.includes('compran más')) {
        messages.push('💰 Los precios deben ser descendentes: compran más, pagan menos por unidad');
      } else if (tramoError.includes('Tramo')) {
        messages.push('📊 Revisa la configuración de los tramos de precio');
      } else if (tramoError.includes('al menos')) {
        messages.push('📈 Debes configurar al menos 2 tramos de precios válidos');
      } else if (tramoError.includes('stock')) {
        messages.push('⚠️ Las cantidades de los tramos no pueden superar el stock disponible');
      } else if (tramoError.includes('enteros positivos')) {
        messages.push('🔢 Las cantidades y precios deben ser números enteros positivos');
      } else {
        messages.push('📈 Revisa la configuración de los tramos de precios');
      }
    }

    if (hasBasicFieldErrors) {
      const basicErrors = [];
      if (validationErrors.nombre) basicErrors.push('nombre');
      if (validationErrors.descripcion) basicErrors.push('descripción');
      if (validationErrors.categoria) basicErrors.push('categoría');
      if (validationErrors.stock) basicErrors.push('stock');
      if (validationErrors.compraMinima) basicErrors.push('compra mínima');
      if (validationErrors.precioUnidad) basicErrors.push('precio');
      
      if (basicErrors.length > 0) {
        messages.push(`📝 Completa: ${basicErrors.join(', ')}`);
      } else {
        messages.push('📝 Completa la información básica del producto');
      }
    }

    if (hasImageErrors) {
      messages.push('🖼️ Agrega al menos una imagen del producto');
    }

    if (hasRegionErrors) {
      messages.push('🚛 Configura las regiones de despacho');
    }

    // Formatear mensaje final
    if (messages.length > 1) {
      const finalMessage = `${messages.join(' • ')}`;
      console.log('📝 [ProductValidator.generateContextualMessage] Mensaje múltiple:', finalMessage)
      return finalMessage;
    } else if (messages.length === 1) {
      console.log('📝 [ProductValidator.generateContextualMessage] Mensaje único:', messages[0])
      return messages[0];
    } else {
      const defaultMessage = 'Por favor, completa todos los campos requeridos';
      console.log('📝 [ProductValidator.generateContextualMessage] Mensaje por defecto:', defaultMessage)
      return defaultMessage;
    }
  }
}
