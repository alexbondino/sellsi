// Stub para getUserProfile - no usado en admin
import { supabase } from '../supabase';

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};
