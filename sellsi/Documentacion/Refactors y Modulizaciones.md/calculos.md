# Informe automático: importaciones cruzadas (import cycles)

Fecha: 2025-08-19

Resumen breve
- Se ejecutó un detector AST (usando @babel/parser + traversal) sobre `sellsi/src` para detectar ciclos de importación entre módulos del código fuente (ignora node_modules).
- Se detectaron varios ciclos representativos que conviene revisar porque afectan layout, inicialización y módulos de auth.

Hallazgos principales (representativos)

1) Ciclo entre `shared/components` ↔ `shared/components/navigation/TopBar` ↔ `domains/auth` ↔ `shared/components`
	- Patrón: barrels (`index.js` que re-exporta) + `TopBar` + `domains/auth` que re-exporta componentes crean un ciclo. Aparece por combinación de `export ... from` y `dynamic import()` en `TopBar`.
	- Impacto: puede provocar problemas de bundling, initial render y hot-reload; complica el entendimiento de dependencias.
	- Recomendación: romper el barrel (no re-exportar componentes que dependan de dominios superiores), mover `TopBar` a módulo de bajo nivel o eliminar la dependencia directa a `domains/auth` (inyectar props/context o usar import dinámico en runtime).

2) Ciclo layout/hooks: `shared/components/layout/AppShell.jsx` → `shared/hooks/useAppInitialization` → `hooks/usePrefetch` → dynamic import de dominios → vuelve al layout
	- Patrón: hooks de inicialización que importan/usan módulos de dominio (o hacen prefetch) crean dependencias circulares con las páginas/layouts que los usan.
	- Recomendación: que `useAppInitialization` sea puro (no importe dominios), y que `usePrefetch` reciba funciones/handlers o rutas (strings) en vez de importar directamente páginas; mover lógica de prefetch a `shared/prefetch` sin importar páginas.

3) Ciclos entre barrels (`shared/components/navigation/index.js`) y submódulos (`TopBar`) por re-exports
	- Patrón: `index.js` re-exporta submódulos que a su vez importan desde el barrel. Resultado: ciclo simple index → submodule → index.
	- Recomendación: eliminar re-export circular, hacer exportaciones unidireccionales desde submódulos o crear un barrel separado sin dependencias hacia arriba.

4) Patrones con páginas (MarketplaceBuyer / Marketplace) → `shared/hooks` → `useAppInitialization` → `usePrefetch` → dynamic import → vuelve a la página
	- Observación: prefetch que importa páginas puede cerrar ciclos; preferir listas de rutas/handlers en vez de importar módulos de página desde hooks.

Limitaciones del análisis realizado
- No se analizaron imports a node_modules ni paquetes externos (intencional).
- El detector captura `import`, `export ... from`, `export * from`, `require()` y `import()` dinámico. Aun así, hay casos extremos (resolución de alias no estándar, generadores de código) que pueden quedarse fuera.
- El algoritmo intenta normalizar y deduplicar ciclos; puede haber ciclos más largos o menos obvios no listados aquí.

Prioridad de corrección
- Alta: ciclos que involucran `shared/components` + `domains/auth` o `layout` (afectan inicialización de la app y bundling).
- Media: barrels con re-exports circulares.

Próximos pasos (opciones)
- Opción A (rápida): Genero un reporte detallado por archivo con la línea exacta de import/export que causa cada arista del ciclo (puedo añadirlo a este mismo archivo). Luego proponemos parches mínimos.
- Opción B (activa): Aplico parches mínimos no disruptivos (ej.: convertir imports problemáticos en import dinámico o extraer hook a `shared/`) y ejecuto build/test local para validar.
- Opción C: Añadir en CI un paso que ejecute este detector y falle si aparecen nuevos ciclos.

Si quieres, genero ahora el reporte detallado (lista de ciclos con aristas y la línea de import) y lo commit/pusheo en una rama para revisión; dime cuál opción prefieres.

