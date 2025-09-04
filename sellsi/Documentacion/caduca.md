# Caducidad de Ofertas y Ventana de 24h hasta Pago (Propuesta de Corrección)

> Objetivo estratégico: Unificar la semántica de la ventana de **24 horas** para que signifique inequívocamente: "la oferta aceptada debe transformarse en una **orden pagada (orders.payment_status = 'paid')** dentro de ese plazo". Actualmente sólo se exige "agregar al carrito" (estado `purchased` en tabla `offers`), generando inconsistencias métricas y de negocio.

---
## 1. Estado Actual (Radiografía)

### 1.1 Tablas / Campos relevantes (extractos de `querynew.sql`)
- `offers`:
  - `status`: `pending | accepted | rejected | expired | purchased`
  - `expires_at` (48h iniciales para pending)
  - `accepted_at`
  - `purchase_deadline` (se completa al aceptar: 24h) – pero UI principal de comprador NO la usa directamente.
  - `purchased_at` (se setea al agregar al carrito, no necesariamente pagado)
- `orders`:
  - `payment_status`: `pending | paid | ...`
  - `khipu_*` campos de integración
  - `inventory_processed_at` idempotencia post-webhook
  - No relación directa persistida hacia la oferta (falta un `offer_id` o `offers[]` en items snapshot).

### 1.2 Flujos relevantes
1. Creación oferta: RPC `create_offer` asigna `expires_at = now() + 48h`.
2. Aceptación proveedor: RPC `accept_offer` / `accept_offer_simple` => calcula y retorna `purchase_deadline = accepted_at + 24h`, reserva stock (`stock_reserved=true`) pero **no** normaliza siempre `expires_at` a esas 24h.
3. Buyer UI (`OffersList.jsx`):
   - Usa `expires_at` para countdown en `pending` (<48h) y para `approved` (<24h) pero si backend no recalculó `expires_at` tras aceptación, muestra texto genérico "Menos de 24 horas".
   - Ignora `purchase_deadline` aunque es el campo semánticamente correcto para la ventana posterior a la aceptación.
4. Agregar al carrito (modal) dispara `mark_offer_as_purchased` → cambia `offers.status` a `purchased` (nomenclatura ambigua: significa “reservada en carrito”, no “pagada”).
5. Pago real: se crea / actualiza `orders` vía Edge Function `create-payment-khipu`; confirmación de pago llega por `process-khipu-webhook` que marca `orders.payment_status='paid'`.
6. No existe validación que impida pagar luego de expirar `purchase_deadline` si el front inicia flujo pago tardío (webhook aceptará y marcará paid igualmente).

### 1.3 Problemas detectados
| Categoría | Problema | Impacto |
|-----------|----------|---------|
| Semántica | `purchased` en `offers` ≠ pago real | Métricas de conversión infladas, análisis erróneo.
| Fuente de verdad | UI buyer usa `expires_at` en lugar de `purchase_deadline` | Countdown inconsistente si backend no alinea `expires_at`.
| Integridad temporal | No se bloquea pago post-deadline | Riesgo de compradores beneficiándose de precios fuera de ventana de compromiso.
| Reserva stock | Stock reservado al aceptar, pero si nunca se paga tras 24h la liberación depende de procesos externos (no evidente en código) | Stock “fantasma” retenido.
| Auditoría | No hay vínculo explícito orden ↔ oferta (foreign key / pivot) | Trazabilidad incompleta (qué orden consumió qué oferta y cuándo dentro de la ventana).
| Reprocesos | Webhook no valida compra dentro de ventana | Difícil disputar pagos tardíos / potencial abuso.

### 1.4 (Ampliado) Hallazgos Específicos en Migraciones SQL
Análisis línea a línea de las migraciones `20250902000000_offers_system.sql` y `20250903110000_offers_write_support.sql`:

1. Enum implícito en `offers.status` restringe a: `pending, accepted, rejected, expired, purchased` (no contempla estados de transición como `reserved` ni `paid`). Esto fuerza sobrecargar `purchased` para significar “acción previa al pago” en frontend.
2. `expires_at` y `purchase_deadline` coexisten pero: 
   - Índice parcial `idx_offers_expires_at` filtra sólo `status='pending'`.
   - Índice `idx_offers_purchase_deadline` filtra sólo `status='accepted'`.
   - Cuando se cambia a `purchased`, se deja de aprovechar ambos índices para barridos de expiración → la función `expire_offers_automatically` no cubre ofertas en estado `purchased` (porque sólo mira `accepted`). Si el front marca “purchased” antes del pago real, se pierde caducidad automática.
