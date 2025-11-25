import { supabase } from '../../../services/supabase';

/**
 * Servicio para manejar regiones de entrega de productos
 */

/**
 * Obtener regiones de entrega de un producto
 * @param {string} productId - ID del producto
 * @returns {Promise<Array>} - Array de regiones con precios y tiempos de entrega
 */
export async function fetchProductRegions(productId) {
  const { data, error } = await supabase
    .from('product_delivery_regions')
    .select('id, region, price, delivery_days')
    .eq('product_id', productId);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Guardar regiones de entrega (sobrescribe todas las existentes)
 * @param {string} productId - ID del producto
 * @param {Array} regions - Array de regiones {region, price, delivery_days}
 * @returns {Promise<void>}
 */
export async function saveProductRegions(productId, regions) {
  // Elimina las regiones existentes
  const { error: deleteError } = await supabase
    .from('product_delivery_regions')
    .delete()
    .eq('product_id', productId);

  if (deleteError) {
    throw deleteError;
  }

  // Preparar datos para inserción
  const insertData = regions.map(r => ({
    product_id: productId,
    region: r.region,
    price: r.price != null && !isNaN(r.price) ? Number(r.price) : 0,
    delivery_days: r.delivery_days != null && !isNaN(r.delivery_days) ? Number(r.delivery_days) : 0,
  }));

  // Inserta las nuevas regiones
  const { error: insertError } = await supabase
    .from('product_delivery_regions')
    .insert(insertData);

  if (insertError) {
    throw insertError;
  }
}
