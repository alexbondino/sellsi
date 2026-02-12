-- Verificar estado actual de la BD
-- RLS Policy: ¿tiene las restricciones de payment_status y paid_at?
SELECT 
    polname AS policy_name,
    polqual AS policy_condition
FROM pg_policy 
WHERE polrelid = 'financing_payments'::regclass 
  AND polname = 'financing_payments_buyer_insert';

-- Función: ¿el INSERT incluye financing_id?
SELECT pg_get_functiondef('process_financing_payment_success'::regproc);