3. `accept_offer_simple` NO sincroniza `expires_at` con `purchase_deadline` (mantiene `expires_at` con la ventana original de 48h). Esto explica por qué la UI buyer necesita heurística ("Menos de 24 horas") al no tener countdown consistente.
4. Reserva de stock: `accept_offer_simple` decrementa inventario inmediatamente (transferencia firme) y pone `stock_reserved=true`. Riesgo: si nunca se paga y la oferta expira, la función `expire_offers_automatically` repone stock SOLO si el estado quedó en `accepted`; si se marcó `purchased` antes de expirar, el bucle que repone stock no la incluye.
5. `mark_offer_as_purchased` cambia estado a `purchased` sin: 
   - Revalidar stock (asume que sigue reservado).
   - Verificar integridad de orden (el `order_id` es opcional y no se persiste en tabla; solo se devuelve en respuesta JSON).
   - Mover la ventana: no hay índice para limpiar `purchased` caducadas; la cron no actúa sobre ellas.
6. `expire_offers_automatically` cuenta `expired_accepted_count` con un patrón FOR LOOP + `ROW_COUNT` posterior. Dado que el `ROW_COUNT` se aplica al último UPDATE dentro del loop, la métrica `expired_accepted_count` no representa el número de ofertas aceptadas procesadas sino el número de filas modificadas por el ÚLTIMO UPDATE (potencialmente 1 siempre). Métrica engañosa.
7. No existe función para revertir oferta de `purchased` → `expired` al exceder `purchase_deadline`. Esto deja hueco funcional si se adopta `purchased` antes de facturar.
8. La migración de soporte (`offers_write_support`): 
   - Redefine `create_offer` para parámetros legacy pero no altera la semántica de expiración (sigue 48h).
   - Introduce alias `accept_offer` que delega a `accept_offer_simple` sin envolver lógica adicional (por lo tanto misma carencia de sincronización `expires_at` / `purchase_deadline`).
9. Falta índice para búsquedas combinadas (buyer_id, purchase_deadline) o (status IN (...) AND purchase_deadline < now()) que soporte gráficos de alerta en tiempo real.
10. Falta constraint para impedir `purchased_at` > `purchase_deadline` (capa de datos permisiva; sólo la función hace la verificación temporal). Esto permite bypass con un UPDATE manual o llamada directa si se otorgan permisos.
11. Vista `offers_with_details` calcula `seconds_remaining` según estado, pero para `purchased` (o hipotéticos estados intermedios) retornará 0: no está preparada para mostrar ventana residual post "agregado al carrito".
12. Inconsistencia conceptual: el stock se descuenta ANTES del pago (reserva pasiva) y se repone sólo en expiración aceptada — no hay mecanismo para reconciliar si se produce un rollback de inventario parcial (p.ej. error de pago + usuario abandona).

Conclusión migraciones: el modelo SQL actual “ancla” la semántica en un pipeline simple (pending→accepted→purchased o expired) y no contempla el ciclo real de compra pagada. La sobrecarga del estado `purchased` y la ausencia de control sobre `purchase_deadline` más allá de `accepted` crea huecos donde ofertas quedan activas fuera de la ventana y stock retenido.


### 1.4 Riesgos de negocio
- Pricing comprometido más tiempo del permitido.
- Falsa sensación de eficiencia (conversion rate inflado).
- Posible soporte manual para liberar stock “atascado”.
- Dificultad para aplicar analítica de abandono (aceptó pero nunca pagó) vs (aceptó, agregó, no pagó a tiempo).

---
## 2. Objetivo Target (Modelo Deseado)

Ventanas claras:
1. `pending` → 48h para ser aceptada o expirar.
2. `approved` (accept) → 24h estrictas para completar PAGO (no sólo carrito).
3. Expirada la ventana de 24h sin pago: oferta pasa a `expired`; stock se libera; intento de checkout debe fallar.

Estados refinados propuestos (ofertas):
```
pending -> approved -> reserved (opcional) -> paid (nuevo) -> fulfilled
              |             |              |
              |             |              -> cancel / expire
              |             -> expire
              -> rejected
```
Pero para minimizar ruptura inmediata se propone fase incremental (ver sección 5).

