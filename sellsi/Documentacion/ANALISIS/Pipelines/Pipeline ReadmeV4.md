# 🚀 Pipeline ReadmeV4 - Generación de Documentación Técnica Avanzada para Refactor

## 📖 Instrucciones para Copilot

Analiza todos los archivos `.js`, `.jsx`, `.ts`, `.tsx` de la carpeta proporcionada y genera un archivo `README.md` ubicado en la misma carpeta siguiendo EXACTAMENTE esta estructura:

---

## 📝 Estructura del README.md

### 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Contexto específico dentro del dominio de Sellsi
- **Responsabilidad principal:** Qué hace este módulo en 1-2 líneas
- **Posición en la arquitectura:** Cómo encaja en el sistema general (frontend, backend, utilidades, etc.)
- **Criticidad:** ALTA/MEDIA/BAJA - Impacto en el funcionamiento del sistema
- **Usuarios objetivo:** Tipos de usuarios que interactúan con este módulo

### 2. 📊 Análisis de complejidad
- **Líneas de código:** Aproximado total del módulo
- **Complejidad ciclomática:** ALTA/MEDIA/BAJA basada en cantidad de condicionales, bucles y ramificaciones
- **Acoplamiento:** ALTO/MEDIO/BAJO - Dependencias con otros módulos
- **Cohesión:** ALTA/MEDIA/BAJA - Qué tan relacionadas están las funcionalidades internas
- **Deuda técnica estimada:** CRÍTICA/ALTA/MEDIA/BAJA con justificación

### 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| archivo.js | Componente | ~150 | MEDIA | Gestiona autenticación de usuarios | react, supabase |
| ... | ... | ... | ... | ... | ... |

### 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:** (Observer, Factory, Strategy, etc.)
- **Estructura de carpetas:** Descripción de la organización interna
- **Flujo de datos principal:** Diagrama simplificado del flujo de información
- **Puntos de entrada:** Archivos principales que exponen la API del módulo
- **Puntos de salida:** Qué exporta el módulo y cómo se consume

```
Diagrama de flujo detallado:
Input → Procesamiento → Output
├── Validaciones
├── Transformaciones
└── Side effects
```

### 5. 🔗 Matriz de dependencias
#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| react-query | ^4.0.0 | Cache de datos | ALTO - Toda la lógica de estado | SWR, zustand |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /services/auth | Importa | Autenticación | ALTO |
| /utils/format | Importa | Formateo de datos | BAJO |

### 6. 🧩 API del módulo
#### Componentes exportados:
```jsx
// Ejemplo de uso completo
import { ComponentePrincipal, Hook } from './modulo';

<ComponentePrincipal 
  prop1="valor" 
  prop2={42}
  onEvent={(data) => console.log(data)}
/>
```

#### Props detalladas:
**ComponentePrincipal**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| nombre | string | ✅ | - | min 3 chars | Identificador único | "usuario123" |
| config | object | ❌ | {} | schema específico | Configuración del comportamiento | {theme: 'dark'} |

#### Hooks personalizados:
**useModuloHook(params)**
- **Propósito:** Descripción concisa del hook
- **Parámetros:** Lista detallada con tipos y validaciones
- **Retorno:** Objeto con propiedades y funciones expuestas
- **Estados internos:** Qué maneja internamente
- **Efectos:** Qué side effects produce
- **Casos de uso:** Cuándo y cómo usarlo
- **Limitaciones:** Qué NO puede hacer

```jsx
// Ejemplo de uso del hook
const { 
  datos, 
  loading, 
  error,
  refresh,
  create,
  update,
  delete: deleteItem
} = useModuloHook({
  filtros: { activo: true },
  ordenamiento: 'fecha_desc'
});
```

### 7. 🔍 Análisis de estado
- **Estado global usado:** Qué stores o contextos consume
- **Estado local:** Qué maneja internamente
- **Persistencia:** Qué se persiste y dónde (localStorage, sessionStorage, etc.)
- **Sincronización:** Cómo se mantiene consistente el estado
- **Mutaciones:** Qué operaciones modifican el estado

### 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:** Lista específica de reglas
- **Validaciones:** Qué se valida y cómo
- **Transformaciones de datos:** Qué conversiones se realizan
- **Casos especiales:** Situaciones particulares o excepciones
- **Integraciones:** Con qué sistemas externos se comunica

