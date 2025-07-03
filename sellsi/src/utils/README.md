# Utils

## 1. Resumen funcional del módulo
El módulo `utils` centraliza utilidades y helpers reutilizables para la plataforma Sellsi. Incluye funciones para validaciones, manipulación de datos, herramientas de emergencia, helpers de perfil y lógica de negocio transversal.

- **Problema que resuelve:** Evita duplicación de lógica y facilita la reutilización de funciones comunes en toda la app.
- **Arquitectura:** Utilidades independientes, agrupadas por propósito (carrito, perfil, validaciones, helpers de datos).
- **Patrones:** Single responsibility, helpers puros, separación de lógica de UI.
- **Flujo de datos:** Funciones puras → Entrada de datos → Salida transformada o acción.

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------|-----------|---------------------------------------------|------------------------------------------|
| cartEmergencyTools.js  | Utilidad  | Herramientas de emergencia para carrito     | Diagnóstico y reparación de carritos     |
| chileData.js           | Utilidad  | Datos y helpers de regiones de Chile        | Listados y helpers geográficos           |
| getProductImageUrl.js  | Utilidad  | Construcción de URLs de imágenes de producto| Generar rutas de imágenes                |
| priceCalculation.js    | Utilidad  | Cálculo de precios y descuentos            | Lógica de precios y promociones          |
| profileDiagnostic.js   | Utilidad  | Diagnóstico y helpers de perfil             | Validaciones y análisis de perfil         |
| profileHelpers.js      | Utilidad  | Helpers para manipulación de datos de perfil| Lógica de datos personales y máscara     |
| quantityValidation.js  | Utilidad  | Validación de cantidades y stock            | Validar cantidades y límites             |
| validators.js          | Utilidad  | Validaciones generales (email, rut, etc.)   | Validar datos de entrada                 |
| README.md              | Doc       | Documentación de las utilidades             | Explicar uso y API de cada helper        |

## 3. Relaciones internas del módulo
```
cartEmergencyTools.js
├── clearAllCartData
├── validateCurrentCart
└── fixCorruptedQuantities
profileHelpers.js
├── maskSensitiveData
└── helpers de datos personales
...otros helpers independientes
```
- Utilidades independientes, pueden ser usadas en cualquier feature.
- No dependen entre sí salvo helpers de perfil.

## 4. API y props de las utilidades principales
### cartEmergencyTools.js
- `clearAllCartData()`: Limpia localStorage/sessionStorage y recarga la página.
- `validateCurrentCart()`: Diagnostica items corruptos en el carrito.
- `fixCorruptedQuantities()`: Repara cantidades inválidas en el carrito.
- `help()`: Muestra ayuda en consola.

### profileHelpers.js
- `maskSensitiveData(value, showLast)`: Enmascara datos sensibles.
- ...otros helpers de perfil.

### priceCalculation.js
- Funciones para calcular precios, descuentos y totales.

### validators.js
- Validaciones de email, rut, etc.

**Notas:**
- Las funciones pueden ser usadas directamente o expuestas globalmente para debugging.

## 5. Hooks personalizados
No se exportan hooks, solo funciones puras y helpers.

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| -                   | -         | No tiene dependencias externas   | -                        |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- Las herramientas de emergencia deben usarse solo bajo supervisión técnica.
- Algunas funciones asumen estructura específica de datos (ej. carrito).
- No implementan logs persistentes ni reportes automáticos.

### Deuda técnica relevante
- [MEDIA] Modularizar helpers para testing y cobertura avanzada.
- [MEDIA] Mejorar documentación de edge cases y advertencias.

## 8. Puntos de extensión
- Agregar helpers para nuevas entidades o lógica transversal.
- Integrar utilidades con sistemas de logging o monitoreo.

## 9. Ejemplos de uso
### Ejemplo básico
```js
import { clearAllCartData, validateCurrentCart } from './cartEmergencyTools';

clearAllCartData();
validateCurrentCart();
```

## 10. Rendimiento y optimización
- Funciones puras y sin dependencias para máxima eficiencia.
- Áreas de mejora: modularización y cobertura de edge cases.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
