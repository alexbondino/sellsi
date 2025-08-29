## Análisis Profundo Primera Carga (Landing / F5)

Fecha: 2025-08-29
Branch: staging

### 1. Resumen Ejecutivo
La primera carga es funcional pero más pesada de lo necesario. Se descargan y ejecutan ~350–380 kB gzip de JS inicial (≈1.6–1.8 MB sin comprimir) debido a preloads agresivos (supabase, mui-core, mui-icons) y montaje temprano de múltiples *providers* no críticos para un usuario anónimo. No hay ciclos ni bloqueos severos, pero existe **inflación de contexto** y oportunidad clara de diferir SDKs/packs pesados para mejorar Time To Interactive (TTI) y reducir parse/compile CPU.

### 2. Payload Inicial (Critical Path)
Preloads actuales (`index.html`) incluyen:
- `index-*.js` (entry) ~154 kB gzip
- `mui-core` 132.8 kB gzip
- `supabase` 29.9 kB gzip (no imprescindible antes de interacción)
- `router` 11.9 kB gzip
- `mui-icons` 9.7 kB gzip
- `react-vendor` 7.0 kB gzip
- `utils` 5.6 kB gzip

Otros chunks grandes existen pero se cargan on‑demand (lazy). CSS crítico pequeño (~1.9 kB) pero se arrastra un CSS enorme asociado a CountrySelector (421.6 kB / 84.7 kB gzip) cuando se usa.

### 3. Hallazgos Clave
1. **Modulepreload excesivo**: Forzamos descarga temprana de supabase + mui-icons que podrían esperar a la primera interacción o detección de sesión.
2. **Providers ansiosos**: Se montan Auth, Role, Prefetch, Notifications, MarketplaceSearch, Layout, TransferInfoManager, Banner, QueryClient antes de saber si el usuario lo necesita.
3. **Supabase estático**: SDK (≈113 kB uncompressed) se parsea siempre, incluso para visitantes anónimos (puede hacerse dynamic import).
4. **Sentry inicial**: Inicialización antes de render interactivo. Puede diferirse a `requestIdleCallback` o tras primer input.
5. **CountrySelector / banderas**: Gran CSS + múltiples SVGs; posible separar y lazy load bajo demanda (ej: modal país / phone input).
6. **Animaciones y confetti**: Chunk `animation` (116 kB / 37.8 kB gzip) no debería cargarse sin interacción relevante (verificar si se pre-importa en Hero / efectos iniciales).
7. **Redundancia de queries potencial**: Auth + Role + Prefetch podrían consolidarse en una única llamada (RPC o select combinada) reduciendo RTTs tempranos.
8. **Sourcemaps activos**: `sourcemap: true` expone mapas si se sirven públicamente – coste de build y potencial fuga (subirlos a Sentry y desactivar servirlos).

### 4. Métricas Observadas (Build Output)
Build (≈14,473 módulos transformados | 1m40s). Chunks mayores:
- `index` 564.7 kB (153.9 kB gzip)
- `mui-core` 481.1 kB (132.8 kB gzip)
- `charts` 312.1 kB (79.1 kB gzip) (lazy)
- `mui-extras` 269.1 kB (69.5 kB gzip) (lazy)
- `animation` 116.3 kB (37.8 kB gzip) (puede diferirse)
- `supabase` 113.0 kB (29.9 kB gzip)

### 5. Riesgos de UX / Performance
- Mayor tiempo de parse/compile JS en dispositivos de gama media (300–500 ms extra).
- FCP/LCP potencialmente elevado si red compite entre JS preloaded y assets hero.
- TTI más lento por inicialización de contextos y sus efectos (auth session + perfil + role fetch).

### 6. Oportunidades de Optimización (Prioridad)
HIGH:
1. **Shell Split / AuthBoundary**: Crear `PublicShell` minimal (Theme, Router, Banner opcional) y cargar `AuthLayer` (Auth/Role/Notifications/TransferInfo/Search) vía lazy boundary tras detectar token o interacción.
2. **Eliminar modulepreload de supabase y mui-icons** (dejar al navegador decidir tras resolver dependencias de entry).
3. **Dynamic import supabase**: Wrapper `getSupabase()` que hace `import('@supabase/supabase-js')` cuando realmente se accede a auth.
4. **Diferir Sentry**: Inicializar tras `requestIdleCallback` o primer navigation event.
5. **Lazy CountrySelector + Flags**: Code split + subset de países usados + sprite o CDN. (COMPLETADO: subset generado e integrado en el build)

