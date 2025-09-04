# Sistema de Notificaciones - Análisis Forense Profundo (Estado: lecturas no persisten)

> Objetivo: Documentar exhaustivamente por qué las notificaciones marcadas como leídas reaparecen como no leídas tras un F5, a pesar de las capas de mitigación aplicadas (persistencia inmediata, retries, overlay local, reconciliación al bootstrap).

## 1. Flujo Actual (Resumen Técnico)

1. `useNotifications(userId)` hace `fetchInitial` (`select * from notifications where user_id = ... order by created_at desc limit 20`).
2. Resultado se pasa a `notificationsStore.bootstrap(list)`.
3. El store mantiene `notifications[]` (nuevo → primero) y `unreadCount`.
4. Marcar lectura (distintas vías UI):
   - Llamada a `markAsRead(ids)` (optimista): set `is_read=true` en estado local.
   - Persistencia asíncrona: `notificationService.markRead(ids)` → UPDATE tabla.
   - Tras persistencia se hace verificación (`select id,is_read`) y se reintenta si falló.
5. Realtime: canal `notifications_<userId>` (evento INSERT) → `add(notification)`.
6. Al recargar: bootstrap vuelve a traer desde BD y **sobre-escribe** estado; overlay `forcedReadIds` intenta corregir a leído sin depender del backend.

## 2. Cambios Introducidos (Capas de Mitigación)

| Capa | Propósito | Riesgo residual |
|------|-----------|-----------------|
| Persistencia directa `markRead` | Actualizar BD inmediatamente | RLS / race / replica retrasada |
| Retry con backoff (400–1600ms) | Tolerar errores transitorios | Errores permanentes / políticas |
| Verificación post-update | Confirmar `is_read` real | Lectura contra réplica desfasada |
| Buffer local (`notifications_read_buffer`) | Reintentos tras F5 | No limpieza si se acumula |
| Overlay `forcedReadIds` | Forzar UI leída incluso si BD no actualizó | No aplicado si store se inicializa antes de leer localStorage (teórico) |
| Reconciliación tras bootstrap | Aplicar buffer a resultados iniciales | Se ejecuta después de bootstrap → breve ventana |

## 3. Síntoma Persistente

“Marco como leídas (UI cambia). F5. Reaparecen como no leídas.”

Esto implica (al menos uno):
1. Overlay `forcedReadIds` NO contiene los IDs (no se guardaron en `localStorage`).
2. El store se re-crea antes de que `localStorage` esté disponible (poco probable en navegador normal, a menos de SSR/hidratación parcial). 
3. Bootstrapping trae registros con nuevos IDs (NOTA: si las notificaciones se recrean – por duplicados – sus nuevos IDs no están en overlay y vuelven como unread).
4. El proceso de “marca leída” nunca se invoca en ese flujo de UI (tal vez otro componente marca diferente).
5. Múltiples pestañas: una pestaña antigua resetea almacenamiento (no hay sincr. cross-tab para forcedReadIds).
6. RLS bloquea UPDATE silenciosamente → `markRead()` retorna error no capturado y overlay falló.
7. El UPDATE se aplica pero lectura inmediata golpea réplica retrasada (replicación ≈ >1s) y overlay aún no consistente.
8. Se está usando distinto `userId` al leer vs escribir (`auth.uid()` ≠ `user_id`), provocando update nulo (0 filas afectadas).

## 4. Hipótesis (Priorizadas)

| Prob. | Hipótesis | Evidencia esperada | Cómo Confirmar |
|-------|-----------|--------------------|----------------|
| Alta | UPDATE no afecta filas (RLS / user mismatch) | 0 rows updated en logs | Añadir log de conteo de filas afectadas (RPC o Row Count) |
| Alta | IDs difieren tras F5 (notificaciones duplicadas nuevas) | Nuevo ID en respuesta inicial | Comparar arrays de IDs pre y post reload |
| Media | `forcedReadIds` no persiste (fallo storage) | `localStorage.notifications_forced_read` vacío | Abrir DevTools Application antes/después |
| Media | bootstrap pisa overlay por timing | Ventana breve unread → luego corrected (pero usuario recarga antes) | Insertar console.timeline para detectar | 
| Baja | Replica retrasada revertiendo verificación | SELECT inicial devuelve is_read=false aunque update se aplicó | Esperar >2s y reconsultar manualmente |
| Baja | Multi-tab revert | Otra pestaña bootstrap sin overlay limpia estado | Cerrar pestañas y reintentar |

