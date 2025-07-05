# Auth Module

## 1. Resumen funcional del módulo
Este módulo gestiona la autenticación y el acceso protegido de rutas dentro de la aplicación. Permite controlar el acceso de usuarios autenticados y redirigir según el estado de sesión y onboarding.

- **Problema que resuelve:** Control de acceso seguro a rutas protegidas y manejo de callbacks de autenticación.
- **Arquitectura:** Componentes React funcionales, integración con React Router y Material UI para feedback visual.
- **Función principal:** Proteger rutas y gestionar flujos de autenticación y onboarding.
- **Flujo de datos:**
  1. El usuario intenta acceder a una ruta protegida.
  2. Se valida autenticación y estado de onboarding.
  3. Se renderiza el contenido, se redirige a login o a onboarding según corresponda.

## 2. Listado de archivos
| Archivo             | Tipo        | Descripción                                 | Responsabilidad                         |
|---------------------|-------------|---------------------------------------------|-----------------------------------------|
| PrivateRoute.jsx    | Componente  | Ruta protegida visual y lógica              | Controla acceso y redirecciones         |
| AuthCallback.jsx    | Componente  | Callback de autenticación externa           | Procesa respuestas de login externo     |

## 3. Relaciones internas del módulo
```
PrivateRoute (usa estados de sesión y onboarding)
AuthCallback (se usa en rutas de callback de login)
```
- Comunicación por props y contexto (AuthContext).

## 4. Props de los componentes
### PrivateRoute
| Prop            | Tipo           | Requerido | Descripción                                 |
|-----------------|----------------|-----------|---------------------------------------------|
| children        | ReactNode      | Sí        | Componentes a renderizar si pasa el guard   |
| isAuthenticated | boolean        | Sí        | ¿Usuario autenticado?                       |
| needsOnboarding | boolean        | Sí        | ¿Debe completar onboarding?                 |
| loading         | boolean        | Sí        | ¿Está validando sesión?                     |
| redirectTo      | string         | No        | Ruta de redirección si no autenticado       |

### AuthCallback
| Prop            | Tipo           | Requerido | Descripción                                 |
|-----------------|----------------|-----------|---------------------------------------------|
| Ninguno (usa hooks y efectos internos)

**Notas:**
- PrivateRoute espera recibir el estado de sesión ya validado desde el contexto o el componente superior.

## 5. Hooks personalizados
- Este módulo no define hooks propios, pero puede consumir hooks de contexto de autenticación global.

## 6. Dependencias principales
| Dependencia        | Versión | Propósito                  | Impacto                |
|--------------------|---------|----------------------------|------------------------|
| @mui/material      | >=5     | UI components              | Feedback visual        |
| react-router-dom   | >=6     | Navegación y rutas         | Control de navegación  |

## 7. Consideraciones técnicas
- El guard visualiza un loader centralizado mientras valida sesión.
- Redirige automáticamente según el estado de autenticación y onboarding.
- **Limitaciones:**
  - No realiza validación de sesión por sí mismo, depende de props/contexto.

## 8. Puntos de extensión
- Puede extenderse para soportar roles o permisos adicionales.
- El componente AuthCallback puede adaptarse a distintos proveedores de autenticación.

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import PrivateRoute from './auth/PrivateRoute';

<PrivateRoute isAuthenticated={user} needsOnboarding={needsOnboarding} loading={loading}>
  <Dashboard />
</PrivateRoute>
```

## 10. Rendimiento y optimización
- Loader visual evita renders innecesarios durante la validación.
- Redirecciones rápidas según estado.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
