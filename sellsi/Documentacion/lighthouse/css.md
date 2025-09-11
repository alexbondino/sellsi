## Análisis SUPER PROFUNDO: Critical CSS inline + diferir resto

### 1. Objetivo
Reducir el tiempo hasta First Paint / LCP asegurando que el navegador pueda renderizar el contenido above-the-fold sin esperar la descarga completa del bundle CSS generado por Vite/MUI, inyectando únicamente las reglas mínimas críticas (Critical CSS) dentro de `<head>` y cargando el resto de forma no bloqueante (estrategia "inline critical + async remainder").

### 2. Contexto Actual
1. Stack: Vite + React + MUI (@mui/material + @emotion). Estilos runtime: combinación de CSS global (`index.css`, `App.css`) y estilos en JS (Emotion) que MUI inyecta dinámicamente (`<style data-emotion>`). 
2. `index.html` actualmente NO incluye hojas de estilo externas generadas (Vite inyecta `<link rel="stylesheet" ...>` en build final). 
3. Fonts ya self-host con `preload` (OK). 
4. No se aplica todavía extracción de CSS crítico → primera pintura depende de: 
	- Descarga + parse inicial JS que renderiza React + MUI (genera estilos) 
	- Descarga CSS global (si build genera) 
	- Layout + reflow posteriores cuando se inyectan estilos Emotion.
5. Riesgo: Bloqueo parcial de render (CSS + JS) + costosa hidratación de estilos MUI para elementos no visibles (p.ej. componentes inferiores, modales, etc.).

### 3. Beneficio Esperado
| Métrica | Impacto Previsto |
|---------|------------------|
| LCP | -120 a -300 ms (menos wait por CSS y estilos MUI iniciales) |
| FCP / FP | -80 a -200 ms |
| Speed Index | Mejora proporcional (pintura temprana estable) |
| CLS | Disminuye (evita reflow causado por aplicación tardía de estilos básicos) |
| TBT | Neutral / ligera mejora (menos recalculo de estilo temprano) |

