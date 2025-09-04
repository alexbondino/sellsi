-- 20250814130000_backfill_document_type.sql
-- Backfill y normalización de document_type en cart_items y en orders.items (JSONB)
-- Idempotente: se puede ejecutar múltiples veces sin efectos secundarios.

-- 1. Backfill cart_items: NULL -> 'ninguno'
UPDATE public.cart_items
SET document_type = 'ninguno'
WHERE document_type IS NULL;

-- 2. Normalizar valores inválidos en cart_items
UPDATE public.cart_items
SET document_type = 'ninguno'
WHERE document_type IS NOT NULL
  AND lower(document_type) NOT IN ('boleta','factura','ninguno');

-- 3. Normalizar casing (por si existen mayúsculas) en cart_items
UPDATE public.cart_items
SET document_type = lower(document_type)
WHERE document_type IS NOT NULL
  AND document_type <> lower(document_type);

-- 4. Backfill / normalizar dentro de orders.items (jsonb array)
--    Para cada elemento del array, si falta document_type o es inválido -> 'ninguno'
--    También fuerza el valor a minúsculas válidas.
WITH to_update AS (
  SELECT id,
         items,
         (
           SELECT jsonb_agg(
             CASE
               WHEN jsonb_typeof(elem) <> 'object' THEN elem
               ELSE (
                 -- Obtener valor actual
                 CASE
                   WHEN (elem->>'document_type') IS NULL
                     OR lower(elem->>'document_type') NOT IN ('boleta','factura','ninguno')
                     THEN elem || jsonb_build_object('document_type','ninguno')
                   WHEN (elem->>'document_type') IS NOT NULL
                     AND (elem->>'document_type') <> lower(elem->>'document_type')
                     THEN jsonb_set(elem,'{document_type}', to_jsonb(lower(elem->>'document_type')))
                   ELSE elem
                 END
               )
             END
           )
           FROM jsonb_array_elements(items) AS elem
         ) AS new_items
  FROM public.orders
  WHERE items IS NOT NULL
    AND jsonb_typeof(items) = 'array'
)
UPDATE public.orders o
SET items = u.new_items
FROM to_update u
WHERE o.id = u.id AND o.items <> u.new_items;

-- 5. (Opcional) Reporte de filas afectadas (no falla si no hay permisos)
DO $$
BEGIN
  RAISE NOTICE 'cart_items con valores restantes NULL: %', (SELECT count(*) FROM public.cart_items WHERE document_type IS NULL);
  RAISE NOTICE 'Valores distintos esperados en cart_items: %', (SELECT array_agg(DISTINCT document_type) FROM public.cart_items);
END $$;
