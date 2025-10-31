import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FeatureFlags } from '../../shared/flags/featureFlags.js'
import { queryClient as globalQueryClient, QUERY_KEYS } from '../../utils/queryClient'
import { scheduleThumbnailFetch } from '../../shared/thumbnail/thumbnailConcurrencyQueue.js'
import { getOrFetchMainThumbnail } from '../../services/phase1ETAGThumbnailService.js'
import { record as recordMetric } from '../../shared/thumbnail/thumbnailMetrics.js'

function getPhaseQueryOptions(phase) {
  if (!FeatureFlags.ENABLE_DYNAMIC_THUMB_TTL) {
    return { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, refetchInterval: false }
  }
  if (!phase || phase === 'thumbnails_ready' || phase === 'thumbnails_skipped_webp') {
    return { staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, refetchInterval: false }
  }
  return { staleTime: 0, gcTime: 5 * 60 * 1000, refetchInterval: 1000 }
}

async function fetchThumbnail(productId) {
  return scheduleThumbnailFetch(async () => getOrFetchMainThumbnail(productId, { silent: true }))
}

export function useThumbnailPhaseQuery(productId, currentPhase, { enabled: externalEnabled = true } = {}) {
  const qc = useQueryClient()
  const phase = currentPhase
  const phaseKey = ['thumbnail', productId, phase || 'unknown']
  const stableKey = QUERY_KEYS.THUMBNAIL(productId)
  const opts = getPhaseQueryOptions(phase)

  const query = useQuery({
    queryKey: phaseKey,
    queryFn: () => fetchThumbnail(productId),
    staleTime: opts.staleTime,
    gcTime: opts.gcTime,
    refetchInterval: opts.refetchInterval,
    enabled: !!productId && !!phase && externalEnabled,
    meta: { phase }
  })

  // Métrica: fetch transitorio (fases no finales) exitoso
  if (query.isSuccess && query.data && phase && !['thumbnails_ready','thumbnails_skipped_webp'].includes(phase)) {
    recordMetric('transient_fetch', { productId, phase })
  }

  if (query.data && (phase === 'thumbnails_ready' || phase === 'thumbnails_skipped_webp')) {
    const existing = qc.getQueryData(stableKey)
    if (!existing || existing?.thumbnail_url !== query.data?.thumbnail_url) {
      qc.setQueryData(stableKey, query.data)
  recordMetric('cache_promote', { productId, fromPhase: phase })
  // Proactive cleanup de claves transitorias para este producto
  try { invalidateTransientThumbnailKeys(productId) } catch(_) { /* noop */ }
    }
  }

  return query
}

export function invalidateTransientThumbnailKeys(productId) {
  const cache = globalQueryClient.getQueryCache().findAll({
    predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'thumbnail' && q.queryKey[1] === productId && q.queryKey.length === 3
  })
  cache.forEach(q => {
    const phase = q.queryKey[2]
    if (phase && phase !== 'thumbnails_ready' && phase !== 'thumbnails_skipped_webp') {
      globalQueryClient.removeQueries({ queryKey: q.queryKey })
    }
  })
}
