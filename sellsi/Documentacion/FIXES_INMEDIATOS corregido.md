# PLAN COMPLETO - Sistema de Imágenes 100% Robusto

**Fecha**: 2025-08-15  
**Problema**: Race conditions, columnas vacías, thumbnails duplicados  
**Política**: MANTENER thumbnails solo para primera imagen

---

## 🔴 SECCIÓN 1: CRÍTICO (Resolver HOY - 0-4 horas)

> **Sin esto el sistema sigue roto**. Fixes que atacan la causa raíz.

## 🛠️ SECCIÓN 2: NECESARIO (Completar esta semana - 1-3 días)

> **Para robustez a largo plazo**. Previene problemas futuros y mejora consistencia.

## ⚡ SECCIÓN 3: OPCIONAL (Optimizaciones - 1-2 semanas)

> **Para performance y mantenibilidad**. No afecta funcionalidad básica.

---

## 🔥 SECCIÓN 1: CRÍTICO - EJECUTAR HOY

### 1.1 Fix Race Condition `image_order` (CRÍTICO) (COMPLETADO - migración 20250815113000)

**Problema**: Múltiples imágenes con `image_order=0` → No hay imagen principal clara  
**Causa**: Race condition en uploads simultáneos  

```sql
-- EJECUTAR EN PRODUCCIÓN:
-- Migración emergencia: Asignar orden correcto
WITH ordered AS (
  SELECT ctid, product_id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_url) - 1 AS new_order
  FROM product_images
)
UPDATE product_images pi
SET image_order = o.new_order
FROM ordered o
WHERE pi.ctid = o.ctid;

-- Constraint unicidad (evita race condition futuro)
CREATE UNIQUE INDEX CONCURRENTLY uniq_product_image_order 
ON product_images(product_id, image_order);
```

### 1.2 Backfill `thumbnail_url` (CRÍTICO) (COMPLETADO - migración 20250815113000)

**Problema**: Campo `thumbnail_url` vacío → Hooks fallan en fallbacks  
**Solución**: Poblar desde JSONB existente SOLO para imagen principal  

```sql
-- EJECUTAR EN PRODUCCIÓN:
UPDATE product_images 
SET thumbnail_url = thumbnails->>'desktop'
WHERE image_order = 0  -- SOLO primera imagen
  AND thumbnail_url IS NULL 
  AND thumbnails IS NOT NULL 
  AND thumbnails ? 'desktop';
```

### 1.3 Fix Edge Function UPDATE masivo (CRÍTICO) (COMPLETADO - desplegado)

**Problema**: Edge actualiza TODAS las filas del producto con mismos thumbnails  
**Archivo**: `supabase/functions/generate-thumbnail/index.ts` (línea ~275)

```typescript
// CAMBIAR ESTO:
const { error: dbUpdateError } = await supabase
  .from('product_images')
  .update({
    thumbnails: {
      minithumb: minithumbUrl,
      mobile: mobileUrl,
      tablet: tabletUrl,
      desktop: desktopUrl
    }
  })
  .eq('product_id', productId);

// POR ESTO:
const { error: dbUpdateError } = await supabase
  .from('product_images')
  .update({
    thumbnails: {
      minithumb: minithumbUrl,
      mobile: mobileUrl,
      tablet: tabletUrl,
      desktop: desktopUrl
    },
    thumbnail_url: desktopUrl  // ← NUEVO: Setear también este campo
  })
  .eq('product_id', productId)
  .eq('image_order', 0);  // ← NUEVO: Solo imagen principal (order=0)
```

### 1.4 Limpiar datos duplicados (CRÍTICO) (COMPLETADO - migración 20250815113000)

**Problema**: Thumbnails duplicados en imágenes secundarias → Desperdicio storage  

