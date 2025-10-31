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
      return { success: false, error: error.message }
    }

    return { success: true, user }
  } catch (error) {
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
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Expose the supabase client on window in development for manual debugging
if (import.meta.env && import.meta.env.DEV) {
  try {
    // eslint-disable-next-line no-undef
    window.supabase = supabase
  } catch (e) {
    // ignore in environments where window is not available
  }
}

// ============================================================================
// AUTH getUser DEDUPE + CACHE (reduce 6 fetch -> 1)
// ============================================================================
// Muchos módulos llaman supabase.auth.getUser() simultáneamente tras F5.
// Este wrapper añade:
//  - Cache en memoria (TTL corto)
//  - Promesa en vuelo compartida (inFlight) para deduplicar
//  - Invalidation explícita
// Mantiene la misma forma de retorno: { data: { user }, error }

let __authUserCache = { user: null, ts: 0 }
let __authInFlight = null
const AUTH_USER_TTL = 60_000 // 60s; ajustar según necesidades

const __originalGetUser = supabase.auth.getUser.bind(supabase.auth)

export const invalidateAuthUserCache = () => {
  __authUserCache = { user: null, ts: 0 }
}

supabase.auth.getUser = async (options = {}) => {
  const force = !!options.force
  if (force) invalidateAuthUserCache()

  const now = Date.now()
  if (!force && __authUserCache.user && (now - __authUserCache.ts) < AUTH_USER_TTL) {
    if (import.meta.env.DEV) console.debug('[auth:getUser] cache hit')
    return { data: { user: __authUserCache.user }, error: null }
  }

  if (__authInFlight) {
    if (import.meta.env.DEV) console.debug('[auth:getUser] dedup -> waiting inFlight')
    return __authInFlight
  }

  if (import.meta.env.DEV) console.debug('[auth:getUser] real fetch')
  __authInFlight = (async () => {
    try {
      const { data, error } = await __originalGetUser()
      if (!error) {
        __authUserCache.user = data?.user || null
        __authUserCache.ts = Date.now()
      }
      return { data, error }
    } finally {
      __authInFlight = null
    }
  })()

  return __authInFlight
}

// Exponer invalidación en window (solo dev) para debugging manual
if (import.meta.env && import.meta.env.DEV) {
  try { window.invalidateAuthUserCache = invalidateAuthUserCache } catch (_) {}
}
