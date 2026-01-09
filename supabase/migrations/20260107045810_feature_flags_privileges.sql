-- supabase/migrations/YYYYMMDDHHMMSS_fix_control_panel_feature_flags_permissions.sql

begin;

-- 0) Crear schema si no existe
create schema if not exists control_panel;

-- 1) (Opcional pero recomendado) asegurar tabla y columnas típicas
--    Si ya tienes la tabla creada, esto NO la reemplaza.
create table if not exists control_panel.feature_flags (
  id bigserial primary key,
  workspace text not null,
  key text not null,
  label text,
  description text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidad por workspace + key (evita duplicados)
create unique index if not exists feature_flags_workspace_key_uq
  on control_panel.feature_flags (workspace, key);

-- 2) Permisos: permitir uso del schema desde PostgREST (anon/auth)
grant usage on schema control_panel to anon, authenticated;

-- 3) Permisos sobre la tabla (lo usual es SOLO authenticated)
grant select, insert, update, delete on table control_panel.feature_flags to authenticated;

-- Si necesitas lectura sin login (NO recomendado para panel admin), descomenta:
-- grant select on table control_panel.feature_flags to anon;

-- 4) RLS habilitado (recomendado)
alter table control_panel.feature_flags enable row level security;

-- 5) Policies mínimas (para que deje de dar 401/42501)
--    Permite leer/escribir a cualquier usuario autenticado.
drop policy if exists ff_select_authenticated on control_panel.feature_flags;
drop policy if exists ff_write_authenticated  on control_panel.feature_flags;

create policy ff_select_authenticated
on control_panel.feature_flags
for select
to authenticated
using (true);

create policy ff_write_authenticated
on control_panel.feature_flags
for all
to authenticated
using (true)
with check (true);

commit;
