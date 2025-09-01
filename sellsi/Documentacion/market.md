## Auditoría Profunda Buyer / Marketplace (2025-08-30)
Revisión corregida (v2) – Ajustes sobre la versión inicial: se matizan hallazgos, se corrigen inexactitudes sobre caching de tiers y se añaden omisiones relevantes (data fetch, complejidad de `UniversalProductImage`, accesibilidad, proyección SQL, etc.).

Estado actual evaluado sobre branch `staging`.

### Resumen Ejecutivo
El marketplace buyer tiene una base decente de optimizaciones (memoización, separación de hooks, carga progresiva), pero aún presenta riesgos de performance y mantenibilidad en:
1. Ausencia de virtualización real para listas grandes (no se usa react-window / virtualization).
2. Fragmentación de dominios marketplace (carpetas duplicadas) elevando riesgo de imports inconsistentes.
3. Carga potencialmente excesiva de imágenes (falta de política clara de tamaños, formatos WebP / AVIF adaptativos y prioridad de LQIP / blur placeholders generalizada).
4. Re-renderizaciones evitables (principalmente en componentes grandes como `CartItem`; en otros ya se usan `useMemo` y `React.memo`).
5. Falta de límites / AbortController en fetch principal (`useProducts`) y ausencia de abort explícito en tiers (aunque hay caching de React Query) → riesgo de trabajo desperdiciado en navegación rápida.
6. Estrategia híbrida de paginación/infinite scroll sin virtualización puede escalar mal >1–2K productos.
7. Componente `CartItem` muy pesado (mucho JSX + lógica) renderizado N veces sin descomposición granular + sin React.memo.
8. Falta de mediciones instrumentadas (no hay métricas Runtime CLS/FID/TTFB, ni profiling sistemático con marca de fases en consola/Sentry Performance).

### Metodología
- Revisión estática de componentes clave: `MarketplaceBuyer`, `useMarketplaceLogic`, `ProductsSection`, `ProductCard*`, `CartItem`, `CartHeader`.
- Búsqueda de patrones: memoización, derivación de estado, carga incremental, manejo de imágenes, layering de contexto.
- Clasificación de hallazgos: Crítico / Alto / Medio / Bajo / Observación.

### Hallazgos Críticos (Revisados SIN Virtualización Forzada)
| Código / Área | Problema | Impacto | Evidencia | Acción Recomendada |
|---------------|----------|---------|-----------|--------------------|
| Imágenes de producto (`ProductCardImage` / `UniversalProductImage`) | Falta estrategia de tamaños responsivos (`srcset`, `sizes`) y límite concurrente centralizado | Ancho de banda + LCP sub‑óptimo | `ProductCard.jsx` no usa `<picture>` ni `srcset` | Implementar pipeline: variantes + `srcset` + prioridad LCP + placeholder blur. |
| `CartItem.jsx` | Monolítico, sin `React.memo`, estilos inline y lógica mezclada | Re-render cruzado y GC extra | 500+ líneas; dependencias amplias | Dividir en subcomponentes + memo + mover estilos a factory. |
| Gestión de tiers (`useProductPriceTiers`) | Falta abort/cancel explícito; caching ya existe (React Query) pero sin control de concurrencia masiva ni TTL cross-tab | Latencia acumulada si muchas cards montan simultáneo; posibles race updates visuales | Hook invocado por cada card (queryKey por productId con `staleTime=5m`) | Añadir AbortController opcional, limitar solicitudes simultáneas, prefetch selectivo (primer viewport) y (si se requiere) cache in-memory adicional cross-sesión. |
| `UniversalProductImage.jsx` (≈480 líneas) | Complejidad elevada + múltiples responsabilidades (selección, fallback, eventos, phase) sin tests | Riesgo de regresiones y dificultad de añadir `srcset` | Archivo grande sin separación lógica | Refactor: dividir en `resolveThumbnail()`, capa de fallbacks y renderer; añadir pruebas. |
| Faltan métricas runtime | Optimización a ciegas | No hay instrumentation marks | Sin medición de LCP/CLS/TTI | Añadir `performance.mark/measure` + Sentry spans clave. |
| Estado compuesto en `useMarketplaceLogic` | Demasiadas responsabilidades mezcladas | Mayor costo cognitivo y re-renders encadenados | Hook central >300 líneas | Segregar en 3 hooks (layout, viewMode, filters) + compose. |

