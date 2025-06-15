/**
 * ============================================================================
 * USE PRODUCT FORM - HOOK PARA GESTIÓN DE FORMULARIOS DE PRODUCTOS
 * ============================================================================
 *
 * Hook especializado para manejar la lógica de formularios de productos,
 * incluyendo validaciones, estado del formulario y operaciones.
 */

import { useState, useCallback, useEffect } from 'react'
import { useSupplierProducts } from './useSupplierProducts'

// Valores iniciales del formulario
const initialFormData = {
  nombre: '',
  descripcion: '',
  categoria: '',
  stock: '',
  compraMinima: '',
  pricingType: 'Por Unidad',
  precioUnidad: '',
  tramos: [{ cantidad: '', precio: '' }],
  imagenes: [],
  documentos: [],
  specifications: [{ key: '', value: '' }],
  negociable: false,
  activo: true,
}

// Reglas de validación
const validationRules = {
  nombre: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  descripcion: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  categoria: {
    required: true,
  },
  stock: {
    required: true,
    min: 0,
    type: 'number',
  },
  compraMinima: {
    required: true,
    min: 1,
    type: 'number',
  },
  precioUnidad: {
    required: true,
    min: 0,
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
   * Mapear producto a formato de formulario
   */
  function mapProductToForm(product) {
    return {
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      stock: product.stock?.toString() || '',
      compraMinima: product.compraMinima?.toString() || '',
      pricingType: product.priceTiers?.length > 0 ? 'Por Tramo' : 'Por Unidad',
      precioUnidad: product.precio?.toString() || '',
      tramos:
        product.priceTiers?.length > 0
          ? product.priceTiers.map((t) => ({
              cantidad: t.min_quantity?.toString() || '',
              precio: t.price?.toString() || '',
            }))
          : [{ cantidad: '', precio: '' }],
      imagenes: product.imagenes
        ? product.imagenes.map((url, index) => ({
            id: `existing_${index}_${Date.now()}`,
            url: url,
            name: url.split('/').pop() || `imagen_${index + 1}`,
            isExisting: true, // Flag para indicar que es una imagen existente
          }))
        : [],
      documentos: product.documentos || [],
      specifications: product.specifications || [{ key: '', value: '' }],
      negociable: product.negociable || false,
      activo: product.activo !== false,
    }
  }

  /**
   * Mapear formulario a formato de producto
   */
  function mapFormToProduct(formData) {
    const productData = {
      productnm: formData.nombre,
      description: formData.descripcion,
      category: formData.categoria,
      productqty: parseInt(formData.stock) || 0,
      minimum_purchase: parseInt(formData.compraMinima) || 1,
      negotiable: formData.negociable,
      is_active: formData.activo,
      imagenes: formData.imagenes,
      documentos: formData.documentos,
      specifications: formData.specifications.filter((s) => s.key && s.value),
    }

    if (formData.pricingType === 'Por Unidad') {
      productData.price = parseFloat(formData.precioUnidad) || 0
      productData.product_type = 'unit'
    } else {
      productData.product_type = 'tier'
      productData.priceTiers = formData.tramos
        .filter((t) => t.cantidad && t.precio)
        .map((t) => ({
          cantidad: parseInt(t.cantidad),
          precio: parseFloat(t.precio),
        }))
    }

    return productData
  }

  /**
   * Validar un campo específico
   */
  const validateField = useCallback((fieldName, value) => {
    const rule = validationRules[fieldName]
    if (!rule) return null

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

    return null
  }, [])

  /**
   * Validar todo el formulario
   */
  const validateForm = useCallback(() => {
    const newErrors = {}

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    // Validaciones adicionales
    if (formData.pricingType === 'Por Tramo') {
      const validTramos = formData.tramos.filter((t) => t.cantidad && t.precio)
      if (validTramos.length === 0) {
        newErrors.tramos = 'Debe definir al menos un tramo de precios'
      }
    }

    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Debe subir al menos una imagen'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validateField])

  /**
   * Actualizar campo del formulario
   */
  const updateField = useCallback(
    (fieldName, value) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }))
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
   * Enviar formulario
   */
  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, errors: errors }
    }

    const productData = mapFormToProduct(formData)

    let result
    if (isEditMode) {
      result = await updateProduct(productId, productData)
    } else {
      result = await createProduct(productData)
    }

    if (result.success) {
      setIsDirty(false)
      setTouched({})
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
        setFormData(mapProductToForm(product))
      }
    }
  }, [isEditMode, productId, uiProducts])

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
    submitForm,
    resetForm,
    validateForm,

    // Utilidades
    hasErrors: Object.keys(errors).some((key) => errors[key]),
    isValid: Object.keys(errors).length === 0,
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
