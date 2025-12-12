/**
 * Helper para construir mensajes enriquecidos del ContactModal
 * Adapta el mensaje según el contexto de invocación
 */

import { formatCurrency } from '../../../utils/formatters';

/**
 * Extrae información de proveedores desde los items de una orden
 * @param {Array} items - Items de la orden
 * @returns {Array} Lista de proveedores únicos con su info
 */
function extractSupplierInfo(items) {
  if (!Array.isArray(items)) return [];
  
  const suppliersMap = new Map();
  
  items.forEach(item => {
    const supplierId = item.product?.supplier?.id || item.product?.supplier_id || item.supplier_id;
    const supplierName = item.product?.supplier?.name || item.product?.proveedor || 'Proveedor desconocido';
    const verified = item.product?.supplier?.verified || item.product?.verified || false;
    
    if (supplierId && !suppliersMap.has(supplierId)) {
      suppliersMap.set(supplierId, {
        id: supplierId,
        name: supplierName,
        verified: verified
      });
    }
  });
  
  return Array.from(suppliersMap.values());
}

/**
 * Formatea número de orden para display (primeros 8 chars del UUID)
 */
function formatOrderNumber(orderId) {
  if (!orderId) return 'N/A';
  const id = String(orderId);
  return id.slice(0, 8).toUpperCase();
}

/**
 * Traduce estados de orden
 */
function translateOrderStatus(status) {
  const translations = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    in_transit: 'En Tránsito',
    dispatched: 'Despachado',
    delivered: 'Entregado',
    paid: 'Pagado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    expired: 'Expirado'
  };
  return translations[status] || status;
}

/**
 * Traduce estados de pago
 */
function translatePaymentStatus(paymentStatus) {
  const translations = {
    pending: 'Pendiente',
    paid: 'Confirmado',
    expired: 'Expirado',
    failed: 'Fallido'
  };
  return translations[paymentStatus] || paymentStatus;
}

/**
 * Traduce rutas técnicas a nombres legibles
 */
function translateInvokedPath(path) {
  if (!path) return 'Desconocido';
  
  const translations = {
    // Buyer
    '/buyer/orders': 'Mis Pedidos (Comprador)',
    '/buyer/marketplace': 'Marketplace',
    '/buyer/offers': 'Mis Ofertas (Comprador)',
    '/buyer/cart': 'Carrito de Compras',
    '/buyer/paymentmethod': 'Método de Pago',
    '/buyer/profile': 'Mi Perfil',
    
    // Supplier
    '/supplier/home': 'Dashboard Proveedor',
    '/supplier/myproducts': 'Gestión de Productos',
    '/supplier/addproduct': 'Crear Producto',
    '/supplier/my-orders': 'Mis Pedidos (Proveedor)',
    '/supplier/offers': 'Mis Ofertas (Proveedor)',
    '/supplier/marketplace': 'Marketplace',
    '/supplier/profile': 'Mi Perfil',
    
    // Public
    '/': 'Página de Inicio',
    '/marketplace': 'Catálogo de Productos',
    '/login': 'Inicio de Sesión',
    '/crear-cuenta': 'Registro',
    '/terms-and-conditions': 'Términos y Condiciones',
    '/privacy-policy': 'Política de Privacidad'
  };
  
  // Manejar rutas de productos con ID/slug
  if (path.startsWith('/marketplace/product/')) {
    return 'Ficha Técnica';
  }
  
  // Manejar rutas con query params
  const pathWithoutQuery = path.split('?')[0];
  
  return translations[pathWithoutQuery] || pathWithoutQuery;
}

/**
 * Construye el mensaje enriquecido según el contexto
 * @param {Object} params - Parámetros para construir el mensaje
 * @param {string} params.originalMessage - Mensaje original del usuario
 * @param {string} params.invokedFrom - Path desde donde se invocó
 * @param {string} params.userId - ID del usuario
 * @param {string} params.userEmail - Email del usuario
 * @param {Object} params.userProfile - Perfil del usuario (company_nm, phone, etc)
 * @param {Object} params.context - Contexto específico de invocación
 * @returns {string} Mensaje enriquecido formateado
 */
