
# Módulo Ban

Este módulo gestiona la visualización y lógica de cuentas baneadas en Sellsi.

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Informa al usuario sobre el estado de ban y permite contacto para revisión.
- **Arquitectura:** Componente principal `BanPageView` que consume el hook `useBanStatus` y renderiza la UI de ban.
- **Función:** Mostrar motivos y tipo de ban, y facilitar contacto con soporte.
- **Flujo de datos:**
  - `BanPageView` obtiene el estado de ban desde el hook y lo pasa a la UI.
  - El usuario puede enviar un correo a soporte con los detalles del ban.

## 2. Listado de archivos
| Archivo           | Tipo       | Descripción                                 | Responsabilidad                       |
|-------------------|------------|---------------------------------------------|---------------------------------------|
| index.js          | Entrada    | Exporta el componente principal             | Punto de entrada del módulo           |
| BanPageView.jsx   | Componente | Página principal de ban                     | Renderiza la UI y gestiona interacción|

## 3. Relaciones internas del módulo
```
BanPageView
├── BannedPageUI (recibe banStatus y onContactClick)
└── useBanStatus (hook para estado de ban)
```
- Comunicación por props: `banStatus`, `onContactClick`
- El hook gestiona la lógica y el componente la presentación.

## 4. Props de los componentes
### BannedPageUI
| Prop           | Tipo           | Requerido | Descripción                                      |
|----------------|----------------|-----------|--------------------------------------------------|
| banStatus      | object         | Sí        | Estado actual del ban (motivo, tipo, fecha, etc) |
| onContactClick | function       | Sí        | Callback para contactar soporte                   |

---

Actualizado: Julio 2025
