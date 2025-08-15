Resumen corto
------------
Este documento explica qué variables de entorno hay que añadir en el proyecto Supabase (staging y producción), por qué son necesarias, qué pasará si no se añaden y los comandos/ pasos exactos que puede ejecutar un Owner.

Estado actual (staging)
- RLS temporalmente DESACTIVADO en tablas de imágenes (migración `20250815150000_disable_rls_temp.sql`).
- Edge Functions redeployadas: generate-thumbnail, purge-orphans, daily-cleanup, retry-thumbnail-jobs.
- No se pudieron crear secretos vía CLI (falta privilegio). CÓDIGO ya acepta `SUPABASE_SERVICE_ROLE_KEY` o el alias `SERVICE_ROLE_KEY` (fallback) y token `CLEANUP_SECRET_TOKEN`.
- Mientras RLS esté desactivado la service role no es estrictamente necesaria, pero cuando se reactive será obligatoria para operaciones DML seguras.

Checklist para el Owner
- Copiar/pegar la Service Role desde Settings → API (no la anon).
- Añadir la variable runtime `SUPABASE_SERVICE_ROLE_KEY` (o alternativamente `SERVICE_ROLE_KEY` si la UI se complica; el código soporta ambos) en las Environment variables del proyecto (UI).
- Añadir la variable runtime `CLEANUP_SECRET_TOKEN` en las Environment variables (usa el token proporcionado por el equipo o genera uno nuevo de 32 bytes hex).
- Añadir la variable runtime `EDGE_TRUST_SECRET` (feature "Recordar dispositivo" 2FA) — cadena aleatoria >=64 chars (base64 o hex) para firmar los trust_token.
- Guardar y redeploy de las Edge Functions: generate-thumbnail, purge-orphans, retry-thumbnail-jobs.

Pasos detallados (UI, recomendado)
1. Abrir: https://app.supabase.com → seleccionar el proyecto correcto.
2. Ir a Settings → API → copiar la clave "Service role".
3. Ir a Project → Settings → Environment variables (o sección Secrets / Runtime configuration) y añadir dos variables:
	 - Key: SUPABASE_SERVICE_ROLE_KEY (opción A)  /  SERVICE_ROLE_KEY (opción B si la UI/CLI bloquea prefijo SUPABASE_)
		 Value: (pegar la Service role copiada)
	 - Key: CLEANUP_SECRET_TOKEN
		 Value: (pegar el token que el equipo generó)
4. Guardar los cambios.
5. Ir a Edge Functions y redeploy (o usar la CLI para desplegar de nuevo las funciones listadas).

Comandos (PowerShell) — sólo si eres Owner y prefieres CLI (usa SERVICE_ROLE_KEY para evitar el bloqueo de prefijo)
```powershell
 # Login (si no estás logueado)
 npx supabase login

 # Guardar service role usando alias SERVICE_ROLE_KEY (reemplaza TU_SERVICE_ROLE_KEY)
 npx supabase secrets set SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY --project-ref clbngnjetipglkikondm

 # Guardar el token (reemplaza TU_TOKEN si generas otro)
 npx supabase secrets set CLEANUP_SECRET_TOKEN=TU_TOKEN --project-ref clbngnjetipglkikondm

# Redeploy de funciones
npx supabase functions deploy generate-thumbnail purge-orphans retry-thumbnail-jobs --project-ref clbngnjetipglkikondm
```
Nota: la CLI suele rechazar variables que comienzan con `SUPABASE_`, por eso la Service Role debe pegarse vía UI.

Alias soportado en código
- generate-thumbnail / daily-cleanup / purge-orphans / retry-thumbnail-jobs intentan leer primero `SUPABASE_SERVICE_ROLE_KEY` y si no existe usan `SERVICE_ROLE_KEY`. Con cualquiera de los dos nombres funciona.
- Si ninguno está definido, hacen fallback a la clave anon (sólo útil con RLS desactivado y/o GRANTs explícitos).

Qué ocurre si NO se hace (impacto)
- Las Edge Functions no podrán realizar operaciones privilegiadas en la base de datos cuando RLS esté activado. Concretamente:
	- `generate-thumbnail` no podrá actualizar filas en `product_images` (las thumbnails no se registrarán).
	- `daily-cleanup` y `purge-orphans` no podrán mover/confirmar borrados en `image_orphan_candidates` ni eliminar objetos de storage.
	- Los reintentos de thumbnail (`retry-thumbnail-jobs`) fallarán o no podrán marcar estados correctamente.
	- En general, inconsistencias entre storage y la tabla `product_images` → imágenes huérfanas o thumbnails faltantes.

Qué se arregla si se hace (beneficios)
- Con `SUPABASE_SERVICE_ROLE_KEY` y `CLEANUP_SECRET_TOKEN` en runtime:
	- Las funciones podrán hacer DML privilegiado necesario bajo RLS a través del Service Role o RPCs SECURITY DEFINER.
	- El proceso de staging + purge de imágenes funcionará y las imágenes huérfanas serán eliminadas de forma segura.
	- Los jobs de thumbnails se marcarán correctamente (success/error/retry) y las vistas métricas reflejarán datos fiables.
	- Mejor seguridad: `CLEANUP_SECRET_TOKEN` protege endpoints de mantenimiento (purge, retry) frente a llamadas no autorizadas.

