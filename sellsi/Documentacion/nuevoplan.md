# Nuevo Plan de Endurecimiento (Post FIXES_INMEDIATOS) - Versión Corregida

Fecha: 2025-08-15 (Actualizado)
Estado actualizado: Advisory lock, tabla de jobs, RPCs, staging de orphans, refactor daily-cleanup, funciones Edge (generate-thumbnail, purge-orphans, retry-thumbnail-jobs), vistas de métricas y RLS base ACTIVADO. Dashboard final pendiente.

## Alcance
Implementar 5 mejoras de mayor valor:
1. RPC con advisory lock (atomicidad inicial perfecta)
2. Edge Function usando SERVICE_ROLE + preparación para RLS
3. Tracking y retries: tabla `image_thumbnail_jobs`
4. Limpieza programada de thumbnails huérfanos (storage hygiene)
5. Constraints adicionales (CHECK, FK, updated_at trigger)

## Resumen Ejecutivo
Estas acciones reducen errores esporádicos bajo alta concurrencia, facilitan observabilidad de generación de thumbnails, previenen deuda de integridad y preparan el sistema para activar RLS sin fricción futura.

---
## Estado Actual (15-08-2025)
| Nº | Componente | Descripción | Estado | Detalles |
|----|------------|-------------|--------|----------|
| 1  | RPC Advisory Lock | Función `insert_image_with_order` con `pg_advisory_xact_lock` | COMPLETADO | Migración 20250815120000 |
| 5  | Constraints / updated_at | Columna `updated_at`, trigger, CHECK >=0, FK CASCADE | COMPLETADO | Phase2 misma migración |
| 2  | Edge SERVICE_ROLE | `generate-thumbnail` usando SERVICE_ROLE (fallback anon) | COMPLETADO | Variable service role requerida en deploy |
| 3  | image_thumbnail_jobs | Tabla + estados + RPCs + attempts | COMPLETADO | Migraciones 15130000 / 15131000 + Edge instrumentado |
| 4  | Orphans Staging | Tabla `image_orphan_candidates` + daily-cleanup staging | COMPLETADO | Migración 15132000 + refactor daily-cleanup |
| 6  | RLS product_images | Activar RLS tras periodo estable | COMPLETADO | Migración 20250815140000 |
| 12 | RLS final | Habilitado (políticas lectura) | COMPLETADO | Ajustar si se limita lectura pública |
| 7  | Purge físico orphans | Edge `purge-orphans` + función SQL lógica | COMPLETADO | Edge creada, requiere deploy |
| 8  | Retry processor | Edge `retry-thumbnail-jobs` | COMPLETADO | Reintentos attempts < MAX |
| 9  | Métricas vistas | Vistas overview / jobs / orphans | COMPLETADO | Migración 15133000 |
| 10 | Stress test formal | Ejecución y registro resultados | PENDIENTE | Script removido, se puede recrear si se necesita |
| 11 | Dashboard / Alertas | Panel + alertas básicas | PENDIENTE | Consumir vistas métricas |
| 12 | RLS final | Habilitar y validar flows | PENDIENTE | Después de dashboard |

Resumen: Núcleo de consistencia + observabilidad, hygiene y RLS base implementados; falta dashboard/alertas y posible endurecimiento extra de lectura.

---
## 1. RPC con Advisory Lock
Objetivo: Eliminar la ventana residual previa a la primera inserción de un producto (ya minimizada por índice único) y garantizar serialización limpia sin depender de conflictos 23505.

Decisión: Usar `pg_advisory_xact_lock(hashtext(p_product_id::text))` (simple & suficiente). No se usará MD5→bit(64) salvo que más adelante se quiera uniformidad con otras llaves.

