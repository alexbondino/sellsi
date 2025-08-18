# Análisis Profundo: Reordenamiento Inconsistente de Price Tiers en `AddToCartModal`

## Resumen del Problema
Ocasionalmente los bloques (boxes) de tramos de precio dentro del modal `AddToCartModal` se muestran:
1. En orden descendente correcto (mayor precio / menor beneficio arriba -> o según la intención esperada).
2. O en orden ascendente incorrecto.
3. Incluso cuando inicialmente aparecen en el orden correcto, al hacer clic en "Agregar al Carrito" (lo que cierra el modal) y luego volver a abrirlo, el orden cambia.

El comportamiento intermitente indica que no es simplemente un `sort` estático sino efectos secundarios y/o mutaciones del array original y dependencias de hooks que provocan renderizados con diferente orden.

## Expectativa de Negocio Declarada
> "los pricetiers siempre tienen que ordenarse descendentemente"

Hay ambigüedad en qué *criterio* exacto define "descendente":
- Puede ser por `min_quantity` descendente (mayor mínimo primero) — típico para mostrar el mejor descuento (mayor volumen) arriba.
- Puede ser por `price` descendente (precio más alto primero) — menos común cuando se pretende incentivar volumen.

En el resto del código (`calculatePriceForQuantity`) se ordena DESCENDENTE por `min_quantity` para encontrar rápidamente el primer tramo aplicable (mayor min primero). Por consistencia, asumimos que el UI DEBE mostrar también DESC por `min_quantity` (lo que usualmente pondrá el precio más bajo arriba si los precios disminuyen con más cantidad). Sin embargo señalaste "van de mayor precio a menor precio" — eso contradice el patrón natural descuento-volumen. Documentamos ambas posibilidades y proponemos una estrategia clara abajo.

## Hallazgos Clave del Código
### 1. No se Realiza Ningún Ordenamiento Explícito en el Render de `PriceTiersDisplay`
```jsx
{priceTiers.map((tier, index) => ( ... ))}
```
`priceTiers` proviene de `productData.priceTiers`, que solo es un passthrough del objeto `product` / `enrichedProduct` sin normalización de orden en `useMemo`.

### 2. Múltiples Puntos del Sistema Ordenan (o NO) los Tiers De Formas Distintas
- `calculatePriceForQuantity` clona y ordena `tiers` DESC por `min_quantity` localmente (no afecta el array original). OK.
- Otros lugares (mínimos) ordenan ASC para encontrar el primer tramo (`const sortedTiers = [...priceTiers].sort((a,b)=> a.min_quantity - b.min_quantity)`). Ej: iniciar cantidad mínima, validaciones, etc.
- En `formatProductForCart` al crear el item para el carrito se hace:
  ```js
  const appliedTier = tiers.sort(...desc).find(...)
  ```
  PROBLEMA: se usa `tiers.sort` SIN clonar -> mutación in-place.
  Esto cambia el orden del array original de tramos que fue pasado desde `AddToCartModal`.

### 3. Mutación In-Place en `formatProductForCart`
Esta es la causa primaria probable de la inversión del orden tras "Agregar al Carrito".
- El modal pasa `cartItem.priceTiers || product.priceTiers || product.price_tiers` al formatear.
- `formatProductForCart` muta ese array con `tiers.sort(...)`.
- Al cerrar y reabrir el modal, `product` (o `enrichedProduct`) reutiliza la misma referencia de array ya mutada, pero en otro orden (DESC por min). Si la UI esperaba DESC por precio, aparece invertido. Si >n sources mezclan arrays ya ordenados asc-desc en distintos momentos, la variabilidad aparece.

### 4. Inconsistencia de Criterio de Orden
- Para UI no hay normalización.
- Para cálculo de mínimo se usa ASC (min primero).
- Para asignar precio se usa DESC.
- Para appliedTier se usa también DESC (mutando).
Esto provoca que dependiendo de qué función se ejecute primero (y si muta) veas un orden distinto.

### 5. Referencias y Re-renders
`productData` depende de `enrichedProduct`. `enrichedProduct` se setea inicialmente con `product` y luego (posiblemente) se reemplaza con uno enriquecido (regiones). Si el array `priceTiers` se mutó antes o después de este enriquecimiento, el orden visible cambia. No se hace `deep clone` al setear `enrichedProduct`.

### 6. Falta de Memo / Sort Estable para UI
Sin un `useMemo` que derive `displayPriceTiers` con un `sort` determinístico + copia, cualquier mutación previa afecta el render.

