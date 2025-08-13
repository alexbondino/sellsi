# 🗑️ Eliminación Inteligente de Productos

## 📋 **¿Qué hace esto?**
Permite a los proveedores eliminar productos de manera segura desde MyProducts.jsx sin romper pedidos existentes ni perder datos históricos.

## 🎯 **¿Cómo funciona?**
- **Sin ventas / pedidos / solicitudes** (carritos NO bloquean): Se elimina completamente (producto + todas las imágenes + items del carrito)
- **Con ventas / pedidos / solicitudes**: Se "archiva" (oculta del catálogo, borra imágenes grandes, mantiene thumbnail pequeño)

## 💰 **Beneficios**
- ✅ **Para Proveedores**: Pueden limpiar su catálogo sin quedar atrapados por carritos abandonados
- ✅ **Para Compradores**: Sus pedidos históricos siguen funcionando  
- ✅ **Para la Plataforma**: Ahorra almacenamiento (borra imágenes pesadas) + mantiene integridad de datos
- ✅ **Para Desarrolladores**: No más errores de FK al eliminar productos con ventas

## 📊 **Impacto Esperado**
- **Reducción storage**: ~70% menos espacio (solo thumbnails 40x40 vs imágenes full)
- **UX mejorado**: Eliminación siempre exitosa (no más "no se puede eliminar")
- **Datos seguros**: 100% integridad en reportes y pedidos históricos

---

## ⚡ Implementación Mínima Lista (Copiar / Pegar)

### 1. Migración SQL (create: supabase/migrations/YYYYMMDDHHMM_add_product_soft_delete.sql)
```sql
-- 1. Columnas nuevas (idempotente)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deletion_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS safe_delete_after timestamptz,
  ADD COLUMN IF NOT EXISTS tiny_thumbnail_url text;

-- 2. Constraint de estados
DO $$ BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_deletion_status_check
    CHECK (deletion_status IN ('active','pending_delete','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Índice parcial para catálogo
CREATE INDEX IF NOT EXISTS idx_products_active
  ON public.products(productid, supplier_id)
  WHERE deletion_status = 'active' AND is_active = true;
```

### 2. RPC request_delete_product_v1 (carritos no bloquean)
```sql
CREATE OR REPLACE FUNCTION public.request_delete_product_v1(
  p_product_id uuid,
  p_supplier_id uuid
)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_has_sales boolean;
  v_has_requests boolean;
  v_has_orders boolean;
  v_thumb text;
BEGIN
  -- Lock + ownership
  PERFORM 1 FROM public.products
   WHERE productid = p_product_id
     AND supplier_id = p_supplier_id
     AND deletion_status = 'active'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe o ya procesado');
  END IF;

  -- Dependencias BLOQUEANTES (NO incluye carritos)
  SELECT EXISTS(SELECT 1 FROM product_sales WHERE product_id = p_product_id) INTO v_has_sales;
  SELECT EXISTS(SELECT 1 FROM request_products WHERE product_id = p_product_id) INTO v_has_requests;
  SELECT EXISTS(
    SELECT 1 FROM orders o
    WHERE o.items::text LIKE '%' || p_product_id || '%'
      AND status NOT IN ('cancelled','refunded','failed')
  ) INTO v_has_orders;

  IF NOT v_has_sales AND NOT v_has_requests AND NOT v_has_orders THEN
    -- Eliminación física completa
    DELETE FROM cart_items WHERE product_id = p_product_id; -- limpiar carritos
    DELETE FROM product_delivery_regions WHERE product_id = p_product_id;
    DELETE FROM product_quantity_ranges  WHERE product_id = p_product_id;
    DELETE FROM product_images          WHERE product_id = p_product_id;
    DELETE FROM products                WHERE productid   = p_product_id;
    RETURN jsonb_build_object('success', true, 'action', 'deleted');
  ELSE
    -- Soft delete
    SELECT thumbnails->>'40x40'
      INTO v_thumb
    FROM product_images
    WHERE product_id = p_product_id
      AND thumbnails ? '40x40'
    ORDER BY image_order ASC
    LIMIT 1;

    UPDATE products
      SET is_active = false,
          deletion_status = 'pending_delete',
          deletion_requested_at = now(),
          safe_delete_after = now() + interval '90 days',
          tiny_thumbnail_url = COALESCE(v_thumb, tiny_thumbnail_url)
    WHERE productid = p_product_id;

    DELETE FROM product_delivery_regions WHERE product_id = p_product_id;
    DELETE FROM product_quantity_ranges  WHERE product_id = p_product_id;
    -- Borrar TODAS las imágenes (ya preservamos URL mínima en products)
    DELETE FROM product_images           WHERE product_id = p_product_id;

    RETURN jsonb_build_object('success', true, 'action', 'soft_deleted');
  END IF;
END; $$;
```

### 3. Edge Function (implementada) cleanup-product
Responsable de limpiar TODOS los archivos en storage bajo `supplierId/productId/*` en:
- product-images
- product-images-thumbnails
- (solo si action === 'deleted') product-documents

Si falta `supplierId`, retorna success con `skipped: true` (la eliminación de BD ya se hizo). Siempre segura (idempotente).

Payload enviado:
```json
{ "productId": "<uuid>", "action": "deleted|soft_deleted", "supplierId": "<uuid>" }
```
Respuesta típica:
```json
{ "success": true, "action": "soft_deleted", "removed": { "images": 3, "thumbnails": 1, "documents": 0 } }
```

### 4. Front-End (fragmento)
```ts
const deleteProduct = async (productId: string) => {
  const { data, error } = await supabase.rpc('request_delete_product_v1', {
    p_product_id: productId,
    p_supplier_id: user.id
  });
  if (error || !data?.success) { toast.error(data?.error || 'Error'); return; }

  supabase.functions.invoke('cleanup-product', {
    body: { productId, action: data.action, supplierId: user.id }
  });

  // UI SIEMPRE muestra 'Producto eliminado' (uniforme para proveedor)
  toast.success('Producto eliminado');
  refetch();
};

// Lista solo activos
select * from products where supplier_id = :id and deletion_status = 'active' and is_active = true;
```

### 5. Cron archivado (futuro)
```sql
UPDATE products
SET deletion_status = 'archived'
WHERE deletion_status = 'pending_delete'
  AND safe_delete_after <= now();
```

### 6. Checklist QA
- [ ] Producto solo en carritos → eliminado (cart_items borrados)
- [ ] Producto con ventas / pedidos / solicitudes → soft_deleted
- [ ] Pedidos históricos siguen funcionando
- [ ] Thumbnail mínimo accesible si había imágenes
- [ ] No errores FK
- [ ] Edge function borra archivos (ver métricas removed.images > 0 si tenía imágenes)
- [ ] UI siempre mensaje uniforme 'Producto eliminado'

---

## 🚀 **Para Implementar**
1. Migración SQL
2. RPC
3. Front-end (botón + filtro)
4. Edge cleanup (opcional)
5. QA

---

<details>
<summary>🔧 Documentación Técnica Detallada (Solo Desarrolladores)</summary>

## Estados del Producto
- `active`
- `pending_delete`
- `archived`

## Nota sobre carritos
Los carritos no bloquean: se limpian y el usuario verá menos ítems al reabrir su carrito.

## Estrategia
Ventas / pedidos / solicitudes = preservación.
Solo carritos = eliminación física.

</details>
