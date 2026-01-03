/**
 * ============================================================================
 * useHomeQueries - Hook centralizado para queries del Home del proveedor
 * ============================================================================
 *
 * Centraliza todas las consultas a Supabase para el dashboard del proveedor.
 * Los componentes de UI solo consumen datos y parametrizan las queries.
 *
 * QUERIES DISPONIBLES:
 * - fetchDailySales: Ventas diarias por período
 * - fetchDailyRequests: Solicitudes diarias por período
 * - fetchSummaryMetrics: Métricas de resumen (KPIs)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../services/supabase';

// ============================================================================
// CONSTANTES
// ============================================================================
const SERVICE_RATE = 0.03;
const IVA_RATE = 0.19;
const NET_MULTIPLIER = (1 - SERVICE_RATE) * (1 - IVA_RATE * SERVICE_RATE);

// Cache TTL en ms (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// ============================================================================
// UTILIDADES DE FECHAS
// ============================================================================

/**
 * Calcula las fechas de inicio y fin según el período seleccionado
 * @param {number|string} period - Número de días o 'ytd' para year-to-date
 */
const getDateRange = period => {
  const endDate = new Date();
  let startDate;

  if (period === 'ytd') {
    startDate = new Date(endDate.getFullYear(), 0, 1);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
  }

  return { startDate, endDate };
};

/**
 * Calcula el número de días en el rango
 */
const getDaysInRange = (startDate, endDate) => {
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Formatea una fecha para mostrar en labels del eje X
 */
const formatDateLabel = dateStr => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDate();
  const month = date.toLocaleDateString('es-CL', { month: 'short' });
  return `${day} ${month}.`;
};