MEDIUM:
6. Unificar fetch de perfil/rol en una sola query (menos roundtrips).
7. Defer animaciones (framer-motion/confetti) con `intersection` o user action.
8. Quitar providers redundantes (RolePrefetch si se solapa con AuthPrefetch).
9. Analizar tree-shaking MUI: evitar imports amplios; usar `babel-plugin-direct-import` si aplica.

LOW:
10. Desactivar sourcemaps en prod pública (`sourcemap: false` + upload a Sentry con authToken).
11. Memo/hoist de estructuras estáticas en TopBar/AppShell para micro ahorros.
12. Performance marks (`performance.mark(...)`) para medir mejoras incrementalmente.

### 7. Plan de Implementación Iterativo
Fase A (rápida, <1 día):
- Remover preloads supabase/mui-icons.
- Convertir import supabase a dynamic.
- Defer Sentry (idle).
- Lazy CountrySelector.

Fase B (1–2 días):
- Introducir `AuthBoundary` (lazy) + reorganizar providers.
- Consolidar fetch perfil/rol.
- Diferir animaciones.

Fase C (profiling):
- Ajustar chunking (posiblemente eliminar manualChunks para permitir mejor split automático + analizar visualizer).
- Optimizar icon strategy (subset o sprite).

Fase D (pulido):
- Quitar sourcemaps públicos.
- Añadir performance marks y comparar Lighthouse (TTI, TBT, LCP).

### 8. Éxito (KPIs Objetivo)
- JS inicial ≤ 180 kB gzip.
- TTI < 2.5s en móvil throttled (Fast 3G / 4G medio).
- Reducción parse/compile main-thread >30%.
- Menos de 5 providers montados en shell público antes de interacción.

### 9. Validación Requerida
Herramientas: Lighthouse móvil, WebPageTest, Performance panel (Chrome) con CPU 4x slowdown, Coverage para verificar caída de JS inicial.

### 10. Riesgos / Trade-offs
- Diferir auth retrasa detección de sesión para usuarios ya logueados: mitigar mostrando placeholder rápido y precargando auth en idle.
- Dynamic supabase añade primera latencia (import) justo cuando se necesita login: amortizable precargando al `visibilitychange` o `pointerdown`.

### 11. Próximos Pasos Inmediatos (si se aprueba)
1. Editar `index.html` para retirar `modulepreload` supabase / mui-icons.
2. Refactor `services/supabase.js` -> export `async function getSupabase()`.
3. En `AuthProvider`, cambiar import estático a llamada `getSupabase()`.
4. En `main.jsx` diferir `Sentry.init` usando `requestIdleCallback` fallback a `setTimeout`.
5. Detectar imports de CountrySelector y convertirlos a lazy (`React.lazy`).

---
Documento generado automáticamente a partir de análisis interno (agosto 2025). Actualizar conforme se apliquen fases para mantener histórico de mejoras.

## Addendum Deep Dive – Análisis a Nivel de Archivo (2025-08-29)

Este addendum amplía el análisis inicial con inspección directa de componentes y hooks críticos, detallando costos, riesgos y acciones específicas por archivo.

### A. Escenarios de Entrada (Ruta Inicial tras F5)
1. Landing anónima: Sobre-provisión (supabase, mui-icons, gran parte de mui-core) antes de necesidad. Máximo potencial de ahorro.
2. Ruta privada con sesión (ej. `/supplier/home`): Preloads ayudan, pero pueden hacerse condicionales basados en token.
3. Ruta de marketplace pública: Impacto similar a landing; costos dominados por core + MUI.
4. Producto profundo (`/marketplace/product/:id`): Lazy chunks ligeros; optimizaciones principales siguen siendo globales.

