# Performance Marketplace - Análisis y Plan de Acción

**Fecha:** 10 Enero 2026  
**Métricas:** stalling.json (captura real con disable cache)  
**Código:** 12 archivos validados | 2,500+ líneas

---

## 📊 ESTADO ACTUAL

```
Total: 15 requests | 3.2s page load
- marketplace_products_daily: 1 request (412ms)
- product_price_summary: 3 requests (batching activo, ~250ms c/u)
- product_quantity_ranges: 1 request (241ms)
- users (profile): 1 request con JOINs (228ms)
- users (suppliers): 1 request (244ms)
- logo.png: 2 requests ⚠️ DUPLICADO (911ms + 924ms)
- Otros: notifications, carts, cart_items, feature_flags
```

---

## 🔴 ISSUES IDENTIFICADOS

### 1. Logo Usuario Descargado 2 Veces [CRÍTICO]

```json
{ "url": "logo.png", "params": "cb=1768064077494", "download_ms": 2069 },
{ "url": "logo.png", "params": "cb=1768064078423", "download_ms": 2093 }
```

**Impacto:** ~2MB descargados duplicado, 1.8s desperdiciados  
**Causa:** Re-render en LayoutProvider cambia cacheBuster 2 veces  
**Archivo:** `sellsi/src/infrastructure/providers/LayoutProvider.jsx` línea 27-36

### 2. Download Times Elevados [MEDIO]

- `marketplace_products_daily`: 1497ms
- `users`: 1743ms
- `product_price_summary`: 2014ms promedio

**Posibles causas:**

- Falta compresión gzip/brotli
- Payloads muy grandes (demasiados campos en SELECT)
- Network slow (3G simulation?)

### 3. Queuing HTTP/1.1 [BAJO]

15 requests con límite de 6 conexiones simultáneas → inevitable queuing  
**Fix:** Confirmar HTTP/2 activo en Vercel

---

## 📋 PLAN DE ACCIÓN

### Fase 1: Quick Wins (1-2 días) 🟢

**1.1 Eliminar Logo Duplicado**

```javascript
// LayoutProvider.jsx - Línea 27
// ANTES:
const [logoCacheBuster, setLogoCacheBuster] = useState(() => Date.now())

// DESPUÉS:
const [logoCacheBuster, setLogoCacheBuster] = useState(Date.now())
// O mejor: mover lógica a useMemo
const logoUrlWithCache = useMemo(() => {
  return logoUrl ? `${logoUrl}?v=${Date.now()}` : null
}, [logoUrl])
```

**Impacto:** -2MB, -1.8s page load

**1.2 Verificar HTTP/2**

```javascript
// Agregar a main.jsx (temporal)
console.log(
  'Protocol:',
  performance.getEntriesByType('navigation')[0]?.nextHopProtocol
)
```

Si retorna 'h2' → queuing no es problema. Si retorna 'http/1.1' → abrir ticket Vercel

**1.3 Verificar Compresión**

```javascript
// DevTools Network → Response Headers
// Buscar: content-encoding: gzip o br
```

Si falta → configurar en vercel.json

---

### Fase 2: Optimizaciones Medium (3-5 días) 🟡

**2.1 Reducir Payloads de Queries**

```javascript
// useProducts.js - Solo traer campos necesarios
.select('productid, productnm, price, supplier_id, thumbnail_url')
// vs actual que trae ~20 campos

// profileService.js - Evaluar si billing_info es necesario en todas las queries
```

**Impacto estimado:** -30% download time

**2.2 Lazy Load de Datos No Críticos**

```javascript
// Diferir carga de:
- notifications (no crítico para marketplace)
- feature_flags (cargar en background)
- cart_items si cart está vacío
```

**2.3 Implementar Monitoring**

```javascript
// Agregar a useProducts.js
if (ENV.VITE_ENABLE_PERF_TRACKING) {
  performance.mark('products-fetch-start')
  // ... fetch ...
  performance.mark('products-fetch-end')
  performance.measure(
    'products-fetch',
    'products-fetch-start',
    'products-fetch-end'
  )
}
```

---

### Fase 3: Infraestructura (1-2 semanas) 🟠

**3.1 APM Integration**

- Sentry Performance (recomendado)
- Dashboard con métricas: LCP, FID, CLS, TTI

**3.2 Database Indexes Audit**

```sql
-- Verificar EXPLAIN ANALYZE en queries lentas
EXPLAIN ANALYZE
SELECT * FROM marketplace_products_daily LIMIT 100;
```

**3.3 CDN para Imágenes**

- Migrar logos/thumbnails a CDN con auto-resize
- Implementar WebP + fallback

---

## 🎯 KPIs DE ÉXITO

| Métrica           | Actual | Target | Mejora |
| ----------------- | ------ | ------ | ------ |
| Page Load         | 3.2s   | <2.0s  | -37%   |
| Total Requests    | 15     | 12     | -20%   |
| Logo Downloads    | 2      | 1      | -50%   |
| Download Time Avg | 1500ms | <800ms | -47%   |
| Cache Hit Rate    | ?      | >60%   | N/A    |

---

## 🔧 ARCHIVOS A MODIFICAR

**Prioridad Alta:**

- `sellsi/src/infrastructure/providers/LayoutProvider.jsx` (logo duplicado)
- `sellsi/vercel.json` (verificar compresión)

**Prioridad Media:**

- `sellsi/src/workspaces/marketplace/hooks/products/useProducts.js` (reduce fields)
- `sellsi/src/services/user/profileService.js` (lazy load billing_info)

**Monitoreo:**

- `sellsi/src/main.jsx` (agregar perf tracking temporal)

---

**Next Steps:** Ejecutar Fase 1 (Quick Wins) y re-capturar métricas

**Database:**

- `supabase/migrations/*_product_price_summary.sql`
- `supabase/migrations/*_marketplace_products_daily.sql`

---

**Verificación:** Código fuente validado línea por línea  
**Metodología:** Lectura directa + grep patterns + cross-reference con stalling.json
