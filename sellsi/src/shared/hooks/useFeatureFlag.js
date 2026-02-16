import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const SCHEMA = 'control_panel';
const TABLE = 'feature_flags';
const CACHE_TTL_MS = 60 * 1000;
const flagCache = new Map();
const inFlightRequests = new Map();

const getFlagCacheKey = (workspace, key) => `${workspace}::${key}`;

async function fetchFeatureFlag(workspace, key, defaultValue) {
  const cacheKey = getFlagCacheKey(workspace, key);
  const cached = flagCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.enabled;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .schema(SCHEMA)
        .from(TABLE)
        .select('enabled')
        .eq('workspace', workspace)
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;

      const enabled = !!data?.enabled;
      flagCache.set(cacheKey, {
        enabled,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return enabled;
    } catch (e) {
      console.error('Error leyendo feature flag', e);
      flagCache.set(cacheKey, {
        enabled: defaultValue,
        expiresAt: Date.now() + 5000,
      });
      return defaultValue;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export function useFeatureFlag({ workspace, key, defaultValue = false }) {
  const [enabled, setEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!workspace || !key) {
          if (!cancelled) {
            setLoading(false);
            setEnabled(defaultValue);
          }
          return;
        }

        const cacheKey = getFlagCacheKey(workspace, key);
        const cached = flagCache.get(cacheKey);
        const now = Date.now();

        if (cached && cached.expiresAt > now) {
          if (!cancelled) {
            setEnabled(cached.enabled);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setLoading(true);

        const value = await fetchFeatureFlag(workspace, key, defaultValue);
        if (!cancelled) setEnabled(!!value);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [workspace, key, defaultValue]);

  return { enabled, loading };
}