### Nota Sobre Virtualización
Se evaluó la virtualización y se DESCARTA como recomendación principal dado:
1. UX: Saltos perceptibles al hacer scroll rápido en grids visuales (especialmente en mobile con momentum scroll).
2. Accesibilidad: Screen readers pueden tener problemas con DOM parcial si no se añaden roles y buffers correctos.
3. Complejidad: La grilla es responsive con alturas variables potenciales (modos provider vs product) → aumenta mantenimiento.
4. Catálogo Actual: Si la mayoría de sesiones carga < 400 ítems simultáneamente, optimizaciones de imágenes + batching + render incremental son suficientes.

Se mantiene como OPT-IN futuro solo si: (a) páginas > 800 productos simultáneos frecuentes, (b) métricas de CPU > 60ms commit en perfil.

### Hallazgos Altos (Actualizados)
| Área | Problema | Impacto | Acción |
|------|----------|---------|--------|
| Duplicados estructura marketplace (`duplicados.md`) | Riesgo de importar versión equivocada (shadow modules) | Bugs sutiles / bundle inflado | Consolidar una sola jerarquía `domains/marketplace` + deprecación controlada. |
| Estilos inline repetidos | Objetos recreados (principalmente en `CartItem`, no tanto en `ProductCard`) | GC churn y ruido para diffing en componentes pesados | Centralizar tokens en theme + variantes MUI + mover estilos a constantes. |
| Faltan boundaries de Suspense/lazy segmentados | Grandes waterfalls en primera carga de vista | Percepción de lentitud | Introducir `React.lazy` sectorizado (FilterPanel, ProductGrid, AddToCart modal). |
| AddToCart lógica dentro de `ProductCardBuyerContext` | Mezcla presentación + apertura modal + pricing | Aumenta superficie de re-renders y dificulta test | Extraer hook `useAddToCartFlow` y/o delegar a contexto de Cart (batch). |
| Falta de instrumentation (Sentry Performance parcial) | No hay feedback real para priorizar | Optimización a ciegas | Agregar marcadores `performance.mark/measure`, Web Vitals (`web-vitals`), spans Sentry (fetch, filter, sort, image decode). |

### Hallazgos Medios
| Área | Problema | Impacto | Acción |
|------|----------|---------|--------|
| `useMarketplaceLogic` | Mezcla responsabilidades (UI offsets + switching provider/products + filtros) | Dificulta escalado | Segregar en hooks: `useMarketplaceViewMode`, `useMarketplaceFilters`, `useMarketplaceLayoutConfig`. |
| `ProductCard` altura/ancho hardcode con objetos responsive | Cambio de diseño complejo; inconsistencia futura | Parametrizar con design tokens (`card.size.variant`). |
| Scroll listeners manuales (scrollToTop) | No throttling / passive explicit | Menor, pero puede agregar overhead | Añadir `{ passive: true }` + util throttle (requestAnimationFrame). |
| Cálculo de price tiers en `ProductCardBuyerContext` | `Math.min/Math.max` sobre arrays cada render (inputs no hash memo) | Micro overhead | Memo adicional por hash de tiers o precálculo server. |
| Shipping en carrito | Lógica mezclada con UI + múltiples condiciones | Riesgo de errores al agregar nuevos modos | Extraer `useCartItemShipping(itemId)` + map config-driven. |

### Hallazgos Bajos / Observaciones
| Área | Nota | Acción Opcional |
|------|------|----------------|
| `React.memo` aplicado ampliamente | Correcto, pero requiere pruebas de aciertos (profiling) | Capturar % de renders evitados con DevTools. |
| Comentarios extensos en componentes | Ayuda onboarding pero alarga archivos | Trasladar a documentación MD y mantener comentarios críticos. |
| Hook `useMarketplaceLogic` ya memoiza handlers | Buen patrón | Mantener y agregar pruebas. |

