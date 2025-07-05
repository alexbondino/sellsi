# 2025-07-02 – Refactor y Modularización de AddProduct.jsx

## 🩺 Diagnóstico del Estado Actual

### 1. Funcionamiento Actual
- El componente AddProduct.jsx permite agregar y editar productos para proveedores.
- Utiliza hooks personalizados (`useProductForm`, `useSupplierProducts`), componentes reutilizables (ImageUploader, FileUploader, SelectChip, PriceTiers), y lógica de validación y cálculo de precios.
- El flujo general es correcto: carga datos, valida, muestra errores, calcula totales y permite submit.
- No se observan errores de importación ni fallos de ejecución evidentes en el fragmento revisado.

### 2. Problemas Detectados
- El archivo es muy extenso (>1000 líneas), lo que dificulta su mantenibilidad y comprensión.
- Hay lógica de validación, cálculo, manejo de formularios y renderizado UI mezclados en el mismo archivo.
- Algunas funciones (ej: `validateForm`, `calculateEarnings`, `calculateMinimumIncome`, `calculateMaximumIncome`) podrían extraerse a hooks/utilidades.
- El manejo de errores y validaciones está duplicado entre `localErrors` y `errors` del hook.
- El componente tiene múltiples handlers y lógica de UI que podrían modularizarse.

### 3. Zonas Críticas
- Lógica de validación y submit (puede afectar la integridad de los datos).
- Cálculo de precios y tramos (impacta la experiencia y resultados para el usuario).
- Integración con hooks y servicios externos (supabase, hooks personalizados).

---

## 🧠 Justificación Técnica
- **¿Modularizar?** Sí. Permite separar lógica de validación, cálculos y UI en archivos independientes, facilitando el testing y la reutilización.
- **¿Refactorizar?** Sí. Mejora la legibilidad, reduce el riesgo de errores y facilita futuras extensiones.
- **Ganancia técnica:**
  - Mejor mantenibilidad y escalabilidad.
  - Posibilidad de testear lógica de validación/cálculo de forma aislada.
  - Reutilización de lógica en otros formularios/productos.

---

## ✅ Decisión Final
- **Refactorización:** Sí
- **Modularización:** Sí
- **Nivel de riesgo estimado:** Medio
- **Resumen:** Se decide modularizar y refactorizar para mejorar la mantenibilidad y testabilidad, con especial cuidado en la lógica de validación y cálculos.

---

## 🛠️ Plan de Acción Detallado

### 🔄 Refactorización
1. Extraer la función `validateForm` a un archivo utilitario o hook (`useProductValidation.js`).
2. Extraer la lógica de cálculo (`calculateEarnings`, `calculateMinimumIncome`, `calculateMaximumIncome`) a un archivo utilitario (`productCalculations.js`).
3. Simplificar el manejo de errores para evitar duplicidad entre `localErrors` y `errors`.
4. Dividir el componente en subcomponentes para secciones grandes del formulario (ej: Información Básica, Inventario, Precios, Imágenes, Especificaciones).

### 🧩 Modularización
1. Crear archivos:
   - `useProductValidation.js` (hook de validación)
   - `productCalculations.js` (funciones de cálculo)
   - Subcomponentes: `ProductBasicInfo.jsx`, `ProductInventory.jsx`, `ProductPricing.jsx`, `ProductImages.jsx`, `ProductSpecs.jsx`, etc.
2. Actualizar imports en AddProduct.jsx para usar los nuevos módulos.
3. Mantener la API de props clara y documentada entre subcomponentes.

---

## 🧪 Validación de Cambios
- **Criterios de equivalencia funcional:** El formulario debe permitir agregar/editar productos con la misma validación y resultados que antes. Los cálculos y errores deben coincidir.
- **Tests existentes:** Si existen tests de integración o unitarios, deben pasar sin cambios. Se recomienda agregar tests para los nuevos hooks/utilidades.

---

## 🔧 Propuesta de Implementación

#### 📄 Archivo: `src/features/supplier/my-products/AddProduct.jsx`

**Antes**
```jsx
// ...archivo monolítico con validación, cálculos y UI mezclados...
```

**Después**
```jsx
import { useProductValidation } from './hooks/useProductValidation';
import { calculateEarnings, calculateMinimumIncome, calculateMaximumIncome } from './utils/productCalculations';
// ...subcomponentes para cada sección del formulario...
```

> Ver detalles en los archivos correspondientes.
