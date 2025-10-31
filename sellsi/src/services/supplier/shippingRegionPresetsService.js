import { supabase } from '../supabase';
import { convertDbRegionsToForm, convertFormRegionsToDb } from '../../utils/shippingRegionsUtils';

const MAX_NAME_LENGTH = 15;
const TABLE = 'supplier_shipping_region_presets';

// Micro‑cache + in‑flight dedupe (por supplier)
const _presetCache = new Map(); // supplierId -> { ts, data }
const _presetInFlight = new Map(); // supplierId -> Promise
const PRESET_TTL_MS = 3000; // 3s: suficiente para cubrir doble-mount StrictMode y ráfagas UI

function now() { return Date.now(); }

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

function _mapRows(data) {
  return (data || []).map(row => ({
    index: row.preset_index,
    name: row.name,
    regionsDb: row.regions || [],
    regionsDisplay: convertDbRegionsToForm(row.regions || [])
  }));
}

export async function getPresets(supplierId) {
  if (!supplierId) return [];

  // Cache válida
  const cached = _presetCache.get(supplierId);
  if (cached && (now() - cached.ts) < PRESET_TTL_MS) {
    return cached.data;
  }

  // Promesa en vuelo
  const inflight = _presetInFlight.get(supplierId);
  if (inflight) {
    return inflight;
  }

  const p = (async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('preset_index, name, regions')
        .eq('supplier_id', supplierId)
        .order('preset_index', { ascending: true });
      if (error) throw error;
      const mapped = _mapRows(data);
      _presetCache.set(supplierId, { ts: now(), data: mapped });
      return mapped;
    } finally {
      _presetInFlight.delete(supplierId);
    }
  })();

  _presetInFlight.set(supplierId, p);
  return p;
}

function _invalidate(supplierId) {
  _presetCache.delete(supplierId);
  // No tocamos in-flight; se limpiará al resolver
}

export async function upsertPreset(supplierId, presetIndex, name, displayRegions) {
  if (!supplierId) throw new Error('supplierId requerido');
  if (![1,2,3].includes(presetIndex)) throw new Error('presetIndex inválido');
  const dbRegions = convertFormRegionsToDb(displayRegions || []);
  validateRegions(dbRegions);
  const finalName = (name?.trim() || `Config. ${presetIndex}`).slice(0, MAX_NAME_LENGTH);
  if (finalName.length > MAX_NAME_LENGTH) throw new Error(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      supplier_id: supplierId,
      preset_index: presetIndex,
      name: finalName,
      regions: dbRegions
    }, { onConflict: 'supplier_id,preset_index' });
  if (error) throw error;
  _invalidate(supplierId);
  return true;
}

export async function renamePreset(supplierId, presetIndex, newName) {
  if (!newName?.trim()) throw new Error('Nombre inválido');
  const finalName = newName.trim().slice(0, MAX_NAME_LENGTH);
  if (finalName.length > MAX_NAME_LENGTH) throw new Error(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
  const { error } = await supabase
    .from(TABLE)
    .update({ name: finalName })
    .eq('supplier_id', supplierId)
    .eq('preset_index', presetIndex);
  if (error) throw error;
  _invalidate(supplierId);
  return true;
}

export async function deletePreset(supplierId, presetIndex) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('supplier_id', supplierId)
    .eq('preset_index', presetIndex);
  if (error) throw error;
  _invalidate(supplierId);
  return true;
}
