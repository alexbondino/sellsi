# Styles

## 1. Resumen funcional del módulo
El módulo `styles` centraliza los temas, paletas de colores, configuraciones visuales globales y espaciado de layouts en Sellsi. Proporciona temas coherentes para Material-UI, breakpoints personalizados optimizados para dispositivos reales, paletas de marca y overrides de componentes, asegurando una experiencia visual consistente y profesional en toda la aplicación.

- **Problema que resuelve:** Mantiene la coherencia visual across toda la plataforma, facilita la personalización de la UI y optimiza la experiencia responsive en diferentes dispositivos.
- **Arquitectura:** Temas modulares exportados como objetos de configuración, overrides centralizados de MUI, separación clara entre tema general y temas especializados.
- **Patrones:** Theming pattern, design tokens, component overrides, responsive design, separation of concerns.
- **Flujo de datos:** Archivos de tema → ThemeProvider (MUI) → Componentes UI → Renderizado visual con estilos aplicados.

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------|-----------|---------------------------------------------|------------------------------------------|
| theme.js               | Tema      | Tema principal de la aplicación con breakpoints y paleta base | Definir estilos globales, responsive design y tipografía base |
| dashboardThemeCore.js  | Tema      | Tema minimalista optimizado para performance en dashboards | Theming esencial para paneles administrativos |
| layoutSpacing.js       | Utilidad  | Constantes de espaciado para layouts principales | Espaciado consistente de bottom bars y layouts |
| README.md              | Doc       | Documentación completa de los temas y estilos | Explicar uso, configuración y best practices |

## 3. Relaciones internas del módulo
```
Styles Architecture
├── theme.js (tema base de la aplicación)
│   ├── Breakpoints personalizados (xs: 0, sm: 412, md: 768, mac: 1280, lg: 1700, xl: 2160)
│   ├── Paleta de colores principal (#1565c0, #2e2e2e, #f9f9f9)
│   └── Tipografía base (Lato, Proxima Nova)
├── dashboardThemeCore.js (tema especializado)
│   ├── Extiende configuración base
│   ├── Overrides específicos para MuiButton
│   ├── Paleta optimizada para dashboards (brand, gray colors)
│   └── Configuración minimalista para performance
└── layoutSpacing.js (constantes de espaciado)
    └── SPACING_BOTTOM_MAIN (responsive spacing para bottom bars)
```
- Los temas pueden ser usados en paralelo según el contexto (aplicación general vs dashboards específicos).
- `dashboardThemeCore.js` extiende y optimiza componentes MUI para uso en paneles administrativos.
- `layoutSpacing.js` proporciona constantes reutilizables para mantener consistency en espaciado.
- Comunicación unidireccional: configuración → ThemeProvider → componentes.

## 4. Props y API de los temas principales
### theme.js (Tema Principal)
**Configuración base:**
| Propiedad | Tipo | Descripción | Valores |
|-----------|------|-------------|---------|
| `breakpoints.values` | Object | Breakpoints responsivos personalizados | xs: 0, sm: 412, md: 768, mac: 1280, lg: 1700, xl: 2160 |
| `palette.primary.main` | String | Color principal de la marca | '#1565c0' (azul corporativo) |
| `palette.secondary.main` | String | Color secundario | '#2e2e2e' (gris oscuro) |
| `palette.background.default` | String | Fondo por defecto | '#f9f9f9' (gris claro) |
| `typography.fontFamily` | String | Familia tipográfica principal | 'Lato, "Proxima Nova", sans-serif' |

**Breakpoints específicos:**
- `xs: 0-411px` → Teléfonos pequeños (iPhone SE)
- `sm: 412-767px` → Teléfonos grandes (Galaxy A50)
- `md: 768-1699px` → Tablets y laptops medianas
- `mac: 1280px` → Breakpoint personalizado para MacBook
- `lg: 1700-2159px` → Pantallas Full HD
- `xl: 2160px+` → Pantallas 4K y superiores

