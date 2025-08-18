# Sistema de Notificaciones (Plan Detallado)

> Estado: Diseño inicial aprobado (solo documentación, ningún código todavía).

## 1. Resumen Ejecutivo
Implementar un sistema de notificaciones en tiempo (casi) real para Buyers y Suppliers que: 
- Muestre un badge en la campana de `TopBar.jsx` con el número de NO leídas (máx visual 99+).
- Genere eventos por cambios de pedidos (creación / aceptación / rechazo / despacho / entrega) y onboarding inicial.
- Permita ver un panel compacto (popover/modal) con tabs: "Todas" y "No Leídas" (paginado/scroll).
- Marque como leídas según reglas claras (ver sección 8).
- Limite almacenamiento a 100 notificaciones por usuario (rotación FIFO, preservando las más recientes y no duplicando eventos triviales).

## 2. Requerimientos Extraídos (Explícitos + Implícitos)
1. Notificación bienvenida si `AuthProvider > needsOnboarding = true` (una sola vez).
2. Eventos que disparan notificaciones:
	 - (Supplier) Alguien compra → notificación: "Nuevo pedido pendiente de revisión".
	 - (Buyer) Supplier acepta → "Tu pedido fue aceptado".
	 - (Buyer) Supplier rechaza → "Tu pedido fue rechazado" (con razón si existe).
	 - (Buyer) Pedido despachado → "Tu pedido fue despachado" (incluye fecha estimada si existe).
	 - (Buyer) Pedido entregado → "Tu pedido fue entregado".
3. UI estilo Facebook: campana con badge; panel emergente con lista; diferenciación visual de no leídas.
4. Tabs: Todas / No Leídas (mostrar contador de no leídas en tab).
5. Máx visual inicial 10 notificaciones por vista (scroll para más; diseño adaptativo). Al hacer clic en "Ver todas" → vista expandida (popover scrollable mayor o modal).
6. Número en badge = count de no leídas (cap 99+).
7. Rotación: nunca >100 por usuario; al insertar la 101 se elimina la más antigua (preferible las más antiguas LEÍDAS primero).
8. Marca como LEÍDAS cuando:
	 - Usuario abre TAB "No Leídas" (todas las mostradas se marcan, lazy mark o en lote).
	 - Usuario navega a `MyOrdersPage.jsx` → solo notificaciones cuyo `context_section = 'supplier_orders'`.
	 - Usuario navega a `BuyerOrders.jsx` → solo notificaciones cuyo `context_section = 'buyer_orders'`.
9. Cada notificación clickeable: redirige a página contextual (supplier_orders o buyer_orders) y se marca como leída inmediatamente (optimistic update).
10. Timestamp humano: "hace 2 min", "hace 3 h", "ayer", "hace 2 semanas", "hace 3 meses", "hace 2 años" (fallback a fecha formateada local). Actualización en vivo (intervalo 60s) mientras panel abierto.
11. Modular y alineado a arquitectura existente (`domains`, `shared`, `services`, `hooks`).
12. Compatible con SSR / lazy boundaries (evitar romper splitting actual del TopBar).
13. Real-time preferible (Supabase Realtime) pero tolerante a fallback polling.

## 3. Casos de Uso / Disparadores
| Caso | Actor origen | Tabla origen | Evento | Destinatario | Texto Base |
|------|--------------|--------------|--------|--------------|-----------|
| Onboarding | Backend/Auth state | (estado en provider) | needsOnboarding=true | Usuario logueado | "Bienvenido a Sellsi" |
| Nuevo Pedido | Buyer crea order | `orders` / flujo actual | order creada | Supplier (owner de cada item) | "Nuevo pedido pendiente" |
| Nuevo Pedido (por item) | Buyer crea order multi-supplier | composición de items | item asociado creado | Buyer | "Se registró tu compra del producto X" |
| Aceptado (por item) | Supplier acepta | status change item | `accepted` | Buyer | "El proveedor aceptó el producto X" |
| Rechazado (por item) | Supplier rechaza | status change item | `rejected` | Buyer | "El proveedor rechazó el producto X" + razón |
| Despachado (por item) | Supplier despacha | status change item | `in_transit` | Buyer | "Producto X fue despachado" + ETA |
| Entregado (por item) | Supplier confirma | status change item | `delivered` | Buyer | "Producto X fue entregado" |

Notas:
- Una order multi-supplier genera notificaciones POR ITEM para el comprador (decisión confirmada) y una por order para cada supplier involucrado.
- Minimizar spam: no repetir notificación idéntica para el mismo `(user_id, order_id, product_id, order_status)` dentro de ventana corta (2 min) — se puede reforzar luego con índice parcial único + bucket temporal si hiciera falta.

