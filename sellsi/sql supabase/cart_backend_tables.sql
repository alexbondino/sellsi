-- =============================
-- Tabla explicativa de estructura
-- =============================
-- | Tabla         | Propósito / Descripción                                                                 |
-- |---------------|---------------------------------------------------------------------------------------|
-- | carts         | Agrupa los carritos por usuario. Permite múltiples carritos por usuario (activo, etc). |
-- | cart_items    | Almacena los productos y cantidades de cada carrito, con snapshot de precio y tiers.   |
-- | cart_history  | Guarda el historial de acciones y estados del carrito para undo/redo avanzado.         |
-- =============================

-- Tablas necesarias para carrito 100% funcional en Sellsi (2025)

-- 1. Tabla: carts
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) not null,
  status text not null default 'active', -- 'active', 'ordered', 'abandoned'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Tabla: cart_items
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) not null,
  product_id uuid references products(productid) not null,
  quantity integer not null check (quantity > 0),
  price_at_addition numeric, -- para snapshot de precio
  price_tiers jsonb,         -- guarda los tiers aplicados al momento de agregar
  added_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Tabla: cart_history (opcional, para historial/undo/redo avanzado)
create table cart_history (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) not null,
  action text not null,
  state jsonb not null,
  created_at timestamp with time zone default now()
);
