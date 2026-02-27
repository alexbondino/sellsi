-- check_role_backfill.sql
-- Verificaciones para validar la migración de backfill buyer/supplier

-- 1) Contar users sin buyer/supplier según main_supplier
SELECT
  SUM(CASE WHEN u.main_supplier = false AND NOT EXISTS (SELECT 1 FROM public.buyer b WHERE b.user_id = u.user_id) THEN 1 ELSE 0 END) AS users_without_buyer,
  SUM(CASE WHEN u.main_supplier = true AND NOT EXISTS (SELECT 1 FROM public.supplier s WHERE s.user_id = u.user_id) THEN 1 ELSE 0 END) AS users_without_supplier
FROM public.users u;

-- 2) Ver duplicados (deben ser 0)
SELECT count(*) AS duplicate_buyer_user_id_count FROM (
  SELECT user_id FROM public.buyer GROUP BY user_id HAVING count(*) > 1
) t;

SELECT count(*) AS duplicate_supplier_user_id_count FROM (
  SELECT user_id FROM public.supplier GROUP BY user_id HAVING count(*) > 1
) t;

-- 3) Ejemplo: verificar que el buyer usado en el test exista
-- Reemplaza el UUID por el que obtuviste en los logs
-- SELECT id, user_id, name, email FROM public.buyer WHERE id = 'ae9be238-f13e-4edd-ac30-ec5854dae54f'::uuid;

-- 4) Verificar que financing_requests referencien buyers existentes (0 rows)
SELECT fr.buyer_id
FROM public.financing_requests fr
LEFT JOIN public.buyer b ON fr.buyer_id = b.id
WHERE b.id IS NULL
LIMIT 20;

-- 5) Verificar índices
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'buyer' OR tablename = 'supplier';
