# 🚀 README.ia.md - Análisis Ultra Profundo del Dominio `profile`

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Sistema integral de gestión de perfiles de usuario B2B que maneja información empresarial, bancaria, de envío y facturación, con protección avanzada de datos sensibles, subida de logos corporativos, y sincronización multi-tabla en base de datos

- **Responsabilidad principal:** Centralizar toda la información del perfil de usuario (básica, empresarial, bancaria, shipping, billing), proporcionar interfaces seguras para edición con validaciones, manejar subida de imágenes, y mantener consistencia entre múltiples tablas de base de datos

- **Posición en la arquitectura:** Capa de gestión de datos de usuario crítica que conecta autenticación con información de negocio, actúa como fuente de verdad para datos de perfil utilizados en checkout, orders, y comunicaciones

- **Criticidad:** ALTA - Datos incorrectos o corruptos impactan directamente operaciones de negocio, pagos, y entregas

- **Usuarios objetivo:** Todos los usuarios autenticados (compradores y proveedores) gestionando su información empresarial

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~2,800+ líneas distribuidas entre servicios, componentes, hooks, y utilidades
- **Complejidad ciclomática:** ALTA - Múltiples tablas de BD, validaciones complejas, mapeo bidireccional de datos, manejo de imágenes
- **Acoplamiento:** ALTO - Integración profunda con Supabase, servicios de storage, múltiples tablas relacionadas
- **Cohesión:** ALTA - Funcionalidades muy bien agrupadas por tipo de información y responsabilidad
- **Deuda técnica estimada:** BAJA - Código reciente y bien estructurado con patrones modernos

## 3. 🗂️ Inventario completo de archivos

### Estructura por Categorías

#### Core Profile Components
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| features/profile/Profile.jsx | Componente | ~400 | ALTA | Componente central del perfil con grid 2x2 | hooks múltiples, servicios |
| features/buyer/BuyerProfile.jsx | Wrapper | ~180 | MEDIA | Wrapper específico para compradores | Profile, profileService |
| features/supplier/SupplierProfile.jsx | Wrapper | ~180 | MEDIA | Wrapper específico para proveedores | Profile, profileService |

#### Specialized Hooks
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| features/profile/hooks/useProfileForm.js | Hook | ~70 | MEDIA | Estado del formulario y detección de cambios | mappers, useState |
| features/profile/hooks/useProfileImage.js | Hook | ~80 | MEDIA | Gestión de imágenes de perfil y preview | File API |
| features/profile/hooks/useSensitiveFields.js | Hook | ~60 | MEDIA | Control de visibilidad de datos sensibles | Masking utilities |

#### Modular Sections
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| features/profile/sections/CompanyInfoSection.jsx | Sección | ~150 | MEDIA | Información básica y empresa | MUI, validation |
| features/profile/sections/TransferInfoSection.jsx | Sección | ~120 | MEDIA | Información bancaria sensible | Masking, security |
| features/profile/sections/ShippingInfoSection.jsx | Sección | ~100 | MEDIA | Dirección de envío | Address validation |
| features/profile/sections/BillingInfoSection.jsx | Sección | ~100 | MEDIA | Datos de facturación | RUT validation |

#### Core Services
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| services/profileService.js | Servicio | ~250 | MUY ALTA | Servicio principal con 4 tablas BD | Supabase, complex queries |

#### Utilities and Helpers
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| utils/profileHelpers.js | Utilidades | ~120 | MEDIA | Mappers bidireccionales BD ↔ Frontend | Data transformation |

#### Supporting Components
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| features/profile/ChangePasswordModal.jsx | Modal | ~100 | MEDIA | Modal para cambio de contraseña | Supabase Auth |
| features/ui/ProfileImageModal.jsx | Modal | ~120 | MEDIA | Modal para gestión de imagen de perfil | File upload |

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **Multi-Table Data Layer**: Una entidad de perfil distribuida en 4 tablas BD
  - **Bidirectional Mapping Pattern**: Mappers específicos para BD ↔ Frontend
  - **Modular Section Pattern**: Secciones independientes para diferentes tipos de datos
  - **Sensitive Data Protection**: Masking y visibility control para datos sensibles
  - **Optimistic UI Pattern**: Updates locales antes de confirmación de BD
  - **Service Layer Pattern**: profileService como abstraction de múltiples tablas

