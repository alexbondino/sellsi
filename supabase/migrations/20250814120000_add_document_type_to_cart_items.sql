-- Migration: add document_type column to cart_items
-- Purpose: Persist buyer-selected tax document type (boleta|factura|ninguno) per cart line
-- Notes:
--  * Allows NULL (interpreted by frontend as "sin documento tributario")
--  * Simple CHECK instead of enum for easier future changes
--  * No backfill; legacy rows remain NULL

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS document_type text
  CHECK (document_type IN ('boleta','factura','ninguno') OR document_type IS NULL);

COMMENT ON COLUMN public.cart_items.document_type IS 'Tipo de documento tributario solicitado por el comprador para este ítem (boleta|factura|ninguno|null).';
