-- ================================================
-- Migration: Allow minimum_purchase_amount updates
-- ================================================
-- Problem: RLS trigger blocks minimum_purchase_amount updates
-- Solution: Add minimum_purchase_amount to allowed fields list
-- ================================================

BEGIN;

-- Update trigger to allow minimum_purchase_amount updates
CREATE OR REPLACE FUNCTION public.block_forbidden_user_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Skip validation if this is an admin operation
    IF current_setting('app.admin_operation', true) = 'true' THEN
      RETURN NEW;
    END IF;
    
    -- Regular users can only update these columns (including minimum_purchase_amount)
    IF ( to_jsonb(NEW)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' 
           - 'descripcion_proveedor' - 'document_types' - 'main_supplier' 
           - 'updatedt' - 'last_ip' - 'minimum_purchase_amount'
         )
       <> 
       ( to_jsonb(OLD)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' 
           - 'descripcion_proveedor' - 'document_types' - 'main_supplier' 
           - 'updatedt' - 'last_ip' - 'minimum_purchase_amount'
       )
    THEN
      RAISE EXCEPTION 'Modificación no permitida: solo se pueden actualizar rut, user_nm, phone_nbr, country, logo_url, descripcion_proveedor, document_types, main_supplier, updatedt, last_ip, minimum_purchase_amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.block_forbidden_user_updates() IS 
'Trigger function que valida que usuarios regulares solo actualicen campos permitidos. Permite bypass para operaciones de admin via app.admin_operation session variable. Ahora incluye minimum_purchase_amount.';

COMMIT;
