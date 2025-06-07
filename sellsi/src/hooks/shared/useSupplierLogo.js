import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

/**
 * Hook para obtener el logo del proveedor logueado
 * Retorna la URL del logo y estado de carga
 */
export const useSupplierLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSupplierLogo = async () => {
      // Obtener supplierid del localStorage
      const supplierid = localStorage.getItem('supplierid')

      if (!supplierid) {
        setLogoUrl(null)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Consultar logo del proveedor en la tabla suppliers
        const { data, error } = await supabase
          .from('suppliers')
          .select('logo_url')
          .eq('supplierid', supplierid)
          .single()

        if (error) {
          console.error('Error fetching supplier logo:', error)
          setLogoUrl(null)
        } else {
          setLogoUrl(data?.logo_url || null)
        }
      } catch (error) {
        console.error('Error in useSupplierLogo:', error)
        setLogoUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSupplierLogo()
  }, [])

  return { logoUrl, loading }
}
