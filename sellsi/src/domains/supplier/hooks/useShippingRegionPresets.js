import { useCallback, useEffect, useState } from 'react';
import { getPresets, upsertPreset, renamePreset, deletePreset } from '../../../services/supplier/shippingRegionPresetsService';

export function useShippingRegionPresets(supplierId) {
  const [presets, setPresets] = useState([]); // [{index,name,regionsDisplay}]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true); setError(null);
    try {
      const data = await getPresets(supplierId);
      setPresets(data);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [supplierId]);

  useEffect(() => { load(); }, [load]);

  const savePreset = useCallback(async (index, name, regionsDisplay) => {
    setSaving(true); setError(null);
    try {
      await upsertPreset(supplierId, index, name, regionsDisplay);
      await load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }, [supplierId, load]);

  const rename = useCallback(async (index, newName) => {
    setSaving(true); setError(null);
    try { await renamePreset(supplierId, index, newName); await load(); }
    catch(e){ setError(e.message); } finally { setSaving(false); }
  }, [supplierId, load]);

  const remove = useCallback(async (index) => {
    setSaving(true); setError(null);
    try { await deletePreset(supplierId, index); await load(); }
    catch(e){ setError(e.message); } finally { setSaving(false); }
  }, [supplierId, load]);

  const getPresetByIndex = useCallback((i) => presets.find(p => p.index === i) || null, [presets]);

  return { presets, loading, saving, error, reload: load, savePreset, rename, remove, getPresetByIndex };
}
