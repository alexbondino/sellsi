# Refactor Proposal: `ProductsSection.jsx`

Fecha: 2025-08-29  
Archivo analizado: `sellsi/src/domains/marketplace/pages/sections/ProductsSection.jsx`  
LOC actuales (aprox): 754  
Metric scoring (scanner): severidad "alto" (score 59)

---

## 1. Diagnóstico General

El componente concentra simultáneamente: layout responsivo complejo, cálculo de productos/paginación, lógica de infinite scroll híbrida, batching condicional de thumbnails, derivación de vista de proveedores vs productos, título dinámico, métricas, estados UI (loading, error, vacío), control de scroll (scroll-to-top), generación de tarjetas y adaptación responsiva (breakpoints). Esto viola principios de Single Responsibility y genera:

**Indicadores de complejidad/smells:**
1. Tamaño (>700 LOC) y alta densidad de hooks y memos => mayor coste cognitivo, difícil onboarding y testing granular.
2. Mezcla de capas: UI (presentación), dominio (derivar proveedores únicos), infraestructura UX (scroll listeners, throttling), optimizaciones (batching) y feature flags en un archivo.
3. Repetición conceptual: Dos mecanismos de reducción de carga (batchedProducts + visibleProducts / infinite scroll) coexisten y se solapan (se elige `(batchedProducts || visibleProducts)` en el map). Esto puede introducir bugs sutiles (orden, duplicados o corte prematuro).
4. Criterios responsivos y de paginación codificados (hard-coded magic numbers) dispersos dentro de un gran objeto `responsiveConfig` difícil de reutilizar y testear.
5. Lógica de derivación de proveedores incrustada (map + set + enriquecimiento) que debería pertenecer a un selector reutilizable (posible memo global via Zustand / React Query / selector puro).
6. Control manual de scroll con listeners window + throttling artesanal; no se desacopla, difícil migrar a IntersectionObserver.
7. Uso extenso de `useMemo` y `useCallback` posiblemente innecesario en algunos casos (micro-optimización) aumentando ruido visual. Riesgo de falsa sensación de performance (si dependencias cambian a menudo el beneficio es bajo).
8. El fallback de key `producto.id || producto.productid` revela heterogeneidad de datos (inconsistencia en naming) que debería normalizarse antes de llegar a la capa de UI.
9. Responsiveness y layout: definiciones densas en objetos JS; se podría externalizar a un `const layoutTokens` para clarificar.
10. Ausencia de pruebas unitarias para: a) lógica de paginación híbrida, b) derivación de proveedores, c) batching.
11. Estado derivado duplicado: `memoizedProducts` -> `currentPageProducts` -> `visibleProducts` -> `batchedProducts`. Cadena larga amplifica posibilidades de incoherencia.
12. Condicionales UI grandes dentro del render principal (loading/error/vacío/lista) — oportuno extraer en subcomponentes.
13. Dependencia de `FeatureFlags?.ENABLE_VIEWPORT_THUMBS` dispersa; sería mejor encapsular la estrategia de slicing en un hook único: `useProgressiveReveal(products, flags)`.
14. Accesibilidad: Botón FAB sin `aria-label` explícito (confía en icono). Faltan roles/labels en estado vacío.
15. Internacionalización: Strings embebidos y emojis (🔥, ⭐, ✨, 😞) reducen consistencia futura; extraer a módulo de i18n / constants.
16. Métricas de proveedores calculadas cada render (aunque memo), pero podrían estar en un selector global dada su reutilización potencial.

Conclusión: Requiere refactor modular incremental, priorizando desacople de lógica de datos, reducción de complejidad de render y consolidación de mecanismos de carga progresiva.

---

## 2. Objetivos del Refactor

Ordenados por valor vs esfuerzo (alto valor primero):
1. Extraer lógica de derivación y normalización de productos/proveedores en un selector reutilizable y testeable.
2. Unificar estrategia de carga progresiva (decidir entre batching O infinite scroll híbrido) y encapsular en un hook configurable.
3. Reducir el componente principal a un contenedor presentacional orquestador (<= 250 LOC objetivo).
4. Externalizar configuración responsiva y números mágicos a tokens / constants versionadas.
5. Aislar la paginación en un subcomponente reutilizable (`<ResponsivePagination />`).
6. Introducir tests (unit + hook) para: paginación, progressive reveal, derivación proveedores, cálculo páginas.
7. Normalizar `product.id` vs `product.productid` antes de render (adapter layer).
8. Mejorar accesibilidad (aria-labels, roles, announce en cambios de página) y preparar para i18n.
9. Simplificar memoización (mantener solo donde hay evidencia de beneficio real o objetos nuevos).
10. Documentar contrato de props y casos edge (0 productos, cambio de seccionActiva, cambio providerView en caliente).

