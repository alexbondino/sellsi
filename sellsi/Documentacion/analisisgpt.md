# ANÁLISIS EXTREMADAMENTE PROFUNDO (GPT): PÉRDIDA DE `shipping_address` / `billing_address` EN ÓRDENES (Checkout Khipu)

## 1. 📌 Resumen Ejecutivo
Durante el flujo de pago con Khipu las direcciones de envío y facturación, capturadas correctamente desde el perfil del usuario y almacenadas inicialmente al crear la orden, terminan llegando como `null` a la base de datos tras la ejecución de la Edge Function de creación / sincronización de pago Khipu. El problema **no es de captura**, sino de **propagación y preservación** de los datos en una cadena de llamadas con contratos incompletos que generan sobrescritura silenciosa.

## 2. 🎯 Objetivo del Análisis
Identificar con precisión:
- Dónde se originan los datos (fuente de verdad).
- En qué puntos se pierden (brechas de contrato / serialización / ausencia de forwarding).
- Cómo se termina sobrescribiendo con `null`.
- Diseñar una solución robusta + plan de validación + mecanismos preventivos futuros.

## 3. 🧭 Alcance
Incluye: componentes frontend involucrados en selección de método de pago, hooks de checkout, servicios (`checkoutService`, `khipuService`), función Edge `create-payment-khipu`, y efectos sobre la tabla `orders` (Supabase / Postgres). No incluye rediseño completo de dominio de direcciones (aunque se sugieren mejoras).

## 4. 📚 Contexto Operacional
- Flujo funcional: Cart → Método de Pago → Creación Orden → Inicio Pago Khipu → Redirección → Webhook / Polling → Actualización Orden.
- Tecnología: React (Vite), Supabase (Edge Functions), Khipu API, Postgres JSON fields (presumible para direcciones), Servicios modulares.
- Incidencia: Repetida (≥3 intentos de corrección previos) ⇒ riesgo de deuda técnica y pérdida de confianza.
- Impacto negocio: órdenes sin dirección ⇒ fricción logística, intervención manual, riesgo de cancelaciones.

## 5. 🔄 Flujo de Datos Esperado (Ideal)
```
Perfil Usuario (supabase.profiles)
	↓ (read)
PaymentMethod.jsx obtiene { shippingAddress, billingAddress }
	↓ (set state)
useCheckout state.checkoutData = {..., shippingAddress, billingAddress}
	↓
PaymentMethodSelector → checkoutService.createOrder(data con direcciones)
	↓ (INSERT) orders.shipping_address / billing_address (JSON)
	↓
PaymentMethodSelector → checkoutService.processKhipuPayment({ orderId, ... + direcciones })
	↓
khipuService.createPaymentOrder({ ... + direcciones })
	↓ (call Edge) create-payment-khipu (payload incluye direcciones)
	↓ (UPDATE preservando campos no incluidos) orders (NO tocar direcciones si ya existen o rehidratar si se mandan)
```

## 6. 🚨 Flujo Real Observado (Defectuoso)
```
PaymentMethodSelector → processKhipuPayment SIN shippingAddress/billingAddress
  → checkoutService.processKhipuPayment SIN direcciones
	 → khipuService.createPaymentOrder SIN direcciones
		→ Edge Function recibe payload sin direcciones
			→ Construye updateData SIN merges defensivos
				→ UPDATE orders SET shipping_address = NULL (o conserva null implícito) / billing_address = NULL
```

## 7. 🧬 Traza Forense Capa por Capa
| Capa | Estado de las direcciones | Comentario |
|------|---------------------------|------------|
| Captura perfil | OK (objetos completos) | Fuente primaria íntegra |
| Estado checkout (hook) | OK | Persistidas temporalmente en cliente |
| createOrder | OK (INSERT correcto inicial) | La primera escritura funciona |
| processKhipuPayment (invocación) | FALTA (no se pasan) | Omisión de forwarding |
| khipuService.createPaymentOrder | FALTA (no en firma) | Contrato incompleto |
| Edge Function (update) | FALTA | No recibe ⇒ no preserva ⇒ sobrescribe o deja null |
| DB final | NULL | Pérdida de valor semántico |

