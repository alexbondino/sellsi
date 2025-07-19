# Login Module (`src/features/login`)

## 1. Resumen funcional del módulo

- **Problema que resuelve:** Centraliza toda la lógica de autenticación, registro y onboarding inicial de usuarios en Sellsi, eliminando la dispersión de código de acceso y proporcionando una experiencia segura y coherente.

- **Arquitectura de alto nivel:** Arquitectura basada en reducer pattern para manejo de estado, componentes funcionales memoizados, hooks personalizados para lógica de negocio, y integración directa con Supabase Auth.

- **Función principal:** Gestionar el flujo completo de autenticación (login, registro, recuperación) y onboarding inicial para usuarios nuevos con validaciones en tiempo real.

- **Flujo de datos simplificado:**
  ```
  Usuario → Formulario → Validación → Supabase Auth → Verificación → Onboarding → Dashboard
  ```

## 2. Listado de archivos

| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| Login.jsx | Componente | Componente principal de autenticación con modal dialog | Orquestar UI de login, registro y recuperación |
| OnboardingForm.jsx | Componente | Formulario de configuración inicial para usuarios nuevos | Capturar datos básicos y preferencias de usuario |
| hooks/useLoginForm.js | Hook | Hook personalizado con reducer para gestión de estado del login | Manejar estado, validaciones y lógica de autenticación |
| index.js | Barrel | Exporta componente principal | Punto de entrada del módulo |

## 3. Relaciones internas del módulo

```
Login (componente principal)
├── useLoginForm (hook personalizado - estado y lógica)
├── LoginForm (subcomponente memoizado)
├── Logo (subcomponente memoizado) 
├── OnboardingForm (renderizado condicionalmente)
├── Recuperar (modal importado de ../account_recovery)
└── Register (modal importado de ../register)
```

**Patrones de comunicación:**
- Estado centralizado via useReducer en useLoginForm
- Props drilling para callbacks y estado
- Renderizado condicional para modales anidados

## 4. Props de los componentes

### Login
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| Ninguna | - | - | Componente autónomo que maneja su propio estado |

**Notas importantes:** El componente usa useLocation() para detectar si se abre desde una ruta específica

### OnboardingForm
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| Ninguna | - | - | Usa hook interno useOnboardingForm para gestión de estado |

### LoginForm (subcomponente interno)
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `state` | `Object` | Sí | Estado actual del formulario desde useLoginForm |
| `dispatch` | `function` | Sí | Función dispatch del reducer para actualizar estado |
| `onSubmit` | `function` | Sí | Handler para envío del formulario |

## 5. Hooks personalizados

### `useLoginForm()`

**Propósito:** Gestiona todo el estado y lógica del proceso de autenticación usando useReducer pattern para un control granular del estado.

**Estados y efectos principales:**
- `correo`, `contrasena`: Datos del formulario
- `errorCorreo`, `errorContrasena`: Validaciones específicas por campo
- `showPassword`: Toggle para mostrar/ocultar contraseña
- `openRecuperar`, `openRegistro`: Control de modales anidados
- `cuentaNoVerificada`: Estado especial para cuentas sin verificar
- `correoReenviado`, `reenviarCooldown`: Control de reenvío de verificación

**API que expone:**
- `state`: Estado completo del formulario
- `dispatch`: Función para actualizar estado via acciones
- `handleSubmit(event)`: Maneja envío y autenticación con Supabase
- `reenviarVerificacion()`: Reenvía email de verificación con cooldown

**Ejemplo de uso básico:**
```jsx
const { state, dispatch, handleSubmit, reenviarVerificacion } = useLoginForm();

// Actualizar email
dispatch({ type: 'SET_CORREO', payload: 'usuario@email.com' });

// Toggle password visibility
dispatch({ type: 'TOGGLE_SHOW_PASSWORD' });
```

## 6. Dependencias principales

| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `react` | ^18.x | Framework base, hooks y componentes | Core funcionalidad |
| `@mui/material` | ^5.x | Componentes UI (Dialog, TextField, Button, etc.) | Interfaz completa |
| `@mui/icons-material` | ^5.x | Iconos (Visibility, VisibilityOff) | UX mejorada |
| `react-router-dom` | ^6.x | Navigation y useLocation | Detección de ruta |
| `supabase-js` | ^2.x | Autenticación y base de datos | Backend crítico |
| `../landing_page/hooks` | - | PrimaryButton y validaciones reutilizables | Consistencia UI |
| `../account_recovery` | - | Componente de recuperación de cuenta | Flujo de recuperación |
| `../register` | - | Componente de registro | Flujo de registro |

## 7. Consideraciones técnicas

### Limitaciones y advertencias:
- El componente depende de la configuración correcta de Supabase Auth
- Requiere que los módulos `account_recovery` y `register` estén disponibles
- El hook useOnboardingForm debe estar implementado en `../../../hooks/`
- Cooldown de reenvío de verificación hardcoded a 60 segundos

### Deuda técnica relevante:
- [MEDIA] LoginForm como subcomponente podría extraerse a archivo separado
- [BAJA] Constantes de estilo podrían centralizarse en theme
- [BAJA] Validaciones de email podrían usar librería externa (yup/zod)

## 8. Puntos de extensión

- **useLoginForm**: Hook reutilizable que puede adaptarse para otros formularios de auth
- **Logo component**: Componente memoizado reutilizable para branding
- **commonStyles**: Estilos compartidos disponibles para otros componentes
- **Reducer pattern**: Fácil extensión para nuevos estados o validaciones
- **Modal system**: Arquitectura permite agregar nuevos modales fácilmente

## 9. Ejemplos de uso

### Ejemplo básico:
```jsx
import { Login } from './login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}
```

### Ejemplo con integración de estado global:
```jsx
import { Login } from './login';
import { useAuth } from '../hooks/useAuth';

function AuthWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" />;
  
  return <Login />;
}
```

### Ejemplo de uso del hook directamente:
```jsx
import { useLoginForm } from './hooks/useLoginForm';

function CustomLoginForm() {
  const { state, dispatch, handleSubmit } = useLoginForm();
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={state.correo}
        onChange={(e) => dispatch({ 
          type: 'SET_CORREO', 
          payload: e.target.value 
        })}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## 10. Rendimiento y optimización

- **Memoización:** Componentes Logo y LoginForm memoizados con React.memo
- **Lazy imports:** Register y Login importados lazily en otros módulos
- **Reducer pattern:** Optimiza re-renders al tener actualizaciones granulares de estado
- **Validación on-demand:** Errores se limpian automáticamente al cambiar valores
- **Cooldown management:** Previene spam de reenvío de emails de verificación

**Áreas de mejora identificadas:**
- Implementar debouncing en validaciones de email
- Code splitting para modales de recuperación y registro
- Memoización de handlers con useCallback

## 11. Actualización
- Última actualización: 18/07/2025