## 5. Instrumentación Requerida (Siguiente Paso Crítico)

Agregar temporalmente (modo debug):
```js
// En notificationsStore.markAsRead dentro del bloque async
console.debug('[NotifDebug] markAsRead start', { ids });
// Antes de UPDATE
// Después de notificationService.markRead(ids)
console.debug('[NotifDebug] after markRead attempt', { attempt, ids });
// Después de verificación
console.debug('[NotifDebug] verification rows', rows);
// Al ajustar forcedReadIds
console.debug('[NotifDebug] forcedReadIds size', get().forcedReadIds.size);
```

Query manual para validar cambios en DB (en SQL editor):
```sql
select id, is_read, read_at from notifications
where id in (<lista_uuid>) order by created_at desc;
```

## 6. Diagnóstico Diferencial por Escenarios

### Escenario A: IDs Cambian
- Causa: Posible lógica que re-emite notificación (p.ej. function create_notification se ejecuta 2 veces) o se purgan y reinsertan.
- Prueba: Capturar lista de IDs antes de recarga (`window.__ids = notifications.map(n=>n.id)`). Después de F5 comparar.
- Solución: Desduplicar a nivel BD (unique constraint sobre (user_id, order_id, type, product_id) + ON CONFLICT DO NOTHING).

### Escenario B: UPDATE Bloqueado (RLS)
- Revisar políticas: Debe existir `UPDATE ON notifications FOR user USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- Si no, el update se ignora con error (o RLS denegado). 
- Solución: Asegurar política; o usar `rpc('mark_notifications_read', array)` que aplique seguridad interna.

### Escenario C: Falta de Flush Local
- Si `localStorage` está deshabilitado (modo incógnito + restricciones), overlay nunca se guarda.
- Solución: Fallback a `indexedDB` / `sessionStorage` / memoria con ping a backend.

### Escenario D: Multi-tab Overwrite
- Una pestaña aún no actualizada bootstrap y vuelve a reinyectar notificaciones antiguas, sin forcedReadIds, luego usas esa sesión.
- Solución: Añadir `storage` listener que re-sincronice forcedReadIds y re-aplique patch inmediatamente.

### Escenario E: Dedupe por ID Insuficiente (Duplicados Semánticos)
- La store sólo evita duplicados por `id`. Si se generan duplicados semánticos (misma semántica, distinto `id`), se re-contabilizan como unread cada emisión.
- Posible en: re-ejecución de `notifyNewOrder` (p.ej. se llama en dos rutas distintas) o triggers duplicados en DB.
- Confirmar: contar notificaciones con mismo `(user_id, order_id, type, role_context)` en ventana corta.

### Escenario F: Reordenamiento con Limit y Pérdida de Estado
- `fetchInitial` limita a 20; si el usuario marca leído una notificación que luego sale del top 20 (por llegada de muchas nuevas) y luego F5, esa notificación ya no está presente para reconciliar (irrelevante para badge global si se recalcula desde store parcial). Pero si el badge espera exactitud total, falta un conteo server-side.

### Escenario G: Mark Read Doble Camino y Condiciones de Carreras
- UI (al abrir tab 'unread') dispara `markUnreadTabAsRead` (batch 50). Simultáneamente el usuario hace click en una notificación individual que también llama `markAsRead`.
- Resultado: dos closures con la misma lista pero el primero retrasa overlay update de algunos IDs si se reasigna `ids` dentro del loop de retry.
- Revisar: en `markAsRead` se reasigna `ids = still;` dentro del bucle → Mutación de referencia exterior que podría afectar otro closure concurrente.

### Escenario H: Mutación de Variable `ids` dentro del Retry
- Código:
```js
for (...) {
   ...
   const still = rows.filter(r=>!r.is_read).map(r=>r.id);
   if (still.length === 0) { ... break; }
   // Reintentar sólo los que faltan
   ids = still; // <-- mutación
}
```
- Si `ids` es capturado por otras funciones asíncronas (p.ej. otro markAsRead inmediato), se desincroniza. Riesgo bajo pero real si dos ejecuciones se intercalan.
- Solución: usar variable local `remaining = [...ids]` y nunca mutar la original.

### Escenario I: Falta de Normalización de Timestamps
- `read_at` se setea con `new Date().toISOString()` lado cliente. Si el servidor también actualiza triggers (ej: default value), podría haber conflictos de replicación y estados divergentes en réplica vs primario.

### Escenario J: Filtro de Canal Realtime Correcto pero Potencial Lag
- Canal: `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.<id>' })`
- No se escuchan UPDATE; si backend marca como leído (actividad alternativa) el cliente no replica el cambio → posible reintroducción de unread tras F5.
- Mitigación: escuchar también UPDATE sobre `is_read` y aplicar patch en caliente.

