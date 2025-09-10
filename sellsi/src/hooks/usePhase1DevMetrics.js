// FASE 1: Hook de Métricas para Desarrollo
// Muestra performance stats en tiempo real durante desarrollo

import React, { useState, useEffect } from 'react';
import { phase1Monitor } from '../monitoring/phase1LatencyMonitor';
import { phase1ETAGService } from '../services/phase1ETAGThumbnailService';

/**
 * Hook para métricas FASE 1 en tiempo real
 */
export const usePhase1DevMetrics = (enabled = process.env.NODE_ENV === 'development') => {
  const [metrics, setMetrics] = useState(null);
  const [etagStats, setEtagStats] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    // Actualizar métricas cada 10 segundos
    const interval = setInterval(() => {
      const latencyMetrics = phase1Monitor.getCurrentReport();
      const etagCacheStats = phase1ETAGService.getStats();
      
      setMetrics(latencyMetrics);
      setEtagStats(etagCacheStats);
    }, 10000);

    // Obtener métricas iniciales
    setMetrics(phase1Monitor.getCurrentReport());
    setEtagStats(phase1ETAGService.getStats());

    return () => clearInterval(interval);
  }, [enabled]);

  return {
    metrics,
    etagStats,
    enabled
  };
};

/**
 * Componente visual para mostrar métricas FASE 1
 */
export const Phase1MetricsDisplay = ({ position = 'bottom-right' }) => {
  const { metrics, etagStats, enabled } = usePhase1DevMetrics();

  if (!enabled || !metrics) return null;

  const positionStyles = {
    'bottom-right': { position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 },
    'bottom-left': { position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999 },
    'top-right': { position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }
  };

  const getStatusColor = (met) => met ? '#4CAF50' : '#FF5722';

  return (
    <div style={{
      ...positionStyles[position],
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      minWidth: '280px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2196F3' }}>
        🚀 FASE 1 Performance
      </div>
      
      {/* Latency Metrics */}
      <div style={{ marginBottom: '6px' }}>
        <span style={{ color: getStatusColor(metrics.targets?.p95_met) }}>
          P95: {metrics.latency?.p95 || 0}ms
        </span>
        <span style={{ marginLeft: '10px', color: '#9E9E9E' }}>
          Target: &lt;15ms
        </span>
      </div>

      {/* Cache Metrics */}
      <div style={{ marginBottom: '6px' }}>
        <span style={{ color: getStatusColor(metrics.targets?.cache_met) }}>
          Cache: {metrics.cache?.hitRatio || '0%'}
        </span>
        <span style={{ marginLeft: '10px', color: '#9E9E9E' }}>
          Target: &gt;70%
        </span>
      </div>

      {/* Volume */}
      <div style={{ marginBottom: '6px', color: '#9E9E9E' }}>
        Queries: {metrics.volume?.totalQueries || 0} | 
        Errors: {metrics.volume?.errorRate || '0%'}
      </div>

      {/* ETag Service Stats */}
      {etagStats && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #444' }}>
          <div style={{ color: '#FF9800', marginBottom: '4px' }}>ETag Cache:</div>
          <div style={{ color: '#9E9E9E' }}>
            Size: {etagStats.cacheSize} | Hit: {etagStats.hitRatio}
          </div>
          <div style={{ color: '#9E9E9E' }}>
            Total: {etagStats.totalRequests} | Errors: {etagStats.errors}
          </div>
        </div>
      )}

      {/* Success Indicators */}
      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #444' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            color: getStatusColor(metrics.targets?.p95_met),
            fontSize: '16px'
          }}>
            {metrics.targets?.p95_met ? '✅' : '❌'} Speed
          </span>
          <span style={{ 
            color: getStatusColor(metrics.targets?.cache_met),
            fontSize: '16px'
          }}>
            {metrics.targets?.cache_met ? '✅' : '❌'} Cache
          </span>
          <span style={{ 
            color: getStatusColor(metrics.targets?.error_met),
            fontSize: '16px'
          }}>
            {metrics.targets?.error_met ? '✅' : '❌'} Stable
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para logging automático de métricas críticas
 */
export const usePhase1MetricsLogger = (logInterval = 60000) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const report = phase1Monitor.getCurrentReport();
      const stats = phase1ETAGService.getStats();
      
      console.group('📊 [FASE1_METRICS_SUMMARY]');
      console.log('Latency P95:', report.latency?.p95 + 'ms', 
                  report.targets?.p95_met ? '✅' : '❌');
      console.log('Cache Hit Ratio:', report.cache?.hitRatio, 
                  report.targets?.cache_met ? '✅' : '❌');
      console.log('Total Queries:', report.volume?.totalQueries);
      console.log('ETag Cache Size:', stats.cacheSize);
      console.groupEnd();
    }, logInterval);

    return () => clearInterval(interval);
  }, [logInterval]);
};

export default {
  usePhase1DevMetrics,
  Phase1MetricsDisplay,
  usePhase1MetricsLogger
};
