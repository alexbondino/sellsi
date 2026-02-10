-- ============================================================================
-- Admin Approve Financing RPC
-- ============================================================================
-- Permite a los administradores aprobar financiamientos y subir documentos
-- bypaseando RLS ya que control_panel usa auth custom (no Supabase Auth)

-- Función para insertar documento de financiamiento (para admin)
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
  INSERT INTO public.financing_documents (
    financing_id,
    financing_request_id,
    file_path,
    document_type,
    document_name,
    storage_path,
    file_size,
    mime_type
  ) VALUES (
    p_financing_id,
    p_financing_id,
    p_file_path,
    p_document_type,
    p_document_name,
    p_storage_path,
    p_file_size,
    p_mime_type
  )
  RETURNING to_json(financing_documents.*) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Función para aprobar financiamiento (para admin)
CREATE OR REPLACE FUNCTION public.admin_approve_financing_request(
  p_financing_id uuid,
  p_admin_id uuid
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_term_days integer;
  v_expiration_date date;
  v_result json;
BEGIN
  -- Obtener term_days para calcular expires_at
  SELECT term_days INTO v_term_days
  FROM public.financing_requests
  WHERE financing_requests.id = p_financing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financing request not found: %', p_financing_id;
  END IF;

  -- Calcular fecha de expiración
  v_expiration_date := CURRENT_DATE + v_term_days;

  -- Actualizar solo si está en estado pending_sellsi_approval
  UPDATE public.financing_requests
  SET
    status = 'approved_by_sellsi',
    approved_by_admin_id = p_admin_id,
    activated_at = CURRENT_DATE,
    expires_at = v_expiration_date,
    updated_at = NOW()
  WHERE financing_requests.id = p_financing_id
    AND financing_requests.status = 'pending_sellsi_approval'
  RETURNING to_json(financing_requests.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Financing request % is not in pending_sellsi_approval status or does not exist', p_financing_id;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.admin_insert_financing_document TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_financing_request TO authenticated, anon;

-- Comentarios
COMMENT ON FUNCTION public.admin_insert_financing_document IS 'Inserta documento de financiamiento bypaseando RLS para admins de control_panel';
COMMENT ON FUNCTION public.admin_approve_financing_request IS 'Aprueba financiamiento bypaseando RLS para admins de control_panel';