### Métricas Faltantes (Debe instrumentarse)
- LCP (p75) usando Web Vitals + envío a Sentry.
- CLS (confirmar que contenedores con altura fija realmente mitigan).
- TTFB y tiempo fetch -> first paint de grid (`products_fetch_total`, `grid_first_render_ms`).
- Render count por `ProductCard` y `CartItem` (profiling + test de integración).
- Throughput scroll (fps) con 200 / 500 / 1000 productos mock (script synthetic).
- Bytes transferidos imágenes primer fold vs objetivo (<250KB).
- Latencia media de queries de tiers y % de reuse de cache.

### Plan de Mejora Priorizado (0 = mayor prioridad) – SIN virtualización obligatoria
| Prioridad | Tarea | Tipo | ETA |
|-----------|-------|------|-----|
| 0 | Instrumentación (marks LCP, CLS, render_grid, fetch_products) + spans Sentry | Observabilidad | 0.5 d |
| 0 | Política de imágenes: generación variantes + `srcset` + placeholder blur + `fetchpriority` | Perf | 1 d |
| 1 | Refactor `CartItem` (subcomponentes + memo + hooks) | Perf / DX | 0.5–1 d |
| 1 | Abort & limit concurrency en `useProducts` + prefetch tiers primer viewport | Robustez | 0.25 d |
| 2 | Segregar `useMarketplaceLogic` en 3 hooks y exponer compose | DX | 1 d |
| 2 | Consolidar carpetas duplicadas marketplace | DX | 0.5–1 d |
| 2 | Implementar estilo centralizado de tarjetas (design tokens) | DX | 0.25 d |
| 3 | Batching de montaje de ProductCards (IntersectionObserver + cola) | Perf | 0.5 d |
| 3 | Scroll listeners pasivos + raf throttle | Perf menor | 0.1 d |
| 3 | `content-visibility: auto` + `contain-intrinsic-size` en grid | Perf pintura | 0.1 d |
| 4 | Pre-carga inteligente (prefetch al hacer hover/near viewport) | Perf percibida | 0.25 d |
| OPT | Virtualización experimental detrás de flag | Investigación | 1–2 d |

### Estrategia Alternativa a Virtualización (Render Incremental + Batching)
1. Lote inicial (Above The Fold): Render sincrónico primer N (e.g. 24) productos.
2. Cola diferida: Resto en micro-lotes de 8–12 usando `requestIdleCallback` + fallback a `setTimeout(0)` en navegadores sin soporte.
3. Gate de imágenes: Cada lote dispara carga controlada (máx 4–6 descargas simultáneas) vía semáforo.
4. Suspense boundary por bloque (si se integran loaders react-query con `suspense:true`).
5. IntersectionObserver: Pausar lotes si FPS cae (heurística: medir `performance.now()` delta > 50ms).

Pseudo-estructura:
```js
function useProgressiveMount(items, { batchSize=12 }) {
  const [visible, setVisible] = useState(() => items.slice(0, FIRST_CHUNK));
  useEffect(() => {
	 let i = FIRST_CHUNK;
	 let cancelled = false;
	 function schedule() {
		if (cancelled || i >= items.length) return;
		const slice = items.slice(i, i+batchSize);
		setVisible(v => [...v, ...slice]);
		i += batchSize;
		(window.requestIdleCallback || setTimeout)(schedule);
	 }
	 schedule();
	 return () => { cancelled = true; };
  }, [items, batchSize]);
  return visible;
}
```

### Optimización Detallada por Capa
1. Estado / Hooks
	- Dividir `useMarketplaceLogic`: evita recomputar handlers no usados cuando solo cambian filtros.
	- Memo profundo opcional en config usando comparación shallow; evitar re-crear objetos marginLeft.
2. Reducción de Re-renders
	- `ProductCard`: extraer `generateProductUrl` fuera (pure util) → no recrear callback.
	- `ProductCardBuyerContext`: pasar sólo props primitivos derivados (p.ej. `tierPriceRange` pre-calculado) para simplificar memo.
3. Imágenes
	- Uso de `fetchpriority="high"` solo para 1–2 LCP candidates (primer row visible).
	- Añadir `decoding="async"` y `loading="lazy"` default fuera de `priority`.
	- Placeholder blur base64 (≤400B) en background hasta `onLoad`.
	- Refactor `UniversalProductImage` para permitir `srcset` / `sizes` sin aumentar complejidad.
	- Agregar atributos `width` y `height` (o `aspect-ratio`) para mitigar CLS.
