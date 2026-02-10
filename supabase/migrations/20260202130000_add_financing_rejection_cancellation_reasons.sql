-- 20260202130000_add_financing_rejection_cancellation_reasons.sql
-- 1. Agregar columnas para guardar motivos de rechazo/cancelación en financing_requests
-- 2. Crear función SECURITY DEFINER para que buyer pueda obtener nombre de supplier
-- Similar a payment_releases y offers que ya tienen estas columnas

-- ============================================================================
-- PARTE 1: COLUMNAS DE MOTIVOS (rejected_reason, cancelled_reason)
-- ============================================================================

-- Agregar columna para motivo de rechazo (cuando supplier/sellsi rechaza)
ALTER TABLE public.financing_requests 
ADD COLUMN IF NOT EXISTS rejected_reason text;

-- Agregar columna para motivo de cancelación (cuando buyer/supplier cancela)
ALTER TABLE public.financing_requests 
ADD COLUMN IF NOT EXISTS cancelled_reason text;

-- Comentarios para documentación
COMMENT ON COLUMN public.financing_requests.rejected_reason IS 
'Motivo por el cual el financiamiento fue rechazado (por supplier o por Sellsi). Solo se llena cuando status es rejected_by_supplier o rejected_by_sellsi.';

COMMENT ON COLUMN public.financing_requests.cancelled_reason IS 
'Motivo por el cual el financiamiento fue cancelado (por buyer o supplier). Solo se llena cuando status es cancelled_by_buyer o cancelled_by_supplier.';

-- ============================================================================
-- PARTE 2: FUNCIÓN RPC PARA OBTENER NOMBRE DE SUPPLIER (bypasea RLS)
-- ============================================================================

-- Esta función es similar a get_supplier_public_info pero más simple:
-- Solo retorna el NAME del supplier dado su ID
-- Usada por buyer para mostrar nombre de proveedor en sus vistas de financiamiento

CREATE OR REPLACE FUNCTION public.get_supplier_name_for_buyer(p_supplier_id uuid)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_supplier_name text;
BEGIN
  -- Validación: requiere supplier_id
  IF p_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Se requiere p_supplier_id';
  END IF;

  -- Obtener solo el nombre del supplier
  -- SECURITY DEFINER bypasea RLS (buyer no puede leer tabla supplier normalmente)
  SELECT name INTO v_supplier_name
  FROM public.supplier
  WHERE id = p_supplier_id;

  -- Retornar nombre o NULL si no existe
  RETURN v_supplier_name;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_supplier_name_for_buyer(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_supplier_name_for_buyer IS 
'Retorna solo el NAME de un supplier dado su ID. Usa SECURITY DEFINER para bypassear RLS. Permite a buyers ver nombre de proveedor sin acceder a datos sensibles.';

