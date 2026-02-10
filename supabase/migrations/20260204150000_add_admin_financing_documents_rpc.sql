-- 20260204150000_add_admin_financing_documents_rpc.sql
-- Crear RPC para que admin del control panel pueda leer financing_documents
-- bypaseando RLS (control panel usa custom auth, no Supabase Auth)

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS admin_get_financing_documents(uuid);

-- Create RPC with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION admin_get_financing_documents(p_financing_id uuid)
RETURNS TABLE (
  id uuid,
  financing_id uuid,
  financing_request_id uuid,
  document_type text,
  document_name text,
  file_path text,
  storage_path text,
  file_size integer,
  mime_type text,
  uploaded_by uuid,
  uploaded_by_admin_id uuid,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fd.id,
    fd.financing_id,
    fd.financing_request_id,
    fd.document_type,
    fd.document_name,
    fd.file_path,
    fd.storage_path,
    fd.file_size,
    fd.mime_type,
    fd.uploaded_by,
    fd.uploaded_by_admin_id,
    fd.created_at
  FROM financing_documents fd
  WHERE fd.financing_id = p_financing_id
  ORDER BY fd.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION admin_get_financing_documents(uuid) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION admin_get_financing_documents(uuid) IS 
'RPC for admin control panel to get financing documents bypassing RLS. Uses SECURITY DEFINER to execute with elevated privileges.';