Recomendaciones de seguridad
- No subir ni pegar `SUPABASE_SERVICE_ROLE_KEY` en repositorios públicos ni en .env compartidos.
- Si la service role se ha expuesto, regenerarla inmediatamente desde Settings → API → Regenerate and update env vars.
- Guardar `CLEANUP_SECRET_TOKEN` en un gestor de secretos y compartirlo sólo con el equipo de ops.

Texto listo para enviar al Owner (copia/pega)
"Hola — para que las funciones de mantenimiento de imágenes funcionen correctamente y con RLS activado, por favor añade estas variables en Settings → Environment variables del proyecto:
- SUPABASE_SERVICE_ROLE_KEY = (pegar Service role desde Settings → API)
- CLEANUP_SECRET_TOKEN = (pegar token que les pasé)
Luego guarda y redeploya las Edge Functions: generate-thumbnail, purge-orphans, retry-thumbnail-jobs. Gracias."

STAGING CLEANUP_SECRET_TOKEN: 1e62cf177a403a9638442b5b5bfbb294b47bade98b0c696fc69234e1dfe66884
PROD CLEANUP_SECRET_TOKEN: dc147e7baa23156923ad51f354d7da2e9695d73df0de1b1bc1e9720da643ca51

Reactivar RLS (cuando los secretos estén configurados)
```sql
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_thumbnail_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_orphan_candidates ENABLE ROW LEVEL SECURITY;
```
Si necesitas volver a un estado seguro crea una migración inversa que habilite RLS y (opcional) añade políticas mínimas o usa la service role.

Smoke test rápido tras configurar secretos y (opcional) reactivar RLS
1. Subir / registrar una imagen principal de un producto sin thumbnails.
2. Invocar generate-thumbnail:
	- Endpoint: https://<PROJECT>.supabase.co/functions/v1/generate-thumbnail
	- Body JSON: `{ "imageUrl": "URL_ORIGINAL", "productId": "<id>", "supplierId": "<supplier>" }`
3. Verificar en `product_images` que columnas `thumbnails` y `thumbnail_url` se llenan.
4. Ejecutar daily-cleanup (POST con header Authorization: Bearer <CLEANUP_SECRET_TOKEN>) y confirmar staging en `image_orphan_candidates`.
5. Ejecutar purge-orphans (POST con mismo token) y ver `confirmed_deleted_at` actualizado.

Notas finales
- Mientras la service role no esté cargada evita reactivar RLS.
- `SERVICE_ROLE_KEY` es sólo un alias de conveniencia; preferir `SUPABASE_SERVICE_ROLE_KEY` en UI.

EDGE_TRUST_SECRET (Trusted Devices / "Recordar este dispositivo")
--------------------------------------------------------------
Propósito
- Firmar (HMAC SHA-256) los `trust_token` emitidos cuando un admin marca "recordar este dispositivo" tras un login 2FA exitoso.
- Validar tokens recibidos en la acción `check_trust` de la función `admin-2fa` evitando que se puedan falsificar.

Por qué es necesario
- Sin un secreto privado, la función usa el fallback `insecure-dev-secret` (visible en código), haciendo trivial forjar tokens y saltarse 2FA.
- Protege contra replay/modificación: el payload (admin id, token_id, exp) se firma y se verifica cada vez.

Formato recomendado
- Cadena >= 64 bytes de entropía. Acepta cualquier string; sugerido: Base64 (88+ chars) o Hex (128 chars para 64 bytes).
- Ejemplos de generación (PowerShell):
	````powershell
	# 64 bytes en Base64
	[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

	# 64 bytes en Hex
	-join ((1..64 | ForEach-Object { (Get-Random -Maximum 256).ToString("x2") }))
	````

Cómo añadirlo (UI – recomendado)
1. Dashboard Supabase → Project → Settings → Environment Variables / Secrets.
2. New Variable:
	 - Key: `EDGE_TRUST_SECRET`
	 - Value: (cadena generada)
3. Guardar.
4. Redeploy de la función `admin-2fa` para que el runtime cargue el nuevo valor.

CLI (requiere rol Owner y token con permisos):
````powershell
npx supabase login
$EDGE = [Convert]::ToBase64String((1..96 | ForEach-Object { Get-Random -Maximum 256 }))
npx supabase secrets set EDGE_TRUST_SECRET=$EDGE --project-ref clbngnjetipglkikondm
npx supabase functions deploy admin-2fa --project-ref clbngnjetipglkikondm
````

Impacto si falta
- `check_trust` devolverá `trusted:false` o aceptará tokens falsos (riesgo de bypass 2FA).
- Dispositivos "recordados" dejarán de ser confiables tras rotar el secreto si no se implementa validación dual (aceptamos esto como coste de rotación rápida).

Buenas prácticas
- Rotar cada 6-12 meses o tras sospecha de filtración. Rotación actual invalida tokens previos (aceptado). Si se requiere rotación suave, extender código para aceptar antiguo y nuevo temporalmente.
- Mantenerlo sólo en entorno (no en repositorio). Usar gestor de secretos.

Smoke test rápido (tras añadir la variable y redeploy `admin-2fa`)
1. Login admin normal → ingresar TOTP → marcar "recordar dispositivo".
2. Ver en respuesta `trust_token` no vacío.
3. Refrescar y repetir login: debería omitir el paso TOTP (edge responde `trusted:true`).
4. Forzar fallo cambiando un carácter del `trust_token` en header `x-trust-token`: debe responder `trusted:false`.

Plan de contingencia
- Si se expone el secreto: generar uno nuevo, setear, redeploy; forzar a todos los dispositivos a repetir 2FA (automático porque los tokens previos invalidan firma).