- **Estructura de la base de datos (4 tablas):**
```
users (tabla principal)
├── user_id, email, phone_nbr, user_nm
├── main_supplier, country, rut
├── logo_url, descripcion_proveedor
└── created_at, updated_at

bank_info
├── user_id → users(user_id)
├── account_holder, bank, account_number
├── transfer_rut, confirmation_email
└── account_type

shipping_info
├── user_id → users(user_id)
├── shipping_region, shipping_comuna
├── shipping_address, shipping_number
└── shipping_dept

billing_info
├── user_id → users(user_id)
├── business_name, billing_rut
├── business_line, billing_address
├── billing_region, billing_comuna
└── created_at, updated_at
```

- **Estructura de carpetas:**
```
profile/
├── Profile.jsx                         # Componente central ⭐
├── ChangePasswordModal.jsx             # Modal cambio password
├── hooks/                              # Hooks especializados
│   ├── useProfileForm.js               # Estado formulario ⚠️
│   ├── useProfileImage.js              # Gestión imágenes
│   └── useSensitiveFields.js           # Datos sensibles
├── sections/                           # Secciones modulares
│   ├── CompanyInfoSection.jsx          # Info empresa
│   ├── TransferInfoSection.jsx         # Info bancaria ⚠️
│   ├── ShippingInfoSection.jsx         # Info envío
│   └── BillingInfoSection.jsx          # Info facturación
└── README.md                           # Documentación

buyer/BuyerProfile.jsx                  # Wrapper comprador
supplier/SupplierProfile.jsx            # Wrapper proveedor
services/profileService.js              # Servicio principal ⚠️
utils/profileHelpers.js                 # Mappers BD↔Frontend ⚠️
```

- **Flujo de datos completo:**
```
1. User Input → Section Component → useProfileForm
2. Form Validation → profileHelpers.mapFormDataToUserProfile
3. profileService.updateUserProfile → 4 Table Updates
4. Success Response → State Update → UI Refresh
5. Optional: Image Upload → Supabase Storage → URL Update
```

- **Puntos de entrada:**
  - `BuyerProfile.jsx` y `SupplierProfile.jsx`: Entry points por rol
  - `Profile.jsx`: Componente central compartido
  - `profileService.js`: API principal para operaciones

- **Puntos de salida:**
  - Updates a 4 tablas de base de datos simultáneamente
  - Storage de imágenes en Supabase
  - State updates para TopBar y otros componentes
  - IP tracking para auditoría

## 5. 🔗 Matriz de dependencias

#### Dependencias externas críticas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @supabase/supabase-js | ^2.x | CRUD operations, file storage | CRÍTICO - Core del sistema | Firebase, AWS |
| @mui/material | ^5.x | UI components, forms, grids | ALTO - UI consistency | Chakra UI, Ant Design |
| react | ^18.x | Hooks, state management | CRÍTICO - Base framework | Ninguna viable |

#### Servicios internos críticos:
| Servicio | Función específica | Nivel de dependencia | Ubicación |
|----------|-------------------|---------------------|-----------|
| Supabase Storage | Logo/image upload | ALTO - Profile images | Cloud storage |
| IP Tracking Service | Audit trail de cambios | MEDIO - Analytics | services/ipTrackingService |
| Banner Context | Success/error notifications | MEDIO - UX feedback | UI context |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| services/supabase | Importa | Cliente de base de datos | CRÍTICO |
| utils/profileHelpers | Importa | Data transformation | CRÍTICO |
| features/ui components | Importa | Modals y UI components | MEDIO |
| contexts/Banner | Importa | Notifications | BAJO |

## 6. 🧩 API del módulo