### 9. 🔄 Flujos de usuario
**Flujo principal:**
1. Usuario hace X → Sistema valida Y → Se ejecuta Z
2. Si error → Se muestra mensaje → Usuario puede reintentar
3. Si éxito → Se actualiza estado → Se notifica al usuario

**Flujos alternativos:**
- Flujo de error
- Flujo de cancelación
- Flujo de carga
- Flujo de reintento

### 10. 🧪 Puntos de testing
- **Casos de prueba críticos:** Qué debe probarse obligatoriamente
- **Mocks necesarios:** Qué dependencias hay que mockear
- **Datos de prueba:** Qué datos se necesitan para testing
- **Escenarios de error:** Qué errores hay que simular
- **Performance:** Qué métricas de rendimiento considerar

### 11. 🚨 Puntos críticos para refactor
- **Código legacy:** Partes que necesitan modernización urgente
- **Antipatrones:** Malas prácticas identificadas
- **Oportunidades de mejora:** Qué se puede optimizar
- **Riesgos:** Qué puede romperse al refactorizar
- **Orden de refactor:** Qué refactorizar primero y por qué

### 12. 🔧 Consideraciones técnicas
#### Limitaciones actuales:
- **Performance:** Bottlenecks identificados
- **Memoria:** Consumo y posibles leaks
- **Escalabilidad:** Límites actuales
- **Compatibilidad:** Restricciones de browser/versiones

#### Configuración requerida:
- **Variables de entorno:** Qué ENV vars necesita
- **Inicialización:** Qué setup se requiere
- **Permisos:** Qué accesos necesita

### 13. ️ Seguridad y compliance
- **Datos sensibles:** Qué información maneja
- **Validaciones de seguridad:** Qué controles implementa
- **Permisos:** Qué roles/permisos requiere
- **Auditoría:** Qué se registra para auditoría

### 14. 📚 Referencias y documentación
- **Documentación técnica:** Links a docs específicas
- **Decisiones de arquitectura:** Por qué se tomaron ciertas decisiones
- **Recursos externos:** Librerías, APIs, tutoriales relacionados
- **Historial de cambios:** Principales modificaciones

### 15. 🎨 Ejemplos de uso avanzados
```jsx
// Ejemplo 1: Uso básico
import { Componente } from './modulo';
// Código de ejemplo...

// Ejemplo 2: Uso avanzado con configuración
// Código de ejemplo...

// Ejemplo 3: Integración con otros módulos
// Código de ejemplo...

// Ejemplo 4: Manejo de errores
// Código de ejemplo...
```

### 16. 🔄 Guía de migración
- **Desde versión anterior:** Cómo migrar si aplica
- **Breaking changes:** Qué cambios rompen compatibilidad
- **Checklist de migración:** Pasos para migrar
- **Rollback:** Cómo deshacer cambios si hay problemas

### 17. 📋 Metadatos del documento
- **Creado:** DD/MM/YYYY
- **Última actualización:** DD/MM/YYYY
- **Versión del código:** Git hash o versión
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** DD/MM/YYYY

---

## 🎯 Objetivos específicos del README para refactor

1. **Comprensión rápida:** Cualquier desarrollador debe entender el módulo en 5-10 minutos
2. **Identificación de problemas:** Detectar fácilmente deuda técnica y antipatrones
3. **Planificación de refactor:** Tener suficiente información para planificar la reestructuración
4. **Reducción de riesgos:** Identificar puntos críticos que no se pueden romper
5. **Optimización:** Encontrar oportunidades de mejora en performance y estructura

---

## 🚀 Criterios de calidad

- **Completitud:** Cubre todos los aspectos del módulo
- **Precisión:** Información técnica exacta y verificable
- **Claridad:** Lenguaje técnico pero comprensible
- **Accionabilidad:** Información que se puede usar para tomar decisiones
- **Mantenibilidad:** Fácil de actualizar cuando cambie el código

---

## 🔧 Herramientas sugeridas

Para generar algunos de estos datos automáticamente:
- **Complejidad ciclomática:** ESLint con reglas específicas
- **Líneas de código:** `cloc` o herramientas similares
- **Dependencias:** Análisis de imports/exports
- **Cobertura:** Coverage reports si existen
- **Performance:** Profiling tools si disponibles

---

