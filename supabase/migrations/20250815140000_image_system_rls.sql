-- Migration: image system RLS enablement
-- Fecha: 2025-08-15
-- Activa RLS y establece políticas de solo lectura pública/ autenticada; mutaciones pasan por funciones SECURITY DEFINER o service role.

REVOKE INSERT, UPDATE, DELETE ON public.product_images FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.image_thumbnail_jobs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.image_orphan_candidates FROM anon, authenticated;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_thumbnail_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_orphan_candidates ENABLE ROW LEVEL SECURITY;

-- Lectura pública de product_images (ajustar si se desea restringir luego)
DROP POLICY IF EXISTS product_images_select_public ON public.product_images;
CREATE POLICY product_images_select_public ON public.product_images
  FOR SELECT USING (true);

-- Lectura solo autenticados para jobs
DROP POLICY IF EXISTS image_thumbnail_jobs_select_auth ON public.image_thumbnail_jobs;
CREATE POLICY image_thumbnail_jobs_select_auth ON public.image_thumbnail_jobs
  FOR SELECT TO authenticated USING (true);

COMMENT ON POLICY product_images_select_public ON public.product_images IS 'SELECT abierto; mutaciones solo vía funciones SECURITY DEFINER / service role.';
COMMENT ON POLICY image_thumbnail_jobs_select_auth ON public.image_thumbnail_jobs IS 'SELECT para usuarios autenticados; evita exponer jobs a anónimos.';

-- Sin policy para image_orphan_candidates: acceso directo sólo service role.

-- NOTA: Si se requiere restringir lectura pública más adelante, DROP POLICY product_images_select_public y crear políticas basadas en ownership.