Implementación propuesta:
```sql
CREATE OR REPLACE FUNCTION insert_image_with_order(
	p_product_id uuid,
	p_image_url text,
	p_supplier_id uuid
) RETURNS integer AS $$
DECLARE
	v_next integer;
BEGIN
	PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text));
	SELECT COALESCE(MAX(image_order), -1) + 1
		INTO v_next
		FROM product_images
		WHERE product_id = p_product_id; -- FOR UPDATE opcional, no requerido con advisory lock

	INSERT INTO product_images (product_id, image_url, image_order)
	VALUES (p_product_id, p_image_url, v_next);
	RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Validación concurrencia:
1. 10 llamadas paralelas → secuencia 0..9.
2. Repetir varias veces → sin huecos ni errores.

Riesgos: Mínimos. Lock granular, transacción corta.

---
## 2. Edge Function con SERVICE_ROLE + Preparar RLS
Objetivo: Evitar futuros fallos silenciosos si se activa RLS; endurecer seguridad.

Estrategia:
- Agregar variable `SUPABASE_SERVICE_ROLE_KEY` en entorno (no exponer al cliente).
- Edge: crear client secundario con service role para operaciones UPDATE.
- Esbozar políticas RLS (inicialmente desactivadas) documentadas para activación futura.

Cambios en Edge (pseudo):
```ts
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseSr = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
// Usar supabaseSr para UPDATE product_images
```

Políticas futuras (cuando se active RLS):
```sql
REVOKE INSERT, UPDATE, DELETE ON product_images FROM anon, authenticated;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_images_select_public ON product_images FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE pasarán únicamente por funciones SECURITY DEFINER (sin políticas adicionales).
```

Validación:
- Desactivar temporalmente anon UPDATE y confirmar que Edge con service role sigue funcionando.

Riesgos: Requiere proteger variable service role (solo en Edge runtime).

---
## 3. Tabla image_thumbnail_jobs (Tracking + Retries)
Objetivo: Observabilidad y reintentos automáticos de generación de thumbnails.

Estructura propuesta (añadimos product_image_id para diagnósticos):
```sql
CREATE TABLE IF NOT EXISTS image_thumbnail_jobs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL,
	product_image_id uuid,
	status text NOT NULL CHECK (status IN ('queued','processing','success','error')),
	attempts int NOT NULL DEFAULT 0,
	last_error text,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_image_thumbnail_jobs_status ON image_thumbnail_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_thumbnail_jobs_product ON image_thumbnail_jobs(product_id);
```

Flujo:
1. UploadService (cuando order=0) crea registro (queued) opcional (o Edge lo crea al inicio).
2. Edge al iniciar: UPDATE → status=processing, attempts = attempts+1.
3. Edge éxito: status=success, limpia last_error.
4. Edge fallo: status=error, guarda mensaje.
5. Job reprocessor (cron): reintenta rows `status='error' AND attempts < 3`.

Edge ajustes mínimos:
- Insert/Upsert job si no existe.
- Wrappers para cambiar estado.

Métricas derivables: tasa de éxito, errores recientes, latencia (difference created_at vs updated_at success).

---
## 4. Limpieza Programada de Thumbnails Huérfanos
Situación actual: `daily-cleanup` ya elimina huérfanos directamente.

Plan endurecido: Introducir fase de staging para observabilidad antes de borrar:
1. Ajustar daily-cleanup → en lugar de eliminar, insertar en `image_orphan_candidates`.
2. Job/pipeline secundario: borra paths con >7 días y setea `confirmed_deleted_at`.
3. Si la referencia reaparece antes del purge se elimina la fila staging (falso positivo).

Tabla staging:
```sql
CREATE TABLE IF NOT EXISTS image_orphan_candidates (
	path text PRIMARY KEY,
	detected_at timestamptz DEFAULT now(),
	confirmed_deleted_at timestamptz,
	last_seen_reference timestamptz
);
```

Indicador clave: ratio (falsos candidatos / candidatos totales) → debe tender a ~0 antes de activar purge automático.

---
## 5. Constraints Adicionales (Integridad + Auditoría)
Objetivo: Sellar invariantes y mejorar trazabilidad.

Acciones (ajustado a esquema real `products(productid)`):
```sql
ALTER TABLE product_images
	ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION set_product_images_updated_at() RETURNS trigger AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_images_updated_at') THEN
		DROP TRIGGER trg_product_images_updated_at ON product_images;
	END IF;
	CREATE TRIGGER trg_product_images_updated_at BEFORE UPDATE ON product_images
	FOR EACH ROW EXECUTE FUNCTION set_product_images_updated_at();
END $$;

ALTER TABLE product_images
	ADD CONSTRAINT IF NOT EXISTS chk_image_order_nonneg CHECK (image_order >= 0);

-- Re-crear FK con ON DELETE CASCADE sólo si falta CASCADE
DO $$
DECLARE fk_name text; needs_change boolean := false; BEGIN
	SELECT conname INTO fk_name FROM pg_constraint c
	JOIN pg_class t ON t.oid = c.conrelid
	WHERE t.relname='product_images' AND c.contype='f'
		AND pg_get_constraintdef(c.oid) LIKE 'FOREIGN KEY (product_id)%products%';
	IF fk_name IS NOT NULL THEN
		SELECT NOT (pg_get_constraintdef(c.oid) ILIKE '%ON DELETE CASCADE%') INTO needs_change FROM pg_constraint c WHERE c.conname=fk_name;
	END IF;
	IF fk_name IS NOT NULL AND needs_change THEN
		EXECUTE format('ALTER TABLE product_images DROP CONSTRAINT %I', fk_name);
	END IF;
	IF fk_name IS NULL OR needs_change THEN
		ALTER TABLE product_images ADD CONSTRAINT product_images_product_id_fkey
			FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE;
	END IF;