```sql
-- EJECUTAR EN PRODUCCIÓN:
-- Eliminar thumbnails de imágenes que NO son principales
UPDATE product_images 
SET thumbnails = NULL,
    thumbnail_url = NULL
WHERE image_order > 0;  -- Solo imagen principal (order=0) mantiene thumbnails
```

### 1.5 Idempotencia y seguridad extra en Edge Function (CRÍTICO) (COMPLETADO - desplegado)

**Problema**: Re-ejecuciones generan múltiples subidas y pisan datos ya correctos.  
**Solución**: Comprobar antes de generar y limitar update solo si aún no existen thumbnails.

```typescript
// Antes de generar thumbnails (tras validar parámetros):
const { data: existingMain, error: mainErr } = await supabase
  .from('product_images')
  .select('id, thumbnails, thumbnail_url')
  .eq('product_id', productId)
  .eq('image_order', 0)
  .single();

if (mainErr || !existingMain) {
  return new Response(JSON.stringify({ error: 'Imagen principal no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
}

// Idempotencia: si ya tiene thumbnails válidos, salir sin error
if (existingMain.thumbnails && existingMain.thumbnails.desktop && existingMain.thumbnail_url) {
  return new Response(JSON.stringify({ status: 'ok', message: 'Thumbnails ya existentes' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
}

// ... generar thumbnails ...

// Update más estricto (solo si aún está null):
const { error: dbUpdateError } = await supabase
  .from('product_images')
  .update({
    thumbnails: { minithumb: minithumbUrl, mobile: mobileUrl, tablet: tabletUrl, desktop: desktopUrl },
    thumbnail_url: desktopUrl
  })
  .eq('product_id', productId)
  .eq('image_order', 0)
  .is('thumbnails', null); // ← evita pisar thumbnails si otra corrida ganó la carrera
```

### 1.6 Normalizar nombres de archivos (CRÍTICO) (COMPLETADO - implementado en UploadService)

**Problema**: `Date.now()` solo no evita colisiones en subidas simultáneas (ms).  
**Solución**: Añadir sufijo aleatorio + sanitizar nombre original.

```javascript
// Reemplazar construcción actual
const timestamp = Date.now();
const rand = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0,8);
const safeName = actualFile.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
const fileName = `${supplierId}/${productId}/${timestamp}_${rand}_${safeName}`;
```

---

## 🛠️ SECCIÓN 2: NECESARIO - ESTA SEMANA

---

## ✅ RESULTADO ESPERADO:

- ✅ Una sola imagen por producto con `image_order=0` (principal)
- ✅ Solo imagen principal tiene thumbnails 
- ✅ `thumbnail_url` poblado para imagen principal
- ✅ No más race conditions
- ✅ Columnas vacías eliminadas
- ✅ Política mantenida: thumbnails solo primera imagen

### 2.1 Función PostgreSQL para orden atómico (NECESARIO) (COMPLETADO - creada en migración 20250815113000)

**Problema**: UploadService aún puede tener race conditions en uploads futuros  
**Solución**: Reemplazar lógica de orden por función atómica

```sql
-- CREAR FUNCIÓN:
CREATE OR REPLACE FUNCTION insert_image_with_order(
  p_product_id uuid,
  p_image_url text,
  p_supplier_id uuid
) RETURNS integer AS $$
DECLARE
  next_order integer;
BEGIN
  -- Lock y calcular siguiente orden atómicamente
  SELECT COALESCE(MAX(image_order), -1) + 1 
  INTO next_order
  FROM product_images 
  WHERE product_id = p_product_id
  FOR UPDATE;
  
  INSERT INTO product_images (product_id, image_url, image_order)
  VALUES (p_product_id, p_image_url, next_order);
  
  RETURN next_order;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Actualizar UploadService para usar función atómica (NECESARIO) (COMPLETADO - RPC insert_image_with_order aplicado y en uso)

**Archivo**: `src/shared/services/upload/uploadService.js` (método `uploadImageWithThumbnail`)

```javascript
// REEMPLAZAR la lógica de nextOrder:
// Obtener el siguiente orden para este producto
const { data: existingImages, error: countError } = await supabase
  .from('product_images')
  .select('image_order')
  .eq('product_id', productId)
  .order('image_order', { ascending: false })
  .limit(1)

