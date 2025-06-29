import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/**
 * Hook para obtener productos del marketplace, usando mocks o backend según flag.
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    if (USE_MOCKS) {
      setProducts(PRODUCTOS)
      setLoading(false)
    } else {
      supabase
        .from('products')
        .select('*, product_images(*)')
        .then(async ({ data, error }) => {
          if (!isMounted) return
          if (error) setError(error.message)
          let mapped = []
          if (data && data.length > 0) {
            // Obtener todos los productids y supplier_ids
            const productIds = data.map((p) => p.productid)
            const supplierIds = [...new Set(data.map((p) => p.supplier_id))]            // Traer todos los tramos de precio de una vez
            const { data: tiersData } = await supabase
              .from('product_quantity_ranges')
              .select('*')
              .in('product_id', productIds)// Traer nombres de proveedores
            let usersMap = {}
            if (supplierIds.length > 0) {
              const supplierIdsStr = supplierIds.map(id => String(id).trim())
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('user_id, user_nm')
                .in('user_id', supplierIdsStr)
              if (usersError) {
                console.error('Error al consultar users:', usersError)
              }
              if (usersData) {
                usersMap = Object.fromEntries(
                  usersData.map((u) => [u.user_id, u.user_nm])
                )
              }
            }            mapped = data.map((p) => {
              // Obtener imagen principal
              const imagenPrincipal = p.product_images && p.product_images.length > 0 
                ? p.product_images[0].image_url 
                : '/placeholder-product.jpg'
              
              // Obtener tramos de precio para este producto
              const priceTiers = tiersData 
                ? tiersData.filter(t => t.product_id === p.productid) 
                : []
              
              // Calcular precio mínimo y máximo
              let minPrice = p.price || 0
              let maxPrice = p.price || 0
              
              if (priceTiers.length > 0) {
                const precios = priceTiers.map(t => t.price)
                minPrice = Math.min(...precios)
                maxPrice = Math.max(...precios)
              }

              return {
                id: p.productid,
                productid: p.productid,
                supplier_id: p.supplier_id,
                nombre: p.productnm,
                proveedor: usersMap[p.supplier_id] || "Proveedor no encontrado",
                imagen: imagenPrincipal,
                precio: minPrice,
                precioOriginal: p.precioOriginal || null,
                descuento: p.descuento || 0,
                categoria: p.category,
                tipo: p.product_type || 'nuevo',
                tipoVenta: p.tipoVenta || 'directa',
                rating: p.rating || 0,
                ventas: p.ventas || 0,
                stock: p.productqty,
                compraMinima: p.minimum_purchase,
                negociable: p.negociable,
                priceTiers,
                maxPrice,
                minPrice,
              }
            })
          }
          setProducts(mapped)
          setLoading(false)
        })
    }
    return () => {
      isMounted = false
    }
  }, [])

  return { products, loading, error }
}
