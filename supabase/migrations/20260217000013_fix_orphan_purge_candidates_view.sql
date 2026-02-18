-- Fix: purge candidates must respect last_seen_reference
-- If a file was ever staged as orphan but later re-referenced, it should not be purged.

CREATE OR REPLACE VIEW public.vw_image_orphan_purge_candidates AS
SELECT *
FROM public.image_orphan_candidates
WHERE confirmed_deleted_at IS NULL
  AND (now() - COALESCE(last_seen_reference, detected_at)) > interval '7 days';

COMMENT ON VIEW public.vw_image_orphan_purge_candidates IS
'Candidatos a purge físico (>7 días desde última referencia o detección). Respeta last_seen_reference para evitar borrar archivos re-referenciados.';