4. Red de Datos
	- Limitar columnas en `select` (evitar `*`).
	- Paralelizar fetch de `products`, `product_quantity_ranges`, `users` (`Promise.all`).
	- AbortController en fetch principal + cleanup en unmount.
	- Prefetch tiers solo para productos del primer viewport (evitar stampede).
	- (Opcional) TTL in-memory adicional para navegaciones rápidas inter-sección.
5. JS / Bundle
	- Code split AddToCart modal (lazy) y cualquier modal pesado.
	- Revisar bundle para confirmar tree-shaking de íconos MUI (sustituir imports amplios si aplica).
	- Considerar aislar lógica de URL producto en util compartido (ya existe en parte) y remover duplicados.
6. Estilos
	- Variantes MUI (`components.MuiCard.variants`) + theme tokens (altura/ancho card → design tokens).
	- Consolidar sombras y transiciones globales.
	- Mover estilos voluminosos de `CartItem` a constantes + módulos.
7. Accesibilidad / UX
	- `aria-busy` y `aria-live="polite"` en contenedor resultados al aplicar filtros.
	- `alt` descriptivo: incluir proveedor + nombre.
	- Marcar íconos puramente decorativos con `aria-hidden="true"`.
8. Rendimiento de Scroll
	- Throttle/raf + `passive:true` y medir antes/después (scroll FPS).
	- Alternativa previa a virtualización: `content-visibility`.
9. Memoria
	- Evitar almacenar productos completos duplicados en múltiples estados (derivar en render directo). `productosOrdenados` ya suficiente; no duplicar `derivedItems` si solo re-map.
10. Observabilidad
	- Web Vitals → Sentry (LCP, CLS, FID / INP, TTFB).
	- Spans Sentry: `products.fetch`, `products.render.batch`, `image.decode.lcpCandidate`.
	- Marks: `products_fetch_start/end`, `grid_render_start/end`.

### Métricas Objetivo (Después de Mejora)
| Métrica | Objetivo | Método Verificación |
|---------|----------|---------------------|
| LCP (desktop mediano) | < 2.5s (p75) | Web Vitals + Sentry |
| CLS | < 0.03 | Web Vitals |
| Tiempo primer lote renderizado | < 600ms post data | Performance marks |
| Re-renders promedio `ProductCard` al cambiar filtro | ≤ 1 | React Profiler |
| Re-renders promedio `CartItem` en cambio global (no qty) | ≤ 0 | Profiler |
| Bytes imágenes primer viewport | < 250KB | Network tab |
| Tiers cache hit ratio | > 80% | React Query metrics |

### Riesgos / Mitigaciones sin Virtualización
| Riesgo | Mitigación |
|--------|-----------|
| Grid muy grande (>1200 ítems) degrada scroll | Activar flag de virtualización experimental dinámico (feature flag) |
| Decodificación de muchas imágenes simultánea | Semáforo de carga + blur placeholder + batch mount |
| Fugas por abort ausente | Implementar abort en hooks de datos |

### Sección Virtualización (Documentada Como Experimento)
Si métricas exceden objetivos se puede activar flag `ENABLE_GRID_VIRTUALIZATION`. Esta capa debe:
1. Mantener altura predecible (reservar espacio) para evitar CLS.
2. Exponer fallback completo (desactivar en navegadores legacy / preferencia usuario). 
3. Integrar buffer `overscan` pequeño (1–2 filas) para suavizar.

### Conclusión Actualizada
El foco inmediato sigue siendo optimización perceptual (imágenes, batching, instrumentación) y robustez de data fetch (abort, proyección y paralelización), complementado ahora con refactor de componentes grandes (`CartItem`, `UniversalProductImage`) para habilitar mejoras futuras (srcset, progressive mount) y reducir deuda antes de evaluar virtualización.

---
Extensión de análisis agregada sin imponer virtualización obligatoria.