---
## 3. Brecha Técnica vs Modelo Deseado
| Área | Actual | Necesario |
|------|--------|-----------|
| Campo ventana post-aceptación | `purchase_deadline` existe, UI ignora | Usar SIEMPRE `purchase_deadline` para countdown approved.
| Reglas pago tardío | Ninguna | Validar `purchase_deadline >= now()` en `create-payment-khipu` y/o antes de `finalize_order_pricing`.
| Estado intermedio | `purchased` usado para “agregado al carrito” | Renombrar semántica → `reserved` (fase 2) y crear `paid` derivado solo del webhook.
| Link oferta-orden | Ausente | Añadir `offer_id` en items o tabla puente `offer_order_links`.
| Liberación stock | Implícita / no mostrada | Job / trigger que: si `purchase_deadline < now` y `status in (approved,reserved)` → revertir reserva.
| Métricas | No diferencian reservado vs pagado | Nuevas vistas: funnel accepted→reserved→paid.

---
## 4. Diseño Detallado de la Solución

### 4.1 Cambios SQL / Esquema
1. Tabla `offers`:
   - (Fase 1) Agregar columna `order_id uuid NULL` (FK opcional a `orders.id`).
   - (Fase 2) Agregar columna `reserved_at timestamptz` (separada de `purchased_at` para transición) o renombrar `purchased_at` → `reserved_at` (requiere migración de datos + alias vista).
   - (Fase 2) Extender enum `status` para incluir `reserved` y `paid` (o mapear `paid` a transición final para auditoría). Alternativa sin enum: mantener texto libre pero documentado.
2. Índices:
   - Index compuesto para expiraciones: `CREATE INDEX ON offers (purchase_deadline) WHERE status IN ('approved','reserved');`
3. Tabla puente (opcional si se requiere multi-oferta → una orden):
   ```sql
   CREATE TABLE offer_order_links (
     offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
     order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
     linked_at timestamptz DEFAULT now(),
     PRIMARY KEY(offer_id, order_id)
   );
   ```

### 4.2 Reglas de Negocio (validación)
| Acción | Validación nueva |
|--------|------------------|
| Aceptar oferta | set `purchase_deadline = now() + interval '24 hours'`; sincronizar también `expires_at = purchase_deadline` (para compat UI legacy) hasta que UI migre. |
| Crear pago Khipu | Verificar que oferta(s) asociada(s) no estén expiradas: `now() <= purchase_deadline` y `status in ('approved','reserved')`. |
| Agregar al carrito | Si se quiere mantener: marcar `reserved` (no `purchased`). Si deadline pasado → bloquear. |
| Webhook pago | Antes de marcar orden `paid`, validar: si oferta vinculada vencida → marcar orden `cancelled` o devolver error (decisión de producto). |
| Cron expiración | Cada X minutos: ofertas `approved/reserved` con `purchase_deadline < now()` → `status='expired'`, `stock_reserved=false`. |

### 4.3 Ajustes Edge Functions
1. `create-payment-khipu/index.ts`:
   - Input debe incluir `offer_id` (si una sola) o arreglo `offer_ids`.
   - Previo a `finalize_order_pricing`: validar deadline.
   - Escribir vínculo en `offer_order_links` (o set `offers.order_id`).
2. `process-khipu-webhook/index.ts`:
   - After integridad hash, fetch ofertas vinculadas para reconfirmar ventana (idempotente: si ya paid, return).
   - Si fuera tardío (pago llega luego de expirar) política decidida: a) rechazar (409) y no marcar paid; o b) permitir y etiquetar `late_payment=true` para conciliación.
   - Marcar ofertas como `paid` sólo aquí. (El front nunca eleva estado más allá de `reserved`).

### 4.4 Cambios Frontend (mínimo viable fase 1)
1. `OffersList.jsx`:
   - Reemplazar cálculo en estado `approved` para usar `purchase_deadline` si existe (fallback a `expires_at`).
2. `offerStore.js`:
   - En `acceptOffer` sincronizar `expires_at = purchase_deadline`.
   - En `reserveOffer` validar `Date.now() <= purchase_deadline`; si no, devolver error y refrescar store.
   - Renombrar copy de estado `PURCHASED` → “Reservado (Carrito)” hasta migrar.
3. Modal AddToCart (oferta):
   - Mostrar countdown real (purchase_deadline).
   - Deshabilitar acción si vencido.
4. Métricas UI: funnel accepted→reservado→pagado con timestamps.

