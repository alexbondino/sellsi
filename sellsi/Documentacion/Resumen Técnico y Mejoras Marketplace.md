# Índice

1. Descripción General
2. Estructura de Carpetas
3. Flujo de Datos y Lógica
4. Componentes y Funciones Clave
5. Representaciones Visuales
6. Integraciones con APIs
7. Notas Técnicas Finales

---

## 1. Descripción General

El módulo `ProductPageView` gestiona la visualización y compra de productos en el marketplace, integrando lógica de sesión, tramos de precios, carrito y mejoras de backend sugeridas para robustez y escalabilidad. Se prioriza la lógica de negocio y la integridad de datos, manteniendo la UI clara pero sin sobreenfasis en detalles visuales.

---

## 2. Estructura de Carpetas

```
src/features/marketplace/ProductPageView/
  ProductPageView.jsx
  ProductHeader.jsx
  PurchaseActions.jsx
  components/
    ProductImageGallery.jsx
    ProductPageSkeletons.jsx
    LazyImage.jsx
  hooks/
    useTechnicalSpecs.js
    useProductPriceTiers.js
  utils/
    priceCalculation.js
  README.md
  IMPLEMENTATION_SUMMARY.md
  PRICE_TIERS_IMPLEMENTATION.md
Documentacion/
  supplier_product_backend_improvements.md
```

---

## 3. Flujo de Datos y Lógica

- **Sesión:** Se verifica la sesión del usuario (supplier/seller) usando localStorage y Supabase. Sin sesión, se bloquean acciones y se solicita login.
- **Carrito:** Al agregar productos, se calcula el precio según tramos (`price tiers`) y se formatea el producto antes de enviarlo al store del carrito.
- **Tramos de Precios:** El precio unitario depende de la cantidad seleccionada, usando la tabla `product_price_tiers` en la base de datos.
- **Integridad de Categorías:** Se recomienda migrar a una tabla de categorías para evitar errores y permitir dinamismo futuro.
- **Documentos de Producto:** Se sugiere agregar soporte para PDFs/manuales asociados a productos, usando Supabase Storage y una tabla relacional.
- **Imágenes:** Se gestiona una imagen principal por producto y se recomienda limpiar imágenes huérfanas al eliminar productos.

---

## 4. Componentes y Funciones Clave

### ProductPageView.jsx

- Componente principal. Renderiza la vista de producto, maneja lógica de sesión y muestra el `MarketplaceTopBar` solo si el usuario está logueado.

### PurchaseActions.jsx

- Botones de acción (agregar al carrito). Deshabilita acciones si no hay sesión. Integra lógica de tramos de precios y muestra notificaciones.

### useProductPriceTiers.js

- Hook para obtener y calcular el tramo de precio aplicable según la cantidad seleccionada.

### priceCalculation.js

- Funciones utilitarias:
  - `calculatePriceForQuantity`: Devuelve el precio unitario correcto según los tramos.
  - `formatProductForCart`: Prepara el objeto producto para el carrito, incluyendo cantidad, precio unitario, total y tramo aplicado.

#### Ejemplo de objeto enviado al carrito:

```js
{
  id: product.id,
  name: product.nombre,
  price: tierPrice,
  quantity: selectedQuantity,
  tierPrice: appliedTierPrice,
  appliedTier: tierInfo,
  totalPrice: tierPrice * quantity,
  // ...otros campos
}
```

---

## 5. Representaciones Visuales

**Tabla de Tramos de Precios (ejemplo):**

| Cantidad  | Precio Unitario |
| --------- | --------------- |
| 10 - 49   | $44.550         |
| 50 - 149  | $40.000         |
| 150 - 299 | $30.000         |
| 300+      | $15.999         |

**Diagrama Simplificado de Flujo:**

```
[Usuario] --(selecciona cantidad)--> [ProductPageView]
   |                                    |
   v                                    v
[useProductPriceTiers] <--- consulta --- [Supabase]
   |                                    |
   v                                    v
[PurchaseActions] --(agregar)--> [CartStore]
```

---

## 6. Integraciones con APIs

- **Supabase:**
  - Autenticación de sesión.
  - Consulta de tramos de precios (`product_price_tiers`).
  - Almacenamiento de documentos PDF/manuales (opcional).
- **Frontend/Backend:**
  - Se recomienda exponer endpoints para categorías y documentos si se implementan las mejoras sugeridas.

---

## 7. Notas Técnicas Finales

- El sistema es robusto y listo para producción, pero se recomienda:
  - Implementar la tabla de categorías si se requiere dinamismo.
  - Agregar soporte para documentos PDF solo si el negocio lo necesita.
  - Mantener una imagen principal por producto y limpiar imágenes huérfanas.
  - Mejorar el manejo de errores y agregar tests unitarios en hooks y lógica de precios.
- Las mejoras de UI (skeleton loaders, animaciones) ya están implementadas, pero no son el foco principal de esta documentación.

---

Este documento resume y explica claramente los últimos cambios y recomendaciones técnicas para el módulo de productos del marketplace. Está pensado para que cualquier desarrollador con conocimientos intermedios pueda entender la lógica, el flujo y las mejores prácticas implementadas.
