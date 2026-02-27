-- supabase/scripts/check_supplier_fk_integrity.sql
-- Find financing_requests that reference a supplier_id that does not exist in public.supplier

SELECT fr.id AS financing_id, fr.supplier_id
FROM public.financing_requests fr
WHERE fr.supplier_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.supplier s WHERE s.id = fr.supplier_id)
LIMIT 100;

-- If rows are returned, investigate why these supplier_id values are missing (migration/backfill incomplete or external system issued invalid id).
-- To remediate: run backfill migration `supabase/migrations/20260128150000_backfill_buyer_supplier_from_users.sql` on that environment, or manually reconcile supplier rows.
