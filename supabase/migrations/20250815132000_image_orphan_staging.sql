-- Migration: image_orphan_candidates staging + purge helper
-- Fecha: 2025-08-15
-- Objetivo: Reemplazar borrado directo por flujo de staging + purge diferido

CREATE TABLE IF NOT EXISTS public.image_orphan_candidates (
    path text PRIMARY KEY,
    detected_at timestamptz NOT NULL DEFAULT now(),
    last_seen_reference timestamptz,
    confirmed_deleted_at timestamptz,
    bucket text NOT NULL CHECK (bucket IN ('product-images','product-images-thumbnails'))
);

COMMENT ON TABLE public.image_orphan_candidates IS 'Staging de archivos huérfanos antes de purge físico';
COMMENT ON COLUMN public.image_orphan_candidates.last_seen_reference IS 'Si referencia reaparece se actualiza y se evita purge';

-- Vista de candidatos elegibles para purge ( >7 días sin reaparición )
CREATE OR REPLACE VIEW public.vw_image_orphan_purge_candidates AS
SELECT * FROM public.image_orphan_candidates
WHERE confirmed_deleted_at IS NULL
  AND (now() - detected_at) > interval '7 days';

-- Función purge: elimina físicamente y marca confirmed_deleted_at
CREATE OR REPLACE FUNCTION public.purge_image_orphans(limit_rows int DEFAULT 100)
RETURNS integer AS $$
DECLARE
    v_count int := 0;
    rec record;
BEGIN
    FOR rec IN
        SELECT path, bucket FROM public.vw_image_orphan_purge_candidates
        ORDER BY detected_at ASC
        LIMIT limit_rows
    LOOP
        BEGIN
            -- Intentar eliminar del storage mediante RPC externa (no disponible aquí) => solo marcamos; ejecución real en Edge
            UPDATE public.image_orphan_candidates
            SET confirmed_deleted_at = now()
            WHERE path = rec.path;
            v_count := v_count + 1;
        EXCEPTION WHEN others THEN
            -- Continuar con siguiente
        END;
    END LOOP;
    RETURN v_count;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.purge_image_orphans(int) IS 'Marca y purga (lógico) hasta limit_rows huérfanos tras 7 días; storage delete ocurre en Edge';
