import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const SCHEMA = 'control_panel';
const TABLE = 'feature_flags';

export function useFeatureFlag({ workspace, key, defaultValue = false }) {
  const [enabled, setEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .schema(SCHEMA)
          .from(TABLE)
          .select('enabled')
          .eq('workspace', workspace)
          .eq('key', key)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) setEnabled(!!data?.enabled);
      } catch (e) {
        console.error('Error leyendo feature flag', e);
        if (!cancelled) setEnabled(defaultValue);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (workspace && key) load();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [workspace, key, defaultValue]);

  return { enabled, loading };
}
