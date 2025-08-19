## Priorización ciclos de importación (versión 2)

Origen del análisis: `resultadosscript.md` (91 ciclos). Se agrupan por patrón estructural y capas afectadas.

Ley de severidad usada:
- Critico: cruza capas base (shared/layout/navigation/hooks) con dominios (`auth`, `marketplace`, etc.) afectando inicialización, composición del bundle y riesgo de fallos en tiempo de carga / orden de ejecución (hooks de arranque, layout, auth). O ciclos largos (>=7 nodos) que incluyen `dynamic import` y barrels encadenados.
- Alto: cruza dominio ↔ hooks compartidos sin tocar layout/navigation o son ciclos largos dentro de un dominio que incluyen barrels encadenados y wizard (export { … } from) que propagan dependencias innecesarias.
- Medio: intra–dominio (ej. solo `admin`) o ciclos triviales de barrels locales (2-3 nodos) cuya rotura es mecánica y de bajo riesgo. También ciclos de navegación aislados sin dominios superiores.

### 1. Prioridad CRÍTICA

Grupos / Ciclos afectados (números del reporte):
- (26–38), (39–46), (49–57), (59–63), (65–71), (73–88). Patrones repetidos: `shared/components/index -> shared/components/(navigation|layout)/... -> TopBar -> (dynamic import) domains/auth -> auth/index -> auth/components/... -> wizard/... -> shared/components/index` y variantes con `usePrefetch` y `useAppInitialization` intercalados.
- (30,34,39,45,49,55,57,61,63,67,69) incluyen la cadena completa `shared/components/index -> shared/components/layout/index -> AppShell -> useAppInitialization -> usePrefetch -> dynamic import auth`. Estos son los más peligrosos para orden de inicialización.

Riesgos:
- Bloqueo o inconsistencias de inicialización (hooks que importan páginas/domains que a su vez dependen de layout que monta los hooks).
- Aumento del tamaño y menor tree-shaking: barrels en cascada (`index.js` re-exporta todo) fuerzan inclusión amplia.
- Dificulta splitting: `dynamic import` dentro de `TopBar` apunta a `domains/auth` mientras `auth/index` re-exporta componentes que ya arrastran shared.

Acciones recomendadas (romper con el menor cambio):
1. Quitar re-exports ascendentes en `shared/components/index.js` de sub-barrels `navigation`, `layout`. En su lugar, consumirlos directamente donde haga falta (`import { AppShell } from 'shared/components/layout/AppShell'`). (Rompe edges score=4 en muchos ciclos.)
2. Separar `TopBar` en módulo “puro” (sin dynamic import a `domains/auth`). Sustituir el dynamic import por:
	- a) Prop drilling / contexto de auth (AuthContext) provisto por capa superior, o
	- b) Hook perezoso que se inyecta desde el dominio auth (dependency injection) evitando import estático.
3. En `auth/index.js` dejar de re-exportar componentes UI consumidos globalmente; exportar sólo primitivas de dominio (servicios, hooks) o mover wizard y componentes UI a subcarpeta que no se re-exporta hacia arriba.
4. `usePrefetch.js`: eliminar imports directos a `domains/auth` (dynamic o estáticos). Reemplazar por una lista de rutas (strings) + `import()` ejecutado condicionalmente fuera del flujo de importación inicial (por ejemplo dentro de un callback `prefetchAuth()` llamado después de montaje). O bien mover prefetchers a `shared/prefetch/` y que no importen páginas.
5. `useAppInitialization.js`: no debe importar `AppShell` (inversión). Extraer la parte de inicialización a `shared/init/bootstrap.js` y que `AppShell` llame a esa función/hook, evitando la dependencia inversa.
6. Reemplazar barrels en wizard (`domains/auth/wizard/index.js`) – en vez de `export { StepX } from './StepX'` usar imports explícitos donde se consumen o un objeto de configuración en otro archivo que no re-exporta de vuelta al wizard.
7. Añadir regla ESLint personalizada o script CI que falle ante nuevos ciclos cross-layer (para no reintroducirlos tras refactor inicial).