/**
 * Obtiene el inicio y fin del mes actual
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    monthStart: monthStart.toISOString(),
    nextMonth: nextMonth.toISOString(),
  };
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useHomeQueries = () => {
  const [supplierId, setSupplierId] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef(new Map());

  // Obtener supplierId al montar
  useEffect(() => {
    const getSupplier = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setSupplierId(session.user.id);
      }
      setLoading(false);
    };
    getSupplier();
  }, []);

  // ============================================================================
  // CACHE HELPERS
  // ============================================================================

  const getCacheKey = (queryName, params) =>
    `${queryName}:${JSON.stringify(params)}`;

  const getFromCache = key => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  const setToCache = (key, data) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  };

  const invalidateCache = (queryName = null) => {
    if (queryName) {
      // Invalidar solo las queries que empiecen con ese nombre
      for (const key of cacheRef.current.keys()) {
        if (key.startsWith(queryName)) {
          cacheRef.current.delete(key);
        }
      }
    } else {
      // Invalidar todo
      cacheRef.current.clear();
    }
  };

  // ============================================================================
  // QUERY: VENTAS DIARIAS
  // ============================================================================

  /**
   * Obtiene las ventas diarias agrupadas por día
   * @param {number|string} period - 7, 30 o 'ytd'
   * @param {Object} options - { skipCache: boolean }
   * @returns {Promise<{ data: Array, total: number, average: number, error: string|null }>}
   */
  const fetchDailySales = useCallback(
    async (period = 7, options = {}) => {
      if (!supplierId) {
        return { data: [], total: 0, average: 0, error: 'No supplier ID' };
      }

      const cacheKey = getCacheKey('dailySales', { supplierId, period });
      if (!options.skipCache) {
        const cached = getFromCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const { startDate, endDate } = getDateRange(period);
        const daysCount = getDaysInRange(startDate, endDate);

        // Intentar primero con la vista materializada
        let { data, error } = await supabase
          .from('product_sales_confirmed')
          .select('amount, trx_date')
          .eq('supplier_id', supplierId)
          .gte('trx_date', startDate.toISOString())
          .lte('trx_date', endDate.toISOString())
          .order('trx_date', { ascending: true });

        // Fallback a product_sales si la vista falla
        if (error) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('product_sales')
            .select(
              'amount, trx_date, orders!inner(status, payment_status, cancelled_at)'
            )
            .eq('supplier_id', supplierId)
            .eq('orders.payment_status', 'paid')
            .in('orders.status', ['accepted', 'in_transit', 'delivered'])
            .is('orders.cancelled_at', null)
            .gte('trx_date', startDate.toISOString())
            .lte('trx_date', endDate.toISOString())
            .order('trx_date', { ascending: true });

          if (fallbackError) {
            return {
              data: [],
              total: 0,
              average: 0,
              error: fallbackError.message,
            };
          }
          data = fallbackData;
        }

        // Inicializar todos los días del período con 0
        const dailyTotals = {};
        for (let i = 0; i < daysCount; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          dailyTotals[dateStr] = 0;
        }

        // Agregar ventas por día (aplicando descuentos)
        (data || []).forEach(sale => {
          const dateStr = sale.trx_date.split('T')[0];
          const amount = Number(sale.amount) || 0;
          dailyTotals[dateStr] =
            (dailyTotals[dateStr] || 0) + amount * NET_MULTIPLIER;
        });

        // Convertir a array para gráficos
        const chartData = Object.entries(dailyTotals)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, total]) => ({
            date: new Date(date),
            dateLabel: formatDateLabel(date),
            value: Math.round(total),
          }));

        const total = chartData.reduce((sum, d) => sum + d.value, 0);
        const average = chartData.length > 0 ? total / chartData.length : 0;

        const result = {
          data: chartData,
          total,
          average: Math.round(average),
          error: null,
        };
        setToCache(cacheKey, result);
        return result;
      } catch (err) {
        return { data: [], total: 0, average: 0, error: err.message };
      }
    },
    [supplierId]
  );

  // ============================================================================
  // QUERY: SOLICITUDES DIARIAS
  // ============================================================================

  /**
   * Obtiene las solicitudes (orders) diarias agrupadas por día
   * @param {number|string} period - 7, 30 o 'ytd'
   * @param {Object} options - { skipCache: boolean }
   * @returns {Promise<{ data: Array, total: number, average: number, error: string|null }>}
   */
  const fetchDailyRequests = useCallback(
    async (period = 7, options = {}) => {
      if (!supplierId) {
        return { data: [], total: 0, average: 0, error: 'No supplier ID' };
      }

      const cacheKey = getCacheKey('dailyRequests', { supplierId, period });
      if (!options.skipCache) {
        const cached = getFromCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const { startDate, endDate } = getDateRange(period);
        const daysCount = getDaysInRange(startDate, endDate);

        // Obtener órdenes donde el proveedor está en supplier_ids (array)
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, status')
          .contains('supplier_ids', [supplierId])
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          return { data: [], total: 0, average: 0, error: error.message };
        }

        // Inicializar todos los días del período con 0
        const dailyCounts = {};
        for (let i = 0; i < daysCount; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          dailyCounts[dateStr] = 0;
        }

        // Contar solicitudes por día
        (data || []).forEach(order => {
          const dateStr = order.created_at.split('T')[0];
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        });

        // Convertir a array para gráficos
        const chartData = Object.entries(dailyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({
            date: new Date(date),
            dateLabel: formatDateLabel(date),
            value: count,
          }));

        const total = chartData.reduce((sum, d) => sum + d.value, 0);
        const average = chartData.length > 0 ? total / chartData.length : 0;

        const result = {
          data: chartData,
          total,
          average: Math.round(average * 10) / 10,
          error: null,
        };
        setToCache(cacheKey, result);
        return result;
      } catch (err) {
        return { data: [], total: 0, average: 0, error: err.message };
      }
    },
    [supplierId]
  );

  // ============================================================================
  // QUERY: MÉTRICAS DE RESUMEN (KPIs)
  // ============================================================================

  /**
   * Obtiene las métricas de resumen para las tarjetas del dashboard
   * @param {Object} options - { skipCache: boolean }
   * @returns {Promise<{
   *   totalSales: number,
   *   monthlyRequestsCount: number,
   *   productsActive: number,
   *   outOfStock: number,
   *   error: string|null
   * }>}
   */
  const fetchSummaryMetrics = useCallback(
    async (options = {}) => {
      if (!supplierId) {
        return {
          totalSales: 0,
          monthlyRequestsCount: 0,
          productsActive: 0,
          outOfStock: 0,
          error: 'No supplier ID',
        };
      }

      const cacheKey = getCacheKey('summaryMetrics', { supplierId });
      if (!options.skipCache) {
        const cached = getFromCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const { monthStart, nextMonth } = getCurrentMonthRange();

        // Ejecutar todas las queries en paralelo
        const [salesResult, requestsResult, productsResult] = await Promise.all(
          [
            // 1. Ventas del mes (desde product_sales_confirmed)
            supabase
              .from('product_sales_confirmed')
              .select('amount')
              .eq('supplier_id', supplierId)
              .gte('trx_date', monthStart)
              .lt('trx_date', nextMonth),

            // 2. Solicitudes del mes (desde orders)
            supabase
              .from('orders')
              .select('id')
              .contains('supplier_ids', [supplierId])
              .gte('created_at', monthStart)
              .lt('created_at', nextMonth),

            // 3. Productos del proveedor
            supabase
              .from('products')
              .select('id, is_active, stock')
              .eq('supplier_id', supplierId),
          ]
        );

        // Calcular ventas totales del mes
        let totalSales = 0;
        if (!salesResult.error && Array.isArray(salesResult.data)) {
          totalSales = salesResult.data.reduce((sum, sale) => {
            const amount = Number(sale.amount) || 0;
            return sum + amount * NET_MULTIPLIER;
          }, 0);
        }

        // Contar solicitudes del mes
        const monthlyRequestsCount =
          !requestsResult.error && Array.isArray(requestsResult.data)
            ? requestsResult.data.length
            : 0;

        // Contar productos activos y sin stock
        let productsActive = 0;
        let outOfStock = 0;
        if (!productsResult.error && Array.isArray(productsResult.data)) {
          productsResult.data.forEach(product => {
            if (product.is_active) productsActive++;
            if (
              product.is_active &&
              (product.stock === 0 || product.stock === null)
            ) {
              outOfStock++;
            }
          });
        }

        const result = {
          totalSales: Math.round(totalSales),
          monthlyRequestsCount,
          productsActive,
          outOfStock,
          error: null,
        };

        setToCache(cacheKey, result);
        return result;
      } catch (err) {
        return {
          totalSales: 0,
          monthlyRequestsCount: 0,
          productsActive: 0,
          outOfStock: 0,
          error: err.message,
        };
      }
    },
    [supplierId]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Estado
    supplierId,
    loading,

    // Queries
    fetchDailySales,
    fetchDailyRequests,
    fetchSummaryMetrics,

    // Cache management
    invalidateCache,
  };
};

export default useHomeQueries;
