/**
 * ============================================================================
  if (didFetchRef.current) return
  didFetchRef.current = true

  const fetchDashboardData = async () => {
 * ============================================================================
 *
 * Hook especializado ÚNICAMENTE para dashboard, métricas y analytics.
 * POST-REFACTOR: Ya NO maneja CRUD de productos, solo métricas y visualización.
 * 
 * RESPONSABILIDADES:
 * ✅ Métricas y estadísticas
 * ✅ Analytics y reportes
 * ✅ Datos para gráficos
 * ✅ KPIs del dashboard
 * ❌ CRUD de productos (movido a useSupplierProductsCRUD)
 * ❌ Filtros de productos (delegado a useSupplierProductFilters)
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../../services/supabase'
import { smartMetricCache } from '../../../../utils/smartMetricCache'

export const useSupplierDashboard = () => {
  // Intentar precargar revenue mensual desde localStorage para evitar flicker inicial
  const preloadMonthlyRevenue = () => {
    if (typeof window === 'undefined') return 0
    try {
      const raw = localStorage.getItem('supplier:lastMonthlyRevenue')
      if (!raw) return 0
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed.value !== 'number') return 0
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
      if (parsed.month !== currentMonth) return 0
      // TTL coherente con cache (5m)
      if (Date.now() - (parsed.ts || 0) > 5 * 60 * 1000) return 0
      return parsed.value
    } catch (_) {
      return 0
    }
  }
  const initialRevenue = preloadMonthlyRevenue()
  // ============================================================================
  // ESTADO ESPECIALIZADO EN DASHBOARD
  // ============================================================================
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalProducts: 0,
      activeProducts: 0,
      totalSales: 0,
      totalRevenue: initialRevenue,
      averageRating: 0,
      totalOrders: 0
    },
    charts: {
      salesData: [],
      productStocks: [],
      weeklyRequests: [],
      categoryDistribution: [],
      revenueData: []
    },
    trends: {
      salesGrowth: 0,
      productGrowth: 0,
      revenueGrowth: 0
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  // Evitar doble fetch en React.StrictMode u otros remounts accidentales
  const didFetchRef = useRef(false)
  // Guardar order_ids recientes para evitar duplicar en realtime
  const recentOrderIdsRef = useRef(new Set())

  // ============================================================================
  // UTILIDADES DE FECHAS
  // ============================================================================
  const getStartOfWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.setDate(diff)).toISOString().split('T')[0]
  }

  const getEndOfWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + 7
    return new Date(now.setDate(diff)).toISOString().split('T')[0]
  }

  const getDateRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  // ============================================================================
  // CARGAR MÉTRICAS DEL DASHBOARD
  // ============================================================================
  // In-flight promise dedupe para evitar llamadas duplicadas a loadDashboardMetrics
  // cuando el hook se monta varias veces o hay remounts en StrictMode.
  const __inFlightDashboardLoads = (() => {
    // Mapa por supplierId -> Promise
    // Se crea una sola vez por módulo/closure cuando el hook se instancie.
    if (typeof window === 'undefined') return new Map()
    // Usar un campo en window para que persista entre reloads en entornos dev
    if (!window.__inFlightDashboardLoads) window.__inFlightDashboardLoads = new Map()
    return window.__inFlightDashboardLoads
  })()

  /**
   * Cargar métricas principales del proveedor (con dedupe por supplierId)
   */
  const loadDashboardMetrics = async (supplierId) => {
    if (!supplierId) return { success: false, error: 'No supplierId' }

    if (__inFlightDashboardLoads.has(supplierId)) {
      // Reutilizar la promesa en vuelo
      try {
        return await __inFlightDashboardLoads.get(supplierId)
      } catch (err) {
        // Si la promesa falla, seguir el flujo normal y eliminar la entrada
        __inFlightDashboardLoads.delete(supplierId)
      }
    }

    setLoading(true)
    setError(null)

    const p = (async () => {
      try {
        // Obtener métricas básicas de productos (con dedupe contra consultas
        // en vuelo realizadas por otros hooks/components).
        const __inFlightMap = (typeof window !== 'undefined') ? (window.__inFlightSupabaseQueries = window.__inFlightSupabaseQueries || new Map()) : new Map();
        const productsKey = `products:metrics:${supplierId}`;
        let productMetrics
        if (__inFlightMap.has(productsKey)) {
          const cached = await __inFlightMap.get(productsKey)
          productMetrics = (cached && cached.data) || []
          if (cached && cached.error) throw cached.error
        } else {
          const p = (async () => {
            return await supabase
              .from('products')
              .select('productid, price, productqty, is_active, createddt')
              .eq('supplier_id', supplierId)
          })()
          __inFlightMap.set(productsKey, p)
          try {
            const { data: pm, error: prodError } = await p
            if (prodError) throw prodError
            productMetrics = pm || []
          } finally {
            __inFlightMap.delete(productsKey)
          }
        }

        // Calcular ingresos del MES desde la tabla 'product_sales' por supplier_id
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
        // Monthly revenue cache (5 min TTL) via SmartMetricCache
        const { data: monthlyRevenue } = await smartMetricCache.ensure(
          'monthlyRevenue',
          { supplierId, month: monthStart.substring(0,7) },
          async () => {
            const { data: psRows, error: psErr } = await supabase
              .from('product_sales')
              .select('amount, trx_date')
              .eq('supplier_id', supplierId)
              .gte('trx_date', monthStart)
              .lt('trx_date', nextMonth)
            if (psErr) {
              const prev = smartMetricCache.get('monthlyRevenue', { supplierId, month: monthStart.substring(0,7) })
              return prev?.data ?? 0
            }
            return (psRows || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
          },
          5 * 60 * 1000
        )

        const orderMetrics = []

        // Contar solicitudes semanales (últimos 7 días) basado en órdenes pagadas (product_sales)
        let weeklyRequestsCount = 0
        try {
          const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          const { data: psWindow, error: psWinErr } = await supabase
            .from('product_sales')
            .select('order_id, trx_date')
            .eq('supplier_id', supplierId)
            .gte('trx_date', last7)
            .not('order_id', 'is', null)

          if (!psWinErr && Array.isArray(psWindow)) {
            const distinct = new Set(psWindow.map(r => r.order_id).filter(Boolean))
            weeklyRequestsCount = distinct.size
            // Seed recent orders set for realtime dedupe
            recentOrderIdsRef.current = new Set(distinct)
          }
        } catch (_) { /* noop */ }

        // Obtener solicitudes que incluyen productos del proveedor
        // Usar join con request_products y products para filtrar por supplier_id
        const { data: quoteRequests, error: quoteError } = await supabase
          .from('requests')
          .select(`
            request_id,
            created_dt,
            request_products!inner(
              product_id,
              products!inner(
                supplier_id
              )
            )
          `)
          .eq('request_products.products.supplier_id', supplierId)
          .gte('created_dt', getDateRange(7).start)

        if (quoteError) throw quoteError

        // Calcular métricas
        const metrics = {
          totalProducts: productMetrics.length,
          activeProducts: productMetrics.filter(p => p.is_active).length,
          totalSales: orderMetrics.filter(o => o.status === 'completed').length,
          totalRevenue: monthlyRevenue,
          averageRating: 0, // Se puede agregar después
          totalOrders: orderMetrics.length,
          weeklyRequestsCount
        }

        // Datos para gráficos
        const charts = {
          salesData: await generateSalesChart(supplierId),
          productStocks: productMetrics.map(p => ({
            name: p.productid,
            stock: p.productqty || 0
          })),
          weeklyRequests: generateWeeklyRequestsChart(quoteRequests),
          // Reutilizar productMetrics para evitar una segunda consulta a products
          categoryDistribution: await generateCategoryChart(supplierId, productMetrics),
          revenueData: generateRevenueChart(orderMetrics)
        }

        // Calcular tendencias (comparar con período anterior)
        const trends = await calculateTrends(supplierId)

        setDashboardData({
          metrics,
          charts,
          trends
        })
        // Persistir revenue mensual para próxima carga instantánea
        try {
          const nowMonth = metrics ? new Date().toISOString().substring(0,7) : null
          localStorage.setItem('supplier:lastMonthlyRevenue', JSON.stringify({
            supplierId,
            month: nowMonth,
            value: metrics.totalRevenue,
            ts: Date.now()
          }))
        } catch (_) {}
        setLastUpdated(new Date().toISOString())

        return { success: true, data: { metrics, charts, trends } }
      } catch (error) {
        setError(`Error cargando métricas: ${error.message}`)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    })()

    // Guardar promesa en flight map y eliminar cuando termine
    __inFlightDashboardLoads.set(supplierId, p)
    p.finally(() => {
      try { __inFlightDashboardLoads.delete(supplierId) } catch(_) {}
    })

    return await p
  }

  /**
   * Generar datos para gráfico de ventas
   */
  const generateSalesChart = async (supplierId) => {
    try {
      // TODO: Implement proper sales tracking through orders->items->products join
      // For now, return empty data to prevent API errors
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Generar datos para gráfico de solicitudes semanales
   */
  const generateWeeklyRequestsChart = (requests) => {
    const weeklyData = {}
    
    requests.forEach(request => {
      const date = request.created_at.split('T')[0]
      if (!weeklyData[date]) {
        weeklyData[date] = { date, requests: 0 }
      }
      weeklyData[date].requests += 1
    })

    return Object.values(weeklyData)
  }

  /**
   * Generar distribución por categorías
   * Si se proporciona `productsParam` se reutiliza esa lista en vez de
   * volver a consultar la BD, lo que evita queries duplicadas.
   */
  const generateCategoryChart = async (supplierId, productsParam) => {
    try {
      let data
      if (Array.isArray(productsParam)) {
        data = productsParam
      } else {
        const { data: fetched, error } = await supabase
          .from('products')
          .select('category')
          .eq('supplier_id', supplierId)

        if (error) throw error
        data = fetched || []
      }

      const categoryCount = {}
      data.forEach(product => {
        const category = product.category || 'Sin categoría'
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })

      return Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * Generar datos de ingresos
   */
  const generateRevenueChart = (orders) => {
    const monthlyRevenue = {}
    
    orders.forEach(order => {
      if (order.status === 'completed') {
        const month = order.created_at.substring(0, 7) // YYYY-MM
        if (!monthlyRevenue[month]) {
          monthlyRevenue[month] = { month, revenue: 0 }
        }
        monthlyRevenue[month].revenue += order.total_amount || 0
      }
    })

    return Object.values(monthlyRevenue)
  }

  /**
   * Calcular tendencias comparando períodos
   */
  const calculateTrends = async (supplierId) => {
    try {
      // TODO: Implement proper trends calculation through orders->items->products join
      // For now, return neutral trends to prevent API errors
      return { salesGrowth: 0, revenueGrowth: 0, productGrowth: 0 }
    } catch (error) {
      return { salesGrowth: 0, revenueGrowth: 0, productGrowth: 0 }
    }
  }

  // ============================================================================
  // EFECTOS Y CARGAS AUTOMÁTICAS
  // ============================================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.id) {
          // Seed rápido desde cache para evitar parpadeo en 0
          try {
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const cachedRev = smartMetricCache.get('monthlyRevenue', { supplierId: session.user.id, month: monthStart.substring(0,7) })
            if (cachedRev && typeof cachedRev.data === 'number') {
              setDashboardData(prev => ({
                ...prev,
                metrics: { ...prev.metrics, totalRevenue: cachedRev.data }
              }))
            }
          } catch (_) {}
          await loadDashboardMetrics(session.user.id)
        } else {
          // Si no hay sesión inmediatamente, intentar de nuevo después de un breve delay
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession?.user?.id) {
              try {
                const now = new Date()
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                const cachedRev = smartMetricCache.get('monthlyRevenue', { supplierId: retrySession.user.id, month: monthStart.substring(0,7) })
                if (cachedRev && typeof cachedRev.data === 'number') {
                  setDashboardData(prev => ({
                    ...prev,
                    metrics: { ...prev.metrics, totalRevenue: cachedRev.data }
                  }))
                }
              } catch (_) {}
              await loadDashboardMetrics(retrySession.user.id)
            } else {
              setError('No hay sesión activa')
              setLoading(false)
            }
          }, 500) // Esperar 500ms antes de reintentar
        }
      } catch (error) {
        setError('Error al cargar datos del dashboard')
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // ============================================================================
  // API PÚBLICA DEL HOOK
  // ============================================================================

  return {
    // Datos del dashboard
    dashboardData,
    metrics: dashboardData.metrics,
    charts: dashboardData.charts,
    trends: dashboardData.trends,
    
    // Estados
    loading,
    error,
    lastUpdated,

    // Acciones
    loadDashboardMetrics,
    refresh: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        return await loadDashboardMetrics(session.user.id)
      }
      return { success: false, error: 'No hay sesión activa' }
    },
    refreshMonthlyRevenue: async (force = false) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return { success: false, error: 'No hay sesión activa' }
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      smartMetricCache.invalidate('monthlyRevenue', { supplierId: session.user.id, month: monthStart.substring(0,7) })
      return await loadDashboardMetrics(session.user.id)
    },
    clearError: () => setError(null),

    // Utilidades
    getDateRange,
    formatCurrency: (amount, currency = 'CLP') => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
      }).format(amount)
    },
    formatPercentage: (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
    
    // KPIs calculados
    getKPIs: () => {
      const { metrics } = dashboardData
      return {
        productActivityRate: metrics.totalProducts > 0 
          ? (metrics.activeProducts / metrics.totalProducts) * 100 
          : 0,
        averageOrderValue: metrics.totalOrders > 0 
          ? metrics.totalRevenue / metrics.totalOrders 
          : 0,
        conversionRate: 0, // Se puede implementar después
      }
    }
  }
}