---

## 3. Segmentación en Módulos / Hooks Propuestos

| Componente / Hook | Responsabilidad | Archivo sugerido | Notas |
|-------------------|-----------------|------------------|-------|
| `ProductsSectionContainer` | Orquestación: obtiene datos normalizados, decide render. | `pages/sections/ProductsSection/ProductsSectionContainer.jsx` | Reemplaza archivo actual (wrapper). |
| `ProductsSectionView` | Render puramente presentacional (layout, slots) | `pages/sections/ProductsSection/ProductsSectionView.jsx` | Recibe props ya calculadas. |
| `useProductsDerivation` | Normaliza lista, filtra activos, deriva vista proveedor. | `hooks/useProductsDerivation.js` | Devuelve `{items, providersCount}` |
| `useProgressiveProducts` | Maneja batching + infinite scroll/paginación unificada. | `hooks/useProgressiveProducts.js` | API declarativa con opciones. |
| `useScrollToTopFab` | Estado FAB (mostrar/ocultar) y handler scroll-to-top. | `hooks/useScrollToTopFab.js` | Reusable. |
| `ResponsivePagination` | Componente de paginación adaptativa. | `components/ResponsivePagination.jsx` | Sin dependencia de productos. |
| `EmptyState` | Estado vacío reusable (productos/proveedores). | `components/EmptyState.jsx` | Prop para mensaje/acción. |
| `ErrorState` | Estado de error simple. | `components/ErrorState.jsx` | |
| `ProductsGrid` | Renderiza tarjetas con layout tokens. | `components/ProductsGrid.jsx` | Acepta `items`, `renderItem`. |
| `layoutTokens` | Breakpoints, columns, gaps, counts. | `constants/layoutTokens.js` | Versionar. |
| `productsI18n` | Strings / labels / emojis controlados. | `constants/productsI18n.js` | Evita literals en JSX. |
| `productAdapter` | Normaliza id, campos de proveedor, logo. | `adapters/productAdapter.js` | Idempotente. |

---

## 4. Contratos Propuestos (Ejemplos)

`useProductsDerivation(products, { providerView })` => `{ items, providersCount }`

Reglas:
1. Si `providerView=true`: agrupar por `supplier_id` solo productos activos (`isProductActive`).
2. Enriquecer proveedor: `name, logo_url, descripcion, product_count`.
3. Garantizar `id` único para tarjeta (e.g. `provider:${supplier_id}`) para evitar colisiones con productos.

`useProgressiveProducts(items, options)` => `{ pageItems, page, totalPages, loadMore(), canLoadMore, setPage(page) }`

Opciones iniciales:
```ts
type ProgressiveOptions = {
	strategy: 'infinite' | 'paged' | 'hybrid';
	pageSizeBase: number; // fallback  (ej. 20)
	responsiveMap: Record<Breakpoint, { pageSize:number; initial:number; batch:number; preloadTrigger:number }>;
	featureFlags?: { enableViewportThumbs:boolean };
};
```

Internamente la estrategia `hybrid` aplica infinite hasta `pageSize`, luego paginación.

---

## 5. Refactor Incremental (Roadmap)

### Fase 1 (Baja Riesgo / Preparación)
1. Crear `productAdapter` y usarlo localmente dentro del componente actual (sin mover nada más). Asegurar keys uniformes.
2. Extraer layout tokens a `layoutTokens.js` y reemplazar literales.
3. Añadir `aria-label` al FAB y estado vacío.
4. Añadir comentarios TODO en el archivo original delimitando secciones a extraer (facilita PRs pequeños).

### Fase 2 (Lógica de Datos)
5. Implementar `useProductsDerivation` (copiar lógica existente), incorporar tests unitarios.
6. Sustituir lógica inline de derivación por hook; medir diff en render counts con React DevTools (opcional).

