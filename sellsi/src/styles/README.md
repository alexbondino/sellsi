# Styles

## 1. Resumen funcional del módulo
El módulo `styles` centraliza los temas, paletas de colores y configuraciones visuales globales de Sellsi. Define temas para Material-UI, breakpoints personalizados, paletas de marca y estilos avanzados para dashboards y componentes, asegurando coherencia visual y personalización en toda la aplicación.

- **Problema que resuelve:** Mantiene la coherencia visual y facilita la personalización de la UI en toda la plataforma.
- **Arquitectura:** Temas exportados como objetos, overrides de MUI, separación entre tema general y de dashboard.
- **Patrones:** Theming, separación de concerns, overrides de componentes.
- **Flujo de datos:** Temas → ThemeProvider → Componentes MUI → Renderizado visual.

## 2. Listado de archivos
| Archivo            | Tipo     | Descripción                                 | Responsabilidad principal                |
|--------------------|----------|---------------------------------------------|------------------------------------------|
| theme.js           | Tema     | Tema principal de la app, breakpoints y paleta base. | Definir estilos globales y responsivos   |
| dashboardTheme.js  | Tema     | Tema avanzado para dashboards, colores de marca y overrides de MUI. | Personalización visual de dashboards     |
| dashboardThemeCore.js | Tema  | Variante de tema para dashboards, overrides y colores extendidos. | Theming avanzado para paneles            |
| README.md          | Doc      | Documentación de los temas y estilos        | Explicar uso y configuración             |

## 3. Relaciones internas del módulo
```
theme.js
└─ createTheme (MUI)
dashboardTheme.js
└─ createTheme (MUI, overrides avanzados)
dashboardThemeCore.js
└─ createTheme (MUI, variantes y extensiones)
```
- Los temas pueden ser usados en paralelo según el contexto (app general vs dashboard).
- `dashboardTheme.js` y `dashboardThemeCore.js` extienden y personalizan componentes MUI.

## 4. API y configuración principal
### theme.js
- `breakpoints`: xs, sm, md, mac, lg, xl (personalizados para dispositivos reales).
- `palette`: Colores principales, secundarios, fondo, texto y cajas.
- `typography`: Familia de fuentes, pesos y tamaños para títulos y cuerpo.

### dashboardTheme.js / dashboardThemeCore.js
- Paleta de marca (`brand`, `gray`, `green`, `orange`, `red`).
- Overrides de componentes: Chip, Card, Paper, Accordion, etc.
- Paleta avanzada para dashboards: colores, fondos, sombras y acciones.
- Tipografía y bordes personalizados para visualización de datos.

## 5. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| @mui/material/styles| ^5.x      | Theming y estilos globales       | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |

## 6. Consideraciones técnicas y advertencias
- Los temas deben ser usados con el `ThemeProvider` de MUI.
- Los breakpoints personalizados pueden requerir ajustes en componentes responsivos.
- Los overrides avanzados pueden afectar componentes MUI por defecto.
- Si se agregan nuevos componentes, revisar compatibilidad con los temas.

### Deuda técnica relevante
- [MEDIA] Mejorar soporte para dark mode y variantes de branding.
- [MEDIA] Modularizar overrides y variantes para mayor flexibilidad.

## 7. Puntos de extensión o reutilización
- Los temas pueden extenderse para dark mode, branding de clientes o nuevos dashboards.
- Se pueden agregar más overrides o variantes según necesidades de UI.
- Permite integración con sistemas de diseño externos.

## 8. Ejemplos de uso
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

## 9. Rendimiento y optimización
- Temas optimizados para re-render mínimo.
- Overrides centralizados para evitar duplicación de estilos.
- Áreas de mejora: soporte para code splitting de temas y dark mode avanzado.

## 10. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
