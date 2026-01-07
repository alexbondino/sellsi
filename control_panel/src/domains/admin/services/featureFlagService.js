import { supabase } from '../../../shared/services/supabase';

const SCHEMA = 'control_panel';
const TABLE = 'feature_flags';

/**
 * Lista todos los workspaces existentes en feature_flags (distinct).
 */
export async function listWorkspacesFromFeatureFlags() {
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select('workspace');

  if (error) throw error;

  // DISTINCT en client (PostgREST no tiene distinct fácil en todos los casos)
  const uniq = Array.from(
    new Set((data ?? []).map(r => r.workspace).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return uniq;
}

/**
 * Trae todas las filas para una key específica (en todos los workspaces).
 */
export async function getFeatureFlagsByKey(key) {
  if (!key) throw new Error('key is required');

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select('*')
    .eq('key', key);

  if (error) throw error;
  return data ?? [];
}

/**
 * Update (si existe) un flag por workspace+key.
 */
export async function setFeatureFlag(workspace, key, enabled) {
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('workspace', workspace)
    .eq('key', key)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Crea un flag (si no existe).
 */
export async function createFeatureFlag({
  workspace,
  key,
  label,
  description,
  enabled = false,
}) {
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert({
      workspace,
      key,
      label,
      description,
      enabled,
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * "Upsert" lógico: intenta update; si no existe fila, crea.
 * (Funciona aunque no tengas insert/upsert nativo)
 */
export async function upsertFeatureFlag({
  workspace,
  key,
  enabled,
  label,
  description,
}) {
  const updated = await setFeatureFlag(workspace, key, enabled);
  if (updated) return updated;

  return await createFeatureFlag({
    workspace,
    key,
    enabled,
    label: label ?? key,
    description: description ?? '',
  });
}