### Fase 3 (Progressive / Pagination Unificado)
7. Implementar `useProgressiveProducts` con API simplificada; portar responsiveConfig dentro del hook.
8. Reemplazar estados: `currentPage`, `visibleProductsCount`, `isLoadingMore`, `batchSize`, `visibleCount` por estado consolidado del hook.
9. Eliminar uno de los dos flujos (mantener `hybrid` si business lo requiere) y remover el OR `(batchedProducts || visibleProducts)`.

### Fase 4 (Presentación Modular)
10. Crear `ProductsGrid`, `EmptyState`, `ErrorState`, `ResponsivePagination` y migrar UI.
11. Dividir archivo: `ProductsSectionContainer` (usa hooks) + `ProductsSectionView` (render puro, sin side-effects).

### Fase 5 (Optimización / Limpieza)
12. Revisar y reducir `useMemo` redundantes. Mantener sólo en: `sectionTitle` (dep de props), `derivedItems`, layout tokens si generan objetos nuevos.
13. Consolidar strings en `productsI18n` y preparar para i18n (clave -> texto).
14. Añadir pruebas de regresión visual (Storybook / Chromatic) si disponible, o snapshots simples de render.

### Fase 6 (Hardening)
15. Añadir test de scrolling (JSDOM + simulate scroll) para asegurar `preloadTrigger`.
16. Documentar en README interno el contrato de cada hook.
17. Medir performance (Time to first interactive render, número de renders por interacción de filtro) antes y después.

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cambio en orden de productos al normalizar | UI inconsistente | Tests que comparen orden original vs derivado (cuando providerView=false). |
| Duplicados de proveedores | Conteo incorrecto | Set + id compuesto, test unitario. |
| Pérdida de comportamiento híbrido | UX degradada | Mantener flag temporal `ENABLE_HYBRID_SCROLL` para togglear. |
| Regresión en métricas de carga (más JS por división) | Performance | Code splitting / lazy import de subcomponentes pesados. |
| Nuevos bugs en triggers de preload | Carga incompleta | Test scroll + instrumentation logs (sólo en dev). |

---

## 7. Métricas de Éxito (KPIs Post-Refactor)

1. LOC del componente contenedor < 250.
2. Cobertura de tests (>80%) sobre hooks críticos.
3. Reducción de renders re-paginating (medido con profiler) al menos -30%.
4. Eliminación de listeners duplicados de scroll (1 único manejado por hook o IntersectionObserver).
5. Tiempo de primera interacción sin degradación (> = baseline actual).
6. Lighthouse / Core Web Vitals sin deterioro (Largest Contentful Paint estable).

---

## 8. Ejemplo Simplificado del Contenedor Futuro (Conceptual)

```jsx
// ProductsSectionContainer.jsx (borrador conceptual)
import { useProductsDerivation } from '../../hooks/useProductsDerivation';
import { useProgressiveProducts } from '../../hooks/useProgressiveProducts';
import ProductsSectionView from './ProductsSectionView';

export default function ProductsSectionContainer(props) {
	const { seccionActiva, isProviderView, productosOrdenados, totalProductos } = props;
	const { items, providersCount } = useProductsDerivation(productosOrdenados, { providerView: isProviderView });
	const progressive = useProgressiveProducts(items, { strategy: 'hybrid' });
	return (
		<ProductsSectionView
			{...props}
			items={progressive.pageItems}
			totalPages={progressive.totalPages}
			currentPage={progressive.page}
			onChangePage={progressive.setPage}
			loadMore={progressive.loadMore}
			canLoadMore={progressive.canLoadMore}
			providersCount={providersCount}
		/>
	);
}
```

---

## 9. Testing Plan

Pruebas unitarias (Jest + Testing Library):
1. `useProductsDerivation`
	 - agrupa proveedores activos
	 - ignora productos inactivos
	 - mantiene orden original para vista productos
2. `useProgressiveProducts`
	 - pageSize y initial loads correctos por breakpoint simulado
	 - `loadMore` no excede límites
	 - `setPage` resetea conteo visible
3. `ResponsivePagination`
	 - Render de páginas correctas para bordes (inicio, fin, pocos elementos)
4. Adaptador de IDs
	 - Normaliza `productid` -> `id`

Pruebas de integración ligeras:
5. Render completo `ProductsSectionContainer` con datos stub (100 productos) validando batching vs paginación.
6. Simular scroll hasta near-bottom y verificar incremento de elementos visibles.

---

