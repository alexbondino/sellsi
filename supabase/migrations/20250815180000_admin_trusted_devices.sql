-- 20250815180000_admin_trusted_devices.sql
-- Trusted devices for admin 2FA (30-day remember device feature)

CREATE TABLE IF NOT EXISTS public.admin_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.control_panel_users(id) ON DELETE CASCADE,
  device_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz DEFAULT now(),
  user_agent text,
  label text,
  token_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT admin_trusted_devices_unique UNIQUE (admin_id, device_hash)
);

ALTER TABLE public.admin_trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policies: admin can only manage own trusted devices (email match join)
DROP POLICY IF EXISTS admin_trusted_devices_select_self ON public.admin_trusted_devices;
CREATE POLICY admin_trusted_devices_select_self ON public.admin_trusted_devices
  FOR SELECT TO authenticated
  USING (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

DROP POLICY IF EXISTS admin_trusted_devices_insert_self ON public.admin_trusted_devices;
CREATE POLICY admin_trusted_devices_insert_self ON public.admin_trusted_devices
  FOR INSERT TO authenticated
  WITH CHECK (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

DROP POLICY IF EXISTS admin_trusted_devices_delete_self ON public.admin_trusted_devices;
CREATE POLICY admin_trusted_devices_delete_self ON public.admin_trusted_devices
  FOR DELETE TO authenticated
  USING (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

COMMENT ON TABLE public.admin_trusted_devices IS 'Stores device hashes for remembered 2FA bypass (30 days).';
COMMENT ON COLUMN public.admin_trusted_devices.device_hash IS 'SHA-256 hash of device fingerprint from client.';
COMMENT ON COLUMN public.admin_trusted_devices.token_id IS 'Opaque id used for signed trust token returned to client.';
