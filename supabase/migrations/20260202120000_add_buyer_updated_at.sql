-- 20260202120000_add_buyer_updated_at.sql
-- Add missing updated_at column to buyer table
-- This column is expected by update_updated_at_column() trigger

BEGIN;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.buyer 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create trigger to auto-update updated_at on UPDATE
DROP TRIGGER IF EXISTS update_buyer_updated_at ON public.buyer;
CREATE TRIGGER update_buyer_updated_at
  BEFORE UPDATE ON public.buyer
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Comentario: La función update_updated_at_column() ya existe globalmente
-- Este trigger asegura que updated_at se actualice automáticamente en cada UPDATE
