import { supabase } from '../supabase';
import { convertDbRegionsToForm, convertFormRegionsToDb } from '../../utils/shippingRegionsUtils';

const TABLE = 'supplier_shipping_region_presets';

function validateRegions(regions = []) {
  if (!Array.isArray(regions)) throw new Error('regions debe ser un array');
  regions.forEach(r => {
    if (!r.region) throw new Error('Falta region');
    const price = r.price ?? r.shippingValue;
    const days = r.delivery_days ?? r.maxDeliveryDays;
    if (price == null || isNaN(price) || price < 0) throw new Error('Precio inválido');
    if (days == null || isNaN(days) || days < 1) throw new Error('delivery_days inválido');
  });
}

export async function getPresets(supplierId) {
  if (!supplierId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('preset_index, name, regions')
    .eq('supplier_id', supplierId)
    .order('preset_index', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => ({
    index: row.preset_index,
    name: row.name,
    regionsDb: row.regions || [],
    regionsDisplay: convertDbRegionsToForm(row.regions || [])
  }));
}

export async function upsertPreset(supplierId, presetIndex, name, displayRegions) {
  if (!supplierId) throw new Error('supplierId requerido');
  if (![1,2,3].includes(presetIndex)) throw new Error('presetIndex inválido');
  const dbRegions = convertFormRegionsToDb(displayRegions || []);
  validateRegions(dbRegions);
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      supplier_id: supplierId,
      preset_index: presetIndex,
      name: name?.trim() || `Config. ${presetIndex}`,
      regions: dbRegions
    }, { onConflict: 'supplier_id,preset_index' });
  if (error) throw error;
  return true;
}

export async function renamePreset(supplierId, presetIndex, newName) {
  if (!newName?.trim()) throw new Error('Nombre inválido');
  const { error } = await supabase
    .from(TABLE)
    .update({ name: newName.trim() })
    .eq('supplier_id', supplierId)
    .eq('preset_index', presetIndex);
  if (error) throw error;
  return true;
}

export async function deletePreset(supplierId, presetIndex) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('supplier_id', supplierId)
    .eq('preset_index', presetIndex);
  if (error) throw error;
  return true;
}
