/**
 * ============================================================================
 * ERROR BOUNDARIES INDEX - EXPORTACIONES CENTRALIZADAS
 * ============================================================================
 *
 * Punto central de exportación para todos los Error Boundaries del dominio Supplier.
 * Facilita las importaciones y mantiene la organización del código.
 */

import { useCallback, useState } from 'react'

// Error Boundaries específicos del dominio Supplier
export { default as SupplierErrorBoundary } from './SupplierErrorBoundary'
export { default as ProductFormErrorBoundary } from './ProductFormErrorBoundary'  
export { default as ImageUploadErrorBoundary } from './ImageUploadErrorBoundary'

/**
 * Hook de utilidad para manejo de errores en el dominio Supplier
 */
export const useSupplierErrorHandler = () => {
  const [errorCount, setErrorCount] = useState(0)
  const [lastError, setLastError] = useState(null)

  const handleError = useCallback((error, context = 'Supplier') => {
    console.group(`🚨 ${context} Error Handler`)
    console.error('Error:', error)
    console.error('Timestamp:', new Date().toISOString())
    console.groupEnd()

    setErrorCount(prev => prev + 1)
    setLastError({
      error,
      context,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const resetErrors = useCallback(() => {
    setErrorCount(0)
    setLastError(null)
  }, [])

  return {
    handleError,
    resetErrors,
    errorCount,
    lastError,
  }
}
