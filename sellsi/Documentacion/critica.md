Carrera cuando no existen filas del producto (orden = 0)

Tu RPC calcula MAX(image_order) con FOR UPDATE, pero si no hay filas para ese product_id, dos inserciones simultáneas pueden devolver 0.

Arreglo: usa advisory lock por product_id dentro del RPC o un INSERT … ON CONFLICT … en bucle. (Te dejo función ejemplo abajo.)

Migración 1.1 ordenando por image_url

El “principal” queda arbitrario. Si importa cuál es la principal real, esta migración puede asignar mal la imagen 0.

Arreglo: define un criterio estable (p.ej. created_at más antiguo). Si no existe, añade created_at primero y reordena usando un proxy (por ejemplo, storage_path con heurística) o un mapeo manual para casos críticos.

Idempotencia parcial en Edge

El .is('thumbnails', null) evita pisar si está totalmente NULL, pero no cubre JSON parcial (solo mobile, sin desktop).

Arreglo: mover la lógica a un RPC UPDATE condicional: WHERE thumbnails IS NULL OR NOT (thumbnails ? 'desktop') OR thumbnail_url IS NULL.

RLS / credenciales en Edge

El ejemplo usa anon key; si RLS está activa, el UPDATE puede fallar silenciosamente.

Arreglo: usar service role en Edge y/o políticas específicas. Sin esto, la robustez real baja.

Índice único y bloqueos

CREATE UNIQUE INDEX CONCURRENTLY fallará si persisten duplicados. Además, no va en transacción; requiere orquestación exacta.

Arreglo: valida antes que no haya duplicados; si hay, pausa escrituras de product_images en la app durante la ventana.

Borrado de thumbnails secundarios

Limpias columnas, pero no limpias objetos del bucket → huérfanos y costo.

Arreglo: sube 3.5 (detección y purge) a NECESARIO.

Esquema incompleto para integridad

Falta CHECK (image_order >= 0), FK a products (ON DELETE CASCADE), y updated_at.

Arreglo: añadir estos constraints para cerrar vías de corrupción.

Reintentos/observabilidad

La generación es “fire & forget” y la tabla de jobs es OPCIONAL. Sin tracking no hay robustez operativa.

Arreglo: sube image_thumbnail_jobs a NECESARIO.

Cambios mínimos para subir a 9/10
1) RPC verdaderamente atómico (advisory lock)
CREATE OR REPLACE FUNCTION insert_image_with_order(
  p_product_id uuid,
  p_image_url  text,
  p_supplier_id uuid
) RETURNS integer AS $$
DECLARE
  v_next integer;
  v_lock_key bigint;
BEGIN
  -- Deriva una llave 64-bit desde el UUID (hash md5 truncado)
  SELECT ('x'||substr(md5(p_product_id::text),1,16))::bit(64)::bigint INTO v_lock_key;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COALESCE(MAX(image_order), -1) + 1
    INTO v_next
    FROM product_images
   WHERE product_id = p_product_id
   FOR UPDATE;

  INSERT INTO product_images (id, product_id, image_url, image_order, created_at)
  VALUES (gen_random_uuid(), p_product_id, p_image_url, v_next, now());

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

2) UPDATE condicional idempotente (evitar JSON parcial)

Mueve el update a un RPC:

CREATE OR REPLACE FUNCTION set_main_thumbnails(
  p_product_id uuid,
  p_desktop text,
  p_mobile text,
  p_tablet text,
  p_minithumb text
) RETURNS void AS $$
BEGIN
  UPDATE product_images
     SET thumbnails = jsonb_build_object(
           'minithumb', p_minithumb,
           'mobile',    p_mobile,
           'tablet',    p_tablet,
           'desktop',   p_desktop
         ),
         thumbnail_url = p_desktop
   WHERE product_id = p_product_id
     AND image_order = 0
     AND (thumbnails IS NULL
          OR NOT (thumbnails ? 'desktop')
          OR thumbnail_url IS NULL);
END;
$$ LANGUAGE plpgsql;


En Edge llamas al RPC. Además: usa service role y valida RLS.

3) Constraints y saneo
ALTER TABLE product_images
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN image_order SET NOT NULL,
  ADD CONSTRAINT chk_image_order_nonneg CHECK (image_order >= 0),
  ADD CONSTRAINT fk_product_images_products
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_images_product_order
  ON product_images(product_id, image_order);

4) Purga de objetos huérfanos (necesario)

Promueve 3.5 a NECESARIO y automatízalo semanalmente; no lo dejes manual.

5) Migración 1.1 con criterio estable

Antes de normalizar:

Añade created_at y, si puedes, rellénalo (p.ej., desde metadatos o aproximación por lotes).

Usa ORDER BY created_at, image_url para definir la principal.

6) Job table para thumbnails (necesario)

Persistir intentos, estado, errores y permitir retry. Sin esto, cualquier flake deja huecos silenciosos.