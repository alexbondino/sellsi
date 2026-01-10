# 📉 Informe Técnico: Análisis y Mitigación de "Network Stalling"

**Proyecto:** Sellsi Marketplace
**Fecha:** 10 de Enero, 2026
**Foco:** Optimización Frontend (React) y Tiempos de Red.

---

## 1. Definición del Problema: ¿Qué es el "Stalling"?

El "Stalling" (o tiempo de bloqueo) es el tiempo que una petición pasa **esperando en la cola del navegador** antes de ser enviada a internet.

**El síntoma actual:**
Aunque Supabase responda rápido (TTFB bajo), tu aplicación se siente lenta porque el navegador retiene las peticiones.

- **Causa Técnica:** Los navegadores limitan a **6 conexiones simultáneas** por dominio (HTTP/1.1).
- **Tu Situación:** Al disparar 15 o 20 peticiones a la vez (debido al listado de productos y usuario), las primeras 6 salen, y las otras 14 deben esperar su turno. Esto crea un efecto de "escalera" en la carga.

---

## 2. Evidencia Forense (Datos Recolectados)

Según el análisis de tráfico capturado vía `performance.getEntriesByType`, se detectaron tres patrones críticos que saturan la cola de conexiones:

### A. Patrón "N+1" en Precios de Productos

Se observan múltiples peticiones idénticas secuenciales al endpoint `product_price_summary`.

- **Observación:** El componente de tarjeta de producto está solicitando su precio individualmente al renderizarse.
- **Impacto:** Si hay 20 productos, se generan 20 peticiones + 20 conexiones TCP overhead.

```json
// EVIDENCIA
{ "url": "product_price_summary", "stalling_ms": -1745 },
{ "url": "product_price_summary", "stalling_ms": -1745 },
{ "url": "product_price_summary", "stalling_ms": -1746 }
```

B. "Cache Busting" Involuntario (El Logo)
Se detectó la descarga repetida de recursos estáticos pesados (logo.png) debido a parámetros dinámicos en la URL.

Observación: La URL contiene ?cb=1768... (probablemente Date.now()).

Impacto: Anula el caché del navegador. El usuario descarga la misma imagen una y otra vez, ocupando ancho de banda vital para los datos de la API.

// EVIDENCIA
{ "url": "logo.png", "params": "cb=1768064077494...", "download_ms": 2069 },
{ "url": "logo.png", "params": "cb=1768064078423...", "download_ms": 2093 }

C. Fragmentación de Datos de Usuario
Se realizan múltiples llamadas "micro" para obtener partes del perfil del mismo usuario en paralelo.

Observación: users?select=bank_info y users?select=logo_url ocurren por separado.

Impacto: Ocupa 2 slots de conexión de los 6 disponibles para traer información que debería venir junta.

## 3. Plan de Solución (Refactor Frontend)

✅ Solución 1: "Batching" de Precios (Eliminar N+1)
Objetivo: Convertir 20 peticiones de 1KB en 1 petición de 20KB.

Cambio en React: Mover la lógica de fetch desde el componente hijo (ProductCard) al componente padre (ProductList).

-Antes (Incorrecto - En ProductCard.tsx):

```js
// Mal: Se ejecuta por cada producto
useEffect(() => {
  supabase.from('product_price_summary').select('*').eq('product_id', props.id)...
}, []);
```

-Ahora (Correcto - En ProductList.tsx):

```js
// Bien: Se ejecuta una sola vez para toda la lista
const productIds = products.map((p) => p.id)
const { data } = await supabase
  .from('product_price_summary')
  .select('*')
  .in('product_id', productIds) // <--- LA CLAVE ES .in()
```

✅ Solución 2: Habilitar Caché de Imágenes
Objetivo: Que el logo se descargue una sola vez (0ms en siguientes cargas).

Cambio en React: Localizar dónde se renderiza el logo (Navbar o Header) y eliminar el parámetro de tiempo.

Código a buscar y eliminar:

```js
src={`/logo.png?cb=${new Date().getTime()}`} // ELIMINAR ESTO
```

Reemplazar por:

```text
src="/logo.png" // Dejar limpio
```

Solución 3: Unificación de Contexto de Usuario
Objetivo: Liberar conexiones al inicio de la carga.

Cambio en React: Crear o modificar el UserContext para traer toda la data relacionada en un solo query.

Query Optimizado:

```js
const { data } = await supabase
  .from('users')
  .select(
    `
    *,
    bank_info (*),
    shipping_info (*),
    billing_info (*)
  `
  )
  .eq('user_id', userId)
  .single()
```

## 4. Resultado Esperado

Al implementar estos 3 cambios, transformaremos la "cascada" de red:

Reducción de Requests: Pasaremos de ~30 peticiones por carga a ~4 o 5.

Eliminación de Stalling: Al haber menos peticiones que el límite del navegador (6), el tiempo de espera en cola (stalling_ms) debería caer a casi 0ms.

Percepción de Velocidad: La interfaz responderá inmediatamente, ya que no estará esperando a que termine de descargarse el logo por enésima vez para mostrar los datos.

Fin del documento de análisis de Stalling.
