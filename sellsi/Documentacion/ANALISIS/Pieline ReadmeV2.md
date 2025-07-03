Voy a darte una carpeta que contiene archivos `.js` y `.jsx` de un módulo. Analiza todos los archivos en esa carpeta y genera un archivo `README.md` ubicado en la misma carpeta.

Este README debe documentar de manera clara, completa y ordenada el funcionamiento de esa carpeta para que cualquier desarrollador pueda entenderla sin leer el código fuente.

Incluir:

## 1. Resumen funcional del módulo  
   - Descripción detallada del problema que resuelve
   - Arquitectura de alto nivel y patrones de diseño implementados
   - Justificación técnica de las decisiones de diseño
   - Diagrama conceptual del flujo de datos/información
   - Casos de uso principales que atiende

## 2. Listado de archivos expandido  
   | Archivo | Tipo | Descripción detallada | Responsabilidad única | Complejidad | Mantenedor |
   |---------|------|----------------------|---------------------|------------|-----------|
   | ejemplo.js | Componente | Descripción completa de la función del archivo | Su responsabilidad específica | Media/Alta/Baja | Opcional |
   | ... | ... | ... | ... | ... | ... |

## 3. Relaciones internas del módulo  
   - Diagrama de dependencias (puede ser ASCII o referencia a imagen)
   - Flujo de datos entre componentes
   - Secuencia de ejecución y lifecycle
   - Patrones de comunicación (eventos, props drilling, contexto)
   - Explicación de los ciclos de vida y su intersección

   ```
   Ejemplo de diagrama ASCII:
   
   ComponentePrincipal
   ├── SubComponenteA (usa HookX)
   │   └── ComponenteHijo
   └── SubComponenteB
       ├── UtilityHelper
       └── ComponenteComún
   ```

## 4. Props y API de los componentes  
   ### ComponenteEjemplo
   | Prop | Tipo | Requerido | Default | Descripción |
   |------|------|----------|---------|-------------|
   | `nombre` | `string` | Sí | - | Descripción detallada con ejemplo: `nombre="usuario123"`. Usado para identificar la instancia |
   | `opciones` | `Array<{id: number, valor: string}>` | No | `[]` | Lista de opciones configurables. Ejemplo: `[{id: 1, valor: 'opción'}]` |
   | `onEvent` | `function(data: Object) => void` | No | `() => {}` | Callback ejecutado cuando ocurre X evento. Retorna objeto con propiedades `{success, data}` |
   | ... | ... | ... | ... | ... |

   **Notas sobre compatibilidad de props:**
   - `propA` y `propB` son mutuamente excluyentes
   - Si se usa `propC`, entonces `propD` debe estar definida

## 5. Hooks personalizados en profundidad  
   ### `useEjemploHook(parametro1, parametro2)`
   
   **Propósito:**  
   Descripción detallada del problema que resuelve este hook y cuándo debe utilizarse.
   
   **Estados gestionados:**
   - `estado1`: Estructura y propósito de este estado
   - `estado2`: Estructura y propósito de este estado
   
   **Efectos:**
   1. Efecto para manejar X comportamiento (dependencias: `[dep1, dep2]`)
   2. Efecto para limpiar recursos (dependencias: `[dep3]`)
   
   **API expuesta:**
   - `funcion1(param)`: Descripción detallada de la función, parámetros y valor de retorno
   - `funcion2()`: Descripción detallada
   - `valor3`: Descripción del valor expuesto
   
   **Optimizaciones aplicadas:**
   - Uso de `useMemo` para cálculos costosos
   - Uso de `useCallback` para funciones pasadas a componentes hijos
   
   **Ejemplo de uso correcto:**
   ```jsx
   const { funcion1, funcion2, valor3 } = useEjemploHook('param1', 42);
   ```
   
   **Casos no recomendados:**
   - No usar dentro de un bucle o condición
   - No usar cuando X condición se cumple

