# Deprecations

## tax_document_path (orders)
- Fecha de deprecación: 2025-08-23
- Reemplazado por: Tabla `public.invoices_meta` + enrichment en `useBuyerOrders`.
- Razón: Necesidad de soportar múltiples proveedores (multi-supplier) y múltiples versiones de documento por supplier.
- Migración de eliminación: `20250823140000_drop_tax_document_path.sql`.
- Acciones:
  - Buyer UI ahora usa `invoice_path` (inyectado) por item/parte.
  - Supplier carga PDF via `uploadInvoicePDF` → storage + fila en `invoices_meta`.
  - Realtime INSERT en `invoices_meta` actualiza inmediatamente la vista del comprador.

## Notas futuras
- Si se requiere mostrar un listado consolidado de facturas: consultar directamente `invoices_meta` agrupando por `order_id, supplier_id` y tomando la última `created_at`.
- Considerar índice adicional `(supplier_id, order_id)` si se agregan consultas filtradas por supplier.
