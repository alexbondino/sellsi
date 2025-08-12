/**
 * ============================================================================
 * SUPPLIER DASHBOARD - DASHBOARD Y ANALYTICS ESPECIALIZADO
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

import { useEffect, useState } from 'react'
import { supabase } from '../../../../services/supabase'

export const useSupplierDashboard = () => {
  // ============================================================================
  // ESTADO ESPECIALIZADO EN DASHBOARD
  // ============================================================================
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalProducts: 0,
      activeProducts: 0,
      totalSales: 0,
      totalRevenue: 0,
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

  /**
   * Cargar métricas principales del proveedor
   */
  const loadDashboardMetrics = async (supplierId) => {
    setLoading(true)
    setError(null)

    try {
      // Obtener métricas básicas de productos
      const { data: productMetrics, error: prodError } = await supabase
        .from('products')
        .select('productid, price, productqty, is_active, createddt')
        .eq('supplier_id', supplierId)

      if (prodError) throw prodError

      // Calcular ingresos del MES desde la tabla 'product_sales' por supplier_id
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      const { data: psRows, error: psErr } = await supabase
        .from('product_sales')
        .select('amount, trx_date')
        .eq('supplier_id', supplierId)
        .gte('trx_date', monthStart)
        .lt('trx_date', nextMonth)

      if (psErr) {
        // No bloquear métricas si falla
      }
      const monthlyRevenue = (psRows || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      const orderMetrics = []

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
        totalOrders: orderMetrics.length
      }

      // Datos para gráficos
      const charts = {
        salesData: await generateSalesChart(supplierId),
        productStocks: productMetrics.map(p => ({
          name: p.productid,
          stock: p.productqty || 0
        })),
        weeklyRequests: generateWeeklyRequestsChart(quoteRequests),
        categoryDistribution: await generateCategoryChart(supplierId),
        revenueData: generateRevenueChart(orderMetrics)
      }

      // Calcular tendencias (comparar con período anterior)
      const trends = await calculateTrends(supplierId)

      setDashboardData({
        metrics,
        charts,
        trends
      })
      setLastUpdated(new Date().toISOString())

      return { success: true, data: { metrics, charts, trends } }
    } catch (error) {
      setError(`Error cargando métricas: ${error.message}`)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
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
   */
  const generateCategoryChart = async (supplierId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('supplier_id', supplierId)

      if (error) throw error

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
          await loadDashboardMetrics(session.user.id)
        } else {
          // Si no hay sesión inmediatamente, intentar de nuevo después de un breve delay
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession?.user?.id) {
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
