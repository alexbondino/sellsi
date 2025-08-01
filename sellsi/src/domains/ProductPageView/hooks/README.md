# ProductPageView Hooks

Esta carpeta contiene todos los hooks específicos para ProductPageView, siguiendo una arquitectura ordenada y modular.

## 📁 Arquitectura de Hooks

### 🎯 **Core Hooks**

#### `useOptimizedProductOwnership.js`
**Hook principal para verificación instantánea de propiedad de productos**

- ✅ **Cache global inteligente** con sistema de suscriptores
- ✅ **Verificación instantánea** (1-5ms vs 1000ms+) 
- ✅ **Una sola llamada a API** por sesión de usuario
- ✅ **Métricas de performance** integradas
- ✅ **Invalidación automática** en cambios de usuario

```jsx
// Uso básico
const { isProductOwnedByUser, isUserDataReady } = useOptimizedProductOwnership();
const verification = isProductOwnedByUser(product); // Instantáneo!
```

#### `useProductPageOwnership.js`
**Hook especializado para ProductPageView con lógica de renderizado**

- ✅ **Decisiones de renderizado** instantáneas
- ✅ **Compatibilidad total** con código existente
- ✅ **Flags específicos** para cada tipo de acción

```jsx
// Uso en ProductPageView
const { 
  showPurchaseActions, 
  showLoadingSpinner, 
  isOwnProduct 
} = useProductPageOwnership(product, {
  fromMyProducts,
  isFromSupplierMarketplace,
  isSupplier
});
```

### 🔄 **Hooks Bajo Demanda**

#### `useLazyProductOwnership.js`
**Hook para verificaciones bajo demanda (patrón shipping validation)**

- ✅ **Verificaciones solo cuando se necesitan** (hover, click, modal)
- ✅ **Procesamiento batch** para listas de productos  
- ✅ **Filtrado y estadísticas** de propiedad
- ✅ **Sigue el patrón** del useOptimizedShippingValidation

```jsx
// Uso para validaciones bajo demanda
const { 
  verifyProductOwnership,
  getOwnedProductsOnly,
  ownershipStats 
} = useLazyProductOwnership(products);

// Solo verificar cuando sea necesario
const handleProductHover = (product) => {
  const verification = verifyProductOwnership(product);
  // ...
};
```

#### `useProductPageData.js`
**Hook existente para datos de página** (mantener como está)

## 🎯 **Patrones de Uso**

### Para ProductPageView (Recomendado)
```jsx
import { useProductPageOwnership } from './hooks/useProductPageOwnership';

const ProductPageView = ({ product }) => {
  const { 
    showPurchaseActions, 
    showLoadingSpinner,
    isOwnProduct 
  } = useProductPageOwnership(product, { fromMyProducts });

  if (showLoadingSpinner) {
    return <CircularProgress />;
  }

  return (
    <div>
      {showPurchaseActions && <PurchaseActions />}
      {isOwnProduct && <OwnerActions />}
    </div>
  );
};
```

### Para Verificación Simple
```jsx
import { useOptimizedProductOwnership } from './hooks/useOptimizedProductOwnership';

const ProductCard = ({ product }) => {
  const { isProductOwnedByUser } = useOptimizedProductOwnership();
  const { isOwned } = isProductOwnedByUser(product); // Instantáneo

  return (
    <Card>
      {isOwned && <OwnerBadge />}
      {!isOwned && <BuyButton />}
    </Card>
  );
};
```

### Para Listas/Grids (Bajo Demanda)
```jsx
import { useLazyProductOwnership } from './hooks/useLazyProductOwnership';

const ProductGrid = ({ products }) => {
  const { 
    getOwnedProductsOnly,
    getNonOwnedProductsOnly,
    ownershipStats 
  } = useLazyProductOwnership(products);

  const ownedProducts = getOwnedProductsOnly(); // Solo cuando se necesite
  
  return (
    <div>
      <StatsDisplay stats={ownershipStats} />
      <ProductList products={ownedProducts} />
    </div>
  );
};
```

## 🚀 **Beneficios de la Arquitectura**

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Organización** | Hooks dispersos | Centralizados en ProductPageView |
| **Performance** | ~1000ms + API | ~1-5ms instantáneo |
| **Llamadas API** | Cada verificación | 1 por sesión |
| **Mantenibilidad** | Código duplicado | Hooks reutilizables |
| **Escalabilidad** | Difícil de extender | Patrón claro y extensible |

## 📦 **Dependencias**

- `../../../services/user/profileService` - Para getUserProfile
- `react` hooks (useState, useEffect, useCallback, useMemo)
- `localStorage` - Para persistencia de user_id

## 🔧 **Integración en Componentes Existentes**

1. **ProductHeader.jsx** ✅ Ya integrado
2. **ProductPageView.jsx** 🔄 Pendiente de migrar
3. **PurchaseActions.jsx** 🔄 Pendiente de migrar

## 🎯 **Próximos Pasos**

1. Migrar ProductPageView.jsx al nuevo sistema
2. Actualizar PurchaseActions para usar decisiones del hook
3. Considerar preload en login para aún mejor performance
4. Añadir tests unitarios para los hooks críticos
