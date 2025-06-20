# Plan de Acción para la Gestión de Thumbnails en el Marketplace

## 1. Contexto y Objetivo

El objetivo es optimizar la entrega de imágenes en el marketplace, generando automáticamente thumbnails de la imagen principal de cada producto usando Supabase Edge Functions. Esto mejorará el rendimiento, reducirá el consumo de ancho de banda y ofrecerá una mejor experiencia de usuario en todos los dispositivos.

---

# SECCIÓN BACKEND

## 2. Lógica de Negocio: ¿Qué imagen debe tener thumbnail?

- Al agregar un producto en `AddProduct.jsx`, el usuario puede subir hasta 5 imágenes.
- **La primera imagen** es la principal y debe tener:
  - Versión original (alta resolución, hasta 2MB).
  - Versión thumbnail (optimizada para ProductCard y SupplierProductCard).
- Las otras imágenes solo requieren la versión original.

---

## 3. Cambios en la Base de Datos (query.sql)

### Estructura actual relevante:
- Tabla `product_images`:
  - `product_id uuid`
  - `image_url text`

### Modificación necesaria:
- Agregar columna `thumbnail_url text`:
  ```sql
  ALTER TABLE public.product_images ADD COLUMN thumbnail_url text;
  ```
- Alternativamente, usar una convención de nombres para derivar la URL del thumbnail a partir de la original.

---

## 4. Edge Function en Supabase: Generación Automática de Thumbnails

### ¿Qué es una Edge Function?
- Es una función serverless que se ejecuta en la red global de Cloudflare, permitiendo lógica personalizada (procesamiento de imágenes, autenticación, etc.) con baja latencia.

### ¿Cómo funciona para imágenes?
- Recibe la imagen original (por URL o buffer).
- Usa una librería como `sharp` para redimensionar la imagen.
- Sube el thumbnail generado a un bucket de thumbnails en Supabase Storage.
- Retorna la URL pública del thumbnail.

### Pasos detallados:
1. **Crear el bucket `product-images-thumbnails`** en Supabase Storage.
2. **Crear la Edge Function** (Node.js + sharp):
   - Recibe la imagen original, el productId y supplierId.
   - Descarga la imagen original.
   - Redimensiona a 300x225px (o los tamaños que definas).
   - Sube el thumbnail al bucket.
   - Retorna la URL pública del thumbnail.
3. **Disparar la función**:
   - Desde el frontend, después de subir la imagen principal, llama a la Edge Function y guarda la URL del thumbnail en la base de datos.
   - Alternativamente, usar un webhook de Supabase Storage para disparar la función automáticamente al subir una imagen (requiere configuración avanzada).

### ¿Cuántos thumbnails crear?
- **Recomendado:** Un solo thumbnail de 300x225px (sirve para todos los breakpoints, el navegador lo escala).
- Si quieres máxima optimización, puedes generar varios (100x75, 150x122.5, 180x135, 280x210, 300x225) y servir el adecuado con `srcset` en el frontend, pero esto complica la gestión y almacenamiento.

---

## 5. Ejemplo de Edge Function (Node.js + sharp)

```js
import { serve } from 'std/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { imageUrl, productId, supplierId } = await req.json()
  const supabase = createClient(DENO_ENV_SUPABASE_URL, DENO_ENV_SUPABASE_ANON_KEY)
  const { data: imageBuffer } = await fetch(imageUrl).then(res => res.arrayBuffer())
  const thumbnail = await sharp(Buffer.from(imageBuffer))
    .resize(300, 225)
    .jpeg({ quality: 80 })
    .toBuffer()
  const { data, error } = await supabase.storage
    .from('product-images-thumbnails')
    .upload(`${supplierId}/${productId}/thumbnail.jpg`, thumbnail, { contentType: 'image/jpeg' })
  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  const { publicUrl } = supabase.storage.from('product-images-thumbnails').getPublicUrl(`${supplierId}/${productId}/thumbnail.jpg`).data
  return new Response(JSON.stringify({ thumbnailUrl: publicUrl }), { status: 200 })
})
```

---

## 6. Seguridad y Robustez
- Validar tipo y tamaño de imagen antes de procesar.
- Manejar errores de subida y generación de thumbnails.
- Si usas webhooks, asegúrate de que la función solo procese imágenes principales.