### 4.5 Liberación de Stock Automática
Job (Edge Function `daily-cleanup` o nueva `offers-expiration-sweep`):
```sql
UPDATE offers
SET status='expired', expired_at=now(), stock_reserved=false
WHERE status IN ('approved','reserved') AND purchase_deadline < now();
```
Opcional: trigger `AFTER UPDATE` en `offers` para revertir reserva física (si se materializa stock en otra tabla).

### 4.6 Migración de Datos (Orden sugerido)
1. Añadir columnas nuevas (no disruptivas).
2. Backfill: `UPDATE offers SET purchase_deadline = accepted_at + interval '24 hours' WHERE accepted_at IS NOT NULL AND purchase_deadline IS NULL;`
3. Sincronizar `expires_at` para todas las `accepted`/`approved` actuales si diferencia >5m con `purchase_deadline`.
4. Deploy frontend (usa purchase_deadline primero, mantiene fallback).
5. Introducir validaciones server en Edge functions.
6. Renombrar semántica `purchased` → `reserved` (opcional fase 2) con vista de compatibilidad:
   ```sql
   CREATE VIEW offers_legacy AS
   SELECT *,
     CASE WHEN status='reserved' THEN 'purchased' ELSE status END AS status_legacy
   FROM offers;
   ```

### 4.7 Estrategia de Rollback
| Fase | Riesgo | Rollback |
|------|--------|----------|
| Añadir columnas | Bajo | `ALTER TABLE DROP COLUMN` (si aún vacías) |
| Validación en create-payment | Medio (rechazos inesperados) | Feature flag: `OFFERS_ENFORCE_DEADLINE=0` |
| Webhook deadline check | Medio | Log only mode + flag antes de bloquear |
| Renombrar estados | Alto (tests) | Mantener vista de compatibilidad + bandera front para togglear etiquetas |

---
## 5. Plan de Implementación Incremental
### Fase 1 (Hardening sin romper flujo)
1. UI usa `purchase_deadline` (fallback `expires_at`).
2. Store sincroniza `expires_at = purchase_deadline` al aceptar.
3. Validación previa a `reserveOffer` (bloquea si vencido).
4. Edge `create-payment-khipu`: verifica deadline (soft fail: log + warning, todavía permite – modo observación).
5. Documentar métricas nuevas; iniciar captura.

### Fase 2 (Semántica precisa)
1. Introducir estado `reserved`; mapear actual `purchased` → `reserved`.
2. Se renombró definitivamente `markOfferAsPurchased` → `reserveOffer`.
3. Webhook promueve `reserved -> paid`.
4. Enforce duro en Edge (rechazo si vencido).
5. Cron libera stock expirado.

### Fase 3 (Optimización y Auditoría)
1. Tabla puente multi-oferta (si se habilita combinar ofertas en una sola orden).
2. Dashboards funnel + SLA de conversión.
3. Alertas si ratio accepted→paid < X% o si >Y% pagos tardíos.

---
## 6. Cambios Concretos (Snippet Ejemplos)

### 6.1 accept_offer_simple (pseudo SQL ajuste)
```sql
UPDATE offers
SET status='accepted',
    accepted_at=now(),
    purchase_deadline = now() + interval '24 hours',
    expires_at = purchase_deadline,  -- sync para UI legacy
    stock_reserved = true,
    reserved_at = now()
WHERE id = p_offer_id
RETURNING purchase_deadline;
```

### 6.2 create-payment-khipu (validación temprana)
```ts
// Antes de finalize_order_pricing
if (offer_id) {
  const offer = await admin.from('offers').select('status,purchase_deadline').eq('id', offer_id).maybeSingle();
  if (!offer || !offer.purchase_deadline || new Date(offer.purchase_deadline).getTime() < Date.now()) {
     return response(409,'OFFER_DEADLINE_EXPIRED');
  }
  if (!['approved','reserved'].includes(offer.status)) return response(409,'OFFER_INVALID_STATE');
}
```

### 6.3 Webhook (bloqueo tardío opcional)
```ts
// Tras parsear orderId y antes de marcar paid
const links = await admin.from('offer_order_links').select('offer_id, offers(purchase_deadline,status)').eq('order_id', orderId);
for (const l of links.data) {
  if (new Date(l.offers.purchase_deadline) < Date.now()) {
     // flag tardío
     late = true;
  }
}
if (late && Deno.env.get('OFFERS_ENFORCE_LATE_BLOCK')==='1') return conflictLate();
```

### 6.4 Store (bloqueo reserva tardía)
```js
if (offer.purchase_deadline && Date.now() > new Date(offer.purchase_deadline).getTime()) {
  return { success:false, error:'La oferta caducó (plazo de 24h superado)' };
}
```

