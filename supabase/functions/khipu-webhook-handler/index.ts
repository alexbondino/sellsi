// supabase/functions/khipu-webhook-handler/index.ts

// DEPRECATED: Antiguo manejador de webhooks de Khipu.
// Motivo: El flujo actual usa `process-khipu-webhook` que valida firma
// HMAC, actualiza payment_status en `orders` y materializa cart/items.
// Este archivo se mantiene sólo para evitar 404 en configuraciones
// antiguas. No realiza mutaciones para no introducir estados inválidos
// (por ejemplo `status = 'paid'`) que violan constraints.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withMetrics } from '../_shared/metrics.ts';

serve(req => withMetrics('khipu-webhook-handler', req, async () => {
  // Consumimos el body (si existe) sólo para logging ligero sin fallar.
  let raw = '';
  try { raw = await req.text(); } catch { /* ignore */ }
  console.log('[khipu-webhook-handler][deprecated] Invocado. Ignorando payload.');
  return new Response(
    JSON.stringify({
      deprecated: true,
      message: 'Usar process-khipu-webhook. Esta función no hace nada.',
      received: raw ? 'ok' : 'empty'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}));
