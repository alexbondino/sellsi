# Sistema de Métricas y Observabilidad (Edge Functions + Dominio)

> Objetivo: Definir qué ya se mide, brechas y cómo instrumentar métricas accionables para un dashboard frontend (fiabilidad, performance, conversión, operaciones y seguridad) con el menor costo y complejidad posible.

## 1. Estado Actual (Tablas / Logs Existentes)

| Área | Tabla / Recurso | Qué aporta hoy | Limitaciones |
|------|-----------------|----------------|--------------|
| Pagos Khipu | `orders` | Estados (`pending`, `paid`, etc.), timestamps parciales | No registra latencia create→paid ni expiraciones explícitas |
| Webhooks Khipu | `khipu_webhook_logs` | Payload, signature_header, processed flag, error_message | Falta `order_id` normalizado, validez de firma, latencia al procesar, categoría de error |
| Generación Thumbnails | `image_thumbnail_jobs` | `status`, `attempts`, `last_error`, `created_at/updated_at` | Falta duración, tamaños bytes, timestamps inicio/fin, código de error estándar |
| Limpieza Storage (daily) | `storage_cleanup_logs` | `products_processed`, `files_removed`, `execution_time_ms`, `errors[]`, `success`, `trigger_type` | Falta `stagedCandidates` (ahora lo calculamos pero no se persiste), ratio éxito, versión función |
| Huérfanos Storage | `image_orphan_candidates` | Staging de rutas huérfanas (detección) | No registra quién las purgó ni historial de purgas |
| Purgado Huérfanos | (no table) | — | Sin métricas de purga física |
| Ventas / Conversión | `orders`, `payment_transactions`, `sales`, `product_sales` | Métricas de negocio posteriores a pago | Necesita vistas agregadas para dashboards rápidos |
| Inventario | `products.productqty` | Stock | No hay métricas tiempo real de decrecimiento por pago |
| Seguridad Admin | `admin_audit_log` | Acciones panel admin | No se registran aún acciones 2FA específicas (pueden integrarse) |
| IP Tracking | `users.last_ip`, `banned_ips` | Última IP y baneos | Falta historial de cambios (detección anomalías) |

## 2. Brechas Clave
1. No existe capa transversal de invocaciones de Edge Functions (latencia / error rate por función).
2. Falta normalizar y enriquecer logs de Khipu (trazabilidad pedido ↔ webhook). 
3. Métricas de performance de thumbnails incompletas (no sabemos peso original ni tiempo exacto). 
4. Procesos de mantenimiento (purge, retry) sin logs persistentes. 
5. Ausencia de vistas agregadas optimizadas para dashboard (hoy el frontend tendría que hacer queries crudas costosas). 
6. Seguridad / anomalías IP y 2FA sin histórico explotable. 

## 3. Principios de Diseño de Métricas
* Minimal overhead: Insert 1 fila ligera por invocación (sin payloads completos). 
* Evitar almacenar datos sensibles (token, secrets, IP solo si necesario). 
* Normalizar categoría de error (códigos cortos) para gráficos. 
* Vistas derivadas / materializadas para dashboards (p50/p95) → consultas rápidas. 
* Idempotencia / bajo riesgo: tablas append-only o columnas nuevas NULL-safe. 

## 4. Nuevas Tablas Propuestas

### 4.1. edge_function_invocations (Core Observability)
Captura una fila por ejecución (exitoso o fallo). 
```sql
CREATE TABLE public.edge_function_invocations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	function_name text NOT NULL,
	request_id uuid DEFAULT gen_random_uuid(),
	started_at timestamptz NOT NULL DEFAULT now(),
	finished_at timestamptz,
	duration_ms integer,
	status text NOT NULL CHECK (status IN ('success','error')),
	error_code text,               -- corto: validation_error / upstream_timeout / db_error / auth_error
	error_message text,            -- truncado (<300 chars)
	request_origin text,           -- header origin (si aplica)
	request_ip text,               -- sólo si es necesario (edge)
	input_size_bytes integer,
	output_size_bytes integer,
	meta jsonb,                    -- campos específicos (e.g. order_id, product_id)
	created_at timestamptz DEFAULT now()
);
CREATE INDEX edge_fn_invocations_fn_started_idx ON public.edge_function_invocations(function_name, started_at DESC);
CREATE INDEX edge_fn_invocations_status_idx ON public.edge_function_invocations(status) WHERE status='error';
```

