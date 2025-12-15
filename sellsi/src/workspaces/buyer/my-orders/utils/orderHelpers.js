/**
 * Order helpers utilities
 * Extracted from BuyerOrders.jsx for reusability and testability
 */

import { normalizeOrderStatus } from './orderStatusUtils'

/**
 * Calcula el monto de envío desde diferentes campos posibles
 * @param {Object} order - Order object
 * @returns {number} Shipping amount
 */
export const getShippingAmount = (order) => {
  const shippingValue =
    order?.shipping_amount ??
    order?.shipping ??
    order?.total_shipping ??
    order?.shipping_cost ??
    0
  const parsed = Number(shippingValue)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Formatea el número de orden desde cart_id
 * @param {string} cartId - Cart/Order ID
 * @returns {string} Formatted order number (e.g., #AB12CD34)
 */
export const formatOrderNumber = (cartId) => {
  if (!cartId) return 'N/A'
  return `#${cartId.slice(-8).toUpperCase()}`
}

/**
 * Extrae el ID del supplier de un item
 * @param {Object} item - Order item
 * @returns {string} Supplier ID or 'unknown'
 */
export const extractSupplierId = (item) => {
  return (
    item.product?.supplier?.id ||
    item.product?.supplier_id ||
    item.supplier_id ||
    item.product?.supplierId ||
    'unknown'
  )
}

/**
 * Calcula el precio unitario de un item
 * @param {Object} item - Order item
 * @returns {number} Unit price
 */
export const calculateItemUnitPrice = (item) => {
  const unit =
    typeof item.price_at_addition === 'number' && Number.isFinite(item.price_at_addition)
      ? item.price_at_addition
      : typeof item.product?.price === 'number' && Number.isFinite(item.product.price)
      ? item.product.price
      : 0
  return unit
}

/**
 * Calcula el total de línea de un item
 * @param {Object} item - Order item
 * @returns {number} Line total (unit price * quantity)
 */
export const calculateItemLineTotal = (item) => {
  const unit = calculateItemUnitPrice(item)
  return unit * (item.quantity || 0)
}

/**
 * Deduplica facturas por supplier
 * @param {Object} order - Order with items
 * @returns {Array} Array of unique invoices per supplier
 */
export const getDeduplicatedInvoices = (order) => {
  const supplierInvoiceMap = {}
  
  ;(order.items || []).forEach((it) => {
    const invoicePath = it.invoice_path || it.invoice || null
    if (!invoicePath) return
    
    const supplierId = extractSupplierId(it)
    
    if (!supplierInvoiceMap[supplierId]) {
      const rawDt = (it.document_type || it.documentType || '').toLowerCase()
      const documentType = rawDt === 'factura' || rawDt === 'boleta' ? rawDt : 'documento'
      
      supplierInvoiceMap[supplierId] = {
        supplierName:
          it.product?.supplier?.name ||
          it.supplier_name ||
          it.product?.proveedor ||
          'Proveedor',
        invoicePath,
        documentType,
      }
    }
  })
  
  return Object.values(supplierInvoiceMap)
}

/**
 * Construye el contexto de orden para ContactModal
 * @param {Object|null} order - Order object
 * @returns {Object|null} Context object for ContactModal
 */
export const buildOrderContextForContact = (order) => {
  if (!order) return null

  const suppliers = []
  const productsInfo = []
  
  if (Array.isArray(order.items)) {
    const suppliersMap = new Map()
    
    order.items.forEach(item => {
      // Extraer proveedor
      const supplierId = extractSupplierId(item)
      const supplierName = item.product?.supplier?.name || item.product?.proveedor
      const verified = item.product?.supplier?.verified || item.product?.verified || false
      
      if (supplierId && !suppliersMap.has(supplierId)) {
        suppliersMap.set(supplierId, {
          id: supplierId,
          name: supplierName || 'Proveedor desconocido',
          verified: verified
        })
      }
      
      // Extraer producto
      productsInfo.push({
        name: item.product?.name || 'Producto',
        quantity: item.quantity || 0,
        price: item.price_at_addition || item.product?.price || 0
      })
    })
    
    suppliers.push(...Array.from(suppliersMap.values()))
  }
  
  return {
    source: 'buyer_order_support',
    order: {
      order_id: order.order_id,
      parent_order_id: order.parent_order_id,
      status: order.status,
      payment_status: order.payment_status,
      is_multi_supplier: order.is_supplier_part,
      supplier_id: order.supplier_id,
      suppliers: suppliers,
      products: productsInfo,
      total: order.final_amount || order.total_amount || 0
    }
  }
}

/**
 * Estado de producto basado exclusivamente en el estado del pedido (fuente de verdad backend)
 * @param {Object} _item - Order item (unused, kept for API compatibility)
 * @param {string} _orderDate - Order date (unused, kept for API compatibility)
 * @param {string} orderStatus - Order status
 * @returns {string} Normalized product status
 */
export const getProductStatus = (_item, _orderDate, orderStatus) => {
  if (orderStatus === 'cancelled') return 'rejected' // unificamos cancelado como rechazado para el primer chip
  return normalizeOrderStatus(orderStatus)
}
