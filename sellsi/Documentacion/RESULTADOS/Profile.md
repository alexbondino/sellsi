# 📊 Análisis del Módulo Profile - 2024-12-27

## 🔍 Estructura esperada del archivo `.md` generado

### 🩺 Diagnóstico del Estado Actual

#### 1. **Funcionamiento Actual**

El módulo Profile está **funcionalmente operativo** según el análisis de código:

- ✅ **Imports correctos**: Todas las dependencias están bien importadas (React, MUI, componentes locales, servicios)
- ✅ **Estructura cohesiva**: Los archivos están organizados lógicamente en `src/features/profile/`
- ✅ **Convenciones React**: Uso adecuado de hooks (useState, useEffect), componentes funcionales
- ✅ **TypeScript implícito**: Props bien tipadas implícitamente
- ✅ **Integración con backend**: Correcta integración con Supabase para cambio de contraseña

**Indicios de funcionamiento correcto:**
- Manejo de estado complejo con useState para múltiples formularios
- Validaciones implementadas (RUT, email, contraseña)
- Feedback visual con banners de éxito/error
- Detección automática de cambios en formularios
- Integración con context de banners (`useBanner`)

#### 2. **Problemas Detectados**

**🔴 Problemas de Legibilidad y Mantenibilidad:**

1. **Componente monolítico excesivo**:
   - `Profile.jsx` tiene **800 líneas** - viola principio de responsabilidad única
   - **4 secciones distintas** en un solo archivo (Empresa, Transferencia, Envío, Facturación)
   - **Demasiadas responsabilidades** en un componente

2. **Duplicación de lógica (DRY violado)**:
   ```jsx
   // Líneas 125-135: Validación de RUT repetida 3 veces
   const validateRut = (rut) => {
     if (!rut) return true;
     const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
     return rutPattern.test(rut);
   };
   // Esta función se usa en 3 campos diferentes pero se define una sola vez
   
   // Líneas 480, 520, 680: Lógica de región/comuna repetida
   handleRegionChange('shipping', 'shippingRegion', 'shippingComuna')
   handleRegionChange('billing', 'billingRegion', 'billingComuna')
   ```

3. **Estado complejo y disperso**:
   ```jsx
   // Líneas 27-58: Objeto formData con 20+ propiedades
   const [formData, setFormData] = useState({
     // 4 grupos diferentes de datos mezclados
   });
   ```

4. **Acoplamiento alto**:
   - Lógica de validación mezclada con UI
   - Manejo de imágenes mezclado con datos de perfil
   - Estado de UI mezclado con estado de datos

**🟡 Problemas de Cohesión/Acoplamiento:**

5. **Funciones utilitarias mezcladas con componente**:
   ```jsx
   // Líneas 212-235: Funciones que deberían estar en utils/
   const maskSensitiveData = (value, showLast = 4) => { ... }
   const validateRut = (rut) => { ... }
   const validateEmail = (email) => { ... }
   ```

6. **Nombres ambiguos**:
   ```jsx
   // Línea 142: Función genérica con parámetros confusos
   const handleRegionChange = (field, regionField, comunaField) => { ... }
   ```

#### 3. **Zonas Críticas**

**🚨 Zonas de Alto Riesgo:**

1. **Mapeo de datos BD ↔ FormData (líneas 85-115)**:
   ```jsx
   // Mapeo sensible entre campos de BD y formulario
   role: userProfile.main_supplier ? 'supplier' : 'buyer', // Conversión boolean → string
   phone: userProfile.phone_nbr || '', // Mapeo phone_nbr → phone
   ```
   - **Riesgo**: Cambios pueden romper sincronización con BD
   - **Dependencias ocultas**: Nombres de campos de BD acoplados

2. **Lógica de actualización del perfil (líneas 158-201)**:
   ```jsx
   const handleUpdate = async () => {
     // Lógica compleja con imagen + datos + banner
     // Múltiples efectos secundarios
   }
   ```
   - **Riesgo**: Manejo de imagen y datos en mismo flujo
   - **Efectos secundarios**: Banner, limpieza de memoria, reset de estado

3. **Validaciones en tiempo real**:
   - **Dependencias**: Validación RUT/email acoplada a cambios de input
   - **Efectos**: Cambios en validación pueden afectar UX

---

### 🧠 Justificación Técnica

#### **¿Modularizar?** ✅ **SÍ**

**Casos concretos:**

1. **4 formularios independientes** pueden ser componentes separados:
   - `CompanyInfoForm` (Información Empresa)
   - `TransferInfoForm` (Información Transferencia) 
   - `ShippingInfoForm` (Información Envío)
   - `BillingInfoForm` (Información Facturación)

