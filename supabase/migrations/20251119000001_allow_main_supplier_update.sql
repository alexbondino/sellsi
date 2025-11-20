-- ============================================================================
-- Migration: Allow main_supplier update in users table
-- ============================================================================
-- Fecha: 2025-11-19
-- Descripción: Actualiza la función block_forbidden_user_updates para permitir
--              la modificación de la columna 'main_supplier' (necesario para onboarding).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.block_forbidden_user_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Compara las filas excluyendo las columnas permitidas a modificar.
    -- Se agrega 'main_supplier' a la lista de permitidos.
    IF ( to_jsonb(NEW)
           - 'rut' 
           - 'user_nm' 
           - 'phone_nbr' 
           - 'country' 
           - 'logo_url' 
           - 'descripcion_proveedor' 
           - 'document_types'
           - 'main_supplier'  -- ✅ NUEVO: Permitir actualizar rol
         )
       <> 
       ( to_jsonb(OLD)
           - 'rut' 
           - 'user_nm' 
           - 'phone_nbr' 
           - 'country' 
           - 'logo_url' 
           - 'descripcion_proveedor' 
           - 'document_types'
           - 'main_supplier'  -- ✅ NUEVO
       )
    THEN
      RAISE EXCEPTION 'Modificación no permitida: solo se pueden actualizar rut, user_nm, phone_nbr, country, logo_url, descripcion_proveedor, document_types, main_supplier';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
