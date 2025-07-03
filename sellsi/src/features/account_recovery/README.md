# Account Recovery Module

## 1. Resumen funcional del módulo
Este módulo gestiona el proceso de recuperación de cuentas de usuario mediante correo electrónico y código de verificación. Permite a los usuarios solicitar un código, ingresarlo y restablecer su contraseña de forma segura y guiada.

- **Problema que resuelve:** Recuperación de acceso para usuarios que olvidaron su contraseña.
- **Arquitectura:** Basada en componentes React y hooks personalizados, con separación de pasos en wizard.
- **Función principal:** Guiar al usuario a través de email → código → nueva contraseña → éxito.
- **Flujo de datos:**
  1. Usuario ingresa email.
  2. Recibe e ingresa código de verificación.
  3. Ingresa nueva contraseña.
  4. Visualiza confirmación de éxito.

## 2. Listado de archivos
| Archivo                   | Tipo        | Descripción                                 | Responsabilidad                         |
|---------------------------|-------------|---------------------------------------------|-----------------------------------------|
| Recover.jsx               | Componente  | Orquestador del flujo de recuperación       | Controla pasos, estados y lógica global |
| VerificationCodeInput.jsx | Componente  | Input para código de verificación           | Maneja ingreso y navegación de dígitos  |
| Timer.jsx                 | Componente  | Temporizador visual para el código          | Muestra tiempo restante o expiración    |

## 3. Relaciones internas del módulo
```
Recover
├── Step1Email
├── Step2Code
│   ├── VerificationCodeInput
│   └── Timer
├── Step3Reset
└── Step4Success
```
- Comunicación por props y callbacks.
- El componente principal renderiza subcomponentes según el paso.

## 4. Props de los componentes
### VerificationCodeInput
| Prop      | Tipo     | Requerido | Descripción                                 |
|-----------|----------|-----------|---------------------------------------------|
| codigo    | array    | Sí        | Array de dígitos del código                 |
| setCodigo | función  | Sí        | Setter para actualizar el código            |
| length    | número   | No        | Largo del código (default: 5)               |
| size      | string   | No        | Tamaño visual ('medium', 'large')           |

### Timer
| Prop   | Tipo     | Requerido | Descripción                                 |
|--------|----------|-----------|---------------------------------------------|
| timer  | número   | Sí        | Segundos restantes para el código           |
| size   | string   | No        | Tamaño visual ('medium', 'large')           |

### Recover
| Prop    | Tipo     | Requerido | Descripción                                 |
|---------|----------|-----------|---------------------------------------------|
| onClose | función  | Sí        | Callback para cerrar el modal               |

**Notas:**
- Los subcomponentes Step1Email, Step2Code, Step3Reset, Step4Success se comunican por props y estados elevados.

## 5. Hooks personalizados
- **useRecuperarForm()**
  - Propósito: Gestiona todos los estados y handlers del flujo de recuperación.
  - Estados: paso, correo, error, mensaje, código, timer, nuevaContrasena, repiteContrasena, visibilidad de contraseñas, etc.
  - Efectos: Reseteo de estados, navegación de pasos, temporizador.
  - API expuesta: setters y handlers para cada paso, resetAllStates.

  **Ejemplo de uso:**
  ```jsx
  const {
    paso, correo, codigo, timer,
    setPaso, setCorreo, setCodigo,
    handleBuscar, handleVerificarCodigo, handleCambiarContrasena
  } = useRecuperarForm();
  ```

## 6. Dependencias principales
| Dependencia   | Versión | Propósito                  | Impacto                |
|--------------|---------|----------------------------|------------------------|
| @mui/material| >=5     | UI components              | Interfaz moderna       |
| react-router-dom | >=6  | Navegación y rutas         | Control de navegación  |

## 7. Consideraciones técnicas
- El código de verificación es numérico y navega automáticamente entre inputs.
- El temporizador previene reenvíos rápidos y muestra expiración.
- El flujo está desacoplado en pasos para facilitar mantenimiento.
- **Limitaciones:**
  - No incluye lógica de backend, solo frontend.
  - El temporizador depende de la persistencia del estado en memoria.

## 8. Puntos de extensión
- Los componentes pueden reutilizarse en otros flujos de autenticación.
- El hook `useRecuperarForm` puede extenderse para otros métodos de recuperación.
- Se pueden agregar validaciones adicionales o integración con otros servicios.

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import Recover from './account_recovery/Recover';

function App() {
  return <Recover onClose={() => { /* cerrar modal */ }} />;
}
```

### Ejemplo avanzado:
```jsx
import Recover from './account_recovery/Recover';
import { useRef } from 'react';

function MiComponente() {
  const ref = useRef();
  return (
    <Recover ref={ref} onClose={() => { /* cerrar modal */ }} />
  );
}
```

## 10. Rendimiento y optimización
- Inputs optimizados para navegación rápida.
- Temporizador desacoplado para evitar renders innecesarios.
- Componentes desacoplados y reutilizables.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
