-- ============================================================================
-- LIMPIEZA: Feature Flags Duplicados y Erróneos
-- ============================================================================
-- Fecha: 2026-01-14
-- Descripción: Elimina registros duplicados y corrige workspaces mal escritos
-- ============================================================================

BEGIN;

-- 1. Eliminar el flag my_offers_supplier del workspace incorrecto "my financing"
-- (Este es un typo - debería estar solo en "my-offers")
DELETE FROM control_panel.feature_flags
WHERE workspace = 'my financing'
  AND key = 'my_offers_supplier';

-- 2. Verificar que no haya otros workspaces con espacios en lugar de guiones
-- (Esto es preventivo para detectar otros errores)
SELECT workspace, key, label
FROM control_panel.feature_flags
WHERE workspace LIKE '% %'
ORDER BY workspace, key;

-- 3. Mostrar el estado final limpio
SELECT workspace, key, label, enabled
FROM control_panel.feature_flags
ORDER BY key, workspace;

COMMIT;
