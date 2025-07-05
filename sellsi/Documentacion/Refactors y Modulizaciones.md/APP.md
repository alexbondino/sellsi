# 2025-06-30 Análisis y Aplicación del Pipeline de Refactorización/Modularización sobre App.jsx

## 🩺 Diagnóstico del Estado Actual

### 1. Funcionamiento Actual
- El archivo `App.jsx` es el entrypoint principal de la app, orquesta rutas, roles, overlays de loading, y sincronización de sesión.
- Utiliza React Router, Suspense, contextos de banner, hooks personalizados y lógica de roles (buyer/supplier).
- El código funciona correctamente: la navegación, protección de rutas y overlays de carga están bien implementados.
- Los imports y convenciones son consistentes, y el lazy loading está bien aplicado.

### 2. Problemas Detectados
- **Tamaño y responsabilidad:** `App.jsx` contiene demasiada lógica: rutas, sincronización de sesión, loading global, lógica de roles, inicialización de carrito, etc.
- **Dificultad de testeo:** La lógica de sesión, perfil y roles está acoplada al componente principal, dificultando pruebas unitarias.
- **Repetición de lógica:** Hay hooks y efectos que podrían estar en hooks personalizados reutilizables (ej: sincronización de roles, onboarding, loading global).
- **Legibilidad:** El archivo supera las 700 líneas, lo que dificulta su mantenimiento y comprensión.
- **Acoplamiento:** Cambios en la lógica de sesión o roles pueden afectar toda la app.

### 3. Zonas Críticas
- **Sincronización de sesión y perfil:** Cambios aquí pueden romper la navegación y la protección de rutas.
- **Estados globales de loading y onboarding:** Si se modifican sin cuidado, pueden dejar la app en estados inconsistentes.
- **Prefetch y listeners:** Mal manejo puede causar fugas de memoria o loops de render.

---

## 🧠 Justificación Técnica
- **¿Modularizar?** Sí. Separar la lógica de sesión/perfil, loading global y roles en hooks y componentes dedicados mejora la cohesión y la reutilización.
- **¿Refactorizar?** Sí. Permite mayor testabilidad, legibilidad y menor riesgo de errores al modificar partes específicas.
- **Ganancia técnica:**
  - Reutilización de lógica de sesión y roles en otros componentes.
  - Separación de responsabilidades (Single Responsibility Principle).
  - Facilita pruebas unitarias y de integración.
  - Reduce el tamaño del entrypoint y mejora la mantenibilidad.

---

## ✅ Decisión Final
- **Refactorización:** Sí  
- **Modularización:** Sí  
- **Nivel de riesgo estimado:** Medio  
- **Resumen:** Se decide modularizar y refactorizar para separar la lógica de sesión/perfil, loading global y roles en hooks/componentes dedicados. Esto reduce el acoplamiento y mejora la mantenibilidad, aunque requiere pruebas cuidadosas por el impacto en la navegación y protección de rutas.

---

## 🛠️ Plan de Acción Detallado

### 🔄 Refactorización
1. Extraer la lógica de sesión/perfil a un hook personalizado (`useSessionProfile`).
2. Extraer la lógica de loading global a un componente/hook (`useGlobalLoading`).
3. Extraer la lógica de roles y onboarding a un hook (`useAppRole`).
4. Reducir el tamaño de `AppContent` y dejarlo solo como orquestador de layout y rutas.

### 🧩 Modularización
1. Crear archivos nuevos:
   - `src/hooks/useSessionProfile.js`: Maneja sesión, perfil, onboarding y refresh.
   - `src/hooks/useAppRole.js`: Sincroniza el rol actual según perfil y ruta.
   - `src/hooks/useGlobalLoading.js`: Centraliza el estado de loading global.
2. Mover la inicialización de carrito a un efecto dentro de `useSessionProfile`.
3. Los imports de `App.jsx` se simplifican, y los estados/efectos se reemplazan por los hooks nuevos.

---

## 🧪 Validación de Cambios
- Probar navegación entre rutas públicas y protegidas (buyer/supplier).
- Verificar que el loading global y onboarding se muestran correctamente.
- Confirmar que el cambio de rol y la sincronización de perfil funcionan tras login/logout y actualización de perfil.
- Revisar que no haya loops de render ni fugas de listeners.
- Ejecutar tests unitarios sobre los nuevos hooks.

---

**Este análisis y plan siguen el pipeline de refactor/modularización solicitado.**