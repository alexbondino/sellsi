-- supabase/migrations/YYYYMMDDHHMMSS_allow_anon_update_feature_flags.sql
begin;

-- 1) Grants para anon (schema + tabla)
grant usage on schema control_panel to anon;
grant select, insert, update on table control_panel.feature_flags to anon;

-- 2) RLS ON (si ya está ON, ok)
alter table control_panel.feature_flags enable row level security;

-- 3) Policies para anon
drop policy if exists ff_select_anon on control_panel.feature_flags;
drop policy if exists ff_update_anon on control_panel.feature_flags;
drop policy if exists ff_insert_anon on control_panel.feature_flags;

create policy ff_select_anon
on control_panel.feature_flags
for select
to anon
using (true);

create policy ff_update_anon
on control_panel.feature_flags
for update
to anon
using (true);

create policy ff_insert_anon
on control_panel.feature_flags
for insert
to anon
with check (true);

commit;
