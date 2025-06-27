# UI Module (`src/features/ui`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **UI** centraliza todos los componentes visuales reutilizables, hooks y utilidades de interfaz en Sellsi. Proporciona una base consistente y profesional para la construcción de formularios, tablas, cards, modales, banners, selectores, loaders y widgets, facilitando la extensión y el mantenimiento de la experiencia de usuario en toda la aplicación. Permite desacoplar la lógica visual de la lógica de negocio, promueve la reutilización y estandariza la apariencia y comportamiento de la plataforma.

## Listado de archivos principales

| Archivo/Carpeta                | Tipo        | Descripción breve                                                      |
|------------------------------- |------------|-----------------------------------------------------------------------|
| index.js                       | Barrel      | Exporta todos los componentes y hooks principales del módulo.          |
| StatCard.jsx                   | Componente | Tarjeta de estadísticas con gráfico sparkline y tendencia.             |
| StatsCards.jsx                 | Componente | Grid/flex de tarjetas de estadísticas, configurable y extensible.      |
| Widget.jsx                     | Componente | Card visual para dashboards, íconos y valores destacados.              |
| RequestList.jsx                | Componente | Lista de solicitudes recientes, adaptable a distintos contextos.       |
| ProfileImageModal.jsx          | Componente | Modal para cambiar imagen de perfil, drag & drop y validación.         |
| PrimaryButton.jsx              | Componente | Botón primario custom, variantes y tamaños.                            |
| PriceTiers.jsx                 | Componente | Configuración visual de tramos de precio por cantidad.                 |
| SearchBar.jsx                  | Componente | Barra de búsqueda con filtros, ordenamiento y debouncing.              |
| LoadingOverlay.jsx             | Componente | Overlay de carga global para pantallas o secciones.                    |
| AdvancedLoading.jsx            | Componentes | Loaders avanzados: skeletons, estados vacíos, progresos, etc.          |
| LogoUploader.jsx               | Componente | Uploader visual para logos empresariales.                              |
| CountrySelector.jsx            | Componente | Selector de país con banderas y búsqueda.                              |
| ContactModal.jsx               | Componente | Modal de contacto reutilizable.                                        |
| Modal.jsx                      | Componente | Modal base reutilizable.                                               |
| PasswordRequirements.jsx       | Componente | Visualización de requisitos de contraseña.                             |
| Switch.jsx                     | Componente | Switch visual custom.                                                  |
| NotFound.jsx                   | Componente | Página de error 404 reutilizable.                                      |
| Banner.jsx / BannerContext.jsx | Componente/Contexto | Sistema de banners y feedback visual global.                  |
| table/                         | Carpeta     | Componentes de tabla: Table, Rows, Filter.                             |
| product-card/                  | Carpeta     | Cards de producto, badges, status chips, menús de acción.              |
| graphs/                        | Carpeta     | Gráficos de barras y torta para dashboards.                            |
| wizard/                        | Carpeta     | Stepper y wizard para flujos multi-paso.                               |
| hooks/                         | Carpeta     | Hooks de UI, como useCountrySelector.                                  |

## Relaciones internas del módulo

- `index.js` actúa como barrel, permitiendo importar cualquier componente o hook desde un solo punto.
- Los componentes de `product-card/` y `table/` se usan en marketplace, supplier y buyer.
- `StatsCards` y `StatCard` son usados en dashboards de buyer y supplier.
- `BannerContext` provee feedback visual global a toda la app.
- Los hooks de `hooks/` pueden ser usados por cualquier componente UI o de features.

Árbol de relaciones simplificado:

```
index.js
├─ product-card/
│   ├─ ProductCard.jsx
│   ├─ ProductBadges.jsx
│   └─ StatusChip.jsx
├─ table/
│   ├─ Table.jsx
│   ├─ Rows.jsx
│   └─ Filter.jsx
├─ banner/BannerContext.jsx
├─ AdvancedLoading.jsx
├─ StatsCards.jsx
├─ StatCard.jsx
├─ Widget.jsx
├─ RequestList.jsx
├─ ProfileImageModal.jsx
├─ hooks/
│   └─ useCountrySelector.js
└─ ...otros componentes
```