## 6. Dependencias externas e internas  
   | Dependencia | Versión | Propósito | Alternativas consideradas | Impacto en rendimiento | Integración |
   |-------------|---------|-----------|--------------------------|----------------------|-------------|
   | `react-query` | ^4.0.0 | Gestión de estado servidor y caché | Redux + thunks, SWR | Reduce re-renders y peticiones redundantes | Se integra con context global |
   | `@internals/utils` | - | Utilidades comunes compartidas | Implementación propia | Mínimo, funciones optimizadas | Importación directa |
   | ... | ... | ... | ... | ... | ... |

## 7. Consideraciones técnicas y advertencias  
   ### Limitaciones técnicas:
   - Detalle de limitaciones con explicación técnica profunda
   
   ### Deuda técnica:
   - [ALTA] Descripción del problema y por qué debe abordarse prioritariamente
   - [MEDIA] Descripción de otra deuda técnica
   - [BAJA] Problema menor documentado
   
   ### Análisis de riesgos:
   - Riesgo identificado y estrategia de mitigación
   
   ### Comportamientos edge-case:
   - Documentación de comportamientos extremos o inusuales
   
   ### Problemas conocidos:
   - Problema 1: Descripción y workaround temporal
   - Problema 2: Descripción y workaround temporal

## 8. Puntos de extensión y arquitectura  
   ### Interfaces públicas:
   - Detalle de las APIs públicas disponibles
   
   ### Patrones de extensión:
   - Descripción de cómo extender funcionalidades específicas
   
   ### Componentes reutilizables:
   - Lista y descripción de componentes diseñados para ser reutilizados
   
   ### Arquitectura extensible:
   - Aspectos del diseño que facilitan la extensión
   - Límites de la personalización

## 9. Ejemplos de uso completos  
   ### Ejemplo básico:
   ```jsx
   import { ComponentePrincipal } from './ruta/al/componente';
   
   function MiComponente() {
     return (
       <ComponentePrincipal 
         propiedad1="valor"
         propiedad2={42}
         onEvento={(data) => console.log(data)}
       />
     );
   }
   ```
   
   ### Ejemplo avanzado:
   ```jsx
   import { ComponentePrincipal, useComponenteHook } from './ruta/al/componente';
   
   function EjemploAvanzado() {
     // Implementación detallada con hooks, estado, efectos, etc.
     const { datos, cargar, actualizar } = useComponenteHook();
     
     useEffect(() => {
       cargar();
     }, []);
     
     return (
       <div>
         {/* Ejemplo de implementación compleja */}
         <ComponentePrincipal 
           datos={datos}
           configuracionAvanzada={{
             opcion1: true,
             opcion2: 'personalizado',
             callbacks: {
               onActualizar: actualizar
             }
           }}
         />
       </div>
     );
   }
   ```

## 10. Rendimiento y optimización
   ### Métricas de rendimiento:
   - Tiempo de carga: X ms (promedio)
   - Tiempo de respuesta para operación Y: Z ms
   
   ### Estrategias de optimización:
   - Memoización de componentes con React.memo
   - Virtualización de listas largas
   - Code splitting aplicado
   - Lazy loading de componentes pesados
   
   ### Áreas de mejora:
   - Identificación de operaciones costosas
   - Componentes con excesivos re-renders
   
   ### Consideraciones de escalabilidad:
   - Cómo se comporta con grandes volúmenes de datos
   - Límites recomendados de uso

## 11. Testing y calidad
   ### Enfoque de pruebas:
   - Estrategia de testing (unitario, integración, e2e)
   
   ### Cobertura actual:
   - Porcentaje de cobertura: X%
   - Áreas críticas cubiertas vs pendientes
   
   ### Tests críticos:
   - Descripción de pruebas esenciales a mantener
   
   ### Herramientas de testing:
   - Jest, React Testing Library, Cypress, etc.
   
   ### Mocks y fixtures:
   - Datos de ejemplo necesarios para tests
   - Cómo mockear dependencias externas


## 12. Fecha de creación y actualización
   - Última actualización: `03/07/2025`