## 10. Accesibilidad (A11y) Mejoras Planeadas
1. FAB: `aria-label="Subir al inicio"`.
2. Región principal: `role="region" aria-label="Listado de productos"`.
3. Anunciar cambios de página: `aria-live="polite"` con texto oculto.
4. Botón "Limpiar filtros" -> añadir `aria-describedby` si hay texto contextual.

---

## 11. Plan de Despliegue y Rollback
1. Feature branch: `refactor/products-section-modular`.
2. PR 1: Fase 1 + tests básicos (sin cambios de UI visibles).
3. PR 2: Hooks (`useProductsDerivation`).
4. PR 3: `useProgressiveProducts` + remover lógica antigua.
5. PR 4: División presentacional + componentes auxiliares.
6. PR 5: Limpieza de memos / i18n / a11y.
7. Monitoreo: activar flag de fallback que mantenga versión original detrás de `FeatureFlags.OLD_PRODUCTS_SECTION` durante 1 release.
8. Rollback: Reinvertir flag o revert PR 4 (el resto de preparaciones son benignas).

---

## 12. Quick Wins Inmediatos (si se necesita impacto rápido)
1. Añadir `aria-label` al FAB y extraer strings críticos.
2. Extraer derivación proveedores a función pura local (`deriveProviderCards`).
3. Remover OR ambiguo `(batchedProducts || visibleProducts)` dejando uno temporal claro.
4. Centralizar números mágicos de responsive en un objeto exportado.

---

## 13. Decisiones Pendientes
| Decisión | Opciones | Recomendación inicial |
|----------|----------|-----------------------|
| Estrategia de carga | only pagination / infinite / hybrid | Mantener hybrid pero encapsulada en hook. |
| i18n | Implementar ahora vs diferir | Extraer strings a constants ya, i18n completo luego. |
| IntersectionObserver | Adoptar ya vs continuar scroll listener | Adoptar en hook progressive (mejor performance & legibilidad). |
| Virtualización (react-window) | Sí/No | Evaluar tras medición; si > 500 items simultáneos visibles, considerar. |

---

## 14. Beneficios Esperados
1. Mantenibilidad: Menor tiempo para cambiar reglas de paginación (<5 min vs >20 min).
2. Testeabilidad: Lógica de derivación aislada = cobertura real de domain selectors.
3. Performance: Menos renders y menos cálculo redundante al cambiar breakpoints o flags.
4. Escalabilidad: Fácil agregar nueva vista (ej. "colecciones") reusando hooks.
5. Accesibilidad e internacionalización preparadas.

---

## 15. Checklist de Conclusión (Definición de Hecho Refactor)
[] Archivo original <= 250 LOC
[] Hooks creados y testeados
[] Sin listeners de scroll inline
[] Estrategia de progressive única
[] Strings externalizados
[] A11y labels añadidos
[] Métricas performance sin regresión
[] Documentación actualizada (este archivo + README interno)

---

## 16. Resumen Ejecutivo

El refactor es necesario debido a complejidad acumulada y mezcla de responsabilidades. Se propone modularizar en capas (adapters, hooks, view) con una estrategia incremental de PRs para minimizar riesgo. Enfocarse primero en estabilizar datos y unificar estrategia de carga, luego desacoplar presentación y optimizar. Esto habilitará extensiones futuras (virtualización, caching por secciones) con menor coste.

---

Fin del análisis.

---

## 17. Análisis de Cohesión y Acoplamiento (Más Profundo)

Dimensiones evaluadas sobre el archivo actual:

- Cohesión (interna): Baja. El archivo mezcla responsabilidades de: derivación de datos, control de scroll, UI de paginación, responsive design tokens, branching según feature flags, estados de red (loading/error), y semántica de vista proveedor vs productos. Cada grupo no refuerza directamente a los otros (Cohesión Accidental / Temporal).
- Acoplamiento Externo: Moderado-Alto. Depende de múltiples utilidades (`isProductActive`, `FeatureFlags`, `useCartStore`, `LoadingOverlay`, íconos, `ProductCard`). Esto hace difícil aislarlo en tests sin mocking agresivo.
- Acoplamiento Semántico: El componente conoce detalles de naming (`supplier_id`, `descripcion_proveedor`, `logo_url`), lo que insinúa fuga de la capa de dominio hacia UI.

Objetivo: Mover hacia alta cohesión por propósito (cada archivo/responsabilidad) y acoplamiento explícito vía props tipadas/adaptadores.

## 18. Análisis de Flujo de Datos (Actual vs Propuesto)