const nextOrder = existingImages?.length > 0 ? (existingImages[0].image_order + 1) : 0

const { error: dbInsertError } = await supabase
  .from('product_images')
  .insert({
    product_id: productId,
    image_url: publicUrlData.publicUrl,
    thumbnail_url: null,
    thumbnails: null,
    image_order: nextOrder
  })

// POR ESTO:
const { data: insertResult, error: dbInsertError } = await supabase
  .rpc('insert_image_with_order', {
    p_product_id: productId,
    p_image_url: publicUrlData.publicUrl,
    p_supplier_id: supplierId
  })

const imageOrder = insertResult || 0
```

### 2.3.1 Ajustar flujo UploadService (NECESARIO)

Nuevo pipeline recomendado para `uploadImageWithThumbnail`:

1. Subir archivo al bucket (si falla → abortar).  
2. Insertar fila vía RPC (retorna orden).  
3. Si `imageOrder === 0` y no hay thumbnails todavía → disparar Edge Function (fetch).  
4. Si Edge falla, registrar error y permitir retry manual (no marcar fallo total de upload si la imagen se subió).  

Código ejemplo (fragmento simplificado):
```javascript
const uploadRes = await supabase.storage
  .from(UploadService.IMAGE_BUCKET)
  .upload(fileName, actualFile, { cacheControl: '3600', upsert: false });
if (uploadRes.error) return { success: false, error: uploadRes.error.message };

const { data: orderResult, error: rpcErr } = await supabase.rpc('insert_image_with_order', {
  p_product_id: productId,
  p_image_url: publicUrlData.publicUrl,
  p_supplier_id: supplierId
});
if (rpcErr) return { success: false, error: rpcErr.message };

if (orderResult === 0) {
  // fire & forget (opcional manejar respuesta)
  fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/generate-thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ imageUrl: publicUrlData.publicUrl, productId, supplierId })
  }).catch(console.error);
}
```

### 2.3 Añadir Primary Key a product_images (NECESARIO) (COMPLETADO - migración 20250815113000)

**Problema**: Sin PK es difícil hacer updates específicos y debugging  

```sql
-- AÑADIR PRIMARY KEY:
ALTER TABLE product_images 
ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- Índice para performance en queries frecuentes:
CREATE INDEX idx_product_images_product_order 
ON product_images(product_id, image_order);
```

### 2.3.2 Añadir columnas y constraints adicionales (NECESARIO) (COMPLETADO - migración 20250815113000)

```sql
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE product_images ALTER COLUMN image_url SET NOT NULL;
ALTER TABLE product_images ALTER COLUMN image_order SET NOT NULL;
```

### 2.4 Mejorar validación en Edge Function (NECESARIO) (COMPLETADO - validación incorporada con idempotencia)

**Archivo**: `supabase/functions/generate-thumbnail/index.ts`

```typescript
// AÑADIR DESPUÉS de las validaciones iniciales (línea ~50):

// Validar que la imagen principal existe
const { data: mainImage, error: checkError } = await supabase
  .from('product_images')
  .select('id')
  .eq('product_id', productId)
  .eq('image_order', 0)
  .single();