### 4. Qué es Critical CSS Aquí
Constituye el subconjunto mínimo para que la PORCIÓN VISIBLE del `/buyer/marketplace` (viewport inicial) se renderice estable: 
1. Reset / base tipografía (html, body, root, fonts). 
2. Layout contenedor principal (#root, wrappers, grid container). 
3. Estilos MUI necesarios para: 
	- AppBar / Header (si visible en marketplace). 
	- Primeras filas de tarjetas de producto (grid + card container + dimensiones imagen). 
	- Tipografía y colores primarios (variantes `h5`, `body2`). 
4. Dimensiones y aspect-ratio de imágenes (para evitar CLS). 
5. States mínimos (hover no crítico → se puede omitir). 

NO incluir: 
- Animaciones no esenciales (logo spin, shimmer avanzado). 
- Scrollbar custom avanzado (puede ir diferido). 
- Estilos de componentes bajo el fold (paginación completa, modales, FAB, etc.).

### 5. Desafíos Específicos (React + MUI + Emotion)
| Desafío | Explicación | Estrategia |
|---------|-------------|------------|
| CSS-in-JS late injection | Emotion genera estilos en runtime tras montar componentes | Pre-render server-like (build script) o snapshot estático con `@emotion/server` para extraer estilos críticos |
| Variabilidad condicional (breakpoints) | MUI aplica media queries; viewport móvil vs desktop difieren | Generar 2 variantes (mobile-first + desktop) y combinarlas guardando sólo reglas usadas en fold |
| Riesgo de duplicación | Inlining + carga posterior puede duplicar reglas | Añadir marcador `data-critical` y purgar duplicadas en hoja diferida opcionalmente (coste/beneficio) |
| Evolución continua del layout | Cambios frecuentes invalidan snapshot critical | Automatizar extracción en script CI (`node scripts/extract-critical-css.cjs`) |

### 6. Estrategias Evaluadas
1. Manual (auditoria DevTools Coverage + copiar reglas) → Rápido, frágil. ❌
2. Penthouse + build estático (render headless la URL) → Robusto para CSS tradicional, pero no captura Emotion hasta ejecutar JS. ⚠️
3. Render SSR simulado con `@emotion/server/create-instance` + `renderToString()` de la ruta inicial → Extrae estilos exactos usados arriba del fold. ✅ Recomendado.
4. Hybrid: SSR simulado + Penthouse post-procesando para poda de media queries irrelevantes. ✅ (fase 2)

### 7. Plan Técnico (Fase 1 Funcional)
1. Crear script `scripts/extract-critical-css.cjs` que: 
	- Importa `react`, `react-dom/server`, `@emotion/server/create-instance`, `App` y un provider mock de router + theme. 
	- Renderiza la ruta `/buyer/marketplace` con datos mínimos (mock store / proveedores vacíos). 
	- Obtiene `extractCriticalToChunks(html)` → combinar sólo los chunks iniciales → concatenar. 
	- Filtrar reglas: mantener selectores que matchean `body`, `#root`, `[data-]`, `Mui` componentes iniciales, card contenedores, imágenes. 
	- Escribir a `dist/critical.css`. 
2. En `index.html` (post-build transform script): insertar `<style data-critical>...</style>` antes del primer `<script type="module">`. 
3. Convertir la hoja generada por Vite (ej. `assets/index-XYZ.css`) en carga no bloqueante: 
```html
<link rel="preload" as="style" href="/assets/index-XYZ.css" />
<link rel="stylesheet" href="/assets/index-XYZ.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/index-XYZ.css"></noscript>
```
4. Mover estilos no críticos (scrollbar, animaciones, overrides profundos) a un chunk `late-ui.css` importado dinámicamente tras `requestIdleCallback`.
5. Verificar que no desaparece ningún estilo inicial (capturar screenshot baseline vs optimizado).

### 8. Plan Técnico (Fase 2 Optimización)
| Paso | Acción |
|------|--------|
| a | Integrar Penthouse apuntando a HTML post-inlined para recortar reglas no usadas real viewport 1366x768 y 390x844 |
| b | Generar dos critical sets (mobile + desktop); inline ambos envueltos en media queries (mobile-first + overrides) |
| c | Normalizar colores / tipografías a variables CSS, reduciendo bytes inline |
| d | Incluir hashing del contenido critical y comparar en CI para detectar crecimiento (>20%) |
| e | Añadir compresión brotli/gzip y medir payload (target <9 KB gzip) |

### 9. Ejemplo de Bloque Critical CSS (Prototipo)
```html
<style data-critical>
/* Base */
html,body{margin:0;min-height:100%;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#fff;color:#213547;line-height:1.5}
#root{width:100%;min-height:100vh}
/* Grid inicial productos (simplificado) */
[data-products-grid]{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;align-items:start}
.product-card{position:relative;display:flex;flex-direction:column;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;transition:box-shadow .25s ease,transform .25s ease}
.product-card__img-wrapper{aspect-ratio:4/5;background:#f4f4f4;display:block;width:100%}
.product-card__title{font-size:.85rem;font-weight:600;margin:4px 8px 0 8px;line-height:1.25}
@media (min-width:768px){.product-card__title{font-size:.9rem}}
</style>
```
Nota: Selectores reales se mapearán a la estructura existente (clases MUI generan hashes — se mantendrán tal cual el extractor los entregue; opcional renombrar wrappers para control).

### 10. Integración en Pipeline
1. Añadir script en `package.json`: 
	- `"postbuild:critical": "node scripts/extract-critical-css.cjs && node scripts/inline-critical-css.cjs"`
	- `"build": "vite build && npm run postbuild:critical"`
2. `extract-critical-css.cjs`: SSR simulado + escritura.
3. `inline-critical-css.cjs`: 
	- Lee `dist/index.html` 
	- Inserta `<style data-critical>` al principio de `<head>` 
	- Reemplaza `<link rel="stylesheet">` con patrón preload+media=print.
4. Validar integridad: script que cuenta ocurrencias de `data-critical` y asegura tamaño < 15 KB (raw) / <9 KB gzip.

### 11. Medición / Validación
| Tipo | Qué medir | Herramienta |
|------|-----------|-------------|
| Lab | LCP, FCP, Speed Index | Lighthouse / WebPageTest (first view) |
| Lab | Filmstrip comparativo | WebPageTest (render start delta) |
| Runtime | LCP real | RUM PerformanceObserver |
| Tamaño | Bytes inline critical | Script CI |
| Reflow | Layout shifts antes/después | Performance panel (Layout Shift Regions) |

### 12. Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| CSS crítico incompleto | Parpadeo / FOUS | QA visual + fallback noscript link |
| Duplicación de reglas | Bytes extra | (Fase 2) Purga deduplicando en build post-process |
| Crecimiento continuo | Performance drift | Límite CI + alerta si >20% incremento |
| MUI versión cambia hashes | Extractor rompe | Encapsular imports y aislar createEmotionCache consistente |
| Render mismatch SSR simulada | Hidratación warning | Usar providers idénticos (ThemeProvider, CacheProvider) |

### 13. Roadmap de Implementación
1. (Hoy) Implementar scripts Fase 1 + inline prototipo. 
2. Validar Lighthouse comparando con commit previo. 
3. Ajustar scope (añadir/quitar reglas) hasta estabilizar. 
4. (Semana 2) Integrar Penthouse recorte adicional. 
5. (Semana 3) Añadir monitor CI + métricas RUM.

### 14. Checklist Operativo
- [ ] Script SSR extracción (`extract-critical-css.cjs`).
- [ ] Script inlining (`inline-critical-css.cjs`).
- [ ] Ajuste `package.json` build chain.
- [ ] Implementar wrapper `data-products-grid` para grid inicial (o mapear selectores MUI). 
- [ ] Validar tamaño (<15 KB raw). 
- [ ] Preload + `media=print` pattern activo. 
- [ ] QA visual (mobile + desktop). 
- [ ] Lighthouse antes/después documentado. 

### 15. Rollback Simple
Eliminar bloque `<style data-critical>` y restaurar `<link rel="stylesheet">` normal (o ignorar scripts postbuild).

### 16. Siguientes Optimización Relacionadas
| Próximo | Beneficio |
|---------|-----------|
| Split theme MUI (lazy load palettes no usadas) | Menos JS inicial |
| Extraer CSS estático de tarjetas a hoja global | Reduce Emotion runtime |
| Reemplazar partes de Emotion por CSS Modules para componentes estáticos | Menos style recalculation |
| Introducir `prefetch` para hoja diferida tras `load` | Suaviza transición |

---
Documento generado para la iniciativa: Critical CSS inline + diferir resto.
