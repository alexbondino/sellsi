-- supabase/migrations/XXXXXXXXXXXXXX_create_feature_flags.sql

-- 1) (Opcional) asegurar esquema (si ya existe, puedes omitir)
create schema if not exists marketplace;

-- 2) Tabla feature flags
create table if not exists marketplace.feature_flags (
  id uuid primary key default gen_random_uuid(),

  -- Identificador del tenant / workspace.
  -- Si tu workspace es UUID en tu app, cámbialo a uuid y ajusta el servicio.
  workspace text not null,

  -- Key técnica del flag (ej: "new_checkout", "beta_recommender")
  key text not null,

  -- Metadata para mostrar en UI admin
  label text,
  description text,

  -- Estado del flag
  enabled boolean not null default false,

  -- Auditoría
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Evita duplicados dentro del mismo workspace
  constraint feature_flags_workspace_key_uk unique (workspace, key)
);

-- 3) Índice para tu query principal:
-- .eq('workspace', workspace) + luego filtras por key en update
create index if not exists feature_flags_workspace_idx
  on marketplace.feature_flags (workspace);

create index if not exists feature_flags_workspace_key_idx
  on marketplace.feature_flags (workspace, key);

-- 4) Trigger genérico para updated_at (estilo Supabase)
create or replace function marketplace.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feature_flags_set_updated_at on marketplace.feature_flags;

create trigger trg_feature_flags_set_updated_at
before update on marketplace.feature_flags
for each row
execute function marketplace.set_updated_at();
