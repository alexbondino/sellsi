# Test Case: Orden Cancelada Recibe Pago Tardío

## Escenario
1. Orden creada: 13:48
2. Khipu expira: 14:08 (20 min)
3. Cron cancela: 14:10 (cada 5 min)
4. Usuario paga: 15:00 (52 min después)

## Estado ANTES del Fix
```json
{
  "status": "accepted",
  "payment_status": "paid",
  "cancelled_at": "2025-08-22 14:10:00",
  "paid_at": "2025-08-22 15:00:38",
  "cancellation_reason": "payment window expired"
}
```
**PROBLEMA:** Webhook aceptó pago de orden cancelada

## Estado DESPUÉS del Fix
Webhook responde:
```json
{
  "error": "Order was cancelled",
  "orderId": "dd460b67-fe3f-4fe7-8379-7ca4d33afd40",
  "cancelled_at": "2025-08-22 14:10:00"
}
```
**SOLUCIÓN:** HTTP 409 Conflict, pago rechazado

## UI en BuyerOrders.jsx
- ANTES: "Pago Aceptado" ❌
- DESPUÉS: "Cancelado" ✅

## Logs Esperados
```
❌ No se puede procesar pago: orden fue cancelada
```
