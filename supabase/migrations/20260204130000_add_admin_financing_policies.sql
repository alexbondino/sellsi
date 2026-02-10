-- 20260204130000_add_admin_financing_policies.sql
-- Agregar RPC SECURITY DEFINER para que control_panel_users puedan acceder a financing_requests
-- Fecha: 2026-02-04 13:00:00
-- Nota: control_panel_users NO usa Supabase Auth, por lo tanto auth.uid() es NULL
--       Solución: RPC que bypasea RLS usando SECURITY DEFINER

BEGIN;

-- ============================================================================
-- RPC: admin_get_all_financing_requests
-- Permite obtener todos los financing requests bypasseando RLS
-- NOTA: Esta función NO valida permisos - confía en que el frontend validó al admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_all_financing_requests()
RETURNS SETOF public.financing_requests
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT * FROM public.financing_requests
  ORDER BY created_at DESC;
$$;

-- Permisos - solo authenticated puede ejecutar (anon no)
GRANT EXECUTE ON FUNCTION public.admin_get_all_financing_requests() TO authenticated;

COMMENT ON FUNCTION public.admin_get_all_financing_requests IS 
  'Retorna todos los financing_requests bypasseando RLS. Solo para uso del control panel admin.';

COMMIT;

-- Testing (ejecutar manualmente):
-- SELECT * FROM public.admin_get_all_financing_requests() LIMIT 5;
