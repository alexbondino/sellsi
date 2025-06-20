# 🧪 Pipeline Genérico de Refactorización y Modularización Controlada por IA

---

## 🧠 Etapa Única: Revisión Exhaustiva para Refactorizar o Modularizar (solo si es necesario)

🔧 **Objetivo de esta etapa:**

Refactoriza o modulariza el código **solo si es estrictamente necesario y beneficioso**, y **sin alterar el funcionamiento actual**. La prioridad es **mantener la funcionalidad exacta** y la **integridad lógica** del código original.

---

### 🔍 Instrucciones para la IA:

Debes seguir este **protocolo de análisis** antes de tocar el código:

#### 1. Análisis Previo
- 📌 ¿El código funciona actualmente? ¿Hay pruebas o indicios de ello?
- 🧠 ¿El código actual tiene problemas claros de legibilidad, mantenibilidad o reutilización?
- ⚠️ ¿Alguna parte es peligrosa de refactorizar por estar acoplada a otras? Identifícalo y márcalo como "zona crítica".
- 📈 ¿Existe un beneficio real, medible o justificado en refactorizar o modularizar?

#### 2. Criterios de Acción
- ✅ **Sí debes refactorizar o modularizar si:**
  - El cambio mejora la claridad sin alterar la lógica
  - El código tiene repeticiones claras o estructuras que lo hacen inmantenible
  - Puedes encapsular funciones sin perder contexto

- ❌ **No debes refactorizar o modularizar si:**
  - Hay riesgo de romper dependencias o flujos lógicos no evidentes
  - La mejora es solo estilística sin valor técnico
  - No puedes probar que el resultado se comporta igual que el original

#### 3. Si decides actuar, asegúrate de:
- 💡 Mostrar antes y después del cambio, en secciones separadas.
- 🧪 Justificar con argumentos técnicos cada decisión tomada (por qué modularizaste, por qué refactorizaste).
- 🔁 Asegurar que la **funcionalidad sea exactamente la misma** (usa pseudotests o explicaciones si no hay tests disponibles).
- 🛠 No eliminar comentarios ni estructuras sin dejar nota de por qué.
- 🔍 Incluir posibles riesgos o sugerencias de prueba posteriores.

---

### ✍️ Output Esperado

El resultado debe estar estructurado así:

```markdown
## ✅ Evaluación Inicial

- ¿Funciona el código? Sí/No
- Problemas encontrados:
  - ...
- ¿Es necesario modularizar? Sí/No
- ¿Es necesario refactorizar? Sí/No

## 🛠 Plan de Acción (si corresponde)

<!-- Solo si alguna respuesta es "Sí" -->

- Descripción de los pasos sugeridos
- Qué partes se van a separar o reescribir
- Cómo se garantizará que la lógica no se rompa
- Criterios de validación antes/después

## 🔧 Propuesta de Mejora

### Antes (Fragmento relevante)
```[lenguaje]
[...]