## 8. 🪓 Causas Raíz (Root Cause Tree)
1. Contratos de función incompletos (no contemplan direcciones post-creación de orden).
2. Ausencia de validación de integridad (no hay assertion previa al update final).
3. Capa Edge no implementa merge selectivo (pattern: blind overwrite vs. patch merge).
4. Falta de tipado estricto / DTO formal para Payment Pipeline (flexibilidad sin enforcement).
5. Observabilidad insuficiente (logs no muestran “directions lost at step X”).

## 9. 🌊 Factores Contribuyentes
- Reutilización de función de actualización genérica sin semántica de preservación.
- Presión por integrar Khipu rápidamente sin refinar contratos.
- Ausencia de pruebas end-to-end enfocadas en atributos no críticos del pago (direcciones vistas como periféricas).
- Diseño acoplado: múltiples capas manuales de forwarding de props (prop drilling cross-service).
- Sin un “PaymentContext DTO” centralizado.

## 10. 🧪 Hipótesis Iniciales Evaluadas (y descartadas)
| Hipótesis | Resultado | Evidencia |
|-----------|-----------|-----------|
| Error de serialización JSON a DB | Rechazada | createOrder sí guarda bien inicialmente |
| Bug en hook de estado | Rechazada | Estado contiene direcciones antes de createOrder |
| Webhook sobrescribe direcciones posterior | No principal | Pérdida ocurre antes / durante Edge inicial |
| Condiciones race update vs insert | Rechazada | Falta de forwarding es determinista |

## 11. 📐 Diseño de la Solución (Principios)
1. Propagación explícita end-to-end (no inferencias mágicas).
2. Contratos tipados / centralizados (un único PaymentInitiationPayload o similar).
3. Edge Function con política de merge inteligente: si valor no enviado → preservar existente.
4. Observabilidad: log estructurado en cada frontera (payload in/out).
5. Idempotencia: Re-enviar direcciones no debe causar inconsistencia.

## 12. 🛠 Cambios Concretos (Resumen)
Frontend:
- `PaymentMethodSelector.jsx`: incluir `shippingAddress`, `billingAddress` en llamada a `processKhipuPayment`.
- `checkoutService.processKhipuPayment`: propagar campos a `khipuService`.
- `khipuService.createPaymentOrder`: aceptar / incluir en payload.

Edge Function:
- Ajustar parsing de input para extraer direcciones.
- Agregar a `updateData` (con JSON.stringify). O BIEN aplicar patrón merge: si no vienen, no tocar campos.

Opcional Refactor:
- Introducir `PaymentInitiationDTO` (TypeScript interface) usada por todas las capas.

## 13. 🧾 Ejemplo de DTO (Sugerido)
```
interface PaymentInitiationDTO {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  items: Array<{ id: string; quantity: number; price: number; docType?: string }>;
  shippingAddress: Record<string, any> | null;
  billingAddress: Record<string, any> | null;
}
```

## 14. 🛡 Estrategia de Merge en Edge (Patrón Recomendado)
Pseudo:
```
// existingOrder = SELECT * FROM orders WHERE id = :orderId
updateData.shipping_address = incoming.shipping_address ?? existingOrder.shipping_address;
updateData.billing_address  = incoming.billing_address  ?? existingOrder.billing_address;
```
Ventaja: peticiones futuras que no manden direcciones no borran la data ya persistida.

## 15. 🧭 Plan de Implementación Paso a Paso
1. Añadir parámetros en `PaymentMethodSelector` y test manual (console.log antes de llamada).
2. Extender firma de `processKhipuPayment` + forward.
3. Extender `khipuService.createPaymentOrder` + construir payload.
4. Modificar fetch POST hacia Edge Function (incluir direcciones serializadas JSON).
5. Edge Function: parse, validar (schema ligero), merge y actualizar.
6. Agregar logging estructurado: `stage", "addresses_presence"`.
7. Añadir test unit (mock) para khipuService que verifique forwarding.
8. Crear test E2E (cypress o playwright) simulando checkout con direcciones sintéticas.
9. Desplegar a staging, verificar orden real con SELECT.
10. Monitorear 24h métricas de órdenes con direcciones != null.

