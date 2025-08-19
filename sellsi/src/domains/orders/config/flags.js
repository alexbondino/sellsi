// Feature flags para refactor de órdenes
export const FLAGS = {
  ORDERS_USE_DOMAIN_ADAPTERS: true, // si false, devolvería objetos servicio sin pasar por adapter (futuro rollback rápido)
  ORDERS_EMIT_LEGACY_ALIASES: true, // controla deliveryAddress alias
  ORDERS_EMIT_DEPRECATED_PRODUCT_ALIASES: true // proveedor / verified / supplierVerified / imagen
};