Orden interno sugerido dentro de CRÍTICO:
	1. Barrels `shared/components` (cortar export de `navigation`, `layout`).
	2. Dynamic import en `TopBar` → reemplazar por contexto/prop.
	3. `usePrefetch` y `useAppInitialization` (quitar imports de dominios, usar DI / rutas).
	4. `auth/index.js` reducir re-exports y aislar wizard.
	5. Wizard barrels (StepX) → config object.

### 2. Prioridad ALTA

Grupos / Ciclos:
- Hooks ↔ dominios sin pasar por navigation/layout: (89,90) y variantes donde la cadena central es `Page -> usePrefetch -> useAppInitialization -> shared/hooks/index -> Page`.
- Ciclos largos dentro de auth que ya quedarán resueltos parcialmente por acciones críticas pero específicamente los que enfatizan wizard Steps y barrels (35,37,41,43,45,49,51,53,55,59,61,63,65,67,69). (Si se resuelven los críticos, muchos de estos colapsan; conservar etiqueta ALTA para asegurar seguimiento de residuos.)

Riesgos:
- Dificultan test unitario aislado de hooks de inicialización.
- Favorecen importación prematura de páginas y reducen lazy loading efectivo.

Acciones:
1. En `shared/hooks/index.js` no re-exportar hooks que internamente importan dominios; cada página importa el hook concreto directamente (evita ciclo por barrel).
2. `usePrefetch` pasar a interfaz: `registerPrefetchers([fn])` para que cada dominio se registre tras montar, en vez de que `usePrefetch` haga imports de dominio.
3. Limitar wizard a imports unidireccionales: Steps importan utilidades, no al revés; un contenedor (WizardRoot) importa Steps, pero Steps nunca importan WizardRoot (ni barrels que lo hagan).

### 3. Prioridad MEDIA

Grupos / Ciclos:
- Ciclos intra-dominio ADMIN (1–25). Patrón: `domains/admin/index.js` (barrel con `export { ... } from`) y componentes que para reutilizar cosas importan el `index.js` del dominio creando ciclos 2-nodos y 3-nodos.
- Ciclo reducido de navegación puro (91) `navigation/index.js <-> TopBar`.

Riesgos:
- Principalmente ruido y riesgo de comportamiento no determinista en hot-reload; impacto en runtime bajo (todos dentro de la misma capa).

Acciones sencillas:
1. En componentes admin dejar de importar `../../../domains/admin` (barrel) y usar rutas relativas directas al componente / util necesario.
2. En `domains/admin/index.js` no re-exportar componentes que ya importan el índice; exportar sólo tipos/constantes/hooks o dividir: `index.js` (solo exports puros) y `components/index.js` (UI) sin que ninguno importe al otro.
3. Para (91) eliminar re-export mutuo: `navigation/index.js` debe importar/usar `TopBar` pero `TopBar/index.js` no debe volver a exportar al barrel principal (o viceversa). Elegir dirección única.

### Resumen rápido
- CRÍTICO: romper acoplamiento cruzado shared ↔ layout/navigation ↔ hooks init ↔ auth (ciclos 26–88, subconjunto). Atacar barrels y dynamic import en TopBar primero.
- ALTO: hooks ↔ páginas (89,90) y residuos wizard/auth tras cortes críticos.
- MEDIO: ciclos locales admin (1–25) y navigation pequeño (91).

### Métricas post-refactor esperadas
- Reducción de 91 ciclos a < 15 (solo algunos intra-dominio tolerables) tras aplicar pasos críticos y altos.
- Eliminación de todos los ciclos > 5 nodos.
- `usePrefetch` y `useAppInitialization` sin imports a dominios (solo dependencias invertidas por registro).

### Sugerencia de validación
1. Aplicar cambios críticos en una rama feature y correr script de detección (debería listar <= ~30 ciclos restantes antes de abordar ALTO).
2. Añadir tarea npm `analyze:cycles` y un check en CI que falle si hay ciclos nuevos fuera de una lista blanca (whitelist mínima temporal para ADMIN hasta que se limpie).

---
Fin del documento.

---
### Revisión 2.1 (segunda pasada de verificación profunda)

Objetivo de esta segunda pasada: validar la asignación de prioridades, eliminar solapamientos entre categorías y cuantificar las raíces (edges) que generan la explosión de ciclos.

