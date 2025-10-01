// ============================================================================
// SMART METRIC CACHE - Capa ligera sobre globalCacheManager para métricas KPI
// ============================================================================
import { globalCacheManager } from './cacheManager'

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos por métrica

class SmartMetricCache {
  constructor(prefix = 'metric') {
    this.prefix = prefix
  }

  _key(name, scope = {}) {
    const scopePart = Object.entries(scope).map(([k,v]) => `${k}:${v}`).join('|')
    return `${this.prefix}:${name}${scopePart ? ':'+scopePart : ''}`
  }

  get(name, scope = {}) {
    return globalCacheManager.get(this._key(name, scope))
  }

  set(name, scope = {}, data, ttl = DEFAULT_TTL) {
    globalCacheManager.set(this._key(name, scope), { data, ts: Date.now() }, ttl)
    return data
  }

  async ensure(name, scope = {}, loader, ttl = DEFAULT_TTL, options = {}) {
    const cached = this.get(name, scope)
    if (cached && !options.force) return { data: cached.data, cached: true, ts: cached.ts }
    const data = await loader()
    this.set(name, scope, data, ttl)
    return { data, cached: false, ts: Date.now() }
  }

  invalidate(name, scope = {}) {
    globalCacheManager.delete(this._key(name, scope))
  }
}

export const smartMetricCache = new SmartMetricCache('supplier')
export default smartMetricCache
