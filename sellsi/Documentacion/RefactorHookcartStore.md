# Refactorización avanzada del cartStore.js (Sellsi 2025)

## Objetivo

Separar la lógica de historial, wishlist, cupones y envío en módulos/hooks independientes para lograr un código mantenible, escalable y world class, manteniendo retrocompatibilidad y agregando soporte para price tiers.

---

## 1. Estado actual del store

- El store principal (`cartStore.js`) solo maneja los items del carrito y delega toda la lógica especializada a hooks independientes:
  - `useCartHistory.js` (historial y undo/redo)
  - `useWishlist.js` (wishlist)
  - `useCoupons.js` (cupones)
  - `useShipping.js` (envío)
- Todas las funciones y estados especializados se acceden mediante propiedades delegadas, manteniendo la API pública original.
- El store implementa persistencia automática en localStorage y está preparado para sincronización futura con backend.

---

## 2. Modularización aplicada

- Cada dominio (historial, wishlist, cupones, envío) tiene su propio hook Zustand, con estado y funciones independientes.
- El store principal importa y delega a estos módulos, exponiendo getters para retrocompatibilidad:

```js
get wishlist() { return wishlistStore.wishlist },
get appliedCoupons() { return couponsStore.appliedCoupons },
get couponInput() { return couponsStore.couponInput },
get selectedShipping() { return shippingStore.selectedShipping },
```

- Los componentes consumidores no requieren cambios: siguen usando el store principal.

---

## 3. Price tiers y cálculo dinámico

- Todos los productos y items del carrito ahora incluyen la estructura `price_tiers`.
- El cálculo de precios y subtotales es automático y reactivo usando las utilidades de `priceCalculation.js`.
- Los componentes `ProductCard` y `CartItem` muestran precios dinámicos según la cantidad y los tiers.

---

## 4. Retrocompatibilidad y QA

- Se corrigieron errores de retrocompatibilidad (por ejemplo, acceso a `wishlist.length` en BuyerCart).
- Se mantuvo la API pública del store para no romper componentes existentes.
- Se realizaron pruebas manuales de todos los flujos principales (agregar/quitar productos, wishlist, cupones, envío, undo/redo).
- Persistencia y sincronización local funcionando correctamente.

---

## 5. Estructura final

```
src/features/buyer/hooks/
  cartStore.js
  useCartHistory.js
  useWishlist.js
  useCoupons.js
  useShipping.js
```

---

## 6. Beneficios obtenidos

- Mantenibilidad y escalabilidad: cada módulo tiene responsabilidad única.
- Testabilidad: cada módulo puede testearse de forma independiente.
- Código limpio y preparado para crecimiento futuro.
- Integración lista para sincronización backend y mejoras avanzadas.

---

## 7. Pendientes y próximos pasos

- [ ] Escribir tests unitarios para cada módulo.
- [ ] Documentar con JSDoc cada hook y función pública.
- [ ] Integrar sincronización real con backend (tablas `carts` y `cart_items`).
- [ ] Mejorar la gestión de price snapshot y restauración de estado entre módulos.

---

**Refactorización completada y en producción.**

> Si se agregan nuevas funcionalidades al carrito, seguir este patrón de modularización y delegación.
