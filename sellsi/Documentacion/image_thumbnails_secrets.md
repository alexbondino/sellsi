## Secrets requeridos para subsistema de imágenes / mantenimiento

### Secretos mínimos
1. SUPABASE_SERVICE_ROLE_KEY (obligatorio)
   - DML en tablas con RLS: product_images, image_thumbnail_jobs, image_orphan_candidates.
2. SUPABASE_URL (obligatorio)
3. SUPABASE_ANON_KEY (recomendado para fallback lectura)
4. CLEANUP_SECRET_TOKEN (token único de mantenimiento)
   - Protege: daily-cleanup, purge-orphans, retry-thumbnail-jobs.
5. THUMBNAIL_MAX_ATTEMPTS (opcional, default 5)
6. RETRY_BATCH_LIMIT (opcional, default 20)
7. DEBUG_MODE (opcional, 'true' para logs extendidos en generate-thumbnail)

### Funciones y uso
- generate-thumbnail: necesita SERVICE_ROLE para UPDATE (RLS bloquea anon).
- daily-cleanup: SERVICE_ROLE + Bearer CLEANUP_SECRET_TOKEN.
- purge-orphans: SERVICE_ROLE + Bearer CLEANUP_SECRET_TOKEN.
- retry-thumbnail-jobs: SERVICE_ROLE + Bearer CLEANUP_SECRET_TOKEN.

### Comando CLI ejemplo (reemplaza valores reales)
```
npx supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=sk_service_xxxxx \
  SUPABASE_URL=https://<project>.supabase.co \
  SUPABASE_ANON_KEY=eyJ... \
  CLEANUP_SECRET_TOKEN=prod_cleanup_secret \
  THUMBNAIL_MAX_ATTEMPTS=5 \
  RETRY_BATCH_LIMIT=20 \
  --project-ref clbngnjetipglkikondm
```

### Redeploy tras cambiar secrets
```
npx supabase functions deploy generate-thumbnail daily-cleanup purge-orphans retry-thumbnail-jobs --project-ref clbngnjetipglkikondm
```

### Rotación de token
1. Establecer CLEANUP_SECRET_TOKEN_NEW.
2. Actualizar clientes internos para usar nuevo token.
3. Sustituir CLEANUP_SECRET_TOKEN con nuevo valor y eliminar *_NEW.

### Endurecimiento adicional (opcional)
- Añadir THUMBNAIL_SECRET_TOKEN y exigirlo en generate-thumbnail.
- Restringir SELECT público en product_images con políticas basadas en ownership.

Fecha: 2025-08-15
