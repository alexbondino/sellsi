# Modo Build de Producción y Servidor Local (SPA)

## Generar el build de producción

En PowerShell, el operador `&&` no funciona como en bash. Por eso, para generar el build de producción de Sellsi, debes ejecutar los comandos por separado:

1. Cambia a la carpeta del proyecto donde está el `package.json`:
   ```powershell
   cd sellsi
   ```
2. Ejecuta el build de producción:
   ```powershell
   npm run build
   ```

Esto generará la carpeta `dist` con los archivos optimizados para producción.

## Servir el build localmente y evitar error 404 al refrescar (F5)

Por defecto, al refrescar una ruta interna en una SPA (por ejemplo, `/mis-ordenes`), los servidores estáticos muestran un error 404 porque buscan un archivo físico que no existe. Para evitar esto:

1. Instala el servidor estático `serve` (solo la primera vez):
   ```powershell
   npm install -g serve
   ```
2. Sirve la carpeta `dist` en modo SPA:
   ```powershell
   serve -s dist
   ```

El flag `-s` (single) asegura que todas las rutas se redirijan a `index.html`, evitando el error 404 al refrescar o navegar directamente a rutas internas.

---

**Resumen:**
- Ejecuta el build desde la carpeta correcta.
- Usa `serve -s dist` para simular producción y evitar caídas al refrescar rutas en modo local.