## Secuencia de Eventos Causando el Bug (Ejemplo)
1. Modal abre -> `priceTiers` viene (ej. en orden original del backend, digamos ASC por `min_quantity`).
2. UI muestra ese orden (parece "incorrecto" si esperabas DESC por precio).
3. Usuario hace clic "Agregar al Carrito" -> `formatProductForCart` muta el array a DESC por `min_quantity` (in-place).
4. Modal cierra. Usuario reabre.
5. Ahora `priceTiers` ya está en otro orden -> UI muestra nuevo orden (puede parecer "cambio espontáneo").
6. En otros casos, si otro proceso ordenó ASC nuevamente (p.ej. algún `.sort` sin clon en otra ruta), verás la alternancia.

## Riesgos Adicionales
- Lógica de resaltado de tramo activo asume iteración en orden actual; si el orden cambia se podría resaltar un tramo no previsto si existieran rangos mal definidos.
- Mutaciones silenciosas complican debugging futuro.

## Recomendaciones Técnicas
1. Inmutabilidad estricta: Reemplazar cualquier `tiers.sort(...` directo sobre arrays provenientes de props / estado con `([...tiers]).sort(...)`.
2. Normalización central: Crear una función `normalizePriceTiers(tiers, order = 'desc_min')` que retorne SIEMPRE una copia ordenada consistentemente y usarla en:
   - `productData` (para UI)
   - `formatProductForCart`
   - Cálculos (aunque ahí ya se hace copia; unificar). 
3. Definir explícitamente el criterio de negocio: 
   - Si se requiere "mayor precio a menor precio": ordenar por `price` DESC, con `min_quantity` como tie-breaker.
   - Si se requiere "mayor volumen primero" (lo que ya usa `calculatePriceForQuantity`): ordenar por `min_quantity` DESC.
   Documentar esta decisión.
4. Añadir memo `const displayPriceTiers = useMemo(() => normalizePriceTiers(productData.priceTiers), [productData.priceTiers])` y usarlo en `PriceTiersDisplay` y en cálculos de mínimo.
5. Evitar reuso de referencia de array original al formatear el producto.
6. Escribir test unitario (si se incorpora jest/vitest) que garantice que tras llamar a `formatProductForCart` el orden original no cambia.

## Cambios Concretos Sugeridos
Pseudo diff (no aplicado aún):
```diff
// priceCalculation.js
-export const formatProductForCart = (product, quantity, tiers = []) => {
+export const formatProductForCart = (product, quantity, tiers = []) => {
+  const safeTiers = Array.isArray(tiers) ? [...tiers] : []
   const basePrice = product.precio || product.price || 0
-  const appliedTier = tiers
-    .sort((a, b) => { ... })
-    .find(...)
+  const appliedTier = safeTiers
+    .slice()
+    .sort((a, b) => ((b.min_quantity||0) - (a.min_quantity||0)))
+    .find(t => quantity >= (t.min_quantity||0))
   ...
-  price_tiers: finalPriceTiers,
+  price_tiers: safeTiers,
```
En el modal:
```diff
- const { priceTiers } = productData;
+ const displayPriceTiers = useMemo(() => normalizePriceTiers(productData.priceTiers), [productData.priceTiers])
+ // Usar displayPriceTiers en lugar de productData.priceTiers
```

## Checklist de Focos de Error Detectados
| Área | Problema | Severidad | Acción |
|------|----------|-----------|--------|
| formatProductForCart | Mutación in-place de tiers | Alta | Clonar antes de ordenar |
| PriceTiersDisplay | No asegura orden consistente | Alta | Normalizar con useMemo |
| Criterio de negocio | Ambigüedad (precio vs min_quantity) | Media | Definir y documentar |
| Múltiples sorts heterogéneos | ASC vs DESC en distintos lugares | Media | Unificar helper |
| appliedTier cálculo | Depende de orden mutado | Media | Usar copia ordenada estable |
| Reutilización de referencia product.priceTiers | Propenso a efectos colaterales | Media | Deep clone al enrich si se transforman |

## Propuesta de Helper Central
```js
export function normalizePriceTiers(tiers = [], mode = 'desc_min') {
  const copy = [...tiers].filter(t => t && (t.min_quantity != null || t.min != null));
  if (mode === 'desc_min') {
    return copy.sort((a,b) => ((b.min_quantity ?? b.min ?? 0) - (a.min_quantity ?? a.min ?? 0)));
  }
  if (mode === 'desc_price') {
    return copy.sort((a,b) => ((b.price ?? b.precio ?? 0) - (a.price ?? a.precio ?? 0))
      || ((b.min_quantity ?? b.min ?? 0) - (a.min_quantity ?? a.min ?? 0))
    );
  }
  return copy; // fallback sin cambios
}
```

## Pasos Inmediatos Recomendados
1. Elegir criterio final (confirmar contigo: ¿desc por precio o desc por min_quantity?).
2. Implementar helper + refactor.
3. Eliminar sorts repetidos y sustituir por `normalizePriceTiers`.
4. Asegurar que toda lectura de tiers en UI use la versión normalizada.
5. Corregir mutación en `formatProductForCart`.
6. (Opcional) Añadir log temporal que verifique que `Object.is(originalArray, mutatedArray)` nunca cambie tras operaciones.

