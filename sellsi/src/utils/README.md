# Utils (`src/utils`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

La carpeta **utils** centraliza utilidades y helpers reutilizables para validación, formateo, cálculo y manipulación de datos en Sellsi. Incluye funciones para validación de formularios, cantidades, helpers de perfil, cálculo de precios por tramos, obtención de imágenes, datos geográficos y herramientas de emergencia para el carrito. Estas utilidades permiten mantener el código DRY, seguro y fácil de mantener en features y servicios.

## Listado de archivos principales

| Archivo                  | Tipo      | Descripción breve                                                      |
|--------------------------|-----------|-----------------------------------------------------------------------|
| validators.js            | Utilidad  | Validación de RUT, email, contraseñas y confirmaciones.                |
| quantityValidation.js    | Utilidad  | Validación y sanitización de cantidades para carrito y stock.           |
| profileHelpers.js        | Helper    | Helpers para datos sensibles, iniciales y mapeo de perfil.              |
| priceCalculation.js      | Utilidad  | Cálculo de precios por tramos y totales según cantidad.                 |
| getProductImageUrl.js    | Utilidad  | Obtención segura de URLs de imágenes de productos desde Supabase.       |
| chileData.js             | Datos     | Regiones, ciudades y comunas de Chile para formularios y filtros.       |
| cartEmergencyTools.js    | Utilidad  | Herramientas de emergencia para limpiar y restaurar el carrito.         |

## Relaciones internas del módulo

- Los helpers y utilidades son independientes y pueden ser usados en cualquier feature, servicio o hook.
- `quantityValidation.js` y `validators.js` son usados por servicios y formularios para asegurar datos válidos.
- `profileHelpers.js` es clave en el módulo de perfil y onboarding.
- `cartEmergencyTools.js` puede ser ejecutado desde consola para soporte avanzado.

Árbol de relaciones simplificado:

```
validators.js
quantityValidation.js
profileHelpers.js
priceCalculation.js
getProductImageUrl.js
chileData.js
cartEmergencyTools.js
```

## API y funciones principales

### validators.js
- `validateRut(rut)`
- `validateEmail(email)`
- `validatePassword(password)`
- `validatePasswordMatch(password, confirmPassword)`

### quantityValidation.js
- `validateQuantity(quantity, min, max)`
- `isQuantityValid(quantity, min, max)`
- `sanitizeCartItems(items)`
- `isQuantityError(error)`

### profileHelpers.js
- `maskSensitiveData(value, showLast)`
- `getInitials(name)`
- `mapUserProfileToFormData(userProfile)`

### priceCalculation.js
- `calculatePriceForQuantity(quantity, tiers, basePrice)`
- `calculateTotalPrice(quantity, tiers, basePrice)`

### getProductImageUrl.js
- `getProductImageUrl(image, productData)`

### chileData.js
- `regiones`, `ciudadesPorRegion`, ...

### cartEmergencyTools.js
- `clearAllCartData()`

## Dependencias externas e internas

- **Externas:** Solo helpers de Supabase en `getProductImageUrl.js`.
- **Internas:** Independientes, consumidos por features, servicios y hooks.

## Consideraciones técnicas y advertencias

- Las utilidades de validación están pensadas para formularios y servicios críticos.
- `cartEmergencyTools.js` debe usarse solo en casos de soporte o debugging avanzado.
- Los helpers de perfil asumen estructura estándar de usuario y pueden requerir ajustes si la BD cambia.

## Puntos de extensión o reutilización

- Las utilidades pueden extenderse para nuevos tipos de validación, helpers de datos o cálculos avanzados.
- Pueden integrarse en features, servicios, hooks o scripts de soporte.

## Ejemplos de uso

### Validar un RUT chileno

```js
import { validateRut } from 'src/utils/validators';

if (!validateRut(rut)) {
  alert('RUT inválido');
}
```

### Calcular precio por cantidad y tramos

```js
import { calculatePriceForQuantity } from 'src/utils/priceCalculation';

const unitPrice = calculatePriceForQuantity(20, product.priceTiers, product.basePrice);
```

---

Este README documenta la estructura, relaciones y funcionamiento de las utilidades y helpers de Sellsi. Consulta los comentarios en el código para detalles adicionales y advertencias sobre validaciones y helpers críticos.
