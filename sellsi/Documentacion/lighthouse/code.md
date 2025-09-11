## Análisis Profundo: Code Splitting (Rutas / Componentes Pesados) + Dynamic Import

### 1. Resumen Ejecutivo
El build actual ya aplica una segmentación inicial mediante `manualChunks` (react-vendor, mui-core, mui-icons, mui-extras, router, supabase, charts, animation, utils, etc.). Sin embargo, los bundles dominantes siguen siendo grandes y algunos flujos poco frecuentes (onboarding, add product, charts, animaciones especiales) se entregan demasiado pronto. El anterior intento fallido de code splitting probablemente introdujo más solicitudes pequeñas sin estrategia de precarga ni agrupación lógica, generando peor LCP / TBT por: (a) cascadas de imports tardíos, (b) duplicación de estilos Emotion/MUI en múltiples chunks, (c) falta de `modulepreload` para los boundaries recién creados.

Objetivo: Reducir JS crítico inicial (parse + exec) y mejorar LCP / TTI sin crear sobre-fragmentación ni waterfall. Meta: -25–35% de JS inicial ejecutado antes de interacción primaria en `/buyer/marketplace` con ≤2 solicitudes adicionales en el camino crítico.

### 2. Distribución Actual de Chunks (extracto relevante)
Top tamaños (gzip entre paréntesis):
- `index-CIi-kaZQ.js` 592 KB (159 KB gzip)
- `mui-core` 472 KB (130 KB)
- `charts` 312 KB (79 KB)
- `mui-extras` 269 KB (69 KB)
- `HH7B3BHX-*` 221 KB (61 KB) (chunk genérico / posible agregación de lógicas)
- `AddProduct` 173 KB (29 KB)
- `animation` 116 KB (38 KB)
- `supabase` 113 KB (30 KB)
- `BuyerCart` 92 KB (17 KB)
- `ProductsSection` 65 KB (14 KB)

Observaciones:
1. `mui-core` y `mui-extras` suman ~741 KB sin comprimir; MUI domina parse time. 
2. `charts` y `animation` no son necesarios para la vista inicial del marketplace.
3. Grandes flujos (AddProduct / Onboarding / Payment / Checkout) se pueden aislar por ruta.
4. `index` (root) aún incluye demasiada lógica multi-contexto.

### 3. Hipótesis de Por Qué el Intento Previo Empeoró
| Problema | Efecto | Señal Típica |
|----------|--------|--------------|
| Splits demasiado finos | Overhead de requests + latencias acumuladas | Waterfall al perf panel |
| Falta de `modulepreload` | Bloqueo al descubrir dinámicamente chunks | LCP up / JS idle gaps |
| Duplicación de estilos Emotion | Mayor parse + recalculation | Más style tags en dev tools |
| Lazy boundary dentro de render crítico | Suspense fallback visible (jank) | Flash / spinner inicial |
| Imports condicionales no memorizados | Re-evaluaciones repetidas | CPU extra al navegar |
| Carga tardía de vendor requerido por varios lazy | Cada suspense inicia descarga del mismo vendor | Múltiples vendor duplicados en network |

### 4. KPIs Propuestos
| Métrica | Baseline | Objetivo Fase 1 | Objetivo Fase 2 |
|---------|----------|-----------------|-----------------|
| JS ejecutado antes de interacción (Marketplace) | 100% actual | -25% | -40% |
| LCP | 2.36 s | ≤1.9 s | ≤1.6 s |
| TBT | 306 ms | ≤240 ms | ≤190 ms |
| # solicitudes bloqueantes iniciales | >6 | ≤4 | ≤4 |
| INP (RUM) | n/d | <200 ms | <150 ms |

### 5. Principios de Estrategia
1. Split por RUTA + FEATURE rara vez usada > Split micro-componentes. 
2. Aplazar librerías de visualización / gráficos / animación hasta interacción. 
3. Añadir `rel="modulepreload"` proactivo para los splits que se predicen (ej: hover sobre enlace de Add Product, near-fold). 
4. Mantener un “núcleo interactivo” estable: React + Router + Theme + Layout + Product listing essential hooks.
5. Evitar duplicar estados globales (React Query, Zustand) en splits iniciales; cargar esos singletons solo una vez. 
6. Evaluar `react-lazy-hydration` pattern (opcional en fase 2) para componentes no interactivos above-the-fold.