---
## 7. Impacto en Tests
- Tests que esperan `status=purchased` tras agregar al carrito deberán aceptar `reserved` (usar bandera temporal o mapping).
- Añadir casos: expiración antes de reservar; expiración entre reservar y pagar; pago tardío.
- Mock RPC `accept_offer` debe devolver ahora también `purchase_deadline` y quizá `expires_at` sincronizado.

---
---
## 8. Resumen Ejecutivo
El sistema actual considera la acción de “agregar al carrito” como finalización; esto desvía la métrica real que debería ser “orden pagada dentro de 24h desde aceptación”. La propuesta introduce un modelo claro de ventana con validaciones server-side, estado intermedio `reserved`, y control estricto del momento del pago respetando `purchase_deadline`. Se plantea una migración en tres fases para minimizar ruptura y permitir monitoreo progresivo.

---
## 9. Próximo Paso Sugerido
Implementar Fase 1 inmediatamente (cambios front + sincronización + validación suave) y preparar migración de esquema para Fase 2 detrás de feature flags.

### 9.1 Estado de Implementación (Parcial)
- [x] UI Buyer usa `purchase_deadline` (fallback `expires_at`).
- [x] Store sincroniza `expires_at = purchase_deadline` al aceptar.
- [x] Validación local previa a `reserveOffer` bloquea si deadline vencido.
- [x] Migración Phase1 agrega sincronización en `accept_offer_simple` y expira también `purchased` atrasadas.
 - [x] Edge `create-payment-khipu` valida deadline (modo soft por flag) y vincula offers → order.
 - [x] Vinculación explícita offer ↔ order (columna `offers.order_id` + actualización en Edge) Fase1.
 - [x] Webhook valida ofertas vinculadas (flag `OFFERS_ENFORCE_LATE_BLOCK` para bloqueo duro; en modo observación agrega `offer_deadline_warnings`).
      - [x] Renombrar estado `purchased` → `reserved` (backfill + guard) y eliminar vista legacy (cleanup final).
#### 9.1.2 Validación en Webhook
#### 9.1.3 Fase 2 (Estados reserved/paid)
Aplicada migración `20250904170000_offers_phase2_reserved_state.sql`:
#### 9.1.4 Limpieza final
Migración `20250904173000_offers_phase2_cleanup.sql`:
1. Nueva función `reserve_offer` y alias deprecado `mark_offer_as_purchased` que delega.
2. Eliminada vista `offers_legacy_status` (ya no se mapea reserved→purchased).
3. Edge Functions ajustadas para no aceptar más `purchased` (excepto histórico ya migrado).
4. Store expone método `reserveOffer` y mantiene el nombre legacy para compatibilidad temporal en el front.

1. Backfill: `purchased` → `reserved`.
2. Añade columna `paid_at` (si no existía) y trigger guard de estados permitidos.
3. Vista `offers_legacy_status` mantiene compat mapeando `reserved|paid` → `purchased`.
4. Front (store) mapea respuestas legacy `purchased` a `reserved` y expone nuevos estados `RESERVED`, `PAID`.

El webhook ahora lee `offers` vinculadas a la orden y:
1. Detecta deadlines vencidos y estados inválidos (`!accepted|purchased`).
2. Si `OFFERS_ENFORCE_LATE_BLOCK='1'` y el pago aún no estaba marcado `paid`, responde 409 bloqueando la confirmación.
3. En modo observación (flag distinto de '1') retorna `offer_deadline_warnings` para monitoreo.


#### 9.1.1 Detalle reciente
Se añadió migración `20250904163000_offers_add_order_link.sql` que incorpora `offers.order_id` (FK) e índice parcial. La Edge Function `create-payment-khipu` ahora:
1. Acepta `offer_id` o `offer_ids`.
2. Verifica estado (`accepted|purchased`) y `purchase_deadline` antes de sellar pricing.
3. Usa flag `OFFERS_ENFORCE_DEADLINE` (valor '1' para bloquear) permitiendo modo observación inicial.
4. Vincula ofertas a la orden (idempotente) sólo si aún no estaban ligadas.
5. Devuelve `offer_warnings` cuando hay expiraciones o estados inválidos en modo no estricto.

Próximo paso inmediato: preparar feature flag para webhook (observación de pagos tardíos) antes de forzar bloqueo en fase 2 y luego introducir estado `reserved`.

---
Fin del documento.
