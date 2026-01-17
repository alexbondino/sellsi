-- ============================================================================
-- LIMPIEZA: Eliminar Feature Flag Duplicado
-- ============================================================================
-- Fecha: 2026-01-14
-- Descripción: Elimina el registro duplicado de my_offers_supplier en my-financing
-- ============================================================================

begin;

-- Eliminar el registro duplicado de my_offers_supplier en my-financing
-- (Corregido para usar workspace y key en lugar de UUID)
DELETE FROM control_panel.feature_flags
WHERE workspace = 'my-financing' 
  AND key = 'my_offers_supplier';

commit;
