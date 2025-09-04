-- Allow suppliers to read buyers' shipping addresses for orders that include their products
-- so they can dispatch items.

-- Ensure RLS is enabled
alter table if exists public.shipping_info enable row level security;

-- Drop existing policy if present to avoid duplicates
drop policy if exists suppliers_can_view_buyer_shipping_for_their_orders on public.shipping_info;

create policy suppliers_can_view_buyer_shipping_for_their_orders
on public.shipping_info
for select
to authenticated
using (
  exists (
    select 1
    from public.carts c
    join public.cart_items ci on ci.cart_id = c.cart_id
    join public.products p on p.productid = ci.product_id
    where c.user_id = shipping_info.user_id
      and c.status <> 'active'
      and p.supplier_id = auth.uid()
  )
);
