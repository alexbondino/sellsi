-- ============================================================================
-- 2026-01-07: Fix payment_releases_view con DROP+CREATE
-- ============================================================================
-- Problema: La migración 20260106000005 falló en producción porque
--           CREATE OR REPLACE VIEW no permite cambiar nombres/orden de columnas
--           (error: "cannot change name of view column 'order_code' to 'supplier_name'")
-- Solución: DROP explícito + CREATE con nueva estructura y purchased_at
-- ============================================================================

BEGIN;

-- 1. Dropear vista existente (seguro, no hay dependencias CASCADE)
DROP VIEW IF EXISTS public.payment_releases_with_details;

-- 2. Recrear con estructura correcta y purchased_at
CREATE VIEW public.payment_releases_with_details AS
SELECT 
  pr.id,
  pr.order_id,
  pr.supplier_id,
  pr.buyer_id,
  pr.amount,
  pr.currency,
  pr.delivery_confirmed_at,
  pr.payment_received_at,
  pr.status,
  pr.released_by_admin_id,
  pr.released_at,
  pr.admin_notes,
  pr.payment_proof_url,
  pr.created_at,
  pr.updated_at,
  supplier.user_nm AS supplier_name,
  supplier.email AS supplier_email,
  buyer.user_nm AS buyer_name,
  buyer.email AS buyer_email,
  admin.usuario AS released_by_admin_username,
  admin.full_name AS admin_name,  -- ← MANTENER nombre original del frontend
  EXTRACT(day FROM pr.delivery_confirmed_at - pr.payment_received_at)::integer AS days_to_delivery,
  CASE
    WHEN pr.status = 'pending_release'::text THEN EXTRACT(day FROM now() - pr.delivery_confirmed_at)::integer
    ELSE NULL::integer
  END AS days_pending,
  CASE
    WHEN pr.status = 'released'::text THEN EXTRACT(day FROM pr.released_at - pr.delivery_confirmed_at)::integer
    ELSE NULL::integer
  END AS days_to_release,
  o.paid_at AS purchased_at,  -- ← NUEVO: Resuelve "Fecha Compra N/A" en UI
  EXTRACT(day FROM COALESCE(pr.released_at, now()) - pr.delivery_confirmed_at)::integer AS days_since_delivery  -- ← PRESERVADO: Usado en PaymentReleasesTable
FROM payment_releases pr
  LEFT JOIN orders o ON pr.order_id = o.id
  LEFT JOIN users supplier ON pr.supplier_id = supplier.user_id
  LEFT JOIN users buyer ON pr.buyer_id = buyer.user_id
  LEFT JOIN control_panel_users admin ON pr.released_by_admin_id = admin.id;

COMMIT;

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================
-- Cambios:
-- - DROP VIEW existente (remueve columnas obsoletas: order_code, order_payment_status, admin_email)
-- - CREATE VIEW con estructura nueva
-- 
-- Columnas PRESERVADAS (usadas en frontend):
--   - supplier_name, buyer_name, admin_name (PaymentReleaseDetailsModal línea 193)
--   - supplier_email, buyer_email (exportPaymentReleasesToExcel)
--   - days_since_delivery (PaymentReleasesTable.jsx línea 327)
--
-- Columnas AÑADIDAS:
--   - purchased_at (arregla "Fecha Compra N/A" en ReleasePaymentModal línea 202)
--   - released_by_admin_username (exportación Excel, auditoría)
--   - days_to_delivery, days_pending, days_to_release (métricas adicionales)
--   - released_by_admin_username (mejor auditoría)
--   - days_to_delivery, days_pending, days_to_release (métricas adicionales)
-- ============================================================================
