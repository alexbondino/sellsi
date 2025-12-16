/**
 * 🔐 Hook para obtener información del admin actual
 * 
 * TODO: Integrar con sistema de autenticación real (Supabase Auth)
 * Por ahora retorna datos mock para desarrollo
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Enero de 2025
 */

import { useState, useEffect } from 'react'
// import { supabase } from '@/infrastructure/supabase/supabaseClient' // Descomentar cuando esté listo

/**
 * Hook para obtener información del administrador autenticado
 * @returns {Object} { adminId, adminName, adminEmail, loading, error }
 */
export const useCurrentAdmin = () => {
  const [adminData, setAdminData] = useState({
    adminId: null,
    adminName: null,
    adminEmail: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
          // 1) Si hay sesión guardada por AdminLogin, usarla
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adminUser') : null
          if (raw) {
            const user = JSON.parse(raw)
            if (user?.id) {
              setAdminData({
                adminId: user.id,
                adminName: user.full_name || user.usuario || user.email || 'Administrador',
                adminEmail: user.email || null,
                loading: false,
                error: null
              })
              return
            }
          }

          // 2) Fallback: modo desarrollo (sin sesión)
          setTimeout(() => {
            setAdminData({
              adminId: 'admin_dev_001',
              adminName: 'Admin Desarrollo',
              adminEmail: 'admin@sellsi.com',
              loading: false,
              error: null
            })
          }, 250)
          return

        // 🚀 PRODUCCIÓN: Descomentar cuando esté listo el auth
        // const { data: { user }, error } = await supabase.auth.getUser()
        // 
        // if (error) throw error
        // 
        // if (!user) {
        //   throw new Error('No hay usuario autenticado')
        // }
        // 
        // // Obtener datos adicionales del admin desde control_panel_users
        // const { data: adminInfo, error: adminError } = await supabase
        //   .from('control_panel_users')
        //   .select('id, name, email, role')
        //   .eq('id', user.id)
        //   .single()
        // 
        // if (adminError) throw adminError
        // 
        // if (adminInfo.role !== 'admin') {
        //   throw new Error('Usuario no tiene permisos de administrador')
        // }
        // 
        // setAdminData({
        //   adminId: adminInfo.id,
        //   adminName: adminInfo.name,
        //   adminEmail: adminInfo.email,
        //   loading: false,
        //   error: null
        // })
      } catch (err) {
        console.error('Error obteniendo datos del admin:', err)
        setAdminData({
          adminId: null,
          adminName: null,
          adminEmail: null,
          loading: false,
          error: err.message
        })
      }
    }

    fetchAdminData()
  }, [])

  return adminData
}

/**
 * Versión simplificada que solo retorna el adminId
 * Útil para formularios y acciones rápidas
 */
export const useAdminId = () => {
  const { adminId, loading, error } = useCurrentAdmin()
  return { adminId, loading, error }
}

export default useCurrentAdmin
