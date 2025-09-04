# 🔧 Fix: Parpadeo "Producto no encontrado" en ProductPageView

## 🎯 Problema Identificado

Al hacer click en una tarjeta del Marketplace (ProductCard), la ruta cambia a la ficha técnica y por una fracción de milisegundo, la UI muestra el mensaje "Producto no encontrado" antes de renderizar la ficha correcta.

## 🔍 Análisis de la Causa Raíz

### 1. **Race Condition en Estado Inicial**
- El hook `useTechnicalSpecs` se inicializa con `product: null` y `loading: true`
- La lógica de renderizado evaluaba `!loading && !product` prematuramente
- Esto causaba el flash del mensaje de error antes de completar la consulta async

### 2. **Parsing Incorrecto de UUID**
- La función `extractProductIdFromSlug` solo buscaba UUIDs al inicio del slug
- Las URLs generadas por `ProductCard` tienen formato `UUID-nombre-producto`
- Esto funcionaba por coincidencia, pero era frágil

### 3. **Gestión de Estados Insuficiente**
- No había distinción entre "cargando", "error" y "no encontrado"
- El estado `loading` se establecía como `false` antes de completar todas las consultas

## ✅ Soluciones Implementadas

### 1. **Mejora de `extractProductIdFromSlug`**
```javascript
// Archivo: src/shared/utils/product/productUrl.js
export const extractProductIdFromSlug = (slug) => {
  if (!slug) return null;
  
  // UUID v4 pattern - busca en cualquier parte del slug
  const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const match = slug.match(uuidPattern);
  if (match) {
    return match[0];
  }
  
  // Fallback para compatibilidad hacia atrás
  // ...
}
```

### 2. **Mejora del Hook `useTechnicalSpecs`**
```javascript
// Archivo: src/domains/ProductPageView/pages/hooks/useTechnicalSpecs.js

// ✅ Agregado estado de error
const [error, setError] = useState(null)

// ✅ Mejor manejo de estados en el useEffect
useEffect(() => {
  const fetchProduct = async () => {
    // Resetear estados al inicio
    if (isMounted) {
      setError(null)
      setProduct(null)
      setLoading(true)
    }

    // Validaciones tempranas con mensajes específicos
    if (!productSlug) {
      if (isMounted) {
        setError('No se proporcionó un slug de producto')
        setLoading(false)
      }
      return
    }

    const productId = extractProductIdFromSlug(productSlug)
    if (!productId) {
      if (isMounted) {
        setError('ID de producto inválido en la URL')
        setLoading(false)
      }
      return
    }

    // ... resto de la lógica mejorada
  }
}, [productSlug, navigate, originRoute, location.state])
```

### 3. **Mejora de la Lógica de Renderizado**
```jsx
// Archivo: src/domains/ProductPageView/pages/TechnicalSpecs.jsx

{loading ? (
  // 🆕 Skeleton de carga mientras se consulta
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
        Cargando producto...
      </Typography>
      {/* Spinner personalizado */}
    </Box>
  </Container>
) : error || !product ? (
  // 🆕 Solo mostrar error DESPUÉS de terminar de cargar
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" color="error" gutterBottom>
        {error || 'Producto no encontrado'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {/* Mensajes específicos basados en el tipo de error */}
        {error === 'ID de producto inválido en la URL' 
          ? 'La URL del producto no es válida.'
          : error === 'No se proporcionó un slug de producto'
          ? 'La URL del producto está incompleta.'
          : 'El producto que buscas no existe o ha sido removido.'}
      </Typography>
      {/* ... botón de vuelta */}
    </Paper>
  </Container>
) : (
  // ✅ Renderizar ProductPageView solo cuando product existe
  <ProductPageView {...props} />
)}
```

## 🚀 Beneficios de la Solución

1. **Eliminación del Parpadeo**: El mensaje "Producto no encontrado" solo aparece después de confirmar que el producto realmente no existe
2. **Mejor UX**: Skeleton de carga personalizado mientras se consulta el producto
3. **Parsing Robusto**: La función de extracción de UUID funciona con cualquier formato de slug
4. **Mensajes Específicos**: Diferentes mensajes de error según el tipo de problema
5. **Estado Consistente**: Mejor gestión de los estados loading/error/success

## 🧪 Testing

Para verificar que la solución funciona:

1. Navegar al marketplace
2. Hacer click en cualquier ProductCard
3. Observar que ya no aparece el flash de "Producto no encontrado"
4. Verificar que aparece un skeleton de carga suave
5. Confirmar que la ficha técnica se carga correctamente

## 📁 Archivos Modificados

- `src/shared/utils/product/productUrl.js` - Mejora de parsing de UUID
- `src/domains/ProductPageView/pages/hooks/useTechnicalSpecs.js` - Mejora de gestión de estados
- `src/domains/ProductPageView/pages/TechnicalSpecs.jsx` - Mejora de lógica de renderizado

## 🔮 Mejoras Futuras Sugeridas

1. **Prefetching**: Implementar prefetch de datos al hacer hover sobre ProductCard
2. **Cache**: Implementar cache de productos visitados para navegación instantánea
3. **Skeleton Avanzado**: Crear skeletons más elaborados que mimen la estructura final
4. **Lazy Loading**: Implementar lazy loading de imágenes en ProductPageView
