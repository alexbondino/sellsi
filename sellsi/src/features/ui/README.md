# UI

## 1. Resumen funcional del módulo
El módulo `ui` centraliza componentes de interfaz reutilizables y estilizados para Sellsi. Proporciona botones, selectores, gráficos, layouts y utilidades visuales que garantizan coherencia, accesibilidad y experiencia de usuario profesional en toda la plataforma.

- **Problema que resuelve:** Evita duplicación de lógica visual y promueve consistencia en la UI.
- **Arquitectura:** Componentes atómicos y moleculares, hooks de UI, estilos centralizados.
- **Patrones:** Reutilización, composición, separación de lógica visual y de negocio.
- **Flujo de datos:** Props → Renderizado visual → Eventos/callbacks → Estado externo.

## 2. Listado de archivos
| Archivo                | Tipo        | Descripción                                 | Responsabilidad principal                |
|------------------------|-------------|---------------------------------------------|------------------------------------------|
| PrimaryButton.jsx      | Componente  | Botón principal estilizado                  | Acción primaria en formularios y paneles  |
| CountrySelector.jsx    | Componente  | Selector de país/indicativo telefónico      | Selección de país para formularios        |
| graphs/BarChart.jsx    | Componente  | Gráfico de barras para métricas             | Visualización de datos                   |
| ...otros               | Componente/Hook | Utilidades visuales, layouts, iconos    | Extensión de UI y experiencia            |

## 3. Relaciones internas del módulo
```
UI (índice)
├── PrimaryButton
├── CountrySelector
├── graphs/BarChart
└── ...otros componentes visuales
```
- Comunicación por props y callbacks.
- Composición en vistas y formularios de otros módulos.

## 4. Props de los componentes principales
### PrimaryButton
| Prop      | Tipo     | Requerido | Descripción                         |
|-----------|----------|-----------|-------------------------------------|
| children  | node     | Sí        | Contenido del botón                 |
| onClick   | func     | No        | Callback al hacer click             |
| disabled  | bool     | No        | Estado deshabilitado                |
| sx        | object   | No        | Estilos adicionales (MUI)           |

### CountrySelector
| Prop      | Tipo     | Requerido | Descripción                         |
|-----------|----------|-----------|-------------------------------------|
| value     | string   | Sí        | Valor seleccionado                  |
| onChange  | func     | Sí        | Callback al cambiar selección       |
| countries | array    | Sí        | Lista de países/indicativos         |
| sx        | object   | No        | Estilos adicionales (MUI)           |

### BarChart
| Prop      | Tipo     | Requerido | Descripción                         |
|-----------|----------|-----------|-------------------------------------|
| data      | array    | Sí        | Datos a graficar                    |
| ...otros  | varios   | No        | Props de configuración de gráfico   |

## 5. Hooks personalizados
No se exportan hooks personalizados, pero pueden existir hooks internos para lógica visual.

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| @mui/icons-material | ^5.x      | Iconografía                      | UX                       |
| ...internas         | -         | Helpers y estilos                | Consistencia visual      |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- Los componentes asumen integración con el sistema de temas de MUI.
- Props `sx` permiten personalización, pero deben usarse con criterio para mantener coherencia.
- Algunos componentes pueden requerir dependencias adicionales (ej. gráficos).

### Deuda técnica relevante
- [MEDIA] Mejorar cobertura de tests visuales y de accesibilidad.
- [MEDIA] Modularizar iconos y helpers visuales.

## 8. Puntos de extensión
- Agregar nuevos componentes visuales reutilizables.
- Integrar temas personalizados y soporte para dark mode.
- Exponer hooks de UI para lógica visual avanzada.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import { PrimaryButton, CountrySelector } from './ui';

<PrimaryButton onClick={handleSave}>Guardar</PrimaryButton>
<CountrySelector value={country} onChange={setCountry} countries={['+56', '+54']} />
```

## 10. Rendimiento y optimización
- Componentes optimizados para re-render mínimo.
- Uso de memoización y estilos en línea para performance.
- Áreas de mejora: code splitting de iconos y gráficos.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
