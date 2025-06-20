# 🧠 Pipeline de Refactorización y Modularización Asistida por Múltiples IA

---

## 🎯 Objetivo General

Este pipeline utiliza un enfoque de múltiples IA para analizar, planificar y ejecutar refactorizaciones o modularizaciones de código. El objetivo es mejorar la calidad del código (legibilidad, mantenibilidad, reutilización) de manera segura, controlada y justificada, **sin alterar la funcionalidad existente**.

---

⚠️ **IMPORTANTE:**
Todas las respuestas generadas por IA deben escribirse **únicamente en el archivo `.md` que el orquestador humano indique en el prompt**.
Las respuestas de cada IA deben agregarse **de forma acumulativa, sin sobrescribir ni eliminar contenido previo**.

Cada IA debe iniciar su respuesta con un encabezado claro indicando su nombre, por ejemplo:
`### GPT-4.1 – Iteración 1`

---

## Fase 1: Diagnóstico en Paralelo (Visión de 360°)

🔧 **Objetivo de esta fase:** Tres IA (GPT-4.1, Claude Sonnet 4, Gemini Pro) analizan el mismo código de forma independiente y aislada para determinar si la refactorización o modularización es necesaria y beneficiosa.

---

### 🔍 Instrucciones para cada IA (Ejecutar en Paralelo)

Cada IA debe responder a las siguientes preguntas de forma aislada, **sin ver las respuestas de las otras**.

1. **Análisis de Estado Actual:**

   * **Funcionalidad:** Basado en el código y su contexto, ¿parece que el código funciona correctamente? ¿Qué indicios tienes?
   * **Problemas Clave:** ¿Identificas problemas claros de legibilidad, mantenibilidad, duplicación de código (DRY) o alta cohesión/bajo acoplamiento? Sé específico.
   * **Zonas Críticas:** ¿Hay partes del código que son particularmente riesgosas de modificar debido a dependencias complejas o lógica no evidente? Márcalas como "zonas críticas".

2. **Justificación para la Acción:**

   * **Beneficio Real:** ¿Existe un beneficio técnico claro y justificable para refactorizar o modularizar? (Ej: "Separar la función X en un hook reutilizable reducirá la duplicación en los componentes A y B").
   * **Necesidad de Modularización:** ¿Es necesario modularizar? **Sí/No.** Justifica tu respuesta.
   * **Necesidad de Refactorización:** ¿Es necesario refactorizar? **Sí/No.** Justifica tu respuesta.

3. **Veredicto Preliminar (Sin Implementar):**

   * **Recomendación:** Basado en tu análisis, ¿recomiendas proceder con la refactorización/modularización?
   * **Confianza:** ¿Cuál es tu nivel de confianza (Alto, Medio, Bajo) en que los cambios propuestos no romperán la funcionalidad?

### ✍️ Output Esperado de Cada IA

Cada IA debe generar un informe estructurado en Markdown.

---

## Fase 2: Síntesis y Plan de Acción Consolidado

🔧 **Objetivo de esta fase:** Unificar los tres diagnósticos independientes en una única decisión y un plan de acción detallado. Esta fase puede ser ejecutada por una IA líder o un humano.

---

### 🔍 Instrucciones para la Síntesis

1. **Revisión Comparativa:** Lee los tres informes de la Fase 1.

2. **Matriz de Consenso y Divergencia (Subfase nueva):**

   * Construye una tabla que indique para cada criterio (modularización, refactorización, zonas críticas, confianza): qué IAs coinciden y cuáles difieren.
   * Reglas sugeridas para decisión:

     * Si **al menos 2 de 3 IAs** coinciden en recomendar refactorización/modularización **y ninguna marca zonas críticas**, entonces → **GO**.
     * Si **hay zonas críticas marcadas por alguna IA**, se requiere una revisión humana adicional antes del GO.

3. **Decisión Final:**

   * Si la matriz y la revisión comparativa sugieren alta viabilidad, declara **GO**.
   * Justifica la decisión, especialmente si hay opiniones divergentes.

4. **Crear Plan de Acción (Solo si es "GO"):**

   * Define un plan de acción **único, detallado y paso a paso**.

5. **Distinguir Caminos:**

   * Si la decisión incluye **refactorización**, detalla el tipo de cambios internos a realizar (reestructura, mejoras DRY, etc.).
   * Si incluye **modularización**, especifica los módulos nuevos, sus responsabilidades y su conexión con el código actual.
   * Ambos caminos pueden ser seguidos en paralelo o por separado, según el diagnóstico.

6. **Garantía de Funcionalidad:** Establece cómo se verificará que la lógica no se ha roto (ej: "El componente refactorizado debe seguir recibiendo las mismas props y renderizando el mismo output para la misma entrada").

### ✍️ Output Esperado de la Síntesis

```markdown
## ✅ Decisión Final de Refactorización / Modularización

- **Decisión:** GO / NO-GO
- **Justificación:** (Resumen de los hallazgos de las IA y el razonamiento detrás de la decisión).
- **Matriz de Consenso:** (Tabla con criterios clave y respuestas de cada IA).
- **Consenso Identificado:** (Puntos en común de los análisis).
- **Divergencias Notables:** (Diferencias clave y cómo se resolvieron).

## 🛠️ Plan de Acción Definitivo

<!-- Solo si la decisión es "GO" -->

### Refactorización
1.  **Paso 1:** ...

### Modularización
1.  **Paso 1:** ...

### Validación
- **Criterio de Validación:** ...
```

---

## Fase 3: Implementación Controlada

🔧 **Objetivo de esta fase:** Ejecutar el plan de acción definitivo de manera precisa y segura.

---

### 🔍 Instrucciones para la IA Implementadora

* **Entrada:** Recibirás el código original y el **Plan de Acción Definitivo** de la Fase 2.
* **Tarea:** Tu única tarea es implementar el plan **exactamente como está descrito**. No introduzcas cambios o mejoras no solicitadas en el plan.
* **Output:** Proporciona el código modificado, estructurado claramente con un "antes" y "después" para cada archivo afectado.

### ✍️ Output Esperado de la Implementación

````markdown
## 🔧 Propuesta de Implementación

### Archivo: `[ruta/al/archivo_modificado.js]`

#### Antes
```[lenguaje]
// ... código original relevante ...
```

#### Después
```[lenguaje]
// ... código refactorizado ...
```

### Archivo: `[ruta/al/nuevo_archivo.js]` (si aplica)

#### Después
```[lenguaje]
// ... nuevo módulo o función ...
```

### ✅ Justificación de la Implementación

-   **Cumplimiento del Plan:** "Esta implementación sigue los pasos 1, 2 y 3 del plan de acción. La función X fue movida y el componente Y fue actualizado para importarla."
-   **Garantía de Funcionalidad:** "La lógica del componente no ha cambiado. Sigue utilizando la misma función, pero ahora importada desde un módulo separado, cumpliendo el criterio de validación."
````
