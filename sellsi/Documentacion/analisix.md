# Análisis FINAL (Consolidado) – Flujo Orders / Supplier Parts
Fecha: 2025-08-20 — Rama: `staging`

Objetivo: Lista mínima, priorizada y accionable de cambios pendientes (sin over‑engineering) para corregir brechas de datos en la vista de proveedores tras refactor dinámico.

## 1. Brechas y Severidad
| Código | Brecha | Severidad | Descripción | Impacto |
|--------|--------|-----------|-------------|---------|
| B1 | Filtro DB supplier | Alta (seguridad / performance) | Se descargan TODOS los pedidos y luego se filtra en memoria. | Exposición potencial (si RLS falla) y sobrecosto. |
| B2 | Envío no mostrado | Alta | UI ignora `shipping_amount` y partes no exponen alias `shipping`. | Envío=0 ⇒ info comercial errónea. |
| B3 | Legacy sin supplier_id | Alta | Items antiguos sin supplier_id ⇒ parte con supplier_id=null descartada. | Ventas históricas invisibles. |
| B4 | SLA (fecha entrega) ausente | Media | No se persiste ni calcula con metadata real. | Sin gestión proactiva y atrasos falsos. |
| B5 | Atrasos falsos | Media | isLate usa created_at cuando no hay SLA. | Ruido operativo. |
| B6 | Región match frágil | Baja | Comparación exacta, sin normalizar. | Fallback genérico 7 días innecesario. |
| B7 | Dirección mostrada como “—” | Baja | Placeholders filtrados; sin heurística mínima. | Percepción de dato perdido. |

## 2. Plan de Acción Mínimo (MVP)
Orden recomendado (cada paso aporta valor independiente):
1. (B2) Alias Shipping: en `splitOrderBySupplier` añadir `shipping: shipping_amount` (o en store si se prefiere menor difusión).
2. (B2) UI Shipping: en `TableRows.computeShippingTotal()` retornar primero `order.shipping_amount` (>0) o `order.shipping`.
3. (B1) Filtro Paid: en `orderService.getOrdersForSupplier` agregar `.eq('payment_status','paid')` (y opcional limit ajustado).
4. (B3) Enrichment Productos: batch fetch sólo para product_ids sin supplier_id en items; rellenar `supplier_id` y `product_delivery_regions` antes de split.
5. (B4) Persist SLA: en webhook si `estimated_delivery_date` es null → calcular (resolver productos puntual) y UPDATE una vez (idempotente).
6. (B6) Normalizar región: en `delivery.js` usar `trim().toLowerCase()` (opcional remover tildes) para comparar.
7. (B5) isLate guard: sólo marcar atraso si existe `estimated_delivery_date`.
8. (B7) Dirección: en store si `address` existe aunque falte región/commune, mostrar la línea de calle (no “—”).

## 3. Cambios Técnicos Concretos (Difusión mínima de impacto)
| Paso | Archivo(s) | Tipo de cambio | Est. líneas |
|------|------------|---------------|-------------|
| 1 | `splitOrderBySupplier.js` | Añadir campo `shipping` | +1–2 |
| 2 | `TableRows.jsx` | Short‑circuit a `shipping_amount` | +2 |
| 3 | `orderService.getOrdersForSupplier` | Añadir filtro | +1 |
| 4 | `orderService.getOrdersForSupplier` | Batch enrichment previo al split | +25–30 |
| 5 | `process-khipu-webhook/index.ts` | Cálculo y persist SLA si null | +25–30 |
| 6 | `delivery.js` | Normalización comparación | +3 |
| 7 | `ordersStore.js` | Condición isLate + alias shipping fallback | +5 |
| 8 | `ordersStore.js` | Ajuste dirección mínima | +3 |

Total estimado: < 80 líneas.

## 4. Criterios de Éxito (Validación Post‑Deploy)
| Métrica | Objetivo |
|---------|----------|
| Envío correcto | >95% pedidos con shipping original >0 muestran Envío >0 |
| Legacy recuperados | Pedidos antiguos (muestra de control) visibles tras refresh |
| SLA poblado | 100% nuevos pedidos pagados muestran fecha límite persistida |
| Falsos atrasos | Cae a ~0 (solo hay atraso si fecha límite vencida) |
| Query peso | Reducción rows procesadas por proveedor (medir antes/después) |

## 5. Riesgos y Mitigación
| Riesgo | Mitigación |
|--------|-----------|
| Filtro es demasiado estricto (se requieren pending) | Toggle rápido: comentar `.eq('payment_status','paid')` si negocio cambia. |
| Enrichment agrega latencia | Limitar batch a product_ids únicos y cache local corto (dejar para iteración si necesario). |
| SLA incorrecto por metadata faltante | Fallback fijo 7 días hábiles y log temporal (removible). |

## 6. Exclusiones Aprobadas (No hacer ahora)
- Vistas materializadas, índices adicionales, caching avanzado, auditoría de eventos, persistencia de partes.

## 7. Checklist Ejecutable
- [x] Alias shipping part (B2 paso 1)
- [x] UI usa shipping_amount (B2 paso 2)
- [x] Filtro paid aplicado (B1 paso 3)
- [x] Batch enrichment supplier_id/delivery_regions (B3 paso 4)
- [x] Persistencia SLA en webhook (B4 paso 5)
- [x] Normalización región delivery (B6 paso 6)
- [x] isLate sólo con SLA (B5 paso 7)
- [x] Dirección mínima mostrada (B7 paso 8)

## 8. Próximo Paso
Implementar pasos 1–3 (impacto inmediato visible), validar en staging, luego 4–5, finalizar 6–8 y cerrar checklist.

Documento FINAL consolidado. Actualizar sólo para marcar completado o añadir métricas post‑deploy.

## 9. Estado Actual (2025-08-20)
Todos los pasos 1–8 implementados en código (build OK). Pendiente: recolectar métricas reales (éxito SLA, reducción falsos atrasos, cobertura shipping). Mantener documento congelado salvo para anexar métricas post‑deploy.