#### Servicio principal (profileService):
```jsx
// API completa del servicio de perfil
import { 
  getUserProfile,        // (userId) => Promise<{data, error}>
  updateUserProfile,     // (userId, profileData) => Promise<{success, error}>
  uploadProfileImage,    // (userId, file) => Promise<{url, error}>
  deleteAllUserImages,   // (userId) => Promise<{success, error}>
  repairUserImageUrl,    // (userId) => Promise<{success, correctUrl}>
  forceFixImageUrl       // (userId) => Promise<{success, correctUrl}>
} from '@/services/profileService';

// Ejemplo de uso
const { data: profile, error } = await getUserProfile(userId);
const { success, error } = await updateUserProfile(userId, formData);
```

#### Hook principal (useProfileForm):
```jsx
const {
  // Estado del formulario
  formData: {
    // Información básica
    email,                    // string
    phone,                    // string
    rut,                      // string
    role,                     // 'supplier' | 'buyer'
    user_nm,                  // string
    descripcionProveedor,     // string (solo suppliers)
    
    // Información de envío  
    shippingRegion,           // string
    shippingComuna,           // string
    shippingAddress,          // string
    shippingNumber,           // string
    shippingDept,             // string
    
    // Información bancaria (sensible)
    accountHolder,            // string
    accountType,              // 'corriente' | 'ahorro'
    bank,                     // string
    accountNumber,            // string (masked)
    transferRut,              // string (masked)
    confirmationEmail,        // string
    
    // Información de facturación
    businessName,             // string
    billingRut,               // string
    businessLine,             // string
    billingAddress,           // string
    billingRegion,            // string
    billingComuna             // string
  },
  
  // Estado de cambios
  hasChanges,                 // boolean
  
  // Acciones
  updateField,                // (field, value) => void
  updateFields,               // (object) => void
  resetForm,                  // () => void
  updateInitialData           // (newData?) => void
} = useProfileForm(userProfile);
```

#### Hook de imágenes (useProfileImage):
```jsx
const {
  // Estado de imagen
  pendingImage: {
    file,                     // File | null
    preview,                  // string | null
    delete                    // boolean
  },
  
  // Acciones
  handleImageChange,          // (file) => void
  clearPendingImage,          // () => void
  markImageForDeletion        // () => void
} = useProfileImage();
```

#### Hook de campos sensibles (useSensitiveFields):
```jsx
const {
  // Estado de visibilidad
  showSensitiveData,          // boolean
  
  // Acciones
  toggleSensitiveData,        // () => void
  
  // Utilidades
  maskValue                   // (value, type) => string
} = useSensitiveFields();
```

#### Componentes principales:
| Componente | Props | Descripción |
|------------|-------|-------------|
| Profile | `userProfile`, `onUpdateProfile` | Componente central del perfil |
| BuyerProfile | `onProfileUpdated` | Wrapper para compradores |
| SupplierProfile | `onProfileUpdated` | Wrapper para proveedores |

#### Estructura de datos principales:

**Complete Profile Object:**
```typescript
interface CompleteProfile {
  // Basic user data (users table)
  user_id: string;
  email: string;
  phone_nbr: string;         // Maps to: phone
  user_nm: string;           // Maps to: full_name
  main_supplier: boolean;    // Maps to: role ('supplier'|'buyer')
  country: string;
  rut: string;
  logo_url?: string;
  descripcion_proveedor?: string;
  
  // Banking data (bank_info table)
  account_holder?: string;
  account_type?: 'corriente' | 'ahorro';
  bank?: string;
  account_number?: string;   // Sensitive
  transfer_rut?: string;     // Sensitive
  confirmation_email?: string;
  
  // Shipping data (shipping_info table)
  shipping_region?: string;
  shipping_comuna?: string;
  shipping_address?: string;
  shipping_number?: string;
  shipping_dept?: string;
  
  // Billing data (billing_info table)
  business_name?: string;
  billing_rut?: string;
  business_line?: string;
  billing_address?: string;
  billing_region?: string;
  billing_comuna?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

## 7. 🔍 Análisis de estado

- **Estado multi-capa:**
  - **Database State**: 4 tablas con relaciones via user_id
  - **Service Layer State**: profileService mantiene consistency
  - **Form State**: useProfileForm tracks changes y validation
  - **UI State**: Component local state para modals, loading, errors
  - **Image State**: Pending uploads, preview, deletion flags

- **Estado local crítico:**
  - Form data con tracking de cambios granular
  - Image preview y pending operations
  - Sensitive data visibility toggles
  - Validation errors por campo
  - Loading states por operación (update, upload, delete)

- **Persistencia y sincronización:**
  - **Optimistic updates**: UI actualiza antes de BD confirmation
  - **Multi-table transactions**: 4 tablas actualizadas en secuencia
  - **Image storage**: Supabase storage con URL updates en BD
  - **Error recovery**: Rollback local state si BD operations fail
  - **Audit trail**: IP tracking para cambios de perfil

- **Consistencia de datos:**
  - Bidirectional mapping ensures BD ↔ Frontend consistency
  - Validation en múltiples capas (frontend, service, BD)
  - Image URL repair mechanisms para broken links
  - Profile refresh después de successful updates

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - **Role-based data**: Diferentes campos según supplier vs buyer
  - **Sensitive data protection**: Account numbers y RUTs masked by default
  - **Required field validation**: Email, phone obligatorios
  - **Image constraints**: Tamaño máximo, formatos permitidos
  - **Banking data validation**: Formato de cuentas bancarias
  - **RUT validation**: Formato y check digit para RUT chileno

- **Validaciones complejas:**
  - Email format validation con domains permitidos
  - Phone number format para códigos de país
  - RUT format validation con algoritmo check digit
  - Bank account number validation por banco
  - Address validation para regiones y comunas
  - Image file validation (size, type, dimensions)

- **Transformaciones de datos:**
  - BD field names ↔ Frontend field names mapping
  - Boolean role ↔ String role conversion
  - Sensitive data masking para display
  - Image URL processing y repair
  - Phone number normalization
  - Address field normalization

- **Casos especiales manejados:**
  - Profile creation vs update operations
  - Missing related table data (insert vs update)
  - Broken image URLs con automatic repair
  - Role changes que requieren diferentes datos
  - Bulk field updates con partial success handling
  - Concurrent updates por múltiples usuarios

- **Integraciones críticas:**
  - Supabase Auth para user identification
  - Supabase Storage para image management
  - IP tracking service para audit trail
  - Banner system para user notifications
  - TopBar refresh para immediate UI updates

## 9. 🔄 Flujos de usuario

**Flujo principal - Actualización de perfil:**
1. Usuario accede a perfil → Carga datos de 4 tablas → Mapping a form
2. Usuario edita campos → useProfileForm tracks changes → Real-time validation
3. Click guardar → Validación completa → profileService.updateUserProfile
4. 4 updates paralelos a BD → Success confirmation → State refresh
5. Banner notification → TopBar update → Return to view mode

**Flujo especializado - Subida de imagen:**
1. Click cambiar imagen → ProfileImageModal → File picker
2. Image preview → Validation (size/format) → Pending state
3. Confirm upload → Supabase storage → URL generation
4. Update users.logo_url → Success → UI refresh
5. Image visible en TopBar y Profile inmediatamente

**Flujo de datos sensibles:**
1. Campos bancarios masked por defecto → Click "Mostrar datos"
2. Toggle visibility → Reveal real values → Edit if needed
3. Save changes → Re-mask automatically → Audit trail log

**Flujo de error y recovery:**
1. BD operation fails → Error caught by service layer
2. Local state rollback → Error message to user
3. Retry mechanism available → Manual refresh option
4. Image URL broken → Automatic repair attempt

**Flujo de role change:**
1. Change role supplier ↔ buyer → Additional fields show/hide
2. Validation rules change → Re-validate form
3. Save → Update main_supplier boolean → UI adaptation

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - CRUD operations en las 4 tablas simultáneamente
  - Bidirectional mapping BD ↔ Frontend
  - Image upload, preview, y deletion
  - Sensitive data masking y visibility
  - Form validation para todos los tipos de datos
  - Error recovery y rollback scenarios
  - Role change con field adaptation

- **Mocks necesarios:**
  - Supabase client con CRUD operations
  - Supabase storage para images
  - File API para image uploads
  - IP tracking service
  - Banner notification system
  - User authentication context

- **Datos de prueba esenciales:**
  - Complete profiles con todos los campos
  - Partial profiles con missing related data
  - Invalid data para validation testing
  - Different file types para image upload
  - Broken image URLs para repair testing
  - Different user roles (supplier/buyer)

- **Escenarios de error críticos:**
  - Database connection failures durante updates
  - Image upload failures por size/format
  - Concurrent profile updates
  - Invalid RUT/bank account formats
  - Storage quota exceeded scenarios
  - Network timeouts durante operations

## 11. 🚨 Puntos críticos para refactor

- **Código legacy identificado:**
  - Algunos hardcoded field mappings que podrían ser más dynamic
  - Image repair logic disperso que podría centralizarse
  - Validation logic que podría unificarse más

- **Antipatrones detectados:**
  - Algunas validations duplicadas entre service y components
  - State management algo fragmentado entre hooks
  - Error handling inconsistente en algunas operaciones
  - Some magic strings para field names

- **Oportunidades de mejora prioritarias:**
  1. **Centralizar validation logic** en un validation service
  2. **Unificar error handling** con error boundaries específicos
  3. **Optimizar BD queries** con joins en lugar de múltiples queries
  4. **Implementar field-level permissions** por rol de usuario

- **Riesgos identificados:**
  - Dependencia crítica en estructura de 4 tablas BD
  - Image operations pueden fallar sin affecting other data
  - Sensitive data visible en memory durante editing
  - Multiple table updates no son atomic (no transaction)
  - Profile data scattered puede generar inconsistencies

- **Orden de refactor recomendado:**
  1. Implementar atomic transactions para multi-table updates (CRÍTICO)
  2. Centralizar validation con comprehensive service (ALTO VALOR)
  3. Unificar error handling con boundaries (MEDIO IMPACTO)
  4. Optimizar BD operations con joins (PERFORMANCE)
  5. Implementar field-level permissions (SEGURIDAD)

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **No atomic transactions**: Updates a 4 tablas no son transactional
- **Image storage limits**: Dependiente de Supabase storage quotas
- **No field-level permissions**: Todos los campos editables por owner
- **Limited validation**: Algunas validations solo en frontend
- **No data encryption**: Sensitive data en plain text en BD

#### Configuración requerida para producción:
- **Variables de entorno:**
  - `VITE_SUPABASE_URL`: URL del proyecto Supabase
  - `VITE_SUPABASE_ANON_KEY`: Clave pública para client
  - Storage bucket configurado para profile images

- **Base de datos setup:**
  - 4 tablas creadas con proper relationships
  - RLS policies configuradas para data protection
  - Indexes en user_id fields para performance
  - Proper constraints para data integrity

- **Storage configuration:**
  - Image bucket con proper permissions
  - File size limits configurados
  - Image processing rules para thumbnails

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles manejados:**
  - Bank account numbers (sensitive)
  - RUT numbers (PII)
  - Phone numbers (PII)
  - Email addresses (PII)
  - Business information (sensitive)
  - Profile images (personal data)

- **Medidas de seguridad implementadas:**
  - Data masking para sensitive fields
  - Input sanitization en todos los forms
  - File type validation para images
  - Size limits para uploads
  - User ownership validation
  - IP tracking para audit trail

- **Compliance considerations:**
  - GDPR compliance para EU users
  - Data retention policies needed
  - Right to be forgotten implementation
  - Data export functionality
  - Consent management para data processing

- **Vulnerabilidades potenciales:**
  - Sensitive data visible en browser memory
  - No encryption at rest para sensitive fields
  - Image URLs publicly accessible
  - No rate limiting en updates
  - Potential data leakage through image metadata

## 14. 📚 Referencias y documentación

- **Documentación técnica relacionada:**
  - [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
  - [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
  - Documentación interna: `ProfileBack.md`, `ProfileBackend_ANALISIS_FINAL.md`

- **Decisiones de arquitectura documentadas:**
  - 4-table structure elegida para separation of concerns
  - Bidirectional mapping para maintainability
  - Modular sections para code organization
  - Service layer para data consistency

- **Estándares de datos:**
  - RUT validation según normativa chilena
  - Phone number format international standards
  - Email validation según RFC standards
  - Bank account validation por banking standards

## 15. 🎨 Ejemplos de uso avanzados

### Ejemplo 1: Uso básico del perfil
```jsx
import { BuyerProfile, SupplierProfile } from '@/features';

