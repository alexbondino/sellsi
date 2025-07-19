# Panel Administrativo Sellsi

## 1. Resumen funcional del módulo
El módulo `admin_panel` gestiona todas las funcionalidades administrativas del sistema Sellsi. Permite a los administradores:
- Autenticarse con login especializado y 2FA.
- Gestionar cuentas administrativas (crear, editar, desactivar).
- Gestionar usuarios (banear/desbanear, ver detalles, filtrar).
- Gestionar solicitudes de pago (confirmar, rechazar, devolver).
- Visualizar estadísticas y dashboard.
- Configurar seguridad y ajustes avanzados.

**Arquitectura:**
- Basado en React y Material UI.
- Patrones: separación por componentes, hooks personalizados, modales para acciones críticas.
- Flujo de datos: los componentes principales orquestan vistas y acciones, comunicándose por props, eventos y hooks.

## 2. Listado de archivos
| Archivo                  | Tipo        | Descripción                                      | Responsabilidad                       |
|------------------------- |------------ |--------------------------------------------------|---------------------------------------|
| index.js                 | Exportador  | Centraliza exportaciones de componentes y hooks   | Punto de entrada                      |
| AdminPanelHome.jsx       | Página      | Vista principal del panel administrativo          | Orquestación de vistas y modales      |
| AdminLogin.jsx           | Componente  | Login administrativo con 2FA                      | Autenticación segura                  |
| AdminPanelTable.jsx      | Componente  | Tabla de gestión de solicitudes de pago           | Gestión de pagos                      |
| UserManagementTable.jsx  | Componente  | Tabla de gestión de usuarios                      | Banear/desbanear, ver usuarios        |
| AdminDashboard.jsx       | Componente  | Dashboard principal con pestañas                  | Estadísticas y navegación             |
| AdminAccountCreator.jsx  | Componente  | Crear cuentas administrativas                     | Alta de administradores               |
| AdminAccountManager.jsx  | Componente  | Gestionar cuentas administrativas                 | Edición, auditoría, control acceso    |
| AdminStatCard.jsx        | Componente  | Tarjeta de estadísticas                          | Visualización de métricas             |
| Setup2FA.jsx             | Componente  | Configuración de autenticación 2FA                | Seguridad avanzada                    |
| Manage2FA.jsx            | Componente  | Gestión de estado y configuración 2FA             | Habilitar/deshabilitar 2FA            |
| ConfirmarPagoModal.jsx   | Modal       | Confirmar pagos                                  | Acción crítica                        |
| RechazarPagoModal.jsx    | Modal       | Rechazar pagos                                   | Acción crítica                        |
| DevolverPagoModal.jsx    | Modal       | Devolver pagos                                   | Acción crítica                        |
| DetallesSolicitudModal.jsx| Modal      | Ver detalles completos de una solicitud           | Información detallada                 |
| UserBanModal.jsx         | Modal       | Confirmar ban/desban de usuario                   | Seguridad y control                   |
| hooks/useAdminLogin.js   | Hook        | Manejo de login administrativo y validaciones     | Estado y lógica de login              |
| hooks/index.js           | Exportador  | Centraliza hooks personalizados                  | Reutilización                         |

## 3. Relaciones internas del módulo
```
AdminPanelHome
├── AdminAccountCreator
├── AdminAccountManager
├── AdminDashboard
│   ├── AdminPanelTable
│   ├── UserManagementTable
│   └── ProductMarketplaceTable
├── Modales (ConfirmarPagoModal, RechazarPagoModal, etc.)
└── Hooks (useAdminLogin)
```
- Comunicación por props, eventos y hooks.
- Los modales se activan desde componentes principales.
- Los hooks gestionan estado y lógica compartida.

## 4. Props de los componentes
### AdminPanelHome
| Prop      | Tipo    | Requerido | Descripción                         |
|-----------|---------|-----------|-------------------------------------|
| open      | bool    | No        | Controla apertura de modales        |
| onClose   | func    | No        | Callback para cerrar modales        |
| onSuccess | func    | No        | Callback tras acción exitosa        |

### AdminLogin
| Prop      | Tipo    | Requerido | Descripción                         |
|-----------|---------|-----------|-------------------------------------|
| onLogin   | func    | Sí        | Callback tras login exitoso         |
| ...       | ...     | ...       | ...                                 |

**Notas:** Algunos componentes usan props para callbacks, datos y configuración avanzada. Revisar cada archivo para detalles específicos.

## 5. Hooks personalizados
### `useAdminLogin()`
**Propósito:** Maneja estado, validaciones y lógica de login administrativo, incluyendo 2FA y seguridad.
**Estados y efectos principales:**
- Estado del formulario (usuario, password, code2FA, errores, touched)
- Validaciones en tiempo real y por campo
- Seguridad: fuerza bruta, blacklist, fortaleza de contraseña
**API que expone:**
- `handleInputChange(field, value)`: Actualiza campo y limpia error
- `validateForm(step)`: Valida credenciales y 2FA
- `resetForm()`: Resetea formulario
- `validatePasswordStrength(password)`: Evalúa fortaleza
- `checkBruteForce(usuario)`: Detecta intentos excesivos
- `recordFailedAttempt(usuario)`: Registra intento fallido
- `clearFailedAttempts(usuario)`: Limpia intentos tras login
- `checkBlacklist(usuario)`: Verifica usuario prohibido
**Ejemplo de uso:**
```jsx
const {
  formState,
  handleInputChange,
  validateForm,
  resetForm,
  validatePasswordStrength
} = useAdminLogin();
```

## 6. Dependencias principales
| Dependencia      | Versión   | Propósito                  | Impacto                |
|------------------|-----------|----------------------------|------------------------|
| react            | ^18.0.0   | UI y estado                | Base de la app         |
| @mui/material    | ^5.0.0    | Componentes UI             | Interfaz moderna       |
| @mui/icons-material | ^5.0.0 | Iconos UI                  | Visualización          |
| react-router-dom | ^6.0.0    | Navegación SPA             | Routing                |
| react-qr-code    | ^2.0.0    | QR para 2FA                | Seguridad              |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- El modo desarrollo permite crear administradores sin autenticación previa (deshabilitar en producción).
- Validaciones estrictas en login y creación de cuentas.
- Acciones críticas requieren confirmación por modal.
### Deuda técnica relevante:
- [ALTA] Mejorar auditoría y logs de acciones administrativas.
- [MEDIA] Refactorizar componentes para mayor reutilización.

## 8. Puntos de extensión
- Componentes y hooks diseñados para reutilización.
- Interfaces públicas: exportaciones en `index.js` y `hooks/index.js`.
- Para extender: crear nuevos componentes/modales y agregarlos a `index.js`.

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { AdminPanelHome } from './admin_panel';

function MiComponente() {
  return <AdminPanelHome />;
}
```
### Ejemplo avanzado:
```jsx
import { AdminLogin, useAdminLogin } from './admin_panel';

function LoginAdmin() {
  const login = useAdminLogin();
  return <AdminLogin {...login} />;
}
```

## 10. Rendimiento y optimización
- Uso de `memo` y `useMemo` para evitar renders innecesarios.
- Code splitting por rutas y vistas.
- Optimización de tablas y listas con paginación y filtros.

## 11. Actualización
- Creado: `18/07/2025`
- Última actualización: `18/07/2025`
