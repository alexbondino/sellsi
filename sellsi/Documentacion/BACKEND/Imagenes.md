# Análisis y solución para la gestión de imágenes en Sellsi Marketplace

## Problema actual

En el marketplace de Sellsi, las imágenes de productos pueden pesar hasta 2 MB cada una y se almacenan en alta resolución para ser mostradas en detalle en la ficha técnica del producto (Product Page View). Sin embargo, actualmente estas mismas imágenes pesadas se envían directamente desde el backend (Supabase) a las Product Cards del marketplace, que solo requieren thumbnails o miniaturas.

### Consecuencias de este enfoque:
- Las Product Cards reciben imágenes de hasta 2 MB, lo que ralentiza la carga de las páginas y aumenta el consumo de ancho de banda.
- La experiencia de usuario se ve afectada, especialmente en dispositivos móviles o conexiones lentas.
- El navegador procesa imágenes mucho más grandes de lo necesario, afectando la fluidez de la interfaz.

## Análisis de la arquitectura actual
- **Backend:** Supabase Storage almacena las imágenes originales en alta resolución.
- **Frontend:** La primera imagen subida en `AddProduct.jsx` se utiliza como imagen principal en la Product Card y la Product Page View.
- **No existe generación ni uso de versiones reducidas (thumbnails) para las Product Cards.**

## ¿Dónde se debe resolver?
La solución óptima es **mixta**, pero el punto crítico es el backend (Supabase):
- **Backend:** Debe generar y almacenar automáticamente una versión reducida (thumbnail) de cada imagen subida. Así, el frontend puede solicitar la versión adecuada según el contexto (miniatura para Product Card, original para Product Page View).
- **Frontend:** Debe consumir la URL del thumbnail en las Product Cards y la URL de la imagen original en la Product Page View.

## Propuesta de solución

### 1. Generación de thumbnails en Supabase
- Utilizar funciones edge (Edge Functions) o Storage Functions de Supabase para generar automáticamente una versión reducida (ej: 300x300px, <100 KB) cada vez que se sube una imagen.
- Guardar el thumbnail en una carpeta o bucket separado (ej: `product-images-thumbnails/`).
- Almacenar en la base de datos la referencia a ambas versiones (original y thumbnail) o seguir una convención de nombres para acceder a ambas.

### 2. Adaptación del frontend
- En el componente `AddProduct.jsx`, al subir imágenes, guardar la referencia de la imagen original y su thumbnail.
- En las Product Cards (`ProductCard.jsx`) y en las tarjetas de productos del proveedor (`SupplierProductCard.jsx`), mostrar la URL del thumbnail.
- En la Product Page View, mostrar la imagen original de alta resolución.

### 3. Cambios en la base de datos (Supabase)
- Si se almacena la URL de la imagen en la tabla de productos, agregar un campo para la URL del thumbnail (opcional si se usa convención de nombres).

## Tamaños máximos de imágenes en las tarjetas

### ProductCard
- **xs (0–411px):** 100 x 52,6 px
- **sm (412–767px):** 150 x 78,9 px
- **md (768–1919px):** 180 x 94,7 px
- **lg (1920–2159px):** 280 x 147,3 px
- **xl (2160px en adelante):** 300 x 157,9 px

### ProductCard AJUSTADA 4:3
- **xs (0–411px):** 100 x 75 px
- **sm (412–767px):** 150 x 122.5 px
- **md (768–1919px):** 180 x 135 px
- **lg (1920–2159px):** 280 x 210 px
- **xl (2160px en adelante):** 300 x 225 px

### SupplierProductCard
- **lg:** 306 x 137 px
- **xl:** 306 x 137 px

Estos valores corresponden al tamaño máximo visible de la imagen en cada tarjeta para los breakpoints definidos en el tema.

## Resumen de pasos para implementar
1. Configurar Supabase Storage para generar thumbnails automáticamente al subir imágenes (usando funciones edge o un servicio externo).
2. Adaptar el modelo de datos para guardar la referencia a los thumbnails.
3. Modificar el frontend para consumir la versión adecuada según el contexto.

## Beneficios
- Mejor rendimiento y experiencia de usuario.
- Menor consumo de ancho de banda y recursos.
- Imágenes de alta calidad solo donde realmente se necesitan.

---

**Notas:**
- Si Supabase no soporta generación automática de thumbnails, se puede usar un servicio externo (Cloudinary, Imgix, etc.) o procesar las imágenes en el frontend antes de subirlas.
- Es importante mantener la imagen original para la ficha técnica y solo usar la reducida en listados.