### 4.2. purge_orphans_logs
```sql
CREATE TABLE public.purge_orphans_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	executed_at timestamptz NOT NULL DEFAULT now(),
	attempted integer NOT NULL,
	purged integer NOT NULL,
	errors jsonb DEFAULT '[]'::jsonb,
	execution_time_ms integer,
	success boolean GENERATED ALWAYS AS (purged = attempted AND errors = '[]'::jsonb) STORED
);
CREATE INDEX purge_orphans_logs_exec_idx ON public.purge_orphans_logs(executed_at DESC);
```

### 4.3. thumbnail_retry_runs
```sql
CREATE TABLE public.thumbnail_retry_runs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	started_at timestamptz DEFAULT now(),
	finished_at timestamptz,
	processed integer NOT NULL,
	retried integer NOT NULL,
	success integer NOT NULL,
	errors integer NOT NULL,
	duration_ms integer,
	error_samples jsonb DEFAULT '[]'::jsonb
);
```

### 4.4. product_cleanup_logs
```sql
CREATE TABLE public.product_cleanup_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL,
	supplier_id uuid,
	action text NOT NULL CHECK (action IN ('deleted','soft_deleted')),
	images_removed integer DEFAULT 0,
	thumbnails_removed integer DEFAULT 0,
	documents_removed integer DEFAULT 0,
	started_at timestamptz DEFAULT now(),
	finished_at timestamptz,
	duration_ms integer,
	error_code text,
	error_message text
);
CREATE INDEX product_cleanup_logs_prod_idx ON public.product_cleanup_logs(product_id, started_at DESC);
```

### 4.5. ip_change_log (Opcional Seguridad)
```sql
CREATE TABLE public.ip_change_log (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
	previous_ip text,
	new_ip text NOT NULL,
	changed_at timestamptz NOT NULL DEFAULT now(),
	user_agent text
);
CREATE INDEX ip_change_log_user_idx ON public.ip_change_log(user_id, changed_at DESC);
```

## 5. Cambios / Extensiones en Tablas Existentes

### 5.1. khipu_webhook_logs
```sql
ALTER TABLE public.khipu_webhook_logs
	ADD COLUMN order_id uuid,
	ADD COLUMN signature_valid boolean DEFAULT true,
	ADD COLUMN category text,               -- e.g. payment_paid / invalid_signature / parse_error
	ADD COLUMN processing_latency_ms integer; -- processed_at - created_at
CREATE INDEX khipu_webhook_logs_order_idx ON public.khipu_webhook_logs(order_id);
```

### 5.2. image_thumbnail_jobs
```sql
ALTER TABLE public.image_thumbnail_jobs
	ADD COLUMN started_at timestamptz,
	ADD COLUMN completed_at timestamptz,
	ADD COLUMN duration_ms integer,
	ADD COLUMN bytes_original integer,
	ADD COLUMN bytes_generated_total integer,
	ADD COLUMN error_code text; -- Normalizar last_error
CREATE INDEX image_thumbnail_jobs_status_idx ON public.image_thumbnail_jobs(status, updated_at DESC);
```

### 5.3. storage_cleanup_logs
```sql
ALTER TABLE public.storage_cleanup_logs
	ADD COLUMN staged_candidates integer;
```

### 5.4. admin_audit_log (uso ampliado)
Registrar acciones 2FA: `action` valores: `2fa_generate_secret`, `2fa_verify_success`, `2fa_verify_fail`, `2fa_disable` con `target_id = admin_id` y detalles JSON.

## 6. Vistas / Materialized Views para Dashboard

### 6.1. Rendimiento Edge Functions
```sql
CREATE VIEW public.vw_edge_function_daily_stats AS
SELECT function_name,
			 date_trunc('day', started_at) AS day,
			 count(*) AS invocations,
			 count(*) FILTER (WHERE status='error') AS errors,
			 round((count(*) FILTER (WHERE status='error') * 100.0 / NULLIF(count(*),0))::numeric,2) AS error_rate_pct,
			 percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50_ms,
			 percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms
FROM public.edge_function_invocations
WHERE started_at >= now() - interval '90 days'
GROUP BY 1,2;
```