### Escenario K: `unreadCount` Derivado Solo de Subconjunto
- Si existen >100 (MAX_CACHE) notificaciones unread, y se marcan algunas antiguas fuera del slice local, tras F5 el recálculo local no refleja total real. Puede percibirse como “volvieron” al bajar el número menos de lo esperado. (Sintomatología parecida a revertir estado.)

### Escenario L: Race entre Bootstrap y Reconciliación Buffer
- Orden actual en `useNotifications`:
   1. fetchInitial
   2. bootstrap(list)
   3. luego reconcilia buffer (`notifications_read_buffer`) y dispara `markAsRead` para pendientes.
- Ventana de ~ticks donde UI monta con unread antes de parche → usuario F5 rápido => persistente percepción de fallo.
- Optimización: Aplicar overlay + buffer antes de set inicial (pre-patch) o construir lista final antes de set.

### Escenario M: Ausencia de Index para ORDER BY estable
- `order('created_at', { ascending:false })` sin índice compuesto puede forzar seq scan y provocar latencias inconsistentes y reorder de ties (igual timestamp). Si dos notificaciones comparten el mismo `created_at` (ej: default now()), el orden relativo puede variar → algunas pasan dentro/fuera del límite de 20.

### Escenario N: Ambiente OneDrive + LocalStorage Edge Cases
- Carpeta del proyecto en OneDrive puede inducir recargas y hard refresh del dev server; si el estado de desarrollo hace HMR parcial, `localStorage` permanece pero la store se reinicializa sin overlay aplicado correctamente si fallo de parse (e.g. JSON truncado por write interrumpido). Necesario robustecer parse con validación.

## 6.1 Auditoría Exhaustiva de Cada Módulo

### A. `notificationsStore.js`
Hallazgos profundos:
- Carga inicial de `forcedReadIds`: se instancia Set con array; si la lectura de localStorage produce objeto grande, Set conserva orden de inserción pero irrelevante.
- `bootstrap`: aplica overlay correctamente. OK.
- `add`: sólo dedupe por `id` → ver Escenario E.
- `markAsRead`:
   * Mutación de `ids` dentro del bucle (Escenario H).
   * `pendingMarkReadIds` declarado pero no usado (técnica potencial para consolidar). Esto es deuda técnica.
   * No hay control de concurrencia (si se llama 2 veces superpuesto, efectos intercalados).
   * Retry máximo 4 intentos (~3.8s) luego abandona sin marcar fallback adicional distinto de overlay (overlay ya hecho). Correcto para UX pero oculta root cause.
   * No se agrega instrumentation detallada (falta row_count, error codes). Añadir.
   * Limpieza de buffer elimina todos ids si confirmados; si parcialmente confirmados, el `ids` mutado hace que subset confirmado se pierda del scope externo (safe) pero subóptimo.

### B. `useNotifications.js`
- Bootstrap asincrónico sin cancelación de petición de verificación si user cambia rápido (posible memory leak leve). Minor.
- Reconciliación buffer se apoya en `initial` (estado pre-mark). Si notificaciones nuevas llegan mientras se procesa, podrían no incluirse en ese batch de re-marcado.
- `markUnreadTabAsRead`: recorta a 50; si hay más, quedan unread silenciosos hasta scroll o nueva acción. Puede causar confusión.
- No hay listener a `storage` para cross-tab sync → ver Escenario D.
- Realtime sólo INSERT → no refleja actualizaciones server-driven (Escenario J).

### C. `notificationService.js`
- `markRead` no retorna filas afectadas; no se puede diagnosticar si se actualizaron 0/ n filas.
- `notifyNewOrder` llama RPC por cada ítem (buyer) y luego por cada supplier. Latencia N+S RPCs. Posible duplicación si la function que llama a `notifyNewOrder` se invoca más de una vez (p.ej. a nivel confirmación pago y a nivel creación). Falta un guardado transaccional.
- `pending` hardcodeado en `p_order_status` → si hay segunda notificación “order_paid” se generará otra sin invalidar la primera (potencial ruido).

