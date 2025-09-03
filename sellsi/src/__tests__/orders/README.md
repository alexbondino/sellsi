# Tests - orders (resumen)

Ubicación: `src/__tests__/orders`

Propósito
- Documentar la suite de tests unitarios y de integración ligera para la capa de Orders (Buyer / Supplier).
- Indicar qué casos S-*, B-*, X-* y O-* están implementados y cómo ejecutar/diagnosticar la suite.

Estado general (al 2025-09-02)
- Tests unitarios: estables y verdes localmente.
- Resumen rápido: 32 passed, 6 skipped (skips intencionales/placeholder), 0 failing.

Mapa de IDs (cobertura por objetivo)
- S-1..S-5: Supplier focused (filtros, optimistic updates, dispatch date, pdf upload, routing)
  - S-1: filtro "Atrasado" (unit)
  - S-2: optimistic accept + revert (unit)
  - S-3: dispatch date validation (unit)
  - S-4: PDF validation (helper + unit)
  - S-5: mono vs multi supplier routing (unit)

- B-1..B-4: Buyer focused
  - B-1: recentlyPaid highlight (unit)
  - B-2: chips cancelado vs rechazado (unit)
  - B-3: realtime invoice insert (unit mini-harness)
  - B-4: polling fallback (unit mini-harness)

- X-1..X-2: Cross-sync (buyer ↔ supplier)
  - X-1: ETA propagation buyer after supplier dispatch (unit integration) - implemented
  - X-2: Cancel propagation (supplier reflects buyer cancel) - implemented

- O-1..O-5: Ofertados (offers)
  - O-1: Chip "Ofertado" Buyer (implemented)
  - O-2: Separación de líneas same product_id (implemented, tested)
  - O-3: Precio ofertado fijo (implemented, tested)
  - O-4: Chip "Ofertado" Supplier (implemented)
  - O-5: Invoice grouping must preserve offered items (implemented, tested)

Archivos clave de tests añadidos / modificados
- `crossSync.ETA.propagation.test.js` (X-1)
- `crossSync.cancel.propagation.test.js` (X-2)
- `buyerOrders.offered.chip.test.js` (O-1 partial UI)
- `supplier.offered.chip.test.js` (O-4)
- `buyerOrders.offered.integrity.test.js` (O-2, O-3, O-5 integrity)
- `buyerOrders.offered.chip.test.js` (buyer small render test)
- `pdfValidation.test.js`, `dispatchDate.validation.test.js`, `ordersStore.updateOrderStatus.test.js`, etc. (existentes o extendidos)

Notas técnicas importantes
- Algunos tests mockean módulos que usan `import.meta` o `supabase` y por ello hay mocks (p. ej. `invoiceStorageService`, `ContactModal`) en tests específicos.
- Para tests que renderizan componentes que dependen de `react-router`, se usa `MemoryRouter` en los tests unitarios.
- Se extrajeron utilidades testables y se prefirió pruebas de lógica aislada para evitar fragilidad de mocks en factories.

Comandos útiles (PowerShell)
- Ejecutar toda la suite de unit tests (desde la carpeta `sellsi` donde está package.json):

```powershell
npx jest src/__tests__/orders/unit --runInBand
```

- Ejecutar un test concreto (por ejemplo X-1):

```powershell
npx jest src/__tests__/orders/unit/crossSync.ETA.propagation.test.js --runInBand
```

- Ejecutar tests que mencionan ofertas:

```powershell
npx jest src/__tests__/orders/unit/buyerOrders.offered* --runInBand
```

Estrategia de mocks y flakiness
- Usar `jest.useFakeTimers()` cuando se prueban timeouts / highlights.
- Evitar dependencias de `Date.now()` no controladas: `jest.setSystemTime(...)` en tests que lo requieran.
- Preferir tests de unidad sobre integración completa cuando la integración requiere demasiada orquestación de mocks.

Próximos pasos recomendados
- Revisar y convertir a tests de integración 1 ó 2 escenarios end-to-end (mock supabase + orderService) si se desea mayor cobertura de integración.
- Extraer pequeñas utilidades internas (por ejemplo parseYMD) a módulos testables si se planifica aumentar la verificación de fechas en dispatch.
- Eliminar cualquier `describe.skip` restante una vez se cubran los casos faltantes o se conviertan a tests activos.

Contacto / notas del autor de tests
- Tests creados como parte del roadmap de calidad de `orders` (Buyer/Supplier). Si algo falla en CI, copiar la salida y ejecutar el test problematico localmente con `--runInBand` para facilitar debugging.

---
Generado automáticamente por el asistente de desarrollo durante la sesión de pruebas.