### 6.2. Funnel de Pagos
```sql
CREATE VIEW public.vw_payment_funnel_daily AS
SELECT date_trunc('day', created_at) AS day,
			 count(*) FILTER (WHERE status='pending') AS pending_created,
			 count(*) FILTER (WHERE payment_status='paid') AS paid_count,
			 count(*) FILTER (WHERE status='cancelled' OR status='rejected') AS failed_count,
			 avg(extract(epoch FROM (paid_at - created_at))/60)::numeric(10,2) AS avg_minutes_to_pay
FROM public.orders
GROUP BY 1;
```

### 6.3. Salud Generación Thumbnails
```sql
CREATE VIEW public.vw_thumbnail_job_stats AS
SELECT date_trunc('day', created_at) AS day,
			 count(*) AS total_jobs,
			 count(*) FILTER (WHERE status='success') AS success_jobs,
			 count(*) FILTER (WHERE status='error') AS error_jobs,
			 round(avg(attempts)::numeric,2) AS avg_attempts,
			 round(avg(duration_ms)::numeric,2) AS avg_duration_ms
FROM public.image_thumbnail_jobs
GROUP BY 1;
```

### 6.4. Backlog Thumbnail (tiempo real)
```sql
CREATE VIEW public.vw_thumbnail_backlog AS
SELECT status, count(*) AS jobs FROM public.image_thumbnail_jobs GROUP BY status;
```

### 6.5. Limpieza Storage Efectividad
```sql
CREATE VIEW public.vw_storage_cleanup_daily AS
SELECT date_trunc('day', executed_at) AS day,
			 sum(products_processed) AS products_processed,
			 sum(files_removed) AS files_removed,
			 sum(staged_candidates) AS staged_candidates,
			 round(avg(execution_time_ms)::numeric,2) AS avg_exec_time_ms,
			 round( (sum(files_removed)::numeric / NULLIF(sum(products_processed),0)) ,2) AS files_removed_per_product
FROM public.storage_cleanup_logs
GROUP BY 1;
```

### 6.6. Métricas Purga Huérfanos
```sql
CREATE VIEW public.vw_purge_orphans_daily AS
SELECT date_trunc('day', executed_at) AS day,
			 sum(attempted) attempted,
			 sum(purged) purged,
			 sum(purged)::numeric / NULLIF(sum(attempted),0) AS purge_rate
FROM public.purge_orphans_logs
GROUP BY 1;
```

### 6.7. Cambios de IP Recientes (Seguridad)
```sql
CREATE VIEW public.vw_users_multiple_ips_last7d AS
SELECT user_id, count(DISTINCT new_ip) AS unique_ips
FROM public.ip_change_log
WHERE changed_at >= now() - interval '7 days'
GROUP BY user_id
HAVING count(DISTINCT new_ip) > 3; -- umbral configurable
```

## 7. Métricas Clave para el Dashboard (KPIs / Gráficos)
| Categoría | KPI | Fuente |
|-----------|-----|--------|
| Fiabilidad | Error Rate por función | `vw_edge_function_daily_stats.error_rate_pct` |
| Performance | p95 Latencia por función | `vw_edge_function_daily_stats.p95_ms` |
| Throughput | Invocaciones por función (stacked bar) | `vw_edge_function_daily_stats.invocations` |
| Pagos | Conversion Rate (paid / pending) | Derivado de `vw_payment_funnel_daily` |
| Pagos | Tiempo medio a pagar (minutos) | `avg_minutes_to_pay` |
| Thumbnails | Backlog por estado | `vw_thumbnail_backlog` |
| Thumbnails | Success Rate diario | `vw_thumbnail_job_stats` |
| Limpieza | Archivos removidos vs staged | `vw_storage_cleanup_daily` |
| Limpieza | Purge Rate | `vw_purge_orphans_daily` |
| Seguridad | Usuarios con múltiples IPs 7d | `vw_users_multiple_ips_last7d` |
| Operaciones | Retries ejecutados y éxito | `thumbnail_retry_runs` |
| Productos | Ventas por día (monto) | Agregado `sales` / `product_sales` |

