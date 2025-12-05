-- ============================================================================
-- Migration: Allow last_ip update in users table
-- ============================================================================
-- Fecha: 2025-12-04
-- Descripción: Actualiza la función block_forbidden_user_updates para permitir
--              la modificación de la columna 'last_ip' (necesario para tracking
--              de IP del usuario por seguridad).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.block_forbidden_user_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Compara las filas excluyendo las columnas permitidas a modificar.
    IF ( to_jsonb(NEW)
           - 'rut' 
           - 'user_nm' 
           - 'phone_nbr' 
           - 'country' 
           - 'logo_url' 
           - 'descripcion_proveedor' 
           - 'document_types'
           - 'main_supplier'
           - 'updatedt'
           - 'last_ip'  -- ✅ NUEVO: Permitir actualizar IP del usuario
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
           - 'main_supplier'
           - 'updatedt'
           - 'last_ip'  -- ✅ NUEVO
       )
    THEN
      RAISE EXCEPTION 'Modificación no permitida: solo se pueden actualizar rut, user_nm, phone_nbr, country, logo_url, descripcion_proveedor, document_types, main_supplier, updatedt, last_ip';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
