/**
 * Order status chips utility functions.
 * Extracted from BuyerOrders.jsx for reusability and testability.
 * 
 * Provides functions to generate status chip configurations for buyer orders.
 */

/**
 * Get payment chip information based on payment status.
 * @param {string} paymentStatus - 'paid' | 'expired' | 'pending'
 * @returns {{ label: string, color: string, tooltip: string }}
 */
export const getPaymentChipInfo = (paymentStatus) => {
  switch (paymentStatus) {
    case 'paid':
      return {
        label: 'Pago Confirmado',
        color: 'success',
        tooltip: 'Pago confirmado.'
      };
    case 'expired':
      return {
        label: 'Pago Expirado',
        color: 'error',
        tooltip: 'El tiempo para completar el pago se agotó (20 minutos).'
      };
    case 'pending':
    default:
      return {
        label: 'Procesando Pago',
        color: 'warning',
        tooltip: 'Pago en proceso.'
      };
  }
};

/**
 * Generate status chips configuration for an order.
 * Used to display the 4-stage progress indicator in BuyerOrders.
 * 
 * @param {string} status - Order status: 'pending' | 'accepted' | 'rejected' | 'in_transit' | 'delivered' | 'cancelled'
 * @param {string} paymentStatus - Payment status: 'paid' | 'pending' | 'expired'
 * @param {Object|null} order - Optional order object to check cancelled_at field
 * @returns {Array<{key: string, label: string, active: boolean, color: string, tooltip: string}>}
 */
export const getStatusChips = (status, paymentStatus, order = null) => {
  // FIX: Verificar cancelled_at además de status para determinar cancelación real
  const isPaymentExpired = paymentStatus === 'expired';
  // Do not treat a payment expiration alone as a rejected/cancelled order for UI chips.
  // If payment expired, avoid marking cancelled/rejected chips as active.
  const isCancelled = (status === 'cancelled' || (order && order.cancelled_at)) && !isPaymentExpired;
  const isRejected = (status === 'rejected' && !isPaymentExpired) || isCancelled;

  if (isRejected) {
    const paymentInfo = getPaymentChipInfo(paymentStatus);
    return [
      // Un único chip de pago que evoluciona según payment_status
      {
        key: 'pago',
        label: paymentInfo.label,
        active: paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'expired',
        color: paymentInfo.color,
        tooltip: paymentInfo.tooltip
      },
      { 
        key: 'rechazado', 
        label: isCancelled ? 'Cancelado' : 'Rechazado', 
        active: true, 
        color: 'error', 
        tooltip: isCancelled ? 'Tu pedido fue cancelado.' : 'Tu pedido fue rechazado por el proveedor.' 
      },
      { 
        key: 'en_transito', 
        label: 'En Transito', 
        active: false, 
        color: 'default', 
        tooltip: 'Pendiente de despacho por el proveedor.' 
      },
      { 
        key: 'entregado', 
        label: 'Entregado', 
        active: false, 
        color: 'default', 
        tooltip: 'Aún no se ha entregado.' 
      }
    ];
  }

  // Determinar clave activa única
  let activeKey = null;
  // FIX: Si hay cancelled_at, la orden está cancelada independientemente del status
  if (order && order.cancelled_at) {
    activeKey = 'rechazado'; // Mostrar como cancelado
  } else if (status === 'delivered') {
    activeKey = 'entregado';
  } else if (status === 'in_transit') {
    activeKey = 'en_transito';
  } else if (status === 'accepted') {
    activeKey = 'aceptado';
  } else if (paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'expired') {
    activeKey = 'pago';
  }

  const chips = [
    // Un único chip de pago. La etiqueta y el estilo se deciden por el estado de pago.
    {
      key: 'pago',
      label: paymentStatus === 'paid' 
        ? 'Pago Confirmado' 
        : paymentStatus === 'expired' 
          ? 'Pago Expirado' 
          : 'Procesando Pago',
      active: activeKey === 'pago',
      // IMPROVEMENT: Si ya hemos avanzado más allá del pago, mostrar como completado
      color: (activeKey === 'pago') 
        ? (paymentStatus === 'paid' ? 'success' : paymentStatus === 'expired' ? 'error' : 'warning')
        : (paymentStatus === 'paid' && ['aceptado', 'en_transito', 'entregado'].includes(activeKey)) 
          ? 'success' : 'default',
      tooltip: paymentStatus === 'paid'
        ? 'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.'
        : paymentStatus === 'expired'
          ? 'El tiempo para completar el pago se agotó (20 minutos).'
          : 'Estamos verificando tu pago.'
    },
    {
      key: 'aceptado',
      label: 'Pedido Aceptado',
      active: activeKey === 'aceptado',
      color: 'info',
      tooltip: activeKey === 'aceptado'
        ? 'El proveedor aceptó tu pedido.'
        : 'En espera de aceptación por el proveedor.'
    },
    {
      key: 'en_transito',
      label: 'En Transito',
      active: activeKey === 'en_transito',
      color: 'secondary',
      tooltip: activeKey === 'en_transito'
        ? 'El pedido fue despachado y está en camino.'
        : 'Pendiente de despacho por el proveedor.'
    },
    {
      key: 'entregado',
      label: 'Entregado',
      active: activeKey === 'entregado',
      color: 'success',
      tooltip: activeKey === 'entregado'
        ? 'El pedido fue entregado.'
        : 'Aún no se ha entregado.'
    }
  ];
  
  return chips;
};

/**
 * Normalize order status for consistent handling.
 * @param {string} orderStatus - Raw order status
 * @returns {string} Normalized status
 */
export const normalizeOrderStatus = (orderStatus) => {
  const allowed = ['pending', 'accepted', 'rejected', 'in_transit', 'delivered', 'cancelled'];
  return allowed.includes(orderStatus) ? orderStatus : 'pending';
};
