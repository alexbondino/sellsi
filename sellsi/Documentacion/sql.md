## Inventario Rápido del Esquema (snapshot querynew.sql)
Enfoque: qué usa hoy el frontend (grep), qué es legacy todavía enlazado, y qué está huérfano / prescindible. Sin overengineering.

### 1. Tablas ACTIVAS (referenciadas directamente en `src/` o necesarias para flujo actual)
Usadas por hooks/servicios según grep.
- products, product_images, product_quantity_ranges, product_delivery_regions (catálogo + shipping calc)
- users (identidad / supplier_id FK)
- orders (core nuevo: pricing_verified_at, items_hash, inventory_processed_at, estimated_delivery_date)
- supplier_orders, supplier_order_items (split per proveedor)
- payment_transactions (seguimiento pagos en checkoutService)
- product_sales (dashboard / métricas proveedor)
- requests, request_products (estadísticas weeklyRequests proveedor)
- notifications (UI notificaciones)
- shipping_info, billing_info, bank_info (perfil)

Tablas de soporte necesarias aunque no las consuma el front directamente:
- khipu_webhook_logs (logs pagos) – backend.
- image_orphan_candidates, image_thumbnail_jobs (limpieza / thumbnails) – tareas de mantenimiento.
- storage_cleanup_logs (cron limpieza)

### 2. LEGACY EN USO (aún hay código que las toca, objetivo: retirar luego)
- carts, cart_items: todavía llamadas por `cartService` y `cartStore.backend`. Plan: sustituir completamente por flujo orders + supplier_orders. Mantener mientras el store no se refactorice.
- sales: no se usa en código front (se usa product_sales). Probable residual histórico. Clasificar para eliminación o convertir en vista agregada si algún reporte la consulta.

### 3. HUÉRFANAS / BAJO VALOR DIRECTO (no aparecen en grep de front). Mantener solo si panel admin u otros procesos realmente las usan.
- control_panel, control_panel_users, admin_audit_log, admin_sessions, admin_trusted_devices (stack admin antiguo). Si el panel nuevo no las usa: etiquetar como deprecated.
- edge_functions, edge_function_invocations (meta‑catalog / logging) – opcional mantener; no afectan front.
- ejemplo, ejemplo_prueba (tablas de prueba) – eliminar.
- banned_ips (si no hay lógica activa de bloqueo en edge / policies, queda inerte).

### 4. Duplicidades / Inconsistencias Sencillas
- shipping_total (carts) vs shipping (orders) vs shipping_amount (supplier_orders). Mantener solo nombre `shipping_amount` a futuro. Documentar mapeo temporal.
- subtotal / total duplicados en sales/product_sales/orders: decide fuente canónica (orders + product_sales) y elimina sales.
- price snapshot triple: cart_items.price_at_addition, supplier_order_items.unit_price, orders.items[].unit_price_effective (implícito). Canónico: orders.items (sellar ahí). Los otros solo para transición.

### 5. Constraints / Índices MINIMOS (sin sobre-ingeniería)
Solo los que reducen riesgo de datos corruptos en el corto plazo:
1. supplier_orders: UNIQUE (parent_order_id, supplier_id) – evita duplicar part.
2. supplier_order_items: (opcional) UNIQUE (supplier_order_id, product_id) si no se permiten líneas duplicadas.
3. payment_transactions: UNIQUE (order_id, external_payment_id) para idempotencia pago.
4. product_sales: INDEX (product_id, supplier_id, trx_date) para dashboards.
5. khipu_webhook_logs: INDEX (payment_id) para consultas repetidas.

### 6. Acciones Recomendadas (mínimo imprescindible)
- Marcar con COMMENT tablas: carts, cart_items, sales, control_panel*, admin_* como 'DEPRECATED'.
- Implementar UNIQUE + índices listados (una migración simple).
- Ajustar código para dejar de usar carts -> luego drop carts/cart_items.
- Verificar si algún proceso escribe todavía en sales; si no, plan de drop.
- Limpiar tablas ejemplo*.

### 7. Qué NO hacer ahora
- No crear tablas nuevas para logs de eventos (ya tienes khipu_webhook_logs).
- No normalizar más shipping hasta retirar legacy.
- No mover price tiers a tabla separada (ya existen product_quantity_ranges suficiente por ahora).

### 8. Resumen Corto
Core válido: orders + supplier_orders. Legacy principal pendiente: carts/cart_items. Basura fácil de sacar: ejemplo*, quizá sales. Administrativas antiguas: control_panel* + admin_* revisar antes de dropear.

Fin.