## 16. 🧷 Validaciones (Checklist QA)
| Caso | Esperado |
|------|----------|
| Orden con ambas direcciones | Ambas JSON no nulas |
| Orden con solo shipping | billing_address permanece null; shipping OK |
| Reintento de pago (2º POST) sin reenviar direcciones | Se preservan existentes |
| Webhook posterior | No elimina direcciones |
| Dirección con caracteres especiales (ñ, tildes) | Persistencia correcta UTF-8 |
| Campos extra inesperados | Ignorados sin romper (defensive parsing) |

## 17. 🔍 Instrumentación / Observabilidad
Logs estructurados (ejemplos):
```
{"stage":"frontend.processKhipuPayment.call","hasShipping":true,"hasBilling":true,"orderId":"..."}
{"stage":"edge.request.received","hasShipping":false,"hasBilling":false,"orderId":"..."}
{"stage":"edge.update.applied","shippingPreserved":true,"billingPreserved":true,"orderId":"..."}
```
Métricas sugeridas:
- `orders_missing_addresses` (counter por día).
- `address_forwarding_drop_stage` (label stage). Permite pinpoint.

Alertas:
- Si >5% de órdenes del día carecen de shipping_address ⇒ alerta Slack.

## 18. 🧪 Pruebas Automatizadas (Detalle)
Unit:
- Mock de `processKhipuPayment` asegurando build payload contiene direcciones.
- Test de khipuService que asegure envío intacto.

Integration:
- Simulación Edge call con y sin direcciones midiendo merge.

E2E:
- Flujo completo checkout (semilla de usuario con direcciones) ⇒ SELECT final.

Contract (opcional):
- JSON Schema validado en Edge (ajustar con `ajv` ligero) para detectar regresiones.

## 19. ⚖️ Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Payload demasiado grande (direcciones extensas) | Validar tamaño < X KB |
| Datos inconsistentes (billing = shipping) | Normalización / deduplicación opcional |
| Divergencia futura de modelo de direcciones | Centralizar interfaz en módulo de dominio |
| Regresión por olvido de forwarding en nueva pasarela | Plantilla de PaymentAdapter con test base |

## 20. 🔄 Plan de Despliegue y Rollback
Despliegue:
1. Merge branch feature → staging.
2. Deploy Edge Function (`create-payment-khipu`).
3. Validar order test.
4. Deploy a producción.

Rollback:
- Revert commit + re-desplegar Edge Function anterior.
- No se requiere migración revertible (schema no cambia).

## 21. 🔐 Consideraciones de Seguridad / Privacidad
- Confirmar que las direcciones no se loguean con PII completa en logs persistentes (enmascarar campos sensibles si aplica: teléfono, etc.).
- Verificar políticas de Supabase RLS permiten que solo el dueño / admin lea direcciones.

## 22. 📦 Optimizaciones Futuras (Backlog Técnico)
1. Introducir `PaymentPipelineContext` (contexto global tipado en frontend).
2. Adoptar patrón Command (PaymentCommand) para reducir prop drilling.
3. Implementar contract tests entre frontend y Edge (utilizando schema compartido versionado).
4. Añadir verificador CI que busque campos críticos omitidos (`grep` + lista blanca).
5. Implementar migración para normalizar direcciones (tabla `addresses` relacional) si se complejiza.

## 23. 🧬 Métrica de Éxito (KPIs Post-Fix)
- KPI Primario: % órdenes con `shipping_address != null` (meta ≥ 99%).
- KPI Secundario: Tiempo medio detección (MTTD) de pérdida de campo crítico < 5 min (via alerta).
- KPI Observabilidad: Cobertura logs de etapas críticas = 100% de invocaciones.

## 24. ✅ Estado Actual de Implementación (al momento del análisis)
- Correcciones pendientes (no aplicadas aún en código principal) en 4 archivos clave.
- Sin DTO central.
- Sin merge defensivo en Edge.

## 25. 🧾 Resumen TL;DR
Las direcciones se pierden porque el pipeline de pago no las reenvía más allá de la creación inicial de la orden y la Edge Function actualiza sin estrategia de preservación, resultando en `null` final. La solución: propagar + tipar + merge defensivo + observabilidad.