if (checkError || !mainImage) {
  return new Response(JSON.stringify({ 
    error: 'No se encontró imagen principal para generar thumbnails' 
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### 2.5 Procedimiento ordenado de migraciones (NECESARIO) (COMPLETADO - ejecutada migración 20250815113000_image_system_hardening.sql)

Orden sugerido para ejecutar en producción con mínima ventana:

1. (Opcional) Poner en modo mantenimiento UI de uploads.  
2. Añadir columnas faltantes (`id`, `created_at`) sin constraints.  
3. Normalizar `image_order` con CTE (1.1).  
4. Backfill `thumbnail_url` (1.2).  
5. Limpiar thumbnails secundarios (1.4).  
6. Crear UNIQUE index (1.1).  
7. Añadir NOT NULL a columnas.  
8. Deploy Edge Function corregida (1.3 + 1.5).  
9. Deploy cambio UploadService (uso RPC + naming).  
10. Rehabilitar uploads y monitorear queries de validación.  

Checklist monitoreo inmediato (todas deberían retornar 0 o valores esperados):
```sql
SELECT product_id FROM product_images GROUP BY product_id HAVING COUNT(*) FILTER (WHERE image_order=0) > 1; -- 0 filas
SELECT COUNT(*) FROM product_images WHERE image_order>0 AND thumbnails IS NOT NULL; -- 0
SELECT COUNT(*) FROM product_images WHERE image_order=0 AND (thumbnails IS NULL OR thumbnail_url IS NULL); -- 0 (ideal)
```

---

## ⚡ SECCIÓN 3: OPCIONAL - OPTIMIZACIONES

### 3.1 Políticas RLS para thumbnails automáticos (OPCIONAL)

**Objetivo**: Forzar generación automática vía políticas de base

```sql
-- Política que requiere thumbnails para image_order = 0:
CREATE POLICY "thumbnails_required_for_main" ON product_images
  FOR INSERT TO authenticated
  WITH CHECK (
    image_order > 0 OR thumbnails IS NOT NULL
  );
```

### 3.2 Webhook de validación post-upload (OPCIONAL)

**Objetivo**: Verificar que toda imagen principal tenga thumbnails

```sql
-- Función trigger para validar thumbnails:
CREATE OR REPLACE FUNCTION validate_main_image_thumbnails()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.image_order = 0 AND NEW.thumbnails IS NULL THEN
    -- Llamar Edge Function asíncrono
    PERFORM pg_notify('generate_thumbnails', 
      json_build_object('product_id', NEW.product_id)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_thumbnails
  AFTER INSERT ON product_images
  FOR EACH ROW EXECUTE FUNCTION validate_main_image_thumbnails();
```

### 3.3 Cache warmup en React hooks (OPCIONAL)

**Archivo**: `src/hooks/images/useRobustThumbnail.js`

```javascript
// AÑADIR preload de thumbnails:
export const useRobustThumbnail = (productId, options = {}) => {
  const { preloadAll = false } = options;
  
  // Precargar todos los tamaños para UX mejorada
  useEffect(() => {
    if (preloadAll && thumbnails?.data) {
      const sizes = ['sm', 'md', 'lg', 'xl'];
      sizes.forEach(size => {
        if (thumbnails.data[size]) {
          const img = new Image();
          img.src = thumbnails.data[size];
        }
      });
    }
  }, [thumbnails?.data, preloadAll]);
  
  // ... resto del hook
}
```

### 3.4 Monitoreo y alertas (OPCIONAL)

**Query de salud del sistema**:

```sql
-- Vista para monitorear estado del sistema:
CREATE VIEW image_system_health AS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN pi.image_order = 0 THEN 1 END) as products_with_main,
  COUNT(CASE WHEN pi.image_order = 0 AND pi.thumbnails IS NOT NULL THEN 1 END) as main_with_thumbnails,
  COUNT(CASE WHEN pi.image_order = 0 AND pi.thumbnail_url IS NULL THEN 1 END) as main_missing_url,
  COUNT(CASE WHEN duplicates.product_id IS NOT NULL THEN 1 END) as products_with_duplicates
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN (
  SELECT product_id 
  FROM product_images 
  WHERE image_order = 0 
  GROUP BY product_id 
  HAVING COUNT(*) > 1
) duplicates ON p.id = duplicates.product_id
WHERE p.active = true;
```

### 3.5 Detección de archivos huérfanos (OPCIONAL)

Al añadir una columna `storage_path` (recomendado) se puede detectar objetos sin fila:

1. Exportar lista de objetos del bucket (CLI supabase o API) a tabla staging `storage_listing(path text)`.  
2. Query diferencia:
```sql
SELECT l.path
FROM storage_listing l
LEFT JOIN product_images pi ON pi.storage_path = l.path
WHERE pi.id IS NULL;
```
3. Revisar y eliminar tras verificación.

### 3.6 Retry / observabilidad (OPCIONAL)

Agregar tabla `image_thumbnail_jobs` para registrar intentos y permitir reintentos manuales si Edge falla.

---

## 📋 RESUMEN FINAL

### ⏱️ TIEMPOS ESTIMADOS:
- **CRÍTICO**: 2-4 horas (hoy mismo)
- **NECESARIO**: 1-3 días (esta semana)  
- **OPCIONAL**: 1-2 semanas (mejora continua)

### 🎯 OBJETIVO:
Sistema de imágenes **100% robusto** con:
- ✅ Cero race conditions
- ✅ Thumbnails garantizados para imagen principal
- ✅ Datos consistentes y limpios
- ✅ Performance optimizada
- ✅ Monitoreo integrado

**¿Comenzamos por SECCIÓN 1 CRÍTICO?**

---

## 📊 VALIDACIÓN POST-FIX:

```sql
-- Verificar que cada producto tiene UNA imagen principal
SELECT product_id, COUNT(*) as principals
FROM product_images 
WHERE image_order = 0 
GROUP BY product_id 
HAVING COUNT(*) > 1;  -- Debe retornar 0 filas

-- Verificar thumbnail_url poblado solo en principales
SELECT COUNT(*) as filled_thumbnails
FROM product_images 
WHERE thumbnail_url IS NOT NULL AND image_order = 0;

-- Verificar secundarias sin thumbnails
SELECT COUNT(*) as clean_secondaries
FROM product_images 
WHERE image_order > 0 AND thumbnails IS NULL;
```

**¿Ejecutamos estos fixes paso a paso?**

---

## ✅ Estado tras migración 20250815113000

La migración se aplicó correctamente. Resumen (según logs CLI):

- Normalización de image_order: UPDATE 37 (reordenó filas con diferencias)
- Backfill de thumbnail_url (principales): UPDATE 26
- Limpieza thumbnails secundarias: UPDATE 36
- Ajuste null residuales image_order: UPDATE 0 (no había nulos restantes)
- Eliminación filas sin URL: DELETE 0 (no existían)
- Índice único uniq_product_image_order creado (sin duplicados post-normalización)
- Función insert_image_with_order creada / reemplazada
- Constraints NOT NULL aplicadas (sin conflictos)

Acciones inmediatas sugeridas:
1. Ejecutar queries de validación listadas arriba y confirmar retornos esperados (todas 0 excepto conteos informativos).
2. Probar carga concurrente (5+ uploads simultáneos mismo producto) y verificar ausencia de duplicados en (product_id, image_order).
3. Revisar logs de Edge Function para asegurar respuestas idempotentes ("Thumbnails ya existentes").
4. Planificar rotación de credenciales expuestas (DB password) y retirar cualquier variable sensible de historiales.

---

## 🧩 Notas Adicionales

- Mantener ambos campos (`thumbnails` JSON + `thumbnail_url`) implica redudancia; a mediano plazo elegir una fuente de verdad (preferible JSON y derivar desktop).  
- Considerar soportar WebP en el futuro (optimiza peso) añadiendo conversión a JPEG para thumbnails en Edge.  
- Activar DEBUG_MODE solo temporalmente para no saturar logs.  
- Probar concurrencia con script artificial (subir 5 imágenes en paralelo) tras migraciones para validar ausencia de duplicados en `image_order`.
