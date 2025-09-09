## Refactor offerStore.js (Fase 1 + Fase 2 parcial)

Estado: Fase 1 completada (constantes + normalizadores). Fase 2 parcial aplicada (consolidación de loaders buyer/supplier en helper interno genérico). Sin cambios en la API pública ni incorporación de nuevas features.

### 1. Radiografía del estado inicial

El archivo `src/stores/offerStore.js` concentraba demasiadas responsabilidades:
1. Lógica de dominio (creación, aceptación, rechazo, cancelación, reserva de ofertas).
2. Normalización y mapping de estados con reglas temporales (pending -> expired, accepted -> approved, purchased -> reserved).
3. Capa de acceso a datos con estrategias de fallback (RPC -> vista materializada `offers_with_details`).
4. Infra de cache ligera + SWR opcional + deduplicación de llamadas in‑flight (buyer y supplier duplicaban código casi 1:1).
5. Micro‑cache adicional de validación de límites (validateOfferLimits) embebida ad hoc.
6. Gestión de efectos secundarios (notificaciones + limpieza de carrito) mezclada en acciones principales.
7. Código específico de entorno de test (overrides de `supabase.rpc`, inspección de resultados mock, log acumulativo) mezclado con paths críticos de producción.
8. Suscripciones realtime y su lifecycle (alta/baja) sin aislación.
9. Conversión / saneado de input (sanitize scripts, variantes legacy de claves) dentro de la misma acción.

Consecuencias:
- Complejidad cognitiva alta: difícil razonar sobre invariantes de estados.
- Duplication (DRY violado) entre buyer y supplier en: caching, SWR, fallback RPC, normalización.
- Potenciales errores silenciosos: múltiples bloques try/catch vacíos que pueden ocultar fallos reales.
- Riesgo de memory leaks: `_subscriptions` no se limpia automáticamente en unhook de componentes.
- Dificultad para test unitario granular: no hay funciones puras reutilizables (todo embedded en la store factory).
- Difícil instrumentar métricas (tiempos, cache hit ratio) al estar todo mezclado.

### 2. Invariantes y reglas de negocio identificadas
| Regla | Descripción |
|-------|-------------|
| Expiración pending | Si `pending` y `expires_at` < ahora -> `expired`. |
| accepted -> approved | Para UI legacy (naming histórico). |
| purchased -> reserved | Renombre histórico para estado agregado al carrito. |
| InvalidCartStates | expired, rejected, cancelled, paid -> disparan pruning de carrito. |
| Reintentos loadBuyerOffers | Hasta 3 salvo `Database error` o `Network error` (abortan temprano). |
| SWR opcional | Sirve datos stale y revalida en background sólo si env flags. |
| Limits micro‑cache | TTL 3s para evitar tormenta de validaciones en StrictMode / aperturas rápidas. |

### 3. Objetivos de refactor
1. Separar responsabilidades (SoC) sin romper API pública (hook `useOfferStore`).
2. Reducir duplicación (normalizadores, mappings, invalid states).
3. Hacer explícitos los invariantes con funciones puras testeables.
4. Preparar base para futura extracción de una capa de datos (`OfferRepository`).
5. Minimizar riesgo inmediato (Fase 1 = extracción no disruptiva).
6. Mantener compatibilidad con imports existentes (`import { useOfferStore } from '.../offerStore'`).
7. Facilitar instrumentación futura (stats de cache, métricas de latencia).

### 4. Estrategia (enfocada únicamente en este refactor)
Fase 1 (ya aplicada):
- Extracción de constantes y normalizadores (`offers/constants.js`, `offers/normalizers.js`).
- Eliminación de lógica duplicada de mapping de estados y normalización.

Fase 2 parcial (ya aplicada):
- Introducción de helper interno `_genericLoadOffers` para unificar `loadBuyerOffers` y `loadSupplierOffers` (cache, SWR, dedupe, fallback RPC -> SELECT).
- El comportamiento previo se mantiene: buyer reintenta hasta 3 veces; supplier hace un intento.
- No se modificaron nombres de acciones ni shape de estado expuesto.

Posible Fase 2 restante (opcional, no realizada todavía):
- Extraer `_genericLoadOffers` a archivo dedicado (`offers/loader.js`) sólo si se requiera reutilización fuera del store.
- Añadir pequeñas métricas internas (hit/miss) sin cambiar firma pública.

Futuras fases más allá de este refactor NO se documentan aquí para evitar alcance no solicitado. Se podrán definir si se aprueba un refactor adicional.

### 5. Cambios aplicados (detalle)
Fase 1:
1. `offers/constants.js`: centralización de `OFFER_STATES`, aliases y estados inválidos para carrito.
2. `offers/normalizers.js`: funciones puras para normalización buyer/supplier.
3. `offerStore.js`: reemplazo de lógica inline por imports y uso de `INVALID_FOR_CART`.

Fase 2 parcial:
4. `_genericLoadOffers` interno: unifica cache, SWR, dedupe y fallback; reduce código duplicado en ~250 líneas combinadas.
5. `loadBuyerOffers` y `loadSupplierOffers` ahora son thin wrappers. Sin impacto en llamadas existentes.
6. Mantención de diferencias originales (reintentos buyer vs supplier) dentro del helper (bandera `kind`).

### 6. Beneficios inmediatos
- Reducción de líneas en el store (normalización + loaders duplicados eliminados).
- Punto único para reglas de estado y expiración.
- Carga de buyer/supplier ahora consistente y más fácil de testear de forma aislada.

### 7. Riesgos residuales
- Mutación directa de `supabase.rpc` en entorno test (se mantiene por compatibilidad; podría aislarse después).
- Bloques `try/catch` silenciosos siguen presentes (no alterados para evitar side effects ahora).
- Falta de tipado fuerte (pendiente sólo si se aprueba migración TS o JSDoc ampliado).

### 8. Plan de validación manual rápido
1. Crear oferta -> debe aparecer en `supplierOffers` con status `pending` y expiración calculada.
2. Aceptar oferta -> status `approved`, `purchase_deadline` sincroniza `expires_at`.
3. Rechazar oferta con razón -> status `rejected` y `rejection_reason` set.
4. Simular expiración forzando `expires_at` pasado -> normalizador convierte a `expired`.
5. Cargar ofertas buyer/supplier con cache TTL=0 -> carga siempre network.
6. Activar `OFFERS_CACHE_TTL` y repetir -> segunda llamada inmediata debe ser cache hit.
7. Agregar oferta `reserved` y ejecutar `forceCleanCartOffers` con un item referencing offer -> item se elimina.

### 9. (Opcional) Métricas mínimas futuras
- Hits/miss cache.
- Uso de fallback RPC->SELECT.
- Reintentos buyer.

### 10. Próximos pasos (si se aprueban)
1. Extraer `_genericLoadOffers` a módulo dedicado sólo si se necesita reuse externo.
2. Añadir JSDoc de tipos principales (Offer, ProductSnapshot) para reducir errores futuros.
3. Revisar bloques `catch` silenciosos e introducir logger consistente.

Documento actualizado tras aplicar Fase 1 + Fase 2 parcial.
