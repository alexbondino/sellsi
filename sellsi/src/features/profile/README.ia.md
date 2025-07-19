# 🚀 Análisis Técnico Avanzado - Módulo Profile

---

## 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Gestión completa de perfiles de usuario en Sellsi, incluyendo información personal, empresarial, bancaria y de envío con protección de datos sensibles
- **Responsabilidad principal:** Centralizar la edición, visualización y protección de todos los datos de perfil de usuarios (proveedores y compradores)
- **Posición en la arquitectura:** Módulo frontend de gestión de usuarios, integrado con autenticación Supabase y sistema de validaciones
- **Criticidad:** ALTA - Componente crítico para operaciones de usuarios y transacciones
- **Usuarios objetivo:** Proveedores y compradores registrados que necesitan gestionar su información personal y empresarial

## 2. 📊 Análisis de complejidad
- **Líneas de código:** ~1,440 LOC total del módulo
- **Complejidad ciclomática:** ALTA - Múltiples condicionales, validaciones, estados y flujos de datos
- **Acoplamiento:** MEDIO - Dependencias con servicios Supabase, validadores, helpers y contextos UI
- **Cohesión:** ALTA - Funcionalidades relacionadas con gestión de perfiles organizadas modularmente
- **Deuda técnica estimada:** MEDIA - Oportunidades de mejora en modularización y reutilización

## 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| Profile.jsx | Componente | 377 | ALTA | Componente principal orquestador del perfil | @mui/material, hooks propios, secciones |
| ChangePasswordModal.jsx | Componente | 306 | MEDIA | Modal para cambio de contraseña con validaciones | @mui/material, supabase |
| CompanyInfoSection.jsx | Componente | 112 | MEDIA | Sección información empresarial (email, RUT, teléfono) | @mui/material, validators |
| BillingInfoSection.jsx | Componente | 139 | MEDIA | Sección datos de facturación con validaciones | @mui/material, validators |
| ShippingInfoSection.jsx | Componente | 105 | MEDIA | Sección información de envío y direcciones | @mui/material, validators |
| TransferInfoSection.jsx | Componente | 96 | MEDIA | Sección datos bancarios para transferencias | @mui/material, validators |
| ProfileSwitch.jsx | Componente | 64 | BAJA | Toggle switch reutilizable para secciones | @mui/material |
| useProfileForm.js | Hook | 75 | MEDIA | Gestión estado del formulario y detección cambios | react, profileHelpers |
| useProfileImage.js | Hook | 86 | MEDIA | Manejo de carga y gestión de imágenes de perfil | react, supabase |
| useSensitiveFields.js | Hook | 80 | BAJA | Control visibilidad campos sensibles con máscaras | react, profileHelpers |

## 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:** 
  - **Compound Components**: Secciones modulares del perfil
  - **Custom Hooks**: Encapsulación de lógica específica
  - **Controller Pattern**: useProfileForm como controlador de estado
  - **Security Pattern**: useSensitiveFields para protección de datos
- **Estructura de carpetas:** Organización por tipo (components, hooks, sections)
- **Flujo de datos principal:** Estado centralizado con hooks especializados
- **Puntos de entrada:** Profile.jsx como componente principal
- **Puntos de salida:** Exportación de componentes y hooks reutilizables

```
Diagrama de flujo detallado:
User Input → Profile.jsx → Hooks (Form, Image, Sensitive) → Sections → Validation → Supabase
├── useProfileForm (estado y cambios)
├── useProfileImage (gestión imágenes)
├── useSensitiveFields (protección datos)
└── Sections (modularización UI)
```

## 5. 🔗 Matriz de dependencias
#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | ^5.x | UI components y layout | ALTO - Toda la interfaz | Chakra UI, Mantine |
| @mui/icons-material | ^5.x | Iconografía del perfil | MEDIO - Solo visual | React Icons, Feather |
| react | ^18.x | Hooks y estado | CRÍTICO - Base funcional | Ninguna viable |
| supabase-js | ^2.x | Persistencia y storage | ALTO - Backend completo | Firebase, AWS Amplify |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /utils/profileHelpers | Importa | Validaciones y formateo | MEDIO |
| /utils/validators | Importa | Validación RUT, email, teléfono | ALTO |
| /services/supabase | Importa | Cliente base de datos | ALTO |
| /services/user | Importa | API usuarios | ALTO |
| /services/security | Importa | Tracking de acciones | MEDIO |
| /features/ui | Importa | Componentes compartidos | MEDIO |

## 6. 🧩 API del módulo
#### Componentes exportados:
```jsx
// Uso completo del módulo
import Profile from 'src/features/profile/Profile';
import { useProfileForm, useProfileImage, useSensitiveFields } from 'src/features/profile/hooks';

<Profile 
  userProfile={userData}
  onUpdateProfile={(updatedData) => handleUpdate(updatedData)}
/>
```

#### Props detalladas:
**Profile**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| userProfile | object | ✅ | - | User schema | Datos del perfil actual | {user_id: 123, email: "user@test.com"} |
| onUpdateProfile | function | ✅ | - | - | Callback actualización perfil | (data) => updateUser(data) |