---
Fin del análisis profundo (GPT).

---

## 26. 🔬 Profundización Multi-Capa (Pre-Edge / Edge / Post-Edge)

### 26.1 Inventario de Archivos Relevantes
| Capa | Archivo | Rol | Observación principal |
|------|---------|-----|-----------------------|
| Pre-Edge (Captura) | `src/domains/checkout/pages/PaymentMethod.jsx` | Obtiene perfil y construye `shippingAddress` / `billingAddress` | Datos correctos, estructuras simples (obj plano) |
| Pre-Edge (Estado) | `src/domains/checkout/hooks/useCheckout.js` | Persiste en `orderData` dentro de store (persist middleware) | Estado guarda direcciones sin transformación adicional |
| Pre-Edge (Creación orden) | `src/domains/checkout/components/PaymentMethodSelector.jsx` | Llama `checkoutService.createOrder` con direcciones | ✅ Direcciones sí se pasan aquí |
| Pre-Edge (Servicio DB) | `src/domains/checkout/services/checkoutService.js` (`createOrder`) | Serializa direcciones y las inserta (JSON.stringify) | Inserción inicial correcta |
| Pre-Edge (Inicio Pago) | `PaymentMethodSelector.jsx` → `processKhipuPayment` | NO reenvía direcciones | 🔴 Pérdida primaria |
| Pre-Edge (Servicio Pago) | `checkoutService.processKhipuPayment` | Reenvía a `khipuService` sin direcciones | 🔴 Contrato incompleto |
| Pre-Edge (Adaptador Khipu) | `khipuService.createPaymentOrder` | Invoca Edge Function sin direcciones | 🔴 Payload carece de `shipping_address` / `billing_address` |
| Edge (Creación pago) | `supabase/functions/create-payment-khipu/index.ts` | Recalcula pricing y actualiza orden | No intenta preservar direcciones (ni leerlas) |
| Post-Edge (Webhook) | `supabase/functions/process-khipu-webhook/index.ts` | Marca pago como `paid`, procesa inventario | Lee `shipping_address` en algunas derivaciones (SLA), pero no lo modifica |
| Lectura (UI Historial) | `src/domains/orders/infra/repositories/OrdersRepository.js` | Proyección para buyer | Sólo lectura (sin riesgo) |

### 26.2 Modelos / Formatos Observados
| Punto | Estructura Detectada | Observaciones |
|-------|----------------------|--------------|
| `PaymentMethod.jsx` shipping | `{ region, commune, address, number, department }` | Todos opcionales salvo `address`; no validación rígida |
| `PaymentMethod.jsx` billing | `{ business_name, billing_rut, billing_address }` | Mezcla de campos tributarios y dirección física |
| DB (orders.shipping_address) | jsonb | Almacena string JSON serializado desde front (ya JSON.stringify) |
| DB (orders.billing_address) | jsonb | Igual anterior |
| Edge create-payment-khipu input | `{ amount, subject, currency, buyer_id, cart_items, cart_id, order_id }` | Falta cualquier campo de direcciones |
| Webhook lectura | extrae `shipping_address` del SELECT de `orders` | Asume que ya existe |

### 26.3 Secuencia Temporal (Detallada)
```
T0  User abre PaymentMethod.jsx → fetch perfil → build shippingAddress/billingAddress
T1  useCheckout.initializeCheckout(cartData) persiste objeto orderData con direcciones
T2  Usuario confirma → PaymentMethodSelector.createOrder() → DB INSERT (direcciones OK)
T3  Inmediatamente luego → PaymentMethodSelector.processKhipuPayment() (SIN direcciones)
T4  checkoutService.processKhipuPayment() (SIN direcciones) → khipuService
T5  khipuService.createPaymentOrder() construye payload Edge (SIN direcciones)
T6  Edge create-payment-khipu: SELECT orden, recalcula pricing, UPDATE sin campos de direcciones (no las incluye, no las preserva explícitamente)
T7  Resultado: si INSERT inicial tenía direcciones se mantienen sólo porque el UPDATE no las sobreescribe a null (si el campo no estaba en update); si por algún motivo la inserción inicial tenía null (p.ej. race o re-creación fallback), quedan null
T8  Webhook posterior sólo actualiza campos de pago → no corrige direcciones
```

