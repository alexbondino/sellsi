# 🛒 Carrito de Compras (Cart) - Estado actual y backend

## 1. Estado actual
- El store principal (`cartStore.js`) está modularizado y preparado para integración real con backend (Supabase).
- Soporta sincronización con backend para usuarios autenticados: agregar, quitar, actualizar cantidad y limpiar carrito.
- Persistencia automática en localStorage para usuarios no autenticados.
- Modularización avanzada: historial, wishlist, cupones y envío delegados a hooks independientes.
- Price tiers, cupones, historial, wishlist y selección de envío por producto ya integrados a nivel de frontend.

## 2. Funciones implementadas
- `addItem`, `removeItem`, `updateQuantity`, `clearCart`: Todas soportan integración con backend (vía `cartService`).
- `checkout`: Implementado para enviar el carrito al backend y crear una orden real (si el endpoint existe).
- `syncToBackend`, `initializeCartWithUser`: Migran el carrito local al backend y mantienen sincronización.
- Delegación de historial, wishlist, cupones y envío a hooks especializados.
- Métodos de utilidad: `isInCart`, `isInWishlist`, `getItemCount`, `getStats`, etc.

## 3. Alcances
- Soporta price tiers, cupones, historial, wishlist y selección de envío por producto.
- Retrocompatibilidad total: los componentes consumidores no requieren cambios para la integración backend.
- El backend esperado es Supabase, usando endpoints definidos en `cartService`.
- Preparado para migración de carrito local a backend al autenticar usuario.

## 4. Limitaciones
- Si el usuario no está autenticado, todo funciona solo en localStorage.
- La lógica de compra (checkout) depende de la existencia del endpoint en el backend. Si no existe, se simula o lanza error.
- No hay tests unitarios ni integración CI/CD aún.
- Falta integración de edge cases avanzados (conflictos, errores de red, etc).
- Sincronización de historial, wishlist, cupones y envío con backend aún pendiente (actualmente solo local).

## 5. Pendientes
- Endpoint real de checkout: si no existe, la orden no se crea realmente en backend.
- Sincronización de historial, wishlist, cupones y envío con backend.
- Mejorar manejo de errores y feedback al usuario en caso de fallos de red/backend.
- Escribir tests unitarios y mocks para lógica de carrito.
- Documentar endpoints y flujos de negocio para onboarding de nuevos devs.

## 6. Ejemplo de flujo actual
1. Usuario agrega producto al carrito (local o backend según autenticación).
2. Puede aplicar cupones, cambiar cantidades, seleccionar envío, usar wishlist.
3. Al hacer checkout:
   - Si hay endpoint, se crea la orden en backend y se limpia el carrito.
   - Si no, se muestra error o se simula la compra.
4. El historial de acciones y wishlist solo se sincronizan localmente (por ahora).

## 7. Endpoints esperados (cartService)
- `getOrCreateActiveCart(userId)`
- `addItemToCart(cartId, product, quantity)`
- `updateItemQuantity(cartId, productId, quantity)`
- `removeItemFromCart(cartId, productId)`
- `clearCart(cartId)`
- `checkout(cartId, checkoutData)`

## 8. Notas técnicas
- El store está preparado para migración futura a SSR/Next.js.
- Modularización permite testeo y mantenimiento independiente de cada feature.
- El código está listo para integración avanzada (cache invalidation, optimistic updates, etc).

---

> Última actualización: 18/06/2025