#### Hooks personalizados:
**useProfileForm(userProfile)**
- **Propósito:** Gestión completa del estado del formulario de perfil
- **Parámetros:** userProfile (object) - Datos iniciales del usuario
- **Retorno:** {formData, setFormData, hasChanges, handleFieldChange, resetForm}
- **Estados internos:** formData, initialData, hasChanges
- **Efectos:** Detección automática de cambios, mapeo BD→Form
- **Casos de uso:** Cualquier formulario de edición de perfil
- **Limitaciones:** Solo funciona con estructura específica de datos

**useProfileImage(userProfile)**
- **Propósito:** Gestión de carga y actualización de imágenes de perfil
- **Parámetros:** userProfile (object) - Datos del usuario
- **Retorno:** {imageUrl, uploadImage, deleteImage, loading, error}
- **Estados internos:** imageUrl, loading, error
- **Efectos:** Carga desde Supabase Storage, limpieza de URLs temporales
- **Casos de uso:** Avatar de usuario, logos de empresa
- **Limitaciones:** Solo imágenes < 5MB, formatos específicos

**useSensitiveFields()**
- **Propósito:** Control de visibilidad de campos sensibles con enmascarado
- **Parámetros:** Ninguno (configuración interna)
- **Retorno:** {showSensitiveData, toggleSensitiveData, getSensitiveFieldValue, isFieldVisible, hideAllFields}
- **Estados internos:** showSensitiveData (objeto por campo)
- **Efectos:** Ninguno (solo estado local)
- **Casos de uso:** Números de cuenta, RUT, datos bancarios
- **Limitaciones:** Campos hardcodeados, sin persistencia

## 7. 🔍 Análisis de estado
- **Estado global usado:** BannerContext para notificaciones, contexto de autenticación Supabase
- **Estado local:** 
  - Profile: loadedProfile, modales, loading, edición
  - useProfileForm: formData, initialData, hasChanges
  - useProfileImage: imageUrl, loading, error
  - useSensitiveFields: showSensitiveData por campo
- **Persistencia:** Supabase Database (perfil), Supabase Storage (imágenes)
- **Sincronización:** Fetch inicial + actualizaciones manuales, sin tiempo real
- **Mutaciones:** Updates directos a Supabase con optimistic updates

## 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:**
  - Validación RUT chileno con formato específico
  - Campos obligatorios según tipo de usuario (proveedor/comprador)
  - Enmascarado automático de datos sensibles
  - Validación de formatos de email y teléfono
  - Restricciones de tamaño y tipo para imágenes
- **Validaciones:**
  - RUT: Formato y dígito verificador
  - Email: Formato RFC 5322
  - Teléfono: Formato internacional con código país
  - Imágenes: Tipo MIME y tamaño máximo
- **Transformaciones de datos:**
  - Mapeo BD ↔ Formulario
  - Formateo visual de RUT y teléfonos
  - Enmascarado de campos sensibles
- **Casos especiales:**
  - Usuarios sin perfil completo
  - Errores de conectividad
  - Campos vacíos vs null vs undefined
- **Integraciones:** Supabase (auth, database, storage), servicio de seguridad (tracking)

## 9. 🔄 Flujos de usuario
**Flujo principal de edición:**
1. Usuario accede perfil → Sistema carga datos de Supabase → Renderiza formulario
2. Usuario modifica campos → Hook detecta cambios → Activa botones de guardado
3. Usuario guarda → Validaciones client-side → Llamada a Supabase → Feedback visual
4. Si éxito → Estado actualizado → Banner de confirmación → Form reset
5. Si error → Mensaje específico → Usuario puede reintentar

**Flujos alternativos:**
- **Cambio contraseña**: Modal dedicado → Validación robusta → Supabase Auth
- **Carga imagen**: Modal selector → Preview → Upload Storage → Update profile
- **Campos sensibles**: Toggle visibilidad → Enmascarado/desenmascarado inmediato
- **Error de red**: Retry automático → Fallback offline → Notificación clara

## 10. 🧪 Puntos de testing
- **Casos de prueba críticos:**
  - Validación completa de RUT (formato + dígito verificador)
  - Flujo completo de actualización de perfil
  - Enmascarado/desenmascarado de campos sensibles
  - Carga y eliminación de imágenes
  - Detección de cambios en formulario
- **Mocks necesarios:**
  - Supabase client (auth, database, storage)
  - Servicios de validación
  - File APIs para upload
  - Banner context
- **Datos de prueba:**
  - Usuarios con perfiles completos/incompletos
  - RUTs válidos/inválidos
  - Imágenes de diferentes tamaños/formatos
- **Escenarios de error:**
  - Fallos de conectividad
  - Errores de validación
  - Timeouts de upload
  - Permisos insuficientes
- **Performance:**
  - Tiempo de carga inicial
  - Responsividad durante upload
  - Memory leaks en preview imágenes

## 11. 🚨 Puntos críticos para refactor
- **Código legacy:**
  - Profile.jsx muy extenso (377 LOC) - dividir en subcomponentes
  - Lógica de mapeo BD→Form dispersa - centralizar
