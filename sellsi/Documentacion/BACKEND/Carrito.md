# Problema de Duplicados en cart_items (cart_id, product_id)

## Descripción
Actualmente, la tabla `cart_items` permite que existan múltiples filas con el mismo par `(cart_id, product_id)`, ya que la clave primaria es `cart_items_id` (UUID) y no existe una restricción UNIQUE sobre `(cart_id, product_id)`.

## Consecuencias
- Se pueden crear varias filas para el mismo producto en un mismo carrito.
- Al actualizar la cantidad de un producto, pueden ocurrir errores como "multiple (or no) rows returned".
- La lógica de negocio se complica: sumar cantidades, eliminar productos, mostrar el carrito, etc.

## Evidencia del Problema
En `cartService.js`, la función `updateItemQuantity()` usa `.single()` (línea 283):
```javascript
const { data, error } = await supabase
  .from('cart_items')
  .update({ quantity: safeQuantity })
  .eq('cart_id', cartId)
  .eq('product_id', productId)
  .select()
  .single(); // ← FALLA si hay duplicados
```

Este error se registra en `logs.md`:
```
Error: No se pudo actualizar la cantidad: JSON object requested, multiple (or no) rows returned
```

## Solución Recomendada
Agregar una restricción UNIQUE sobre `(cart_id, product_id)` en la tabla `cart_items`.

```sql
ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_cart_id_product_id_unique UNIQUE (cart_id, product_id);
```

Esto asegura que solo pueda existir una fila por producto en cada carrito. Si se intenta agregar un producto que ya existe, se debe actualizar la cantidad en vez de insertar una nueva fila.

## Pasos para Implementar
1. **Primero:** Limpiar duplicados existentes:
```sql
-- Identificar duplicados
SELECT cart_id, product_id, COUNT(*) as duplicates 
FROM cart_items 
GROUP BY cart_id, product_id 
HAVING COUNT(*) > 1;

-- Eliminar duplicados manteniendo el más reciente
DELETE FROM cart_items 
WHERE cart_items_id NOT IN (
  SELECT DISTINCT ON (cart_id, product_id) cart_items_id
  FROM cart_items 
  ORDER BY cart_id, product_id, updated_at DESC
);
```

2. **Segundo:** Agregar la restricción UNIQUE:
```sql
ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_cart_id_product_id_unique UNIQUE (cart_id, product_id);
```

## Alternativas si no puedes modificar el schema
- Cambiar `.single()` por `.maybeSingle()` en `updateItemQuantity()` (parche temporal)
- Antes de insertar, buscar si ya existe ese producto en el carrito y actualizar la cantidad si es así.
- Limpiar duplicados existentes con un script o migración manual.

## Beneficios
- Integridad de datos.
- Lógica más simple y robusta en frontend/backend.
- Menos errores y mejor experiencia de usuario.
- Eliminación del error "multiple rows returned" en actualizaciones.
