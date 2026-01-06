-- ============================================================================
-- 2026-01-06: Añadir purchased_at a payment_releases_with_details
-- ============================================================================
-- Problema: El frontend espera "purchased_at" pero la vista no lo expone
-- Solución: Añadir o.paid_at AS purchased_at preservando definición exacta
--
-- NOTA: No hay duplicados en payment_releases según consulta del 2026-01-06
--       Por tanto NO se incluye limpieza de duplicados
-- ============================================================================

BEGIN;

-- Actualizar vista preservando la definición EXACTA existente y añadiendo purchased_at
CREATE OR REPLACE VIEW public.payment_releases_with_details AS
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
  admin.full_name AS released_by_admin_name,
  EXTRACT(day FROM pr.delivery_confirmed_at - pr.payment_received_at)::integer AS days_to_delivery,
  CASE
    WHEN pr.status = 'pending_release'::text THEN EXTRACT(day FROM now() - pr.delivery_confirmed_at)::integer
    ELSE NULL::integer
  END AS days_pending,
  CASE
    WHEN pr.status = 'released'::text THEN EXTRACT(day FROM pr.released_at - pr.delivery_confirmed_at)::integer
    ELSE NULL::integer
  END AS days_to_release,
  o.paid_at AS purchased_at                            -- ← NUEVO: Al final para no cambiar orden de columnas
FROM payment_releases pr
  LEFT JOIN orders o ON pr.order_id = o.id             -- ← NUEVO: JOIN con orders para obtener paid_at
  LEFT JOIN users supplier ON pr.supplier_id = supplier.user_id
  LEFT JOIN users buyer ON pr.buyer_id = buyer.user_id
  LEFT JOIN control_panel_users admin ON pr.released_by_admin_id = admin.id;

COMMIT;

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================
-- Cambios:
-- - Añadido: LEFT JOIN orders o (para acceder a paid_at)
-- - Añadido: o.paid_at AS purchased_at (arregla "Fecha Compra N/A" en UI)
-- - Preservado: Todas las columnas y fórmulas exactas de la vista original
-- ============================================================================
