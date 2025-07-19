import { supabase } from '../supabase'

/**
 * Servicio para manejar operaciones con especificaciones de productos
 * 
 * NOTA: En esta BD, las especificaciones están almacenadas directamente en la tabla 'products'
 * como campos 'spec_name' y 'spec_value' (un solo par por producto), no en una tabla separada.
 */

/**
 * Obtiene especificaciones de un producto de la tabla products
 * @param {string} productId - ID del producto
 * @returns {Promise<Array>} - Array con la especificación del producto (máximo 1 elemento)
 */
export const getProductSpecifications = async (productId) => {
  try {
    // Debug log removed
    
    const { data, error } = await supabase
      .from('products')
      .select('spec_name, spec_value')
      .eq('productid', productId)
      .single()

    if (error) {
      // Debug log removed
      return []
    }

    // Si no hay especificación o son valores por defecto, retornar array vacío
    if (!data || !data.spec_name || !data.spec_value || 
        data.spec_name === 'N/A' || data.spec_value === 'N/A') {
      // Debug log removed
      return []
    }

    // Retornar como array para mantener compatibilidad con el formato esperado
    return [{
      spec_name: data.spec_name,
      spec_value: data.spec_value,
      product_id: productId
    }]
  } catch (error) {
    console.warn(`⚠️ Error al consultar especificaciones del producto ${productId}:`, error.message)
    return []
  }
}

/**
 * Actualiza las especificaciones de un producto en la tabla products
 * @param {string} productId - ID del producto
 * @param {Array} specifications - Array de especificaciones {key, value}
 * @returns {Promise<boolean>} - true si fue exitoso
 */
export const updateProductSpecifications = async (productId, specifications) => {
  try {
    if (!specifications || specifications.length === 0) {
      console.debug('📋 No hay especificaciones para actualizar')
      // Limpiar especificaciones (establecer valores por defecto)
      return await clearProductSpecifications(productId)
    }

    // Tomar solo la primera especificación (la BD solo soporta una)
    const firstSpec = specifications.find(spec => spec.key && spec.value)
    
    if (!firstSpec) {
      console.debug('📋 No hay especificaciones válidas para actualizar')
      return await clearProductSpecifications(productId)
    }

    // Actualizar especificación del producto
    
    const { error } = await supabase
      .from('products')
      .update({
        spec_name: firstSpec.key,
        spec_value: firstSpec.value,
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      console.error('❌ Error actualizando especificación:', error)
      return false
    }

    if (specifications.length > 1) {
      console.warn(`⚠️ Advertencia: Solo se pudo guardar la primera especificación. La BD actual solo soporta una especificación por producto.`)
    }

    // Especificación actualizada exitosamente
    return true
  } catch (error) {
    console.error('❌ Error actualizando especificación:', error)
    return false
  }
}

/**
 * Inserta especificaciones de un producto (alias para updateProductSpecifications)
 * @param {string} productId - ID del producto
 * @param {Array} specifications - Array de especificaciones {key, value}
 * @param {string} category - Categoría (no utilizada en esta estructura de BD)
 * @returns {Promise<boolean>} - true si fue exitoso
 */
export const insertProductSpecifications = async (productId, specifications, category = 'general') => {
  console.debug(`🔧 insertProductSpecifications llamada - redirigiendo a updateProductSpecifications`)
  return await updateProductSpecifications(productId, specifications)
}

/**
 * Elimina especificaciones de un producto (establece valores por defecto)
 * @param {string} productId - ID del producto
 * @returns {Promise<boolean>} - true si fue exitoso
 */
export const deleteProductSpecifications = async (productId) => {
  return await clearProductSpecifications(productId)
}

/**
 * Limpia las especificaciones estableciendo valores por defecto
 * @param {string} productId - ID del producto
 * @returns {Promise<boolean>} - true si fue exitoso
 */
const clearProductSpecifications = async (productId) => {
  try {
    // Limpiando especificaciones del producto
    
    const { error } = await supabase
      .from('products')
      .update({
        spec_name: 'N/A',
        spec_value: 'N/A',
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId)

    if (error) {
      console.error('❌ Error limpiando especificaciones:', error)
      return false
    }

    // Especificaciones limpiadas exitosamente
    return true
  } catch (error) {
    console.error('❌ Error limpiando especificaciones:', error)
    return false
  }
}
