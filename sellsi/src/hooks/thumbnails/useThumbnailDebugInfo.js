import { useEffect, useState, useMemo } from 'react'
import metrics from '../../shared/thumbnail/thumbnailMetrics.js'

// Nuevo hook usando ring buffer interno (sin interceptar console)
export function useThumbnailDebugInfo(productId, { limit = 200 } = {}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const unsubscribe = metrics.subscribeRecent(() => setTick(t => t + 1))
    return unsubscribe
  }, [])

  const events = useMemo(() => {
    let evs = metrics.getRecentEvents(productId)
    if (evs.length > limit) evs = evs.slice(evs.length - limit)
    return evs
  }, [tick, productId, limit])

  const aggregates = useMemo(() => {
    const byType = {}
    let lastBaseTs = null
    let lastReadyTs = null
    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1
      if (e.type === 'event_emit') {
        if (e.phase === 'base_insert') lastBaseTs = e.ts
        if (['thumbnails_ready','thumbnails_skipped_webp'].includes(e.phase)) lastReadyTs = e.ts
      }
    }
    let baseToReadyMs = null
    if (lastBaseTs && lastReadyTs && lastReadyTs >= lastBaseTs) baseToReadyMs = lastReadyTs - lastBaseTs
    return { byType, baseToReadyMs }
  }, [events])

  return { events, aggregates, latest: events[events.length - 1] }
}

export default useThumbnailDebugInfo
