-- Diagnóstico funciones y constraints para error ON CONFLICT
-- Ejecutar en la BD remota.

-- 1. Todas las variantes de create_offer
SELECT proname,
       oidvectortypes(proargtypes) AS arg_types,
       pronargs,
       provolatile,
       lanname,
       prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname='public'
  AND proname='create_offer';

-- 2. Definición completa (principal firma usada por frontend)
SELECT pg_get_functiondef('public.create_offer(uuid,uuid,uuid,numeric,integer,text)'::regprocedure) AS create_offer_6_params;

-- 3. (Si existe) versión extendida con 8 parámetros
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname='create_offer' AND pronargs=8;  
  IF FOUND THEN
    RAISE NOTICE 'Definición 8 params:%', pg_get_functiondef('public.create_offer(uuid,uuid,uuid,numeric,integer,text,numeric,integer)'::regprocedure);
  END IF; 
END $$;

-- 4. Constraints actuales de tablas nuevas
SELECT 'offer_limits_product' AS table, conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='offer_limits_product';

SELECT 'offer_limits_supplier' AS table, conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='offer_limits_supplier';

-- 5. Índices
SELECT * FROM pg_indexes WHERE schemaname='public' AND tablename IN ('offer_limits_product','offer_limits_supplier');

-- 6. Verificar si ON CONFLICT apuntará a constraint válido (chequeo lógico)
-- (Solo listamos columnas únicos presentes)
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('offer_limits_product','offer_limits_supplier')
  AND indexdef ILIKE '%UNIQUE%';
