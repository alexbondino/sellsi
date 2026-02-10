-- ============================================================================
-- Fix Admin Insert Financing Document - Add UPSERT support
-- ============================================================================
-- Actualiza la función para hacer UPSERT en lugar de INSERT puro
-- Esto evita errores de duplicate key cuando el documento ya existe

-- Reemplazar función con soporte UPSERT
CREATE OR REPLACE FUNCTION public.admin_insert_financing_document(
  p_financing_id uuid,
  p_file_path text,
  p_document_type text,
  p_document_name text,
  p_storage_path text,
  p_file_size integer,
  p_mime_type text
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result json;
BEGIN
  -- UPSERT: Si ya existe (financing_request_id, document_type), actualizar
  INSERT INTO public.financing_documents (
    financing_id,
    financing_request_id,
    file_path,
    document_type,
    document_name,
    storage_path,
    file_size,
    mime_type,
    uploaded_at
  ) VALUES (
    p_financing_id,
    p_financing_id,
    p_file_path,
    p_document_type,
    p_document_name,
    p_storage_path,
    p_file_size,
    p_mime_type,
    NOW()
  )
  ON CONFLICT (financing_request_id, document_type)
  DO UPDATE SET
    financing_id = EXCLUDED.financing_id,
    file_path = EXCLUDED.file_path,
    document_name = EXCLUDED.document_name,
    storage_path = EXCLUDED.storage_path,
    file_size = EXCLUDED.file_size,
    mime_type = EXCLUDED.mime_type,
    uploaded_at = NOW()
  RETURNING to_json(financing_documents.*) INTO v_result;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.admin_insert_financing_document IS 'Inserta o actualiza documento de financiamiento bypaseando RLS para admins de control_panel. Usa UPSERT para evitar duplicados.';