### 6. Clasificación de Candidatos
| Tipo | Componentes / Chunks | Acción |
|------|----------------------|--------|
| Rutas pesadas | AddProduct, Onboarding, Checkout, PaymentMethod, Profile, Charts dashboards | Lazy route import + modulepreload on navigation intent |
| Grandes librerías secundarias | `charts`, `animation`, `mui-extras` | Cargar sólo en rutas que los requieren; dividir si posible (ej: separar `framer-motion` de confetti) |
| Funcionalidad condicional | Contact / Modals avanzados / Terms modals | Dynamic import on open |
| Admin / Provider flows | ProviderCatalog, SupplierOffers, MyProducts | Route-level lazy |
| Media / Gallery | ProductImageGallery (≥5 KB + dependencias) | Lazy cuando el usuario entra a product page |
| Formularios complejos | Registro multi-step, KYC, AddToCart extended | Lazy boundary por step (Fase 2) |

### 7. Plan de Fases
Fase 1 (Rápido, bajo riesgo):
1. Lazy routes para: AddProduct, Onboarding, Checkout, PaymentMethod, Profile, Charts dashboards. 
2. Extraer `animation` y `charts` fuera del bundle inicial mediante dynamic import con prefetch condicional. 
3. `ProductImageGallery`: cargar al entrar a ruta `/marketplace/product/:id` (ya es otra ruta → lazy route boundary). 
4. Preload estratégico: inyectar `<link rel="modulepreload" href="/assets/js/AddToCart-*.js">` solo cuando el botón cart entra en viewport.

Fase 2 (Optimización):
1. Dividir `mui-extras` en subgrupos (lab, x-charts). 
2. Cargar `framer-motion` y `canvas-confetti` bajo demanda tras interacción (click share / celebrate). 
3. Progressive hydration (islands) para bloques scroll-lejanos. 
4. Worker offload para normalizaciones pesadas si persisten long tasks. 

Fase 3 (Refinamiento):
1. Generar mapa de dependencias reales para detectar sobrecarga de imports estáticos residuales. 
2. Aplicar prefetch heurístico (IntersectionObserver) para próximas rutas probables (ej. hover over nav). 
3. Medir con RUM y ajustar granularidad.

### 8. Patrones de Implementación
Lazy route (React Router v7+):
```jsx
import { lazy } from 'react';
const AddProductPage = lazy(() => import('../domains/product/pages/AddProduct'));

<Route path="/supplier/add" element={
	<Suspense fallback={<Spinner small/>}>
		<AddProductPage />
	</Suspense>
} />
```

Dynamic import en interacción:
```js
async function openChartPanel() {
	const [{ ChartPanel }] = await Promise.all([
		import('./ChartPanel'),
		new Promise(r => requestIdleCallback(r))
	]);
	setShow(<ChartPanel />);
}
```

Prefetch por hover / near-view:
```js
let chartsPrefetched = false;
function prefetchCharts() {
	if (chartsPrefetched) return;
	chartsPrefetched = true;
	import('./ChartPanel'); // Prepare chunk
}
<NavLink onMouseEnter={prefetchCharts} to="/dashboard/charts">Gráficos</NavLink>
```

Intersection prefetch (primer scroll):
```js
const ref = useRef(null);
useEffect(()=>{
	const obs = new IntersectionObserver(e=>{
		if (e[0].isIntersecting){
			import('./AddToCart');
			obs.disconnect();
		}
	}, { rootMargin: '400px' });
	if (ref.current) obs.observe(ref.current);
	return ()=> obs.disconnect();
},[]);
```

Agrupación controlada (rollup dynamic import naming): Vite generará hash; mantener estabilidad limitando número de boundaries simultáneos.

### 9. Estrategia de Precarga (`modulepreload`)
Para los splits que sabemos que siguen inmediatamente (AddToCart en marketplace), insertar dinámicamente:
```js
function modulePreload(href){
	if (document.querySelector(`link[rel=modulepreload][href="${href}"]`)) return;
	const l = document.createElement('link');
	l.rel='modulepreload'; l.href=href; document.head.appendChild(l);
}
```
Obtener href desde `__vite_plugin_manifest__` (manifest JSON) o inspección heurística en Fase 2.

### 10. Consideraciones MUI / Emotion
1. Evitar montar múltiples caches Emotion en splits → centralizar `<CacheProvider>` en root. 
2. No lazy-load el ThemeProvider; sólo componentes pesados que lo consumen. 
3. Minimizar estilos inyectados en rutas no visitadas; preferir componentes estilizados internos a CSS global para facilitar tree-shaking.

### 11. Supabase / Datos
1. Mantener cliente supabase en chunk inicial si se usa en marketplace y auth layout; si no, crear inicialización diferida para flows secundarios. 
2. Queries pesadas (reportes, dashboards) -> lazy + suspense boundaries con skeleton design consistente.

