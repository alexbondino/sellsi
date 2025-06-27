# Layout Module (`src/features/layout`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Layout** centraliza los componentes visuales y utilitarios que definen la estructura, navegación y experiencia visual base de la plataforma Sellsi. Su objetivo es proveer una base coherente, reutilizable y altamente personalizable para la navegación, encabezados, barras laterales, selectores y otros elementos de interfaz que se repiten en distintas vistas. Resuelve la necesidad de mantener consistencia visual y funcional en toda la aplicación, facilitando el mantenimiento y la escalabilidad.

## Listado de archivos principales

| Archivo                  | Tipo         | Descripción breve                                                      |
|------------------------- |-------------|-----------------------------------------------------------------------|
| TopBar.jsx               | Componente  | Barra superior de navegación, login, cambio de rol y acceso rápido.   |
| SideBar.jsx              | Componente  | Barra lateral con menú dinámico según el rol del usuario.             |
| BottomBar.jsx            | Componente  | Barra inferior con navegación, links, redes y contacto.               |
| QuantitySelector.jsx     | Componente  | Selector universal de cantidad, validación y accesibilidad.           |
| QuantityInputModal.jsx   | Componente  | Modal para entrada directa de cantidad.                               |
| LazyImage.jsx            | Componente  | Imagen con lazy loading, skeleton y optimización de carga.            |
| index.js                 | Barrel      | Exporta los componentes principales del módulo.                       |

## Relaciones internas del módulo

- `TopBar.jsx` y `BottomBar.jsx` se usan como layout global en la mayoría de las páginas.
- `SideBar.jsx` es importado por vistas de dashboard y marketplace.
- `QuantitySelector.jsx` utiliza `QuantityInputModal.jsx` para entrada avanzada.
- `LazyImage.jsx` es utilizado por otros módulos para optimizar imágenes.
- El barrel `index.js` exporta los componentes clave para uso externo.

Árbol de relaciones simplificado:

```
TopBar.jsx
SideBar.jsx
BottomBar.jsx
├─ (usa ContactModal de ../ui)
QuantitySelector.jsx
├─ QuantityInputModal.jsx
LazyImage.jsx
index.js
```

## Props de los componentes principales

| Componente           | Prop                | Tipo         | Requerida | Descripción                                      |
|----------------------|---------------------|--------------|-----------|--------------------------------------------------|
| TopBar               | session             | object       | No        | Sesión de usuario (para login/logout).           |
|                      | isBuyer             | boolean      | No        | Indica el rol actual del usuario.                |
|                      | logoUrl             | string       | No        | URL del logo a mostrar.                          |
|                      | onNavigate          | function     | No        | Callback para navegación personalizada.           |
|                      | onRoleChange        | function     | No        | Callback para cambiar el rol del usuario.         |
| SideBar              | role                | string       | Sí        | Rol actual ('buyer' o 'supplier').               |
|                      | width               | string       | No        | Ancho de la barra lateral.                       |
| BottomBar            | -                   | -            | -         | No recibe props, es completamente autónoma.      |
| QuantitySelector     | value               | number       | Sí        | Valor actual de cantidad.                        |
|                      | onChange            | function     | Sí        | Callback al cambiar la cantidad.                 |
|                      | min, max, step      | number       | No        | Límites y paso de cantidad.                      |
|                      | disabled            | boolean      | No        | Deshabilita el selector.                         |
|                      | showStockLimit      | boolean      | No        | Muestra límite de stock.                         |
|                      | size, orientation   | string       | No        | Tamaño y orientación del selector.               |
|                      | label, stockText    | string       | No        | Etiqueta y texto de stock.                       |
| QuantityInputModal   | open                | boolean      | Sí        | Si el modal está abierto.                        |
|                      | onClose, onConfirm  | function     | Sí        | Callbacks para cerrar y confirmar.               |
|                      | currentValue        | number       | Sí        | Valor actual de cantidad.                        |
|                      | min, max, title     | number/string| No        | Límites y título del modal.                      |
| LazyImage            | src, alt            | string       | Sí        | Fuente y texto alternativo de la imagen.         |
|                      | ...otros            | varios       | No        | Props adicionales para optimización.             |

## Hooks personalizados

Este módulo no define hooks personalizados propios, pero utiliza hooks de React (`useState`, `useEffect`, etc.) y puede recibir hooks externos para lógica avanzada.

## Dependencias externas e internas

- **Externas**: React, Material-UI, React Router DOM, íconos de Material-UI, Framer Motion (para animaciones).
- **Internas**: Componentes de UI como `ContactModal`, hooks y stores de otros módulos (ej: `useCartStore`).
- **Contextos/Providers**: Puede recibir contextos globales (ej: sesión de usuario) pero no define contextos propios.
- **Importaciones externas**: Utiliza helpers y componentes de fuera de la carpeta para modales y lógica de negocio.

## Consideraciones técnicas y advertencias

- El layout asume integración con Material-UI y React Router DOM.
- Los componentes están diseñados para ser altamente reutilizables y personalizables.
- Cambios en la estructura de navegación pueden requerir ajustes en TopBar y SideBar.
- El selector de cantidad y su modal están optimizados para accesibilidad y validación en tiempo real.
- Si se agregan nuevos roles o vistas, actualizar los menús de SideBar y TopBar.

## Puntos de extensión o reutilización

- Todos los componentes pueden ser reutilizados en cualquier parte de la plataforma.
- El barrel `index.js` permite importar fácilmente los componentes clave.
- `LazyImage` y `QuantitySelector` son especialmente útiles para otros módulos de productos y marketplace.

## Ejemplos de uso

### Importar y usar el layout principal

```jsx
import { TopBar, SideBar, BottomBar } from 'src/features/layout';

<TopBar session={session} isBuyer={true} logoUrl="/logo.svg" />
<SideBar role="buyer" />
<BottomBar />
```

### Usar el selector de cantidad

```jsx
import { QuantitySelector } from 'src/features/layout';

<QuantitySelector value={1} onChange={setValue} min={1} max={10} />
```

### Usar la imagen lazy

```jsx
import { LazyImage } from 'src/features/layout';

<LazyImage src="/img/producto.jpg" alt="Producto" />
```

---

Este README documenta la estructura, relaciones y funcionamiento del módulo Layout. Consulta los comentarios en el código para detalles adicionales y mantén la coherencia visual al extender el módulo.