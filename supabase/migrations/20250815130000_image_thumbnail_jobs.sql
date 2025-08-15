-- Migration: image_thumbnail_jobs (tracking + retries) - Step 3 del nuevoplan
-- Fecha: 2025-08-15
-- Objetivo: Observabilidad y preparación de reintentos para generación de thumbnails

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS public.image_thumbnail_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL,
    product_image_id uuid,
    status text NOT NULL CHECK (status IN ('queued','processing','success','error')),
    attempts int NOT NULL DEFAULT 0,
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT image_thumbnail_jobs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid) ON DELETE CASCADE,
    CONSTRAINT image_thumbnail_jobs_product_image_id_fkey FOREIGN KEY (product_image_id) REFERENCES public.product_images(id) ON DELETE SET NULL
);

-- Un job por producto (para la imagen principal). Si se quisiera permitir varios, eliminar este índice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_image_thumbnail_jobs_product ON public.image_thumbnail_jobs(product_id);

-- Unicidad opcional por product_image_id si se setea (sirve para diagnósticos)
CREATE UNIQUE INDEX IF NOT EXISTS uq_image_thumbnail_jobs_product_image ON public.image_thumbnail_jobs(product_image_id) WHERE product_image_id IS NOT NULL;

-- Índices de consulta por estado y timestamps
CREATE INDEX IF NOT EXISTS idx_image_thumbnail_jobs_status ON public.image_thumbnail_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_thumbnail_jobs_updated_at ON public.image_thumbnail_jobs(updated_at DESC);

-- Trigger updated_at (reutilizamos patrón similar a product_images)
CREATE OR REPLACE FUNCTION public.set_image_thumbnail_jobs_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_image_thumbnail_jobs_updated_at') THEN
        DROP TRIGGER trg_image_thumbnail_jobs_updated_at ON public.image_thumbnail_jobs;
    END IF;
    CREATE TRIGGER trg_image_thumbnail_jobs_updated_at BEFORE UPDATE ON public.image_thumbnail_jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_image_thumbnail_jobs_updated_at();
END $$;

COMMENT ON TABLE public.image_thumbnail_jobs IS 'Tracking de generación de thumbnails (main image). Un registro por producto.';
COMMENT ON COLUMN public.image_thumbnail_jobs.status IS 'queued|processing|success|error';
COMMENT ON COLUMN public.image_thumbnail_jobs.attempts IS 'Número de intentos (incrementa al pasar a processing).';

-- Vista rápida opcional (puede borrarse si no se desea): jobs pendientes o fallidos
CREATE OR REPLACE VIEW public.vw_image_thumbnail_jobs_pending AS
SELECT * FROM public.image_thumbnail_jobs WHERE status IN ('queued','error');

-- Fin migración
