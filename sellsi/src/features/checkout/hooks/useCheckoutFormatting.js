// ============================================================================
// USE CHECKOUT FORMATTING - HOOK PARA FORMATEO EN CHECKOUT
// ============================================================================

import { useMemo } from 'react'

const useCheckoutFormatting = () => {
  
  // Formatear precios
  const formatPrice = useMemo(() => {
    return (amount, currency = 'CLP') => {
      if (typeof amount !== 'number' || isNaN(amount)) return '$0'
      
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }
  }, [])

  // Formatear fechas
  const formatDate = useMemo(() => {
    return (date) => {
      if (!date) return ''
      
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj)
    }
  }, [])

  // Formatear fechas con hora
  const formatDateTime = useMemo(() => {
    return (date) => {
      if (!date) return ''
      
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    }
  }, [])

  // Formatear números
  const formatNumber = useMemo(() => {
    return (number) => {
      if (typeof number !== 'number' || isNaN(number)) return '0'
      
      return new Intl.NumberFormat('es-CL').format(number)
    }
  }, [])

  // Formatear porcentajes
  const formatPercentage = useMemo(() => {
    return (percentage) => {
      if (typeof percentage !== 'number' || isNaN(percentage)) return '0%'
      
      return new Intl.NumberFormat('es-CL', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(percentage / 100)
    }
  }, [])

  // Formatear referencias de pago
  const formatPaymentReference = useMemo(() => {
    return (reference) => {
      if (!reference) return ''
      
      // Formatear como grupos de 4 caracteres
      return reference.replace(/(.{4})/g, '$1 ').trim()
    }
  }, [])

  // Formatear duración
  const formatDuration = useMemo(() => {
    return (minutes) => {
      if (!minutes || minutes < 1) return 'Inmediato'
      
      if (minutes < 60) {
        return `${minutes} min`
      }
      
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      
      if (remainingMinutes === 0) {
        return `${hours} hora${hours > 1 ? 's' : ''}`
      }
      
      return `${hours}h ${remainingMinutes}min`
    }
  }, [])

  // Formatear estado de pago
  const formatPaymentStatus = useMemo(() => {
    return (status) => {
      const statusMap = {
        pending: 'Pendiente',
        processing: 'Procesando',
        completed: 'Completado',
        failed: 'Fallido',
        cancelled: 'Cancelado'
      }
      
      return statusMap[status] || status
    }
  }, [])

  // Calcular y formatear IVA
  const calculateAndFormatTax = useMemo(() => {
    return (subtotal, taxRate = 0.19) => {
      if (typeof subtotal !== 'number' || isNaN(subtotal)) return '$0'
      
      const tax = Math.round(subtotal * taxRate)
      return formatPrice(tax)
    }
  }, [formatPrice])

  // Calcular total con IVA
  const calculateTotal = useMemo(() => {
    return (subtotal, taxRate = 0.19, shipping = 0, discount = 0) => {
      if (typeof subtotal !== 'number' || isNaN(subtotal)) return 0
      
      const tax = Math.round(subtotal * taxRate)
      const total = subtotal + tax + shipping - discount
      
      return Math.max(0, total)
    }
  }, [])

  return {
    formatPrice,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercentage,
    formatPaymentReference,
    formatDuration,
    formatPaymentStatus,
    calculateAndFormatTax,
    calculateTotal
  }
}

export default useCheckoutFormatting
