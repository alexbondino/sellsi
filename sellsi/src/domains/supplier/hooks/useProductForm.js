/**
 * ============================================================================
 * USE PRODUCT FORM - HOOK PROFESIONAL PARA GESTIÓN DE FORMULARIOS
 * ============================================================================
 *
 * Hook refactorizado con arquitectura robusta que garantiza consistencia
 * en el manejo de productos por unidad y por tramos.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useSupplierProducts } from './useSupplierProducts'
import { convertDbRegionsToForm } from '../../../utils/shippingRegionsUtils'
import { 
  PRICE_LIMITS, 
  QUANTITY_LIMITS, 
  PRICING_TYPES, 
  PRODUCT_TYPES_DB 
} from '../constants/productValidationConstants'
import { ProductValidator } from '../validators/ProductValidator'

// ============================================================================
// CONFIGURACIÓN INICIAL ROBUSTA
// ============================================================================

const initialFormData = {
  nombre: '',
  descripcion: '',
  categoria: '',
  stock: '',
  compraMinima: '',
  pricingType: PRICING_TYPES.UNIT,
  precioUnidad: '',
  tramos: [
    { cantidad: '', precio: '' },
    { cantidad: '', precio: '' }
  ],
  imagenes: [],
  documentos: [],
  specifications: [{ key: '', value: '' }],
  negociable: false,
  activo: true,
  shippingRegions: [],
}

// Reglas de validación profesionales
const validationRules = {
  nombre: {
    required: true,
    minLength: 2,
    maxLength: 40,
  },
  descripcion: {
    required: true,
    minLength: 10,
    maxLength: 3000,
  },
  categoria: {
    required: true,
  },
  stock: {
    required: true,
    min: QUANTITY_LIMITS.MIN_STOCK,
    max: QUANTITY_LIMITS.MAX_STOCK,
    type: 'number',
  },
  compraMinima: {
    required: true,
    min: QUANTITY_LIMITS.MIN_QUANTITY,
    max: QUANTITY_LIMITS.MAX_STOCK,
    type: 'number',
  },
  precioUnidad: {
    required: false, // Validado condicionalmente
    min: PRICE_LIMITS.MIN_PRICE,
    max: PRICE_LIMITS.MAX_PRICE,
    type: 'number',
  },
}

/**
 * Hook para gestión de formularios de productos
 * @param {string} productId - ID del producto para modo edición (opcional)
 */
