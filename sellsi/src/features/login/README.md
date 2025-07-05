# Login Module (`src/features/login`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Este módulo gestiona la autenticación de usuarios y el flujo de onboarding inicial en Sellsi. Centraliza la UI y lógica para login, recuperación de cuenta y registro, permitiendo una experiencia de acceso segura, moderna y extensible.

- **Problema que resuelve:** Provee un flujo de acceso y registro robusto, desacoplado y reutilizable para todos los usuarios de la plataforma.
- **Arquitectura:** Componentes desacoplados, hooks personalizados para formularios, integración con servicios externos (Supabase) y UI basada en Material UI.
- **Función principal:** Permitir login, recuperación de cuenta y onboarding de nuevos usuarios.
- **Flujo de datos:**
  - El usuario accede al login, puede recuperar cuenta o registrarse.
  - El formulario valida y envía datos a Supabase.
  - Si es nuevo, completa el onboarding inicial.

## 2. Listado de archivos
| Archivo            | Tipo        | Descripción breve                                 | Responsabilidad principal                |
|--------------------|-------------|--------------------------------------------------|------------------------------------------|
| Login.jsx          | Componente  | UI y lógica de login, recuperación y registro     | Orquestar acceso y navegación            |
| OnboardingForm.jsx | Componente  | Formulario de onboarding para nuevos usuarios     | Completar datos iniciales de usuario     |
| index.js           | Barrel      | Exporta los componentes del módulo                | Organización y acceso centralizado       |

## 3. Relaciones internas del módulo
- `Login.jsx` orquesta el flujo de login, recuperación y registro.
- `OnboardingForm.jsx` es renderizado tras el registro o primer acceso.
- `index.js` exporta los componentes para uso externo.

```
Login
├── OnboardingForm
└── (usa hooks de ../landing_page/hooks y servicios externos)
```

## 4. Props de los componentes
### Login
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| Ninguna (usa hooks y props internas)

### OnboardingForm
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| Ninguna (usa hooks y props internas)

## 5. Hooks personalizados
- Usa hooks de `../landing_page/hooks` y `../../../hooks/useOnboardingForm` para formularios y lógica de negocio.

## 6. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `react`             | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`     | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5    | Iconos para UI             | Visualización          |
| `supabase-js`       | >=2     | Backend y autenticación    | Seguridad y acceso     |

## 7. Consideraciones técnicas
- Arquitectura desacoplada: lógica en hooks, UI en componentes puros.
- El login soporta recuperación de cuenta y registro desde el mismo flujo.
- El onboarding es modular y puede extenderse para nuevos campos o validaciones.

## 8. Puntos de extensión
- El flujo de onboarding puede adaptarse para distintos roles o tipos de usuario.
- Los formularios pueden extenderse con validaciones adicionales o integración con otros servicios.

## 9. Ejemplos de uso

### Usar el login principal
```jsx
import { Login } from './login';
<Login />
```

## 10. Rendimiento y optimización
- Memoización de componentes y hooks.
- Validaciones optimizadas y feedback visual inmediato.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
