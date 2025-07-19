# Módulo: profile

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Gestiona la visualización, edición y protección de datos sensibles del perfil de usuario, aplicando máscaras de seguridad y control granular de visibilidad.
- **Arquitectura de alto nivel:** Hook personalizado para control de campos sensibles con utilidades de enmascarado y componentes de perfil seguros.
- **Función y casos de uso principales:** Protección de datos bancarios, RUT y información confidencial, edición segura de perfiles y control de visibilidad por campo.
- **Flujo de datos/información simplificado:**
  ```
  User Action → Visibility Toggle → Mask/Unmask → Secure Display
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| hooks/useSensitiveFields.js | Hook | Control de visibilidad y enmascarado de campos sensibles | Gestión de seguridad de datos |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Profile Components
└── useSensitiveFields (custom hook)
    ├── showSensitiveData (state)
    ├── toggleSensitiveData (action)
    └── getSensitiveFieldValue (utility)
```

**Patrones de comunicación:**
- **Custom hooks**: Encapsulación de lógica de seguridad
- **State management**: Control granular por campo
- **Pure functions**: Utilidades de enmascarado sin efectos secundarios

## 4. Props de los componentes
Este módulo se basa principalmente en hooks personalizados, no en componentes con props específicos.

## 5. Hooks personalizados
### useSensitiveFields
- **Propósito:** Control granular de visibilidad y enmascarado de campos sensibles en perfiles de usuario
- **Inputs:** Ninguno (configuración interna)
- **Outputs:** 
  - `showSensitiveData`: Estado de visibilidad por campo
  - `toggleSensitiveData(field)`: Alternar visibilidad de campo específico
  - `getSensitiveFieldValue(field, value, showLast)`: Obtener valor enmascarado/completo
  - `isFieldVisible(field)`: Verificar visibilidad de campo
  - `hideAllFields()`: Ocultar todos los campos sensibles
  - `showField(field)`: Mostrar campo específico
  - `hideField(field)`: Ocultar campo específico
- **Efectos secundarios:** Manejo de estado local de visibilidad

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| react | ^18.0.0 | Hooks y estado para funcionalidad core | Alto - Funcionalidad base |
| Sin dependencias externas | - | Hook implementado con React nativo | Bajo - Alta portabilidad |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Client-side only**: Control de visibilidad local, no cifrado backend
- **Field consistency**: Dependiente de nombres de campos sensibles consistentes
- **No audit logs**: Sin implementación de logs de acceso a datos
- **Static configuration**: Campos sensibles definidos estáticamente

### Deuda técnica relevante:
- **[MEDIA]** Implementar soporte para campos sensibles dinámicos
- **[MEDIA]** Agregar sistema de logs de auditoría para visualización
- **[BAJA]** Mejorar configurabilidad de patrones de enmascarado

## 8. Puntos de extensión
- **Dynamic fields**: Configuración dinámica de campos sensibles
- **Audit integration**: Integración con sistemas de auditoría y logs
- **2FA integration**: Soporte para doble autenticación en campos críticos
- **Custom masking**: Patrones de enmascarado personalizables por tipo de dato

## 9. Ejemplos de uso
### Implementación básica:
```jsx
import { useSensitiveFields } from 'src/features/profile/hooks/useSensitiveFields';

function ProfileField({ user }) {
  const { 
    getSensitiveFieldValue, 
    toggleSensitiveData, 
    isFieldVisible 
  } = useSensitiveFields();

  return (
    <div>
      <TextField
        value={getSensitiveFieldValue('accountNumber', user.accountNumber)}
        type={isFieldVisible('accountNumber') ? 'text' : 'password'}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton onClick={() => toggleSensitiveData('accountNumber')}>
              {isFieldVisible('accountNumber') ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          )
        }}
      />
    </div>
  );
}
```

### Uso avanzado con múltiples campos:
```jsx
function CompleteProfile({ user }) {
  const { 
    getSensitiveFieldValue, 
    toggleSensitiveData, 
    isFieldVisible,
    hideAllFields 
  } = useSensitiveFields();

  const sensitiveFields = ['accountNumber', 'rut', 'phoneNumber'];

  return (
    <Card>
      <CardActions>
        <Button onClick={hideAllFields}>Ocultar Todo</Button>
      </CardActions>
      {sensitiveFields.map(field => (
        <ProfileField
          key={field}
          field={field}
          value={user[field]}
          visible={isFieldVisible(field)}
          onToggle={() => toggleSensitiveData(field)}
        />
      ))}
    </Card>
  );
}
```

## 10. Rendimiento y optimización
- **Local state**: Estado optimizado por campo individual
- **No side effects**: Hook sin efectos secundarios globales
- **Minimal re-renders**: Actualizaciones granulares por campo
- **Memory efficient**: Sin almacenamiento persistente de datos sensibles
- **Optimization areas**: Memoización de utilidades de enmascarado, soporte para campos dinámicos

## 11. Actualización
- **Última actualización:** 18/07/2025
