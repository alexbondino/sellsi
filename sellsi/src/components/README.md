# README: src/components

Este documento describe el funcionamiento y la arquitectura de la carpeta `src/components` del proyecto Sellsi, siguiendo la estructura de documentación propuesta en Pipeline ReadmeV3.md.

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Provee componentes reutilizables y funcionales para la interfaz de usuario, facilitando la construcción de vistas y la gestión de estados visuales.
- **Arquitectura:** Basada en React, con patrones de diseño como lazy loading, composición y hooks personalizados. Se emplea Material UI para estilos y loaders.
- **Función principal:** Renderizar y proteger vistas, mostrar loaders, manejar estados de ban, y facilitar la integración con otras features.
- **Flujo de datos:** Los componentes reciben props, consumen hooks para lógica de negocio y renderizan vistas según el estado de la aplicación.

## 2. Listado de archivos
| Archivo            | Tipo        | Descripción                                 | Responsabilidad                       |
|--------------------|-------------|---------------------------------------------|---------------------------------------|
| BanGuard.jsx       | Componente  | Protege rutas y vistas según estado de ban  | Renderiza BanPageView o children      |
| Loader.jsx         | Componente  | Muestra animación de carga                  | Indicador visual de loading           |
| LazyPDFRenderer.jsx| Componente  | Renderiza PDFs de forma lazy                | Optimiza carga de PDFs                |
| WhatsAppWidget.jsx | Componente  | Widget de WhatsApp para contacto rápido     | Integración de chat externo           |

## 3. Relaciones internas del módulo
- BanGuard.jsx usa Loader.jsx y BanPageView (lazy import).
- Los componentes pueden compartir hooks y props.

```
BanGuard
├── Loader
└── BanPageView (lazy)
LazyPDFRenderer
WhatsAppWidget
```

## 4. Props de los componentes
### BanGuard
| Prop     | Tipo    | Requerido | Descripción                                 |
|----------|---------|-----------|---------------------------------------------|
| children | node    | Sí        | Elementos a renderizar si no está baneado   |
| userId   | string  | No        | ID de usuario para verificación de ban      |

### Loader
| Prop     | Tipo    | Requerido | Descripción                                 | Default |
|----------|---------|-----------|---------------------------------------------|---------|
| size     | number  | No        | Tamaño del loader (diámetro del círculo)    | 80      |
| logoSize | number  | No        | Tamaño del logo central                     | 48      |

## 5. Hooks personalizados
### useBanStatus(userId, checkIp)
- **Propósito:** Verifica si el usuario o IP está baneado.
- **Estados:** `banStatus`, `isLoading`, `error`
- **API:**
  - `banStatus`: Estado de ban actual
  - `isLoading`: Si está cargando
  - `error`: Error en la verificación
- **Ejemplo:**
```jsx
const { banStatus, isLoading, error } = useBanStatus(userId, true);
```

## 6. Dependencias principales
| Dependencia     | Versión | Propósito                  | Impacto                |
|-----------------|---------|----------------------------|------------------------|
| react           | ^18.x   | UI principal               | Base de componentes    |
| @mui/material   | ^5.x    | Componentes visuales       | Estilos y loaders      |

## 7. Consideraciones técnicas
- Los componentes usan lazy loading para optimizar el rendimiento.
- Loader y BanGuard están diseñados para ser reutilizables.
- El manejo de errores en BanGuard es fail-safe: si hay error, permite acceso.

## 8. Puntos de extensión
- Loader puede usarse en cualquier vista que requiera indicador de carga.
- BanGuard puede envolver cualquier sección protegida.
- WhatsAppWidget es integrable en cualquier página.

## 9. Ejemplos de uso
### BanGuard
```jsx
<BanGuard userId={user.id}>
  <Dashboard />
</BanGuard>
```

### Loader
```jsx
// Uso básico (usa defaults centralizados)
<Loader />

// Override puntual
<Loader size={150} logoSize={40} />
```

## 10. Rendimiento y optimización
- Uso de React.lazy y Suspense para cargar BanPageView bajo demanda.
- Loader optimizado: imagen WebP liviana y constantes exportadas (`LOADER_DEFAULT_SIZE=80`, `LOADER_DEFAULT_LOGO_SIZE=48`) para consistencia global.

## 11. Actualización
- Creado: 18/07/2025
- Última actualización: 30/08/2025
