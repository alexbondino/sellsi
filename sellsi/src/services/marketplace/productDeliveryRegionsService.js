import { supabase } from '../supabase';

// Obtener regiones de entrega de un producto
export async function fetchProductRegions(productId) {

  
  const { data, error } = await supabase
    .from('product_delivery_regions')
    .select('id, region, price, delivery_days')
    .eq('product_id', productId);

  if (error) {
    console.error('[productDeliveryRegionsService] fetchProductRegions - Error:', error);
    throw error;
  }
  

  return data || [];
}

// Guardar regiones de entrega (sobrescribe todas)
export async function saveProductRegions(productId, regions) {

  
  // Elimina las regiones existentes

  const { error: deleteError } = await supabase
    .from('product_delivery_regions')
    .delete()
    .eq('product_id', productId);

  if (deleteError) {
    console.error('[productDeliveryRegionsService] saveProductRegions - Error eliminando regiones:', deleteError);
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
    console.error('[productDeliveryRegionsService] saveProductRegions - Error insertando regiones:', insertError);
    throw insertError;
  }
  

}
