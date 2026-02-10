-- 20260203160000_auto_update_financing_status_on_signature.sql
-- Trigger para actualizar automáticamente el status de financing_requests
-- basado en los timestamps de firma (signed_buyer_at, signed_supplier_at, signed_sellsi_at)

-- Función que calcula y actualiza el status correcto según las firmas
CREATE OR REPLACE FUNCTION public.update_financing_status_on_signature()
RETURNS trigger AS $$
DECLARE
  v_buyer_signed boolean;
  v_supplier_signed boolean;
  v_sellsi_signed boolean;
  v_new_status text;
BEGIN
  -- NO actualizar status si el financing ya fue cancelado, rechazado, expirado o pagado
  -- Estos estados son terminales y no deben ser sobrescritos por firmas
  IF OLD.status IN ('cancelled_by_buyer', 'cancelled_by_supplier', 'rejected_by_supplier', 
                     'rejected_by_sellsi', 'expired', 'paid', 'partially_paid', 'overdue') THEN
    RETURN NEW; -- No modificar status, mantener el estado terminal
  END IF;

  -- Obtener estado de firmas
  v_buyer_signed := NEW.signed_buyer_at IS NOT NULL;
  v_supplier_signed := NEW.signed_supplier_at IS NOT NULL;
  v_sellsi_signed := NEW.signed_sellsi_at IS NOT NULL;

  -- Determinar nuevo status basado en las firmas
  IF v_sellsi_signed THEN
    -- Si Sellsi firmó, el financiamiento está aprobado
    v_new_status := 'approved';
  ELSIF v_buyer_signed AND v_supplier_signed THEN
    -- Si ambos firmaron, esperando aprobación de Sellsi
    v_new_status := 'pending_sellsi_approval';
  ELSIF v_buyer_signed AND NOT v_supplier_signed THEN
    -- Si solo buyer firmó, esperando firma de supplier
    v_new_status := 'supplier_signature_pending';
  ELSIF v_supplier_signed AND NOT v_buyer_signed THEN
    -- Si solo supplier firmó, esperando firma de buyer
    v_new_status := 'buyer_signature_pending';
  ELSE
    -- Ninguno firmó aún, mantener status actual (no modificar)
    v_new_status := NEW.status;
  END IF;

  -- Solo actualizar si el status cambió
  IF v_new_status IS DISTINCT FROM NEW.status THEN
    NEW.status := v_new_status;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta ANTES de UPDATE en financing_requests
-- Se activa cuando cambian los campos signed_*_at
DROP TRIGGER IF EXISTS trg_update_financing_status_on_signature ON public.financing_requests;
CREATE TRIGGER trg_update_financing_status_on_signature
  BEFORE UPDATE OF signed_buyer_at, signed_supplier_at, signed_sellsi_at
  ON public.financing_requests
  FOR EACH ROW
  WHEN (
    NEW.signed_buyer_at IS DISTINCT FROM OLD.signed_buyer_at OR
    NEW.signed_supplier_at IS DISTINCT FROM OLD.signed_supplier_at OR
    NEW.signed_sellsi_at IS DISTINCT FROM OLD.signed_sellsi_at
  )
  EXECUTE FUNCTION public.update_financing_status_on_signature();

-- Comentarios sobre el flujo:
-- 1. Usuario sube documento firmado a financing_documents
-- 2. Trigger on_financing_document_upsert actualiza signed_*_at en financing_requests
-- 3. UPDATE en financing_requests activa este trigger
-- 4. Este trigger calcula y actualiza el status automáticamente
-- 5. Frontend no necesita actualizar status manualmente (se hace automático)

-- Rollback:
-- DROP TRIGGER IF EXISTS trg_update_financing_status_on_signature ON public.financing_requests;
-- DROP FUNCTION IF EXISTS public.update_financing_status_on_signature();
