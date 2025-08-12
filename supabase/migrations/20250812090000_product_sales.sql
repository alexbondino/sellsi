-- Create product_sales table to track per-product sales at checkout time
-- Includes references to products, suppliers (users), and orders

create table if not exists public.product_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(productid),
  supplier_id uuid not null references public.users(user_id),
  quantity integer not null check (quantity > 0),
  amount numeric not null default 0,
  trx_date timestamptz not null default now(),
  order_id uuid references public.orders(id)
);

-- Ensure idempotency per order/product/supplier
alter table public.product_sales
  add constraint product_sales_unique unique (order_id, product_id, supplier_id);

-- Helpful indexes for querying by supplier, product, order and date
create index if not exists idx_product_sales_supplier on public.product_sales (supplier_id, trx_date);
create index if not exists idx_product_sales_product on public.product_sales (product_id, trx_date);
create index if not exists idx_product_sales_order on public.product_sales (order_id);
