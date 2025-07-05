# Admin Panel Module

## 1. Resumen funcional del módulo
Este módulo implementa el panel administrativo de Sellsi, permitiendo a los administradores gestionar solicitudes de pago, confirmar, rechazar o devolver pagos, y visualizar detalles completos de cada solicitud. Incluye autenticación especializada y soporte para 2FA.

- **Problema que resuelve:** Gestión centralizada y segura de pagos y solicitudes administrativas.
- **Arquitectura:** Basada en componentes React desacoplados, modales reutilizables y hooks personalizados para manejo de estado y lógica de negocio.
- **Función principal:** Proveer una interfaz robusta para la administración de pagos y solicitudes.
- **Flujo de datos:**
  1. El administrador inicia sesión (con 2FA).
  2. Visualiza y filtra solicitudes en una tabla principal.
  3. Gestiona cada solicitud mediante modales (confirmar, rechazar, devolver, ver detalles).

## 2. Listado de archivos
| Archivo                  | Tipo        | Descripción                                 | Responsabilidad                         |
|--------------------------|-------------|---------------------------------------------|-----------------------------------------|
| index.js                 | Entrada     | Exporta todos los componentes y hooks       | Punto de acceso del módulo              |
| components/AdminLogin.jsx| Componente  | Login administrativo con 2FA                | Autenticación de administradores        |
| components/AdminPanelTable.jsx | Componente | Tabla principal de solicitudes         | Visualización y gestión de solicitudes  |
| modals/ConfirmarPagoModal.jsx | Modal   | Modal para confirmar pagos                  | Confirmación y notificación de pagos    |
| modals/RechazarPagoModal.jsx  | Modal   | Modal para rechazar pagos                   | Rechazo y documentación de motivos      |
| modals/DevolverPagoModal.jsx  | Modal   | Modal para devoluciones                     | Procesar devoluciones y notificar       |
| modals/DetallesSolicitudModal.jsx | Modal | Modal de detalles completos de solicitud | Visualización avanzada de información   |
| hooks/useAdminLogin.js   | Hook        | Hook para login administrativo              | Manejo de estado y validaciones login   |
| hooks/index.js           | Entrada     | Re-exporta hooks del módulo                 | Organización de hooks                   |

## 3. Relaciones internas del módulo
```
AdminPanelTable
├── ConfirmarPagoModal
├── RechazarPagoModal
├── DevolverPagoModal
└── DetallesSolicitudModal

AdminLogin (usa useAdminLogin)
```
- Comunicación por props y callbacks.
- Los modales reciben datos y handlers desde la tabla principal.

## 4. Props de los componentes
### AdminLogin
| Prop      | Tipo     | Requerido | Descripción                                 |
|-----------|----------|-----------|---------------------------------------------|
| Ninguno (usa hooks internos y navegación)

### AdminPanelTable
| Prop      | Tipo     | Requerido | Descripción                                 |
|-----------|----------|-----------|---------------------------------------------|
| Ninguno (consume servicios y maneja estado interno)

### Modales (ConfirmarPagoModal, RechazarPagoModal, DevolverPagoModal, DetallesSolicitudModal)
| Prop      | Tipo     | Requerido | Descripción                                 |
|-----------|----------|-----------|---------------------------------------------|
| open      | boolean  | Sí        | Controla visibilidad del modal              |
| onClose   | función  | Sí        | Handler para cerrar el modal                |
| solicitud | objeto   | Sí        | Datos de la solicitud a gestionar           |

**Notas:**
- Los modales pueden recibir props adicionales según la acción (motivos, adjuntos, etc).

## 5. Hooks personalizados
- **useAdminLogin()**
  - Propósito: Maneja el estado, validaciones y lógica de autenticación del login administrativo.
  - Estados: usuario, password, code2FA, errores, touched.
  - Efectos: Validación de campos, envío de credenciales, manejo de 2FA.
  - API expuesta: formState, handleInputChange, validateField, submitLogin, resetForm, etc.

  **Ejemplo de uso:**
  ```js
  const { formState, handleInputChange, submitLogin } = useAdminLogin();
  ```

## 6. Dependencias principales
| Dependencia        | Versión | Propósito                  | Impacto                |
|--------------------|---------|----------------------------|------------------------|
| @mui/material      | >=5     | UI components              | Interfaz moderna       |
| react-router-dom   | >=6     | Navegación y rutas         | Control de navegación  |

## 7. Consideraciones técnicas
- El login requiere validación contra usuarios administrativos y soporta 2FA.
- La tabla principal usa memoización y filtros para eficiencia.
- Los modales desacoplan la lógica de cada acción administrativa.
- **Limitaciones:**
  - No incluye lógica de backend, solo frontend.
  - El estado de sesión depende de la integración con servicios externos.

## 8. Puntos de extensión
- Los modales pueden extenderse para nuevas acciones administrativas.
- El hook `useAdminLogin` puede adaptarse para otros roles o flujos de autenticación.
- Se pueden agregar nuevos filtros o columnas a la tabla principal.

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { AdminLogin, AdminPanelTable } from './admin_panel';

function AdminPage() {
  return (
    <>
      <AdminLogin />
      <AdminPanelTable />
    </>
  );
}
```

### Ejemplo avanzado:
```jsx
import { AdminPanelTable, ConfirmarPagoModal } from './admin_panel';
import { useState } from 'react';

function Panel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitud, setSolicitud] = useState(null);
  return (
    <>
      <AdminPanelTable onSelectSolicitud={setSolicitud} onOpenModal={() => setModalOpen(true)} />
      <ConfirmarPagoModal open={modalOpen} solicitud={solicitud} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

## 10. Rendimiento y optimización
- Uso de memoización y hooks para evitar renders innecesarios.
- Filtros y paginación en la tabla para eficiencia.
- Modales cargados bajo demanda.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
