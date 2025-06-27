# Profile Module (`src/features/profile`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Profile** centraliza la gestión, visualización y edición de la información de perfil de usuario en Sellsi. Permite a los usuarios (proveedores y compradores) consultar, actualizar y proteger sus datos personales, empresariales, bancarios y de envío, así como cambiar su contraseña y gestionar la imagen de perfil. Resuelve la necesidad de un perfil robusto, seguro y flexible, integrando validaciones, campos sensibles y experiencia de usuario profesional.

## Listado de archivos principales

| Archivo                  | Tipo         | Descripción breve                                                      |
|------------------------- |-------------|-----------------------------------------------------------------------|
| Profile.jsx              | Componente  | Vista principal del perfil, edición modular y validación avanzada.    |
| ProfileSwitch.jsx        | Componente  | Selector visual para roles o tipos de cuenta.                         |
| ChangePasswordModal.jsx  | Componente  | Modal para cambio seguro de contraseña.                               |
| hooks/useProfileForm.js  | Hook        | Maneja el estado y cambios del formulario de perfil.                  |
| hooks/useProfileImage.js | Hook        | Lógica de imagen de perfil, preview y limpieza de blobs.              |
| hooks/useSensitiveFields.js | Hook     | Controla visibilidad y enmascarado de campos sensibles.               |

## Relaciones internas del módulo

- `Profile.jsx` importa y orquesta los hooks y componentes auxiliares para edición, imagen, contraseña y campos sensibles.
- `ProfileSwitch.jsx` es usado para cambiar roles o tipos de cuenta en formularios.
- `ChangePasswordModal.jsx` es invocado desde la vista principal para actualizar la contraseña.
- Los hooks de `hooks/` gestionan el estado del formulario, imagen y campos sensibles, y son consumidos por `Profile.jsx`.

Árbol de relaciones simplificado:

```
Profile.jsx
├─ hooks/
│   ├─ useProfileForm.js
│   ├─ useProfileImage.js
│   └─ useSensitiveFields.js
├─ ChangePasswordModal.jsx
├─ ProfileSwitch.jsx
└─ ... (secciones y utilidades internas)
```

## Props de los componentes principales

| Componente           | Prop                | Tipo         | Requerida | Descripción                                      |
|----------------------|---------------------|--------------|-----------|--------------------------------------------------|
| Profile              | userProfile         | object       | Sí        | Objeto con los datos del usuario.                |
|                      | onUpdateProfile     | function     | No        | Callback al actualizar el perfil.                |
| ProfileSwitch        | value               | string       | Sí        | Valor seleccionado (rol o tipo de cuenta).       |
|                      | onChange            | function     | Sí        | Callback al cambiar selección.                   |
|                      | type                | string       | Sí        | Tipo de switch ('role', 'accountType', etc.).    |
|                      | sx                  | object       | No        | Estilos personalizados.                          |
| ChangePasswordModal  | open                | boolean      | Sí        | Si el modal está abierto.                        |
|                      | onClose             | function     | Sí        | Callback para cerrar el modal.                   |
|                      | onPasswordChanged   | function     | No        | Callback tras cambiar la contraseña.             |
|                      | showBanner          | function     | No        | Muestra banners de feedback.                     |

## Hooks personalizados

### useProfileForm.js
Centraliza el estado del formulario de perfil, detecta cambios, permite actualizar campos individuales o múltiples, y resetea el formulario tras guardar o cancelar. Expone `formData`, `hasChanges`, `updateField`, `updateFields`, `resetForm`, `updateInitialData`.

### useProfileImage.js
Gestiona la lógica de imagen de perfil: cambio, preview, limpieza de blobs y cancelación de cambios. Expone `pendingImage`, `handleImageChange`, `getDisplayImageUrl`, `clearPendingImage`, `cancelImageChanges`.

### useSensitiveFields.js
Controla la visibilidad y enmascarado de campos sensibles (ej: cuenta bancaria, RUT). Permite alternar visibilidad, obtener valores enmascarados y ocultar/motrar campos específicos.

## Dependencias externas e internas

- **Externas**: React, Material-UI, íconos de Material-UI, Supabase.
- **Internas**: Helpers de `utils/profileHelpers`, componentes de UI y hooks personalizados.
- **Contextos/Providers**: Utiliza contextos para banners y feedback visual.
- **Importaciones externas**: Utiliza helpers y componentes de fuera de la carpeta para integración total.

## Consideraciones técnicas y advertencias

- El módulo asume integración con Material-UI y Supabase.
- Los hooks están optimizados para performance y desacoplados para facilitar testing y extensión.
- El manejo de campos sensibles y blobs de imagen está pensado para seguridad y limpieza de recursos.
- Si se modifica la estructura de usuario, revisar los mapeos y validaciones en hooks y helpers.
- El cambio de contraseña utiliza validaciones estrictas y feedback visual.

## Puntos de extensión o reutilización

- Los hooks y componentes pueden ser reutilizados en formularios de registro, onboarding o edición avanzada.
- El barrel (si se agrega) permite importar cualquier componente o hook del módulo de forma centralizada.

## Ejemplos de uso

### Importar y usar el perfil principal

```jsx
import Profile from 'src/features/profile/Profile';

<Profile userProfile={usuario} onUpdateProfile={handleUpdate} />
```

### Usar el switch de roles o tipo de cuenta

```jsx
import ProfileSwitch from 'src/features/profile/ProfileSwitch';

<ProfileSwitch value="buyer" onChange={handleChange} type="role" />
```

### Usar el modal de cambio de contraseña

```jsx
import ChangePasswordModal from 'src/features/profile/ChangePasswordModal';

<ChangePasswordModal open={open} onClose={handleClose} />
```

---

Este README documenta la estructura, relaciones y funcionamiento del módulo Profile. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa los hooks y helpers, ya que son el corazón de la lógica de perfil en Sellsi.