## Verificación Manual Post-Fix
- Abrir producto A con tiers -> Confirmar orden constante en cada apertura.
- Cambiar cantidad, agregar al carrito, reabrir -> Mismo orden.
- Añadir varios productos con distintos tiers -> Todos consistentes.
- Forzar actualización de tiers en backend -> UI vuelve a normalizar sin cambiar criterio.

## Conclusión
El comportamiento errático proviene de mutaciones in-place de arrays de tramos mezclado con ausencia de una normalización centralizada y sorts inconsistentes (ASC vs DESC). Corrigiendo la mutación y estableciendo un único punto de ordenamiento determinístico el problema se estabiliza.

## Próximos Pasos (si lo apruebas te preparo el patch)
- Indica el criterio definitivo de orden.
- Procedo a crear el helper y refactor en los archivos afectados.

---
Fin del análisis.

---

## Re-Validación Adicional (2da Pasada de Análisis)

Se revisa nuevamente el diagnóstico previo buscando omisiones o errores.

### 1. Confirmación de la Causa Raíz Principal
La única mutación in-place identificada que altera el orden del array original de tiers sigue siendo:
```js
// priceCalculation.js
tiers.sort((a,b)=> bMin - aMin)
```
Dentro de `formatProductForCart`. Esto modifica la referencia que proviene de `product.priceTiers` (o `product.price_tiers`) porque el array se pasa por referencia. Confirmado: NO hay otras llamadas a `.sort(` sobre el mismo array sin clonación que afecten la UI.

### 2. Aclaración del Criterio de Orden Correcto (Negocio)
El requerimiento textual: "van de mayor precio a menor precio". Por lo tanto el criterio funcional deseado para renderizar las boxes es:
- ORDEN PRIMARIO: `price` DESC (precio unitario más alto primero)
- ORDEN SECUNDARIO: (tie-break) `min_quantity` ASC para que, si dos precios son iguales, aparezca primero el tramo que aplica antes.

Nota: Si los precios son estrictamente decrecientes con la cantidad (estructura típica de descuentos progresivos), entonces ordenar por `min_quantity` ASC da el mismo resultado visual (precio descendente). El bug aparece cuando el array es mutado a `min_quantity` DESC, invirtiendo indirectamente los precios (visual ascendente). Para eliminar ambigüedad implementaremos el comparator explícito por `price` DESC + `min_quantity` ASC.

### 3. Nueva Observación: Dependencia del Orden en el Cálculo de isActive
En `PriceTiersDisplay` la lógica de activación para el último tramo sin `max_quantity`:
```js
if (maxQty == null) {
  isActive = quantity >= minQty;
  for (let i = index + 1; i < priceTiers.length; i++) {
    const laterMinQty = priceTiers[i].min_quantity || 1;
    if (quantity >= laterMinQty) { isActive = false; break; }
  }
}
```
Esta lógica asume IMPLÍCITAMENTE que los tramos posteriores tienen `min_quantity` MAYOR (orden ascendente). Si el array se invierte (DESC), para el primer elemento (mayor `min_quantity`), el bucle ve tramos posteriores con `min_quantity` más BAJO, por lo que `quantity >= laterMinQty` será casi siempre verdadero y desactiva incorrectamente `isActive`. Resultado: el highlight (borde y color) puede quedar mal cuando el orden está invertido. Esto agrava el bug: no solo cambia el orden visual sino también el estado resaltado.

### 4. Potencial Impacto en `activeTier`
`activeTier` recorre el array y retorna el primer tier cuyo rango contiene la cantidad. Si el orden se invierte (DESC) sigue funcionando para rangos disjuntos, pero:
- Si hay rangos superpuestos accidentalmente (dato malo), el orden altera cuál se elige.
- Mejor garantizar orden consistente antes de computar.

### 5. Enriquecimiento y Persistencia de Referencias
`enrichedProduct` copia superficialmente (`{ ...product }`) conservando la misma referencia del array `priceTiers` / `price_tiers`. Esto permite que la mutación in-place tenga efecto cascada. Solución: al enriquecer, clonar también `priceTiers`: `priceTiers: product.priceTiers ? [...product.priceTiers] : []` (sin reordenar) y después normalizar en un memo separado para UI.

### 6. Validación de Otros Posibles Puntos de Mutación
Se escanearon patrones `.sort(` relevantes en:
- `AddToCartModal.jsx` → siempre usando copia (`[...priceTiers].sort(...)`) excepto en `formatProductForCart` (confirmado).
- Hooks de tiers (`useProductPriceTiers`) → resultados ordenados ASC desde DB (`.order('min_quantity', { ascending: true })`). Sin mutación posterior global.
- Stores del carrito (`cartStore.local.js`, `cartStore.calculations.js`) → no mutan arrays originales de tiers.
Sin hallazgos adicionales de mutación peligrosa.