2. **Lógica de validación** puede extraerse a hooks custom:
   - `useFormValidation()` para validaciones comunes
   - `useProfileData()` para manejo de estado del perfil

3. **Utilidades reutilizables**:
   - `profileUtils.js` para funciones como `maskSensitiveData`, `validateRut`

#### **¿Refactorizar?** ✅ **SÍ**

**Beneficios claros:**

1. **Separación de responsabilidades**: Cada componente maneja una sección específica
2. **Reutilización**: Validaciones y utilidades pueden usarse en otros módulos
3. **Testabilidad**: Componentes pequeños son más fáciles de testear
4. **Mantenibilidad**: Cambios en una sección no afectan otras
5. **Legibilidad**: Componentes de ~100-150 líneas vs 800 líneas

#### **¿Qué ganancia técnica se obtiene?**

1. **Reutilización**:
   - Hook `useRegionComuna` para otros formularios de dirección
   - Componente `SensitiveField` para campos con máscara
   - Validaciones en `utils/validators.js`

2. **Separación de responsabilidades**:
   - UI separada de lógica de negocio
   - Estado local vs estado global bien definido
   - Validaciones centralizadas

3. **Testabilidad**:
   - Tests unitarios por componente/hook
   - Mocking más simple
   - Coverage más específico

4. **Performance**:
   - Re-renders más específicos
   - Memoización más efectiva
   - Lazy loading de secciones

---

### ✅ Decisión Final

- **Refactorización:** ✅ **SÍ**  
- **Modularización:** ✅ **SÍ**  
- **Nivel de riesgo estimado:** 🟡 **MEDIO**  

**Resumen de por qué se decide actuar:**

La modularización es **necesaria** porque:
1. **800 líneas en un componente** viola principios de Clean Code
2. **4 responsabilidades distintas** justifican separación
3. **Duplicación de lógica** reduce mantenibilidad
4. **Benefits > Risks**: Ganancia en testabilidad y mantenibilidad supera riesgo de refactor

El riesgo es **MEDIO** porque:
- ✅ **Sin tests existentes** - no hay regresión de tests
- ⚠️ **Lógica crítica de mapeo BD** requiere cuidado especial
- ✅ **Buena estructura de props** facilita separación
- ⚠️ **Estado complejo** requiere migración cuidadosa

---

### 🛠️ Plan de Acción Detallado

#### 🔄 Refactorización

1. **Extraer utilidades comunes**:
   - `src/utils/validators.js`: `validateRut`, `validateEmail`
   - `src/utils/profileHelpers.js`: `maskSensitiveData`, `getInitials`

2. **Crear hooks custom**:
   - `src/hooks/useProfileForm.js`: Manejo de estado de formulario
   - `src/hooks/useRegionComuna.js`: Lógica de región/comuna
   - `src/hooks/useProfileImage.js`: Manejo de imagen de perfil

3. **Mejorar componentes existentes**:
   - `ProfileSwitch.jsx`: Añadir más tipos y configurabilidad
   - `ChangePasswordModal.jsx`: Separar validación a hook

#### 🧩 Modularización

1. **Nuevos archivos sugeridos**:

```
src/features/profile/
├── Profile.jsx (coordinador principal - ~200 líneas)
├── ProfileSwitch.jsx (existente)
├── ChangePasswordModal.jsx (existente)
└── sections/
    ├── CompanyInfoSection.jsx (~150 líneas)
    ├── TransferInfoSection.jsx (~150 líneas)
    ├── ShippingInfoSection.jsx (~150 líneas)
    └── BillingInfoSection.jsx (~150 líneas)
└── hooks/
    ├── useProfileForm.js
    ├── useRegionComuna.js
    └── useProfileImage.js
```

2. **Contenido de cada archivo**:

- **`CompanyInfoSection.jsx`**: Email, teléfono, RUT, país, función
- **`TransferInfoSection.jsx`**: Titular, tipo cuenta, banco, número cuenta, RUT transferencia, email confirmación  
- **`ShippingInfoSection.jsx`**: Región, comuna, dirección envío
- **`BillingInfoSection.jsx`**: Razón social, RUT facturación, giro, dirección facturación, botón actualizar

3. **Cambios en imports**:
```jsx
// Profile.jsx (nuevo)
import CompanyInfoSection from './sections/CompanyInfoSection';
import TransferInfoSection from './sections/TransferInfoSection';
import ShippingInfoSection from './sections/ShippingInfoSection';
import BillingInfoSection from './sections/BillingInfoSection';
import { useProfileForm } from './hooks/useProfileForm';
```

