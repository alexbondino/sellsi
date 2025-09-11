## Análisis Profundo: Limpieza de `preconnect` Redundantes

### 1. Objetivo
Reducir hints de conexión temprana (`<link rel="preconnect">` / `dns-prefetch`) a un set mínimo de orígenes realmente críticos en el TTI/LCP, evitando handshakes innecesarios y warnings Lighthouse ("More than 2 preconnect" y "Unused preconnect").

### 2. Estado Actual (Inventario)
Archivo principal `index.html`:
- `https://clbngnjetipglkikondm.supabase.co` (preconnect + dns-prefetch)
- `https://fonts.googleapis.com` (preconnect)
- `https://fonts.gstatic.com` (preconnect + `crossorigin`)

Archivo alternativo `index.cdn.html` (no productivo regular):
- `https://unpkg.com` (preconnect + dns-prefetch) para React UMD CDN

Lighthouse report detectó además:
- Preconnect a `fonts.gstatic.com` marcado como NO usado (posible orden o timing de consumo CSS).
- Advertencia de más de 2 preconnect.
- Preconnect Supabase “unused” (probable por timing de primeras requests REST/auth o falta de `crossorigin` correcto en audito previo). Actualmente sí tiene `crossorigin`, pero podría no dispararse temprano si JS arranca más tarde la request.

### 3. Principios de Uso Correcto
1. Máximo recomendado: 2 (excepcionalmente 3) preconnect críticos.
2. Deben apuntar a orígenes con: (a) TLS costoso y (b) request garantizado < 1 s desde navegación inicial.
3. Evitar duplicar `preconnect` y `dns-prefetch` juntos; `preconnect` ya hace DNS + TCP + TLS. `dns-prefetch` se deja sólo para navegadores legacy cuando se quiere mínimo costo (aquí no es necesario en la mayoría de casos modernos si ya hay `preconnect`).
4. Para fuentes externas: evaluar self-host + preload en vez de triple preconnect.
5. Si recurso se descubre vía CSS (fuentes) y se tarda >300 ms, quizás mejor `preload` en lugar de `preconnect` adicional.

### 4. Evaluación de Cada Origen
| Origen | Uso Real | Impacto en LCP | Mantener | Alternativa |
|--------|----------|----------------|----------|-------------|
| Supabase (`*.supabase.co`) | API auth, datos marketplace | Alto (data inicial) | Sí | Considerar mover a fetch temprano / SSR |
| fonts.googleapis.com | CSS de fuentes | Medio (estilo texto) | Condicional | Reemplazar por self-host + `@font-face` |
| fonts.gstatic.com | Archivos font binarios | Medio | No (si se self-host) | Preload WOFF2 local |
| unpkg.com | Sólo en `index.cdn.html` dev/cdn variante | Nulo en prod | No | Build bundler estándar |

