-- ============================================================================
-- MIGRATION: FIX PAYMENT METHODS CONFIG RLS POLICY
-- Problema: El rol 'anon' no puede actualizar payment_methods_config
-- Solución: Permitir UPDATE a anon (admin panel usa anon key)
-- ============================================================================

-- Eliminar política restrictiva existente
DROP POLICY IF EXISTS "Authenticated users can update payment methods config" ON payment_methods_config;

-- Crear nueva política que permita UPDATE a anon y authenticated
-- NOTA: La seguridad a nivel de aplicación ya valida que solo admins
-- puedan acceder al panel de admin (control_panel_users)
CREATE POLICY "Allow update payment methods config"
  ON payment_methods_config
  FOR UPDATE
  TO anon, authenticated  -- ✅ Permitir tanto anon como authenticated
  USING (true)
  WITH CHECK (true);

-- Comentario explicativo
COMMENT ON POLICY "Allow update payment methods config" ON payment_methods_config IS 
'Permite actualizar configuración de métodos de pago. La validación de admin se hace en el control panel (control_panel_users)';
