/**
 * ============================================================================
 * SUPPLIER DASHBOARD - DASHBOARD Y ANALYTICS
 * ============================================================================
 *
 * Hook especializado para manejo del dashboard del proveedor.
 * Maneja: métricas, analytics, estados generales, filtros básicos.
 */

import { useEffect, useState } from 'react'
import { supabase } from '../../../../services/supabase'

export const useSupplierDashboard = () => {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [productStocks, setProductStocks] = useState([])
  const [weeklyRequests, setWeeklyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de operaciones específicas para compatibilidad
  const [deleting, setDeleting] = useState({})
  const [updating, setUpdating] = useState({})

  // Estados de filtros para compatibilidad
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updateddt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filteredProducts, setFilteredProducts] = useState([])

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

  // Función para cargar productos con imágenes y tramos de precio (como el original)
  const loadProducts = async (supplierId) => {
    setLoading(true)
    setError(null)

    try {
      // Obtener productos del proveedor, incluyendo imágenes
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('supplier_id', supplierId)
        .order('updateddt', { ascending: false })

      if (prodError) throw prodError

      // Obtener todos los tramos de precio de estos productos
      const productIds = products.map((p) => p.productid)
      let priceTiers = []

      if (productIds.length > 0) {
        const { data: tiers, error: tierError } = await supabase
          .from('product_quantity_ranges')
          .select('*')
          .in('product_id', productIds)

        if (tierError) throw tierError
        priceTiers = tiers
      }

      // Asociar tramos a cada producto
      const productsWithTiers = products.map((p) => ({
        ...p,
        priceTiers: priceTiers.filter((t) => t.product_id === p.productid),
      }))

      setProducts(productsWithTiers)
      setFilteredProducts(productsWithTiers)
      setProductStocks(productsWithTiers.map((p) => ({ productqty: p.productqty })))
      
      return { success: true }
    } catch (error) {
      setError(error.message || 'Error al cargar productos')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
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
        // Cargar productos directamente (sin usar loadProducts para evitar loop)
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('*, product_images(*)')
          .eq('supplier_id', supplierId)
          .order('updateddt', { ascending: false })

        if (prodError) throw prodError

        // Cargar tramos de precio (opcional - tabla puede no existir)
        let priceTiers = []
        
        // COMENTADO: Funcionalidad avanzada price_tiers no implementada
        // if (products && products.length > 0) {
        //   try {
        //     const productIds = products.map((p) => p.productid)
        //     const { data: tiers, error: tierError } = await supabase
        //       .from('price_tiers')
        //       .select('*')
        //       .in('product_id', productIds)
        //       .order('min_qty', { ascending: true })

        //     if (tierError) {
        //       // Si la tabla no existe, solo loguear y continuar
        //       if (tierError.code === '42P01') {
        //         console.warn('Tabla price_tiers no existe, continuando sin tramos de precio')
        //       } else {
        //         throw tierError
        //       }
        //     } else {
        //       priceTiers = tiers || []
        //     }
        //   } catch (tierErr) {
        //     console.warn('Error cargando price_tiers:', tierErr.message)
        //     // Continuar sin tramos de precio
        //   }
        // }

        // Asociar tramos a cada producto
        const productsWithTiers = products.map((p) => ({
          ...p,
          priceTiers: priceTiers.filter((t) => t.product_id === p.productid),
        }))

        setProducts(productsWithTiers)
        setFilteredProducts(productsWithTiers)
        setProductStocks(productsWithTiers.map((p) => ({ productqty: p.productqty })))

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
        const productIds = products.map((p) => p.productid)

        if (productIds.length > 0) {
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

  // Métodos para compatibilidad con el hook original
  const applyFilters = () => {
    let filtered = [...products]
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.productnm?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }
    
    setFilteredProducts(filtered)
  }

  const getProductById = (productId) => {
    return products.find(p => p.productid === productId)
  }

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    applyFilters()
  }, [products, searchTerm, categoryFilter, sortBy, sortOrder])

  return {
    // Estados principales
    products,
    filteredProducts,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
    loading,
    error,

    // Estados de operaciones para compatibilidad
    deleting,
    updating,

    // Estados de filtros para compatibilidad
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,

    // Métodos para compatibilidad con el hook original
    loadProducts,
    setSearchTerm,
    setCategoryFilter,
    setSorting: (field, order) => {
      setSortBy(field)
      setSortOrder(order)
    },
    applyFilters,
    getProductById,
    clearFilters: () => {
      setSearchTerm('')
      setCategoryFilter('all')
      setSortBy('updateddt')
      setSortOrder('desc')
    },

    // Métodos básicos para compatibilidad
    addProduct: async () => { throw new Error('addProduct no implementado en dashboard hook') },
    updateProduct: async () => { throw new Error('updateProduct no implementado en dashboard hook') },
    deleteProduct: async () => { throw new Error('deleteProduct no implementado en dashboard hook') },
  }
}

export default useSupplierDashboard
