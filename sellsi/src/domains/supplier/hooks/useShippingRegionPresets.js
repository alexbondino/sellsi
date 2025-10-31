import { useCallback, useEffect, useState, useRef } from 'react';
import { getPresets, upsertPreset, renamePreset, deletePreset } from '../../../services/supplier/shippingRegionPresetsService';

export function useShippingRegionPresets(supplierId) {
  const [presets, setPresets] = useState([]); // [{index,name,regionsDisplay}]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const didLoadRef = useRef(false);
  const lastLoadTsRef = useRef(0);
  const LOCAL_TTL = 1500; // 1.5s: evita ráfaga doble StrictMode + layout swap

  const load = useCallback(async () => {
    if (!supplierId) return;
    const now = Date.now();
    if (didLoadRef.current && (now - lastLoadTsRef.current) < LOCAL_TTL) {
      return; // Guard redundante (micro‑TTL local)
    }
    didLoadRef.current = true;
    lastLoadTsRef.current = now;
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
