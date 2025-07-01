# 🧠 Instrucciones para Copilot – Análisis técnico profundo del Panel de Control Sellsi

## 🎯 Objetivo

Analiza el archivo `instrucciones.md`, que contiene requerimientos funcionales para el desarrollo de un **panel de control administrativo** en Sellsi, y genera un documento llamado `plan_implementacion.md` con un análisis técnico exhaustivo y profesional.

---

## 📂 Input

- `instrucciones.md` → contiene las instrucciones detalladas del sistema.
- Estructura de carpetas y código existente, en especial:
  - `/src/`
  - `sellsi\src\features\ui` → contiene componentes ya existentes reutilizables.
- Backend gestionado con **Supabase**.

---

## 📘 Output requerido

Un documento Markdown llamado `plan_implementacion.md` que contenga un análisis técnico estructurado según las siguientes secciones obligatorias.

---

## 📐 Secciones obligatorias del análisis

1. **Resumen ejecutivo**
   - Propósito general del panel de control.
   - Tipo de usuario objetivo.
   - Problemas que resuelve.

2. **Mapa funcional por requerimiento**
   - División por secciones (login, tabla principal, confirmación, rechazo, devolución).
   - Flujo general del sistema y de los datos.

3. **Análisis de requisitos**
   - Requisitos funcionales por bloque.
   - Requisitos no funcionales (seguridad, rendimiento, mantenimiento).

4. **Diseño de arquitectura**
   - Estructura de carpetas recomendada.
   - Relación entre frontend y Supabase.
   - Consideraciones especiales para el login seguro de administradores.

5. **Modelo de datos (Supabase)**
   - Tablas necesarias (`control_panel_users`, `control_panel`, `requests`, etc.).
   - Especificación detallada de campos, tipos de datos y restricciones.
   - Relaciones entre entidades si aplica.

6. **Plan de implementación**
   - Etapas sugeridas para desarrollar el sistema.
   - Qué construir primero y por qué.
   - Dependencias técnicas entre etapas.

7. **Validaciones críticas**
   - Seguridad en login.
   - Validación de estados.
   - Manejo de acciones críticas como rechazar pagos o devolver dinero.

8. **Reutilización y modularidad**
   - Reutilizar componentes de `sellsi\src\features\ui` siempre que sea posible.
   - Solo crear componentes nuevos si es técnicamente necesario.
   - Respetar estrictamente el orden de carpetas ya existente.

9. **Diseño de componentes frontend**
   - Qué componentes se requieren.
   - Props, eventos, lógica esperada.
   - Estado visual según estado de la operación (etiquetas: `depositado`, `cancelado`, etc.).

10. **Gestión de estados y eventos**
    - Cómo se manejarán los distintos estados del sistema.
    - Hooks personalizados, contextos o stores si se necesitan.

11. **Interacción con Supabase**
    - Detallar los llamados esperados a Supabase.
    - Inserciones, lecturas, actualizaciones.
    - Subida de archivos, filtrado por usuario, etc.

12. **Estrategia de testing**
    - Qué pruebas unitarias y de integración debe tener cada funcionalidad.
    - Casos borde relevantes.

13. **Ambigüedades, dudas o riesgos**
    - Identificar cualquier parte del requerimiento poco clara.
    - Proponer preguntas abiertas para completar requisitos faltantes.

14. **Mejoras futuras**
    - Qué se puede escalar o mejorar luego.
    - Considerar ideas como logs, auditorías, dashboards, permisos avanzados, etc.

15. **Checklist final**
    - Lista de criterios verificables para declarar terminada la implementación.
    - Considera UI, backend, flujo de correos, estado y lógica.

---

## ⚠️ Restricciones técnicas obligatorias

- ❗ Reutilizar componentes existentes de `sellsi\src\features\ui` siempre que sea posible.
- ❗ No modificar la estructura de carpetas actual.
- ❗ Solo crear nuevos componentes si realmente no existen equivalentes reutilizables.
- ❗ Todo debe ser modular, con separación clara de lógica, presentación y servicios.

---

## 📤 Resultado esperado

Generar un archivo Markdown llamado:

