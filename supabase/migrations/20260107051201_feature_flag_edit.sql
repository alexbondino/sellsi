-- supabase/migrations/YYYYMMDDHHMMSS_fix_feature_flags_update_permissions.sql
begin;

-- A) Grants correctos
grant usage on schema control_panel to authenticated;
grant select, insert, update, delete on table control_panel.feature_flags to authenticated;

-- B) RLS ON
alter table control_panel.feature_flags enable row level security;

-- C) Policies (si no existen)
drop policy if exists ff_select_authenticated on control_panel.feature_flags;
drop policy if exists ff_update_authenticated on control_panel.feature_flags;
drop policy if exists ff_insert_authenticated on control_panel.feature_flags;

create policy ff_select_authenticated
on control_panel.feature_flags
for select
to authenticated
using (true);

create policy ff_update_authenticated
on control_panel.feature_flags
for update
to authenticated
using (true);

create policy ff_insert_authenticated
on control_panel.feature_flags
for insert
to authenticated
with check (true);

commit;