### dashboardThemeCore.js (Tema Dashboard)
**Configuración especializada:**
| Propiedad | Tipo | Descripción | Valores |
|-----------|------|-------------|---------|
| `palette.primary.main` | String | Color principal (consistente con marketplace) | '#1565c0' |
| `palette.primary.light` | String | Color hover | '#42a5f5' |
| `components.MuiButton.styleOverrides` | Object | Overrides para botones | textTransform: 'none', borderRadius: 8px |

**Paleta extendida:**
- `brand`: Escala de azules (50, 400, 500, 600)
- `gray`: Escala de grises (50, 100, 200, 500, 900)
- Efectos hover: `boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)'`

### layoutSpacing.js (Utilidades de Espaciado)
**Constantes disponibles:**
| Constante | Tipo | Propósito | Valores |
|-----------|------|-----------|---------|
| `SPACING_BOTTOM_MAIN` | Object | Espaciado inferior responsive para evitar bottom bars | `{ xs: 10, md: 14, lg: 16 }` |

**Notas importantes:**
- Todos los temas son compatibles con Material-UI v5
- Los breakpoints están optimizados para dispositivos reales basados en analytics
- Los colores mantienen consistencia con la identidad visual del marketplace
- Los overrides son mínimos para optimizar performance

## 5. Hooks personalizados
Los estilos no exportan hooks directamente, pero proporcionan configuraciones que pueden ser utilizadas dentro de custom hooks para theming dinámico y responsive design.

**Patrón recomendado para theming reactivo:**
```javascript
// En src/hooks/useResponsiveTheme.js
import { useTheme, useMediaQuery } from '@mui/material';

export function useResponsiveTheme() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  return {
    isMobile,
    isTablet, 
    isDesktop,
    spacing: theme.spacing,
    breakpoints: theme.breakpoints.values
  };
}
```

**Hook para espaciado dinámico:**
```javascript
// En src/hooks/useLayoutSpacing.js
import { SPACING_BOTTOM_MAIN } from '../styles/layoutSpacing';
import { useTheme } from '@mui/material';

export function useLayoutSpacing() {
  const theme = useTheme();
  
  return {
    bottomSpacing: SPACING_BOTTOM_MAIN,
    getSpacing: (multiplier) => theme.spacing(multiplier),
    responsiveSpacing: (xs, sm, md, lg) => ({
      xs: theme.spacing(xs),
      sm: theme.spacing(sm),
      md: theme.spacing(md),
      lg: theme.spacing(lg)
    })
  };
}
```

## 6. Dependencias principales
| Dependencia           | Versión   | Propósito                        | Impacto                  |
|-----------------------|-----------|----------------------------------|--------------------------|
| @mui/material/styles  | ^7.1.0    | Sistema de theming y createTheme | Core - Fundamental       |
| @mui/material         | ^7.1.0    | Componentes UI y sistema de design | Experiencia visual completa |
| @emotion/react        | ^11.14.0  | CSS-in-JS para estilos dinámicos | Performance de estilos   |
| @emotion/styled       | ^11.14.0  | Styled components con Emotion   | Flexibilidad de styling  |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- Los temas deben ser aplicados con el `ThemeProvider` de MUI en el nivel apropiado de la aplicación
- Los breakpoints personalizados pueden requerir ajustes en componentes responsivos existentes
- Los overrides de componentes pueden afectar el comportamiento por defecto de MUI
- Cambios en la paleta de colores requieren verificación de contraste para accesibilidad
- Los temas especializados (dashboard) deben usarse solo en contextos específicos

### Deuda técnica relevante:
- [ALTA] Consolidar y documentar todos los temas existentes en la aplicación
- [MEDIA] Implementar soporte completo para dark mode con paletas alternativas
- [MEDIA] Crear sistema de design tokens más robusto para escalabilidad
- [MEDIA] Optimizar bundle size mediante lazy loading de temas especializados
- [BAJA] Migrar gradualmente overrides inline a configuración centralizada
- [BAJA] Agregar testing visual para validar consistency de temas