function UserDashboard({ userRole }) {
  const handleProfileUpdate = async () => {
    // Refrescar TopBar u otros componentes que usan profile data
    await refreshUserContext();
  };

  return (
    <Box>
      {userRole === 'buyer' ? (
        <BuyerProfile onProfileUpdated={handleProfileUpdate} />
      ) : (
        <SupplierProfile onProfileUpdated={handleProfileUpdate} />
      )}
    </Box>
  );
}
```

### Ejemplo 2: Uso directo del servicio
```jsx
import { getUserProfile, updateUserProfile } from '@/services/profileService';

function ProfileManager() {
  const [profile, setProfile] = useState(null);

  const loadProfile = async (userId) => {
    const { data, error } = await getUserProfile(userId);
    if (!error) {
      setProfile(data);
    }
  };

  const updateProfile = async (userId, changes) => {
    try {
      const { success, error } = await updateUserProfile(userId, {
        phone: changes.phone,
        user_nm: changes.fullName,
        main_supplier: changes.role === 'supplier',
        shipping_address: changes.address,
        account_holder: changes.accountHolder
      });

      if (success) {
        // Reload profile
        await loadProfile(userId);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <ProfileEditor 
      profile={profile}
      onUpdate={updateProfile}
    />
  );
}
```

### Ejemplo 3: Hook personalizado para profile completo
```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '@/services/profileService';

function useCompleteProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await getUserProfile(user.id);
      if (error) throw error;
      
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user?.id) return { success: false, error: 'No user' };
    
    try {
      const result = await updateUserProfile(user.id, updates);
      if (result.success) {
        await loadProfile(); // Reload
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateImage = async (file) => {
    if (!user?.id) return { success: false };
    
    try {
      const { url, error } = await uploadProfileImage(user.id, file);
      if (error) throw error;
      
      await updateProfile({ logo_url: url });
      return { success: true, url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateImage,
    reload: loadProfile,
    
    // Computed properties
    isSupplier: profile?.main_supplier || false,
    hasShippingInfo: !!(profile?.shipping_address),
    hasBankingInfo: !!(profile?.account_number),
    profileCompleteness: calculateCompleteness(profile)
  };
}

function calculateCompleteness(profile) {
  if (!profile) return 0;
  
  const requiredFields = ['phone_nbr', 'user_nm'];
  const optionalFields = ['shipping_address', 'account_number', 'logo_url'];
  
  const requiredScore = requiredFields.filter(field => profile[field]).length / requiredFields.length * 0.7;
  const optionalScore = optionalFields.filter(field => profile[field]).length / optionalFields.length * 0.3;
  
  return Math.round((requiredScore + optionalScore) * 100);
}
```

### Ejemplo 4: Formulario de perfil personalizado
```jsx
import { useProfileForm, useSensitiveFields } from '@/features/profile/hooks';

function CustomProfileForm({ userProfile, onSave }) {
  const { formData, hasChanges, updateField, resetForm } = useProfileForm(userProfile);
  const { showSensitiveData, toggleSensitiveData, maskValue } = useSensitiveFields();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    try {
      await onSave(formData);
      // Form will be reset by parent component
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre Completo"
            value={formData.user_nm || ''}
            onChange={(e) => updateField('user_nm', e.target.value)}
            fullWidth
            required
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Teléfono"
            value={formData.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            fullWidth
            required
          />
        </Grid>

        {/* Role Selector */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Cuenta</InputLabel>
            <Select
              value={formData.role || 'buyer'}
              onChange={(e) => updateField('role', e.target.value)}
              label="Tipo de Cuenta"
            >
              <MenuItem value="buyer">Comprador</MenuItem>
              <MenuItem value="supplier">Proveedor</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Supplier Description */}
        {formData.role === 'supplier' && (
          <Grid item xs={12}>
            <TextField
              label="Descripción del Proveedor"
              value={formData.descripcionProveedor || ''}
              onChange={(e) => updateField('descripcionProveedor', e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Describe tu empresa y productos..."
            />
          </Grid>
        )}

        {/* Banking Information */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Información Bancaria</Typography>
            <IconButton 
              onClick={toggleSensitiveData}
              size="small"
              sx={{ ml: 1 }}
            >
              {showSensitiveData ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Número de Cuenta"
            value={showSensitiveData 
              ? formData.accountNumber || ''
              : maskValue(formData.accountNumber, 'account')
            }
            onChange={(e) => updateField('accountNumber', e.target.value)}
            disabled={!showSensitiveData}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="RUT Transferencia"
            value={showSensitiveData 
              ? formData.transferRut || ''
              : maskValue(formData.transferRut, 'rut')
            }
            onChange={(e) => updateField('transferRut', e.target.value)}
            disabled={!showSensitiveData}
            fullWidth
          />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!hasChanges}
            >
              Guardar Cambios
            </Button>
            
            <Button
              variant="outlined"
              onClick={resetForm}
              disabled={!hasChanges}
            >
              Cancelar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
```

### Ejemplo 5: Manager de imágenes de perfil
```jsx
import { useProfileImage } from '@/features/profile/hooks';
import { uploadProfileImage, deleteAllUserImages } from '@/services/profileService';

function ProfileImageManager({ userId, currentImageUrl, onImageUpdate }) {
  const { 
    pendingImage, 
    handleImageChange, 
    clearPendingImage, 
    markImageForDeletion 
  } = useProfileImage();
  
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!pendingImage.file) return;
    
    setUploading(true);
    try {
      if (pendingImage.delete) {
        // Delete current image
        await deleteAllUserImages(userId);
        onImageUpdate?.(null);
      } else {
        // Upload new image
        const { url, error } = await uploadProfileImage(userId, pendingImage.file);
        if (error) throw error;
        
        onImageUpdate?.(url);
      }
      
      clearPendingImage();
    } catch (error) {
      console.error('Image operation failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Current/Preview Image */}
      <Avatar
        src={pendingImage.preview || currentImageUrl}
        sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
      >
        {!currentImageUrl && !pendingImage.preview && (
          <PersonIcon sx={{ fontSize: 60 }} />
        )}
      </Avatar>

      {/* Upload Controls */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
        <input
          accept="image/*"
          type="file"
          id="image-upload"
          style={{ display: 'none' }}
          onChange={(e) => handleImageChange(e.target.files[0])}
        />
        <label htmlFor="image-upload">
          <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
            Subir Imagen
          </Button>
        </label>
        
        {currentImageUrl && (
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<Delete />}
            onClick={markImageForDeletion}
          >
            Eliminar
          </Button>
        )}
      </Box>

      {/* Pending Changes */}
      {(pendingImage.file || pendingImage.delete) && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <Save />}
          >
            {uploading ? 'Procesando...' : 'Confirmar Cambios'}
          </Button>
          
          <Button variant="outlined" onClick={clearPendingImage}>
            Cancelar
          </Button>
        </Box>
      )}

      {/* Upload Guidelines */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Formatos: JPG, PNG, WebP. Tamaño máximo: 2MB
      </Typography>
    </Box>
  );
}
```

## 16. 🔄 Guía de migración

- **Desde perfil básico a sistema completo:**
  - Migrar single-table profiles a 4-table structure
  - Implementar data mapping bidirectional
  - Añadir sensitive data protection
  - Configurar image storage system

- **Breaking changes potenciales:**
  - Field name changes por mapping requirements
  - API response structure changes
  - New required fields por business rules
  - Image URL structure changes

- **Checklist de migración:**
  - [ ] Ejecutar scripts SQL para crear 4 tablas
  - [ ] Migrar existing profile data a new structure
  - [ ] Configurar Supabase storage bucket
  - [ ] Implementar RLS policies
  - [ ] Testear bidirectional mapping
  - [ ] Validar sensitive data masking
  - [ ] Testing completo de image operations
  - [ ] Performance testing con multiple users

- **Plan de rollback:**
  - Backup completo de profile data antes de migration
  - Scripts de rollback para cada table structure change
  - Feature flags para alternar entre old/new profile system
  - Monitoring para detectar issues post-migration

## 17. 📋 Metadatos del documento

- **Creado:** 23/07/2025
- **Última actualización:** 23/07/2025
- **Versión del código:** Sprint-3.0 branch con 4-table structure
- **Autor:** Generado automáticamente por Pipeline ReadmeV4 
- **Próxima revisión:** 30/07/2025 (revisión de performance)
- **Cobertura del análisis:** 100% de archivos del dominio profile

---

## 🎯 Conclusiones del análisis ultra profundo - Dominio Profile

### ✅ Fortalezas excepcionales identificadas:
1. **Arquitectura bien diseñada**: 4-table structure con proper separation of concerns
2. **Data protection robusto**: Sensitive field masking y visibility controls
3. **Modular components**: Secciones independientes facilitan maintenance
4. **Comprehensive mapping**: Bidirectional BD ↔ Frontend mapping bien implementado
5. **Image management completo**: Upload, preview, deletion, y repair mechanisms

### ⚠️ Áreas que requieren atención:
1. **No atomic transactions**: Updates a múltiples tablas no son transactional
2. **Validation distribution**: Lógica de validation dispersa entre layers
3. **Error handling**: Inconsistente en algunas operations
4. **Performance**: Multiple queries podrían optimizarse con joins
5. **Security**: Sensitive data no encrypted at rest

### 🔥 Hotspots críticos para monitorear:
1. **profileService.js**: 250 LOC managing 4 tables - very complex
2. **Multi-table updates**: Risk de data inconsistency
3. **Image operations**: Potential failures que pueden affect UX
4. **Sensitive data**: Visibility en memory durante editing
5. **BD structure**: Changes require careful migration planning

### 🚀 Recomendaciones de mejora prioritarias:

#### Prioridad CRÍTICA (Data Integrity):
1. **Implementar atomic transactions**: Multi-table updates transactional
2. **Add data encryption**: Para sensitive fields en BD
3. **Comprehensive validation**: Backend validation para todos los fields
4. **Error recovery**: Robust rollback mechanisms
5. **Performance optimization**: Single query con joins

#### Prioridad ALTA (Architecture):
1. **Centralize validation**: Unified validation service
2. **Optimize BD queries**: Reduce multiple queries con joins
3. **Implement field permissions**: Granular edit permissions
4. **Add comprehensive logging**: Para audit y debugging
5. **TypeScript migration**: Type safety para complex data structures

#### Prioridad MEDIA (UX y Features):
1. **Profile completeness indicator**: Progress bar para user guidance
2. **Auto-save functionality**: Prevent data loss
3. **Advanced image features**: Cropping, thumbnails, multiple images
4. **Data export/import**: Para user data portability
5. **Profile templates**: Predefined profiles por industry

El dominio profile representa una implementación sólida y bien pensada para gestión completa de perfiles B2B. La arquitectura de 4 tablas proporciona flexibilidad y separation of concerns excelente. Las mejoras recomendadas se enfocan principalmente en data integrity y performance optimization más que en funcionalidad básica.
