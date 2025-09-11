## Análisis Profundo Lighthouse `/buyer/marketplace` (Benchmark 2025-09-11)

### 1. Resumen Ejecutivo
El marketplace presenta una base saludable en respuesta inicial (TTFB ~60 ms) y FCP rápido (0.64 s), pero la experiencia percibida se degrada por: (a) LCP medianamente lento (2.36 s, score 0.51), (b) CLS alto (0.298, por encima del umbral 0.1), (c) carga y ejecución de JavaScript excesiva (Main Thread Work 3.76 s, JS Execution 2.36 s) que mantienen el TBT en 306 ms y el TTI en 3.66 s. La mayor palanca de mejora inmediata: optimizar el elemento LCP (preload + fetchpriority), estabilizar layout (dimensiones/`aspect-ratio` en imágenes y contenedores dinámicos) y recortar/fragmentar JS inicial.

### 2. Métricas Clave (Baseline y Objetivos)
| Métrica | Actual | Objetivo Próximo (1 sprint) | Objetivo Óptimo (Q) | Nota |
|---------|--------|----------------------------|---------------------|------|
| FCP | 0.64 s | ≤0.8 s (ya OK) | ≤0.8 s | Mantener |
| LCP | 2.36 s | ≤1.9 s | ≤1.6 s | Preload + sizing + carga crítica |
| Speed Index | 3.3 s | ≤2.7 s | ≤2.3 s | Menos JS crítico + pintura temprana |
| TBT | 306 ms | ≤220 ms | ≤150 ms | Code-splitting + off-main-thread |
| TTI | 3.66 s | ≤3.1 s | ≤2.7 s | Consecuencia de reducir JS |
| CLS | 0.298 | ≤0.15 | ≤0.08 | Dimensiones / placeholders |
| JS Exec Time | 2.36 s | ≤1.7 s | ≤1.2 s | Podar + dividir + diferir |
| Main Thread Total | 3.76 s | ≤2.6 s | ≤2.0 s | Igual que arriba |

### 3. Diagnóstico por Métrica
1. LCP (2.36 s, ahorro potencial 250–1150 ms indicado): Falta de preload / `fetchpriority="high"` y posible descubrimiento tardío del recurso (dinámico). CSS crítico probablemente no inlined para porción above-the-fold.
2. CLS (0.298): Imágenes sin `width/height` explícitos (auditoría "unsized-images" 0.5) + inserción tardía de bloques (cards, banners, quizá skeletons que cambian altura). Animaciones múltiples (26) pueden inducir micro-shifts si afectan layout (no composited transforms).
3. TBT / Main Thread: 7 long tasks + parsing/exec JS elevado (2.36 s). Indica bundle inicial abultado y/o módulos no diferidos (posibles librerías utilitarias, analytics, componentes no críticos).
4. Speed Index: Afectado por JS que bloquea pintura progresiva y posible tardanza en mostrar contenido principal (productos) si fetching coincide con render pesado.
5. Cache Policy: 4 recursos sin TTL larga (posiblemente no hashed o servidos sin `max-age` alto). Repetidas visitas no maximizan caché.
6. Prioritize LCP Image: Score 0 -> no se pre-carga el elemento LCP. Fácil mejora.
7. Unsized Images: Resta a CLS; cada reflow se multiplica por la cantidad de cards.
8. Preconnect: Advertencia por exceso de conexiones (>2). El overhead de conexiones innecesarias podría afectar ligeramente prioridades iniciales.

### 4. Árbol Causa → Efecto Simplificado
JS excesivo (bundle monolítico, librerías innecesarias, sincronismo) → Long tasks → TBT alto → TTI y Speed Index subóptimos.
Imágenes sin dimensiones + contenido insertado asincrónicamente + posible cambio de fuentes secundarias → Reflows → CLS alto.
LCP image descubierta tarde + sin preload/fetchpriority + posible decodificación tardía → LCP >2 s.
Cache corto en assets clave → Menor beneficio en visitas recurrentes → LCP/TBT varían más y peor experiencia repetida.