### 12. Riesgos y Mitigación
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Fragmentación excesiva | Waterfall y overhead HTTP/2 | Limitar splits F1 ≤10 nuevos chunks, medir |
| Fallback visible (spinner) | Jank visual | Skeleton ligero + prefetch oportuno |
| Duplicación vendor en múltiples chunks | Mayor peso total | Revisar analyzer / evitar dynamic import dentro de librería que re-exporta vendor |
| Regresión SEO si contenido crítico tarda | LCP empeora | No lazy contenido textual above-the-fold |
| Incremento TBT por más evaluaciones micro | Parse overhead | Agrupar micro utilidades en “utils” ya existente |

### 13. Validación / Métricas
1. Ejecutar Lighthouse antes/después (misma conexión simulada). 
2. Capturar coverage en DevTools (JS ejecutado vs transferido). 
3. Medir parse+evaluate cost en Performance Panel (Main Thread). 
4. RUM: instrumentar `performance.getEntriesByType('navigation')` + marcar tiempo de primera interacción (`pointerdown`). 
5. Benchmark de latencia: medir diferencia en tiempo hasta mostrar AddProduct form comparando warm vs cold load.

### 14. Rollback Simplificado
- Revertir rutas lazy a imports estáticos o comentar wrappers `Suspense`. 
- Remover script de prefetch (sin impacto funcional). 
- Confirmar que `manualChunks` permanece intacto (no tocar configuración base). 

### 15. Checklist de Implementación (Fase 1)
- [ ] Lazy routes: AddProduct, Onboarding, Checkout, PaymentMethod, Profile, Charts. 
- [ ] Dynamic import de `animation` (confetti / motion) tras interacción. 
- [ ] Lazy `ProductImageGallery` (confirmar boundary de ruta ya cubre). 
- [ ] Prefetch AddToCart chunk mediante IntersectionObserver (viewport near). 
- [ ] Hover prefetch para menú de Charts/Reports. 
- [ ] Medir Lighthouse y documentar diffs en `analisisgpt.md`. 
- [ ] Registrar bytes ejecutados (coverage) y adjuntar captura / resumen. 
- [ ] Añadir guard rails: script que alerta si bundle inicial > baseline +5%. 

### 16. Próximos (Fase 2+) 
- Carga diferida de charts por tipo (ej. line/bar separadas). 
- Lazy hydration (solo interacciones) para secciones informativas. 
- Worker para normalizaciones de arrays de productos voluminosos. 
- Árbol de dependencias automatizado (script graph + detección de módulos calientes). 
---

## Análisis de Implementación Profundo: Lazy Routes Fase 1

### A. Alcance Fase 1 (Confirmado)
Rutas / features a validar lazy (ya están en chunks separados según build actual, pero necesitamos asegurar trigger de carga óptimo y evitar precarga innecesaria):

1. **AddProduct** (`AddProduct-ab2_fk47.js`)
2. **Onboarding** (`Onboarding-Ubrf5Hd5.js`)
3. **Checkout** (PaymentMethod + CheckoutSuccess + CheckoutCancel)
4. **Profile** (buyer y supplier usan el mismo chunk `Profile-DmAgwe2c.js`)
5. **Charts dashboards** (antes chunk `charts-*.js` con recharts) – ELIMINADO en favor de remover dependencia pesada (sept 2025)

---

### B. Estado Actual (Baseline Real Del Build)
Captura de tamaños (bytes sin comprimir):

| Chunk            | Bytes    | Aproximado Gzip (30–40%) | Comentario                                |
|-----------------|---------|--------------------------|------------------------------------------|
| AddProduct       | 172,884 | 50–60 KB                 | Form + lógica supplier (costo parse notable) |
| Onboarding       | 26,418  | 9–11 KB                  | Multi-step, coste moderado               |
| PaymentMethod    | 83,422  | 25–30 KB                 | UI + validaciones pago                    |
| CheckoutSuccess  | 11,809  | 4–5 KB                   | Ligero                                   |
| CheckoutCancel   | 6,592   | 3 KB                     | Muy ligero                               |
| Profile          | 60,730  | 18–22 KB                 | Form perfil + hooks                       |
| charts           | 312,097 | 80–95 KB                 | Muy pesado (librerías + componentes)     |

**Observación:** Ya están divididos como lazy (React.lazy en `AppRouter`). Beneficio pendiente principal: controlar cuándo y por qué se precargan, evitando coste si el usuario no visita la ruta.

---

### C. Mecanismo de Carga Actual
`AppRouter.jsx` envuelve todo en un `<Suspense>` global con `SuspenseLoader`. Cada ruta lazy se resuelve sólo cuando React Router monta ese elemento. No hay prefetch explícito ni `modulepreload` condicional.

---

### D. Problemas Potenciales Persistentes