---

# SECCIÓN FRONTEND

## 7. Cambios en el Frontend

### En `AddProduct.jsx` y hooks relacionados
- Cuando el usuario sube imágenes:
  1. Sube la imagen principal a Supabase Storage.
  2. Llama a la Edge Function para generar el thumbnail.
  3. Guarda ambas URLs (`image_url` y `thumbnail_url`) en la tabla `product_images`.
- Si usas hooks personalizados para subir imágenes, deberás modificar el hook para que:
  - Detecte cuál es la imagen principal.
  - Espere la generación del thumbnail antes de guardar el producto.
  - Actualice el estado del formulario con ambas URLs.

### En `ProductCard.jsx` y `SupplierProductCard.jsx`
- Usar siempre la URL del thumbnail para mostrar la imagen principal.
- Mantener `objectFit: 'contain'` y el contenedor con los breakpoints definidos.

### En `ProductPageView`
- Usar la URL de la imagen original para mostrar la imagen principal en alta resolución.

---

## 8. Resumen del Flujo de Agregar Producto

1. Usuario sube hasta 5 imágenes en `AddProduct.jsx`.
2. La primera imagen se sube a Supabase Storage.
3. Se llama a la Edge Function para generar el thumbnail.
4. Se guarda en la base de datos:
   - `image_url` (original)
   - `thumbnail_url` (thumbnail)
5. El resto de imágenes solo se suben como originales.
6. Al renderizar ProductCard/SupplierProductCard, se usa el thumbnail.
7. Al renderizar ProductPageView, se usa la original.

---

## 9. Detalle de Hooks y Lógica de Integración

### Hooks a modificar:
- `useProductForm` (o el hook que maneje el formulario de producto):
  - Debe identificar la imagen principal (primera del array).
  - Al subir la imagen principal, debe esperar la respuesta de la Edge Function y guardar ambas URLs.
  - El resto de imágenes se suben normalmente.
- `useSupplierProducts` (si maneja la lógica de subida):
  - Similar, debe soportar la lógica de thumbnails.

### Ejemplo de integración en el hook:
```js
async function handleImageUpload(images) {
  // Subir todas las imágenes
  const uploadedImages = await Promise.all(images.map(async (img, idx) => {
    const { url } = await uploadToSupabase(img.file)
    let thumbnailUrl = null
    if (idx === 0) {
      // Llamar a la Edge Function para la principal
      thumbnailUrl = await generateThumbnailEdgeFunction(url, productId, supplierId)
    }
    return { url, thumbnailUrl }
  }))
  // Guardar en la base de datos
  // ...
}
```

---

## 10. Opcional: Soporte para `srcset` y múltiples thumbnails
- Si quieres máxima optimización, puedes generar varios thumbnails y usar `srcset` en el tag `<img>` para servir diferentes tamaños según el breakpoint.
- Ejemplo de `srcset`:
  ```html
  <img src="thumbnail-300.jpg" srcset="thumbnail-100.jpg 100w, thumbnail-150.jpg 150w, thumbnail-180.jpg 180w, thumbnail-280.jpg 280w, thumbnail-300.jpg 300w" sizes="(max-width: 411px) 100px, (max-width: 767px) 150px, (max-width: 1919px) 180px, (max-width: 2159px) 280px, 300px" />
  ```
- Esto requiere modificar la Edge Function para generar varios tamaños y guardar todas las URLs en la base de datos.

---

## 11. Checklist de Implementación
- [ ] Crear bucket de thumbnails en Supabase Storage.
- [ ] Modificar tabla `product_images` para soportar `thumbnail_url`.
- [ ] Crear y desplegar Edge Function para generación de thumbnails.
- [ ] Modificar hooks y lógica de subida en el frontend para soportar thumbnails.
- [ ] Actualizar componentes para usar thumbnails en ProductCard y SupplierProductCard.
- [ ] Probar el flujo completo de agregar producto y visualización en el marketplace.

---

## 12. Consideraciones Finales
- Mantener la imagen original para la ficha técnica.
- Usar thumbnails solo en listados y tarjetas.
- Documentar el flujo y actualizar la documentación técnica del proyecto.

---
