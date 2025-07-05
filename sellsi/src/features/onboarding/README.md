# Onboarding

## 1. Resumen funcional del módulo
El módulo `onboarding` gestiona el flujo de registro y configuración inicial de cuentas para nuevos usuarios en Sellsi. Permite seleccionar el tipo de cuenta (proveedor o comprador), ingresar datos de perfil (nombre, país, teléfono) y subir un logo opcional. Implementa validaciones, feedback visual y persistencia de datos en Supabase. Su objetivo es garantizar que cada usuario complete los datos mínimos requeridos para operar en la plataforma.

- **Problema que resuelve:** Facilita el alta guiada y validada de nuevos usuarios, asegurando la integridad de los datos y la experiencia de usuario.
- **Arquitectura:** Componente principal `Onboarding` con helpers internos (ej. `LogoUploader`). Uso intensivo de hooks de React y Material UI.
- **Patrones:** State lifting, validación progresiva, feedback inmediato, separación de lógica y presentación.
- **Flujo de datos:** Inputs → Estado local → Validación → Supabase (persistencia) → Feedback UI.

## 2. Listado de archivos
| Archivo           | Tipo        | Descripción                                      | Responsabilidad principal                  |
|-------------------|-------------|--------------------------------------------------|--------------------------------------------|
| Onboarding.jsx    | Componente  | Componente principal del flujo de onboarding      | Orquestar UI, validaciones y persistencia  |
| (ui/PrimaryButton)| Componente  | Botón estilizado reutilizable                    | Botón de acción principal                  |
| (ui/CountrySelector)| Componente| Selector de país/indicativo telefónico           | Selección de país para teléfono            |
| (services/supabase)| Servicio   | Cliente Supabase para persistencia y storage      | Comunicación con backend                   |

## 3. Relaciones internas del módulo
```
Onboarding
├── LogoUploader (interno)
├── PrimaryButton (ui)
├── CountrySelector (ui)
└── supabase (servicio)
```
- Comunicación por props y callbacks.
- Renderizado condicional según estado y validaciones.

## 4. Props de los componentes
### Onboarding
No recibe props externas (es punto de entrada de la ruta onboarding).

### LogoUploader
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| logoPreview  | string   | No        | URL de previsualización del logo            |
| onLogoSelect | func     | Sí        | Callback para manejar selección de archivo   |
| size         | string   | No        | Tamaño del uploader ('large' por defecto)   |
| logoError    | string   | No        | Mensaje de error para validación de logo    |

**Notas:**
- El componente principal no expone props públicas.
- LogoUploader es helper interno, no exportado.

## 5. Hooks personalizados
No se utilizan hooks personalizados exportados. Se emplean hooks estándar de React (`useState`, `useEffect`, `useCallback`).

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| @mui/icons-material | ^5.x      | Iconografía                      | UX                       |
| supabase-js         | ^2.x      | Persistencia y storage           | Backend/Storage          |
| react-hot-toast     | ^2.x      | Feedback de notificaciones       | UX                       |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- El logo es opcional, pero si se sube debe ser JPG, PNG o WEBP y pesar menos de 300 KB.
- El email del usuario debe estar disponible en la sesión Supabase para guardar el perfil.
- El componente depende de la estructura de la tabla `users` en Supabase.
- No hay control de navegación avanzada (ej. pasos previos/siguientes).

### Deuda técnica relevante
- [MEDIA] Mejorar modularidad para permitir onboarding multi-paso.
- [MEDIA] Internacionalización de textos.

## 8. Puntos de extensión
- El componente puede extenderse para agregar pasos adicionales (ej. preferencias, invitaciones).
- `LogoUploader` puede extraerse como componente reutilizable.
- Integración con validaciones externas o servicios de verificación.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import Onboarding from './Onboarding';

function App() {
  return <Onboarding />;
}
```

### Ejemplo avanzado (con helpers internos)
```jsx
// El componente no expone hooks ni props avanzadas, se usa directamente.
```

## 10. Rendimiento y optimización
- Uso de `useCallback` para evitar renders innecesarios.
- Previsualización de imágenes con `URL.createObjectURL` y limpieza en `useEffect`.
- Validaciones locales para evitar llamadas innecesarias a Supabase.
- Áreas de mejora: code splitting, modularización de helpers.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
