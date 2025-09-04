-- Migration: Normalize document_type in orders.items JSON array (root supabase dir)
-- Fecha: 2025-08-16
-- Objetivo: garantizar que cada item en orders.items tenga document_type normalizado
-- ('boleta' | 'factura' | 'ninguno') y que exista price_at_addition.

BEGIN;

UPDATE orders
SET items = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(item,
        '{document_type}',
        to_jsonb(
          CASE LOWER(COALESCE(item->>'document_type', item->>'documentType', ''))
            WHEN 'boleta' THEN 'boleta'
            WHEN 'factura' THEN 'factura'
            ELSE 'ninguno'
          END
        )
      ),
      '{price_at_addition}',
      to_jsonb(COALESCE((item->>'price_at_addition')::numeric, (item->>'price')::numeric, 0))
    )
  )
  FROM jsonb_array_elements(COALESCE(orders.items, '[]'::jsonb)) AS item
)
WHERE items IS NOT NULL;

COMMIT;
