// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación para evitar el error
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is required but not found in environment variables'
  )
}

if (!supabaseKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is required but not found in environment variables'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ✅ AGREGAR ESTAS FUNCIONES QUE FALTAN:

export const testAuth = async () => {
  try {
    // Test de autenticación - obtener usuario actual
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('❌ Error getting user:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, user }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return { success: false, error: error.message }
  }
}

export const testConnection = async () => {
  try {
    // Test simple de conexión
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Connection error:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Connection successful')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Unexpected connection error:', error)
    return { success: false, error: error.message }
  }
}
