# 📦 Componentes Compartidos (Shared Components)

Esta carpeta contiene componentes reutilizables que se utilizan en múltiples features del sistema.

## 🎯 Componentes Disponibles

### QuantitySelector

- **Ubicación**: `/src/components/shared/QuantitySelector.jsx`
- **Propósito**: Selector universal de cantidad con múltiples configuraciones
- **Uso**: Import desde `'../../../components/shared'`

#### Características:

- ✅ Orientación horizontal y vertical
- ✅ Múltiples tamaños (small, medium, large)
- ✅ Validación en tiempo real
- ✅ Indicador de stock opcional
- ✅ Tooltips informativos
- ✅ Personalización completa de estilos
- ✅ Accesibilidad mejorada

#### Props:

```jsx
<QuantitySelector
  value={5} // Valor actual
  onChange={(val) => {}} // Callback al cambiar
  min={1} // Mínimo (default: 1)
  max={99} // Máximo (default: 99)
  step={1} // Incremento (default: 1)
  disabled={false} // Deshabilitado (default: false)
  showStockLimit={false} // Mostrar stock (default: false)
  size="medium" // Tamaño: small|medium|large
  orientation="horizontal" // Orientación: horizontal|vertical
  label="Cantidad" // Etiqueta opcional
  stockText="10 disponibles" // Texto stock personalizado
  sx={{}} // Estilos personalizados
/>
```

## 📁 Migración Completada

### ✅ QuantitySelector Unificado

**Antes**: Existían 2 versiones duplicadas

- `/features/buyer/QuantitySelector/` (⚠️ OBSOLETO)
- `/features/marketplace/product/QuantitySelector.jsx` (⚠️ OBSOLETO)

**Después**: Una versión universal

- `/components/shared/QuantitySelector.jsx` (✅ ACTUAL)

**Archivos Migrados**:

- ✅ `CartItem.jsx` - Usa el componente universal

## 🔄 Próximas Migraciones

### Candidatos para components/shared:

1. **PriceDisplay** - Usado en múltiples lugares
2. **StockIndicator** - Reutilizable
3. **StatCard** - Ya separado, candidato para shared

## 📚 Cómo Usar

```jsx
// Import individual
import { QuantitySelector } from '../../../components/shared'

// Import múltiple
import { QuantitySelector, OtroComponente } from '../../../components/shared'
```

## 🛡️ Garantías

- ✅ **Sin breaking changes**: La API es compatible con versiones anteriores
- ✅ **Mejor funcionalidad**: Combina las mejores características de ambas versiones
- ✅ **Mejor UX**: Tooltips, validación mejorada, accesibilidad
- ✅ **Mantenimiento**: Un solo lugar para updates