### 5. Plan de Acción Prioritario
#### Quick Wins (0–2 días)
1. Identificar elemento LCP real (hero banner / primer grid) y añadir:
	 `<link rel="preload" as="image" href="/ruta/hero.webp" imagesrcset="..." imagesizes="..." fetchpriority="high">`
2. Añadir `width` y `height` (o `aspect-ratio`) a TODAS las imágenes del above-the-fold y plantillas de card de producto.
3. Implementar placeholder con caja reservada (skeleton altura fija) que no cambie al hidratar.
4. Quitar preconnect redundantes: dejar solo orígenes críticos (API, CDN static assets, fonts si no self-hosted).
5. Ajustar `vercel.json` headers para estáticos hashed: `cache-control: public,max-age=31536000,immutable`.
6. Añadir `fetchpriority="high"` al `<img>` LCP (además del preload) y `decoding="async"` para otras.

#### Sprint 1 (1–2 semanas)
1. Code splitting: separar vendor pesado y módulos de rutas no críticas; lazy load de componentes secundarios (filtros avanzados, modales, chat, recomendaciones).
2. Eliminar/posponer scripts de terceros no esenciales hasta `requestIdleCallback` o interacción.
3. Extraer CSS crítico (critical CSS inline <14 KB) para layout inicial; diferir resto vía `media="print" onload` pattern o `rel=preload as=style` + swap.
4. Introducir Web Worker para tareas pesadas (p.ej. formateo de datos o cálculos de precios) si existen loops costosos.
5. Subsetting de fuentes (si TTF/WOFF2 >70 KB) + self-host y `font-display: swap` (ya OK) asegurando no cambian métricas (usar `font-size-adjust`).

#### Sprint 2 (2–4 semanas)
1. Refactor de componentes con re-render alto (memoización selectiva, dividir contextos grandes, usar signals o store ligero para listas grandes).
2. Implementar streaming / incremental rendering (si SSR disponible) o skeletons estables con datos chunked.
3. Implementar RUM (LCP, CLS, INP) y dashboards para regressions.
4. Evaluar imágenes next-gen (AVIF/WebP) con `type` fallback y `srcset` adaptativo.
5. Revisión de animaciones: migrar a `transform` / `opacity` + `will-change` limitado.

### 6. Recomendaciones Técnicas Detalladas
#### LCP
- Preload + `fetchpriority`.
- Evitar lazy-loading del LCP (quitar `loading="lazy"` si existe en hero).
- Asegurar que CSS del contenedor LCP esté enlined para evitar retraso por descarga del stylesheet principal.
- Comprimir y usar formato moderno (WebP/AVIF): objetivo <150 KB transferidos para hero.

#### CLS
- Atributos `width`/`height` o `aspect-ratio: w / h;` en contenedores de imagen.
- Reservar espacio para banners dinámicos (usar min-height fija) antes de que llegue data.
- Evitar insertar elementos sobre contenido ya pintado; en su lugar, ocupar placeholder desde el inicio.
- Revisar animaciones que cambien layout (usar `transform: translate/scale`).

#### Reducción JS / TBT
- Analizar treemap (ya disponible en Lighthouse) y bundle stats en `bundle-analysis/` para identificar módulos >50 KB.
- Dividir: `react`, `react-dom` con `modulepreload` y cargar features diferidos.
- Quitar polyfills universales; cargar condicionalmente (feature detection + dynamic import).
- Reemplazar librerías utilitarias grandes por alternativas específicas (ej: lodash modular, date-fns parcial, etc.).
- Mover lógica pesada de mapping/normalización a Web Worker.

#### Caching
- Configurar `vercel.json` headers: estáticos hashed (js/css/img) = 1 año immutable; imágenes dinámicas = `stale-while-revalidate=60`.
- ETag consistente para JSON (para 304 rápidos).

#### Imágenes
- `srcset` + `sizes` para hero y cards (evitar sobredescarga en desktop).
- Pre-cargar fuentes de iconos SOLO si impactan LCP.
- Usar `priority hints` y evitar `loading="lazy"` en las 1–2 primeras imágenes visibles.

#### Preconexiones
- Limitar a API (Supabase / dominio), CDN estático, y fonts (si CDN). Eliminar extras para reducir handshake.

