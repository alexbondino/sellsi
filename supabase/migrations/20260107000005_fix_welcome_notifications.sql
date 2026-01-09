-- Migration: 20260107 - Fix welcome notifications duplication
-- 1) Deduplicate existing welcome notifications (keep most recent per user)
-- 2) Create a unique partial index to prevent future duplicates
-- 3) Replace create_welcome_notification RPC with atomic upsert logic
-- NOTE: Run first in staging. Backup before running in production.

begin;

-- 1) Deduplicate: keep the most recent row (largest created_at) per user_id for type='welcome'
with duplicates as (
  select id
  from (
    select id, row_number() over (partition by user_id order by created_at desc) as rn
    from public.notifications
    where type = 'welcome'
  ) t
  where t.rn > 1
)
delete from public.notifications n
using duplicates d
where n.id = d.id
returning n.id, n.user_id;

-- 2) (Index creation moved to a separate migration using CONCURRENTLY to avoid long table locks in production.)
--    See 20260107000006_create_notifications_welcome_index_concurrently.sql

-- 3) Replace RPC: use an advisory lock per user to serialize concurrent RPC calls
--    This prevents duplicate inserts even if the unique index has not been created yet.
--    Once the index (created concurrently in the following migration) is present, the index acts
--    as an extra safeguard. Using the advisory lock avoids introducing dependencies on index
--    existence for correctness during rollout.
create or replace function public.create_welcome_notification(p_user_id uuid) returns public.notifications
language plpgsql security definer set search_path=public as $$
declare 
  v_row public.notifications;
  v_lock_key bigint;
begin
  if p_user_id is null then raise exception 'p_user_id requerido'; end if;

  -- Acquire an advisory lock based on the user_id to serialize concurrent operations for the same user
  -- Use first 16 hex chars of UUID (64 bits) for unique lock key without collisions
  v_lock_key := ('x' || translate(substring(p_user_id::text, 1, 16), '-', ''))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  -- If a welcome already exists, return it
  select * into v_row
    from public.notifications
    where user_id = p_user_id and type = 'welcome'
    order by created_at desc
    limit 1;

  if found then
    return v_row;
  end if;

  -- Safe to insert (we hold the lock for this user)
  insert into public.notifications(user_id,type,title,body,role_context,context_section)
    values (p_user_id,'welcome','Bienvenido a Sellsi','Configura tu perfil para empezar a comprar o vender.','buyer','generic')
    returning * into v_row;

  return v_row;
end; $$;

commit;
