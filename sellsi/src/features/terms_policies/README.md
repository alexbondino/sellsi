# Módulo: terms_policies

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Proporciona páginas legales completas para términos y condiciones y política de privacidad de Sellsi, con formato avanzado de texto y navegación user-friendly.
- **Arquitectura de alto nivel:** Módulo de contenido estático con componente formateador especializado para documentos legales estructurados.
- **Función y casos de uso principales:** Presentación de documentos legales, formateo automático de texto con jerarquía, navegación de políticas empresariales.
- **Flujo de datos/información simplificado:**
  ```
  Content Data → TextFormatter → Structured Display → User Reading
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| TermsAndConditionsPage.jsx | Componente | Página de términos y condiciones | Presentación términos legales |
| PrivacyPolicyPage.jsx | Componente | Página de política de privacidad | Presentación política privacidad |
| TextFormatter.jsx | Componente | Formateador avanzado de texto estructurado | Renderizado jerárquico de contenido |
| content.js | Datos | Contenido textual de documentos legales | Almacenamiento contenido estático |
| index.js | Barrel | Exportaciones del módulo | Punto de acceso centralizado |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Legal Pages (Terms & Privacy)
├── TextFormatter (formatting engine)
├── content.js (static data)
└── @mui/material (UI framework)
```

**Patrones de comunicación:**
- **Static Content Pattern**: Contenido separado de presentación
- **Formatter Pattern**: Componente especializado para renderizado
- **Responsive Design**: Adaptación automática a dispositivos

## 4. Props de los componentes
### TermsAndConditionsPage
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| Sin props externas | - | - | Componente autocontenido |

### PrivacyPolicyPage
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| Sin props externas | - | - | Componente autocontenido |

### TextFormatter
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| text | string | ✓ | Contenido de texto a formatear |
| sx | object | ✗ | Estilos personalizados para elementos |

## 5. Hooks personalizados
Este módulo no define hooks personalizados. Utiliza hooks estándar de Material-UI:
- **useTheme**: Acceso al tema de Material-UI
- **useMediaQuery**: Detección de breakpoints responsivos

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| @mui/material | ^5.0.0 | UI components y theming | Alto - Core UI |
| @mui/icons-material | ^5.0.0 | Iconos para headers | Bajo - Solo visual |
| react | ^18.0.0 | Framework base | Alto - Funcionalidad core |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Static content**: Contenido hardcodeado en JavaScript, no CMS
- **Text formatting**: Parser específico para formato markdown-like
- **Responsive design**: Optimizado para desktop y móvil solamente
- **SEO limitations**: Contenido en JavaScript, no server-side rendered

### Deuda técnica relevante:
- **[BAJA]** Migrar contenido a CMS o archivos markdown
- **[BAJA]** Implementar tabla de contenidos navegable
- **[MEDIA]** Agregar soporte para más formatos de texto

## 8. Puntos de extensión
- **CMS Integration**: Migrar a sistema de gestión de contenido
- **Multi-language**: Soporte para internacionalización
- **Advanced formatting**: Más opciones de formato (tablas, links, etc.)
- **Print optimization**: Estilos específicos para impresión

## 9. Ejemplos de uso
### Implementación básica:
```jsx
import { TermsAndConditionsPage, PrivacyPolicyPage } from 'src/features/terms_policies';

// En router
<Routes>
  <Route path="/terms" element={<TermsAndConditionsPage />} />
  <Route path="/privacy" element={<PrivacyPolicyPage />} />
</Routes>
```

### Uso del TextFormatter independiente:
```jsx
import { TextFormatter } from 'src/features/terms_policies';

function CustomLegalDocument() {
  const customContent = `
**Título Principal**

**Definición:** Este es un término importante.

1.1. Primera sección
1.1.1. Subsección detallada

Texto normal con explicaciones.
  `;

  return (
    <Container>
      <TextFormatter 
        text={customContent}
        sx={{
          title: { color: 'primary.main' },
          normalText: { fontSize: '1.1rem' }
        }}
      />
    </Container>
  );
}
```

### Personalización avanzada de estilos:
```jsx
function StyledLegalPage() {
  const customStyles = {
    container: { 
      maxWidth: '800px',
      margin: '0 auto' 
    },
    title: { 
      color: '#1976d2',
      borderBottom: '2px solid #1976d2' 
    },
    termLabel: { 
      backgroundColor: '#f5f5f5',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    normalText: { 
      textAlign: 'justify' 
    }
  };

  return (
    <TextFormatter 
      text={termsContent}
      sx={customStyles}
    />
  );
}
```

## 10. Rendimiento y optimización
- **Static content**: Contenido estático sin llamadas a API
- **Component memoization**: Componentes puros sin re-renders innecesarios
- **Responsive optimization**: Estilos adaptativos sin JavaScript adicional
- **Bundle size**: Impacto mínimo en el bundle principal
- **Optimization areas**: Lazy loading para páginas poco visitadas

## 11. Actualización
- **Última actualización:** 18/07/2025
