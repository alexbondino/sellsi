/**
 * ============================================================================
 * PRODUCT PRICE TIERS HOOK - GESTIÓN DE TRAMOS DE PRECIO
 * ============================================================================
 *
 * Hook especializado únicamente en la gestión de tramos de precio de productos.
 * Se enfoca en validación, cálculos y almacenamiento de pricing tiers.
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'

const useProductPriceTiers = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  loading: false,
  error: null,
  processingTiers: {}, // { productId: boolean }

  // ============================================================================
  // OPERACIONES DE PRICING TIERS
  // ============================================================================

  /**
   * Procesar tramos de precio - INCLUYE LIMPIEZA PARA ARRAY VACÍO
   */
  processPriceTiers: async (productId, priceTiers) => {
    console.log('🔧 [processPriceTiers] Procesando tramos para producto:', productId)
    console.log('📊 [processPriceTiers] PriceTiers recibidos:', priceTiers)
    
    set((state) => ({
      processingTiers: { ...state.processingTiers, [productId]: true },
      error: null,
    }))

    try {
      // SIEMPRE limpiar tramos existentes primero
      console.log('🧹 [processPriceTiers] Limpiando tramos existentes...')
      const { error: deleteError } = await supabase
        .from('product_quantity_ranges')
        .delete()
        .eq('product_id', productId)

      if (deleteError) {
        console.error('❌ [processPriceTiers] Error limpiando tramos:', deleteError)
        throw deleteError
      }
      console.log('✅ [processPriceTiers] Tramos existentes limpiados')

      // Si no hay tramos o está vacío, terminar aquí (modo Por Unidad)
      if (!priceTiers || priceTiers.length === 0) {
        console.log('ℹ️  [processPriceTiers] No hay tramos para insertar (modo Por Unidad)')
        set((state) => ({
          processingTiers: { ...state.processingTiers, [productId]: false },
        }))
        return { success: true, data: [] }
      }

      // Validar y preparar tramos para insertar
      console.log('📋 [processPriceTiers] Validando tramos...')
      const validationResult = get().validatePriceTiers(priceTiers)
      
      if (!validationResult.isValid) {
        console.error('❌ [processPriceTiers] Tramos inválidos:', validationResult.errors)
        throw new Error(`Tramos de precio inválidos: ${validationResult.errors.join(', ')}`)
      }

      // Preparar tramos para insertar
      const tiersToInsert = validationResult.data.map((t) => ({
        product_id: productId,
        min_quantity: Number(t.cantidad),
        max_quantity: t.maxCantidad ? Number(t.maxCantidad) : null,
        price: Number(t.precio),
      }))

      console.log('💾 [processPriceTiers] Insertando nuevos tramos:', tiersToInsert)

      // Insertar nuevos tramos
      if (tiersToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('product_quantity_ranges')
          .insert(tiersToInsert)

        if (insertError) {
          console.error('❌ [processPriceTiers] Error insertando tramos:', insertError)
          throw insertError
        }
        console.log('✅ [processPriceTiers] Tramos insertados exitosamente')
      }

      set((state) => ({
        processingTiers: { ...state.processingTiers, [productId]: false },
      }))

      console.log('✅ [processPriceTiers] Proceso completado exitosamente')
      return { success: true, data: validationResult.data }
    } catch (error) {
      console.error('❌ [processPriceTiers] Error:', error)
      set((state) => ({
        processingTiers: { ...state.processingTiers, [productId]: false },
        error: `Error procesando tramos de precio: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Validar tramos de precio
   */
  validatePriceTiers: (priceTiers) => {
    const errors = []
    const validatedTiers = []

    for (let i = 0; i < priceTiers.length; i++) {
      const tier = priceTiers[i]
      
      // Validar campos requeridos
      if (!tier.cantidad || isNaN(Number(tier.cantidad)) || Number(tier.cantidad) <= 0) {
        errors.push(`Tramo ${i + 1}: Cantidad mínima debe ser un número mayor a 0`)
        continue
      }

      if (!tier.precio || isNaN(Number(tier.precio)) || Number(tier.precio) <= 0) {
        errors.push(`Tramo ${i + 1}: Precio debe ser un número mayor a 0`)
        continue
      }

      // Validar cantidad máxima si se proporciona
      if (tier.maxCantidad && (isNaN(Number(tier.maxCantidad)) || Number(tier.maxCantidad) <= Number(tier.cantidad))) {
        errors.push(`Tramo ${i + 1}: Cantidad máxima debe ser mayor a la cantidad mínima`)
        continue
      }

      // Validar rangos razonables
      const cantidad = Number(tier.cantidad)
      const precio = Number(tier.precio)
      const maxCantidad = tier.maxCantidad ? Number(tier.maxCantidad) : null

      if (cantidad > 10000000) {
        errors.push(`Tramo ${i + 1}: Cantidad mínima muy alta (máximo 10,000,000)`)
      }

      if (precio > 10000000) {
        errors.push(`Tramo ${i + 1}: Precio muy alto (máximo $10,000,000)`)
      }

      if (maxCantidad && maxCantidad > 10000000) {
        errors.push(`Tramo ${i + 1}: Cantidad máxima muy alta (máximo 10,000,000)`)
      }

      // Si pasa validaciones, agregar a la lista
      validatedTiers.push({
        cantidad: cantidad,
        precio: precio,
        maxCantidad: maxCantidad,
        descuento: tier.descuento || null,
        descripcion: tier.descripcion || null,
      })
    }

    // Validar que no haya solapamientos en rangos
    const sortedTiers = [...validatedTiers].sort((a, b) => a.cantidad - b.cantidad)
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1]
      const currentTier = sortedTiers[i]
      
      if (prevTier.maxCantidad && currentTier.cantidad <= prevTier.maxCantidad) {
        errors.push(`Solapamiento de rangos: Tramo ${i} se solapa con el anterior`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: sortedTiers
    }
  },

  /**
   * Calcular precio para una cantidad específica
   */
  calculatePriceForQuantity: async (productId, quantity) => {
    try {
      const { data: tiers, error } = await supabase
        .from('product_quantity_ranges')
        .select('*')
        .eq('product_id', productId)
        .order('min_quantity', { ascending: true })

      if (error) throw error

      if (!tiers || tiers.length === 0) {
        // No hay tramos, usar precio base del producto
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('price')
          .eq('productid', productId)
          .single()

        if (productError) throw productError
        
        return {
          price: product.price,
          tierUsed: null,
          isBasePriceApplied: true
        }
      }

      // Buscar el tier aplicable
      let applicableTier = null
      
      for (const tier of tiers) {
        if (quantity >= tier.min_quantity) {
          if (!tier.max_quantity || quantity <= tier.max_quantity) {
            applicableTier = tier
            break
          }
        }
      }

      if (!applicableTier) {
        // Si no hay tier aplicable, usar el último (mayor cantidad)
        applicableTier = tiers[tiers.length - 1]
      }

      return {
        price: applicableTier.price,
        tierUsed: applicableTier,
        totalAmount: applicableTier.price * quantity,
        savings: null // Se puede calcular comparando con precio base
      }
    } catch (error) {
      set({ error: `Error calculando precio: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Obtener todos los tramos de un producto
   */
  getProductTiers: async (productId) => {
    try {
      const { data: tiers, error } = await supabase
        .from('product_quantity_ranges')
        .select('*')
        .eq('product_id', productId)
        .order('min_quantity', { ascending: true })

      if (error) throw error

      return { success: true, data: tiers || [] }
    } catch (error) {
      set({ error: `Error obteniendo tramos: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Generar tramos automáticamente basados en descuentos por volumen
   */
  generateAutomaticTiers: (basePrice, discountRules = []) => {
    const defaultRules = [
      { minQuantity: 1, maxQuantity: 9, discountPercent: 0 },
      { minQuantity: 10, maxQuantity: 49, discountPercent: 5 },
      { minQuantity: 50, maxQuantity: 99, discountPercent: 10 },
      { minQuantity: 100, maxQuantity: null, discountPercent: 15 }
    ]

    const rules = discountRules.length > 0 ? discountRules : defaultRules
    
    return rules.map(rule => ({
      cantidad: rule.minQuantity,
      maxCantidad: rule.maxQuantity,
      precio: basePrice * (1 - rule.discountPercent / 100),
      descuento: rule.discountPercent,
      descripcion: `${rule.discountPercent}% descuento por volumen`
    }))
  },

  /**
   * Validar coherencia de precios (descendente con la cantidad)
   */
  validatePriceCoherence: (priceTiers) => {
    const errors = []
    const sortedTiers = [...priceTiers].sort((a, b) => a.cantidad - b.cantidad)
    
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1]
      const currentTier = sortedTiers[i]
      
      if (currentTier.precio >= prevTier.precio) {
        errors.push(`Inconsistencia de precios: Tramo ${i + 1} debe tener menor precio que el anterior para incentivar compras por volumen`)
      }
    }
    
    return {
      isCoherent: errors.length === 0,
      errors,
      suggestions: errors.length > 0 ? ['Considera aplicar descuentos progresivos por volumen'] : []
    }
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Obtener estado de procesamiento
   */
  isProcessingTiers: (productId) => {
    const state = get()
    return state.processingTiers[productId] || false
  },

  /**
   * Formatear precio para mostrar
   */
  formatPrice: (price, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  },

  /**
   * Calcular ahorro total comparando con precio base
   */
  calculateSavings: (basePrice, tierPrice, quantity) => {
    const baseCost = basePrice * quantity
    const tierCost = tierPrice * quantity
    const savings = baseCost - tierCost
    const savingsPercent = (savings / baseCost) * 100
    
    return {
      absoluteSavings: savings,
      percentSavings: savingsPercent,
      baseCost,
      tierCost
    }
  },
}))

export default useProductPriceTiers