| Tema                     | Riesgo                                | Evidencia / Notas                          | Mitigación Propuesta                       |
|--------------------------|--------------------------------------|-------------------------------------------|-------------------------------------------|
| Suspense global único    | Bloquea con mismo fallback para rutas secundarias | UX poco diferenciada                       | Suspense por secciones críticas (fase 2)  |
| charts cargado completo  | 312 KB para dashboards raros         | Gran parse si se accede temprano           | Sub-split charts (fase 2)                 |
| Falta de prefetch heurístico | LAG al primer acceso a AddProduct / PaymentMethod | Retraso perceptible en navegación         | Hover/near-view prefetch                  |
| Sin política de expiración de prefetch | Cache puede vencer antes de uso real | Offline parcial                            | Guardar timestamp y re-prefetch tras X min |
| Loader genérico largo    | Percepción de lentitud               | `SuspenseLoader` quizá pesado              | Fallback micro (skeleton)                 |
| charts mezcla UI + cálculos | Re-ejecución pesada                 | CPU burst                                  | Separar utilidades puras                  |

---

### E. Objetivos Cuantificables de Esta Iteración
1. Reducir delay percibido al entrar a AddProduct / PaymentMethod a <150 ms (TTI subjetivo) mediante prefetch vs cold first-load.
2. No aumentar número de solicitudes críticas iniciales (0 adicionales antes de interacción).
3. Evitar regress TBT (±5%).
4. Asegurar que charts NO se precargan hasta intención clara (hover / vista dashboards).

---

### F. Estrategia Técnica Detallada
1. **Prefetch On Hover:** Añadir handler a enlaces de navegación para `AddProduct`, `PaymentMethod`, `Profile`. Usar simple `import()` (promesa cacheada por Vite/ESM).
2. **Intersection Prefetch (Near Fold):** Si botón “Agregar Producto” o CTA de checkout aparece dentro de 400px del viewport, disparar prefetch.
3. **Manifest Assisted Preload (Opcional Fase 1.5):** Leer `manifest.json` para `<link rel="modulepreload">` solo si heurística de intención > umbral.
4. **Deduplicar Fallbacks:** Reemplazar fallback global por skeleton inline.
5. **Guard Rail:** Script (fase 1.5) falla CI si `charts` > 330 KB sin comprimir o `AddProduct` > 190 KB.

---

### G. Pseudocódigo Prefetch (Hover)
```js
function prefetch(fn){ try { fn(); } catch(e) { /* ignore */ } }
const prefetchAddProduct = () => prefetch(() => import('../../domains/supplier/pages/my-products/AddProduct'));

// En componente de navegación:
<NavLink to="/supplier/addproduct" onMouseEnter={prefetchAddProduct}>Añadir Producto</NavLink>

useEffect(() => {
	const el = document.querySelector('[data-prefetch="add-product"]');
	if(!el) return;
	const obs = new IntersectionObserver(e => {
		if(e[0].isIntersecting){
			import('../../domains/supplier/pages/my-products/AddProduct');
			obs.disconnect();
		}
	}, { rootMargin: '400px' });
	obs.observe(el);
	return () => obs.disconnect();
}, []);


Riesgos de Prefetch y Mitigación
Riesgo	Caso	Mitigación
Prefetch desperdiciado	Usuario abandona antes de visitar	Disparar solo tras hover >=50ms o intersección real
Saturación red (3G)	Conexión lenta penaliza contenido crítico	Detectar navigator.connection.downlink < 1.5 y saltar prefetch
Efecto en first input	Prefetch compite con recursos críticos	Usar requestIdleCallback tras primer paint
Cache eviction temprana	Larga espera antes de visitar	Re-prefetch si pasan >10 min
J. Plan de Medición Post-Implementación

Regenerar build y comparar tamaño del bundle inicial.

Simular navegación cold ➜ medir tiempo hasta primer paint de AddProduct.

Repetir con hover prefetch antes del click ➜ comparar delta.

Lighthouse (Mobile, Simulated) en /buyer/marketplace antes/después: confirmar LCP/TBT.

Registrar coverage JS y capturar reducción de ejecución inicial (optimización futura estará en charts).

K. Futuro (Charts Sub-Split – Outline)

Separar elementos (ejes, tooltips) vs cada tipo de gráfica (BarChart, LineChart).

Dynamic import de tipos raros (Pie) al primer uso real.

Convertir parte de configuración a JSON + render ligero inicial.

L. Checklist Operativo (Fase 1 Ejecutable)

 Añadir hover prefetch para AddProduct, PaymentMethod, Profile.

 Añadir intersection prefetch para CTA AddProduct y botón "Continuar pago".

 Confirmar que ninguna de esas rutas se carga en network tab sin interacción.

 Micro fallback: sustituir loader global en rutas pequeñas (CheckoutSuccess/Cancel).

 Script de verificación de tamaños (opcional).