### 5. Recomendación Target (Producción)
Opción A (sin self-host todavía):
```
<link rel="preconnect" href="https://clbngnjetipglkikondm.supabase.co" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
Usar SOLO 2 y eliminar `fonts.googleapis.com` preconnect (el CSS es pequeño y su conexión se resuelve rápido tras first paint).

Opción B (ideal, self-host fuentes):
```
<link rel="preconnect" href="https://clbngnjetipglkikondm.supabase.co" crossorigin>
```
Y añadir preload:
```
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-600.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-700.woff2" crossorigin>
```

### 6. Pasos Concretos de Limpieza
1. Remover de `index.html`:
	 - `<link rel="dns-prefetch" href="//clbngnjetipglkikondm.supabase.co">` (redundante)
	 - Uno de los dos orígenes de fuentes (ver estrategia elegida). Si no self-host aún, eliminar `fonts.googleapis.com` preconnect o mantener sólo `fonts.gstatic.com`.
2. Reordenar: situar preconnect(s) antes de `<title>` pero después de `<meta charset>` para descubrimiento temprano (ya casi correcto; sólo agrupar). 
3. Medir tras cambio con Lighthouse y WebPageTest (ver ganancia en warnings y conexión).
4. (Opcional) Implementar self-host fonts: descargar Inter subset (unicode-range latín básico) y declarar en CSS.
5. Auditar si primera llamada Supabase ocurre <500 ms. Si no, considerar disparar un `fetch` warm-up mínimo (HEAD /health) o mover parte de data a SSR/edge.

### 7. Métrica Esperada Post Ajuste
- Eliminación de warning “More than 2 preconnect”.
- Potencial reducción pequeña (10–40 ms) en inicio de otras descargas por menor contención de conexiones iniciales.
- CLS no afectado directamente (neutral).
- Simplificación del head → menor complejidad mantenimiento.

### 8. Validación Técnica (Checklist)
| Check | Método | Estado |
|-------|--------|--------|
| Supabase handshake temprano | Network panel: ver `connect` < 120 ms | Pendiente |
| Preconnect fonts usados | Coverage DevTools → font files cargan | Pendiente |
| Lighthouse sin warnings preconnect | Re-run | Pendiente |
| Sin regressión en FCP | Comparar baseline 0.64 s | Pendiente |

### 9. Riesgos
| Riesgo | Mitigación |
|--------|-----------|
| Eliminación preconnect fonts aumenta FOUT | Mantener `font-display: swap`; considerar preload en transición |
| Self-host fonts mal subseteadas produce glyph fallback | Validar textos críticos (ñ, tildes) |
| Preconnect Supabase innecesario en rutas sin data inicial | Condicional: insertar dinámicamente sólo en marketplace si layout root es compartido |

### 10. Implementación Propuesta (Patch Ejemplo)
Para estrategia A (mínimo esfuerzo):
```diff
 <!-- Performance: Preconnect to Supabase project to warm DNS, TCP & TLS (auth, rest, storage, realtime) -->
- <link rel="preconnect" href="https://clbngnjetipglkikondm.supabase.co" crossorigin />
- <link rel="dns-prefetch" href="//clbngnjetipglkikondm.supabase.co" />
- <link rel="preconnect" href="https://fonts.googleapis.com" />
- <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
 + <link rel="preconnect" href="https://clbngnjetipglkikondm.supabase.co" crossorigin>
 + <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### 11. Próximos Pasos
1. Elegir estrategia (A rápida / B self-host).
2. (COMPLETADO) Aplicar patch en `index.html` (removidos Google Fonts + preconnect redundantes, añadidos preload locales).
3. (COMPLETADO) Añadido `@font-face` en `src/index.css` y `README` en `/public/fonts`.
4. (PENDIENTE) Subir realmente archivos `inter-400/600/700.woff2` optimizados.
5. (PENDIENTE) Re-ejecutar Lighthouse y documentar diferencias (añadir sección comparativa en `analisisgpt.md`).
6. (OPCIONAL) Introducir test automatizado (script) que escanee `index.html` y limite nº de `rel="preconnect"` > 2.

### 12. Script de Verificación (Opcional)
```js
// scripts/verify_preconnect_count.cjs
import { readFileSync } from 'fs';
const html = readFileSync('sellsi/index.html','utf8');
const count = (html.match(/rel="preconnect"/g) || []).length;
if (count > 2) {
	console.error(`Preconnect count ${count} > 2 (policy violated)`);
	process.exit(1);
} else {
	console.log(`Preconnect count OK (${count})`);
}
```

### 13. Conclusión
La limpieza reduce overhead de conexión temprana, elimina warnings Lighthouse y prepara el terreno para optimizaciones mayores (self-host fonts, critical CSS). Impacto directo pequeño pero necesario dentro de una estrategia de micro-optimizaciones acumulativas para bajar LCP < 1.9 s y robustecer consistencia del performance.

---
Documento generado a partir del análisis del estado actual (2025-09-11).

