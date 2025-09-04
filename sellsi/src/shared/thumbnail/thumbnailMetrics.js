// thumbnailMetrics.js - agregador en memoria de métricas de thumbnails

const batch = []
let lastFlush = Date.now()
const FLUSH_INTERVAL = 60_000
const MAX_BATCH = 200
let generationStarts = new Map() // productId -> ts
let counters = {
  cache_promote: 0,
  transient_fetch: 0
}
const recent = [] // ring buffer of recent events
const RECENT_MAX = 300
let subscribers = new Set()

function notify() {
  subscribers.forEach(fn => { try { fn() } catch(_) {} })
}

export function markStart(productId) {
  if (!productId) return
  generationStarts.set(productId, Date.now())
}

export function record(eventType, payload = {}) {
  try {
    if (eventType === 'generation_start' && payload.productId) {
      markStart(payload.productId)
    }
    if (['generation_result','generation_error'].includes(eventType) && payload.productId) {
      const startTs = generationStarts.get(payload.productId)
      if (startTs) {
        payload.durationMs = Date.now() - startTs
        generationStarts.delete(payload.productId)
      }
    }
  if (eventType === 'cache_promote') counters.cache_promote++
  if (eventType === 'transient_fetch') counters.transient_fetch++
  const ev = { ts: Date.now(), type: eventType, ...payload }
  batch.push(ev)
  recent.push(ev)
  if (recent.length > RECENT_MAX) recent.splice(0, recent.length - RECENT_MAX)
  notify()
    if (batch.length >= MAX_BATCH) flush()
  } catch (_) { /* noop */ }
}

export function flush(force = false) {
  if (!force && Date.now() - lastFlush < 5_000 && batch.length < MAX_BATCH) return
  if (!batch.length) return
  try {
    // Adjuntar métrica derivada de eficiencia si hay base
    if (counters.transient_fetch > 0) {
      const ratio = counters.cache_promote / counters.transient_fetch
      batch.push({ ts: Date.now(), type: 'cache_efficiency', ratio, cache_promote: counters.cache_promote, transient_fetch: counters.transient_fetch })
      counters.cache_promote = 0
      counters.transient_fetch = 0
    }
    const out = batch.splice(0, batch.length)
    console.log('[THUMBS_METRIC]', JSON.stringify(out))
    lastFlush = Date.now()
  } catch (_) { /* noop */ }
}

if (typeof window !== 'undefined') {
  setInterval(() => flush(false), FLUSH_INTERVAL)
}

export function getRecentEvents(productId) {
  if (!productId) return [...recent]
  return recent.filter(r => r.productId === productId)
}

export function subscribeRecent(cb) {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

export default { record, flush, markStart, getRecentEvents, subscribeRecent }
