-- Migration: Create table for supplier shipping region presets
-- Dependencias: asume existencia de public.users(user_id) y extensión pgcrypto o gen_random_uuid()

create table if not exists public.supplier_shipping_region_presets (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.users(user_id) on delete cascade,
  preset_index smallint not null check (preset_index between 1 and 3),
  name text not null,
  regions jsonb not null check (jsonb_typeof(regions) = 'array'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (supplier_id, preset_index)
);

create index if not exists idx_supplier_shipping_region_presets_supplier on public.supplier_shipping_region_presets (supplier_id);

-- RLS (activar sólo si el proyecto usa RLS globalmente)
alter table public.supplier_shipping_region_presets enable row level security;

-- Policies (NOTA: PostgreSQL no soporta IF NOT EXISTS en create policy directamente)
do $$ begin
  begin
    create policy "select_own_presets" on public.supplier_shipping_region_presets
      for select using (auth.uid() = supplier_id);
  exception when duplicate_object then null; end;
  begin
    create policy "insert_own_presets" on public.supplier_shipping_region_presets
      for insert with check (auth.uid() = supplier_id);
  exception when duplicate_object then null; end;
  begin
    create policy "update_own_presets" on public.supplier_shipping_region_presets
      for update using (auth.uid() = supplier_id) with check (auth.uid() = supplier_id);
  exception when duplicate_object then null; end;
  begin
    create policy "delete_own_presets" on public.supplier_shipping_region_presets
      for delete using (auth.uid() = supplier_id);
  exception when duplicate_object then null; end;
end $$;

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_supplier_shipping_region_presets_updated
before update on public.supplier_shipping_region_presets
for each row execute function public.set_updated_at();