Actual (simplificado textual):
1. props.productosOrdenados -> filtrado condicional (providerView) -> set/map -> array -> `memoizedProducts`
2. `memoizedProducts` -> slice paginación -> `currentPageProducts` -> slice visible -> `visibleProducts` (branch A)
3. `memoizedProducts` -> batching (feature flag) -> `batchedProducts` (branch B)
4. Render usa `(batchedProducts || visibleProducts)` (resolución OR ambigua)

Problemas: Camino dual (A/B) genera incertidumbre sobre cuál prevalece, potencial inconsistencia en contadores UI.

Propuesto:
`rawProducts` -> `productAdapter[]` -> `deriveItems(providerView)` -> `items` -> `progressive = useProgressiveProducts(items, config)` -> `progressive.pageItems` -> render.

Ventaja: Camino lineal, un único origen de verdad, punto central de control de métrica/performance.

## 19. Clasificación de Code Smells Concretos

| Smell | Ejemplo | Tipo | Mitigación |
|-------|---------|------|------------|
| Long Component | 700+ LOC | Mantenimiento | Split container/view/hooks |
| Divergent Change | Añadir nueva vista (proveedores) modifica múltiples secciones | Evolutivo | Extraer derivación a hook |
| Shotgun Surgery | Cambiar reglas de breakpoints implica editar varios literales | Evolutivo | Centralizar tokens |
| Feature Envy | UI manipulando estructura de dominio proveedor | Diseño | Introducir adapter |
| Primitive Obsession | Magic numbers en config responsive | Diseño | Constantes tipadas |
| Inappropriate Intimacy | Conocimiento de campos DB en UI | Diseño | Adapter / DTO |
| Speculative Generality (memos) | useMemo en objetos estáticos | Performance | Remover memos innecesarios |
| Inconsistent Data Keys | `id || productid` | Robustez | Normalizar ID cuando se recibe |

## 20. Árbol de Decisiones para Estrategia de Carga

Preguntas guía:
1. Número máximo típico de productos simultáneos? (si > 300, considerar virtualización)
2. Frecuencia de cambios de filtro? (alta = evitar costosa recomputación)
3. Requerimiento SEO server render? (infinite puro puede retrasar contenido)

Conclusión preliminar: Mantener híbrido encapsulado. Virtualización condicional (flag) tras medición real.

## 21. Instrumentación Recomendada (Solo Refactor, No Feature)

Agregar (temporal, dev-only):
```js
if (process.env.NODE_ENV === 'development') {
	performance.mark('ps:render:start');
}
// ...al final del render effect
if (process.env.NODE_ENV === 'development') {
	performance.mark('ps:render:end');
	performance.measure('ProductsSectionRender', 'ps:render:start', 'ps:render:end');
}
```
Luego mover esto a un util `debugPerf(name)` para reutilizar y remover fácilmente.

Métricas a capturar antes/después:
- Tiempo promedio de montaje inicial.
- Número de renders por cambio de página.
- Cantidad de listeners activos.

## 22. Plan de Reducción de `useMemo` / `useCallback`

Categorizar cada memo:
1. Layout objects estáticos (sin deps) -> Convertir en constantes fuera del componente.
2. Computaciones ligeras sin costosa iteración -> Eliminar memo.
3. Derivaciones dependientes de arrays grandes -> Mantener (ej: derivación de proveedores, slicing page).
4. Handlers triviales (ej: `scrollToTop`) -> Se pueden dejar sin memo (estables via referential equality no crítica) o declarar fuera si no necesitan cierre.

Resultado esperado: -30% líneas dedicadas a memos, legibilidad +.

## 23. Tipado y Estabilidad de Props (Pseudo TypeScript)

```ts
interface ProductsSectionProps {
	seccionActiva: 'todos' | 'nuevos' | 'ofertas' | 'topVentas';
	setSeccionActiva: (s: ProductsSectionProps['seccionActiva']) => void;
	totalProductos: number; // Consistente con productosOrdenados.length (validate)
	productosOrdenados: Array<RawProduct>;
	resetFiltros: () => void;
	hasSideBar?: boolean;
	titleMarginLeft?: number | string;
	loading: boolean;
	error?: string | null;
	isSideBarCollapsed?: boolean;
	isProviderView?: boolean;
}

interface RawProduct {
	id?: string | number;
	productid?: string | number;
	supplier_id?: string | number;
	proveedor?: string; // alias nombre proveedor
	supplier_logo_url?: string;
	descripcion_proveedor?: string;
	active_status?: string | number | boolean; // interpretado por isProductActive
	// ...otros campos
}
```