### D. UI Componentes (`NotificationBell`, `NotificationListPanel`)
- `NotificationListPanel` no ofrece gesto de “Marcar todo como leído” global (solo tab unread). Podría encadenar muchos updates individuales.
- Al hacer click en un item se espera un handler externo (no leído en este archivo) que probablemente llama `markAsRead([id])`. Confirmar pipeline.

### E. Provider (`NotificationProvider.jsx`)
- Efecto de bienvenida podría crear notificación duplicada si `needsOnboarding` no se resetea rápido. Confirmar que backend evita duplicados.

## 6.2 Interacciones Críticas (Secuencias de Carrera)

1. Usuario abre panel → Tab "unread" dispara `markUnreadTabAsRead` (async) → overlay set.
2. Antes de terminar retry, llega INSERT realtime de misma notificación (duplicado) → `add` no la dedupe (si ID distinto) → unreadCount++.
3. Usuario recarga: bootstrap trae ambas (la original con is_read true, la duplicada unread) → síntoma de “volvió”.

Secuencia Alterna (RLS):
1. `markAsRead` lanza UPDATE (0 filas afectadas) → verificación select devuelve is_read=false → reintentos fallan.
2. Loop termina; overlay sí la cubre.
3. Usuario abre en otra máquina/pestaña que no posee overlay → aparece unread (percepción de inconsistencia multi-dispositivo).

## 6.3 Riesgos de Escalado

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Crecimiento de buffer local | Uso de almacenamiento, parse lento | GC tras confirmación parcial + límite (e.g. 500 IDs) |
| Repetición RPC por ítem | Coste y duplicados | Agrupar RPC batch server-side |
| Falta de índices | Latencia y reorder | Crear índices recomendados |
| Concurrencia markRead | Estado divergente local vs server | Cola interna secuencial |

## 6.4 Índices Recomendados

```sql
-- Orden principal
create index if not exists idx_notifications_user_created_desc
   on notifications (user_id, created_at desc);

-- Dedupe semántico
create unique index if not exists uniq_notification_semantic
   on notifications (user_id, coalesce(order_id,'00000000-0000-0000-0000-000000000000'), coalesce(product_id,'00000000-0000-0000-0000-000000000000'), type, role_context);

-- Filtro por unread (si consultas específicas)
create index if not exists idx_notifications_user_unread
   on notifications (user_id) where is_read = false;
```

## 6.5 RPC Propuesto (Atomicidad + Row Count)

```sql
create or replace function mark_notifications_read(p_ids uuid[])
returns table(id uuid, updated boolean) as $$
begin
   update notifications n
      set is_read = true, read_at = now()
   where n.id = any(p_ids) and n.user_id = auth.uid();

   return query
      select n.id, n.is_read as updated
      from notifications n
      where n.id = any(p_ids);
end; $$ language plpgsql security definer;
```

Ventaja: una sola llamada, retorno exhaustivo para ver cuáles fallaron.

## 6.6 Refactor Cliente Sugerido (Pseudo)

```js
async function markReadAtomic(ids) {
   queue.enqueue(async () => {
      overlayAdd(ids);
      const { data, error } = await supabase.rpc('mark_notifications_read', { p_ids: ids });
      if (error) log(error);
      const failed = data.filter(r => !r.updated).map(r=>r.id);
      if (failed.length) scheduleRetry(failed);
   });
}
```

## 6.7 Métricas y Telemetría a Capturar

| Evento | Datos | Uso |
|--------|-------|-----|
| mark_read_attempt | ids, attempt, duration, row_count | detectar RLS / latencia |
| mark_read_fail | ids, error_code | alertas |
| duplicate_detected | id_original, id_nuevo, hash_semantico | calibrar índice único |
| realtime_gap | gap_ms | fallback a polling |

## 6.8 Plan de Remediación Expandido (Versión Detallada)

1. Instrumentar (telemetría + logs). Tiempo estimado: 0.5h.
2. Añadir RPC atómico + índices. 0.5h.
3. Implementar cola secuencial para `markAsRead`. 0.5h.
4. Escuchar UPDATE realtime (is_read) para sync cross-device. 0.25h.
5. Storage listener cross-tab. 0.25h.
6. Dedupe semántico (unique index) y manejo de conflicto (DO NOTHING). 0.5h.
7. Refactor overlay para aplicar durante bootstrap antes de primer render (pre-hidratar). 0.25h.
8. Test automatizado de regresión (mock Supabase). 1h.

