-- ============================================================================
-- LIMPIEZA: Eliminar Feature Flag Duplicado
-- ============================================================================
-- Fecha: 2026-01-14
-- Descripción: Elimina el registro duplicado de my_offers_supplier en my-financing
-- ============================================================================

begin;

-- Eliminar el registro duplicado específico por ID
DELETE FROM control_panel.feature_flags
WHERE id = '86b0989f-4a73-4fd0-85f2-2302ab0391e8';

commit;
