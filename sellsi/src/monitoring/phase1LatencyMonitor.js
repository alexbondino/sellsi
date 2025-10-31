// FASE 1: Monitoring de Latencia - Quick Win #3
// Fecha: 2025-09-10
// Objetivo: Monitorear mejoras de performance de los Quick Wins implementados
// Riesgo: MÍNIMO (solo observabilidad, no afecta funcionalidad)
// Impacto: Permite medir éxito de optimizaciones (target: p95 < 15ms)

class Phase1LatencyMonitor {
  constructor() {
    this.metrics = {
      // Contadores
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      
      // Latencias (últimas 100 mediciones)
      latencies: [],
      MAX_LATENCY_SAMPLES: 100,
      
      // Errores
      errors: 0,
      
      // Timestamp inicio
      startTime: Date.now()
    };
    
    // Report cada 2 minutos
    setInterval(() => this.generateReport(), 2 * 60 * 1000);
    
    console.log('[FASE1_MONITOR] Latency monitoring initialized');
  }

  /**
   * Registrar medición de latencia
   */
  recordLatency(duration, type = 'query') {
    this.metrics.totalQueries++;
    
    // Mantener solo las últimas N mediciones
    this.metrics.latencies.push({
      duration,
      type,
      timestamp: Date.now()
    });
    
    if (this.metrics.latencies.length > this.metrics.MAX_LATENCY_SAMPLES) {
      this.metrics.latencies.shift();
    }
    
    // Log si latencia es preocupante (>50ms)
    if (duration > 50) {
      console.warn('[FASE1_MONITOR] High latency detected:', duration + 'ms', type);
    }
  }

  /**
   * Registrar cache hit/miss
   */
  recordCacheResult(hit) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Registrar error
   */
  recordError(error, context = '') {
    this.metrics.errors++;
    console.error('[FASE1_MONITOR] Error recorded:', context, error);
  }

  /**
   * Calcular percentiles de latencia
   */
  calculatePercentiles() {
    if (this.metrics.latencies.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const sorted = this.metrics.latencies
      .map(l => l.duration)
      .sort((a, b) => a - b);

    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length
    };
  }

  /**
   * Calcular cache hit ratio
   */
  getCacheHitRatio() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return (this.metrics.cacheHits / total) * 100;
  }

  /**
   * Generar reporte de performance
   */
  generateReport() {
    const percentiles = this.calculatePercentiles();
    const cacheHitRatio = this.getCacheHitRatio();
    const uptime = Date.now() - this.metrics.startTime;

    const report = {
      // Metadata
      timestamp: new Date().toISOString(),
      phase: 'FASE_1',
      uptime: Math.round(uptime / 1000) + 's',
      
      // Performance KPIs
      latency: {
        ...percentiles,
        unit: 'ms'
      },
      
      // Cache effectiveness
      cache: {
        hitRatio: Math.round(cacheHitRatio * 100) / 100 + '%',
        totalHits: this.metrics.cacheHits,
        totalMisses: this.metrics.cacheMisses
      },
      
      // Volume
      volume: {
        totalQueries: this.metrics.totalQueries,
        queriesPerMinute: Math.round((this.metrics.totalQueries / (uptime / 60000)) * 100) / 100,
        errors: this.metrics.errors,
        errorRate: this.metrics.totalQueries > 0 ? 
          Math.round((this.metrics.errors / this.metrics.totalQueries) * 10000) / 100 + '%' : '0%'
      },
      
      // Success indicators (FASE 1 targets)
      targets: {
        p95_target: '< 15ms',
        p95_actual: percentiles.p95 + 'ms',
        p95_met: percentiles.p95 < 15,
        
        cache_target: '> 70%',
        cache_actual: Math.round(cacheHitRatio * 100) / 100 + '%',
        cache_met: cacheHitRatio > 70,
        
        error_target: '< 1%',
        error_actual: this.metrics.totalQueries > 0 ? 
          Math.round((this.metrics.errors / this.metrics.totalQueries) * 10000) / 100 + '%' : '0%',
        error_met: this.metrics.totalQueries === 0 || (this.metrics.errors / this.metrics.totalQueries) < 0.01
      }
    };

    // Log reporte completo
    console.log('[FASE1_REPORT]', JSON.stringify(report, null, 2));
    
    // Alert si targets no se cumplen
    if (!report.targets.p95_met) {
      console.warn('⚠️ [FASE1_ALERT] P95 latency target not met:', report.targets.p95_actual);
    }
    
    if (!report.targets.cache_met) {
      console.warn('⚠️ [FASE1_ALERT] Cache hit ratio target not met:', report.targets.cache_actual);
    }

    return report;
  }

  /**
   * Obtener reporte actual sin esperar intervalo
   */
  getCurrentReport() {
    return this.generateReport();
  }

  /**
   * Reset métricas (útil para testing)
   */
  reset() {
    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      latencies: [],
      MAX_LATENCY_SAMPLES: 100,
      errors: 0,
      startTime: Date.now()
    };
    console.log('[FASE1_MONITOR] Metrics reset');
  }
}

// Instancia singleton
export const phase1Monitor = new Phase1LatencyMonitor();

// Wrapper para medir latencia automáticamente
export const withLatencyMeasurement = async (operation, type = 'query') => {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    phase1Monitor.recordLatency(duration, type);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    phase1Monitor.recordLatency(duration, type + '_error');
    phase1Monitor.recordError(error, type);
    throw error;
  }
};

// Hook para mostrar métricas en desarrollo
export const usePhase1Metrics = () => {
  const [metrics, setMetrics] = React.useState(null);

  React.useEffect(() => {
    // Actualizar métricas cada 30 segundos
    const interval = setInterval(() => {
      setMetrics(phase1Monitor.getCurrentReport());
    }, 30000);

    // Obtener métricas iniciales
    setMetrics(phase1Monitor.getCurrentReport());

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export default Phase1LatencyMonitor;