## Props de los componentes principales

| Componente           | Prop                | Tipo         | Requerida | Descripción                                      |
|----------------------|---------------------|--------------|-----------|--------------------------------------------------|
| StatCard             | title, value, data, trend, icon | varios | Sí | Datos y visualización de KPI.                    |
| StatsCards           | cards, layout, cardComponent, sx | varios | No | Configuración de tarjetas y layout.              |
| Widget               | icon, title, value, color        | varios | Sí | Card visual para dashboards.                     |
| RequestList          | weeklyRequests                   | array  | No | Solicitudes recientes a mostrar.                 |
| ProfileImageModal    | open, onClose, onImageChange, currentImageUrl, userInitials | varios | Sí | Modal para imagen de perfil. |
| PrimaryButton        | variant, size, onClick, ...      | varios | No | Botón custom con variantes.                      |
| PriceTiers           | tramos, onTramoChange, onAddTramo, onRemoveTramo, errors | varios | Sí | Configuración de tramos de precio.               |
| SearchBar            | busqueda, setBusqueda, ordenamiento, setOrdenamiento, ... | varios | Sí | Barra de búsqueda avanzada.                      |
| LoadingOverlay       | open, text                       | varios | No | Overlay de carga global.                         |
| LogoUploader         | logoPreview, onLogoSelect, ...   | varios | Sí | Uploader visual de logo.                         |
| CountrySelector      | value, onChange, ...             | varios | Sí | Selector de país.                                |

## Hooks personalizados

### useCountrySelector.js
Maneja la lógica de selección y búsqueda de países, separación de lógica de presentación, colores de banderas y filtrado. Expone: `selectedCountry`, `setSelectedCountry`, `searchTerm`, `setSearchTerm`, `filteredCountries`, `flagColors`.

## Dependencias externas e internas

- **Externas**: React, Material-UI, MUI X Charts, íconos de MUI.
- **Internas**: Helpers y servicios de la app, contextos de banners, hooks personalizados.
- **Contextos/Providers**: BannerProvider, contextos de feedback visual.

## Consideraciones técnicas y advertencias

- Los componentes están diseñados para ser desacoplados y altamente reutilizables.
- Algunos componentes (ej: loaders, cards) pueden requerir props específicos según el contexto.
- El barrel permite importar todo desde `src/features/ui` para mayor comodidad.
- Si se agregan nuevos componentes, documentar sus props y ejemplos de uso.
- Los hooks de UI deben mantenerse puros y sin lógica de negocio.

## Puntos de extensión o reutilización

- Todos los componentes pueden ser extendidos o customizados vía props o composición.
- El barrel permite importar hooks y componentes desde un solo punto.
- Los componentes de tabla, cards y loaders pueden ser usados en cualquier feature.
- El sistema de banners y modales es global y puede integrarse en cualquier flujo.

## Ejemplos de uso

### Importar y usar un botón primario

```jsx
import { PrimaryButton } from 'src/features/ui';

<PrimaryButton onClick={handleClick}>Guardar</PrimaryButton>
```

### Usar el selector de país con hook

```jsx
import { CountrySelector, useCountrySelector } from 'src/features/ui';

const { selectedCountry, setSelectedCountry } = useCountrySelector();

<CountrySelector value={selectedCountry} onChange={setSelectedCountry} />
```

### Mostrar tarjetas de estadísticas en dashboard

```jsx
import { StatsCards } from 'src/features/ui';

<StatsCards cards={[{ title: 'Ventas', value: 1000 }]} />
```

---

Este README documenta la estructura, relaciones y funcionamiento del módulo UI. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa los hooks y helpers, ya que son el corazón de la lógica visual en Sellsi.
