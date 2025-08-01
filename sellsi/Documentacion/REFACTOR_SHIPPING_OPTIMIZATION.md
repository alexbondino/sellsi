# 🚀 PLAN DE REFACTOR SHIPPING VALIDATION

## 📊 Problema Identificado

**Situación actual**: Cada ProductCard ejecuta `useShippingValidation` individualmente, causando:
- 25 productos × 2 consultas = **50 requests por vista**
- Saturación de Supabase con requests redundantes
- Performance degradada en cambios de vista Productos/Proveedores

## 🎯 Solución Implementada

### 1. **Sistema de Caché Inteligente** 
- `useShippingCache.js`: Caché global con TTL de 5 minutos
- Evita consultas duplicadas del perfil del usuario
- Limpieza automática de caché expirado

### 2. **Hook Optimizado**
- `useOptimizedShippingValidation.js`: Validación bajo demanda con caché
- Elimina consultas automáticas innecesarias
- Validación en lotes para múltiples productos

### 3. **Context Global**
- `ShippingContext.jsx`: Estado centralizado de shipping
- Evita múltiples hooks individuales por ProductCard
- Gestión inteligente de validaciones en lote

### 4. **Validación Lazy**
- `useLazyShippingValidation.js`: Validación bajo demanda
- Se ejecuta solo en hover/click del usuario
- Debounce para evitar spam de validaciones

## 📋 Plan de Migración

### Fase 1: Implementación Core ✅
- [x] Crear sistema de caché (`useShippingCache.js`)
- [x] Implementar hook optimizado (`useOptimizedShippingValidation.js`)
- [x] Configurar context global (`ShippingContext.jsx`)
- [x] Crear hook lazy (`useLazyShippingValidation.js`)

### Fase 2: Migración de Componentes ✅
- [x] Refactorizar `ProductCardBuyerContext.jsx`
- [x] Optimizar `AddToCartModal.jsx`
- [x] Wrappear `ProductsSection.jsx` con ShippingProvider

### Fase 3: Testing y Ajustes 🔄
- [ ] Testing de performance en marketplace
- [ ] Verificar que no hay consultas duplicadas
- [ ] Ajustar TTL de caché según necesidades
- [ ] Implementar métricas de performance

### Fase 4: Rollout Completo 🚀
- [ ] Migrar todos los componentes que usan shipping
- [ ] Deprecar hooks antiguos
- [ ] Documentar nuevos patrones de uso
- [ ] Training del equipo

## 🔧 Uso de los Nuevos Hooks

### Para Marketplace (recomendado)
```jsx
// En ProductsSection - usar context
import { ShippingProvider } from '../../contexts/ShippingContext';

// Wrappear toda la sección
<ShippingProvider>
  <ProductsSection />
</ShippingProvider>
```

### Para ProductCard Individual
```jsx
// Usar hook lazy para validación bajo demanda
import { useLazyShippingValidation } from '../hooks/shipping/useLazyShippingValidation';

const { shippingValidation, validateOnDemand } = useLazyShippingValidation(product);

// Validar en hover o click
<ProductCard 
  onMouseEnter={() => validateOnDemand()}
  // ...props
/>
```

### Para Modal/Detalles
```jsx
// Usar context para validación inmediata
import { useShippingContext } from '../contexts/ShippingContext';

const { validateSingleProduct } = useShippingContext();

// Validar cuando se abre el modal
useEffect(() => {
  if (open && product) {
    validateSingleProduct(product);
  }
}, [open, product]);
```

## 📈 Beneficios Esperados

- **-90% consultas de shipping**: De 50 a ~5 consultas por vista
- **+80% performance**: Carga inicial más rápida
- **Mejor UX**: Sin delays en cambios de vista
- **Caché inteligente**: Datos persistentes entre navegación
- **Escalabilidad**: Fácil manejar 100+ productos

## ⚠️ Consideraciones

1. **TTL del Caché**: 5 minutos por defecto, ajustar según necesidades
2. **Memory Usage**: Cache global, limpiar automáticamente
3. **Edge Cases**: Manejar cambios de región del usuario
4. **Fallbacks**: Validación directa si falla el caché

## 🎮 Testing

### Casos a Verificar
1. Cambio entre vistas Productos/Proveedores sin consultas extra
2. Navegación de/hacia marketplace mantiene caché
3. Cambio de región limpia caché correctamente
4. Modal de AddToCart valida solo cuando se abre
5. ProductCards no validan automáticamente

### Métricas a Medir
- Número de requests a getUserProfile
- Tiempo de carga inicial del marketplace
- Tiempo de cambio entre vistas
- Uso de memoria del caché
- Cache hit/miss ratio

## 🚀 Siguiente Iteración

1. **Preload Inteligente**: Validar productos visibles en viewport
2. **Service Worker**: Caché persistente entre sesiones
3. **Background Sync**: Actualizar caché en background
4. **Analytics**: Tracking de performance de shipping validation
