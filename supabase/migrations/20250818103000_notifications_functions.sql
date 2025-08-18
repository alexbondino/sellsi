-- RPC Functions for Notifications System (create, welcome, bulk mark context)
begin;

-- Create notification with dedupe (120s window) per user/order/product/type/order_status
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_supplier_id uuid default null,
  p_order_id uuid default null,
  p_product_id uuid default null,
  p_order_status text default null,
  p_role_context text default 'buyer',
  p_context_section text default 'generic',
  p_body text default null,
  p_metadata jsonb default '{}'::jsonb
) returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.notifications;
  v_now timestamptz := now();
begin
  -- Basic sanity
  if p_user_id is null then
    raise exception 'p_user_id requerido';
  end if;
  if p_type is null then
    raise exception 'p_type requerido';
  end if;
  if p_title is null then
    raise exception 'p_title requerido';
  end if;

  -- Dedupe within last 120 seconds
  select * into v_row
  from public.notifications
  where user_id = p_user_id
    and coalesce(order_id, '00000000-0000-0000-0000-000000000000') = coalesce(p_order_id, '00000000-0000-0000-0000-000000000000')
    and coalesce(product_id, '00000000-0000-0000-0000-000000000000') = coalesce(p_product_id, '00000000-0000-0000-0000-000000000000')
    and type = p_type
    and coalesce(order_status,'') = coalesce(p_order_status,'')
    and created_at > v_now - interval '120 seconds'
  order by created_at desc
  limit 1;

  if found then
    return v_row; -- return existing deduped notification
  end if;

  insert into public.notifications(
    user_id, supplier_id, order_id, product_id, type, order_status,
    role_context, context_section, title, body, metadata
  ) values (
    p_user_id, p_supplier_id, p_order_id, p_product_id, p_type, p_order_status,
    p_role_context, p_context_section, p_title, p_body, coalesce(p_metadata,'{}'::jsonb)
  ) returning * into v_row;

  return v_row;
end; $$;

-- Create welcome notification (idempotent)
create or replace function public.create_welcome_notification(p_user_id uuid) returns public.notifications
language plpgsql security definer set search_path=public as $$
declare v_row public.notifications; begin
  if p_user_id is null then raise exception 'p_user_id requerido'; end if;
  select * into v_row from public.notifications
   where user_id = p_user_id and type='welcome' order by created_at desc limit 1;
  if found then return v_row; end if;
  insert into public.notifications(user_id,type,title,body,role_context,context_section)
   values (p_user_id,'welcome','Bienvenido a Sellsi','Configura tu perfil para empezar a comprar o vender.','buyer','generic')
   returning * into v_row;
  return v_row;
end; $$;

-- Bulk mark notifications for a context_section
create or replace function public.mark_notifications_context_read(
  p_user_id uuid,
  p_context_section text
) returns int
language plpgsql security definer set search_path=public as $$
declare v_count int; begin
  update public.notifications
    set is_read = true, read_at = now()
    where user_id = p_user_id
      and context_section = p_context_section
      and is_read = false;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

commit;
