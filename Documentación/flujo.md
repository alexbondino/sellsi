# Flujo de Automatización de Descarga de Contratos (Actualizado 18-06-2026)

Este documento describe el flujo actualizado y robusto del bot MtM Downloader v1.0 para la descarga masiva de contratos desde Xymmetry, incluyendo manejo de logs avanzados, paginación y feedback en tiempo real.

---

## 1. Inicio y Login
- El usuario selecciona la fecha y la carpeta de descarga desde la interfaz.
- El bot inicia el navegador Chrome y navega a la web objetivo.
- Realiza el login automático usando las credenciales configuradas.
- Todos los eventos y errores se registran en la consola de eventos.

## 2. Navegación a "Mi Cartera"
- Abre el menú lateral.
- Selecciona la opción "Mi Cartera" para acceder a la sección de contratos.
- Cambia de pestaña si la web lo requiere.

## 3. Configuración de Filtros
- Selecciona la moneda "CLP" usando múltiples estrategias de interacción.
- Selecciona la fecha de valorización (por defecto, la fecha actual si no se especifica otra).
- El bot utiliza logs de nivel INFO, DEBUG y ADVERTENCIA para informar cada paso y reintento.

## 4. Espera y Procesamiento de la Tabla de Contratos
- Espera a que la tabla principal de contratos (`#gridTable`) esté visible y cargada con filas.
- Si no hay filas, reintenta hasta que aparezcan.
- Registra en la consola la cantidad de filas detectadas.

## 5. Procesamiento de Filas (Página 1)
- Recorre todas las filas de la tabla principal (primera página).
- Para cada fila:
  - Abre el menú de acciones en la columna correspondiente usando varias estrategias (click simple, hover, JS, doble click).
  - Hace clic en "Ver contratos" para mostrar la tabla de contratos detallados.
  - Todos los intentos y errores se loguean con su nivel correspondiente.

## 6. Espera de la Nueva Tabla de Contratos
- Espera de forma robusta a que la nueva tabla de contratos esté lista (detectando el menú de acciones `#dropdownMenuLink`).
- Usa detección de spinners y overlays para evitar errores por recargas dinámicas.

## 7. Descarga de Archivos (Página 1)
- Descarga el archivo Excel de resumen.
- Recorre todas las filas de la tabla de contratos detallados:
  - Abre el menú de acciones de cada fila.
  - Hace clic en "Editar".
  - Espera la vista de detalle.
  - Hace clic en "Descargar Contrato".
  - Cierra la vista de detalle y vuelve a la tabla.
  - Cada acción y error queda registrado en la consola.

## 8. Paginación (Si existe página 2 o más)
- Busca el botón de página 2 en la paginación.
- Si existe:
  - Hace clic en el botón de página 2.
  - Espera la recarga robusta de la tabla de contratos.
  - Repite el proceso de descarga de archivos para las filas de la nueva página.
  - El proceso se repite para todas las páginas detectadas.
- Si no existe, finaliza el proceso.

## 9. Fin del Proceso
- El bot finaliza cuando ha procesado todas las páginas y filas de contratos.
- Todos los pasos, advertencias y errores quedan registrados en la consola de eventos y pueden ser filtrados por nivel.
- El usuario puede copiar los logs filtrados para diagnóstico o auditoría.

---

**Notas de robustez y mejoras:**
- El bot espera siempre la desaparición de spinners y overlays antes de interactuar.
- Usa detección robusta de cambios en la tabla para evitar errores por recargas dinámicas.
- Todos los clicks se intentan con varias estrategias para máxima compatibilidad.
- El sistema de logs avanzado permite filtrar y copiar eventos por nivel (INFO, DEBUG, ERROR, ÉXITO, ADVERTENCIA).
- El flujo es modular y escalable, permitiendo futuras integraciones como renombrado de archivos en tiempo real.

---

Este flujo asegura que todos los contratos de todas las páginas sean descargados de forma confiable, trazable y automática, con feedback en tiempo real para el usuario.