## 8. Puntos de extensión
- **Temas adicionales:** Crear variantes para dark mode, branding de clientes específicos o dashboards especializados
- **Sistema de design tokens:** Evolucionar hacia un sistema más robusto con tokens centralizados
- **Extensibilidad de overrides:** Agregar más overrides de componentes según necesidades específicas
- **Integración externa:** Permite integración con sistemas de diseño externos (Figma tokens, etc.)
- **Theming dinámico:** Estructura preparada para switching de temas en runtime

### Cómo extender:
```javascript
// Para crear un nuevo tema especializado:
// 1. Crear archivo en src/styles/
// 2. Extender tema base o crear desde cero
import { createTheme } from '@mui/material/styles';
import theme from './theme'; // tema base

export const newSpecializedTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    // Nuevas customizaciones
  }
});

// Para agregar nuevos overrides:
components: {
  MuiNewComponent: {
    styleOverrides: {
      root: {
        // Estilos personalizados
      }
    }
  }
}
```

## 9. Ejemplos de uso
### Ejemplo básico - Aplicar tema principal:
```jsx
import { ThemeProvider } from '@mui/material/styles';
import theme from '../styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourAppComponents />
    </ThemeProvider>
  );
}
```

### Ejemplo avanzado - Tema dashboard especializado:
```jsx
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../styles/dashboardThemeCore';

function AdminDashboard() {
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <DashboardLayout>
        <AdminPanelComponents />
      </DashboardLayout>
    </ThemeProvider>
  );
}
```

### Ejemplo con spacing utilities:
```jsx
import { Box } from '@mui/material';
import { SPACING_BOTTOM_MAIN } from '../styles/layoutSpacing';

function MainLayout({ children }) {
  return (
    <Box
      component="main"
      sx={{
        pb: SPACING_BOTTOM_MAIN, // Espaciado responsive para bottom bar
        minHeight: '100vh'
      }}
    >
      {children}
    </Box>
  );
}
```

### Ejemplo con hooks personalizados:
```jsx
import { useResponsiveTheme } from '../hooks/useResponsiveTheme';
import { useLayoutSpacing } from '../hooks/useLayoutSpacing';

function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsiveTheme();
  const { getSpacing, responsiveSpacing } = useLayoutSpacing();
  
  return (
    <Box
      sx={{
        padding: responsiveSpacing(2, 3, 4, 5),
        marginBottom: getSpacing(isMobile ? 2 : 4)
      }}
    >
      {isMobile ? <MobileView /> : <DesktopView />}
    </Box>
  );
}
```

## 10. Rendimiento y optimización
### Estrategias implementadas:
- **Temas optimizados:** Configuración minimalista en `dashboardThemeCore.js` para mejor performance
- **Overrides centralizados:** Evita duplicación de estilos across componentes
- **Breakpoints optimizados:** Basados en analytics reales de dispositivos para mejor responsive design
- **Bundle splitting:** Temas especializados se pueden cargar de forma lazy según contexto
- **CSS-in-JS optimizado:** Utiliza Emotion para performance óptima de estilos dinámicos

### Consideraciones de rendimiento:
- Temas se cachean automáticamente por MUI ThemeProvider
- Overrides mínimos para evitar re-renders innecesarios
- Breakpoints personalizados optimizan media queries
- Paletas de colores definidas estáticamente para consistency

### Áreas de mejora identificadas:
- **Tree shaking:** Mejorar eliminación de estilos no utilizados
- **Runtime theming:** Implementar switching de temas más eficiente
- **Design tokens:** Migrar a sistema de tokens para mejor escalabilidad
- **Critical CSS:** Extraer estilos críticos para above-the-fold content
- **Lazy theming:** Cargar temas especializados solo cuando se necesiten

## 11. Actualización
- **Creado:** 03/07/2025
- **Última actualización:** 18/07/2025  
- **Versión:** v2.0 - Sistema de theming optimizado y modular
- **Migración desde:** Temas dispersos a sistema centralizado
- **Próximas mejoras:** Dark mode completo, design tokens, performance optimizations
