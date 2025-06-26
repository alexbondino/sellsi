⚠️ IMPORTANTE:
**Todas tus respuestas deben escribirse exclusivamente en el archivo `.md` que yo te indicaré en el prompt/chat.**  
Nunca sobrescribas ni elimines contenido anterior si ya hay información en el archivo. Siempre agrega de forma acumulativa.  
Comienza cada ejecución con un título con la fecha y hora (si aplica) o encabezado lógico.

---

## 🔍 Estructura esperada del archivo `.md` generado

### 🩺 Diagnóstico del Estado Actual

Analiza todos los archivos del módulo e incluye:

1. **Funcionamiento Actual**
   - ¿El código parece funcionar correctamente según imports, estructura, convenciones?
   - ¿Qué indicios sugieren que está o no funcionando bien?

2. **Problemas Detectados**
   - Problemas de legibilidad, duplicación (DRY), cohesión/acoplamiento, nombres ambiguos, etc.
   - Cita ejemplos o líneas concretas.

3. **Zonas Críticas**
   - Partes riesgosas de modificar por lógica sensible, efectos secundarios, dependencias ocultas.

---

### 🧠 Justificación Técnica

- **¿Modularizar?** (Sí/No) Justifica con casos concretos.
- **¿Refactorizar?** (Sí/No) Justifica con beneficios claros.
- **¿Qué ganancia técnica se obtiene?** (Ej: reutilización, separación de responsabilidades, testabilidad, etc.)

---

### ✅ Decisión Final

- **Refactorización:** Sí / No  
- **Modularización:** Sí / No  
- **Nivel de riesgo estimado:** Bajo / Medio / Alto  
- **Resumen de por qué se decide actuar o no actuar.**

---

### 🛠️ Plan de Acción Detallado

#### 🔄 Refactorización
1. ¿Qué función, componente o hook se debe mejorar?
2. ¿Qué se debe renombrar, dividir, reestructurar?

#### 🧩 Modularización
1. ¿Qué lógica o componentes deben separarse?
2. ¿Nuevos archivos sugeridos? ¿Qué deben contener?
3. ¿Qué cambia en imports y estructura?

---

### 🧪 Validación de Cambios

Define cómo verificar que la funcionalidad no se rompe:

- **Criterios de equivalencia funcional:**  
  Ej: “El componente X debe producir el mismo output dado el mismo input”.

- **Tests existentes:**  
  Si hay tests, ¿qué partes del código están cubiertas?

---

### 🔧 Propuesta de Implementación

Para cada archivo afectado, incluye bloques de antes y después del código relevante.

#### 📄 Archivo: `ruta/al/archivo_modificado.js`

**Antes**
```js
// ... código original ...