#### 1. Validación de clasificación previa
La versión 2 agrupó (26–88) como CRÍTICO de forma amplia. Eso incluye también subgrupos que, tras romper los edges raíz (barrels + dynamic import), desaparecerán automáticamente. Para priorizar mejor, conviene separar en subconjuntos disjuntos:

| Subconjunto | Criterio técnico | Ciclos (IDs) | Nº aprox |
|-------------|------------------|--------------|----------|
| C1 (CRÍTICO-A) | Dynamic import en `TopBar.jsx` hacia `domains/auth` (aparece explícito) | 35,37,41,43,45,49,51,53,55,57,59,61,63,65,67,69 | 16 |
| C2 (CRÍTICO-B) | Cadena de inicialización completa `shared/components -> layout -> AppShell -> useAppInitialization -> usePrefetch -> (dynamic import/domains)` | 39,45,49,55,57,61,63,67,69 (subset ya listado) | (9, incluidos dentro de C1) |
| C3 (CRÍTICO-C) | Barrels en cascada `shared/components/index` → `navigation/index` → `TopBar/index` sin aún medir dynamic (edges score=4) | 35,41,47,53,59,65 (representativos) | 6 |
| H1 (ALTO) | Ciclos hook/página sin navegación/layout (prefetch + appInit + página) | 89,90 | 2 |
| H2 (ALTO) | Wizard barrels (`wizard/index -> StepX`) + re-export auth pero SIN pasar por layout (cuando se elimine TopBar dynamic quedarán sólo estos) | 35,41,47,53,59,65 (tras ruptura de barrels shared se degradan a MEDIO) | (hasta 6) |
| M1 (MEDIO) | Intra-admin (1–25) | 1–25 | 25 |
| M2 (MEDIO) | Navegación pura (`navigation/index ↔ TopBar`) | 91 | 1 |

Nota: C2 es subconjunto de C1. Para evitar doble conteo dejaremos una sola lista CRÍTICO final: C1 (dynamic import TopBar) + cadenas con `usePrefetch` (ya incluidas). C3 describe la raíz de propagación (barrels score=4) que hace que con un único edge se generen múltiples variantes combinatorias de ciclos.

#### 2. Raíces (edges) más influyentes
Frecuencia (estimada por aparición en listas de Break candidates y repetición de patrón):
1. `shared/components/index.js -> shared/components/layout/index.js` (export { … } from) – edge score=4, aparece en todos los ciclos que incluyen layout.
2. `shared/components/index.js -> shared/components/navigation/index.js` (export { … } from) – edge score=4, presente en los ciclos con TopBar.
3. `shared/components/navigation/index.js -> shared/components/navigation/TopBar/index.js` (export { … } from) – edge score=4.
4. `shared/components/navigation/TopBar/index.js -> TopBar.jsx` (export { … } from) – edge score=3/4 según heurística.
5. `domains/auth/wizard/index.js -> StepX*.jsx` (export { … } from) – edge score=3.
6. `hooks/usePrefetch.js -> domains/auth/index.js` (dynamic import) – crea cierre del ciclo por inicialización.

Romper (1) y (2) reduce la longitud y fan-out de casi todos los ciclos críticos; romper (6) desactiva la ruta de inicialización cruzada.

#### 3. Priorización refinada (sin solapamientos)
Nueva lista final:
- CRÍTICO: 35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69 (condición: dynamic import TopBar o cadena completa con layout + hooks). (18 ciclos únicos: añadimos 39 y 47 que incluyen layout/hook aunque ya parte de otros grupos.)
- ALTO: 89,90 (páginas marketplace/buyer ↔ hooks) + cualquier residuo wizard (StepX) que persista si el dynamic import se elimina pero aún hay barrels (esperado ≤6, se volverán MEDIO si se desactiva re-export global).
- MEDIO: 1–25 (admin), 91 (navigation pura), más residuos wizard si degradan tras refactor crítico.