## 4. Modelo de Datos (Propuesta Tabla `notifications` en Supabase)
```sql
create table public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(user_id) on delete cascade,
	type text not null, -- 'welcome' | 'order_new' | 'order_status'
	order_id uuid null references public.orders(id) on delete cascade,
	order_status text null, -- 'pending'|'accepted'|'rejected'|'in_transit'|'delivered'
	role_context text not null, -- 'buyer' | 'supplier'
	context_section text not null, -- 'buyer_orders' | 'supplier_orders' | 'generic'
	title text not null,
	body text null,
	metadata jsonb default '{}'::jsonb,
	is_read boolean default false,
	created_at timestamptz default now(),
	read_at timestamptz null
);

-- Indexes
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id) where is_read = false;
```
Rotación: job lado servidor (edge function o trigger) o lógica en inserción (ver sección 11).

### Tipos / Semántica
- `type`: categoriza origen macro.
- `order_status`: estado puntual si corresponde.
- `metadata`: puede contener `{ "estimated_delivery": "2025-08-20", "rejection_reason": "Stock agotado" }`.
- `role_context` ayuda a aislar notifs para multi-rol futuro.

## 5. Flujo de Creación y Consumo
1. Servicio/trigger crea notificación (Edge Function o lógica en backend existente cuando se llama `updateOrderStatus`).
2. Notificación insertada en `notifications`.
3. Suscripción Realtime en frontend escucha canal filtrado por `user_id`.
4. Store actualiza lista local y badge no leídas.
5. Al exceder 100 → backend elimina más antiguas (preferentemente leídas) antes de confirmar inserción.

## 6. Arquitectura Front-End Propuesta
```
src/
	domains/
		notifications/
			components/
				NotificationBell.jsx          # Icono + badge + manejo de apertura
				NotificationListPanel.jsx     # Popover / Modal con tabs y scroll
				NotificationItem.jsx          # Cada item (read/unread state visuals)
			hooks/
				useNotifications.js           # Hook principal (consume store + humanize)
			store/
				notificationsStore.js         # Zustand (lista, paginación, acciones)
			services/
				notificationService.js        # CRUD, markRead, bulkMarkRead, fetch page
			utils/
				timeAgo.js                    # Humanizador timestamps
			index.js                        # Barrel export
	shared/
		providers/
			NotificationProvider.jsx        # Inicializa suscripción y bootstrapping
```

### Provider
- Montado alto (junto a AuthProvider / RoleProvider) para disponibilidad global.
- Lee `session.user.id` y bootstrap: `fetchInitial({ limit: 20 })`.
- Establece canal realtime: `.on('postgres_changes', { table: 'notifications', filter: 'user_id=eq.<id>' })`.
- Maneja reconexión exponencial en caso de desconexión.

### Store (Zustand)
Estado:
```ts
notifications: Notification[] // ordenadas desc por created_at
unreadCount: number
hasMore: boolean
isLoading: boolean
activeTab: 'all' | 'unread'
pendingMarkReadIds: Set<string>
```
Acciones:
- `bootstrap(list)`
- `add(notification)` (inserta si no duplicada según clave)
- `markAsRead(id|ids, optimistic=true)`
- `bulkMarkContext(context_section)`
- `loadMore()` (paginado: offset/`created_at < last`)
- `setActiveTab(tab)` (si tab === 'unread' ⇒ trigger mark all after slight delay 300ms)

## 7. Integraciones con Páginas Existentes
### `TopBar.jsx`
- Reemplazar botón actual por `<NotificationBell />`.
- Bell obtiene `unreadCount` del store.
- Al abrir popover → no marca automáticamente; sólo al cambiar a tab 'No Leídas'.

### `MyOrdersPage.jsx`
- `useEffect` on mount: `notificationsStore.bulkMarkContext('supplier_orders')`.

### `BuyerOrders.jsx`
- `useEffect` on mount: `notificationsStore.bulkMarkContext('buyer_orders')`.

### `OrderService.updateOrderStatus`
- Después de éxito, según transición generar notificación dirigida al BUYER.

### Creación Pedido
- Donde actualmente se crea la order (flujo de checkout) → iterar suppliers involucrados y crear notificación tipo `order_new` para cada uno (context_section `supplier_orders`).

## 8. Reglas de Marcado como Leídas
1. Al abrir tab "No Leídas":
	 - Obtener hasta N (p.ej. 50) ids no leídas visibles y enviar `mark_read(ids)` en lote.
	 - Optimistic update inmediato.
2. Navegación a páginas específicas: bulk mark por `context_section` (consulta select ids is_read=false where context_section=...).
3. Click individual: mark esa notificación (optimistic) y navegar.
4. Evitar sobrescritura de estado si llega realtime duplicado (ver dedupe).

## 9. UI / UX Detalles
Popover vs Modal:
- Modo compacto: Popover anclado a campana (máx altura ~460px, scroll y virtualized si >20). Botón inferior "Ver todas".
- "Ver todas" abre Modal (full central, height 70vh) reutilizando componente list.