## 8. Instrumentación en Código (Patrón Reutilizable)
Ejemplo wrapper (Deno):
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function instrumentEdge(fnName: string, handler: (req: Request) => Promise<Response>) {
	return async (req: Request): Promise<Response> => {
		const start = performance.now();
		let status: 'success'|'error' = 'success';
		let errorCode: string | undefined; let errorMsg: string | undefined; let meta: any = {};
		try {
			const res = await handler(req.clone());
			meta.status_code = res.status;
			return res;
		} catch (e:any) {
			status = 'error';
			errorMsg = (e.message||'').slice(0,280);
			errorCode = categorizeError(e); // función que mapea
			return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { 'Content-Type':'application/json' }});
		} finally {
			// Fire & forget (no bloquear respuesta)
			queueMicrotask(async () => {
				try {
					const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
					await supabase.from('edge_function_invocations').insert({
						function_name: fnName,
						finished_at: new Date().toISOString(),
						duration_ms: Math.round(performance.now() - start),
						status, error_code: errorCode, error_message: errorMsg, meta
					});
				} catch (_) {}
			});
		}
	}
}
```

Aplicar: `serve(instrumentEdge('generate-thumbnail', async (req) => { /* cuerpo original */ }))`.

## 9. Categorización Sugerida de Errores (error_code)
| Código | Descripción | Ejemplos |
|--------|-------------|----------|
| validation_error | Payload / parámetros inválidos | Falta amount, falta imageUrl |
| upstream_error | Error API externa (Khipu) | 4xx / 5xx de Khipu |
| upstream_timeout | Tiempo excedido (fetch) | AbortController timeout imagen |
| db_error | Fallo Supabase DB | upsert/insert fallido |
| storage_error | Fallo en storage | upload/remove falla |
| auth_error | Token / firma inválida | Invalid signature webhook |
| business_rule | Reglas dominio (e.g. WebP prohibido) | WebP / transparencia |
| unknown | Fallback genérico | Error no clasificado |

## 10. Roadmap de Implementación (Incremental)
Fase 1 (base): crear `edge_function_invocations`, vistas principales, ampliar `khipu_webhook_logs`, índices críticos.
Fase 2: extender `image_thumbnail_jobs`, añadir purge / retry logs, storage staged column.
Fase 3: métricas seguridad (`ip_change_log`), acciones 2FA en `admin_audit_log`.
Fase 4: afinamiento (percentiles materiales, dashboards UI, alertas p95 > umbral, error_rate > X%).

## 11. Ejemplos de Queries para el Frontend
Top funciones por error 24h:
```sql
SELECT function_name, count(*) errors
FROM edge_function_invocations
WHERE status='error' AND started_at >= now() - interval '24 hours'
GROUP BY 1 ORDER BY errors DESC LIMIT 5;
```
Latency distribución (p50/p95) última semana:
```sql
SELECT function_name,
	percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms) p50,
	percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) p95
FROM edge_function_invocations
WHERE started_at >= now() - interval '7 days'
GROUP BY 1;
```
Tiempo medio creación→pago:
```sql
SELECT avg(extract(epoch FROM (paid_at - created_at))/60) AS avg_minutes
FROM orders
WHERE paid_at IS NOT NULL AND created_at >= now() - interval '30 days';
```

## 12. Consideraciones de Costos / Rendimiento
* Insert adicional por invocación: bajo (~ decenas de bytes) → OK.
* Evitar payloads grandes (no guardar JSON completo de webhook en métricas; ya está en tabla específica).
* Indexar sólo campos consultados frecuentemente (function_name, status, started_at). 
* Para dashboards de alta frecuencia se puede crear una MV (materialized view) refrescada cada 5–10 min para percentiles pesados si el volumen crece.

## 13. Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Contención / latencia por insertar métricas | Fire & forget + colas microtask (no await) |
| Crecimiento de tabla invocaciones | Particionar mensual (opcional) cuando > 5M filas |
| Exposición de IPs | En dashboard mostrar sólo agregados / hash si compliance requerida |
| Errores no categorizados | Fallback `unknown` + revisión periódica top mensajes |

## 14. Resumen
Este diseño agrega una capa central (`edge_function_invocations`) + enriquecimientos específicos (pagos, thumbnails, limpieza) para construir un dashboard robusto con KPIs de negocio y operativos sin inflar costos. La implementación es incremental y cada fase habilita valor visible.

---
Fin del documento.