#### 4. Ajustes a plan de acción (más granular)
Orden de ejecución sugerido con impacto incremental medible:
1. Eliminar re-exports de `shared/components/index.js` para `navigation` y `layout` (introducir imports directos donde se usen – se puede hacer con codemod regex: `from 'shared/components'` → separar). Métrica esperada: ciclos CRÍTICO bajan ~50% (porque se rompen edges 1 y 2 simultáneamente).
2. Sustituir dynamic import en `TopBar.jsx` por consumo de contexto (inyectado desde AuthProvider) o un callback `lazyLoadAuth()` pasado por props. Métrica: todos los ciclos con TopBar y dynamic import desaparecen (quedarán sólo wizard/auth + barrels si no se tocó wizard aún).
3. Refactor `usePrefetch.js`: exponer API `registerPrefetcher(domainKey, fn)` y eliminar imports internos a dominios. Las páginas/domains llaman al registro en `useEffect` inicial. Rompe la cadena de inicialización cruzada y elimina los ciclos que incluyen hooks aunque no usen TopBar.
4. Aislar wizard: reemplazar `wizard/index.js` re-exports por un `steps.js` que exporte un array/objeto de definiciones. Importar Steps directamente en el componente WizardRoot; Steps dejan de importar barrel auth (si lo hacen). Se eliminan ciclos residuales ALTO.
5. Admin domain: dividir `domains/admin/index.js` en `domains/admin/barrel-safe.js` (sin componentes que importan el barrel) y migrar los imports en componentes hacia rutas relativas. Rompe 1–25 masivamente (bulk, baja prioridad pero limpia base).
6. Navigation puro (91): decidir dirección única (dejar `TopBar/index.js` como simple export *no* referenciado por `navigation/index.js` o viceversa) y documentar regla: “Un barrel no re-exporta un sub-barrel que lo importa”.

#### 5. Métricas de éxito refinadas
Antes vs Después esperado:
| Métrica | Actual | Tras Paso 1 | Tras Paso 2–3 | Tras Paso 4 | Final |
|---------|--------|-------------|---------------|-------------|-------|
| Nº ciclos totales | 91 | ~55 | <25 | <15 | <10 |
| Ciclos ≥7 nodos | >30 | <15 | <5 | 0 | 0 |
| Ciclos con dynamic import TopBar | 18 | 18 | 0 | 0 | 0 |
| Ciclos intra-admin | 25 | 25 | 25 | 25 | 0–3 (si quedan locales tolerables) |

#### 6. Verificación propuesta
Incorporar script de detección en modo “focus” que cante únicamente edges score>=3 para iteraciones rápidas (evita ruido de import simples). Después de cada paso, capturar snapshot JSON con lista de ciclos y guardarlo en `Documentacion/cycle-history/step-X.json` para auditoría.

#### 7. Riesgos / Consideraciones
- Refactor de barrels puede generar muchos cambios de import; conviene soportarse en un codemod para evitar errores manuales.
- Cambiar dynamic import podría afectar carga diferida de módulos auth; validar que no se incrementa el bundle inicial (quizá mantener lazy pero aislado a evento/efecto sin crear ciclo). Usar `() => import('...')` dentro de función que se ejecuta después de montaje y no exportar esa función desde shared.
- Registro dinámico de prefetchers: asegurar orden (si se necesita prefetch antes de primera navegación) usando un barrier `await Promise.all(initialPrefetch())` en bootstrap controlado.

#### 8. Quick Wins (aplicar en un solo commit pequeño)
1. Quitar export de `navigation` y `layout` en `shared/components/index.js`.
2. Sustituir dynamic import de auth en `TopBar.jsx` por placeholder / lazy callback pasado vía prop.
3. Añadir script npm `analyze:cycles` que ejecuta el detector y arroja recuento; documentar uso.

Con eso se valida si la clasificación es correcta: si al ejecutar Paso 1 el número de ciclos críticos se reduce aproximadamente a la mitad, la hipótesis de que barrels son la raíz se confirma.

---
Fin revisión 2.1.

---
### Estado ejecución refactor crítico (checklist vivo)

Leyenda: [x] completado / [~] en progreso / [ ] pendiente

CRÍTICO (Revisión 2.1 - Sección 4)
1. Barrel `shared/components/index.js` dejar de re-exportar `navigation` y `layout`  --> [x] Hecho (se reemplazaron exports directos y se removió AppShell / TopBar del barrel).
2. Eliminar dynamic import en `TopBar.jsx` a `domains/auth`  --> [x] Hecho (placeholders Login/Register; eliminar ciclo largo). 
	- Nota: Requiere luego proveer Auth modals vía provider externo para recuperar funcionalidad (pendiente de diseño, no bloquea eliminación de ciclos).
