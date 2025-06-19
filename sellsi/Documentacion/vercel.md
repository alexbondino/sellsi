# Problema de 404 al refrescar rutas en Vercel (Vite/React)

## Problema
Al desplegar la aplicación en Vercel, si el usuario navega a una ruta interna (por ejemplo, `/marketplace` o `/producto/123`) y presiona F5 (refrescar), el navegador muestra un error:

```
404: NOT_FOUND
Code: NOT_FOUND
ID: ...
```

## Causa
Vercel, por defecto, solo sirve archivos estáticos. Cuando se refresca una ruta distinta a la raíz, Vercel intenta buscar un archivo físico en esa ruta y, al no encontrarlo, devuelve 404. En desarrollo, el servidor de Vite/React intercepta todas las rutas y las redirige a `index.html`, permitiendo el enrutamiento del lado del cliente. En producción, esto no ocurre automáticamente.

## Solución
Agregar un archivo `vercel.json` en la raíz del proyecto con la siguiente configuración:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esto indica a Vercel que todas las rutas no estáticas deben ser servidas por `index.html`, permitiendo que el router de React maneje la navegación correctamente.

## Pasos para aplicar la solución
1. Crear el archivo `vercel.json` en la raíz del proyecto.
2. Hacer commit y push de este archivo.
3. Volver a desplegar la aplicación en Vercel.

Con esto, el refresco de página funcionará correctamente en todas las rutas de la SPA.