### B. Desglose y Entropía de Chunks
manualChunks fuerza agrupaciones grandes (ej. `mui-core` 132.8 kB gzip). Reduce granularidad del caching y eleva coste inicial. Re-evaluar necesidad de manualChunks tras optimizaciones (posible mejor split automático).

### C. Componentes / Hooks Revisados

#### 1. `CountrySelector` (`src/shared/components/forms/CountrySelector/...`)
- Carga global de `flag-icons/css/flag-icons.min.css` ⇒ Gran CSS chunk cuando se incluye (optimizado).
- Estado: COMPLETADO — Se generó un subset de estilos y se integró en el build.
	- Artifacts:
		- Script: `scripts/generate-flag-subset.cjs` (invocado desde `package.json` `build` script)
		- CSS generado: `src/shared/components/forms/CountrySelector/flag-icons-subset.css`
	- Resultados observados (build): subset generado de ~1.3 KB, ahorro observado ~26.0 KB frente al CSS original detectado por el script; SVGs resueltos y emitidos por Vite en `dist/assets/svg/`.
	- Acciones realizadas: reemplazo de la importación global de `flag-icons` por el CSS subset, corrección de rutas para que Vite resuelva los SVGs, y eliminación del script antiguo `generate-flag-subset.js`.
	- Recomendación adicional: opcionalmente convertir `CountrySelector` a `React.lazy` para sacarlo del critical path si se desea un ahorro extra en la carga inicial.

#### 2. `useCountrySelector.js`
- Cálculos O(n) triviales; coste irrelevante hoy. Principal ahorro recae en remover CSS global y hacer lazy.

#### 3. `TransferInfoManager` + `useTransferInfoPreloader`
- Ejecuta pre-carga bancaria al autenticar siempre (network hit no visible). Riesgo: congestionar early network tras login.
- Acciones: Defer a `requestIdleCallback` post-interacción; condicionar a navegación a secciones que lo requieren; performance mark para medir beneficio.

#### 4. `AuthPrefetchProvider`
- Prefetch de `/login` y `/crear-cuenta` aun si usuario ya está autenticado.
- Acción: Montar sólo si `!session`. Alternativa: disparar prefetch en hover/focus del botón “Login”.

#### 5. `RolePrefetchProvider`
- Prefetch burst de múltiples rutas (comprador o proveedor) tras 1500 ms.
- Riesgo: Picos de ancho de banda y CPU parse innecesarios.
- Acciones: Estrategia progresiva (encolar 1 ruta cada 750 ms); gating por idle; abort si pestaña pierde foco; presupuesto máx. (ej. 80 kB gzip).

#### 6. `AppProviders.jsx`
- Cadena profunda de providers: QueryClient → Theme → Banner → Router → Auth → AuthPrefetch → Role → RolePrefetch → TransferInfoManager → Notifications → MarketplaceSearch → Layout → BanGuard.
- Problema: “Context inflation”; inicialización excesiva antes de necesidad.
- Acción: Introducir capas: `PublicShell` (mínimo), `AuthShell` (lazy), `FeatureShell` (notificaciones, search, layout) montadas on-demand.

#### 7. `AuthProvider.jsx`
- Realiza `supabase.auth.getSession()` + SELECT perfil; potencial doble roundtrip si rol u otros datos están en otra consulta.
- Acciones: RPC combinado para perfil+rol; dynamic import supabase; invalidar caches sólo tras confirmación de cambio; migrar a Suspense boundary (React 19) en rutas privadas.

#### 8. `AppShell.jsx`
- Cálculo complejo de estilos en línea dentro de `sx` (objeto reconstruido cada render) → micro GC / coste CPU.
- `TopBar` usa `key` dependiente de `session.id` y `logoUrl` forzando re-mount completo (innecesario en la mayoría de casos).
- Acciones: Memo de estilos en hook; quitar `key` salvo casos de reset intencional; añadir `will-change: transform` para contenedor animado Sidebar.

### D. Prefetch & Network Strategy
- Convertir `modulepreload` supabase / mui-icons → `prefetch` condicional (o dynamic import). Mantener `react-vendor` y quizá `mui-core` hasta re-split.
- Añadir `<link rel="preconnect" href="https://<SUPABASE_HOST>" crossorigin>` para conservar baja latencia sin descargar JS completo.

