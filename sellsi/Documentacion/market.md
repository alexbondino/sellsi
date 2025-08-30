## Auditoría Profunda Buyer / Marketplace (2025-08-30)

Estado actual evaluado sobre branch `staging`.

### Resumen Ejecutivo
El marketplace buyer tiene una base decente de optimizaciones (memoización, separación de hooks, carga progresiva), pero aún presenta riesgos de performance y mantenibilidad en:
1. Ausencia de virtualización real para listas grandes (no se usa react-window / virtualization).
2. Fragmentación de dominios marketplace (carpetas duplicadas) elevando riesgo de imports inconsistentes.
3. Carga potencialmente excesiva de imágenes (falta de política clara de tamaños, formatos WebP / AVIF adaptativos y prioridad de LQIP / blur placeholders generalizada).
4. Re-renderizaciones evitables por dependencias amplias y uso de objetos inline en estilos.
5. Falta de límites / abort controllers en fetches encadenados (ej. tiers, thumbnails) → riesgo de race conditions y trabajo desperdiciado.
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
| Gestión de tiers (`useProductPriceTiers`) | No hay abort/cancel + falta de caching TTL | Over-fetch y race conditions | Hook invocado por cada card | Añadir `AbortController`, cache Map(time), dedupe por productId. |
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
| Estilos inline repetidos | Objetos recreados (aunque algunos memoizados) | GC churn y ruido para diffing | Centralizar tokens en theme + styled components ligeros. |
| Faltan boundaries de Suspense/lazy segmentados | Grandes waterfalls en primera carga de vista | Percepción de lentitud | Introducir `React.lazy` sectorizado (FilterPanel, ProductGrid, AddToCart modal). |
| AddToCart lógica dentro de `ProductCardBuyerContext` | Estado local abre modal bloqueando navegación | UX inconsistente | Mover control a un hook + delegar a contexto de Cart para batching. |
| Falta de instrumentation (Sentry Performance parcial) | No hay feedback real para priorizar | Optimización a ciegas | Agregar marcadores `performance.mark/measure` + spans Sentry alrededor de fetch product list, render grid, imagen decode. |

### Hallazgos Medios
| Área | Problema | Impacto | Acción |
|------|----------|---------|--------|
| `useMarketplaceLogic` | Mezcla responsabilidades (UI offsets + switching provider/products + filtros) | Dificulta escalado | Segregar en hooks: `useMarketplaceViewMode`, `useMarketplaceFilters`, `useMarketplaceLayoutConfig`. |
| `ProductCard` altura/ancho hardcode con objetos responsive | Cambio de diseño complejo; inconsistencia futura | Parametrizar con design tokens (`card.size.variant`). |
| Scroll listeners manuales (scrollToTop) | No throttling / passive explicit | Menor, pero puede agregar overhead | Añadir `{ passive: true }` + util throttle (requestAnimationFrame). |
| Cálculo de price tiers en `ProductCardBuyerContext` | `Math.min/Math.max` sobre arrays cada render de tiers no cacheados | Micro overhead | Cache memo sobre stringified tier signature. |
| Shipping en carrito | Lógica mezclada con UI + múltiples condiciones | Riesgo de errores al agregar nuevos modos | Extraer `useCartItemShipping(itemId)` + map config-driven. |

### Hallazgos Bajos / Observaciones
| Área | Nota | Acción Opcional |
|------|------|----------------|
| `React.memo` aplicado ampliamente | Correcto, pero requiere pruebas de aciertos (profiling) | Capturar % de renders evitados con DevTools. |
| Comentarios extensos en componentes | Ayuda onboarding pero alarga archivos | Trasladar a documentación MD y mantener comentarios críticos. |
| Hook `useMarketplaceLogic` ya memoiza handlers | Buen patrón | Mantener y agregar pruebas. |

### Métricas Faltantes (Debe instrumentarse)
- LCP (tiempo hasta imagen principal de primer fold del grid).
- CLS (cambios de layout por carga tardía de imágenes sin dimensiones fijas).
- Tiempo fetch -> first render de `ProductsSection`.
- Cantidad de renders por `ProductCard` al cambiar filtros.
- Throughput de scroll (fps) con 200 / 500 / 1000 productos mockeados.

### Plan de Mejora Priorizado (0 = mayor prioridad) – SIN virtualización obligatoria
| Prioridad | Tarea | Tipo | ETA |
|-----------|-------|------|-----|
| 0 | Instrumentación (marks LCP, CLS, render_grid, fetch_products) + spans Sentry | Observabilidad | 0.5 d |
| 0 | Política de imágenes: generación variantes + `srcset` + placeholder blur + `fetchpriority` | Perf | 1 d |
| 1 | Refactor `CartItem` (subcomponentes + memo + hooks) | Perf / DX | 0.5–1 d |
| 1 | Cache & abort en `useProductPriceTiers` + throttle peticiones | Robustez | 0.25 d |
| 2 | Segregar `useMarketplaceLogic` en 3 hooks y exponer compose | DX | 1 d |
| 2 | Consolidar carpetas duplicadas marketplace | DX | 0.5–1 d |
| 2 | Implementar estilo centralizado de tarjetas (design tokens) | DX | 0.25 d |
| 3 | Batching de montaje de ProductCards (IntersectionObserver + cola) | Perf | 0.5 d |
| 3 | Scroll listeners pasivos + raf throttle | Perf menor | 0.1 d |
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
	- Uso de `fetchpriority="high"` solo para 1–2 primeras imágenes (LCP candidates).
	- Añadir `decoding="async"` y `loading="lazy"` default.
	- Placeholder blur base64 (≤ 400B) en `style={{ backgroundImage: 'url(data:image/... )' }}` hasta `onLoad`.
