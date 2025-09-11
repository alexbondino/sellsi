## Análisis Súper Profundo: Headers de Caché en `vercel.json`

### 1. Objetivo Estratégico
Optimizar la política de caching para: (a) maximizar reuso de recursos inmutables (JS/CSS/Fonts/Imágenes versionadas), (b) proteger contenido dinámico y personalizado (HTML, API, JSON, RPC Supabase), (c) reducir variabilidad de métricas (LCP, TBT) en visitas repetidas, (d) preparar terreno para edge caching selectivo y `stale-while-revalidate` (SWR) seguro.

### 2. Estado Actual (`vercel.json`)
Configuración presente:
```json
{
	"headers": [
		{ "source": "/assets/js/(.*)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"},
			{"key":"Vary","value":"Accept-Encoding"},
			{"key":"X-Content-Type-Options","value":"nosniff"}
		]},
		{ "source": "/assets/css/(.*)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"},
			{"key":"Vary","value":"Accept-Encoding"},
			{"key":"X-Content-Type-Options","value":"nosniff"}
		]}
	]
}
```
Limitaciones actuales:
1. Sólo JS/CSS dentro de `/assets/js/` y `/assets/css/` quedan cubiertos; depende de que el bundler produzca exactamente esas rutas (¿garantizado?).
2. No se contemplan: fuentes (`/fonts/`), imágenes (`png|jpg|jpeg|webp|avif|gif|ico|svg`), íconos, JSON estático (`/assets/data/`), archivos de `/.vite/` si existieran, ni `service-worker`.
3. Falta política explícita para `index.html` (debe ser no-cache para garantizar despliegues inmediatos y evitar “HTML Stale”).
4. No incluye `stale-while-revalidate` en recursos de rotación media (imágenes no críticas, JSON semiestático) donde sería beneficioso.
5. No hay `Vary: Accept` / `Vary: Origin` / `CDN-Cache-Control` para controlar comportamiento multi-capa (aunque Vercel maneja capas internas, cabeceras específicas pueden modular). 
6. Ausencia de headers de integridad de seguridad complementarios (ej: `Strict-Transport-Security`, `Permissions-Policy`, `Content-Security-Policy`) – no estrictamente caching, pero relevantes para la misma capa de configuración.
7. Sin diferenciación entre assets versionados (hash en filename) vs no versionados.

### 3. Clasificación de Recursos (Taxonomía)
| Tipo | Ejemplos | Volatilidad | Política Ideal |
|------|----------|-------------|----------------|
| HTML (entry) | `/index.html` | Alta | `no-cache, no-store, must-revalidate` |
| JS/CSS con hash | `/assets/js/app.abc123.js` | Inmutable | `public, max-age=31536000, immutable` |
| JS/CSS sin hash | `/legacy.js` | Media | `public, max-age=300, stale-while-revalidate=30` |
| Fuentes | `/fonts/inter-400.woff2` | Inmutable | `public, max-age=31536000, immutable` |
| Imágenes producto (dinámicas) | `/storage/.../product123.webp` | Media | `public, max-age=300, stale-while-revalidate=60` |
| Imágenes estáticas UI | `/assets/img/logo.svg` | Baja | `public, max-age=31536000, immutable` |
| Iconos / favicon | `/favicon.ico` | Baja | `public, max-age=604800` |
| JSON semiestático | `/assets/data/categories.json` | Media | `public, max-age=3600, stale-while-revalidate=600` |
| Service Worker | `/sw.js` | Alta (controla updates) | `no-cache, no-store, must-revalidate` |
| Manifest / sitemap | `/manifest.json` `/robots.txt` | Baja | `public, max-age=86400` |
| Edge función respuesta (dinámica) | API Supabase (REST/RPC) | Alta | Controlado por servidor (no-cache o corto) |

### 4. Principios de Diseño de Caché Adoptados
1. Inmutabilidad agresiva sólo si nombre de archivo integra hash (content addressing). 
2. `index.html` sin caché fuerte para evitar servir una shell obsoleta tras deploy.
3. Introducir SWR para contenido secundario que puede tolerar breve staleness (imágenes de catálogo, listados semiestáticos) para mejorar TTFB percibido en retornos.
4. Minimizar cardinalidad de `Vary` – sólo `Accept-Encoding` de momento para no fragmentar caché.
5. Preparar terreno para possible `ETag` + `If-None-Match` en endpoints JSON (si se exponen directamente desde vercel). 
6. Evitar “double caching confusion”: preferir cabecera única `Cache-Control` clara (sin combinaciones conflictivas como `no-store` + `max-age`).