Total estimado ≈ 3.75h – 4h.

## 6.9 Test Cases Concretos

1. Single mark read persists after reload.
2. Batch (50) mark read (más de 20 visibles) — todos overlayed y confirmados (simulate >20 items).
3. Duplicate emission prevention (enviar misma notificación semántica dos veces => segunda ignorada).
4. Cross-tab sync: pestaña A marca leído, pestaña B recibe UPDATE y oculta badge.
5. RLS denial simulation => overlay presente + métrica fail registrada.

## 6.10 Posible Root Cause Más Probable (Síntesis)

Combinación de (a) duplicados semánticos con nuevos IDs y (b) ausencia de escucha UPDATE (si backend alguno marca) + (c) retry silencioso sin row_count. La falta de evidencia de filas actualizadas oculta el fallo estructural.

## 7. Falencias en el Diseño Actual

| Área | Observación | Mejora |
|------|-------------|--------|
| Consistencia fuerte | Dependemos de UI + overlay; BD puede quedar desfasada | Migrar a comando atómico (RPC) que retorne filas afectadas |
| Idempotencia | No hay hash de notificación para evitar duplicados | Índice único lógico |
| Reconciliación | Solo en bootstrap inicial | Re-run overlay post INSERT realtime |
| Observabilidad | Sin métricas de éxito / fallo | Tabla `notification_read_events` opcional |

## 8. Plan de Acción Recomendado (Escalonado)

1. (Diagnóstico) Instrumentar logs temporales + query manual de IDs.
2. (Backend) Crear función segura:
   ```sql
   create or replace function mark_notifications_read(p_ids uuid[])
   returns int as $$
   begin
     update notifications set is_read = true, read_at = now()
     where id = any(p_ids) and user_id = auth.uid();
     get diagnostics integer_result = row_count;
     return integer_result;
   end; $$ language plpgsql security definer;
   ```
3. (Frontend) Reemplazar `notificationService.markRead(ids)` por RPC que devuelve `rows_updated`; si 0 → log warning "RLS_BLOCK".
4. (Integridad) Implementar índice único preventivo de duplicados:
   ```sql
   create unique index if not exists uniq_notification_semantic
     on notifications (user_id, coalesce(order_id,'00000000-0000-0000-0000-000000000000'), coalesce(product_id,'00000000-0000-0000-0000-000000000000'), type, role_context);
   ```
5. (Cross-tab) Añadir listener `storage` para `notifications_forced_read` y re-aplicar patch en vivo.
6. (UI) Post INSERT realtime: re-aplicar overlay (ya se hace parcialmente, reforzar). 
7. (Cleanup) Cuando verificación BD confirma todos, limpiar de buffer para evitar crecimiento infinito.

## 9. Verificación de Éxito

Métricas:
- `read_persist_latency = read_confirmed_ts - ui_mark_ts` (objetivo < 1s p95).
- `read_persist_fail_rate = failed_updates / total_mark_reads` (objetivo < 0.5%).

Prueba de Regresión Automatizable (Pseudo):
```js
// 1. Sembrar 2 notificaciones unread vía seed test.
// 2. Render hook useNotifications -> esperar bootstrap.
// 3. markAsRead(ids)
// 4. Esperar flush.
// 5. Forzar reinicialización store (simular reload) usando nuevo provider.
// 6. Afirmar: todas is_read===true.
```

## 10. Checklist de Causas No Confirmadas (Pendientes)

- [ ] Confirmar row_count de UPDATE (log temporal).
- [ ] Verificar si existen notificaciones duplicadas (misma semántica distinto ID).
- [ ] Revisar políticas RLS `notifications` (dump de `pg_policies`).
- [ ] Confirmar existencia de `forcedReadIds` en localStorage tras marcar.
- [ ] Capturar screenshot de DevTools > Network para llamada markRead.

## 11. Conclusión

El síntoma persiste probablemente porque el UPDATE en BD no se aplica (RLS o mismatch) **o** porque el usuario visualiza nuevas filas duplicadas (IDs distintos) no cubiertas por overlay. Antes de iterar más en el cliente, se necesita evidencia objetiva del row_count y duplicación. La solución robusta pasa por: (a) RPC atómico con row_count + logs, (b) índice único semántico, (c) reconciliación cross-tab y (d) overlay sólo como fallback, no fuente primaria.

---
_Documento generado para diagnosticar y guiar la próxima iteración. Mantener actualizado conforme se validen hipótesis._