#### Animaciones
- Asegurar `will-change` sólo en elementos animados y remover después para evitar overhead.

#### Monitoreo (RUM)
Implementar PerformanceObserver:
```js
// RUM básico LCP / CLS / INP
const metrics = {};
new PerformanceObserver((entryList) => {
	const last = entryList.getEntries().at(-1);
	metrics.LCP = last.startTime;
}).observe({ type: 'largest-contentful-paint', buffered: true });
new PerformanceObserver((entryList) => {
	for (const e of entryList.getEntries()) {
		if (!e.hadRecentInput) metrics.CLS = (metrics.CLS || 0) + e.value;
	}
}).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((entryList) => {
	metrics.INP = entryList.getEntries().at(-1).processingStart - entryList.getEntries().at(-1).startTime;
}).observe({ type: 'event', buffered: true, durationThreshold: 40 });
window.addEventListener('beforeunload', () => {
	navigator.sendBeacon('/rum', JSON.stringify(metrics));
});
```

#### Ejemplo Preload LCP
```html
<link rel="preload" as="image" href="/img/hero@1x.webp" imagesrcset="/img/hero@1x.webp 1x, /img/hero@2x.webp 2x" fetchpriority="high"> 
<img src="/img/hero@1x.webp" width="1200" height="480" alt="Ofertas" fetchpriority="high" decoding="async">
```

#### Placeholder Estable
```css
.product-card__img-wrapper { aspect-ratio: 4 / 5; background:#f4f4f4; overflow:hidden; }
.product-card__img-wrapper img { width:100%; height:100%; object-fit:cover; display:block; }
```

### 7. Checklist de Implementación (Orden Sugerido)
1. ✅ Preload + fetchpriority imagen LCP. (COMPLETADO)
2. ✅ Dimensiones / aspect-ratio en imágenes iniciales. (COMPLETADO)
3. ✅ Limpiar preconnect redundantes. (COMPLETADO)
4. ✅ Headers de caché en `vercel.json`.(COMPLETADO)
5. ✅ Quitar lazy en imágenes above-the-fold. (COMPLETADO)
6. ✅ Critical CSS inline + diferir resto. (COMPLETADO)
7. Code splitting (rutas / componentes pesados) + dynamic import.
8. Web Worker para tareas costosas (si identificadas >50 ms bloque). 
9. RUM instrumentation.
10. Optimizar animaciones + reducir long tasks.

### 8. Indicadores de Éxito Post-Optimización
- LCP P75 < 1.9 s en RUM (desktop y luego móvil real). 
- CLS P75 < 0.12.
- TBT laboratorio < 220 ms; INP RUM < 200 ms.
- Reducción >25% JS inicial (KB transferidos vs baseline). 
- Ratio de visitas repetidas con 304 / cache hit > 70% para assets.

### 9. Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Preload excesivo bloquea ancho de banda | Auditar waterfall tras cambios; limitar a 1–2 recursos críticos |
| Diferir scripts rompe dependencias | Usar `modulepreload` y probar en staging con monitoreo de errores |
| Cambios de layout por aspect-ratio incorrecto | Verificar proporciones reales antes del deploy |
| Code splitting introduce flashes de loading | Suspense + skeletons consistentes |
| Subsetting fuentes causa fallback visible | Ajustar `font-size-adjust` y probar en distintos navegadores |

### 10. Próximos Pasos Inmediatos
1. Implementar quick wins y volver a correr Lighthouse (mismo form factor) para cuantificar mejoras.
2. Añadir script RUM y recolectar datos reales 3–5 días.
3. Priorizar módulos para splitting usando tamaño y tiempo de parse (treemap / coverage).
4. Iterar sobre CLS hasta <0.15 antes de abordar optimizaciones más profundas.

### 11. Notas Finales
- Dado que el TTFB ya es muy bajo, las mejoras vendrán casi exclusivamente de front-end (network shaping, delivery, ejecución). 
- Mantener disciplina: cada nueva feature debe medir impacto (diff en bundle y LCP) antes y después.

---
Documento generado automáticamente a partir de `lighthouse.json` (2025-09-11). Ajustar conforme se disponga de métricas RUM reales.