---

### 🧪 Validación de Cambios

#### **Criterios de equivalencia funcional:**

1. **Interfaz de usuario idéntica**:
   - El layout 2x2 grid debe mantenerse exacto
   - Todos los campos deben estar en la misma posición
   - Validaciones deben mostrar mismos mensajes

2. **Funcionalidad de guardado**:
   - `onUpdateProfile()` debe recibir exactamente los mismos datos
   - Detección de cambios (`hasChanges`) debe funcionar igual
   - Banner de éxito/error debe mostrarse igual

3. **Validaciones equivalentes**:
   - RUT: mismo regex `/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/`
   - Email: mismo regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Contraseña: mismos requisitos (8 char, mayús, minus, número)

4. **Estado de formulario**:
   - `formData` debe tener misma estructura
   - Mapeo BD ↔ FormData debe ser idéntico
   - `initialData` debe detectar cambios igual

#### **Tests existentes:**

❌ **No existen tests** para el módulo Profile.

**Recomendación**: Crear tests **después** de la refactorización para validar el nuevo código y evitar regresiones futuras.

**Tests sugeridos post-refactor**:
```javascript
// Ejemplos de tests a crear
describe('Profile Module', () => {
  it('should render all 4 sections correctly')
  it('should detect form changes accurately') 
  it('should validate RUT format correctly')
  it('should map BD data to form data correctly')
  it('should call onUpdateProfile with correct data')
})
```

---

### 🔧 Propuesta de Implementación

#### 📄 Archivo: `src/utils/validators.js` (NUEVO)

**Antes**: Funciones mezcladas en Profile.jsx
```jsx
// Líneas 225-235 en Profile.jsx
const validateRut = (rut) => {
  if (!rut) return true;
  const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
  return rutPattern.test(rut);
};

const validateEmail = (email) => {
  if (!email) return true;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};
```

**Después**: Utilidades centralizadas
```jsx
// src/utils/validators.js
export const validateRut = (rut) => {
  if (!rut) return true;
  const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
  return rutPattern.test(rut);
};

export const validateEmail = (email) => {
  if (!email) return true;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
  return Object.values(requirements).every(req => req);
};
```

#### 📄 Archivo: `src/hooks/useProfileForm.js` (NUEVO)

**Antes**: Estado complejo en Profile.jsx
```jsx
// Líneas 27-125 en Profile.jsx
const [formData, setFormData] = useState({
  // 20+ campos mezclados...
});
const [hasChanges, setHasChanges] = useState(false);
// Lógica de detección de cambios...
```

**Después**: Hook reutilizable
```jsx
// src/hooks/useProfileForm.js
import { useState, useEffect } from 'react';

export const useProfileForm = (userProfile) => {
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Mapeo BD → FormData centralizado
  useEffect(() => {
    if (userProfile) {
      const userData = mapUserProfileToFormData(userProfile);
      setFormData(userData);
      setInitialData(userData);
    }
  }, [userProfile]);

  // Detección de cambios
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    hasChanges,
    updateField,
    resetForm: () => setFormData(initialData)
  };
};
```

#### 📄 Archivo: `src/features/profile/sections/CompanyInfoSection.jsx` (NUEVO)

**Antes**: Sección mezclada en Profile.jsx (líneas 440-520)
```jsx
{/* Primera fila - Primera columna: Información Empresa */}
<Box sx={{ p: 3, height: 'fit-content' }}>
  <Typography variant="h6">Información Empresa</Typography>
  <TextField label="Correo Electrónico" value={formData.email} ... />
  <TextField label="Teléfono" value={formData.phone} ... />
  // ... 100+ líneas más
</Box>
```

**Después**: Componente especializado
```jsx
// src/features/profile/sections/CompanyInfoSection.jsx
import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import ProfileSwitch from '../ProfileSwitch';
import { validateRut } from '../../../utils/validators';

const CompanyInfoSection = ({ 
  formData, 
  onFieldChange, 
  onPasswordModalOpen 
}) => {
  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
        Información Empresa
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Correo Electrónico"
          value={formData.email}
          InputProps={{ readOnly: true }}
          fullWidth
          variant="outlined"
          size="small"
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Contraseña
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={onPasswordModalOpen}
          >
            Cambiar contraseña
          </Button>
        </Box>
        
        <TextField
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="56963109665"
        />
        
        <TextField
          label="RUT"
          value={formData.rut}
          onChange={(e) => onFieldChange('rut', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="77.122.155-5"
          error={!validateRut(formData.rut)}
          helperText={!validateRut(formData.rut) ? 'Formato de RUT inválido' : ''}
        />
        
        <TextField
          label="País"
          value={formData.country}
          onChange={(e) => onFieldChange('country', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Chile"
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Función
          </Typography>
          <ProfileSwitch
            type="role"
            value={formData.role}
            onChange={(e, newValue) => onFieldChange('role', newValue)}
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyInfoSection;
```