List Item Visual:
- Fondo distinto (#eef6ff) si `!is_read`.
- Puntos azules indicador (como Facebook) opcional.
- Texto: `title` en bold, `body` en normal, timestamp humanizado a la derecha.

Paginado / Carga:
- Estrategia: Lazy scroll (al final → loadMore) + límite hard 100 ya controlado backend.

Accesibilidad:
- Rol `button` para items, `aria-label` con acción.
- Badge con `aria-live="polite"`.

## 10. Timestamps Humanizados
Utilidad `timeAgo(date, now=Date.now())`:
Reglas sugeridas:
```
<60s => "hace X s"
<60m => "hace X min"
<24h => "hace X h"
ayer => "ayer" (si dentro de 48h y cruzó medianoche)
<7d => "hace X d"
<30d => "hace X sem" (X = floor(days/7))
<365d => "hace X mes" / "hace X meses" (floor(days/30))
>=365d => "hace X año(s)"
```
Recomputar cada 60s mediante `setInterval` sólo mientras popover/modal abierto.

## 11. Retención y Rotación (<=100)
Elegida: Opción A (Trigger DB) ✅
```sql
create or replace function trim_notifications() returns trigger as $$
begin
	-- elimina leídas más antiguas si >100, si aún >100 elimina no leídas antiguas (edge case improbable)
	delete from public.notifications n
	using (
		select id from public.notifications
		where user_id = new.user_id
		order by is_read asc, created_at asc -- primero leídas
		offset 100
	) old
	where n.id = old.id;
	return new;
end; $$ language plpgsql;

create trigger trim_notifications_trigger
after insert on public.notifications
for each row execute function trim_notifications();
```
Opción B (Edge Function en inserción) – más control + logging. Preferir A por simplicidad.

## 12. Seguridad y Performance
- RLS: `user_id = auth.uid()` para SELECT/UPDATE y sólo insert permitido por edge functions / backend seguro (evitar que usuario se autogenere notifs falsas).
- Upsert controlado: rechazo de insert directo desde cliente salvo tipo `welcome` quizá.
- Minimizar payload: formato ligero (sin arrays grandes). `metadata` compacta.
- Realtime canal específico a la tabla; limitar columnas si Supabase permite (o filtrar cliente).

## 13. Estrategia de Implementación Incremental (Fases)
1. DB + RLS + Trigger rotación.
2. Servicio backend de creación (extender `orderService` + util `notificationService.create` client-side provisional / edge function final).
3. Store + Provider + util `timeAgo` (sin UI todavía). Test unitario de `timeAgo` y store transitions.
4. Integrar campana en `TopBar.jsx` (mostrar contador dinámico con datos simulados / reales fetch inicial).
5. Popover básico (lista All, sin tabs aún) + realtime.
6. Tabs + marca leídas (individual + tab).
7. Bulk mark en navegación a páginas (hooks en `BuyerOrders` / `MyOrdersPage`).
8. Modal "Ver todas" + scroll / loadMore.
9. Onboarding notification.
10. Refinamientos (virtualization, tests, a11y, edge cases, dedupe hashing).

## 14. Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Duplicados por race (status update + manual reintento) | Badge inflado | Clave dedupe en inserción + unique index opcional (user_id, order_id, type, order_status) parcial |
| Pérdida de notifs si Realtime cae | Usuario cree que no hay cambios | Poll cada 90s si última actualización >120s |
| Límite 100 borra no leídas recientes (edge case) | Mala UX | Orden de borrado prioriza leídas primero |
| Latencia al marcar lote | UI inconsistente | Optimistic update + cola de sync retry |
| Onboarding duplicado | Mensaje repetido | Marca flag `welcome_shown` en localStorage o tabla perfil |

## 15. Checklist Final de Diseño
- [x] Tipos y disparadores definidos
- [x] Modelo tabla propuesto
- [x] Reglas de lectura / marcación
- [x] Estrategia UI (popover + modal) 
- [x] Rotación <=100
- [x] Timestamp humanizado
- [x] Integración con páginas existentes
- [x] Fases de implementación
- [x] Mitigación de duplicados y fallos realtime

## 16. Preguntas Abiertas / Confirmación (si se requieren antes de codificar)
1. ¿Notificación de despacho / entrega se crea una por supplier o consolidada (en órdenes multi-supplier)? (Asumido: una por order global.)
2. ¿Se debe permitir borrar notificaciones manualmente? (No requerido ahora.)
3. ¿Onboarding sólo primera sesión o siempre que `needsOnboarding=true`? (Asumido: una sola, luego set flag false vía backend.)
4. ¿Traducir dinámicamente mensajes o hardcoded español permanente? (Asumido: español fijo.)

Si las suposiciones están correctas procederemos a fase 1.

---
Fin del documento de diseño.
