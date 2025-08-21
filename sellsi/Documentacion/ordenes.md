# Análisis Definitivo (Esencial) – Direcciones en Órdenes (2025-08-21)

## Objetivo
Documentar exhaustivamente por qué `shipping_address` y `billing_address` continúan llegando como `NULL` (o perdiéndose) en `orders`, cubriendo:
1. Flujo PRE-COMPRA (BuyerCart / PaymentMethod / Checkout context).
2. Flujo COMPRA (Edge Function `create-payment-khipu` + `finalize_order_pricing`).
3. Flujo POST-COMPRA (Webhook `process-khipu-webhook`, hooks/metadatos).
4. Causas raíz vigentes y diferencias con análisis previo (`analisisgpt.md`).
5. Riesgos adicionales (merge, sobrescritura, doble serialización).
6. Solución final esencial (sin métricas ni monitoreo extra).

---
## 1. PRE-COMPRA (Captura y preparación de direcciones)

### 1.1 Captura desde perfil
Archivo clave: `src/services/user/profileService.js (getUserProfile)`

El perfil compone datos de tablas normalizadas:
| Fuente | Campos relevantes | Notas |
|--------|-------------------|-------|
| `shipping_info` | `shipping_region`, `shipping_commune`, `shipping_address`, `shipping_number`, `shipping_dept` | Si alguno está vacío → strings vacías. |
| `billing_info` | `business_name`, `billing_rut`, `billing_address`, `billing_region`, `billing_commune` | Todos opcionales. |

### 1.2 Construcción en UI de checkout
Archivo: `PaymentMethod.jsx`
```js
if (profile.shipping_address) { // ← condición estricta: string no vacío
	shippingAddress = { region, commune, address, number, department }
}
if (profile.billing_address || profile.business_name) { ... }
```
Si `profile.shipping_address` está vacío (""), **NO** se construye objeto → `shippingAddress` permanece `null`.

### 1.3 Inicialización de estado de checkout
`initializeCheckout(cartData)` persiste `shippingAddress` y `billingAddress` tal cual (objeto o null) en el contexto.

### 1.4 Creación de la orden inicial
Archivo: `checkoutService.createOrder`
```js
const shippingAddressJson = orderData.shippingAddress ? JSON.stringify(orderData.shippingAddress) : null;
insert({ ..., shipping_address: shippingAddressJson, billing_address: billingAddressJson })
```
PROBLEMA 1 (Tipado JSONB): La columna `orders.shipping_address` es `jsonb`, pero se envía **ya serializado** como string. El cliente Supabase volverá a serializar el objeto global, resultando probable almacenamiento como JSON string (ej: `"{ \"region\": \"RM\" }"`) en lugar de objeto JSON. Esto no provoca `NULL`, pero sí ambigüedad y obliga a parsing adicional (algunas lecturas esperan objeto). Riesgo de confusión, no la causa primaria de `NULL`.

PROBLEMA 2 (Falta de objeto): Si el perfil no tenía dirección (campo string vacío) la orden se inserta con `shipping_address = NULL` desde el comienzo.

### 1.5 Paso a procesamiento de pago
Archivo: `PaymentMethodSelector.jsx` → crea orden y luego llama `checkoutService.processKhipuPayment` propagando:
```js
shippingAddress: orderData.shippingAddress || null,
billingAddress: orderData.billingAddress || null,
```
Si ya venía `null`, se mantiene `null`.

### 1.6 Adaptador Khipu (frontend)
Archivo: `domains/checkout/services/khipuService.js`
Incluye siempre en el payload las claves:
```js
shipping_address: shippingAddress || null,
billing_address: billingAddress || null,
```
Esto significa que **aunque no haya dirección** se envía explícitamente la clave con valor `null` (no se omite).

---
## 2. COMPRA (Edge Function `create-payment-khipu`)

Archivo: `supabase/functions/create-payment-khipu/index.ts`
Entrada esperada (ya incluye ahora direcciones):
```ts
const { amount, subject, currency, buyer_id, cart_items, cart_id, order_id, shipping_address, billing_address } = await req.json();
```

### 2.1 Llamada a `finalize_order_pricing`
Función SQL `finalize_order_pricing(p_order_id)` recalcula precios, pero **NO toca shipping_address / billing_address**.

### 2.2 Fallback Insert
Si la orden no existe (caso raro / condición de carrera):
```ts
fallbackInsert = { ..., shipping_address: shipping_address ? JSON.stringify(shipping_address) : null }
```
Si el front envió `null`, se consolida `NULL` definitivo.

### 2.3 Update normal
```ts
if (typeof shipping_address !== 'undefined') {
	updateData.shipping_address = shipping_address ? JSON.stringify(shipping_address) : null;
}
```
CLAVE: El adaptador *siempre* envía la propiedad → `typeof shipping_address !== 'undefined'` es cierto incluso cuando es `null`. Resultado: **se sobreescribe la columna a `NULL`** si el front no tenía dirección o la perdió, eliminando una dirección válida que pudo haberse insertado en el paso de creación de orden. Esto explica órdenes que pasan de tener dirección (en inserción inicial) a `NULL` tras iniciar pago.

