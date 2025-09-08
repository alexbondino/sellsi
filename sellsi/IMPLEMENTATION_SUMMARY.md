# Implementación de Sistema de Prioridades de Imágenes - fetchpriority="high" para Primeras 2 Filas

## 🎯 Objetivo
Implementar `fetchpriority="high"` solo para las ProductCards de las primeras 2 filas del grid responsivo, mientras el resto mantiene `fetchpriority="auto"` para optimización de LCP.

## ⚠️ Problema Solucionado
Al cambiar de `priority={true}` hardcodeado a dinámico, algunas imágenes no se cargaban porque dependían del lazy loading que puede fallar. Se implementó una versión conservadora que mantiene eager loading pero diferencia el `fetchpriority`.

## 🔧 Cambios Implementados

### 1. **Nuevo Calculadora de Prioridades** (`gridPriorityCalculator.js`)
- Calcula dinámicamente cuántos productos ocupan las primeras 2 filas por breakpoint
- Proporciona función `shouldHaveHighPriority(index, responsive)` 
- Hook `useGridPriority()` para facilitar integración en React

### 2. **UniversalProductImage Mejorado**
- **Separación de Props**: `priority` (eager/lazy) vs `imagePriority` (fetchpriority)
- **Versión Conservadora**: Mantiene `priority={true}` para evitar problemas de carga
- **Timeout de Seguridad**: Reduce timeout para imágenes low-priority (200ms vs 500ms)
- **fetchpriority Dinámico**: `"high"` para primeras 2 filas, `"auto"` para el resto

### 3. **ProductCardImage Actualizado**
- Acepta prop `priority` para controlar `fetchpriority`
- Mantiene `priority={true}` interno para eager loading seguro
- Pasa `imagePriority` a UniversalProductImage

### 4. **ProductCard Mejorado**
- Nueva prop `imagePriority` en la firma
- Pasa la prioridad dinámica a ProductCardImage
- Memoización actualizada con nueva dependencia

### 5. **ProductsSection Integrado**
- Importa y usa `useGridPriority()`
- Calcula prioridades basado en responsive flags existentes
- Pasa función `getPriority` a ProductsSectionView
- Debug info en desarrollo

### 6. **ProductsSectionView Actualizado**
- Recibe función `getPriority` en props `data`
- Llama `getPriority(index)` para cada ProductCard
- Pasa `imagePriority` dinámicamente

### 7. **LazyImage Fortificado**
- Timeout de seguridad integrado en `useLazyLoading`
- Timeout más corto para imágenes con baja prioridad
- Soporte para `fetchPriority` prop

## 📊 Cálculo de Prioridades por Breakpoint

```javascript
const productGridColumns = {
  xs: 2,  // 2 columnas → primeras 2 filas = 4 productos HIGH
  sm: 2,  // 2 columnas → primeras 2 filas = 4 productos HIGH
  md: 4,  // 4 columnas → primeras 2 filas = 8 productos HIGH
  lg: 4,  // 4 columnas → primeras 2 filas = 8 productos HIGH
  xl: 5,  // 5 columnas → primeras 2 filas = 10 productos HIGH
};
```

## 🛡️ Medidas de Seguridad

1. **Conservador con Lazy Loading**: Mantiene `priority={true}` para evitar imágenes que no cargan
2. **Timeouts de Seguridad**: Múltiples niveles de timeout para forzar carga
3. **Fallback Robusto**: `fetchpriority="auto"` como default seguro
4. **Debug Integrado**: Logs en desarrollo para verificar funcionamiento

## 🚀 Resultado

- **Primeras 2 filas**: `fetchpriority="high"` + eager loading
- **Resto de productos**: `fetchpriority="auto"` + eager loading  
- **LCP Optimizado**: Priorización inteligente sin sacrificar confiabilidad
- **Compatibilidad Total**: Funciona con sistema de batching existente

## 🧪 Testing

Archivo de prueba incluido: `test-grid-priority.js`
- Verifica cálculos por breakpoint
- Confirma límites de primeras 2 filas
- Debug visual en consola

## 📝 Notas Importantes

- La implementación es **conservadora** por seguridad
- Se prioriza **confiabilidad** sobre optimización agresiva
- **Compatible** con todas las funcionalidades existentes
- **Reversible** fácilmente si se detectan problemas

## 🔄 Rollback Rápido

Si aparecen problemas, cambiar en `ProductCardImage`:
```javascript
priority={true} // Volver a hardcodeado
// imagePriority={priority} // Comentar esta línea
```
