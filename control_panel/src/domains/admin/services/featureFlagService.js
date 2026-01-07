// Servicio para consultar y modificar feature flags por workspace
import { supabase } from '../../../shared/services/supabase';

export async function getFeatureFlags(workspace) {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('workspace', workspace);
  if (error) throw error;
  return data;
}

export async function setFeatureFlag(workspace, key, enabled) {
  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('workspace', workspace)
    .eq('key', key)
    .select();
  if (error) throw error;
  return data;
}

export async function createFeatureFlag({
  workspace,
  key,
  label,
  description,
}) {
  const { data, error } = await supabase
    .from('feature_flags')
    .insert({ workspace, key, label, description })
    .select();
  if (error) throw error;
  return data;
}