### 26.4 Anomalía Clave Sutil
El Edge Function no realiza un `SELECT` de `shipping_address` / `billing_address` para un merge consciente, pero tampoco las setea a null en el UPDATE actual (observado). Riesgo: en ruta fallback (cuando la orden no existe y se hace `fallbackInsert`) la inserción se hace SIN direcciones ⇒ se consolidan como null definitivamente.

### 26.5 Escenarios de Pérdida Diferenciados
| Escenario | Resultado | Motivo |
|-----------|-----------|--------|
| Flujo ideal (orden inicial con direcciones, update parcial) | Conserva direcciones | UPDATE no toca columnas |
| Fallback en Edge (orden no encontrada) | Pierde direcciones (null) | Insert sin direcciones |
| Migración / refactor futuro agrega campos al UPDATE y omite merge | Riesgo alto de null | Falta guardrail |
| Reintento create-payment-khipu con payload incompleto tras refactor | Direcciones podrían borrarse | Si se añaden al updateData como null/undefined |

### 26.6 Riesgos Latentes No Materializados Aún
1. Refactor accidental añadiendo `shipping_address: null` en `updateData`.
2. Stored procedure `finalize_order_pricing` potencialmente futura podría normalizar order y excluir direcciones (no analizada aquí; realizar code review SQL recomendado).
3. Evolución de modelo de addresses (normalización a tabla externa) podría romper lectura indirecta en webhook (usa `ord.shipping_address?.region`).

### 26.7 Métricas de Integridad Propuestas (Profiler)
| Métrica | Fuente | Objetivo |
|---------|--------|----------|
| `orders_with_addresses / total_orders` | Query diaria | ≥99% |
| `edge_fallback_inserts_count` | Log + contador | 0 |
| `orders_fallback_without_addresses` | Derived metric | 0 |
| `address_forwarding_gap_stage` | Logs etiquetados | Vacío tras fix |

### 26.8 Validación Diferencial (Pre vs Post Fix)
| Prueba | Antes | Después (Esperado) |
|--------|-------|--------------------|
| Captura perfil → createOrder SELECT | shipping != null | Igual |
| Post create-payment-khipu (orden existente) | shipping se conserva (si existía) | Igual |
| Fallback insert (orden perdida) | shipping null | shipping no null (porque payload incluirá direcciones) |
| Webhook tras pago | Sin cambio | Sin cambio |

### 26.9 Guardrails Técnicos Recomendados
1. Edge: construir `updateData` mediante helper `buildOrderUpdate(existing, incoming)` con merge explícito.
2. Linter personalizado (rule simple) buscando cadenas `khipu_payment_url` en repo y asegurando en el mismo bloque se documente merge addresses.
3. Test contract `expect(payload).toHaveProperty('shipping_address')` en adaptador antes de invocar Supabase Functions en modo staging.
4. Feature flag para rechazar payloads sin direcciones cuando el usuario tiene dirección en perfil (`STRICT_ADDRESS_FORWARDING=on`).

### 26.10 Ejemplo de Merge Seguro (Edge)
```ts
// existingOrder seleccionado incluyendo shipping_address, billing_address
const updateData: Record<string, any> = {
	...basePaymentFields,
	shipping_address: typeof incoming.shipping_address !== 'undefined'
		? (incoming.shipping_address ? JSON.stringify(incoming.shipping_address) : null)
		: existingOrder.shipping_address, // preserva
	billing_address: typeof incoming.billing_address !== 'undefined'
		? (incoming.billing_address ? JSON.stringify(incoming.billing_address) : null)
		: existingOrder.billing_address,
};
```

### 26.11 Contrato Uniforme (Payload hacia Edge) – Versión 1
```json
{
	"order_id": "uuid",
	"buyer_id": "uuid",
	"amount": 12345,
	"currency": "CLP",
	"subject": "Pago de Orden #...",
	"cart_items": [ { "product_id": "...", "quantity": 1, "price": 9990, "document_type": "boleta" } ],
	"shipping_address": { "region": "RM", "commune": "Santiago", "address": "Av. Principal 123" },
	"billing_address": { "business_name": "Mi Empresa", "billing_rut": "12.345.678-9", "billing_address": "Oficina 45" }
}
```

