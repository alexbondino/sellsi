import { useState, useEffect } from 'react'
import { supabase } from '../../../../services/supabase'
import { filterActiveProducts } from '../../../../utils/productActiveStatus'

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
              .from('product_quantity_ranges')
              .select('*')
              .in('product_id', productIds)
            
            // Traer nombres de proveedores
            let usersMap = {}
            if (supplierIds.length > 0) {
              const supplierIdsStr = supplierIds.map(id => String(id).trim())
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('user_id, user_nm, logo_url, descripcion_proveedor, verified') // ✅ AGREGAR campo verified
                .in('user_id', supplierIdsStr)
              if (usersError) {
                console.error('Error al consultar users:', usersError)
              }
              if (usersData) {
                usersMap = Object.fromEntries(
                  usersData.map((u) => [u.user_id, { name: u.user_nm, logo_url: u.logo_url, descripcion_proveedor: u.descripcion_proveedor, verified: u.verified }]) // ✅ AGREGAR campo verified
                )
              }
            }
            
            mapped = data.map((p) => {
              // Obtener imagen principal y thumbnail
              const imagenPrincipal = p.product_images && p.product_images.length > 0 
                ? p.product_images[0].image_url 
                : '/placeholder-product.jpg'
              
              // ✅ NUEVO: Obtener thumbnail_url (fallback)
              const thumbnailUrl = p.product_images && p.product_images.length > 0 
                ? p.product_images[0].thumbnail_url 
                : null
              
              // ✅ NUEVO: Obtener thumbnails object (responsive thumbnails)
              const thumbnails = p.product_images && p.product_images.length > 0 && p.product_images[0].thumbnails
                ? (typeof p.product_images[0].thumbnails === 'string' 
                   ? JSON.parse(p.product_images[0].thumbnails) 
                   : p.product_images[0].thumbnails)
                : null
              
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
                proveedor: usersMap[p.supplier_id]?.name || "Proveedor no encontrado", // ✅ USAR .name
                supplier_logo_url: usersMap[p.supplier_id]?.logo_url, // ✅ AGREGAR logo del proveedor
                descripcion_proveedor: usersMap[p.supplier_id]?.descripcion_proveedor, // ✅ AGREGAR descripcion_proveedor
                proveedorVerificado: usersMap[p.supplier_id]?.verified || false, // ✅ AGREGAR estado de verificación del proveedor
                imagen: imagenPrincipal,
                thumbnails: thumbnails, // ✅ NUEVO: Agregar object thumbnails responsive
                thumbnail_url: thumbnailUrl, // ✅ FALLBACK: Mantener thumbnail_url como fallback
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
                minimum_purchase: p.minimum_purchase, // Mantener ambos nombres para compatibilidad
                negociable: p.negociable,
                is_active: p.is_active, // ✅ AGREGAR estado activo de BD
                priceTiers,
                maxPrice,
                minPrice,
              }
            })
          }
          
          // ✅ APLICAR FILTRO DE PRODUCTOS ACTIVOS: solo mostrar productos con stock >= compra mínima
          const activeProducts = filterActiveProducts(mapped);
          setProducts(activeProducts);
          setLoading(false);
        })
    }
    return () => {
      isMounted = false
    }
  }, [])

  return { products, loading, error }
}

// Mock products data (unchanged)
const PRODUCTOS = [
  // ... existing mock data would go here
];