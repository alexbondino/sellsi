-- Notifications System Migration
-- Creates notifications table, rotation trigger, and RLS policies.
-- Adjusts design for per-item notifications (buyer receives one per product/supplier item state change).

begin;

-- 1. Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  supplier_id uuid null references public.users(user_id) on delete set null, -- quien originó (para buyer-facing events)
  order_id uuid null references public.orders(id) on delete cascade,
  product_id uuid null references public.products(productid) on delete set null, -- item específico (multi-supplier)
  type text not null, -- 'welcome' | 'order_new' | 'order_status'
  order_status text null, -- 'pending'|'accepted'|'rejected'|'in_transit'|'delivered'
  role_context text not null default 'buyer', -- 'buyer' | 'supplier'
  context_section text not null default 'generic', -- 'buyer_orders' | 'supplier_orders' | 'generic'
  title text not null,
  body text null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

-- 2. Indexes
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id) where is_read = false;
create index if not exists notifications_order_idx on public.notifications(order_id);
create index if not exists notifications_product_idx on public.notifications(product_id);

-- (Optional future) partial unique to prevent exact duplicate status spam per item within short timeframe could be implemented via time-bucket + unique index.

-- 3. Rotation Trigger (cap = 100 per user)
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
  ) old
  where n.id = old.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trim_notifications_trigger on public.notifications;
create trigger trim_notifications_trigger
after insert on public.notifications
for each row execute function public.trim_notifications();

-- 4. RLS
alter table public.notifications enable row level security;

-- Policy: users can select their own notifications
drop policy if exists notifications_select_self on public.notifications;
create policy notifications_select_self
  on public.notifications for select
  using (auth.uid() = user_id);

-- Policy: users can update (mark read) only their notifications (restricting columns enforced at app layer)
drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NO insert policy: insertion restricted to service role / edge functions.

-- OPTIONAL (future): Partial unique index for dedupe within status per item (uncomment when logic ready)
-- create unique index notifications_dedupe_unique
--   on public.notifications(user_id, order_id, product_id, type, order_status)
--   where order_status is not null;

commit;