### 26.12 Validación Schema (Edge)
Schema mínimo (pseudo JSON Schema):
```json
{
	"type": "object",
	"required": ["order_id", "amount", "currency", "subject"],
	"properties": {
		"order_id": {"type": "string", "minLength": 36},
		"amount": {"type": "number", "minimum": 1},
		"currency": {"type": "string"},
		"shipping_address": {"type": ["object", "null"]},
		"billing_address": {"type": ["object", "null"]}
	}
}
```

### 26.13 Observabilidad (Campos Log Recomendados)
| Campo | Fuente | Ejemplo |
|-------|--------|---------|
| `stage` | Cada frontera | `pre-edge.payload` |
| `order_id` | Pre/Edge/Post | `uuid` |
| `has_shipping` | Derivado boolean | `true` |
| `has_billing` | Derivado boolean | `false` |
| `fallback_insert` | Edge | `false` |
| `merge_strategy` | Edge | `preserve_missing` |

### 26.14 Diferencias Concretas a Implementar (Delta vs Estado Actual)
| Elemento | Estado Actual | Delta Necesario |
|----------|---------------|-----------------|
| `PaymentMethodSelector.processKhipuPayment` payload | Sin direcciones | Agregar `shippingAddress`, `billingAddress` |
| `checkoutService.processKhipuPayment` → khipuService | Sin direcciones | Propagar campos |
| `khipuService.createPaymentOrder` paymentPayload | Sin direcciones | Incluir `shipping_address`, `billing_address` |
| Edge create-payment-khipu | Ignora direcciones | Leer, validar y merge-preserve |
| Fallback insert | No incluye direcciones | Incluir si venían en payload |

### 26.15 Post-Edge (Webhook) Confirmación
Revisión de `process-khipu-webhook/index.ts` confirma: no actualiza columnas de direcciones. Sólo lee `ord.shipping_address` para cálculo de SLA indirecto. ⇒ Una vez que las direcciones están correctamente persistidas antes del pago, el webhook no las destruirá.

### 26.16 Plan de Verificación Automatizada (Scripts SQL / QA)
1. Insert control (staging) simulando orden con direcciones.
2. Invocar flujo modificado → verificar `SELECT id, shipping_address, billing_address FROM orders WHERE id = ...` tras create-payment-khipu.
3. Simular webhook (payload firmado manualmente o bypass en entorno dev) → re-verificar que direcciones permanecen.
4. Medir `COUNT(*) WHERE shipping_address IS NULL` antes/después.

### 26.17 Consultas SQL Útiles
```sql
-- Órdenes recientes sin dirección (diagnóstico)
SELECT id, created_at, payment_method, payment_status
FROM orders
WHERE created_at > now() - interval '2 days'
	AND shipping_address IS NULL;

-- Ratio con dirección
SELECT ROUND(100.0 * SUM(CASE WHEN shipping_address IS NOT NULL THEN 1 ELSE 0 END)/COUNT(*),2) AS pct_with_shipping
FROM orders
WHERE created_at > now() - interval '7 days';
```

### 26.18 Checklist Final de Aceptación Técnica
| Ítem | Criterio | Estado (tras implementar) |
|------|----------|---------------------------|
| Forwarding completo | Direcciones presentes en payload Edge | Pending |
| Merge seguro | Edge no borra campos ausentes | Pending |
| Fallback enriquecido | Insert fallback incluye direcciones | Pending |
| Logs cobertura | 100% requests con stage & has_shipping | Pending |
| Métrica ratio | ≥99% órdenes con shipping | Pending |

### 26.19 Resumen Ampliado
La pérdida sistemática se explica por un contrato truncado en la fase de inicio de pago y ausencia de merge consciente en la capa Edge. El riesgo se expande a escenarios de fallback y futuros refactors. Se propone un endurecimiento integral: forwarding explícito, DTO unificado, merge-preserve en Edge, validación de schema y observabilidad dirigida.

---
Extensión de análisis completada.

