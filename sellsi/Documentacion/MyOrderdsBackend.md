# Backend para "Mis Órdenes" (Proveedores)

Actualmente, el frontend de "Mis Órdenes" funciona con datos mock. Para conectar con un backend real, se requiere la siguiente estructura y endpoints:

---

## 📦 Estado actual de la base de datos

- **Tablas existentes:**
  - Existen tablas para productos (`products`), imágenes de producto, solicitudes (`requests`), ventas (`sales`), y usuarios (`users`).
  - La tabla `products` usa `productid` como PK y referencia a proveedores con `supplier_id`.
  - **No existe ninguna tabla de negocio para pedidos/órdenes ni para ítems de pedido.**
  - La tabla `requests` es solo para solicitudes de productos, no para pedidos completos (no tiene estado, dirección, fechas, etc.).

---

## 🏗️ Tablas necesarias para "Mis Órdenes"

**Obligatorias:**
- `orders` (con campos como: order_id, supplier_id, user_id, status, total_amount, delivery_address, fechas, etc.)
- `order_items` (con campos como: order_item_id, order_id, productid, product_name, quantity, unit_price, etc.)

**Opcionales:**
- `order_status_history` (historial de cambios de estado)
- `order_documents` (archivos adjuntos a un pedido)

---

## 🗄️ Ejemplo de código SQL para Supabase

A continuación se muestra cómo crear cada tabla necesaria en Supabase/PostgreSQL, usando los nombres y relaciones reales de tu sistema:

```sql
-- Tabla principal de pedidos
create table orders (
  order_id uuid primary key default gen_random_uuid(),
  supplier_id uuid references users(user_id),
  user_id uuid references users(user_id),
  status text not null,
  total_amount numeric(12,2) not null,
  delivery_address text,
  requested_date_start date,
  requested_date_end date,
  estimated_delivery_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ítems de cada pedido
create table order_items (
  order_item_id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(order_id) on delete cascade,
  productid uuid references products(productid),
  product_name text,
  quantity integer not null,
  unit_price numeric(12,2) not null
);

-- (Opcional) Historial de cambios de estado
create table order_status_history (
  history_id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(order_id) on delete cascade,
  old_status text,
  new_status text,
  changed_at timestamp with time zone default now(),
  changed_by uuid references users(user_id)
);

-- (Opcional) Documentos adjuntos a un pedido
create table order_documents (
  document_id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(order_id) on delete cascade,
  file_url text not null,
  uploaded_at timestamp with time zone default now(),
  uploaded_by uuid references users(user_id)
);
```

**Notas:**
- Se usan claves foráneas a `users` para `supplier_id` y `user_id`.
- Se utiliza la tabla `products` ya existente y su PK real `productid` para la relación con ítems de pedido.
- Los campos y tipos pueden ajustarse según necesidades específicas del negocio.
- Las tablas opcionales mejoran la trazabilidad y gestión documental.