4. Red de Datos
	- Añadir cache in-memory para tiers: `Map(productId => { data, expires })` TTL 5 min.
	- Agrupar peticiones de tiers en batch (si API lo permite) cada frame.
5. JS / Bundle
	- Code-split AddToCart modal pesado (si incluye lógica extra) usando `lazy(() => import(...))`.
	- Revisión de dependencias MUI: evitar importar icon packs completos (ya parece tree-shakeado).
6. Estilos
	- Reemplazar objetos sx repetitivos por variantes MUI (`components.MuiCard.variants`).
	- Consolidar sombras y transiciones en theme.
7. Accesibilidad / UX
	- Garantizar `aria-busy` en contenedor grid durante carga incremental.
	- Paginación: añadir `aria-current` (ya se aplica) y roles en botones.
8. Rendimiento de Scroll
	- Throttle listener a 1 por frame (raf) + `passive:true`.
9. Memoria
	- Evitar almacenar productos completos duplicados en múltiples estados (derivar en render directo). `productosOrdenados` ya suficiente; no duplicar `derivedItems` si solo re-map.
10. Observabilidad
	- Spans Sentry: `products.fetch`, `products.render.batch`, `image.decode.lcpCandidate`.

### Métricas Objetivo (Después de Mejora)
| Métrica | Objetivo | Método Verificación |
|---------|----------|---------------------|
| LCP (desktop mediano) | < 2.5s (p75) | Web Vitals + Sentry | 
| CLS | < 0.03 | Web Vitals | 
| Tiempo primer lote renderizado | < 600ms post data | Performance marks |
| Re-renders promedio `ProductCard` al cambiar filtro | ≤ 1 | React Profiler |
| Bytes imágenes primer viewport | < 250KB | Network tab |

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
El foco inmediato debe ser optimización perceptual (imágenes, lotes, abort/caching, instrumentación) antes de introducir complejidad de virtualización. Con catálogos medios, el modelo incremental bien afinado ofrece equilibrio UX/performance.

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
La arquitectura avanza en dirección correcta (hooks centralizados, memos selectivos, carga progresiva), pero necesita una siguiente fase de optimización estructural (virtualización, imágenes, segmentación de lógica y componentes) y observabilidad para sostener crecimiento.

---
Documento generado automáticamente (AI audit). Actualizar tras aplicar las mejoras de prioridad 0–1.

---

## Análisis Profundizado Adicional (Cobertura Extendida)

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
- Sistema robusto de fallback y fase de thumbnails. Oportunidades:
	- No hay `srcset` / `sizes` → ancho de banda excedente.
	- Falta de compresión adaptativa (WebP/AVIF). Implementar generación server-side + detección soporte.
	- Reintento único; si error transitorio 500 podría requerir jitter backoff.
	- `priority={true}` usado de forma amplia (ProductCard + Cart) → pérdida de efecto de priorización. Limitar a top fold + item principal del carrito.
	- No se fija `width` & `height` atributos → posible CLS residual (aunque se usa contenedor con height; verificar consistentemente en todos los contextos).

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
- Falta de `alt` específico en algunas variantes donde se delega a nombre genérico; incluir proveedor + nombre (ej: "Producto X de Proveedor Y").
- Botones de paginación incluyen `aria-label` correcto; añadir `role="navigation"` (ya existe) y `aria-live="polite"` a contenedor de resultados para anunciar cambios de filtro.
- Íconos decorativos podrían marcarse `aria-hidden="true"`.

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

### 15. Roadmap Técnicamente Refinado
| Fase | Objetivo | Entregables |
|------|----------|-------------|
| 1 | Observabilidad base | Marks + Sentry spans + logging estructurado (nivel perf) |
| 1 | Imágenes eficientes | srcset + sizes + prioridad selectiva + placeholder blur |
| 2 | Refactor CartItem | Subcomponentes + memo + pruebas render count |
| 2 | Reducir arrays derivados | Índices y selectors para filtrado/orden |
| 3 | Data pipeline paralela | Promise.all + abort + batching fetch tiers/users |
| 3 | Hooks segregados | `useMarketplaceFilters`, `useMarketplaceViewMode`, `useMarketplaceLayout` |
| 4 | Thumbnail pipeline avanzada | WebP/AVIF negotiation + quality adaptativa |
| 5 | Optional virtualization flag | Solo si dataset y métricas justifican |

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