### Diseño de Virtualización Propuesto
- Wrapper `<VirtualProductGrid>` que calcula número de columnas por breakpoint y mapea a índice lineal.
- Usa TanStack Virtual (soporta grids mediante row virtualization) o react-virtual.
- API sugerida:
	- props: `items`, `estimateItemHeight`, `overscan`, `renderItem(index, item)`.
	- Internamente aplica `useVirtualizer` con `count = Math.ceil(items.length / columns)`.
	- Decodificación de imágenes: usar `loading="lazy" decoding="async"` y `priority` (custom) para primeras N.

### Estrategia de Imágenes
1. Generar variantes en upload (thumb 120w, small 240w, medium 480w, large 960w).
2. En `ProductCardImage` construir `srcset` + `sizes="(max-width:600px) 50vw, (max-width:1200px) 25vw, 200px"`.
3. Placeholder LQIP (hash blur) en inline data URI para evitar CLS.
4. Pre-cargar sólo la primera imagen visible (LCP candidate) con `<link rel="preload" as="image">` cuando corresponda.

### Refactor CartItem (Sketch)
Separar en:
- `CartItemContainer` (layout + Paper)
- `CartItemImageSection`
- `CartItemInfo` (nombre, proveedor, unit price)
- `CartItemQuantity` (QuantitySelector + StockIndicator)
- `CartItemTotals` (subtotal)
- `CartItemShipping` (ShippingDisplay)
Cada uno memorizado y recibiendo sólo props primitivos.

### Ejemplo de Instrumentación (Pseudo)
```js
performance.mark('products_fetch_start');
const data = await fetch(...);
performance.mark('products_fetch_end');
performance.measure('products_fetch', 'products_fetch_start', 'products_fetch_end');
Sentry.addBreadcrumb({ category: 'perf', message: 'products_fetch ' + duration });
```

### Riesgos si No se Actúa
- Degradación progresiva de UX con catálogo creciente.
- Costos de infra mayores por ancho de banda de imágenes no optimizadas.
- Dificultad para seguir acelerando nuevas features por deuda estructural.

### Conclusión
La arquitectura avanza en dirección correcta (hooks centralizados, memos selectivos, carga progresiva). Los ajustes agregados corrigen sobre‑generalizaciones (caching de tiers) y priorizan la reducción de complejidad en imágenes y carrito, además de una capa de observabilidad robusta para guiar decisiones antes de introducir virtualización opcional.

---
Documento generado automáticamente (AI audit). Actualizar tras aplicar las mejoras de prioridad 0–1.

---

## Análisis Profundizado Adicional (Cobertura Extendida) (Ajustado)

Esta ampliación profundiza en capas NO detalladas previamente: datos, red, concurrencia, memoria, DX, seguridad básica, accesibilidad y arquitectura futura. No sustituye un code review línea a línea (≈ miles de LOC). Se incluyen heurísticas y patrones detectados en los archivos clave ya inspeccionados + muestreo dirigido de hooks/utilidades relacionados.

### 1. Capa de Datos / Supabase
Observado en `useProducts.js`:
- Secuencia serial: `products` -> luego `product_quantity_ranges` -> luego `users`. Puede paralelizar (`Promise.all`) para reducir latencia agregada.
- Falta de control de abort en la cadena (si el usuario navega fuera antes de resolver). Añadir `AbortController` + early return.
- Mapping produce arrays intermedios (`productIds`, `supplierIds`) correct; micro-optimización: usar `Set` directo en iteración única.
- Filtrado de productos activos se hace en cliente siempre; si dataset crece, mover a RPC / view materializada con condición `(is_active = true) AND (productqty >= minimum_purchase)` para reducir payload.
- Indexación sugerida (DB): `CREATE INDEX idx_products_supplier_id ON products(supplier_id);` y si se usa búsqueda por `productnm` parcial considerar extensión trigram o FTS.

### 2. Derivación y Filtrado (`useMarketplaceState`)
- Filtrado dentro de un único `useMemo` recorre todos los productos cada vez que cambian dependencias (búsqueda, filtros, categoría, sección). Para catálogos grandes (>5K) considerar:
	1. Normalizar productos y mantener índices secundarios (por categoría, proveedor verificado) para intersección rápida.
	2. Pre-compilar predicados (función pura) y reutilizarlos.
	3. Mover búsqueda a worker (Web Worker) si supera 8–10ms en perfil.
