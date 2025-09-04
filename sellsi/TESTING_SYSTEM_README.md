# 🧪 SISTEMA COMPLETO DE TESTING - OFERTAS

## 📋 Resumen del Pipeline de Testing

Hemos implementado un **pipeline completo de testing** que evalúa el sistema de ofertas en **4 niveles diferentes**:

### 🔧 **1. Tests Unitarios** (`src/__tests__/unit/`)

**Archivos creados:**
- `offerStore.test.js` - Tests del store principal de ofertas
- `notificationService.test.js` - Tests del servicio de notificaciones  
- `offerHooks.test.js` - Tests de hooks personalizados
- `buyerOffersComponents.test.js` - Tests de componentes React
- `edgeCases.test.js` - Tests de casos extremos y edge cases

**Cobertura:**
- ✅ Validación de límites de ofertas
- ✅ Creación, aceptación y rechazo de ofertas
- ✅ Manejo de errores y casos límite
- ✅ Funciones de notificación
- ✅ Hooks de datos (useBuyerOffers, useSupplierOffers)
- ✅ Componentes UI (BuyerOffers, OffersList)
- ✅ Casos extremos (concurrencia, memoria, red)

### 🔗 **2. Tests de Integración** (`src/__tests__/integration/`)

**Archivos creados:**
- `offerFlowIntegration.test.js` - Tests de flujo completo end-to-end

**Cobertura:**
- ✅ Flujo completo: Crear oferta → Notificación → Aceptar/Rechazar
- ✅ Validación de límites en contexto real
- ✅ Gestión de ofertas en BuyerOffers/SupplierOffers
- ✅ Manejo de errores en flujo completo
- ✅ Expiración de ofertas
- ✅ Interacción entre componentes

### 🌐 **3. Tests End-to-End** (`src/__tests__/e2e/`)

**Archivos creados:**
- `offerSystemE2E.spec.js` - Tests E2E con Playwright

**Cobertura:**
- ✅ Flujo completo de usuario: Buyer crea oferta, Supplier la acepta
- ✅ Flujo de rechazo de ofertas
- ✅ Validación de límites en UI real
- ✅ Filtrado de ofertas por estado
- ✅ Validación de formularios
- ✅ Tooltips y UX
- ✅ Tiempo restante y timers
- ✅ Cancelación de ofertas

### ⚙️ **4. Configuración y Tooling**

**Archivos de configuración:**
- `jest.config.json` - Configuración de Jest
- `babel.config.js` - Transpilación para tests
- `playwright.config.js` - Configuración E2E
- `setup.js` - Setup global de testing
- `supabaseMock.js` - Mocks de Supabase y datos

**Scripts NPM agregados:**
```json
{
  "test": "jest",
  "test:unit": "jest --testPathPattern=\"unit\" --coverage",
  "test:integration": "jest --testPathPattern=\"integration\" --coverage", 
  "test:e2e": "playwright test",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:pipeline": "node scripts/test-pipeline.js",
  "test:all": "npm run test:unit && npm run test:integration && npm run build && npm run test:e2e"
}
```

## 🚀 Cómo Ejecutar los Tests

### Tests individuales:
```bash
# Tests unitarios
npm run test:unit

# Tests de integración  
npm run test:integration

# Tests E2E
npm run test:e2e

# Todos los tests
npm run test:all
```

### Pipeline completo:
```bash
# Ejecuta pipeline completo con resumen
npm run test:pipeline
```

### Modo desarrollo:
```bash
# Watch mode para desarrollo
npm run test:watch

# UI de Playwright para E2E
npm run test:e2e:ui
```

## 📊 Casos de Test Implementados

### **Casos Exitosos:**
- ✅ Crear oferta válida
- ✅ Aceptar oferta por supplier
- ✅ Rechazar oferta por supplier
- ✅ Cancelar oferta por buyer
- ✅ Agregar oferta aceptada al carrito
- ✅ Filtrar ofertas por estado
- ✅ Validar límites mensuales

