-- ============================================================================
-- Migration: Harden signup trigger chain (auth.users -> public.users -> buyer/supplier)
-- Fecha: 2026-02-16
-- Objetivo:
--   Evitar que errores puntuales en parseo de metadata o inserciones secundarias
--   aborten el signup completo con 500.
-- ============================================================================

BEGIN;

-- 1) Hardening de handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  is_supplier BOOLEAN := FALSE;
  safe_name text;
  safe_phone text;
  safe_country text;
  safe_doc_types text[] := '{}'::text[];
  safe_min_purchase numeric := 1;
BEGIN
  safe_name := COALESCE(NULLIF(meta->>'full_name', ''), 'pendiente');
  safe_phone := NULLIF(meta->>'phone', '');
  safe_country := COALESCE(NULLIF(meta->>'pais', ''), 'CL');

  IF meta ? 'proveedor' THEN
    is_supplier := CASE lower(coalesce(meta->>'proveedor',''))
      WHEN 'true' THEN true
      WHEN 't' THEN true
      WHEN '1' THEN true
      WHEN 'yes' THEN true
      WHEN 'y' THEN true
      ELSE false
    END;
  END IF;

  BEGIN
    IF meta ? 'document_types' AND NULLIF(meta->>'document_types', '') IS NOT NULL THEN
      safe_doc_types := (meta->>'document_types')::text[];
    END IF;
  EXCEPTION WHEN OTHERS THEN
    safe_doc_types := '{}'::text[];
  END;

  BEGIN
    IF meta ? 'minimum_purchase_amount' AND NULLIF(meta->>'minimum_purchase_amount', '') IS NOT NULL THEN
      safe_min_purchase := (meta->>'minimum_purchase_amount')::numeric;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    safe_min_purchase := 1;
  END;

  BEGIN
    INSERT INTO public.users (
      user_id,
      email,
      user_nm,
      main_supplier,
      phone_nbr,
      country,
      createdt,
      updatedt,
      document_types,
      minimum_purchase_amount,
      banned,
      verified
    ) VALUES (
      NEW.id,
      NEW.email,
      safe_name,
      is_supplier,
      safe_phone,
      safe_country,
      now(),
      now(),
      safe_doc_types,
      safe_min_purchase,
      false,
      false
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user failed for % email=% err=%', NEW.id, NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Crea fila en public.users al signup. Endurecida para no abortar auth signup ante errores puntuales de metadata o inserción secundaria.';

-- 2) Hardening de ensure_role_tables
CREATE OR REPLACE FUNCTION public.ensure_role_tables()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  safe_name text;
BEGIN
  safe_name := COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text;

  IF TG_OP = 'INSERT' THEN
    BEGIN
      INSERT INTO public.buyer (id, user_id, name, email, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, safe_name, NEW.email, now())
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ensure_role_tables buyer insert failed user_id=% email=% err=%', NEW.user_id, NEW.email, SQLERRM;
    END;

    IF NEW.main_supplier = true THEN
      BEGIN
        INSERT INTO public.supplier (id, user_id, name, created_at)
        VALUES (gen_random_uuid(), NEW.user_id, safe_name, now())
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ensure_role_tables supplier insert failed user_id=% email=% err=%', NEW.user_id, NEW.email, SQLERRM;
      END;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    BEGIN
      INSERT INTO public.buyer (id, user_id, name, email, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, safe_name, NEW.email, now())
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ensure_role_tables buyer upsert failed user_id=% email=% err=%', NEW.user_id, NEW.email, SQLERRM;
    END;

    IF NEW.main_supplier IS DISTINCT FROM OLD.main_supplier AND NEW.main_supplier = true THEN
      BEGIN
        INSERT INTO public.supplier (id, user_id, name, created_at)
        VALUES (gen_random_uuid(), NEW.user_id, safe_name, now())
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ensure_role_tables supplier upsert failed user_id=% email=% err=%', NEW.user_id, NEW.email, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_role_tables() IS
'Mantiene buyer/supplier sincronizado desde users. Endurecida para no abortar transacción de signup ante conflictos secundarios.';

COMMIT;
