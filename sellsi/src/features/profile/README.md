# Profile

## 1. Resumen funcional del módulo
El módulo `profile` gestiona la visualización, edición y protección de los datos sensibles del perfil de usuario en Sellsi. Permite mostrar y ocultar información confidencial (como números de cuenta y RUT), aplicar máscaras de seguridad y controlar la edición de campos clave. Su objetivo es brindar una experiencia segura y flexible para la gestión de datos personales y bancarios.

- **Problema que resuelve:** Protege la exposición de datos sensibles y facilita la edición segura del perfil.
- **Arquitectura:** Componentes de perfil y hooks personalizados para control granular de visibilidad y edición.
- **Patrones:** State lifting, hooks reutilizables, separación de lógica y presentación.
- **Flujo de datos:** Inputs → Estado local/hooks → Validación/máscara → Renderizado seguro.

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------|-----------|---------------------------------------------|------------------------------------------|
| hooks/useSensitiveFields.js | Hook  | Manejo de visibilidad y máscara de campos   | Controlar visibilidad de datos sensibles |
| (utils/profileHelpers.js)   | Utilidad | Función de enmascarado de datos            | Lógica de máscara de datos               |
| ...otros componentes        | Componente | Visualización y edición de perfil         | Renderizado y edición de datos           |

## 3. Relaciones internas del módulo
```
PerfilUsuario (componente principal)
├── useSensitiveFields (hook)
│   └── maskSensitiveData (utilidad)
└── ...otros componentes de edición/visualización
```
- Comunicación por hooks y props.
- Renderizado condicional según visibilidad de campos.

## 4. Props de los componentes
### useSensitiveFields
No recibe props externas (es un hook personalizado).

#### API expuesta:
- `showSensitiveData`: Estado de visibilidad de cada campo.
- `toggleSensitiveData(field)`: Alterna visibilidad de un campo.
- `getSensitiveFieldValue(field, value, showLast)`: Devuelve valor enmascarado o completo.
- `isFieldVisible(field)`: Indica si el campo está visible.
- `hideAllFields()`: Oculta todos los campos.
- `showField(field)`: Muestra un campo específico.
- `hideField(field)`: Oculta un campo específico.

**Notas:**
- Los componentes de perfil consumen este hook para proteger datos sensibles.

## 5. Hooks personalizados
### `useSensitiveFields()`
**Propósito:** Controlar la visibilidad y enmascarado de campos sensibles (cuentas, RUT, etc.) en el perfil.

**Estados y efectos principales:**
- `showSensitiveData`: Estado booleano por campo.
- Efectos: No tiene efectos secundarios globales.

**API que expone:**
- Ver tabla anterior.

**Ejemplo de uso básico:**
```jsx
const {
  showSensitiveData,
  toggleSensitiveData,
  getSensitiveFieldValue,
  isFieldVisible,
  hideAllFields,
  showField,
  hideField
} = useSensitiveFields();

// En un componente:
<TextField
  value={getSensitiveFieldValue('accountNumber', user.accountNumber)}
  type={isFieldVisible('accountNumber') ? 'text' : 'password'}
/>
<Button onClick={() => toggleSensitiveData('accountNumber')}>Ver/Ocultar</Button>
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| ...otras internas   | -         | Utilidades de máscara y helpers  | Seguridad y UX           |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- Solo controla visibilidad local; no cifra datos en backend.
- Depende de la consistencia de nombres de campos sensibles.
- No implementa logs de acceso a datos sensibles.

### Deuda técnica relevante
- [MEDIA] Mejorar para soportar campos sensibles dinámicos.
- [MEDIA] Integrar logs de visualización para auditoría.

## 8. Puntos de extensión
- Permite agregar más campos sensibles fácilmente.
- Puede integrarse con sistemas de auditoría o doble autenticación.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import { useSensitiveFields } from './hooks/useSensitiveFields';

function ProfileFields({ user }) {
  const { getSensitiveFieldValue, toggleSensitiveData, isFieldVisible } = useSensitiveFields();

  return (
    <div>
      <input
        value={getSensitiveFieldValue('accountNumber', user.accountNumber)}
        type={isFieldVisible('accountNumber') ? 'text' : 'password'}
        readOnly
      />
      <button onClick={() => toggleSensitiveData('accountNumber')}>
        {isFieldVisible('accountNumber') ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  );
}
```

## 10. Rendimiento y optimización
- Estado local optimizado por campo.
- Sin efectos secundarios globales.
- Áreas de mejora: soporte para campos dinámicos y memoización avanzada.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
