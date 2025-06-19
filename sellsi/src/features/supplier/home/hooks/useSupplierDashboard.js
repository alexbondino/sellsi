import { useEffect, useState } from 'react'
import { supabase } from '../../../../services/supabase'

export const useSupplierDashboard = () => {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productStocks, setProductStocks] = useState([])
  const [weeklyRequests, setWeeklyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setError('No hay sesión activa')
        setLoading(false)
        return
      }

      const supplierId = session.user.id

      try {
        // Productos del proveedor
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('supplier_id', supplierId)

        if (productsError) throw productsError

        setProducts(productsData)
        setProductStocks(
          productsData.map((p) => ({ productqty: p.productqty }))
        )

        // Ventas del proveedor (tabla sales)
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('amount, trx_date')
          .eq('user_id', supplierId)

        if (salesError) throw salesError

        setSales(salesData)

        // Solicitudes semanales
        const start = getStartOfWeek()
        const end = getEndOfWeek()

        const productIds = productsData.map((p) => p.productid)

        if (productIds.length > 0) {
          // Simplify the query to avoid foreign key issues
          // Get request_products for the supplier's products and then join manually
          const { data: requestProductsData, error: requestProductsError } = await supabase
            .from('request_products')
            .select(`
              *,
              requests!inner (
                request_id,
                created_dt,
                buyer_id,
                label,
                total_sale
              ),
              products!inner (
                productid,
                productnm,
                supplier_id
              )
            `)
            .in('product_id', productIds)

          if (requestProductsError) {
            console.warn('Error loading weekly requests:', requestProductsError)
            setWeeklyRequests([])
          } else {
            // Filter by date range and add user information if needed
            const filteredRequests = (requestProductsData || []).filter(item => {
              if (!item.requests?.created_dt) return false
              const createdDate = new Date(item.requests.created_dt)
              const startDate = new Date(start)
              const endDate = new Date(end)
              return createdDate >= startDate && createdDate <= endDate
            })

            setWeeklyRequests(filteredRequests)
          }
        } else {
          setWeeklyRequests([])
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err)
        setError('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const totalSales = sales.reduce((acc, s) => acc + Number(s.amount), 0)

  const groupedSales = sales.reduce((acc, sale) => {
    const date = new Date(sale.trx_date)
    const key = `${date.toLocaleString('default', {
      month: 'short',
    })} ${date.getFullYear()}`
    acc[key] = (acc[key] || 0) + Number(sale.amount)
    return acc
  }, {})

  const monthlyData = Object.entries(groupedSales).map(([mes, total]) => ({
    mes,
    total,
  }))

  return {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
    loading,
    error,
  }
}