export const useProductForm = (productId = null) => {
  const { uiProducts, createProduct, updateProduct, operationStates } =
    useSupplierProducts()

  // Estado del formulario
  const [formData, setFormData] = useState(() => {
    if (productId) {
      const product = uiProducts.find(
        (p) => p.productid?.toString() === productId?.toString()
      )
      return product ? mapProductToForm(product) : initialFormData
    }
    return initialFormData
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  // Modo de edición
  const isEditMode = Boolean(productId)
  const isLoading =
    operationStates.creating || operationStates.updating[productId]

  /**
   * ========================================================================
   * MAPEO ROBUSTO DE PRODUCTO A FORMULARIO
   * ========================================================================
   */
  function mapProductToForm(product) {
    // Determinar tipo de pricing de forma robusta
    const hasPriceTiers = product.priceTiers?.length > 0
    const pricingType = hasPriceTiers ? PRICING_TYPES.TIER : PRICING_TYPES.UNIT

    return {
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      stock: product.stock?.toString() || '',
      compraMinima: product.compraMinima?.toString() || '',
      pricingType: pricingType,
      
      // Precio por unidad: solo si NO es por tramos
      precioUnidad: !hasPriceTiers ? (product.precio?.toString() || '') : '',
      
      // Tramos: mapear si existen, sino inicializar con 2 tramos vacíos por defecto
      tramos: hasPriceTiers
        ? product.priceTiers.map((t) => ({
            cantidad: t.min_quantity?.toString() || '',
            precio: t.price?.toString() || '',
          }))
        : [
            { cantidad: '', precio: '' },
            { cantidad: '', precio: '' }
          ],
        
      imagenes: product.imagenes
        ? product.imagenes.map((url, index) => ({
            id: `existing_${index}_${Date.now()}`,
            url: url,
            name: url.split('/').pop() || `imagen_${index + 1}`,
            isExisting: true,
          }))
        : [],
        
      documentos: product.documentos || [],
      specifications: product.specifications || [{ key: '', value: '' }],
      negociable: product.negociable || false,
      activo: product.activo !== false,
      shippingRegions: convertDbRegionsToForm(product.delivery_regions || []),
    }
  }

  /**
   * ========================================================================
   * MAPEO ROBUSTO DE FORMULARIO A PRODUCTO
   * ========================================================================
   */
  function mapFormToProduct(formData) {
    // Validación de integridad antes del mapeo
    if (!formData.nombre || !formData.descripcion || !formData.categoria) {
      throw new Error('Campos básicos requeridos faltantes')
    }

    const productData = {
      productnm: formData.nombre,
      description: formData.descripcion,
      category: formData.categoria,
      productqty: Math.min(parseInt(formData.stock) || 0, PRICE_LIMITS.DB_MAX_VALUE),
      minimum_purchase: Math.min(parseInt(formData.compraMinima) || 1, PRICE_LIMITS.DB_MAX_VALUE),
      negotiable: formData.negociable,
      is_active: formData.activo,
      imagenes: formData.imagenes,
      specifications: formData.specifications.filter((s) => s.key && s.value),
    }

    // ========================================================================
    // LÓGICA ROBUSTA PARA PRICING - CON LOGGING DETALLADO
    // ========================================================================
    
    console.log('🔧 [mapFormToProduct] Procesando pricing type:', formData.pricingType)
    
    if (formData.pricingType === PRICING_TYPES.UNIT) {
      // Modo Por Unidad
      const unitPrice = Math.min(parseFloat(formData.precioUnidad) || 0, PRICE_LIMITS.MAX_PRICE)
      productData.price = unitPrice
      productData.product_type = PRODUCT_TYPES_DB.UNIT
      // CRÍTICO: Limpiar completamente los price tiers
      productData.priceTiers = []
      
      console.log('💰 [UNIT MODE] price:', unitPrice, 'product_type:', PRODUCT_TYPES_DB.UNIT, 'priceTiers: []')
      
    } else if (formData.pricingType === PRICING_TYPES.TIER) {
      // Modo Por Tramo
      productData.price = 0 // Precio base para productos por tramo
      productData.product_type = PRODUCT_TYPES_DB.TIER
      
      // Filtrar y mapear tramos válidos
      const validTiers = formData.tramos
        .filter((t) => t.cantidad && t.precio)
        .map((t) => ({
          cantidad: Math.min(parseInt(t.cantidad), QUANTITY_LIMITS.MAX_QUANTITY),
          precio: Math.min(parseFloat(t.precio), PRICE_LIMITS.MAX_PRICE),
        }))
      
      productData.priceTiers = validTiers
      
      console.log('📊 [TIER MODE] price: 0, product_type:', PRODUCT_TYPES_DB.TIER, 'priceTiers:', validTiers)
    }

    console.log('✅ [mapFormToProduct] Producto final:', productData)

    return productData
  }
  /**
   * ✅ MEJORA DE RENDIMIENTO: Memoización de reglas de validación
   */
  const memoizedValidationRules = React.useMemo(() => validationRules, [])

  /**
   * Validar un campo específico
   */
  const validateField = useCallback((fieldName, value) => {
    const rule = memoizedValidationRules[fieldName]
    if (!rule) {
      return null
    }


    if (rule.required && (!value || value.toString().trim() === '')) {
      return 'Este campo es requerido'
    }

    if (rule.minLength && value.length < rule.minLength) {
      return `Mínimo ${rule.minLength} caracteres`
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `Máximo ${rule.maxLength} caracteres`
    }

    if (rule.type === 'number') {
      // Solo validar tipo si el campo no está vacío o si es requerido
      if (value && value.toString().trim() !== '') {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return 'Debe ser un número válido'
        }
        if (rule.min !== undefined && numValue < rule.min) {
          return `El valor mínimo es ${rule.min}`
        }
        if (rule.max !== undefined && numValue > rule.max) {
          return `El valor máximo es ${rule.max}`
        }
      }
    }

    return null
  }, [memoizedValidationRules])  /**
   * ========================================================================
   * VALIDACIÓN ROBUSTA CON PRODUCTVALIDATOR
   * ========================================================================
   */
  const validateForm = useCallback(() => {
    const validationResult = ProductValidator.validateProduct(formData)
    
    setErrors(validationResult.errors)
    return validationResult.isValid
  }, [formData])

  /**
   * ========================================================================
   * GESTIÓN DE CAMBIOS CON VALIDACIÓN INMEDIATA
   * ========================================================================
   */
  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    setTouched(prev => ({ ...prev, [name]: true }))
    setIsDirty(true)
    
    // Validación inmediata usando la función validateField existente
    const fieldError = validateField(name, value)
    
    setErrors(prev => {
      const newErrors = { ...prev }
      if (fieldError) {
        newErrors[name] = fieldError
      } else {
        delete newErrors[name]
      }
      return newErrors
    })
  }, [validateField])

  /**
   * ========================================================================
   * MANEJO ROBUSTO DEL CAMBIO DE TIPO DE PRICING
   * ========================================================================
   */
  const handlePricingTypeChange = useCallback((newType) => {
    console.log(`🔄 Cambiando tipo de pricing de "${formData.pricingType}" a "${newType}"`)
    
    setFormData(prev => {
      const newFormData = { ...prev, pricingType: newType }
      
      if (newType === PRICING_TYPES.UNIT) {
        // Cambio a pricing por unidad - limpiar tramos
        console.log('🧹 Limpiando tramos para modo unitario')
        newFormData.tramos = [{ cantidad: '', precio: '' }]
        // Mantener precioUnidad si ya existe
      } else {
        // Cambio a pricing por tramos - limpiar precio unitario
        console.log('🧹 Limpiando precio unitario para modo tramos')
        newFormData.precioUnidad = ''
        
        // 🔧 FIX: AUTO-MAPEAR compraMinima al primer tramo y crear 2 tramos por defecto
        const compraMinima = prev.compraMinima || ''
        newFormData.tramos = [
          { cantidad: compraMinima, precio: '' },
          { cantidad: '', precio: '' }
        ]
        console.log('🎯 Auto-mapeando compraMinima al primer tramo:', compraMinima)
      }
      
      console.log('✅ Nuevo estado del formulario:', newFormData)
      return newFormData
    })
    
    setTouched(prev => ({ ...prev, pricingType: true }))
    setIsDirty(true)
    
    // Limpiar errores relacionados con el cambio de pricing
    setErrors(prev => {
      const newErrors = { ...prev }
      if (newType === PRICING_TYPES.UNIT) {
        delete newErrors.tramos
      } else {
        delete newErrors.precioUnidad
      }
      return newErrors
    })
  }, [formData.pricingType])

  /**
   * Actualizar campo del formulario
   */
  const updateField = useCallback(
    (fieldName, value) => {
      setFormData((prev) => {
        const newFormData = { ...prev, [fieldName]: value }
        
        // 🎯 SINCRONIZACIÓN AUTOMÁTICA: compraMinima -> primer tramo
        if (fieldName === 'compraMinima' && prev.pricingType === PRICING_TYPES.TIER) {
          console.log('🔄 Sincronizando compra mínima con primer tramo:', value)
          newFormData.tramos = [...prev.tramos]
          newFormData.tramos[0] = { ...newFormData.tramos[0], cantidad: value }
        }
        
        return newFormData
      })
      
      setIsDirty(true)

      // Limpiar error del campo si existe
      if (errors[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: null,
        }))
      }

      // Marcar como tocado
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }))
    },
    [errors]
  )

  /**
   * Actualizar múltiples campos
   */
  const updateFields = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }))
    setIsDirty(true)
  }, [])

  /**
   * Manejar blur de campo (validar al salir)
   */
  const handleFieldBlur = useCallback(
    (fieldName) => {
      const error = validateField(fieldName, formData[fieldName])
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }))
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }))
    },
    [formData, validateField]
  )

  /**
   * Submit del formulario - CON LOGGING DETALLADO
   */
  const submitForm = useCallback(async () => {
    console.log('🚀 [submitForm] Iniciando submit del formulario')
    console.log('📋 [submitForm] FormData actual:', formData)
    
    const isValid = validateForm()
    console.log('✅ [submitForm] Validación resultado:', isValid)
    
    if (!isValid) {
      console.log('❌ [submitForm] Formulario no válido, errores:', errors)
      return { success: false, errors: errors }
    }

    console.log('🔄 [submitForm] Mapeando formulario a producto...')
    const productData = mapFormToProduct(formData)
    console.log('📦 [submitForm] Datos del producto mapeados:', productData)

    let result
    if (isEditMode) {
      console.log('✏️  [submitForm] Modo edición - llamando updateProduct con ID:', productId)
      result = await updateProduct(productId, productData)
    } else {
      console.log('➕ [submitForm] Modo creación - llamando createProduct')
      result = await createProduct(productData)
    }

    console.log('📊 [submitForm] Resultado de la operación:', result)

    if (result.success) {
      setIsDirty(false)
      setTouched({})
      console.log('✅ [submitForm] Submit exitoso')
    } else {
      console.log('❌ [submitForm] Submit falló:', result.error)
    }

    return result
  }, [
    formData,
    errors,
    isEditMode,
    productId,
    validateForm,
    updateProduct,
    createProduct,
  ])

  /**
   * Reset del formulario
   */
  const resetForm = useCallback(() => {
    if (isEditMode && productId) {
      const product = uiProducts.find(
        (p) => p.productid?.toString() === productId?.toString()
      )
      setFormData(product ? mapProductToForm(product) : initialFormData)
    } else {
      setFormData(initialFormData)
    }
    setErrors({})
    setTouched({})
    setIsDirty(false)
  }, [isEditMode, productId, uiProducts])

  // Cargar producto cuando esté disponible
  useEffect(() => {
    if (isEditMode && productId && uiProducts.length > 0) {
      const product = uiProducts.find(
        (p) => p.productid?.toString() === productId?.toString()
      )
      if (product) {
        // Solo cargar si el formulario está vacío o es un producto diferente
        const currentProductId = formData.productid || formData.id
        if (!currentProductId || currentProductId.toString() !== productId.toString()) {
          setFormData(mapProductToForm(product))
        }
      }
    }
  }, [isEditMode, productId]) // REMOVIDO: uiProducts, formData.productid, formData.id

  return {
    // Estado del formulario
    formData,
    errors,
    touched,
    isDirty,
    isLoading,
    isEditMode,

    // Acciones
    updateField,
    updateFields,
    handleFieldBlur,
    handleInputChange,
    handlePricingTypeChange,
    submitForm,
    resetForm,
    validateForm,
    
    // Utilidades
    hasErrors: Object.values(errors).some((v) => !!v),
    isValid: Object.values(errors).every((v) => !v),
  }
}

/**
 * Hook simplificado para agregar productos
 */
export const useAddProduct = () => {
  return useProductForm()
}

/**
 * Hook simplificado para editar productos
 */
export const useEditProduct = (productId) => {
  return useProductForm(productId)
}