### 2.4 Doble serialización potencial
Se repite `JSON.stringify` sobre un objeto que ya pudo haber sido serializado antes (si se corrigiera la parte inicial), generando inconsistencia.

---
## 3. POST-COMPRA (Webhook `process-khipu-webhook`)

Archivo: `supabase/functions/process-khipu-webhook/index.ts`
Acciones relevantes:
1. Verifica firma HMAC.
2. Identifica `orderId` vía `subject` o `khipu_payment_id` fallback.
3. Verifica integridad `items_hash` (no toca direcciones).
4. Marca `payment_status = 'paid'` si corresponde.
5. Lee `shipping_address` para calcular SLA (`buyerRegion = ord.shipping_address?.shipping_region || ...`).
6. NO actualiza ni toca `shipping_address` / `billing_address`.

Conclusión: El webhook **no destruye ni modifica** direcciones; sólo se ve afectado si ya estaban `NULL` antes.

---
## 4. Causas Raíz Persistentes
| Código | Tipo | Impacto | Estado |
|-------|------|---------|--------|
| Checkout insert usa `JSON.stringify` | Data shape | Inconsistencia (string en jsonb) | Persistente |
| Condición `if (profile.shipping_address)` exige string no vacío | Lógica UI | No construye objeto → inserta NULL | Persistente |
| Adaptador Khipu envía `shipping_address: null` explícito | Payload | Forza sobrescritura a NULL en Edge | Persistente |
| Edge Function sobrescribe cuando valor es `null` | Merge defect | Borra dato válido existente | Persistente |
| Falta validación server para prevenir downgrade non-null→null | Integridad | Pérdida silenciosa | Persistente |
| Sin monitoreo % órdenes sin dirección | Observabilidad | Detección tardía | Persistente |

---
## 5. Diferencias vs `analisisgpt.md`
El análisis previo identificó el riesgo de sobrescritura pero el código actual todavía:
1. Mantiene `JSON.stringify` en ambos lados.
2. No distingue `undefined` (no enviar) vs `null` (borrar) en update.
3. No implementó verificación de transición non-null→null.

NUEVO énfasis: La combinación (front siempre manda null + update incondicional) garantiza pérdida si el perfil estaba incompleto.

---
## 6. Escenarios Concretos
| Escenario | Paso | Resultado |
|-----------|------|-----------|
| Perfil sin dirección | createOrder inserta NULL | Orden nace NULL |
| Perfil con dirección, adaptador conserva objeto | update mantiene objeto | OK |
| Perfil con dirección, pero adaptador pierde referencia (regresión UI) y envía `null` | Edge update lo convierte en NULL | Dirección perdida |
| Dirección válida → Retry pago con front que ya perdió state (null) | Edge quita dirección | Pérdida tardía |

---
## 7. Solución Esencial (Aplicada)
Backend:
1. Merge-preserve en `create-payment-khipu`: ya no degrada non-null → null.
2. Inserción fallback evita doble `JSON.stringify`.

Frontend:
1. `khipuService` ahora omite claves `shipping_address` / `billing_address` cuando no hay objeto (no manda null explícito).
2. `checkoutService.createOrder` dejó de usar `JSON.stringify`; pasa objetos directos a columnas jsonb.

Opcional (NO incluido aquí por pedido): backfill histórico y cualquier métrica/alerta.

Checklist esencial actualizado más abajo refleja todo completado.

---
## 8. Resumen Ejecutivo
- La pérdida de direcciones ocurre principalmente por sobrescritura en la Edge Function cuando el frontend manda explícitamente `null` (propiedad presente) y por ausencia inicial si el perfil del usuario no tenía dirección cargada.
- No hay corrección aún de merge-preserve; el hotfix debe impedir downgrade `object → null` no intencional.
- Se recomienda también eliminar doble serialización para coherencia `jsonb` y añadir observabilidad.

---
## 9. Próximos Pasos (Solo esenciales)
No hay acciones esenciales pendientes: flujo nuevo ya no pierde direcciones.
Opcional (fuera de alcance actual): Backfill histórico si se desea homogeneizar filas antiguas y/o agregar mecanismo explícito para borrar direcciones (flag intencional).

---
## 10. Checklist Esencial
- [x] Edge Function merge-preserve implementado.
- [x] Evitar degradar direcciones a null en updates.
- [x] khipuService omite claves vacías.
- [x] checkoutService sin JSON.stringify para jsonb.

(*Se omiten métricas, auditoría y backfill por petición: foco mínimo viable para que no se pierdan direcciones nuevas.*)

---
## 11. Notas Finales
Con los cambios en Edge y frontend, nuevas órdenes ya no deberían perder direcciones una vez establecidas. El único riesgo restante es histórico (órdenes viejas con null o json string doble) que sólo se aborda si se decide hacer un backfill posterior.

