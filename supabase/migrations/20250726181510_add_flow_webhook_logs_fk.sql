-- Migration: Add Foreign Key to flow_webhook_logs
-- Date: 2025-07-26
-- Description: Add foreign key constraint to flow_webhook_logs.order_id after orders table exists

-- Add foreign key constraint to flow_webhook_logs
ALTER TABLE public.flow_webhook_logs 
  ADD CONSTRAINT flow_webhook_logs_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES orders(id) 
  ON DELETE SET NULL;
