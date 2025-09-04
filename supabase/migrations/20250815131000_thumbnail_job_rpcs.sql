-- Migration: thumbnail job RPCs (start / success / error) - complements image_thumbnail_jobs
-- Fecha: 2025-08-15
-- Objetivo: Operaciones atómicas para tracking de generación de thumbnails

-- Función para iniciar (o reintentar) job incrementando attempts de forma atómica
CREATE OR REPLACE FUNCTION public.start_thumbnail_job(
    p_product_id uuid,
    p_product_image_id uuid
) RETURNS public.image_thumbnail_jobs AS $$
DECLARE
    v_job public.image_thumbnail_jobs;
BEGIN
    -- Intento de UPDATE optimista
    LOOP
        UPDATE public.image_thumbnail_jobs j
        SET attempts = j.attempts + 1,
            status = 'processing',
            last_error = NULL,
            product_image_id = COALESCE(j.product_image_id, p_product_image_id),
            updated_at = now()
        WHERE j.product_id = p_product_id
        RETURNING j.* INTO v_job;
        IF FOUND THEN
            RETURN v_job;
        END IF;
        -- Si no existe fila, intentar insertar
        BEGIN
            INSERT INTO public.image_thumbnail_jobs (product_id, product_image_id, status, attempts)
            VALUES (p_product_id, p_product_image_id, 'processing', 1)
            RETURNING * INTO v_job;
            RETURN v_job;
        EXCEPTION WHEN unique_violation THEN
            -- Carrera: alguien insertó; repetir loop para hacer UPDATE
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.start_thumbnail_job(uuid, uuid) IS 'Inicia o reinicia job de thumbnail incrementando attempts y marcando status=processing.';

-- Función para marcar éxito
CREATE OR REPLACE FUNCTION public.mark_thumbnail_job_success(
    p_product_id uuid
) RETURNS public.image_thumbnail_jobs AS $$
DECLARE v_job public.image_thumbnail_jobs; BEGIN
    UPDATE public.image_thumbnail_jobs
    SET status='success', last_error=NULL, updated_at=now()
    WHERE product_id = p_product_id
    RETURNING * INTO v_job;
    RETURN v_job;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_thumbnail_job_success(uuid) IS 'Marca job como success y limpia last_error.';

-- Función para marcar error (trunca mensaje a 500 chars)
CREATE OR REPLACE FUNCTION public.mark_thumbnail_job_error(
    p_product_id uuid,
    p_error text
) RETURNS public.image_thumbnail_jobs AS $$
DECLARE v_job public.image_thumbnail_jobs; BEGIN
    UPDATE public.image_thumbnail_jobs
    SET status='error', last_error = LEFT(p_error, 500), updated_at=now()
    WHERE product_id = p_product_id
    RETURNING * INTO v_job;
    RETURN v_job;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.mark_thumbnail_job_error(uuid, text) IS 'Marca job como error y registra mensaje (500 chars).';
