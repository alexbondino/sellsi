-- Fix ambiguous column reference in trim_notifications function
begin;

create or replace function public.trim_notifications() returns trigger as $$
declare
begin
  -- Delete older rows beyond 100, prioritizing read ones first.
  delete from public.notifications n
  using (
    select id
    from public.notifications
    where user_id = new.user_id
    order by is_read asc, created_at asc  -- read first, then oldest
    offset 100
  ) old_rows
  where n.id = old_rows.id;
  return new;
end;
$$ language plpgsql security definer;

commit;
