/**
 * ============================================================================
 * USE PRODUCT FORM - HOOK PROFESIONAL PARA GESTIÓN DE FORMULARIOS
 * ============================================================================
 *
 * Hook refactorizado con arquitectura robusta que garantiza consistencia
 * en el manejo de productos por unidad y por tramos.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
    { min: '', max: '', precio: '' },
    { min: '', max: '', precio: '' }
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
  const [userHasTouchedImages, setUserHasTouchedImages] = useState(false)
  const [lastThumbSignature, setLastThumbSignature] = useState(null)

  // 🔧 FIX EDIT: Estado original para detectar cambios reales en modo edición
  const [originalFormData, setOriginalFormData] = useState(() => {
    if (productId) {
      const product = uiProducts.find(
        (p) => p.productid?.toString() === productId?.toString()
      )
      return product ? mapProductToForm(product) : initialFormData
    }
    return null
  })

  // Modo de edición - MOVIDO AQUÍ ANTES DE useMemo
  const isEditMode = Boolean(productId)

  // 🔧 FIX 4: Cálculo de isValid más robusto usando validación en tiempo real
  const isValid = React.useMemo(() => {
    const validationResult = ProductValidator.validateProduct(formData);
    return validationResult.isValid;
  }, [formData]);

  // Selective rehydration listener for thumbnail updates
  useEffect(() => {
    if (!productId) return
    function handleImagesPhase(e) {
      if (!e?.detail) return
      const { productId: evtProductId, phase, previousSignature, newSignature } = e.detail
      if (evtProductId !== productId) return
      if (!['thumbnails_ready','thumbnails_skipped_webp','thumbnails_partial'].includes(phase)) return
      if (userHasTouchedImages) return // respeto interacción del usuario
      // Reconsultar fila principal para obtener thumbnail_url y signature
      const supabase = window?.supabase || window?.supabaseClient
      if (!supabase) return
      supabase.from('product_images')
        .select('thumbnail_url,thumbnail_signature,image_url')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return
          const mainImage = formData.imagenes[0]
          // Actualizar sólo si antes estaba vacío el thumbnail y ahora existe
            if (mainImage && !mainImage.thumbnail_url && data.thumbnail_url) {
              setFormData(prev => ({
                ...prev,
                imagenes: prev.imagenes.map((img, idx) => idx === 0 ? { ...img, thumbnail_url: data.thumbnail_url } : img)
              }))
              setLastThumbSignature(data.thumbnail_signature || newSignature || previousSignature || null)
            }
        })
    }
    window.addEventListener('productImagesReady', handleImagesPhase)
    return () => window.removeEventListener('productImagesReady', handleImagesPhase)
  }, [productId, formData.imagenes, userHasTouchedImages])

  // 🔧 FIX EDIT: Función para comparar profundamente los datos del formulario
  const hasActualChanges = React.useMemo(() => {
    if (!isEditMode || !originalFormData) {
      return true; // En modo creación, siempre considerar que hay cambios
    }

    // Función auxiliar para comparar arrays de objetos
    const arraysEqual = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      return arr1.every((item, index) => {
        const item2 = arr2[index];
        if (typeof item === 'object' && typeof item2 === 'object') {
          return JSON.stringify(item) === JSON.stringify(item2);
        }
        return item === item2;
      });
    };

    // Función auxiliar para comparar imágenes (solo URLs y nombres, no metadatos)
    const imagesEqual = (images1, images2) => {
      if (images1.length !== images2.length) return false;
      return images1.every((img1, index) => {
        const img2 = images2[index];
        return img1.url === img2.url && img1.name === img2.name;
      });
    };

    // Comparar campos básicos
    const basicFieldsChanged = 
      formData.nombre !== originalFormData.nombre ||
      formData.descripcion !== originalFormData.descripcion ||
      formData.categoria !== originalFormData.categoria ||
      formData.stock !== originalFormData.stock ||
      formData.compraMinima !== originalFormData.compraMinima ||
      formData.pricingType !== originalFormData.pricingType ||
      formData.precioUnidad !== originalFormData.precioUnidad ||
      formData.negociable !== originalFormData.negociable ||
      formData.activo !== originalFormData.activo;

    // Comparar tramos
    const tramosChanged = !arraysEqual(formData.tramos, originalFormData.tramos);

    // Comparar imágenes (solo URLs, no metadatos como file)
    const imagenesChanged = !imagesEqual(formData.imagenes, originalFormData.imagenes);

    // Comparar especificaciones
    const specificationsChanged = !arraysEqual(formData.specifications, originalFormData.specifications);

    // Comparar regiones de entrega
    const shippingRegionsChanged = !arraysEqual(formData.shippingRegions, originalFormData.shippingRegions);

    const hasChanges = basicFieldsChanged || tramosChanged || imagenesChanged || specificationsChanged || shippingRegionsChanged;

    console.log('🔍 [hasActualChanges] Detección de cambios:', {
      basicFieldsChanged,
      tramosChanged,
      imagenesChanged,
      specificationsChanged,
      shippingRegionsChanged,
      hasChanges
    });

    return hasChanges;
  }, [formData, originalFormData, isEditMode]);

  // Estado de carga
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
      // Preservar referencia al producto para controles internos
      productid: product.productid,
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
            min: t.min_quantity?.toString() || '',
            max: t.max_quantity?.toString() || '',
            precio: t.price?.toString() || '',
          }))
        : [
            { min: '', max: '', precio: '' },
            { min: '', max: '', precio: '' }
          ],
        
      imagenes: product.imagenes
        ? product.imagenes.map((url, index) => ({
            id: `existing_${index}_${Date.now()}`,
            url: url,
            name: url.split('/').pop() || `imagen_${index + 1}`,
            isExisting: true,
            // 🔧 FIX EDIT: Crear un objeto file simulado para evitar errores de validación
            file: {
              type: 'image/jpeg', // Tipo por defecto para imágenes existentes
              name: url.split('/').pop() || `imagen_${index + 1}`,
              size: 0, // Tamaño 0 para identificar como existente
            }
          }))
        : [],
        
      documentos: product.documentos || [],
      specifications: product.specifications || [{ key: '', value: '' }],
      negociable: product.negociable || false,
      activo: product.activo !== false,
      shippingRegions: convertDbRegionsToForm(product.delivery_regions || []),
    }
  }

  const markImagesTouched = () => {
    if (!userHasTouchedImages) setUserHasTouchedImages(true)
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

    // Obtener supplierId del localStorage
    const supplierId = localStorage.getItem('user_id')
    if (!supplierId) {
      throw new Error('No se pudo obtener el ID del proveedor')
    }

    const productData = {
      productnm: formData.nombre,
      description: formData.descripcion,
      category: formData.categoria,
      supplier_id: supplierId, // ✅ CRÍTICO: Agregar supplier_id
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
    
    if (formData.pricingType === PRICING_TYPES.UNIT) {
      // Modo Por Unidad
      const unitPrice = Math.min(parseFloat(formData.precioUnidad) || 0, PRICE_LIMITS.MAX_PRICE)
      productData.price = unitPrice
      productData.product_type = PRODUCT_TYPES_DB.UNIT
      // CRÍTICO: Limpiar completamente los price tiers
      productData.priceTiers = []
      
      } else if (formData.pricingType === PRICING_TYPES.TIER) {
      // Modo Por Tramo
      productData.price = 0 // Precio base para productos por tramo
      productData.product_type = PRODUCT_TYPES_DB.TIER
      
      // Filtrar y mapear tramos válidos
      const validTiers = formData.tramos
        .filter((t) => t.min && t.precio)
        .map((t) => ({
          min: Math.min(parseInt(t.min), QUANTITY_LIMITS.MAX_QUANTITY),
          max: t.max ? Math.min(parseInt(t.max), QUANTITY_LIMITS.MAX_QUANTITY) : null,
          precio: Math.min(parseFloat(t.precio), PRICE_LIMITS.MAX_PRICE),
        }))
      
      productData.priceTiers = validTiers
      
      // 🔧 FIX 1: SINCRONIZAR compraMinima con el primer tramo
      if (validTiers.length > 0) {
        const primerTramoMin = validTiers[0].min
        console.log(`🔄 [mapFormToProduct] Sincronizando compra mínima con primer tramo: ${productData.minimum_purchase} -> ${primerTramoMin}`)
        productData.minimum_purchase = primerTramoMin
      }
      
      }

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
    setFormData(prev => {
      const newFormData = { ...prev, pricingType: newType }
  // (Eliminado) Llamada accidental a markImagesTouched aquí causaba error de sintaxis.
      
      if (newType === PRICING_TYPES.UNIT) {
        // Cambio a pricing por unidad - limpiar tramos
        newFormData.tramos = [{ min: '', max: '', precio: '' }]
        // Mantener precioUnidad si ya existe
      } else {
        // Cambio a pricing por tramos - limpiar precio unitario
        newFormData.precioUnidad = ''
        
        // 🔧 FIX: AUTO-MAPEAR compraMinima al primer tramo y crear 2 tramos por defecto
        const compraMinima = prev.compraMinima || '1'
        newFormData.tramos = [
          { min: compraMinima, max: '', precio: '' },
          { min: '', max: '', precio: '' }
        ]
        
        // 🔧 NUEVO: Si no hay compra mínima definida, usar el valor por defecto
        if (!prev.compraMinima || prev.compraMinima === '') {
          newFormData.compraMinima = '1'
        }
      }
      
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
  }, [])

  /**
   * Actualizar campo del formulario
   */
  const updateField = useCallback(
    (fieldName, value) => {
      setFormData((prev) => {
        const newFormData = { ...prev, [fieldName]: value }
        
        // 🎯 SINCRONIZACIÓN AUTOMÁTICA: compraMinima -> primer tramo
        if (fieldName === 'compraMinima' && prev.pricingType === PRICING_TYPES.TIER) {
          newFormData.tramos = [...prev.tramos]
          newFormData.tramos[0] = { ...newFormData.tramos[0], min: value }
        }
        
        // 🔧 NUEVO: SINCRONIZACIÓN AUTOMÁTICA: primer tramo -> compraMinima
        if (fieldName === 'tramos' && prev.pricingType === PRICING_TYPES.TIER) {
          const tramos = Array.isArray(value) ? value : []
          if (tramos.length > 0 && tramos[0] && tramos[0].min) {
            const minPrimerTramo = parseInt(tramos[0].min) || 0
            if (minPrimerTramo > 0 && parseInt(prev.compraMinima) !== minPrimerTramo) {
              console.log(`🔄 [useProductForm] Sincronizando compra mínima: ${prev.compraMinima} -> ${minPrimerTramo}`)
              newFormData.compraMinima = minPrimerTramo.toString()
            }
          }
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
    const isValid = validateForm()
    if (!isValid) {
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
      } else {
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

  // Cargar producto cuando uiProducts lo provea (hidratar una sola vez)
  const hasHydratedRef = useRef(false)
  useEffect(() => {
    if (!isEditMode || !productId) return
    if (hasHydratedRef.current) return
    if (!uiProducts || uiProducts.length === 0) return

    const product = uiProducts.find(
      (p) => p.productid?.toString() === productId?.toString()
    )
    if (!product) return

    const mappedProduct = mapProductToForm(product)
    setFormData(mappedProduct)
    setOriginalFormData(mappedProduct)
    hasHydratedRef.current = true
  }, [isEditMode, productId, uiProducts])

  // 🔧 NUEVO: Efecto para sincronizar compra mínima con primer tramo cuando es pricing por volumen
  useEffect(() => {
    if (formData.pricingType === PRICING_TYPES.TIER && formData.tramos.length > 0) {
      const primerTramo = formData.tramos[0]
      if (primerTramo && primerTramo.min && primerTramo.min !== '') {
        const minPrimerTramo = parseInt(primerTramo.min) || 0
        // Solo actualizar si la compra mínima actual es diferente
        if (minPrimerTramo > 0 && parseInt(formData.compraMinima) !== minPrimerTramo) {
          console.log(`🔄 [useProductForm] Auto-sincronizando compra mínima: ${formData.compraMinima} -> ${minPrimerTramo}`)
          setFormData(prev => ({ ...prev, compraMinima: minPrimerTramo.toString() }))
        }
      }
    }
  }, [formData.pricingType, formData.tramos, formData.compraMinima])

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
  // Exponer para que la UI marque interacción con imágenes y bloquee rehidratación automática
  markImagesTouched,
    
    // Utilidades
    hasErrors: Object.values(errors).some((v) => !!v),
    isValid, // 🔧 FIX 4: Usar el isValid calculado con useMemo para mayor precisión
    hasActualChanges, // 🔧 FIX EDIT: Nueva funcionalidad para detectar cambios reales
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
