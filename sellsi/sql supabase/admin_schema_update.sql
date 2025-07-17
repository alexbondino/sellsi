-- 🔧 ACTUALIZACIÓN DE SCHEMA PARA GESTIÓN DE ADMINISTRADORES
-- Agregar columnas adicionales a la tabla control_panel_users

-- Agregar columnas para mejor gestión de administradores
ALTER TABLE public.control_panel_users 
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS twofa_secret text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_control_panel_users_email ON public.control_panel_users(email);
CREATE INDEX IF NOT EXISTS idx_control_panel_users_role ON public.control_panel_users(role);
CREATE INDEX IF NOT EXISTS idx_control_panel_users_active ON public.control_panel_users(is_active);

-- Crear tabla de auditoría para acciones administrativas
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_id uuid,
  details jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id)
);

-- Crear índices para la tabla de auditoría
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON public.admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Crear tabla de sesiones administrativas
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true,
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id)
);

-- Crear índices para sesiones
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON public.admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION clean_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  UPDATE admin_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla de administradores
DROP TRIGGER IF EXISTS update_control_panel_users_updated_at ON public.control_panel_users;
CREATE TRIGGER update_control_panel_users_updated_at
  BEFORE UPDATE ON public.control_panel_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Agregar restricciones para roles válidos
ALTER TABLE public.control_panel_users
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('admin'));

-- Comentarios para documentación
COMMENT ON TABLE public.control_panel_users IS 'Usuarios del panel de control administrativo';
COMMENT ON COLUMN public.control_panel_users.usuario IS 'Username único para login';
COMMENT ON COLUMN public.control_panel_users.email IS 'Email para notificaciones';
COMMENT ON COLUMN public.control_panel_users.full_name IS 'Nombre completo del administrador';
COMMENT ON COLUMN public.control_panel_users.role IS 'Rol: admin (acceso completo)';
COMMENT ON COLUMN public.control_panel_users.twofa_secret IS 'Secreto para autenticación 2FA';
COMMENT ON COLUMN public.control_panel_users.notes IS 'Notas adicionales sobre el administrador';

COMMENT ON TABLE public.admin_audit_log IS 'Log de auditoría de acciones administrativas';
COMMENT ON TABLE public.admin_sessions IS 'Sesiones activas de administradores';

-- Insertar usuario admin por defecto (cambiar credenciales en producción)
INSERT INTO public.control_panel_users (
  usuario, 
  email, 
  password_hash, 
  full_name, 
  role, 
  is_active
) VALUES (
  'admin',
  'admin@sellsi.com',
  'hashed_admin123_temp', -- CAMBIAR EN PRODUCCIÓN
  'Administrador Principal',
  'admin',
  true
) ON CONFLICT (usuario) DO NOTHING;