Se sugiere crear `NormalizedProduct` y `ProviderCardModel` para fase 2.

## 24. Adapter Layer (Detalle)

Objetivo: Normalizar al inicio; coste O(n) amortizado. Evita condicionales repetidos.

```js
export function productAdapter(raw) {
	return {
		id: raw.id ?? raw.productid,
		supplierId: raw.supplier_id ?? null,
		supplierName: raw.proveedor ?? 'Proveedor desconocido',
		supplierLogo: raw.supplier_logo_url || '/LOGO-removebg-preview.webp',
		supplierDescription: raw.descripcion_proveedor || null,
		active: isProductActive(raw),
		original: raw,
	};
}
```

## 25. Derivación Proveedores (Detalle Algorítmico)

Pseudo-código optimizado (una sola pasada, sin Map adicional si se acepta objeto plano):
```js
function deriveProviders(products) {
	const providers = Object.create(null);
	for (const p of products) {
		if (!p.active || !p.supplierId) continue;
		const key = p.supplierId;
		if (!providers[key]) {
			providers[key] = {
				id: `provider:${key}`,
				providerId: key,
				name: p.supplierName,
				logo: p.supplierLogo,
				description: p.supplierDescription,
				productCount: 1,
			};
		} else {
			providers[key].productCount++;
		}
	}
	return Object.values(providers);
}
```

Complejidad: O(n). Memoria: O(k) (k proveedores únicos).

## 26. Estrategia Unificada de Progressive Products (Modelo de Estado)

Estado interno propuesto:
```ts
interface ProgressiveState {
	page: number;
	pageSize: number; // derivado breakpoint
	initial: number;
	batch: number;
	preloadTrigger: number;
	visible: number; // para infinite/hybrid
}
```

Transiciones:
1. `SET_BREAKPOINT` -> recalcula pageSize / initial / batch / preloadTrigger; reinicia visible si tamaño cambió.
2. `SET_PAGE` -> page = n; visible = initial.
3. `LOAD_MORE` -> visible = min(visible + batch, totalPageItems).

Un único reducer simplifica pruebas.

## 27. Virtualización (Evaluación Técnica)

Condiciones para incorporar `react-window`:
1. Altura relativamente homogénea de tarjetas (grid). Si variable, requiere `VariableSizeGrid` (más complejo).
2. Número de items visible > 200 con scroll rápido.
3. Performance baseline muestra scripting > 50ms en interacción de scroll.

Plan diferido: Hook `useVirtualizedProducts(items, enabled)` que wrapee condicionalmente.

## 28. Alineación con Principios de Refactor (Sin Nuevas Features)

Todo cambio propuesto transforma estructura interna sin modificar comportamientos observables (UI/UX, resultados, accesibilidad final — salvo mejoras menores a11y). Nuevos hooks son re-expresiones de lógica existente. Las únicas variaciones permitidas: eliminación de condiciones redundantes y consolidación de rutas de datos (sin afectar orden ni conteos). Se recomienda snapshot tests previos para validar equivalencia.

## 29. Matriz de Pruebas (Ampliada)

| Escenario | Variantes | Verificaciones |
|-----------|-----------|----------------|
| Vista productos | breakpoints xs/md/xl | Count, paginación, scroll more |
| Vista proveedores | lista con duplicados proveedor | Dedupe, conteo correcto |
| Sin productos | providerView true/false | Mensajes, botón reset |
| Error | string de error | Render ErrorState, no grid |
| Feature flag batching on/off | productos > batch | Diferencia en elementos iniciales |
| Cambio seccionActiva | 'todos'->'nuevos' | Reset página y scroll top |
| Scroll near bottom | variación preloadTrigger | Llama loadMore antes del final |
| Cambio rápido de breakpoint | resize simulada | Recalcula pageSize y resetea visible |

## 30. Linting / Calidad Específica

Añadir reglas custom (o comentarios TODO para plugin interno):
1. `no-magic-responsive-numbers`: Detectar literales numéricos en config responsive fuera de tokens.
2. `enforce-product-adapter`: Uso directo de `producto.id || producto.productid` prohibido tras adapter.
3. `no-window-scroll-listener-inline`: En componente UI prohibido, debe vivir en hook.