- **Antipatrones:**
  - Múltiples useState en Profile.jsx - consolidar en reducer
  - Validaciones duplicadas entre componentes - centralizar
  - Console.logs abundantes - implementar logger
- **Oportunidades de mejora:**
  - Extraer constantes de validación
  - Implementar cache para imágenes
  - Optimistic updates consistentes
  - Error boundaries específicos
- **Riesgos:**
  - Cambios en esquema Supabase romperían mapeos
  - Validaciones client-side sin backend pueden fallar
  - Estados no sincronizados entre hooks
- **Orden de refactor:**
  1. Consolidar validaciones → Centralizar lógica
  2. Extraer subcomponentes → Reducir complejidad Profile.jsx
  3. Implementar error boundaries → Mejorar robustez
  4. Cache y optimizaciones → Performance

## 12. 🔧 Consideraciones técnicas
#### Limitaciones actuales:
- **Performance:** Profile.jsx renderiza todo el formulario, sin virtualización
- **Memoria:** Previews de imagen no se limpian consistentemente
- **Escalabilidad:** Validaciones hardcodeadas, difícil agregar nuevos campos
- **Compatibilidad:** Dependiente de File API moderna

#### Configuración requerida:
- **Variables de entorno:** 
  - SUPABASE_URL, SUPABASE_ANON_KEY
  - Storage bucket configurado para avatars
- **Inicialización:** 
  - Supabase client inicializado
  - Tablas users con esquema específico
- **Permisos:** 
  - RLS policies para profiles
  - Storage policies para imágenes

## 13. 🛡️ Seguridad y compliance
- **Datos sensibles:** 
  - RUT, números de cuenta bancaria, datos personales
  - Imágenes de perfil con metadatos
- **Validaciones de seguridad:**
  - Client-side masking de campos sensibles
  - Validación de tipos de archivo para uploads
  - Sanitización de inputs
- **Permisos:** 
  - RLS en Supabase para isolación usuarios
  - Storage policies por usuario
- **Auditoría:** 
  - trackUserAction para cambios importantes
  - Logs de acceso a campos sensibles

## 14. 📚 Referencias y documentación
- **Documentación técnica:**
  - [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
  - [Material-UI Components](https://mui.com/material-ui/)
- **Decisiones de arquitectura:**
  - Hooks personalizados para separar lógica de UI
  - Secciones modulares para mantenibilidad
  - Enmascarado client-side por UX
- **Recursos externos:**
  - [RUT Validation Algorithm](https://es.wikipedia.org/wiki/Rol_Único_Tributario)
  - [React Hook Patterns](https://react-hooks-cheatsheet.com/)

## 15. 🎨 Ejemplos de uso avanzados
```jsx
// Ejemplo 1: Uso básico del módulo completo
import Profile from 'src/features/profile/Profile';

function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  
  return (
    <Profile 
      userProfile={userProfile}
      onUpdateProfile={(updated) => {
        setUserProfile(updated);
        // Sync con estado global
      }}
    />
  );
}

// Ejemplo 2: Uso de hooks individuales
import { useProfileForm, useSensitiveFields } from 'src/features/profile/hooks';

function CustomProfileForm({ user }) {
  const { formData, handleFieldChange, hasChanges } = useProfileForm(user);
  const { getSensitiveFieldValue, toggleSensitiveData } = useSensitiveFields();
  
  return (
    <form>
      <input 
        value={getSensitiveFieldValue('accountNumber', formData.accountNumber)}
        onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
      />
      <button onClick={() => toggleSensitiveData('accountNumber')}>
        Toggle Visibility
      </button>
    </form>
  );
}

// Ejemplo 3: Integración con sistema de permisos
function ProfileWithPermissions({ user, permissions }) {
  if (!permissions.includes('edit_profile')) {
    return <ProfileView user={user} />;
  }
  
  return <Profile userProfile={user} onUpdateProfile={handleUpdate} />;
}

// Ejemplo 4: Manejo avanzado de errores
function RobustProfile({ user }) {
  const [error, setError] = useState(null);
  
  const handleUpdate = async (data) => {
    try {
      await updateUserProfile(data);
    } catch (err) {
      setError(err.message);
      // Log error for monitoring
    }
  };
  
  if (error) {
    return <ErrorBoundary error={error} retry={() => setError(null)} />;
  }
  
  return <Profile userProfile={user} onUpdateProfile={handleUpdate} />;
}
```

## 16. 🔄 Guía de migración
- **Desde versión anterior:** 
  - Migrar de useState múltiples a useProfileForm
  - Actualizar imports de hooks
- **Breaking changes:**
  - Estructura de userProfile debe incluir campos específicos
  - onUpdateProfile callback es obligatorio
- **Checklist de migración:**
  1. ✅ Verificar esquema de datos Supabase
  2. ✅ Actualizar imports de componentes
  3. ✅ Implementar callbacks requeridos
  4. ✅ Probar flujos críticos
- **Rollback:** 
  - Revertir imports
  - Restaurar estados locales originales

## 17. 📋 Metadatos del documento
- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 18/08/2025
