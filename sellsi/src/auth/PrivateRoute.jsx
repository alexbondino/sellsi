import React from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Ruta protegida que verifica autenticación y tipo de cuenta.
 * @param {React.ReactNode} children - Componentes a renderizar si está autenticado
 * @param {string} requiredAccountType - Tipo de cuenta requerido: 'proveedor', 'comprador', o 'any'
 * @param {string} redirectTo - Ruta a la que redirigir si no está autenticado (default: '/')
 */
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
  // Verificar si existe autenticación
  const supplierid = localStorage.getItem('supplierid')
  const sellerid = localStorage.getItem('sellerid')
  const user_id = localStorage.getItem('user_id')
  const accountType = localStorage.getItem('account_type')

  const isAuthenticated = !!(supplierid || sellerid || user_id)

  // Si no está autenticado, redirigir
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Si se requiere un tipo de cuenta específico, verificarlo
  if (requiredAccountType !== 'any' && accountType !== requiredAccountType) {
    // Redirigir según el tipo de cuenta actual
    if (accountType === 'proveedor') {
      return <Navigate to="/supplier/home" replace />
    } else if (accountType === 'comprador') {
      return <Navigate to="/buyer/marketplace" replace />
    } else {
      return <Navigate to={redirectTo} replace />
    }
  }

  return children
}

export default PrivateRoute
