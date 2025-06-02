// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ AGREGAR ESTAS FUNCIONES QUE FALTAN:

export const testAuth = async () => {
  try {
    console.log('🔍 Testing Supabase auth...');

    // Test de autenticación - obtener usuario actual
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn('⚠️ Auth test warning:', error);
      return {
        success: false,
        error: error.message,
        user: null,
      };
    }

    console.log('✅ Auth test successful');
    return {
      success: true,
      message: 'Auth disponible',
      user,
    };
  } catch (error) {
    console.error('❌ Auth test error:', error);
    return {
      success: false,
      error: error.message,
      user: null,
    };
  }
};
