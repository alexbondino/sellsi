# Documentación MtM Downloader v1.0

**Fecha de compilación:** 18-06-2026

---

## Descripción general
MtM Downloader es una aplicación de automatización desarrollada en Python que permite la descarga masiva y gestión de archivos de contratos desde la plataforma Xymmetry, integrando una interfaz gráfica amigable y una consola de eventos avanzada para el seguimiento en tiempo real del proceso.

---

## Estructura y módulos principales

- **mtm_downloader.py**: Punto de entrada y gestor principal de la interfaz gráfica (Tkinter). Orquesta la selección de fecha, carpeta, ejecución y muestra la consola de eventos.
- **components/consola_widget.py**: Consola de eventos modular con filtrado por nivel (INFO, DEBUG, ERROR, ÉXITO, ADVERTENCIA), copiado selectivo y visualización en tiempo real.
- **components/mensajes.py**: Gestión centralizada de mensajes, modales y advertencias para el usuario.
- **components/botones.py / tooltip.py**: Componentes visuales reutilizables para la UI.
- **automation/web_automator.py**: Controlador de alto nivel del flujo de automatización, integrando los módulos de Selenium y lógica de negocio.
- **automation/modules/**: Submódulos especializados:
    - **browser_manager.py**: Manejo y configuración del navegador Chrome.
    - **login_handler.py**: Lógica de autenticación y reintentos.
    - **navigation_handler.py**: Navegación entre secciones y manejo de pestañas.
    - **ui_controller.py**: Interacción avanzada con elementos de la UI (dropdowns, date pickers, etc).
    - **downloader.py**: Descarga de archivos y gestión de ciclos de descarga.
    - **element_finder.py**: Búsqueda robusta de elementos y estrategias de click.

---

## Lógica y fortalezas del código

- **Modularidad**: Cada función y responsabilidad está separada en módulos, facilitando el mantenimiento y la escalabilidad.
- **Logs avanzados**: El sistema de logs permite filtrar, copiar y visualizar en tiempo real los eventos relevantes, con niveles diferenciados y colores.
- **Robustez**: Manejo de errores y reintentos en los puntos críticos (login, navegación, clicks, descargas).
- **UX**: Interfaz clara, feedback inmediato y opciones de interacción para el usuario.
- **Escalabilidad**: La arquitectura permite agregar nuevas funciones o módulos sin afectar el flujo principal.

---

## Propuesta para versión 1.1: Renombrado de archivos en tiempo real

**Objetivo:**
Permitir que, a medida que se descargue un archivo, el bot reciba el nombre final deseado (por consola o lógica interna) y lo renombre automáticamente en la carpeta de descargas, sin interrumpir el flujo de automatización.

**¿Es posible?**
Sí, es totalmente factible. Python permite monitorear una carpeta y renombrar archivos en tiempo real usando módulos como `os`, `shutil` o incluso `watchdog` para detectar cambios.

**¿Cómo se podría abordar en tu código?**
- Integrar un hilo o función que escuche los eventos de descarga completada.
- Al recibir el nombre deseado (por consola, log o lógica interna), usar `os.rename` para cambiar el nombre del archivo en la carpeta de descargas.
- Sincronizar este proceso con el flujo de descargas para evitar conflictos.
- Integrar feedback en la consola de eventos para informar al usuario de cada renombrado.

**Ejemplo básico:**
```python
import os
import time

def renombrar_archivo(origen, destino):
    while not os.path.exists(origen):
        time.sleep(0.5)
    os.rename(origen, destino)
```

**Notas:**
- Se recomienda usar un hilo separado para no bloquear la UI.
- Se puede mejorar con `watchdog` para detectar descargas automáticamente.
- La integración debe ser cuidadosa para no interferir con la lógica de Selenium.

---

## Conclusión
MtM Downloader v1.0 es una solución robusta, modular y lista para escalar. La integración de renombrado en tiempo real y otras mejoras propuestas pueden llevar el proyecto a un siguiente nivel profesional en la versión 1.1.
