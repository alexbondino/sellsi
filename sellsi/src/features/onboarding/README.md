# Módulo: onboarding

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Gestiona el flujo de registro y configuración inicial para nuevos usuarios, permitiendo selección de tipo de cuenta, ingreso de datos de perfil y carga de logo opcional.
- **Arquitectura de alto nivel:** Componente principal con helpers internos, validaciones progresivas y persistencia en Supabase mediante hooks de React.
- **Función y casos de uso principales:** Onboarding guiado para proveedores y compradores, validación de datos, carga de imágenes y configuración inicial de perfiles.
- **Flujo de datos/información simplificado:**
  ```
  User Input → Local Validation → Supabase Persistence → Profile Complete
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| Onboarding.jsx | Componente | Componente principal del flujo de onboarding | Orquestación UI, validaciones y persistencia |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Onboarding (main component)
├── LogoUploader (internal helper)
├── ui/PrimaryButton (shared UI)
├── ui/CountrySelector (shared UI)
└── services/supabase (data layer)
```

**Patrones de comunicación:**
- **State lifting**: Estado centralizado en componente principal
- **Progressive validation**: Validaciones en tiempo real
- **Callback pattern**: Comunicación vía props y callbacks

## 4. Props de los componentes
### Onboarding
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| Sin props externas | - | - | Componente de entrada del flujo onboarding |

### LogoUploader (interno)
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| logoPreview | string | ✗ | URL de previsualización del logo |
| onLogoSelect | función | ✓ | Callback para manejar selección de archivo |
| size | string | ✗ | Tamaño del uploader ('large' por defecto) |
| logoError | string | ✗ | Mensaje de error para validación |

## 5. Hooks personalizados
Este módulo no exporta hooks personalizados. Utiliza hooks estándar de React:
- **useState**: Manejo de estado local (perfil, validaciones, preview)
- **useEffect**: Limpieza de URLs de previsualización
- **useCallback**: Optimización de callbacks para evitar re-renders

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| @mui/icons-material | ^5.x      | Iconografía                      | UX                       |
| supabase-js         | ^2.x      | Persistencia y storage           | Backend/Storage          |
| react-hot-toast     | ^2.x      | Feedback de notificaciones       | UX                       |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **File uploads**: Logo debe ser JPG, PNG o WEBP < 300KB
- **Session dependency**: Requiere email disponible en sesión Supabase
- **Database schema**: Dependiente de estructura tabla `users` en Supabase
- **Single step**: No soporta navegación multi-paso avanzada

### Deuda técnica relevante:
- **[MEDIA]** Refactorizar para soporte multi-paso
- **[MEDIA]** Implementar internacionalización
- **[BAJA]** Extraer LogoUploader como componente reutilizable

## 8. Puntos de extensión
- **Multi-step workflow**: Expandir para múltiples pasos de configuración
- **Component extraction**: LogoUploader como componente reutilizable
- **External validation**: Integración con servicios de verificación
- **Customization**: Diferentes flujos según tipo de usuario

## 9. Ejemplos de uso
### Implementación básica:
```jsx
import Onboarding from 'src/features/onboarding/Onboarding';

function OnboardingPage() {
  return <Onboarding />;
}
```

### Integración en router:
```jsx
import { Routes, Route } from 'react-router-dom';
import Onboarding from 'src/features/onboarding/Onboarding';

function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
    </Routes>
  );
}
```

## 10. Rendimiento y optimización
- **useCallback**: Prevención de re-renders innecesarios en callbacks
- **URL management**: Limpieza automática de `URL.createObjectURL` en useEffect
- **Local validation**: Validaciones locales antes de llamadas a Supabase
- **Progressive loading**: Carga de componentes según necesidad
- **Optimization areas**: Code splitting, modularización de helpers

## 11. Actualización
- **Última actualización:** 18/07/2025
