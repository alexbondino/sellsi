# Despliegue de la migración: Unificación del modelo de estados de órdenes

## Resumen
Esta documentación explica en detalle por qué se aplicó la migración `20250813223000_unify_order_status.sql`, qué cambios introduce en la base de datos y el checklist completo de verificación y acciones post‑deploy necesarias para dejar el sistema en un estado seguro y coherente.

## Objetivo de la migración
La migración transforma a la tabla `orders` en la fuente de verdad (canónica) del ciclo de vida de los pedidos. Antes existía lógica repartida entre `orders` y `carts` para representar estados de cumplimiento (fulfillment), lo que causaba confusión, inconsistencias y bugs en la UI (por ejemplo: "En Transito" que no coincidía con la DB). Al unificar el modelo:

- `orders.status` será el campo canónico con valores en un conjunto controlado (pending, accepted, in_transit, delivered, completed, cancelled, rejected).
- Se añaden columnas de auditoría de tiempo (accepted_at, dispatched_at, delivered_at, cancelled_at) para trazar transiciones temporales.
- Se añade `fulfillment_status` como columna opcional para casos futuros donde se quiera separar dimensión logística sin romper `status`.
- Se crea un trigger `orders_status_audit` que auto‑puebla timestamps al cambiar el `status`.
- Se aplica un CHECK constraint (`orders_status_allowed`) para asegurar integridad de valores en `status`.

## ¿Por qué es necesario aplicar esta migración ahora?
1. Coherencia: elimina la fuente de inconsistencias entre `carts` y `orders`.
2. Observabilidad: timestamps automáticos y columnas nuevas facilitan auditar y depurar flujos de pedidos.
3. Seguridad y validación: la constraint previene valores inesperados que luego generan errores en UI/logic.
4. Preparación para futuras funcionalidades: persistir el `tax_document_path` en `orders` y respaldar el flujo de aceptación.

## Riesgos y mitigaciones
- Constraint estricto: si existen valores no esperados en `status`, la nueva CHECK bloqueará escrituras. Mitigación: la migración normaliza varios labels en español y backfills 'paid' → 'accepted', 'completed' → 'delivered'. Aun así, verificar con una consulta de conteo antes de aplicar en prod.
- Triggers vs edge functions: doble timestamping si los edge functions también intentan escribir timestamps. Mitigación: dejar que el trigger realice timestamps y ajustar las funciones para no sobreescribirlos.
- Backups: siempre crear snapshot/backup antes de aplicar a producción. Mitigación: ejecutar el deploy primero en staging.

## Checklist previo al deploy (staging)
- [ ] Hacer backup/snapshot de la base de datos de staging.
- [ ] Revisar valores de `status` existentes: `SELECT status, COUNT(*) FROM public.orders GROUP BY status;` y corregir manualmente valores no canónicos si hay.
- [ ] Revisar código que escribe a `carts` o lee `carts.status` para planear refactor.
- [ ] Avisar ventana de mantenimiento breve si aplica para producción.

## Comandos recomendados para aplicar la migración (desde repo raíz)
Opción A — Supabase CLI (recomendado):
```powershell
# Tener supabase CLI instalado y autenticado con PAT
npx supabase link --project-ref clbngnjetipglkikondm
npx supabase migration up --project-ref clbngnjetipglkikondm
```

Opción B — psql directo:
```powershell
$env:PGPASSWORD = '<DB_PASSWORD>'
psql -h clbngnjetipglkikondm.supabase.co -p 5432 -U postgres -d postgres -f "supabase\migrations\20250813223000_unify_order_status.sql"
```

## Verificaciones inmediatas (post‑migración)
Ejecutar estas consultas y comparar resultados con lo esperado:

- Columnas nuevas:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name IN ('fulfillment_status','accepted_at','dispatched_at','delivered_at','cancelled_at');
```

- Constraint aplicado:
```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.orders'::regclass AND contype = 'c';
```

- Estado de los pedidos:
```sql
SELECT status, COUNT(*) FROM public.orders GROUP BY status ORDER BY 2 DESC;
```

- Trigger y función existen:
```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.orders'::regclass;
SELECT proname FROM pg_proc WHERE proname = 'orders_status_audit';
```

## Acciones post‑deploy en el código (mínimo)
1. Backend / Edge Functions
   - Actualizar funciones que modifican estados para escribir `orders.status` en lugar de `carts`.
   - Evitar establecer timestamps manualmente si el trigger ya lo hace.
   - Revisar y adaptar queries que filtraban por `carts`.

2. Frontend
   - Introducir un módulo de constantes con statuses canónicos.
   - Mapear estados canónicos a etiquetas y colores en la UI.
   - Eliminar deducción de estado basada en `carts`.

3. Persistencia de documentos
   - Añadir columna o tabla para `tax_document_path` si no existe y adaptar el servicio de subida a esa columna.

4. Testing
   - Testear flujos: pending → paid → accepted → in_transit → delivered y confirmar timestamps.
   - Integración: comprobar proceso de aceptación con carga de PDF y bloqueo de aceptación si falta.

## Verificación de sanidad de datos (post‑migración)
- Confirmar que `accepted_at` y `delivered_at` se rellenaron para filas con legacy 'paid' y 'completed' respectivamente.
- Ejecutar la consulta de filas no canónicas (debe devolver 0 filas):
```sql
SELECT status, COUNT(*) FROM public.orders GROUP BY status HAVING status NOT IN ('pending','accepted','in_transit','delivered','completed','cancelled','rejected');
```

## Rollback y contingencia
- Crear un snapshot antes de aplicar a producción.
- Preparar script inverso si fuese necesario (ELIMINAR constraint y columnas nuevas), pero la opción más segura es restaurar snapshot.

## Notas operativas y de seguridad
- Rotar credenciales expuestas (DB password, Gmail app password, Resend API key) inmediatamente si alguna estuvo en repo.
- Mantener `.env` en `.gitignore` (ya está) y no subir secretos al repo.

## Próximos pasos sugeridos
1. Ejecutar migración en staging y pegar aquí la salida de verificación (columnas, conteo de status, trigger list).
2. Si todo está OK, planificar ventana para prod y ejecutar con backup.
3. Tras deploy en prod, ejecutar los cambios de código (PRs automáticos recomendados) para que la app utilice el nuevo modelo canónico.

---

Documento generado automáticamente como paso intermedio para coordinar el despliegue de la migración de unificación de estados.