- Debounce 300ms razonable; afinar con medición real (Time To Filter Result). Podría exponerse como flag adaptativo (si typing speed alta, ampliar).

### 3. Ordenamiento (`useProductSorting`)
- Sorting copia array completo cada cambio. Para cambios de búsqueda frecuentes se hace doble O(n): filtrado + sort. Optimizable ordenando solo claves (decorate–sort–undecorate) o manteniendo colas separadas por criterio para toggles rápidos.
- Criterio relevancia depende de verificado + nombre alfabético; si se requiere escalabilidad, delegar a capa SQL ordenada y paginada para reducir trabajo en cliente.

### 4. Progresión de Render (`useProgressiveProducts`)
- Throttle scroll a 150ms; en dispositivos rápidos puede sentirse perezoso (lag). Recomendar migrar a `requestAnimationFrame` gating + simple delta.
- `visibleProductsCount` se resetea al cambiar página → correcto; considerar preservar si el usuario vuelve una página atrás (state cache por page). 
- Batching thumbnails controlado por flag; falta métrica de tiempo medio hasta imagen visible (TTI imágenes). Instrumentar.

### 5. Imágenes (`UniversalProductImage.jsx`)
- Fallbacks y fases implementados; falta `srcset` / `sizes` / control de prioridad selectiva.
- No hay negociación AVIF/WebP server-side ni placeholders blur integrados.
- Atributos `width`/`height` ausentes en `<img>` final (con contenedor fijo mitiga, pero añadir reduce CLS residual).
- Uso amplio de `priority={true}` reduce eficacia de scheduling.
- Refactor modular sugerido para introducir variantes sin aumentar complejidad.

### 6. Carrito (`CartItem.jsx`)
- Lógica de shipping, quantity, subtotal dentro del mismo componente. Descomposición permitirá selective memo.
- Muchos estilos `sx` dinámicos; consolidar en objetos constantes fuera del render o en theme variants.
- Animaciones framer-motion para cada item: con >50 ítems impacto en layout. Añadir prop para desactivar animaciones en carritos grandes (heurística).

### 7. Estado Global vs Local
- Marketplace: mezcla de UI (márgenes, sidebar) con data domain en `useMarketplaceLogic`. Segregar reduce re-renders cuando solo cambia layout responsive.
- Cart probable uso de store (no analizado aquí); si es Zustand, verificar selectors para evitar render cascada.

### 8. Concurrencia / Race Conditions
- `useProducts` secuencia de fetch sin abort puede sobrescribir `products` si se dispara otro fetch (feature futuro). Guardar token de request actual.
- Thumbnail phase events globales (`productImagesReady`) podrían llegar tras un unmount; se limpia listener correctamente, bien.

### 9. Memoria
- Duplicación potencial: `products` -> `productosFiltrados` -> `productosOrdenados` -> `derivedItems` -> `renderItems`. Todos arrays completos. Para reducir huella: mantener base `products` y solo arrays de índices para filtrado / orden / vista. Esto también ayuda a facilitar virtualización futura si se decide.

### 10. Accesibilidad (A11y)
- `alt` más descriptivo (producto + proveedor).
- `aria-live="polite"` + `aria-busy` en contenedor de resultados durante filtrado.
- Marcar íconos decorativos con `aria-hidden`.
- Evaluar contraste y tamaño mínimo de íconos de verificación.

### 11. Observabilidad / Métricas
Agregar marks:
```js
performance.mark('mp_fetch_start');
// después de supabase composite fetch
performance.mark('mp_fetch_end');
performance.measure('mp_fetch','mp_fetch_start','mp_fetch_end');
```
Spans Sentry sugeridos: `supabase.products.fetch`, `marketplace.filter.apply`, `marketplace.sort.apply`, `productcard.image.decode`.

### 12. Seguridad / Hardening
- Sanitizar entrada de búsqueda (aunque se usa internal filtering, si en futuro se envía al backend usar parameterized RPC).
- Evitar logging de objetos completos de producto en producción (potencial leak de campos sensibles futuros).
- Revisar que `supabase` key admins no esté expuesta en front (usar anon key y RLS + policies).