### 5. Recomendación JSON Propuesto (Ampliado)
```jsonc
{
	"headers": [
		{ "source": "/index.html", "headers": [
			{"key":"Cache-Control","value":"no-cache, no-store, must-revalidate"},
			{"key":"Pragma","value":"no-cache"},
			{"key":"Expires","value":"0"}
		]},
		{ "source": "/sw.js", "headers": [
			{"key":"Cache-Control","value":"no-cache, no-store, must-revalidate"}
		]},
		{ "source": "/fonts/(.*)\.woff2", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"},
			{"key":"Vary","value":"Accept-Encoding"}
		]},
		{ "source": "/assets/js/(.*)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"},
			{"key":"Vary","value":"Accept-Encoding"},
			{"key":"X-Content-Type-Options","value":"nosniff"}
		]},
		{ "source": "/assets/css/(.*)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"},
			{"key":"Vary","value":"Accept-Encoding"},
			{"key":"X-Content-Type-Options","value":"nosniff"}
		]},
		{ "source": "/assets/img/(.*)\.(png|jpg|jpeg|gif|webp|avif|svg)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}
		]},
		{ "source": "/images/(.*)\.(png|jpg|jpeg|gif|webp|avif)", "headers": [
			{"key":"Cache-Control","value":"public, max-age=300, stale-while-revalidate=60"}
		]},
		{ "source": "/assets/data/(.*)\.json", "headers": [
			{"key":"Cache-Control","value":"public, max-age=3600, stale-while-revalidate=600"}
		]},
		{ "source": "/robots.txt", "headers": [
			{"key":"Cache-Control","value":"public, max-age=86400"}
		]},
		{ "source": "/manifest.json", "headers": [
			{"key":"Cache-Control","value":"public, max-age=86400"}
		]}
	]
}
```
Notas:
- Separación entre imágenes inmutables empaquetadas (`/assets/img/`) y dinámicas (`/images/` o storage) con SWR.
- `stale-while-revalidate` mejora percepciones en catálogos cargados frecuentemente.
- Se asume convención de rutas; adaptar a rutas reales del build (`dist/`).

### 6. Decisión: ¿Cuándo Usar SWR vs Inmutable?
| Condición | Política |
|----------|----------|
| Nombre con hash (hash de contenido) | `immutable` |
| Nombre sin hash pero cambios infrecuentes (≥1h) | `max-age=3600, stale-while-revalidate=600` |
| Respuesta personalizada (user/session) | `private, max-age=0, no-store` |
| Datos quasi-realtime (<1 min) | considerar WebSocket / polling, no caché CDN |

### 7. Riesgos & Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Caché agresivo en HTML muestra versión antigua | Alto | `no-cache` + invalidación instantánea |
| Imágenes dinámicas demasiado frescas (300s) retrasan reflectir cambios | Medio | Reducir a 120s o versionar query param (`?v=`) |
| Pérdida de hash en build rompe inmutabilidad | Medio | Pipeline: fallo si asset no hashed > X KB |
| SWR en JSON produce ghost stale data | Bajo | Añadir timestamp y fallback a revalidación forzada si > TTL duro |
| Demasiadas reglas complejas | Bajo | Documentar tabla y crear test linterna (script validación) |

### 8. Métricas a Monitorear Post Cambio
1. Ratio 304 / 200 para assets (objetivo >70% en visitas repetidas). 
2. Variación P75 LCP entre primera y segunda navegación (esperada reducción). 
3. TTFB repetido en imágenes de producto (debería caer al <50 ms por hit CDN). 
4. Incidencias de “stale content” reportadas soporte (objetivo 0 regresiones). 
5. Peso transferido total vs baseline (Lighthouse `total-byte-weight`).

