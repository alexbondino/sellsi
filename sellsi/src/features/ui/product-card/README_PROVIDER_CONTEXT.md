# ProductCard Component - Provider Context

## Resumen de Cambios

Se ha agregado un nuevo contexto `provider` al componente `ProductCard.jsx`, manteniendo las mejores prácticas del código existente.

## Nuevos Archivos Creados

### `ProductCardProviderContext.jsx`
- Nuevo componente de contexto para el tipo `provider`
- Mantiene las mismas dimensiones y diseño que el contexto `buyer`
- Incluye funcionalidad específica para proveedores

## Modificaciones Realizadas

### `ProductCard.jsx`
1. **Importación del nuevo contexto**: Agregado `ProductCardProviderContext`
2. **Props actualizadas**: Agregado `onContactProvider` para funcionalidad específica de provider
3. **JSDoc actualizado**: Documentación actualizada para incluir el tipo `provider`
4. **Estilos**: Provider usa las mismas dimensiones que buyer (diferentes a supplier)
5. **Navegación**: Agregadas rutas específicas para provider (`/provider/marketplace/`)
6. **Elevación**: Provider tiene elevation como buyer (supplier no tiene)
7. **Renderizado condicional**: Agregado renderizado para `type === 'provider'`

## Uso del Nuevo Contexto Provider

```jsx
import ProductCard from './path/to/ProductCard';

// Ejemplo de uso para Provider
<ProductCard
  product={productData}
  type="provider"
  onAddToCart={handleAddToCart}
  onContactProvider={handleContactProvider}
/>
```

## Diferencias entre Contextos

| Característica | Buyer | Supplier | Provider |
|----------------|-------|----------|----------|
| **Dimensiones** | Estándar | Más ancho (lg/xl) | Estándar (igual que buyer) |
| **Elevation** | Sí (2) | No (0) | Sí (2) |
| **Funcionalidad principal** | Comprar productos | Gestionar productos | Contactar + Comprar |
| **Botones** | Agregar al carrito | Editar/Eliminar/Stats | Contactar + Agregar al carrito |
| **Información específica** | Precio/Stock | Ventas/Estado | Certificación/Proveedor |

## Características del Provider Context

### Funcionalidades Específicas
- **Contactar Proveedor**: Botón dedicado para comunicación directa
- **Información de Certificación**: Muestra nivel de certificación del proveedor
- **Badge de Proveedor**: Chip que identifica el nombre del proveedor
- **Rating/Calificación**: Puede mostrar calificación del proveedor

### Props Específicas
- `onContactProvider`: Callback para manejar contacto con proveedor
- `onAddToCart`: Reutiliza la funcionalidad de buyer para agregar al carrito

### Campos de Producto Esperados
```javascript
{
  // Campos comunes
  id, nombre, imagen, precio, stock, categoria,
  
  // Campos específicos de provider
  supplier_name: "Nombre del Proveedor",
  provider_info: {...},
  certification_level: "Gold/Silver/Bronze",
  rating: 4.5
}
```

## Buenas Prácticas Mantenidas

1. **Separación de Responsabilidades**: Cada contexto tiene su propio archivo
2. **Reutilización de Código**: Mantiene elementos comunes en ProductCard principal
3. **Consistencia de Props**: Sigue el patrón establecido de props opcionales
4. **Memoización**: Usa React.memo y useMemo para optimización
5. **Accesibilidad**: Mantiene atributos `data-no-card-click` para evitar navegación accidental
6. **Responsive Design**: Mantiene diseño responsive en todas las breakpoints

## Navegación y Rutas

El provider context incluye soporte para rutas específicas:
- `/provider/marketplace/` - Marketplace de proveedores
- `/provider/marketplace/product/{slug}` - Detalles de producto desde provider

## Migración y Compatibilidad

- **Backward Compatible**: Los contextos existentes (`buyer`, `supplier`) no se ven afectados
- **Sin Breaking Changes**: El componente mantiene todas las funcionalidades existentes
- **Fácil Adopción**: Solo requiere pasar `type="provider"` y opcionalmente `onContactProvider`