END $$;
```

Nota: NO usar `products(id)`; la PK real es `products(productid)`.

Validación:
- Verificar EXPLAIN en consultas por (product_id, image_order) sin regresión.
- Eliminar un producto de prueba y confirmar cascada.

---
## Orden de Implementación Recomendado (Actualizado)
0. Confirmar plan (este documento)
1. Migración: advisory lock + constraints + updated_at trigger + (si aplica) FK CASCADE
2. Edge generate-thumbnail: soporte SERVICE_ROLE (sin activar RLS todavía)
3. Crear tabla jobs + instrumentar Edge (estados y attempts)
4. Ajustar daily-cleanup → staging orphans + crear tabla orphans
5. Cron purge orphans + métrica falsos positivos
6. Activar RLS (cuando métricas estables y dashboard jobs listo)

## Rollout & Rollback
- RPC + constraints: ejecutar en una sola migración (atómica). Rollback = re-crear función vieja + DROP de constraints si necesario.
- updated_at trigger: DROP TRIGGER + DROP FUNCTION para revertir.
- Jobs / Orphans: DROP TABLE ... (sin impacto colateral).
- RLS: reversible con DISABLE RLS + restaurar GRANTs.
- Feature flags: reintentos >1 y purge físico sólo tras >=7 días de métricas correctas.

## Métricas a Monitorear
- Duplicados (product_id,image_order) = 0
- Secuencia sin huecos en stress test
- Thumbnails pendientes (queued+error) < umbral
- Ratio errores/attempts jobs < X%
- Tiempo medio generación (p95) estable
- Orphans staging vs confirmados (falsos positivos ≈ 0)
- Edge 5xx diarios < X

## Cierre
Tras aplicar este plan: concurrencia totalmente serializada, camino claro hacia RLS, observabilidad de thumbnails, higiene de storage controlada y métricas accionables para mantenimiento proactivo.

---
## Próximos Pasos Inmediatos (Post-Implementación Base)
1. Deploy de nuevas Edge Functions: generate-thumbnail (actualizada), daily-cleanup (refactor), purge-orphans, retry-thumbnail-jobs.
2. Configurar secrets en entorno (SERVICE_ROLE_KEY, CLEANUP_SECRET_TOKEN, PURGE_SECRET_TOKEN, RETRY_SECRET_TOKEN, THUMBNAIL_MAX_ATTEMPTS si distinto de 5).
3. Ejecutar stress test manual (opcional) o recrear script para documentar secuencia sin gaps.
4. Construir dashboard (consumir vistas métricas) + definir umbrales alertas (ej. error jobs > 5%).
5. Activar RLS (cuando métricas estables) siguiendo políticas ya documentadas.

## Criterios de Cierre por Fase
- Fase Consistencia (1,5): ✅ (ya aplicada).
- Fase Observabilidad (2,3): Termina cuando jobs muestran latencia y errores < umbral definido.
- Fase Hygiene (4): Termina cuando falsos positivos orphans ≈ 0 durante 7 días.
- Fase Seguridad (6): Termina cuando RLS activa sin romper flujos de upload/thumbnail.

## Checklist Operativo Rápido (Actual)
- [x] Advisory lock activo
- [x] CHECK image_order >= 0
- [x] Trigger updated_at
- [x] Edge SERVICE_ROLE
- [x] Tabla jobs + instrumentación + RPCs
- [x] Tabla orphans + staging + purge function
- [x] Retry processor (Edge) + purge-orphans Edge
- [x] Vistas métricas
- [x] RLS habilitado
- [ ] Dashboard / Alertas (pendiente)
- [ ] Endurecer RLS (lectura sólo autenticados) opcional

## Notas de Verificación Post-Migración
- Confirmar `SELECT insert_image_with_order(<pid>, 'url', null)` se ejecuta sin bloqueos cruzados bajo carga.
- Verificar constraint presente: `\d product_images` (CHECK y FK ON DELETE CASCADE).
- Asegurar nuevas filas reciben `updated_at` distinto a `created_at` tras un UPDATE artificial.

Fin del documento.