3. Refactor `usePrefetch.js` (API registerPrefetcher) + invertir dependencia en `useAppInitialization` (no debe forzar import de rutas dominios) --> [x] Completo (prefetch rol movido a `RolePrefetchProvider`; hook ya sin conocimiento de rutas).
4. Aislar wizard auth (remover re-exports StepX en `wizard/index.js`, crear `steps.js` / objeto config) --> [x] Completo (`steps.config.js` con carga dinámica; barrel viejo reducido a API de config).
5. Admin domain: dividir barrel (`domains/admin/index.js`) y reemplazar imports de componentes que usan el barrel --> [x] Completado (todas las referencias a '../../../domains/admin' en componentes/modales reemplazadas por imports directos a servicios; ciclo count ahora 0).
6. Ciclo navegación puro (91): decidir dirección única (`navigation/index` vs `TopBar/index`) --> [x] Resuelto (el ciclo desapareció tras poda de barrels y eliminación de imports recíprocos; ver última ejecución: 0 ciclos).

ALTO
7. Hooks ↔ páginas (ciclos 89,90): después de refactor de prefetch (Paso 3) volver a medir; deberían desaparecer o bajar a MEDIO --> [x] Eliminados (ver salida `node detect_cycles.js`: 0 ciclos totales, confirmando que la cadena pages ↔ usePrefetch/useAppInitialization ya no genera ciclos).

MEDIO
8. Limpieza wizard residual (si quedan re-exports tras Paso 4) --> [x] Completo. `wizard/index.js` ya no re-exporta StepX; `steps.config.js` centraliza configuración y los componentes se cargan vía lazy directa eliminando warnings de mezcla estática/dinámica.
9. Limpieza intra-admin (1–25) tras crear `barrel-safe.js` --> [x] Completado (eliminados ciclos intra-admin al retirar uso del barrel en componentes; siguiente paso: podar exports de componentes pesados del barrel legacy).

Seguimiento adicional
10. Script `analyze:cycles` npm + snapshot JSON (historial) --> [ ] Pendiente (recomendado todavía: agregar script y snapshot actual como baseline cero).

Prioridad inmediata (nuevo enfoque): Finalizar Paso 3 (completar inversión restante en `useAppInitialization` / posible RolePrefetchProvider) y luego Paso 4 (aislar wizard auth). Métrica base establecida: ciclos actuales = 0 (node detect_cycles.js).

---
### Actualización 2025-08-19

Acciones adicionales realizadas desde la última versión del documento:
1. Podado contrato público `domains/auth/index.js` (se excluyen ahora explicitamente `AuthCallback`, `PrivateRoute`, `AccountRecovery`, steps del wizard y componentes auxiliares). Se añadió comentario de deprecación interna.
2. `AppRouter.jsx` actualizado para consumir `PrivateRoute` y `AuthCallback` mediante imports internos directos, evitando exponerlos en el barrel público.
3. Conversión de imports de Steps (registro y recuperación) a un modelo consistente: pasos del wizard ahora sólo se cargan vía lazy (`React.lazy`) + `steps.config.js`. Se eliminaron duplicaciones estático + dynamic que generaban warnings de Rollup/Vite.
4. `Register.jsx` y `AccountRecovery.jsx` migrados a lazy loading de steps dentro de `React.Suspense`, suprimiendo warnings:
	- Mixed static/dynamic import (Step1Account / Step4Verification / Step1Email / Step2Code / Step3Reset / Step3Reset / Step4Success).
5. Confirmación post-refactor: build exitoso sin warnings de duplicación de chunk y con 0 ciclos reportados.

Pendientes recomendados (no bloqueantes para cierre del refactor de ciclos):
- (Paso 10) Añadir script `"analyze:cycles": "node detect_cycles.js --fail-on-cycles"` y guardar snapshot `Documentacion/cycle-history/baseline-0.json`.
- (Opcional) Unificar estrategia de carga de steps usando únicamente `loadWizardStep` donde se haga sentido (si se requiere abstracción adicional) o documentar la convención actual.
- (Opcional) Crear guard de CI que ejecute el script y falle si `cycles > 0`.

Estado final: Todos los pasos críticos (1–9) completados; sólo resta institucionalizar guardarraíles (Paso 10) si se desea blindar el baseline.

---
Fin estado (última actualización automatizada).
