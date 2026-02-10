-- 20260202110000_allow_public_supplier_read.sql
-- Crear función SECURITY DEFINER que retorna información pública de supplier
-- Esto bypasea RLS y permite a cualquier usuario obtener id, user_id, name sin exponer datos sensibles

-- SECURITY DEFINER: La función se ejecuta con permisos del dueño (postgres), bypaseando RLS
-- Esto es seguro porque la función solo retorna campos públicos específicos
-- Y REQUIERE al menos un parámetro (no retorna todos los registros sin filtro)

CREATE OR REPLACE FUNCTION public.get_supplier_public_info(p_user_id uuid DEFAULT NULL, p_supplier_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- VALIDACIÓN DE SEGURIDAD: Requiere al menos un parámetro
  -- Esto previene que alguien obtenga TODOS los registros llamando sin parámetros
  IF p_user_id IS NULL AND p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Se requiere al menos un parámetro: p_user_id o p_supplier_id';
  END IF;

  -- Retornar solo campos públicos, filtrado por el parámetro proporcionado
  -- Si se pasan ambos parámetros, dar preferencia a p_supplier_id (más específico)
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.name,
    s.created_at
  FROM public.supplier s
  WHERE 
    CASE
      WHEN p_supplier_id IS NOT NULL THEN s.id = p_supplier_id
      WHEN p_user_id IS NOT NULL THEN s.user_id = p_user_id
      ELSE FALSE
    END;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_supplier_public_info(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.get_supplier_public_info IS 
'Retorna información pública de supplier (id, user_id, name, created_at) sin exponer datos sensibles como legal_name, legal_rut, legal_address, etc. Usa SECURITY DEFINER para bypassear RLS restrictivo de la tabla supplier. REQUIERE al menos un parámetro para prevenir data leak.';

-- Mantener las políticas restrictivas en la tabla supplier original
-- Esto asegura que accesos directos a la tabla sigan protegidos
-- Solo el dueño (user_id = auth.uid()) puede ver sus datos sensibles via tabla directa
-- a:
--   .from('supplier_public_info').select('id').eq('user_id', userId)
--
-- Esto permite obtener supplier.id sin exponer información sensible
