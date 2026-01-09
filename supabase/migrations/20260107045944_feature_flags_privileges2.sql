-- supabase/migrations/YYYYMMDDHHMMSS_fix_feature_flags_permissions.sql
begin;

-- Asegura schema
create schema if not exists control_panel;

-- Asegura tabla (no borra nada si ya existe)
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

create unique index if not exists feature_flags_workspace_key_uq
  on control_panel.feature_flags (workspace, key);

-- ✅ IMPORTANTE: grants a schema y tabla para roles del API
grant usage on schema control_panel to anon, authenticated;

-- Tabla: por defecto solo authenticated
grant select, insert, update, delete on table control_panel.feature_flags to authenticated;

-- Si tu UI carga flags antes del login, entonces necesitas permitir SELECT a anon (solo lectura):
grant select on table control_panel.feature_flags to anon;

-- RLS
alter table control_panel.feature_flags enable row level security;

-- Policies
drop policy if exists ff_select_authenticated on control_panel.feature_flags;
drop policy if exists ff_write_authenticated  on control_panel.feature_flags;
drop policy if exists ff_select_anon          on control_panel.feature_flags;

-- Lectura para authenticated
create policy ff_select_authenticated
on control_panel.feature_flags
for select
to authenticated
using (true);

-- Escritura para authenticated (⚠️ permisivo)
create policy ff_write_authenticated
on control_panel.feature_flags
for all
to authenticated
using (true)
with check (true);

-- ✅ Lectura para anon (solo si realmente lo necesitas)
create policy ff_select_anon
on control_panel.feature_flags
for select
to anon
using (true);

commit;
