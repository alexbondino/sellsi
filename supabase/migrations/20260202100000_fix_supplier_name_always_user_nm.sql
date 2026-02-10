-- 20260202100000_fix_supplier_name_always_user_nm.sql
-- FIX: Asegurar que supplier.name siempre sea users.user_nm (nombre comercial)
-- y que supplier_legal_name sea el nombre legal (diferente)
-- 
-- PROBLEMA: Algunas migraciones anteriores confundieron supplier.name con supplier_legal_name
-- SOLUCIÓN: supplier.name debe reflejar el nombre comercial (user_nm de users)
--           supplier_legal_name debe ser el nombre legal de la empresa (puede ser diferente)

BEGIN;

-- 1) Corregir todos los registros existentes donde name NO es igual a user_nm
UPDATE public.supplier s
SET name = u.user_nm
FROM public.users u
WHERE s.user_id = u.user_id
  AND s.name IS DISTINCT FROM u.user_nm;

-- 2) Actualizar el trigger ensure_role_tables para que siempre use user_nm
CREATE OR REPLACE FUNCTION public.ensure_role_tables() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- On insert: always ensure a buyer exists; also ensure supplier if main_supplier = true
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.buyer (id, user_id, name, email, created_at)
    VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, NEW.email, now())
    ON CONFLICT (user_id) DO NOTHING;

    IF NEW.main_supplier = true THEN
      INSERT INTO public.supplier (id, user_id, name, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, now())
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  -- On update: always ensure buyer/supplier exist; sync name from user_nm
  IF TG_OP = 'UPDATE' THEN
    -- Ensure buyer exists (idempotent)
    INSERT INTO public.buyer (id, user_id, name, email, created_at)
    VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, NEW.email, now())
    ON CONFLICT (user_id) DO UPDATE SET 
      name = EXCLUDED.name,
      email = EXCLUDED.email;

    -- Sync name for existing buyer when user_nm changes
    UPDATE public.buyer
    SET name = COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text
    WHERE user_id = NEW.user_id
      AND name IS DISTINCT FROM COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text;

    -- If toggled to supplier, ensure supplier exists
    IF NEW.main_supplier IS DISTINCT FROM OLD.main_supplier AND NEW.main_supplier = true THEN
      INSERT INTO public.supplier (id, user_id, name, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, now())
      ON CONFLICT (user_id) DO UPDATE SET 
        name = EXCLUDED.name;
    END IF;

    -- Sync name for existing supplier when user_nm changes
    IF NEW.main_supplier = true THEN
      UPDATE public.supplier
      SET name = COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text
      WHERE user_id = NEW.user_id
        AND name IS DISTINCT FROM COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Agregar comentarios explicativos a las columnas para futuros desarrolladores
COMMENT ON COLUMN public.supplier.name IS 'Nombre comercial del proveedor (siempre sincronizado con users.user_nm). Este es el nombre con el que el proveedor opera en la plataforma.';
COMMENT ON COLUMN public.supplier.supplier_legal_name IS 'Razón social o nombre legal de la empresa (puede ser diferente del nombre comercial). Ej: "Distribuidora XYZ SpA"';

COMMIT;

-- Verificación post-migración (ejecutar manualmente para validar):
-- SELECT s.id, s.name as supplier_name, s.supplier_legal_name, u.user_nm 
-- FROM public.supplier s 
-- JOIN public.users u ON s.user_id = u.user_id 
-- WHERE s.name IS DISTINCT FROM u.user_nm;
-- (debería retornar 0 filas)

-- END OF MIGRATION