### 7. Riesgo de Dependencia Implícita en Otros Componentes
`ProductHeader` también hace `tiers.map(...)` sin normalización. Si un producto ya fue pasado por `formatProductForCart`, el array podría llegar invertido al header en futuros renders (dependiendo de reuse del objeto en memoria). Esto explica casos donde incluso fuera del modal se percibe orden inconsistente.

### 8. Ajuste a la Recomendación de Normalización
Se actualiza la propuesta del helper:
```js
export function normalizePriceTiers(tiers = [], mode = 'price_desc') {
  const copy = [...tiers].filter(t => t && (t.min_quantity != null || t.min != null));
  const getMin = t => t.min_quantity ?? t.min ?? 0;
  const getPrice = t => t.price ?? t.precio ?? 0;
  if (mode === 'price_desc') {
    return copy.sort((a,b) => {
      const diff = getPrice(b) - getPrice(a); // Precio DESC
      if (diff !== 0) return diff;
      return getMin(a) - getMin(b); // Tie-break: menor min primero
    });
  }
  if (mode === 'min_asc') {
    return copy.sort((a,b) => getMin(a) - getMin(b));
  }
  if (mode === 'min_desc') {
    return copy.sort((a,b) => getMin(b) - getMin(a));
  }
  return copy;
}
```
- UI usará `price_desc`.
- Cálculos que requieren lógica basada en rango (como highlight) deben asumir orden ascendente; para consistencia se reescribirá highlight para que NO dependa de la posición sino de comparación directa con `quantity` y los límites.

### 9. Refactor del Highlight (Propuesto)
Reemplazar fragmento dependiente del índice:
```js
const isActive = quantity >= minQty && (maxQty == null || quantity <= maxQty);
```
Para tramos sin `maxQty` se mantiene condición `quantity >= minQty` sin chequear “tramos posteriores” (se hace irrelevante si el orden ya no se usa para lógica). Esto elimina la dependencia del orden.

### 10. Detección de Datos Anómalos
Agregar verificación (solo en dev):
```js
if (process.env.NODE_ENV === 'development') {
  const anomalies = displayPriceTiers.filter((t,i,arr) => i>0 && (t.price ?? 0) > (arr[i-1].price ?? 0));
  if (anomalies.length) console.warn('[PriceTiers] Inconsistencia de descuento', anomalies);
}
```
Permite identificar tramos donde el precio sube al aumentar la cantidad (podría violar expectativas de negocio).

### 11. Ajustes Concretos Actualizados
Resumen preciso de cambios a implementar (cuando se ejecute refactor):
1. Añadir `normalizePriceTiers` en util central (`priceCalculation.js` o nuevo `pricingUtils.js`).
2. Modificar `formatProductForCart` para clonar y NO mutar.
3. En `AddToCartModal`:
   - Añadir `const displayPriceTiers = useMemo(() => normalizePriceTiers(productData.priceTiers, 'price_desc'), [productData.priceTiers])`.
   - Usar `displayPriceTiers` en lugar de `priceTiers`.
   - Simplificar highlight como comparación directa rango.
4. En `ProductHeader` y cualquier otra vista de tiers, aplicar la misma normalización.
5. Clonar arrays de tiers al enriquecer producto.
6. (Opcional) Añadir test unitario de inmutabilidad de tiers tras `formatProductForCart`.

### 12. Validación de la Primera Versión del Análisis
- Lo esencial (mutación in-place) fue correcto.
- Se omitió en la primera versión: dependencia del orden en lógica de highlight y alineación exacta de criterio de negocio (precio DESC). Corregido ahora.
- Se refina la recomendación para que el highlight sea orden-independiente.

### 13. Posibles Efectos Colaterales al Cambiar Orden por Precio DESC
- Si existieran tramos no monotónicos (precio igual o mayor para mayor cantidad), UI seguirá mostrando orden por precio DESC, lo cual podría desordenar la progresión lógica de cantidades. Se recomienda auditoría de datos tras despliegue (script simple que valide monotonicidad). 

### 14. Plan de Verificación Post-Refactor (Extendido)
| Caso | Acción | Resultado Esperado |
|------|--------|--------------------|
| Apertura inicial | Abrir modal | Orden estable (precio DESC) |
| Agregar al carrito | Click "Agregar" y reabrir | Orden idéntico, sin inversión |
| Cambiar cantidad | Ajustar selector | Highlight correcto y único |
| Producto sin tiers | Render | Caja simple de precio, sin errores |
| Tiers con mismo precio | Render | Se ordenan por menor min_quantity primero |
| Datos anómalos (precio sube) | Dev console | Warning visible |

---

Fin re-validación.