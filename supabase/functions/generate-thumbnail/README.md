## Supabase Edge Function - generate-thumbnail

## Descripción

Esta función Edge recibe una imagen de producto, genera 4 thumbnails (incluyendo minithumb 40x40), los sube a Supabase Storage y actualiza la tabla `product_images` con las URLs públicas de los thumbnails.

---

## Entradas

- **Método HTTP:** `POST`
- **Body JSON:**
  - `imageUrl` (string, requerido): URL pública de la imagen original.
  - `productId` (string, requerido): ID del producto.
  - `supplierId` (string, requerido): ID del proveedor.

---

## Proceso

1. **Validación de parámetros**  
   Verifica que `imageUrl`, `productId` y `supplierId` estén presentes.

2. **Descarga de imagen**  
   Descarga la imagen original desde `imageUrl` (timeout: 30s).

3. **Generación de thumbnails**  
   Crea 4 versiones:
   - `minithumb` 40x40 px
   - `mobile` 190x153 px
   - `tablet` 300x230 px
   - `desktop` 320x260 px

4. **Subida a Supabase Storage**  
   Sube cada thumbnail a la ruta:  
   `product-images-thumbnails/{supplierId}/{productId}/{timestamp}_{tipo}_{ancho}x{alto}.jpg`

5. **Actualización de base de datos**  
   Actualiza la tabla `product_images` para el `product_id` correspondiente, guardando las URLs públicas de los thumbnails en el campo `thumbnails` (tipo JSONB).

6. **Respuesta**  
   Devuelve un JSON con:
   - `success` (boolean)
   - `thumbnailUrl` (string, desktop por compatibilidad)
   - `thumbnails` (objeto con URLs de cada tamaño)
   - `sizes` (objeto con dimensiones)
   - `originalSize` (bytes)
   - `generatedAt` (ISO string)

---

## Salidas

**Ejemplo de respuesta exitosa:**
```json
{
  "success": true,
  "thumbnailUrl": "https://.../desktop_320x260.jpg",
  "thumbnails": {
    "minithumb": "https://.../minithumb_40x40.jpg",
    "mobile": "https://.../mobile_190x153.jpg",
    "tablet": "https://.../tablet_300x230.jpg",
    "desktop": "https://.../desktop_320x260.jpg"
  },
  "sizes": {
    "minithumb": { "width": 40, "height": 40 },
    "mobile": { "width": 190, "height": 153 },
    "tablet": { "width": 300, "height": 230 },
    "desktop": { "width": 320, "height": 260 }
  },
  "originalSize": 123456,
  "generatedAt": "2025-07-14T12:34:56.789Z"
}
```

**Errores comunes:**
- 400: Faltan parámetros requeridos o la imagen no se pudo descargar.
- 500: Error interno, problemas de configuración o de subida a storage.

---


## Notas de operación

- Todos los thumbnails se generan en formato JPEG.
- Si la imagen original es WebP (de cualquier tipo), el pipeline aborta y no genera thumbnails. No se permite WebP como imagen de entrada.
- Si la imagen original tiene transparencia (por ejemplo, PNG con canal alfa), el pipeline aborta y no genera thumbnails.
- El campo `thumbnails` en la tabla `product_images` debe ser de tipo JSONB.
- El proceso es idempotente: si se vuelve a llamar con la misma imagen, se generan nuevos thumbnails con timestamp diferente.
- El minithumb (40x40) está disponible para componentes que requieran imágenes pequeñas y rápidas de cargar.

---

## Ejemplo de invocación local

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-thumbnail' \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{"imageUrl":"https://example.com/image.jpg","productId":"test-product","supplierId":"test-supplier"}'
```

---

## Dependencias

- Supabase Storage bucket: `product-images-thumbnails`
- Tabla: `product_images` (campo `thumbnails` tipo JSONB)
- Deno, imagescript

---

## Actualizaciones recientes

- [2025-07-14] Añadido soporte para minithumb (40x40) y actualizado el pipeline para todos los breakpoints.

---

## Contacto

Para soporte, contactar a @klaus o al equipo de backend.