### 9. Plan de Implementación Incremental
Fase 1 (rápido): HTML no-cache, fonts + imgs estáticas inmutables, SW/manifest/robots TTL.
Fase 2: Introducir SWR en imágenes dinámicas y JSON semiestático. 
Fase 3: Validación de naming hash estricto (script CI) y métricas RUM integradas (report cache hit ratio si factible vía Service Worker). 
Fase 4: Evaluar Edge Middleware para cache selectivo de fragmentos (ej. lista de categorías) + invalidación a eventos (webhook). 

### 10. Validación Técnica (Checklist Post Deploy)
| Paso | Acción | Tool |
|------|--------|------|
| A | `curl -I /index.html` => verifica `no-cache` | curl | 
| B | `curl -I /assets/js/app.<hash>.js` => `immutable` | curl |
| C | `curl -I /fonts/inter-400.woff2` => `immutable` | curl |
| D | `curl -I /images/dynamic1.webp` => `stale-while-revalidate` | curl |
| E | Navegación repetida: comparar transferSize (DevTools) | Chrome DevTools |
| F | Lighthouse repetido: confirmación ausencia de warnings de TTL | Lighthouse |

### 11. Script de Auditoría (Opcional)
```js
// scripts/audit-cache-headers.cjs
import https from 'https';
const targets = [
	'/index.html',
	'/assets/js/app.fakehash.js',
	'/fonts/inter-400.woff2',
	'/images/sample.webp'
];
const host = 'staging-sellsi.vercel.app';
function head(path){
	return new Promise(res=>{
		const req = https.request({method:'HEAD',host,path}, r=>{
			const cc = r.headers['cache-control'] || ''; res({path,cc,status:r.statusCode});
		}); req.end();
	});
}
const EXPECT = [
	{match:/index\.html/, policy:/no-cache/},
	{match:/app\..+\.js/, policy:/immutable/},
	{match:/inter-400\.woff2/, policy:/immutable/}
];
for (const t of targets) {
	// eslint-disable-next-line no-await-in-loop
	const r = await head(t); console.log(r);
	const rule = EXPECT.find(e=>e.match.test(t));
	if (rule && !rule.policy.test(r.cc)) {
		console.error('POLICY MISMATCH', t, r.cc);
		process.exitCode = 1;
	}
}
```

### 12. Integración con Service Worker (Visión)
El SW puede aplicar cachés diferenciadas (Cache Storage) p.ej.:
| Cache | TTL SW | Contenido |
|-------|--------|-----------|
| `app-shell` | manual | JS/CSS inmutables |
| `fonts` | 1 año | WOFF2 |
| `dynamic-img` | 5 min SWR | Imágenes producto |
| `json-meta` | 1 h SWR | Categorías, filtros |
Esto complementa, no sustituye, las cabeceras HTTP: el navegador respeta ambos niveles.

### 13. Relación con Performance Metrics
| Métrica | Mejora Esperada | Mecanismo |
|---------|-----------------|-----------|
| LCP (navegación 2+) | -150–400 ms | Hero / fuente / imagen cache hit |
| TBT | Estabilización | Menos red blocking al parse inicial |
| INP | Indirecta | Menor jank por menor descarga simultánea |
| CLS | No impacto directo | Evita race fonts FOIT/FOUT si fonts ya locales |

### 14. Futuras Optimizaciones
1. `Content-Security-Policy` estricta para reducir ataques y habilitar `Trusted Types`. 
2. `Early Hints (103)` (cuando Vercel soporte) para anunciar JS/CSS críticos.
3. `Server-Timing` marks para instrumentar tiempo de fetch dinámico y correlacionar con caché hits.
4. Edge KV / Deno storage para cachear fragmentos server-side y emitir ETag diferido.
5. Automatizar invalidación: hook GitHub → trigger purge selectivo (si en el futuro se agrega CDN multi-proveedor).

### 15. Conclusión
La configuración actual es un buen punto inicial pero subutiliza el potencial de diferenciación de recursos. Al expandir reglas (HTML no-cache, assets inmutables, SWR para semiestáticos) se reduce transferencia redundante, se suaviza variabilidad de LCP en sesiones repetidas y se sientan bases para instrumentación avanzada. El mayor ROI inmediato: añadir HTML no-cache + fonts + imágenes estáticas + SWR para catálogos.

---
Documento generado (2025-09-11) a partir de revisión de `vercel.json`, objetivos Lighthouse y mejores prácticas de caching moderno.

