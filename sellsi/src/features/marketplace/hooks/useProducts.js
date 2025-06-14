import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase'
import { PRODUCTOS } from '../products'

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
            const supplierIds = [...new Set(data.map((p) => p.supplier_id))]
            // Traer todos los tramos de precio de una vez
            const { data: tiersData } = await supabase
              .from('product_price_tiers')
              .select('*')
              .in('product_id', productIds)
            // Traer nombres de proveedores
            let usersMap = {}
            if (supplierIds.length > 0) {
              const { data: usersData } = await supabase
                .from('users')
                .select('user_id, user_nm')
                .in('user_id', supplierIds)
              if (usersData) {
                usersMap = Object.fromEntries(
                  usersData.map((u) => [u.user_id, u.user_nm])
                )
              }
            }
            mapped = data.map((p) => {
              const priceTiers = (tiersData || []).filter(
                (t) => t.product_id === p.productid
              )
              let minPrice = p.price,
                maxPrice = p.price
              if (priceTiers.length > 0) {
                minPrice = Math.min(...priceTiers.map((t) => Number(t.price)))
                maxPrice = Math.max(...priceTiers.map((t) => Number(t.price)))
              }

              // ✅ Obtener imagen primaria de product_images
              let imagenPrincipal = p.image_url
              if (
                p.product_images &&
                Array.isArray(p.product_images) &&
                p.product_images.length > 0
              ) {
                const principal = p.product_images.find((img) => img.is_primary)
                if (principal) {
                  imagenPrincipal = principal.image_url
                } else {
                  imagenPrincipal = p.product_images[0].image_url
                }
              }
              return {
                id: p.productid,
                productid: p.productid, // ✅ Agregar productid explícito
                supplier_id: p.supplier_id, // ✅ Agregar supplier_id explícito
                nombre: p.productnm,
                proveedor: usersMap[p.supplier_id] || p.supplier_id,
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