#### 📄 Archivo: `src/features/profile/Profile.jsx` (REFACTORIZADO)

**Antes**: 800 líneas monolíticas
```jsx
// Profile.jsx original con todo mezclado
const Profile = ({ userProfile, onUpdateProfile }) => {
  // 800 líneas de código...
  return (
    <Box>
      {/* 4 secciones inline + toda la lógica */}
    </Box>
  );
};
```

**Después**: Coordinador limpio (~200 líneas)
```jsx
// src/features/profile/Profile.jsx (refactorizado)
import React, { useState } from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { useBanner } from '../ui/banner/BannerContext';
import { useProfileForm } from './hooks/useProfileForm';
import { useProfileImage } from './hooks/useProfileImage';

import CompanyInfoSection from './sections/CompanyInfoSection';
import TransferInfoSection from './sections/TransferInfoSection';
import ShippingInfoSection from './sections/ShippingInfoSection';
import BillingInfoSection from './sections/BillingInfoSection';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileImageModal from '../ui/ProfileImageModal';

const Profile = ({ userProfile, onUpdateProfile }) => {
  const { showBanner } = useBanner();
  const { formData, hasChanges, updateField, resetForm } = useProfileForm(userProfile);
  const { 
    pendingImage, 
    handleImageChange, 
    handleImageClick,
    getDisplayImageUrl,
    clearPendingImage 
  } = useProfileImage(userProfile?.logo_url);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!hasChanges) return;
    
    setLoading(true);
    try {
      let dataToUpdate = { ...formData };
      if (pendingImage) {
        dataToUpdate.profileImage = pendingImage;
      }
      
      await onUpdateProfile(dataToUpdate);
      resetForm();
      clearPendingImage();
      
      showBanner({
        message: '✅ Perfil actualizado correctamente',
        severity: 'success',
        duration: 4000
      });
    } catch (error) {
      showBanner({
        message: '❌ Error al actualizar el perfil',
        severity: 'error',
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header con avatar e imagen */}
      <ProfileHeader 
        userProfile={userProfile}
        formData={formData}
        onImageClick={() => setIsImageModalOpen(true)}
        getDisplayImageUrl={getDisplayImageUrl}
        updateField={updateField}
      />

      {/* Grid Layout 2x2 */}
      <Paper sx={{ p: 0, bgcolor: '#fff', boxShadow: 2, borderRadius: 3, mb: 4 }}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, auto)',
          gap: 3,
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'repeat(4, auto)',
          }
        }}>
          <CompanyInfoSection 
            formData={formData}
            onFieldChange={updateField}
            onPasswordModalOpen={() => setIsPasswordModalOpen(true)}
          />
          
          <TransferInfoSection 
            formData={formData}
            onFieldChange={updateField}
          />
          
          <ShippingInfoSection 
            formData={formData}
            onFieldChange={updateField}
          />
          
          <BillingInfoSection 
            formData={formData}
            onFieldChange={updateField}
            hasChanges={hasChanges}
            loading={loading}
            onUpdate={handleUpdate}
          />
        </Box>
      </Paper>

      {/* Modales */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        showBanner={showBanner}
        onPasswordChanged={() => {
          setIsPasswordModalOpen(false);
          showBanner({
            message: '✅ Contraseña actualizada correctamente',
            severity: 'success',
            duration: 4000
          });
        }}
      />

      <ProfileImageModal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageChange={handleImageChange}
        currentImageUrl={userProfile?.logo_url}
        userInitials={getInitials(userProfile?.user_nm)}
      />
    </Box>
  );
};

export default Profile;
```

---

## 📋 Siguiente Paso: Implementación

La propuesta está **lista para implementar**. Se recomienda:

1. **Fase 1**: Crear utilidades y hooks (bajo riesgo)
2. **Fase 2**: Extraer secciones una por una 
3. **Fase 3**: Refactorizar Profile.jsx principal
4. **Fase 4**: Crear tests para el nuevo código

**Tiempo estimado**: 4-6 horas de desarrollo + 2 horas de testing.
