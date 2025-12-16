ALTER TABLE public.users 
ADD COLUMN minimum_purchase_amount numeric NOT NULL DEFAULT 0 
CHECK (minimum_purchase_amount >= 0);

COMMENT ON COLUMN public.users.minimum_purchase_amount IS 
'Monto mínimo de compra en CLP que debe alcanzar el comprador para productos de este proveedor';
