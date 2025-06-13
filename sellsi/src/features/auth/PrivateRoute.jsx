import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { Box, CircularProgress, Typography } from '@mui/material'

/**
 * Ruta protegida que verifica autenticación y tipo de cuenta.
 * @param {React.ReactNode} children - Componentes a renderizar si está autenticado
 * @param {string} requiredAccountType - Tipo de cuenta requerido: 'proveedor', 'comprador', o 'any'
 * @param {string} redirectTo - Ruta a la que redirigir si no está autenticado (default: '/')
 */
const PrivateRoute = ({
  children,
  requiredAccountType = 'any',
  redirectTo = '/',
}) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userAccountType, setUserAccountType] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sesión de Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        // Verificar si existe perfil en public.users
        const { data: perfil, error: perfilError } = await supabase
          .from('users')
          .select('main_supplier, user_nm')
          .eq('user_id', session.user.id)
          .single()

        if (perfilError || !perfil) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)
        setUserAccountType(perfil.main_supplier ? 'proveedor' : 'comprador')

        // Actualizar localStorage para mantener compatibilidad
        localStorage.setItem('user_id', session.user.id)
        localStorage.setItem(
          'account_type',
          perfil.main_supplier ? 'proveedor' : 'comprador'
        )
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f5f5f5',
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Verificando sesión...
        </Typography>
      </Box>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Si se requiere un tipo de cuenta específico, verificarlo
  if (
    requiredAccountType !== 'any' &&
    userAccountType !== requiredAccountType
  ) {
    // Redirigir según el tipo de cuenta actual, solo si no está ya en la ruta correcta
    if (
      userAccountType === 'proveedor' &&
      window.location.pathname !== '/supplier/home'
    ) {
      return <Navigate to="/supplier/home" replace />
    } else if (
      userAccountType === 'comprador' &&
      window.location.pathname !== '/buyer/marketplace'
    ) {
      return <Navigate to="/buyer/marketplace" replace />
    } else {
      return children
    }
  }

  return children
}

export default PrivateRoute