### E. Memoria y CPU (Estimaciones)
- JS inicial: ~380 kB gzip (parse+compile ~350–450 ms dispositivo medio).
- Providers extras: +60–90 ms ejecución acumulada (estimación) que se podría diferir.
- CountrySelector CSS (cuando presente) infla parse de estilos (+10–20 ms).

### F. Instrumentación Propuesta
Marks:
- `performance.mark('app_js_start')` en entry.
- `hero_painted` (useEffect en HeroSection).
- `auth_ready` (cuando `loadingUserStatus` pasa a false).
- `shell_split_loaded` (cuando AuthShell monta).
Measures:
- `performance.measure('time_to_hero','app_js_start','hero_painted')`
- `performance.measure('auth_restore','app_js_start','auth_ready')`
- `performance.measure('auth_shell_latency','app_js_start','shell_split_loaded')`

### G. Tabla Resumen Acciones y Ganancias (Estimadas)
| Acción | Ganancia gzip | CPU Parse/Init | Riesgo |
|-------|---------------|----------------|--------|
| Lazy CountrySelector + subset flags | 80–85 kB | 10–20 ms | Bajo |
| Dynamic supabase + cond. preload | 30 kB inicial | 20–25 ms | Bajo |
| Shell split providers | 60–90 kB | 60–90 ms | Medio |
| Defer Sentry & animaciones | 0 kB | 20–30 ms | Bajo |
| Prefetch progresivo/idle | Variable (100+ kB) | Evita picos | Bajo |
| Quitar TopBar key + memo estilos | 0 kB | 5–10 ms | Bajo |

### H. Orden de Implementación Recomendada
1. (Quick Wins) Lazy CountrySelector + subset flags; dynamic supabase; remover key TopBar.
2. Condicionar Auth/Role prefetch + idle import supabase si token.
3. Defer Sentry + pruning modulepreload.
4. Shell split (PublicShell/AuthShell/FeatureShell) + marks de performance.
5. Ajuste manualChunks y re-evaluación con bundle visualizer.

### I. Métricas Objetivo Revisadas
- JS inicial ≤ 180 kB gzip (post-shell split + lazy pesados).
- TTI < 2.5 s (mobile throttled fast 3G / 4G medio).
- `time_to_hero` < 1.0 s en desktop moderado; < 1.6 s móvil.
- Reducción parse JS ≥ 35% vs baseline.

### J. Riesgos y Mitigaciones
- Percepción de latencia auth tras dynamic supabase: Pre-cargar si localStorage token detectado (speculative import).
- Prefetch diluido: Puede retrasar navegación instantánea a rutas profundas; mitigar activando prefetch inmediato tras interacción relacionada (ej. click en menú “Dashboard”).
- Shell split: Asegurar boundaries de error (ErrorBoundary) para lazy shells.

### K. Checklist de Implementación (para issues)
- [ ] Extraer `allCountries` top-level y generar subset CSS.
 - [x] Crear script `scripts/generate-flag-subset.cjs` y generar `flag-icons-subset.css` (guardado en `src/shared/components/forms/CountrySelector/flag-icons-subset.css`). Script integrado en `package.json` (`build` y `flags:generate`).
- [ ] Convertir supabase a dynamic import con wrapper `getSupabase()`.
- [ ] Añadir preconnect supabase host.
- [ ] Reemplazar `modulepreload` supabase/mui-icons por estrategia condicional.
- [ ] Quitar `key` de `<TopBar>` y memo estilos AppShell.
- [ ] Condicionar `AuthPrefetchProvider` a `!session`.
- [ ] Prefetch progresivo por rol (cola + idle).
- [ ] deferred Sentry (idle / firstInteraction).
- [ ] Introducir shells (PublicShell/AuthShell/FeatureShell).
- [ ] Insert performance marks y medir.
- [ ] Re-run bundle analyzer; ajustar manualChunks.

---
Fin del Addendum Deep Dive (2025-08-29). Actualizar esta sección con métricas antes/después cuando se apliquen las fases.