## 31. Estrategia de Code Splitting

- `ProductsSectionContainer` carga siempre.
- Subcomponentes raramente visibles (EmptyState, ErrorState) pueden agruparse; su peso es bajo, se puede ignorar splitting inicial.
- Si `ProductCard` es pesado y soporta provider vs buyer con lógica condicional, evaluar separar `ProviderCard` liviano.

## 32. Gestión de Feature Flags Durante Refactor

Introducir flags temporales (se eliminan al final):
```js
FeatureFlags = {
	OLD_PRODUCTS_SECTION: false, // fallback rollout
	ENABLE_HYBRID_SCROLL: true,  // permitir togglear a paged only
}
```
Controlar divergencia evitando añadir lógica nueva bajo estos flags (solo selects de rama de implementación antigua/nueva).

## 33. Estrategia de Commits / PRs Granulares

| PR | Contenido | Riesgo |
|----|-----------|--------|
| 1 | Adapter + tokens + quick a11y | Bajo |
| 2 | Hook derivación + tests | Medio |
| 3 | Hook progressive + remover estados antiguos | Medio |
| 4 | Split container/view + subcomponentes | Medio |
| 5 | Limpieza memos + i18n extracción | Bajo |
| 6 | Flags removal + doc final | Bajo |

## 34. Validación de Equivalencia (Golden Master)

Capturar baseline: Serializar (en dev) JSON:
```js
console.log('[GM] productsSectionState', {
	seccionActiva,
	productsLen: productosOrdenados.length,
	derivedLen: memoizedProducts.length,
	page: currentPage,
	visible: visibleProductsCount,
});
```
Tras refactor, comparar estructura (permitiendo cambio de nombres de campos). Útil para detectar divergencias accidentales.

## 35. Evaluación de Riesgo de Regresión por Categoría

| Categoría | Probabilidad | Impacto | Nota |
|-----------|--------------|---------|------|
| Paginación | Media | Alta | Cambia bastante el flujo de estado |
| Vista proveedores | Media | Media | Algoritmo agrupación movido |
| Scroll load | Alta | Media | Reescritura a hook central |
| A11y | Baja | Baja | Añade atributos, no rompe |
| Performance | Media | Positiva | Consolidación reduce cálculos duplicados |

## 36. Plan de Reversión Express

1. Mantener archivo original renombrado `ProductsSection.legacy.jsx` hasta PR 5.
2. Flag `OLD_PRODUCTS_SECTION` conmuta entre versiones añadiendo wrapper:
```jsx
export default function ProductsSectionGate(props) {
	if (FeatureFlags.OLD_PRODUCTS_SECTION) return <LegacyProductsSection {...props}/>;
	return <ProductsSectionContainer {...props}/>;
}
```
3. Reversión = toggle flag + revert commits de hooks si fuese crítico.

## 37. Métricas Técnicas Previstas (Hipótesis)

| Métrica | Antes | Después (objetivo) |
|---------|-------|--------------------|
| LOC componente principal | ~754 | <= 220 |
| Hooks internos | 0 | 2-3 reutilizables |
| Listeners scroll | 1 inline | 1 en hook (o 0 con IntersectionObserver) |
| Renders por cambio página | n (medir) | n - 30% |
| Tiempo derivación proveedores (ms/1000 items) | ~X (medir) | ~igual (O(n) estable) |

## 38. Lista de Chequeo de Refactor Seguro (Pre-Merge de Cada PR)

1. Build pasa.
2. ESLint sin nuevas advertencias.
3. Tests nuevos + existentes verdes.
4. Manual QA en breakpoints clave (xs, md, xl).
5. Diff visual (capturas automáticas) sin cambios no aprobados.
6. Flag fallback funcional.

## 39. Resumen Ejecutivo Ampliado

Se profundiza el análisis confirmando que la complejidad actual obstaculiza mantenibilidad y escalabilidad. El plan de refactor NO introduce nuevas funcionalidades; reorganiza lógica existente en capas claras (adapter -> derivation hook -> progressive hook -> presentational view). Se aplican patrones estándar (separación de concerns, reducer state modeling, golden master testing). El enfoque incremental con feature flag reduce riesgo y facilita rollback inmediato. Resultará en código más claro, testeable y preparado para optimizaciones futuras (virtualización, i18n, SSR parcial) sin deuda adicional.

---

Fin de ampliación de análisis.

