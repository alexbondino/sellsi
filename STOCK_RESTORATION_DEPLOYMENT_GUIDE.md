# 🚀 GUÍA DE DEPLOYMENT: RESTAURACIÓN AUTOMÁTICA DE STOCK

## 📋 RESUMEN
Esta implementación resuelve el problema crítico de inventario inconsistente cuando un proveedor rechaza una orden que ya fue pagada. El stock se restaura automáticamente usando triggers de base de datos.

## 🏗️ ARQUITECTURA

### ✅ Casos Cubiertos:
1. **Rechazo Total (Mono-supplier)**: `orders.status` → `'rejected'`
2. **Rechazo Parcial (Multi-supplier)**: `supplier_parts_meta.supplier_id.status` → `'rejected'`
3. **Idempotencia**: No doble restauración si se rechaza múltiples veces
4. **Atomicidad**: Transacción única que garantiza consistencia

### 🔧 Componentes:
- **Migration**: `20250923000000_stock_restoration_on_rejection.sql`
- **Testing**: `scripts/test-stock-restoration.js`
- **Logging**: Mejorado en `UpdateOrderStatus.js` y `update-supplier-part-status`

## 📦 DEPLOYMENT

### 1. Aplicar Migration
```bash
# Aplicar la migración a la base de datos
supabase db push

# O manualmente:
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/20250923000000_stock_restoration_on_rejection.sql
```

### 2. Verificar Instalación
```sql
-- Verificar que las funciones fueron creadas
SELECT proname FROM pg_proc WHERE proname LIKE '%stock%restoration%';

-- Verificar que los triggers fueron creados
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%stock%';

-- Expected results:
-- restore_stock_on_order_rejection
-- restore_stock_on_partial_rejection
-- trg_restore_stock_on_rejection
-- trg_restore_stock_on_partial_rejection
```

### 3. Ejecutar Tests
```bash
# Desde la raíz del proyecto
cd scripts
node test-stock-restoration.js

# O desde browser console:
const tester = new StockRestorationTester();
await tester.runAllTests();
```

## 🧪 TESTING EN PRODUCCIÓN

### Test Manual Rápido:

1. **Setup inicial**:
```sql
-- Verificar stock inicial de un producto
SELECT productid, productnm, productqty FROM products WHERE productid = 'your-test-product-id';
```

2. **Crear orden de prueba**:
```sql
INSERT INTO orders (id, user_id, items, supplier_ids, status, payment_status, total_amount)
VALUES (
  'test-order-' || gen_random_uuid()::text,
  'your-test-user-id',
  '[{"product_id": "your-test-product-id", "supplier_id": "your-test-supplier-id", "quantity": 5, "price_at_addition": 1000}]'::jsonb,
  ARRAY['your-test-supplier-id'],
  'pending',
  'paid',  -- ⚠️ IMPORTANTE: simular orden pagada
  5000
);
```

3. **Simular rechazo**:
```sql
-- Para mono-supplier (rechazo total)
UPDATE orders 
SET status = 'rejected', rejection_reason = 'Test rejection'
WHERE id = 'your-test-order-id';

-- Verificar que el stock se restauró
SELECT productqty FROM products WHERE productid = 'your-test-product-id';

-- Verificar metadata de restauración
SELECT metadata FROM orders WHERE id = 'your-test-order-id';
```

## 📊 MONITORING Y LOGS

### Logs en Aplicación:
- `UpdateOrderStatus.js`: Logs cuando rechazo global
- `update-supplier-part-status`: Logs cuando rechazo parcial

### Logs en Base de Datos:
```sql
-- Ver logs de PostgreSQL para mensajes de triggers
SELECT * FROM pg_stat_activity WHERE query LIKE '%restore_stock%';

-- Ver órdenes con stock restaurado
SELECT id, status, payment_status, metadata->'stock_restored' as restored
FROM orders 
WHERE metadata->'stock_restored' = 'true'::jsonb;
```

### Métricas Importantes:
```sql
-- Órdenes rechazadas después de pagadas (casos donde debe activarse restauración)
SELECT COUNT(*) as rejected_after_paid
FROM orders 
WHERE status = 'rejected' 
  AND payment_status = 'paid'
  AND created_at > now() - interval '30 days';

-- Éxito de restauraciones
SELECT COUNT(*) as successful_restorations
FROM orders 
WHERE metadata->'stock_restored' = 'true'::jsonb
  AND created_at > now() - interval '30 days';
```

## ⚠️ CONSIDERACIONES IMPORTANTES

### 🔒 Seguridad:
- Funciones usan `SECURITY DEFINER` para ejecutarse con permisos del creador
- Solo se activan para órdenes con `payment_status = 'paid'`
- Validación de estados previos para evitar restauraciones incorrectas

### 🚀 Performance:
- Índices optimizados para consultas de productos y órdenes
- Triggers solo se ejecutan cuando hay cambios relevantes
- Procesamiento eficiente de JSON en `supplier_parts_meta`

### 🔄 Idempotencia:
- Usa `metadata` para trackear si ya se restauró stock
- No permite doble restauración del mismo rechazo
- Logs detallados para debugging

## 🆘 TROUBLESHOOTING

### Problema: "Stock no se restaura"
```sql
-- 1. Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trg_restore_stock_on_rejection';

-- 2. Verificar logs de PostgreSQL
SELECT * FROM pg_stat_activity WHERE query LIKE '%restore_stock%';

-- 3. Verificar que la orden cumple condiciones
SELECT id, status, payment_status, metadata
FROM orders 
WHERE id = 'problema-order-id';

-- 4. Verificar formato de items en la orden
SELECT jsonb_pretty(items) FROM orders WHERE id = 'problema-order-id';
```

### Problema: "Error en trigger"
```sql
-- Ver errores recientes en logs
SELECT * FROM pg_stat_database_conflicts;

-- Verificar integridad de productos
SELECT COUNT(*) FROM products WHERE productqty IS NULL;

-- Verificar formato de UUIDs en items
SELECT items FROM orders 
WHERE NOT (items->0->>'product_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
```

## ✅ ROLLBACK (Si es necesario)

```sql
-- Remover triggers
DROP TRIGGER IF EXISTS trg_restore_stock_on_rejection ON public.orders;
DROP TRIGGER IF EXISTS trg_restore_stock_on_partial_rejection ON public.orders;

-- Remover funciones
DROP FUNCTION IF EXISTS public.restore_stock_on_order_rejection();
DROP FUNCTION IF EXISTS public.restore_stock_on_partial_rejection();

-- Limpiar metadata existente (opcional)
UPDATE orders SET metadata = metadata - 'stock_restored' - 'stock_restored_at' - 'stock_restoration_log'
WHERE metadata ? 'stock_restored';
```

## 🎯 CONCLUSIÓN

Esta implementación:
- ✅ **Resuelve el problema**: Stock se restaura automáticamente en rechazos
- ✅ **Es robusta**: Maneja casos edge y errores gracefully
- ✅ **No es redundante**: Un solo punto de control para todos los flujos
- ✅ **Es auditable**: Logs completos y metadata de tracking
- ✅ **Es testeable**: Suite completa de tests automatizados

El sistema ahora garantiza la consistencia de inventario sin importar cómo o cuándo se rechace una orden pagada.