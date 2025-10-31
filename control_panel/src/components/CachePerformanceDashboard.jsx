/**
 * ============================================================================
 * CACHE PERFORMANCE DASHBOARD
 * ============================================================================
 * 
 * Componente para monitorear en tiempo real las métricas de performance
 * del sistema de cache multicapa de Sellsi.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Zap,
  Clock,
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useServiceWorker } from '@/utils/serviceWorkerRegistration';
import { globalCacheManager, thumbnailCacheManager } from '@/utils/cacheManager';

export function CachePerformanceDashboard({ className = '' }) {
  const swInfo = useServiceWorker();
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [cacheManagerStats, setCacheManagerStats] = useState(null);
  const [thumbnailStats, setThumbnailStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Actualizar métricas cada 10 segundos
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 10000);
    refreshMetrics(); // Initial load
    
    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = async () => {
    try {
      setRefreshing(true);
      
      // Performance metrics del navegador
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      const cachedResources = resources.filter(resource => 
        resource.transferSize === 0 && resource.decodedBodySize > 0
      );

      setPerformanceMetrics({
        totalResources: resources.length,
        cachedResources: cachedResources.length,
        cacheHitRatio: resources.length > 0 ? cachedResources.length / resources.length : 0,
        loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        transferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        decodedSize: resources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0)
      });

      // Cache Manager stats
      setCacheManagerStats(globalCacheManager.getStats());
      setThumbnailStats(thumbnailCacheManager.getStats());

      // Refresh SW cache stats
      if (swInfo.refreshCacheStats) {
        swInfo.refreshCacheStats();
      }

    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async (type) => {
    try {
      setRefreshing(true);
      
      switch (type) {
        case 'sw':
          await swInfo.clearAllCaches();
          break;
        case 'manager':
          globalCacheManager.clear();
          break;
        case 'thumbnail':
          thumbnailCacheManager.clear();
          break;
        case 'all':
          await swInfo.clearAllCaches();
          globalCacheManager.clear();
          thumbnailCacheManager.clear();
          break;
      }
      
      await refreshMetrics();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (!ms || ms === 0) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cache Performance</h2>
          <p className="text-gray-600">Monitoreo en tiempo real del sistema de cache multicapa</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClearCache('all')}
            disabled={refreshing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>
        </div>
      </div>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {swInfo.status === 'active' ? (
              <Wifi className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 mr-2 text-red-500" />
            )}
            Service Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge 
                variant={swInfo.status === 'active' ? 'success' : 'destructive'}
                className="capitalize"
              >
                {swInfo.status}
              </Badge>
              {swInfo.updateAvailable && (
                <Badge variant="warning" className="ml-2">
                  Actualización disponible
                </Badge>
              )}
            </div>
            
            {swInfo.updateAvailable && (
              <Button size="sm" onClick={swInfo.applyUpdate}>
                Aplicar Actualización
              </Button>
            )}
          </div>
          
          {swInfo.cacheStats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {swInfo.cacheStats.totalEntries}
                </div>
                <div className="text-sm text-gray-600">Entradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {swInfo.cacheStats.totalSizeMB} MB
                </div>
                <div className="text-sm text-gray-600">Tamaño Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {swInfo.cacheStats.typeBreakdown.js}
                </div>
                <div className="text-sm text-gray-600">JS Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {swInfo.cacheStats.typeBreakdown.images}
                </div>
                <div className="text-sm text-gray-600">Imágenes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Overview */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                Cache Hit Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceMetrics.cacheHitRatio * 100).toFixed(1)}%
              </div>
              <Progress 
                value={performanceMetrics.cacheHitRatio * 100} 
                className="mt-2"
              />
              <div className="text-xs text-gray-600 mt-1">
                {performanceMetrics.cachedResources} de {performanceMetrics.totalResources} recursos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Tiempo de Carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(performanceMetrics.loadTime)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Load completo
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
                Datos Transferidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(performanceMetrics.transferSize)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                de {formatBytes(performanceMetrics.decodedSize)} total
              </div>
              <div className="text-xs text-green-600 mt-1">
                {((1 - performanceMetrics.transferSize / performanceMetrics.decodedSize) * 100).toFixed(1)}% ahorro
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                Eficiencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.cacheHitRatio > 0.8 ? 'Excelente' : 
                 performanceMetrics.cacheHitRatio > 0.6 ? 'Buena' : 
                 performanceMetrics.cacheHitRatio > 0.4 ? 'Regular' : 'Baja'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Performance general
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Managers Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Cache Manager */}
        {cacheManagerStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Global Cache Manager
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearCache('manager')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {cacheManagerStats.size}
                    </div>
                    <div className="text-sm text-gray-600">Entradas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {cacheManagerStats.memoryMB} MB
                    </div>
                    <div className="text-sm text-gray-600">Memoria</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hit Rate</span>
                    <span>{(cacheManagerStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheManagerStats.hitRate * 100} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-semibold text-green-600">
                      {cacheManagerStats.hits}
                    </div>
                    <div className="text-xs text-gray-600">Hits</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600">
                      {cacheManagerStats.misses}
                    </div>
                    <div className="text-xs text-gray-600">Misses</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600">
                      {cacheManagerStats.evictions}
                    </div>
                    <div className="text-xs text-gray-600">Evictions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thumbnail Cache Manager */}
        {thumbnailStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Thumbnail Cache
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearCache('thumbnail')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {thumbnailStats.size}
                    </div>
                    <div className="text-sm text-gray-600">Thumbnails</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {thumbnailStats.memoryMB} MB
                    </div>
                    <div className="text-sm text-gray-600">Memoria</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hit Rate</span>
                    <span>{(thumbnailStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={thumbnailStats.hitRate * 100} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-semibold text-green-600">
                      {thumbnailStats.hits}
                    </div>
                    <div className="text-xs text-gray-600">Hits</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600">
                      {thumbnailStats.misses}
                    </div>
                    <div className="text-xs text-gray-600">Misses</div>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-600">
                      {thumbnailStats.cleanups}
                    </div>
                    <div className="text-xs text-gray-600">Cleanups</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cache Strategy Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Estrategias de Cache Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium">JavaScript & CSS Assets</div>
                <div className="text-sm text-gray-600">Cache-First con TTL de 1 año (immutable)</div>
              </div>
              <Badge variant="secondary">Cache-First</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium">Product Thumbnails</div>
                <div className="text-sm text-gray-600">Stale-While-Revalidate con TTL de 7 días</div>
              </div>
              <Badge variant="secondary">SWR</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium">API Calls</div>
                <div className="text-sm text-gray-600">Network-First con fallback a cache</div>
              </div>
              <Badge variant="secondary">Network-First</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CachePerformanceDashboard;
