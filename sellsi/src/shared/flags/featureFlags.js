// featureFlags.js
// Centraliza lectura de feature flags (prefijo VITE_ para exponer en frontend)

const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {}

function asBool(v, def = false) {
  if (v === undefined || v === null || v === '') return def
  if (typeof v === 'boolean') return v
  return String(v).toLowerCase() === 'true'
}

export const FeatureFlags = {
  ENABLE_PHASED_THUMB_EVENTS: asBool(env.VITE_ENABLE_PHASED_THUMB_EVENTS, false), // 🔥 HOTFIX: Cambiado de true a false para asegurar eventos de actualización
  ENABLE_SIGNATURE_COLUMN: asBool(env.VITE_ENABLE_SIGNATURE_COLUMN, false),
  ENABLE_SIGNATURE_ENFORCE: asBool(env.VITE_ENABLE_SIGNATURE_ENFORCE, false),
  ENABLE_DYNAMIC_THUMB_TTL: asBool(env.VITE_ENABLE_DYNAMIC_THUMB_TTL, false),
  ENABLE_DELAYED_CLEANUP: asBool(env.VITE_ENABLE_DELAYED_CLEANUP, true),
  ENABLE_VIEWPORT_THUMBS: asBool(env.VITE_ENABLE_VIEWPORT_THUMBS, false),
  FEATURE_PHASE1_THUMBS: asBool(env.VITE_FEATURE_PHASE1_THUMBS, true), // Flag maestro para capa Phase1 ETag
  THUMB_MAX_CONCURRENT: Number(env.VITE_THUMB_MAX_CONCURRENT) || 12,
}

export const ThumbTimings = {
  PHASE_EVENT_DEBOUNCE_MS: Number(env.VITE_THUMB_EVENT_DEBOUNCE_MS) || 250,
  ENFORCE_COOLDOWN_MS: Number(env.VITE_SIGNATURE_ENFORCE_COOLDOWN_MS) || 5000
}

export default FeatureFlags