export function buildEnrichedContactMessage({
  originalMessage,
  invokedFrom,
  userId,
  userEmail,
  userProfile,
  context
}) {
  const lines = ['[CONTACTO VÍA MODAL]', '━━━━━━━━━━━━━━━━━━━━━━'];

  // Información básica de invocación con traducción amigable
  const friendlyPath = translateInvokedPath(invokedFrom);
  const pathDisplay = friendlyPath === invokedFrom 
    ? friendlyPath 
    : `${friendlyPath} (${invokedFrom})`;
  
  lines.push(`📍 Sección: ${pathDisplay}`);

  // ============================================================================
  // CONTEXTO ESPECÍFICO SEGÚN TIPO
  // ============================================================================

  if (context?.source === 'buyer_order_support' && context?.order) {
    const order = context.order;
    
    lines.push('🎯 Tipo de consulta: Soporte de Orden');
    lines.push('');
    
    // Información de la orden
    lines.push(`📦 ORDEN: ${formatOrderNumber(order.parent_order_id || order.order_id)}`);
    
    if (order.status) {
      lines.push(`📊 Estado: ${translateOrderStatus(order.status)}`);
    }
    
    if (order.payment_status) {
      lines.push(`💳 Estado Pago: ${translatePaymentStatus(order.payment_status)}`);
    }
    
    if (typeof order.total === 'number' || typeof order.final_amount === 'number') {
      const total = order.final_amount || order.total;
      lines.push(`💰 Total: ${formatCurrency(total)}`);
    }
    
    // Proveedores
    const suppliers = order.suppliers || extractSupplierInfo(order.items || []);
    if (suppliers.length > 0) {
      lines.push('');
      lines.push(`🏭 PROVEEDOR${suppliers.length > 1 ? 'ES' : ''} (${suppliers.length}):`);
      suppliers.forEach(supplier => {
        const verifiedMark = supplier.verified ? ' ✓' : '';
        lines.push(`  → ${supplier.name}${verifiedMark} (ID: ${formatOrderNumber(supplier.id)})`);
      });
    }
    
    // Productos
    if (Array.isArray(order.products) && order.products.length > 0) {
      lines.push('');
      lines.push(`📦 PRODUCTOS (${order.products.length}):`);
      order.products.forEach(product => {
        const price = product.price || product.price_at_addition || 0;
        lines.push(`  • ${product.name} × ${product.quantity} uds @ ${formatCurrency(price)} c/u`);
      });
    } else if (Array.isArray(order.items) && order.items.length > 0) {
      // Fallback a items si no hay products
      lines.push('');
      lines.push(`📦 PRODUCTOS (${order.items.length}):`);
      order.items.forEach(item => {
        const name = item.product?.name || item.name || 'Producto';
        const qty = item.quantity || 0;
        const price = item.price_at_addition || item.product?.price || 0;
        lines.push(`  • ${name} × ${qty} uds @ ${formatCurrency(price)} c/u`);
      });
    }
    
  } else if (context?.source === 'product_inquiry' && context?.product) {
    const product = context.product;
    
    lines.push('🎯 Tipo de consulta: Consulta de Producto');
    lines.push('');
    
    if (product.name) {
      lines.push(`🏷️ Producto: ${product.name}`);
    }
    
    if (product.id) {
      lines.push(`🆔 ID Producto: ${formatOrderNumber(product.id)}`);
    }
    
    // Mostrar información de precios
    if (product.has_tiers && product.tiers_count > 0) {
      // Producto con precios escalonados
      lines.push(`💵 Precio desde: ${formatCurrency(product.price)} (${product.tiers_count} tramos de precio)`);
    } else if (typeof product.price === 'number') {
      // Precio único
      lines.push(`💵 Precio: ${formatCurrency(product.price)}`);
    }
    
    // Información del proveedor del producto
    const supplierName = product.supplier?.name || product.supplier_name;
    const supplierId = product.supplier?.id || product.supplier_id;
    
    if (supplierName || supplierId) {
      lines.push('');
      lines.push(`🏭 Proveedor: ${supplierName || 'No especificado'}`);
      if (supplierId) {
        lines.push(`   ID: ${formatOrderNumber(supplierId)}`);
      }
    }
    
    // Agregar slug/URL si está disponible
    if (product.slug) {
      lines.push('');
      lines.push(`🔗 URL: /marketplace/product/${product.id}/${product.slug}`);
    }
    
  } else if (context?.source === 'table_row_support' && context?.order) {
    // Soporte desde tabla (supplier o buyer)
    const order = context.order;
    
    lines.push('🎯 Tipo de consulta: Soporte desde Tabla de Órdenes');
    lines.push('');
    lines.push(`📦 Orden: ${formatOrderNumber(order.order_id)}`);
    
    if (order.status) {
      lines.push(`📊 Estado: ${translateOrderStatus(order.status)}`);
    }
    
  } else if (context?.source === 'general_inquiry') {
    lines.push('🎯 Tipo de consulta: Consulta General');
    
  } else if (context?.source) {
    // Cualquier otro contexto con source definido
    lines.push(`🎯 Tipo: ${context.source}`);
  }

  // ============================================================================
  // INFORMACIÓN DEL USUARIO (SIEMPRE)
  // ============================================================================
  
  lines.push('');
  lines.push(`👤 User ID: ${userId || 'NO_AUTH'}`);
  lines.push(`📧 Email: ${userEmail || 'No especificado'}`);
  
  if (userProfile?.company_nm) {
    lines.push(`🏢 Empresa: ${userProfile.company_nm}`);
  }
  
  if (userProfile?.phone) {
    lines.push(`📱 Teléfono: ${userProfile.phone}`);
  }
  
  // ============================================================================
  // MENSAJE ORIGINAL
  // ============================================================================
  
  lines.push('━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('MENSAJE:');
  lines.push(originalMessage || '(Sin mensaje)');

  return lines.join('\n');
}
