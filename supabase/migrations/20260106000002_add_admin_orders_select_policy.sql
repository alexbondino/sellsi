-- ============================================================================
-- MIGRATION: Add Admin SELECT Policy for Orders Table
-- ============================================================================
-- Fecha: 2026-01-06
-- Descripción: 
--   Permite a los admins (usuarios en control_panel_users) ver TODAS las órdenes
--   para poder administrar transferencias bancarias pendientes.
--
-- Problema identificado:
--   - Los admins NO usan Supabase Auth (se autentican vía control_panel_users)
--   - Las políticas RLS actuales solo permiten ver órdenes del propio usuario (auth.uid() = user_id)
--   - Al consultar .from('orders').select() desde el panel admin, auth.uid() es NULL
--   - Por lo tanto, NO se ven las órdenes pendientes de transferencia bancaria
--
-- Solución:
--   - Crear función helper is_admin_user() que verifica si el usuario actual es admin
--   - Agregar política RLS que permita SELECT a admins autenticados
--   - Las funciones RPC approve/reject ya funcionan porque son SECURITY DEFINER
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNCIÓN HELPER PARA VERIFICAR SI EL USUARIO ES ADMIN
-- ============================================================================

-- Esta función verifica si el usuario actual (auth.uid()) existe en control_panel_users
-- y está activo. Retorna TRUE si es admin, FALSE si no.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Obtener el ID del usuario actual de la sesión de Supabase Auth
  v_current_user_id := auth.uid();
  
  -- Si no hay sesión autenticada, no es admin
  IF v_current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si existe en control_panel_users y está activo
  SELECT EXISTS (
    SELECT 1 
    FROM public.control_panel_users 
    WHERE id = v_current_user_id 
      AND is_active = TRUE
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

COMMENT ON FUNCTION public.is_admin_user() IS 
  'Retorna TRUE si el usuario actual (auth.uid()) es un admin activo en control_panel_users';

-- Permisos: Esta función puede ser ejecutada por usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================================================
-- PARTE 2: POLÍTICA RLS PARA PERMITIR A ADMINS VER TODAS LAS ÓRDENES
-- ============================================================================

-- Eliminar política anterior si existe (para evitar duplicados)
DROP POLICY IF EXISTS orders_select_admin ON orders;

-- Crear nueva política que permite a admins ver todas las órdenes
CREATE POLICY orders_select_admin ON orders
  FOR SELECT
  USING (
    -- Permitir si el usuario actual es un admin activo
    public.is_admin_user()
  );

COMMENT ON POLICY orders_select_admin ON orders IS 
  'Permite a administradores (control_panel_users activos) ver TODAS las órdenes sin restricciones';

-- ============================================================================
-- PARTE 3: NOTAS Y CONSIDERACIONES
-- ============================================================================

-- IMPORTANTE: Orden de evaluación de políticas RLS
-- ----------------------------------------
-- Supabase evalúa las políticas con OR lógico:
-- 1. orders_select_own: user_id = auth.uid() → Usuarios ven sus propias órdenes
-- 2. orders_select_admin: is_admin_user() → Admins ven TODAS las órdenes
-- 3. orders_select_supplier: (ya existe) → Suppliers ven órdenes de sus productos
--
-- Un admin con sesión de Supabase Auth puede ver todas las órdenes.
-- Un usuario normal solo ve sus propias órdenes.
-- Un proveedor ve órdenes que contienen sus productos.

-- IMPORTANTE: Autenticación del Admin
-- ----------------------------------------
-- Para que esta política funcione, el admin DEBE:
-- 1. Tener una sesión autenticada en Supabase (auth.uid() != NULL)
-- 2. Su user_id debe existir en control_panel_users con is_active = TRUE
--
-- Si el admin NO tiene sesión de Supabase Auth (solo tiene localStorage),
-- esta política NO funcionará y seguirá sin ver las órdenes.
--
-- Soluciones alternativas si no hay sesión de Supabase Auth:
-- A) Crear sesiones de Supabase Auth para los admins (recomendado)
-- B) Usar RPC functions con SECURITY DEFINER para obtener las órdenes
-- C) Usar service_role key (NO recomendado para frontend)

-- ============================================================================
-- PARTE 4: FUNCIÓN RPC ALTERNATIVA PARA OBTENER ÓRDENES (FALLBACK)
-- ============================================================================

-- Esta función permite obtener órdenes pendientes de transferencia bancaria
-- incluso si el admin NO tiene sesión de Supabase Auth (auth.uid() = NULL).
-- Útil como fallback si la política RLS no funciona.

CREATE OR REPLACE FUNCTION public.get_pending_bank_transfers_for_admin(
  p_admin_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  user_id UUID,
  grand_total NUMERIC,
  currency TEXT,
  payment_method TEXT,
  payment_status TEXT,
  status TEXT,
  user_nm TEXT,
  email TEXT,
  rut TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM public.control_panel_users 
    WHERE control_panel_users.id = p_admin_id 
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin no válido o inactivo';
  END IF;
  
  -- Retornar órdenes pendientes de transferencia bancaria con datos del usuario
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.user_id,
    o.grand_total,
    o.currency,
    o.payment_method,
    o.payment_status,
    o.status,
    u.user_nm,
    u.email,
    u.rut
  FROM public.orders o
  LEFT JOIN public.users u ON o.user_id = u.user_id
  WHERE o.payment_method = 'bank_transfer'
    AND o.payment_status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_pending_bank_transfers_for_admin IS 
  'Retorna órdenes pendientes de transferencia bancaria para revisión del admin (bypassa RLS)';

GRANT EXECUTE ON FUNCTION public.get_pending_bank_transfers_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_bank_transfers_for_admin TO anon;

-- ============================================================================
-- PARTE 5: TESTING Y VALIDACIÓN
-- ============================================================================

-- Para probar que la migración funciona:
-- 
-- 1. Verificar que la función helper funciona:
--    SELECT public.is_admin_user();
--    -- Debería retornar TRUE si auth.uid() está en control_panel_users
--
-- 2. Verificar que la política RLS está activa:
--    SELECT * FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_admin';
--
-- 3. Probar consulta directa (con sesión de admin en Supabase Auth):
--    SELECT * FROM orders WHERE payment_method = 'bank_transfer' AND payment_status = 'pending';
--    -- Debería retornar todas las órdenes pendientes
--
-- 4. Probar función RPC fallback (sin sesión de Supabase Auth):
--    SELECT * FROM get_pending_bank_transfers_for_admin('ID_DEL_ADMIN');
--    -- Debería retornar todas las órdenes pendientes incluso sin auth.uid()

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