### **Casos de Error:**
- ❌ Exceder límite mensual de ofertas
- ❌ Datos de entrada inválidos
- ❌ Errores de red/conectividad
- ❌ Ofertas expiradas
- ❌ Datos corruptos
- ❌ Condiciones de carrera

### **Casos Extremos:**
- 🔄 Concurrencia múltiple
- 📊 Listas grandes de ofertas
- 🕐 Expiraciones en tiempo real
- 🔒 Doble submit prevention
- 🌐 Problemas de red intermitentes

## 🎯 Métricas de Cobertura

**Objetivo: 80% de cobertura en:**
- Branches
- Functions  
- Lines
- Statements

**Archivos cubiertos:**
- `stores/offerStore.js`
- `domains/notifications/services/notificationService.js`
- `domains/**/hooks/*.js`
- `domains/**/components/*.jsx`

## 🛠️ Tecnologías Utilizadas

- **Jest** - Framework de testing unitario
- **Testing Library** - Testing de componentes React
- **Playwright** - Testing E2E multi-browser
- **Babel** - Transpilación de código
- **Mocks personalizados** - Simulación de Supabase y servicios

## 📈 Beneficios del Sistema

1. **Confianza en el código** - Todos los casos críticos están cubiertos
2. **Prevención de regresiones** - Los cambios futuros no romperán funcionalidad
3. **Documentación viviente** - Los tests documentan el comportamiento esperado
4. **Desarrollo más rápido** - Feedback inmediato sobre cambios
5. **Calidad asegurada** - Pipeline automático previene bugs en producción

## 🎉 Estado Actual

✅ **Sistema de testing completamente implementado**
✅ **Todos los flujos críticos cubiertos**
✅ **Pipeline automatizado configurado**
✅ **Listo para integración continua (CI/CD)**

El sistema de ofertas ahora tiene **cobertura completa de testing** desde tests unitarios hasta E2E, garantizando calidad y confiabilidad en producción.

---

## 🆕 Actualizaciones (Sept 2025)

### 1. Harness Directo para Acciones
Para escenarios de integración (aceptar / cancelar) reemplazamos flujos largos de RPC encadenados por un Harness que inyecta `offers` directamente en `SupplierOffersList` u `OffersList`. Esto reduce dependencias en hooks asíncronos y hace las pruebas deterministas.

### 2. Helper `renderWithProviders`
Archivo: `src/__tests__/testUtils/renderWithProviders.js`
Incluye Router + React Query + Theme. Úsalo en nuevos tests:
```js
import { renderWithProviders } from '../testUtils/renderWithProviders';
renderWithProviders(<MyComponent />);
```

### 3. Nuevo RPC de Límites y Caso supplier_limit
`validate_offer_limits` devuelve:
```json
{ "allowed": true, "product_count": 1, "supplier_count": 2, "product_limit": 3, "supplier_limit": 5, "reason": null }
```
Para simular límite del proveedor alcanzado (aunque el del producto no):
```js
mockSupabase.rpc.mockResolvedValueOnce({
  data: { allowed: false, product_count: 2, supplier_count: 5, product_limit: 3, supplier_limit: 5, reason: 'Se alcanzó el límite mensual de ofertas (proveedor)' },
  error: null
});
```

### 4. Bloqueo de Oferta Duplicada en `OfferModal`
Si el comprador ya tiene una oferta `pending` para el mismo `product_id`, el modal:
* Muestra un `<Alert data-testid="pending-offer-block" />`
* Deshabilita inputs y botón "Enviar Oferta"

### 5. Nuevos Tests
Archivo: `offerModal.restrictions.test.js`
* Verifica bloqueo por oferta pendiente existente
* Valida mensaje de límite alcanzado por supplier (`supplier_count == supplier_limit`)

### 6. Recomendaciones de Uso
* Preferir Harness para pruebas que sólo necesitan validar transición de estado UI + llamada RPC simple.
* Usar el patrón de colas RPC (queue) sólo cuando se ejercen cadenas multi-fase (creación + refetch + transición de estado dependiente de backend).

---
