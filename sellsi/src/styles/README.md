# Styles (`src/styles`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

La carpeta **styles** centraliza los temas, paletas de colores y configuraciones visuales globales de Sellsi. Incluye definiciones de temas para Material-UI, breakpoints personalizados, paletas de marca y estilos avanzados para dashboards y componentes. Permite mantener coherencia visual, personalización y adaptación responsiva en toda la aplicación.

## Listado de archivos principales

| Archivo            | Tipo     | Descripción breve                                                      |
|--------------------|----------|-----------------------------------------------------------------------|
| theme.js           | Tema     | Tema principal de la app, breakpoints y paleta base.                   |
| dashboardTheme.js  | Tema     | Tema avanzado para dashboards, colores de marca y overrides de MUI.    |

## Relaciones internas del módulo

- Ambos temas pueden ser usados en paralelo según el contexto (app general vs dashboard).
- `dashboardTheme.js` extiende y personaliza componentes MUI para visualización de datos y superficies.
- `theme.js` define breakpoints, paleta base y tipografía global.

Árbol de relaciones simplificado:

```
theme.js
└─ createTheme (MUI)
dashboardTheme.js
└─ createTheme (MUI, overrides avanzados)
```

## API y configuración principal

### theme.js
- `breakpoints`: xs, sm, md, mac, lg, xl (personalizados para dispositivos reales).
- `palette`: Colores principales, secundarios, fondo, texto y cajas.
- `typography`: Familia de fuentes, pesos y tamaños para títulos y cuerpo.

### dashboardTheme.js
- Paleta de marca (`brand`, `gray`, `green`, `orange`, `red`).
- Overrides de componentes: Chip, Card, Paper, Accordion, etc.
- Paleta avanzada para dashboards: colores, fondos, sombras y acciones.
- Tipografía y bordes personalizados para visualización de datos.

## Dependencias externas e internas

- **Externas:** @mui/material/styles, MUI v5.
- **Internas:** No tiene dependencias internas, pero es consumido por features y layouts.

## Consideraciones técnicas y advertencias

- Los temas deben ser usados con el `ThemeProvider` de MUI.
- Los breakpoints personalizados pueden requerir ajustes en componentes responsivos.
- El dashboardTheme incluye overrides avanzados que pueden afectar componentes MUI por defecto.

## Puntos de extensión o reutilización

- Los temas pueden extenderse para dark mode, branding de clientes o nuevos dashboards.
- Se pueden agregar más overrides o variantes según necesidades de UI.

## Ejemplos de uso

### Usar el tema principal en la app

```jsx
import { ThemeProvider } from '@mui/material/styles';
import theme from 'src/styles/theme';

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Usar el dashboardTheme en un layout específico

```jsx
import { ThemeProvider } from '@mui/material/styles';
import { dashboardTheme } from 'src/styles/dashboardTheme';

<ThemeProvider theme={dashboardTheme}>
  <Dashboard />
</ThemeProvider>
```

---

Este README documenta la estructura, relaciones y funcionamiento de los temas y estilos globales de Sellsi. Consulta los comentarios en el código para detalles adicionales y advertencias sobre overrides de MUI.
