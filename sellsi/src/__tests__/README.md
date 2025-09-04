# Test Suite Overview

Fecha: 2025-09-02
Estado actual: Todas las suites unit + integración de ofertas pasan (offerFlowIntegration.test.js 10/10). E2E pendiente / opcional.

## Estructura
```
__tests__/
  setup.js                # Configuración global (jest-dom, polyfills, mocks básicos)
  README.md               # (este archivo)
  unit/
    basic.test.js
    buyerOffersComponents.test.js
    edgeCases.test.js
    notificationService.test.js
    offerHooks.test.js
    offerStore.test.js
  integration/
    offerFlowIntegration.test.js
  e2e/
    offerSystemE2E.spec.js (Playwright, no cubierto en CI por defecto)
  mocks/
    supabaseMock.js       # jest.fn() rpc + datos utilitarios
```

## Tipos de tests
- Unit: Validan funciones aisladas (store, hooks, notificationService, componentes modestos).
- Integration: Escenarios compuestos centrados en flujo de ofertas (crear, aceptar, rechazar, límites, cancelación, carrito, errores, expiración, tiempo restante).
- E2E (Playwright): Flujo UI real — aún no documentado aquí; usar cuando backend/staging accesible.

## Cobertura de offerFlowIntegration.test.js
Escenarios cubiertos (todos verdes):
1. Flujo completo crear ➜ notificación (mock) ➜ aceptar (RPC: count_monthly_offers, create_offer, create_notification, get_supplier_offers, accept_offer, create_notification).
2. Rechazo de oferta (harness con `SupplierOffersList` + assert a `reject_offer`).
3. Límite excedido (count_monthly_offers devuelve 3 de 3, se muestra bloque de límites).
4. Contador de ofertas (count = 2 de 3, bloque visible).
5. Cancelar oferta pendiente (buyer: `cancel_offer`).
6. Agregar oferta aprobada al carrito (estructura y botón clickeable).
7. Error de red al crear (create_offer con error).
8. Error al cargar ofertas (get_buyer_offers error simulado).
9. Oferta expirada (status derivado a `expired`).
10. Tiempo restante de oferta futura (regex horas/minutos).

Notas clave:
- Se desactivó autofetch automático del store para evitar consumo anticipado del mock RPC.
- Se normalizan estados: `accepted` → `approved`; `pending` + expirada → `expired`.
- El test de rechazo originalmente se simplificó (cancelación) y luego se reforzó para usar `reject_offer` real.
- Los matchers de texto se hicieron más robustos: uso de `aria-label` para botones de acciones (`Aceptar Oferta`, `Rechazar Oferta`, `Cancelar Oferta`, `Agregar al carrito`).

## mocks/supabaseMock.js
- `mockSupabase.rpc`: jest.fn secuencial; los tests integran `queueRpc` o `mockResolvedValueOnce` directamente.
- Datos de ejemplo: usuario válido, oferta válida, producto, etc.
- Importante: Al inicio de cada test se re-asigna `supabase.rpc` al mock para restaurar estado.

## Estrategia de estabilidad
- Inserción optimista en `createOffer` para que listas proveedor/ comprador vean la nueva oferta sin depender de un fetch posterior.
- Logging acumulado (`window.__OFFER_LOGS`) para debug post-mortem; se vuelca al final de la suite si existe.
- Aserciones relajadas en textos largos / dinámicos (solo presencia estructural cuando el texto puede fragmentarse por MUI).

## Notificaciones
- `notificationService` mockeado en integración para no consumir RPC adicional salvo la llamada explícita a `create_notification` ya esperada en la secuencia.
- Guardas añadidas en el store alrededor de `notificationService.notifyOfferResponse` para evitar `TypeError` si el mock cambia.

## React Dev Warning ("Expected static flag was missing")
- Warning interno de React 19 (dev) asociado a StrictMode + doble render + efectos que manipulan `document.body` (modales MUI personalizadas). No impacta comportamiento final. Se puede silenciar añadiendo filtro extra en `setup.js` si se desea.

## Cómo ejecutar
### Unit
```
npm test -- --testPathPatterns=unit
```
### Integración
```
npm test -- src/__tests__/integration/offerFlowIntegration.test.js
```
### E2E (Playwright)
```
npm run test:e2e
```
### Todo el pipeline principal
```
npm run test:unit && npm run test:integration
```
(Agregar build + e2e según necesidad.)

## Añadir nuevos tests de ofertas
Checklist rápido:
1. Preparar secuencia `mockSupabase.rpc.mockResolvedValueOnce({...})` en el orden exacto esperado.
2. Renderizar componente envuelto en providers (`BrowserRouter`, `ThemeProvider`).
3. Evitar buscar textos ambiguos de producto; usar `aria-label` en acciones.
4. Si el flujo modifica estado (aceptar / rechazar), mockear la RPC *antes* del click.
5. Para expiración: manipular `expires_at` pasado o futuro; el store recalcula status.

## Posibles mejoras futuras
- Añadir assertions de idempotencia en efectos de modales (para eliminar warning React sin filter).
- Snapshot selectivo de estructuras de ofertas normalizadas (evitar flakiness textual).
- Tests de degradación de límites (cuando count_monthly_offers lanza error).

## Resumen rápido
Los flujos críticos de ofertas están cubiertos con 10 pruebas de integración verdes y respaldo unitario del store y los servicios de notificación. La arquitectura de mocks y la inserción optimista reducen flakiness y hacen las pruebas deterministas.