### 13. Bundling / Build (Vite)
- Revisar splitting: `ProductCard*` agrupados? Añadir `/* @chunk */` hints si necesario.
- `@mui/icons-material` puede inflar si tree-shaking no óptimo; confirmar output en `dist` (análisis no ejecutado aquí). Si peso alto, crear barrel local de íconos específicos.

### 14. Internacionalización / Formatos
- Formato de números manual (`toLocaleString('es-CL')`) correcto; centralizar en helper para evitar divergencias.
- Preparar wrapper para currency (CLP) con fallback a formateador de Intl.NumberFormat.

### 15. Roadmap Técnicamente Refinado (Versión Definitiva)

Fase 0 (Baseline e Instrumentación) – habilita decisiones posteriores
- Observabilidad base: Web Vitals → Sentry (LCP, CLS, INP, TTFB) + `performance.mark/measure` (`products_fetch`, `grid_render`, `first_batch_paint`).
- Contadores de render (dev) para `ProductCard` y `CartItem`.
- Script baseline (200/500/1000 items mock) midiendo: filtrado ms, sort ms, FPS scroll, peso imágenes fold.
- Snapshot inicial de métricas almacenado (para difs posteriores).

| Fase | Objetivo | Entregables |
|------|----------|-------------|
| 1 | Imágenes eficientes (MVP) | Variantes 120/240/480/960 + `srcset`/`sizes` + placeholder blur + atributos width/height + limitar `fetchpriority` al primer fold |
| 1 | Data fetch robusto | AbortController en `useProducts`, paralelizar (`Promise.all`), proyección columnas, prefetch tiers primer fold |
| 1 | Refactor CartItem | Subcomponentes + memo + estilos externalizados + test render-count |
| 2 | Segregar lógica marketplace | `useMarketplaceFilters`, `useMarketplaceViewMode`, `useMarketplaceLayout` + test integración |
| 2 | Refactor UniversalProductImage | Extraer `resolveThumbnail`, renderer, fallbacks + preparar `buildSrcSet` + tests |
| 2 | Design tokens cards | Tokens de dimensiones + variantes MUI (`components.MuiCard.variants`) |
| 3 | Estructura datos escalable | Arrays de índices para filtrado/orden + benchmark antes/después |
| 3 | Montaje progresivo | Hook `useProgressiveMount` + semáforo imágenes + métricas batch |
| 3 | Scroll & Paint | raf throttle + `passive:true` + `content-visibility: auto` + `contain-intrinsic-size` |
| 4 | Pipeline thumbnails avanzada | Negotiation WebP/AVIF + calidad adaptativa (DPR / conexión) + blur hash opcional |
| 4 | AddToCart desacoplado | Hook `useAddToCartFlow` + modal code-split (lazy + Suspense local) |
| 5 | Virtualización opcional | `<VirtualProductGrid>` behind flag activado por métricas (items > threshold o commit > 60ms) |

Transversales (continuos)
- Accesibilidad: `aria-live`, `aria-busy`, alt descriptivo (producto + proveedor), `aria-hidden` decorativos, contraste iconos verificación.
- Seguridad / Hardening: sanitizar término de búsqueda antes de futuras llamadas backend; limitar campos seleccionados.
- Observabilidad continua: alertas LCP/CLS (Sentry), ratio cache tiers (>80%), logs de fallbacks de imagen.
- Limpieza: eliminar carpetas marketplace duplicadas; deduplicar campos producto (min/max vs calculados) cuando servidor provea.
- QA Automatizada: tests para resoluciones de thumbnails, filtrado (performance budgets), snapshot de tokens de diseño.

Criteria de activación Virtualización
- Items visibles simultáneos > 1200 o commit time p75 > 60ms (profiling).
- FPS scroll p75 < 45 con batching + content-visibility aplicado.

Exit / KPIs (ver sección Métricas Objetivo) usados como Definition of Done incremental por fase.

#### Matriz Impacto / Esfuerzo / Riesgo (Resumen Roadmap)
Leyenda rápida: Impacto (Alto/Medio/Bajo sobre métricas objetivo: LCP, render, bytes), Esfuerzo (días hombre aproximados, rango si aplica), Riesgo (probabilidad + severidad de regresión / bloqueo: Bajo/Medio/Alto).

| Ítem | Impacto | Esfuerzo | Riesgo | Notas Clave |
|------|---------|----------|--------|-------------|
| Instrumentación (Web Vitals + marks + spans) | Alto | 0.5 | Bajo | Habilita decisiones, código aislado, bajo alcance UI. |
| Política imágenes MVP (variantes + srcset + blur + width/height) | Alto | 1 | Medio | Afecta LCP directo; riesgo layout si dimensiones erróneas. |
| Refactor CartItem (subcomponentes + memo) | Alto | 0.5–1 | Medio | Posibles glitches en cálculo subtotal / shipping; requerir tests snapshot & render-count. |
| Abort + paralelizar `useProducts` + prefetch tiers fold | Alto | 0.25 | Bajo | Cambios confinados a hook; probar navegación rápida/back. |
| Segregar `useMarketplaceLogic` en 3 hooks | Medio | 1 | Medio | Riesgo de props/provider mal encadenados; cubrir con tests integración. |
| Refactor `UniversalProductImage` modular | Alto | 1–1.5 | Alto | Maneja múltiples fallbacks; riesgo regresión placeholders/fallback order. |
| Design tokens cards (dimensiones/variants) | Medio | 0.25 | Bajo | Cambios cosméticos controlados. |
| Arrays de índices (filtrado/orden) | Medio | 0.75 | Medio | Riesgo desincronización indices-productos; requiere invariants tests. |
| Montaje progresivo (`useProgressiveMount` + semáforo imágenes) | Alto (perceptual) | 0.5–0.75 | Medio | Debe evitar flash / reorder; validar con 1000 items mock. |
| Scroll & Paint tweaks (raf throttle + passive + content-visibility) | Medio | 0.25 | Bajo | Fácil revertir; medir antes/después. |
| Pipeline thumbnails avanzada (AVIF/WebP adaptativo) | Medio | 1 | Medio | Depende soporte infra/transform; fallback robusto esencial. |
| AddToCart desacoplado (hook + lazy modal) | Medio | 0.5 | Bajo | Aísla lógica; riesgo mínimo si tests de flujo. |
| Virtualización opcional (flag) | Variable (Alto en catálogos grandes) | 1–2 | Alto | Complejidad en grids responsive; sólo activar si criterios métricos. |
| QA / Tests de performance (scripts 200/500/1000) | Alto (indirecto) | 0.5 | Bajo | Reduce riesgo futuras regresiones. |
| Accesibilidad (aria-live, alt, aria-busy) | Medio | 0.25 | Bajo | Beneficio UX/A11y; cambios declarativos. |
| Limpieza duplicados marketplace | Medio | 0.5 | Medio | Riesgo rutas rotas / imports huérfanos; requiere mapeo previo. |

Priorizar siempre primero alto impacto + bajo riesgo (Instrumentación, Abort/parallel, Scroll tweaks) y luego alto impacto + riesgo medio con mitigaciones (Imágenes MVP, CartItem, Progressive Mount). Refactors altos riesgo (UniversalProductImage, Virtualización) después de contar con métricas y harness de pruebas.

### 16. Limitaciones de Esta Auditoría
- No se leyó cada archivo del repositorio (tiempo & volumen); se enfocó en cadena crítica marketplace/buyer.
- No se ejecutó build ni bundle analyzer en esta pasada (recomendado para confirmar supuestos de tamaño).
- No se perfilaron tiempos reales (faltan métricas instrumentadas para validar). 

### 17. Cómo Completar Auditoría Total
Script sugerido (pseudo):
```js
// 1. Medir complejidad ciclomática (usar ESLint + plugin complexity)
// 2. Generar mapa de dependencias (madge) y detectar ciclos residuales.
// 3. Extraer top 20 componentes por LOC & render frequency.
// 4. Ejecutar Lighthouse + Web Vitals en staging con 200/400/800 productos mock.
```

### 18. KPIs de Aceptación Post Mejora
- p75 LCP < 2.5s
- p95 filter->paint < 200ms
- p75 memory heap stable (no crecimiento >10% tras 5 filtros consecutivos)
- Re-renders `ProductCard` en cambio de filtro: 1 (propagate) / 0 (sin cambios visuales)

---
Fin análisis extendido.
