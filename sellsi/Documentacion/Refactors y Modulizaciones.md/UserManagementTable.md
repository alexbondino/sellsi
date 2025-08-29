## UserManagementTable.jsx – Análisis y Plan de Refactor

### 1. Veredicto: ¿Real o falso positivo?
El hallazgo es REAL (no falso positivo). Aunque algunos conteos del reporte difieren (imports y TODOs), el archivo concentra demasiadas responsabilidades en un solo componente (>800 líneas, múltiples efectos, manejo de datos, filtrado, selección, acciones, UI de tabla, modales, copy-to-clipboard, composición de tarjetas de estadísticas). Presenta síntomas claros de componente monolítico (“god component”).

### 2. Verificación rápida de métricas (observado vs reporte)
| Métrica | Reporte | Observado (estimado) | Comentario |
|---------|---------|----------------------|------------|
| LOC | 1007 | ~820–860 | Aún excesivo; diferencia probable por versión previa / líneas en blanco. |
| importCount | 9 | 11 | Se cuentan 11 sentencias `import`. |
| functionCount | 64 | ~55–60 | Muchas arrow functions + handlers; sigue alto. |
| ifCount | 40 | ~30–35 | Condicionales dispersos en filtros y handlers. |
| todoCount | 8 | 4 | Repetidos “TODO: Mostrar notificación de éxito”. |
| exportCount | 1 | 1 | Correcto. |
Conclusión: pequeñas discrepancias pero la severidad (“alto”) sigue justificada.

### 3. Principales fuentes de complejidad
1. Acoplamiento de responsabilidades: data fetching, lógica de acciones (ban / verify / delete), filtros, selección múltiple, composición visual y control de 5 modales en un solo archivo.
2. Exceso de estado local heterogéneo (más de 20 piezas) → ruido cognitivo y riesgo de efectos colaterales.
3. Handlers inline + muchos `useCallback` / `useMemo` defensivos que añaden ruido sin medir impacto real en rendimiento.
4. Falta de separación entre “vista” (presentational) y “controlador” (estado + acciones). 
5. Repetición de patrones: apertura/cierre de modales, confirm workflows, recuperación de adminId, manejo de errores.
6. Posible sobre-render: cada cambio de filtros / selección re-renderiza toda la tabla y tarjetas.
7. Dificulta pruebas unitarias: la lógica de negocio está mezclada con JSX y MUI.

### 4. Objetivos del refactor (success criteria)
1. Reducir LOC del componente principal a <250 líneas.
2. Extraer lógica de datos / acciones a hooks testeables.
3. Disminuir número de handlers en el componente principal a <10.
4. Facilitar lazy renders / memoización granular en filas de la tabla.
5. Unificar gestión de modales en un único reducer / hook.
6. Preparar capa para añadir notificaciones centralizadas (remplazar TODOs). 

### 5. Estrategia incremental (sin romper funcionalidades)
Fase 0 (Preparación): Añadir tests ligeros o al menos Story / snapshot para baseline visual (opcional si no hay infraestructura de tests). 
Fase 1 (Extracción de lógica):
- Crear hooks: `useAdminUsersData`, `useUserFilters`, `useUserSelection`, `useUserActions`, `useUserModals`.
- Mover funciones utilitarias y constantes a archivos dedicados.
Fase 2 (División UI):
- Componentizar: `UserStatsHeader`, `UserFiltersBar`, `UsersTable`, `UserRow`, `UserIdPopover`.
- Cada subcomponente recibe solo props necesarios (evitar pasar `users` completo donde no aplica).
Fase 3 (Optimización / limpieza):
- Eliminar `useCallback/useMemo` innecesarios tras división (medir con React DevTools Profiler si disponible). 
- Añadir capa de notificaciones (ej: snackbar central) para reemplazar TODOs.
Fase 4 (Refinamiento):
- Añadir tests unitarios de hooks críticos: ban / verify / delete flows y filtrado.
- Documentar contrato de cada hook en JSDoc / README interno.

### 6. Propuesta de nueva estructura de archivos
```
src/domains/admin/components/users/
	UserManagementTable/index.jsx            (Componente orquestador reducido)
	UserManagementTable/hooks/useAdminUsersData.js
	UserManagementTable/hooks/useUserFilters.js
	UserManagementTable/hooks/useUserSelection.js
	UserManagementTable/hooks/useUserActions.js
	UserManagementTable/hooks/useUserModals.js
	UserManagementTable/components/UserStatsHeader.jsx
	UserManagementTable/components/UserFiltersBar.jsx
	UserManagementTable/components/UsersTable.jsx
	UserManagementTable/components/UserRow.jsx
	UserManagementTable/components/UserIdPopover.jsx
	UserManagementTable/constants/userStatus.js
	UserManagementTable/utils/userUtils.js
```

### 7. División de responsabilidades (contratos resumidos)
- useAdminUsersData: fetch inicial + `refresh`, expone `{ users, stats, loading, error, setError }`.
- useUserFilters: maneja estado `{ status, userType, search }` + debouncedSearch + `setFilter(field, val)` + `filteredUsers` (recibe `users`).
- useUserSelection: gestiona `selected`, `toggle(id)`, `toggleAll(list)` y `clear()`.
- useUserModals: estado y acciones: `open(type, payload)`, `close(type)`, flags específicos (`banModal`, etc.).
- useUserActions: funciones asíncronas ban/unban/verify/unverify/delete/deleteMultiple; centraliza `adminId` y normaliza respuesta (devuelve `{ ok, error }`).
- Presentational components: Solo JSX + estilo; no side-effects.

### 8. Refactor táctico detallado
Paso 1: Extraer constantes y utilidades (USER_STATUS, USER_FILTERS, getUserStatus, getUserActiveProducts, getCurrentAdminId) a `constants/` y `utils/`.
Paso 2: Crear `useAdminUsersData` (mover `loadData` + estados `users, stats, loading, error`). Eliminar dentro del componente original.
Paso 3: Crear `useUserFilters` incorporando debounce (remover el doble estado `searchTerm/debouncedSearchTerm` del componente principal).
Paso 4: Crear `useUserSelection` para `selectedUsers` + lógica select all.
Paso 5: Crear `useUserModals` con un único objeto state + reducer o varios slices agrupados; reemplazar 5 pares open/close repetidos.
Paso 6: Crear `useUserActions` que reciba callbacks `onSuccess=refresh` y gestione errores centralmente (setError externo o retorno).
Paso 7: Migrar cada bloque de UI a subcomponentes; el contenedor final orquesta:
```jsx
const { users, stats, loading, error, refresh, setError } = useAdminUsersData();
const { filters, setFilter, filteredUsers } = useUserFilters(users);
const selection = useUserSelection(filteredUsers);
const modals = useUserModals();
const actions = useUserActions({ refresh, setError, modals, selection });
```
Paso 8: Sustituir `useCallback/useMemo` redundantes después de la separación; dejar sólo donde `React.memo` en filas detecte mejoras.
Paso 9: Implementar sistema de notificaciones (Snackbar context) para reemplazar los TODOs.
Paso 10: Documentar en este archivo resultados y métricas nuevas.

### 9. Ejemplo de hook (borrador simplificado)
```js
// useUserActions.js
import { banUser, unbanUser, verifyUser, unverifyUser, deleteUser, deleteMultipleUsers } from '../../services/adminUserService';
import { getCurrentAdminId } from '../utils/userUtils';

export function useUserActions({ refresh, setError, modals, selection }) {
	const withAdmin = async (fn) => {
		const adminId = getCurrentAdminId();
		if (!adminId) return { ok: false, error: 'No hay sesión administrativa activa' };
		try { return await fn(adminId); } catch { return { ok: false, error: 'Error interno del servidor' }; }
	};

	const ban = async (userId, reason) => withAdmin(async (adminId) => {
		const r = await banUser(userId, reason, adminId); if (r.success) { await refresh(); return { ok: true }; } return { ok: false, error: r.error };
	});
	// ...unban, verify, unverify, deleteOne, deleteMany similares
	return { ban };
}
```

### 10. Riesgos y mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Introducir regresiones en acciones (ban/verify) | Refactor incremental + pruebas manuales por feature antes de seguir. |
| Duplicación temporal de código durante extracción | Eliminar bloques originales inmediatamente tras validar hook. |
| Sobre-ingeniería de hooks | Mantener superficie mínima (solo exponer lo usado). |
| Pérdida de rendimiento por renders adicionales | Usar `React.memo` en `UserRow` + derive props mínimas. |

### 11. Métricas esperadas post-refactor
| Métrica | Objetivo |
|---------|----------|
| LOC componente principal | < 250 |
| LOC sumados (nueva carpeta) | 500–600 (distribuidos) |
| functionCount en componente principal | < 15 |
| ifCount en componente principal | < 10 |
| Cyclomatic de handlers críticos | Reducido al aislar lógica en hooks |

### 12. Checklist rápida ejecución
- [ ] Extraer constantes / utils
- [ ] Crear hooks data / filtros / selección
- [ ] Crear hook modales unificado
- [ ] Crear hook acciones
- [ ] Migrar UI a subcomponentes (stats, filtros, tabla, fila, popover)
- [ ] Eliminar callbacks redundantes
- [ ] Añadir sistema notificaciones
- [ ] Documentar métricas finales

### 13. Próximos pasos sugeridos tras refactor
1. Añadir tests para `useUserFilters` (casos: status, tipo, búsqueda). 
2. Añadir Logging estructurado para acciones admin (auditoría). 
3. Integrar paginación y/o virtualización (si lista de usuarios crece) con `react-window` o MUI DataGrid Pro.
4. Normalizar data layer (React Query / TanStack Query) para cache y revalidación.

---
Resumen: El componente excede responsabilidades y tamaño; el refactor propuesto fragmenta en hooks y subcomponentes, reduce complejidad cognitiva y prepara el terreno para escalabilidad y pruebas.

---

## Análisis Profundo Complementario (V2) – Validación y Nuevos Hallazgos

Esta sección valida el análisis inicial y agrega dimensiones que no fueron cubiertas o que requieren mayor precisión técnica.

### A. Validación de Supuestos Previos
| Área | Supuesto Inicial | Validación | Ajuste |
|------|------------------|-----------|--------|
| Severidad | “God component” | Confirmado: >800 LOC, >18 piezas de estado, >30 handlers | Mantener prioridad alta |
| Métricas difieren (LOC, imports, TODOs) | Podría ser versión previa | Posible, pero no cambia diagnóstico | Añadir script métrico para baseline reproducible |
| Uso de useCallback/useMemo | Varios innecesarios | Confirmado: algunos wrappers no se pasan a hijos memoizados | Plan: eliminar tras dividir |
| Filtros locales suficientes | Aceptable ahora | Escalará mal con >1–2K usuarios | Plan futuro: paginación server-side |

### B. Dimensiones Adicionales No Cubiertas
1. Rendimiento de Enriquecimiento de Datos:
	- `_enrichUsersWithProductCount` ejecuta una consulta secuencial por usuario (N+1 queries). Riesgo de latencia alta cuando crece la base.
	- Mejora propuesta: query agregada en SQL (JOIN + COUNT con condiciones) o Supabase RPC (stored procedure) que retorne `active_products_count` en un solo round trip.
2. Concurrencia / Doble Interacción:
	- Acciones ban/verify/delete no bloquean ni deshabilitan los botones → riesgo de doble click generando acciones duplicadas o errores de estado.
	- Solución: `inFlightActions` (Set con claves `action:userId`) + disabled states.
3. Integridad de Datos / Autorización:
	- Obtención de `adminId` desde `localStorage` sin validar sesión activa ni roles.
	- Recomendado: centralizar en contexto de autenticación (o middleware supabase RLS) y propagar token / claims.
4. Auditoría / Trazabilidad:
	- Lado UI no registra eventos (solo back-end). Añadir hook `useAdminAuditLog` para log local opcional (debug) + envío estructurado si requerido.
5. Accesibilidad (WCAG):
	- Celdas de acción solo íconos: falta `aria-label` y `title` en algunos (Tooltip ayuda, pero no siempre suficiente para lectores de pantalla).
	- Popover de ID: no maneja foco al abrir/cerrar → añadir `autoFocus` y retorno de foco.
6. Diseño de Errores:
	- `setError(string)` global único colapsa múltiples orígenes (fetch, acción, copy clipboard). Proponer shape `{ scope, code, message }` y un stack local de errores recientes (máx 3) para UX más clara.
7. Internacio­nali­zación:
	- Strings estáticos en español directamente en JSX. Extraer catálogo simple (`i18n/users.es.js`) → facilita escalado.
8. Testabilidad Real:
	- Lógica de filtrado contiene 4 condiciones anidadas; conviene pure function `filterUsers(users, filters)` + tests con tabla de casos.
9. Observabilidad de Performance:
	- No hay mediciones. Introducir medición ligera: `performance.mark` alrededor de `loadData` y un logger dev (solo en desarrollo).
10. Estilos y Theming:
	- `commonStyles` contiene tokens (colores hardcodeados). Migrar a theme (`palette.*`) para evitar drift visual.
11. Prevención de Re-renders:
	- `filteredUsers` recalculado en cada render si `filters` cambia. Aceptable, pero si escala → considerar memo con dependencias más específicas + derivar búsqueda en web worker si dataset grande.
12. Seguridad de Clipboard:
	- Copia de ID sin confirmación adicional. Riesgo menor, pero se podría registrar en auditoría si es sensible.

### C. Clasificación de Complejidad (Desglose Objetivo)
| Categoría | Indicador | Nivel |
|-----------|-----------|-------|
| Tamaño | LOC > 800 | Alto |
| Estado | > 20 piezas | Alto |
| Funciones UI/Handlers | > 30 | Alto |
| Queries por ciclo | N+1 potencial | Crítico (si usuarios >100) |
| Cohesión | Mezcla de 7 responsabilidades | Bajo |
| Acoplamiento externo | Servicios + localStorage + MUI mezclados | Medio/Alto |
| Debt de i18n | 0% externalizado | Medio |
| a11y | Falta labels en íconos críticos | Medio |

### D. Ajustes al Plan Original
Añadir antes de “Fase 1”:
1. Script métrico (`scripts/analyze_user_management_table.js`) para capturar baseline (LOC, handlers, ifs, usos de useCallback).
2. Medir latencia actual de `loadData` (cronometro simple) para justificar optimización de enrichment.

Modificar Fase 1:
3. Extraer enriquecimiento a nueva función asíncrona agrupada (o dejar placeholder para RPC) antes de dividir hooks para no propagar deuda.

Insertar Fase 1.5 (Performance Data Layer):
4. Prototipo de endpoint o SQL agregada para `active_products_count`.

Ampliar Fase 3:
5. Introducir `inFlightActions` + disabled states.
6. Introducir `useNotifications` (hook simple) previo a una solución global más compleja.

### E. Diseño de la Nueva Capa de Acciones (Normalización)
Contrato sugerido:
```ts
type AdminActionResult<T=undefined> = { ok: true; data?: T; meta?: any } | { ok: false; code: string; message: string; recoverable?: boolean };
```
Mapeo de errores internos: `throw new Error('El usuario ya está baneado')` → `{ ok:false, code:'USER_ALREADY_BANNED', message:'...', recoverable:false }`.

### F. Optimización de Enriquecimiento (Ejemplo SQL)
Propuesta (conceptual) para reemplazar bucle JS:
```sql
SELECT u.user_id,
		 COUNT(p.productid) FILTER (WHERE p.is_active = true AND COALESCE(p.productqty,0) >= COALESCE(p.minimum_purchase,1)) AS active_products_count
FROM users u
LEFT JOIN products p ON p.supplier_id = u.user_id
GROUP BY u.user_id;
```
Luego merge por clave en el servicio `getUsers`.

### G. Riesgos Nuevos Identificados y Mitigación
| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Inconsistencia active_products_count (race) | Datos desfasados | Invalidar cache al mutar productos relevantes |
| Duplicación notificaciones en acciones múltiples | UX ruidosa | Debounce de notificaciones (agrupar por tipo) |
| Crecimiento de hooks → confusión | Mantenibilidad | Prefijo consistente (`useUMT*`) y README local |
| Errores silenciosos en clipboard | Debug difícil | Añadir console.debug o notificación opcional (dev) |

### H. Métricas de Calidad Adicionales Post Refactor
| Métrica | Método | Objetivo |
|---------|--------|----------|
| Latencia loadData (p50) | performance.now | < 300ms (lista 100 usuarios) |
| Re-render de fila inmutable al modificar búsqueda | DevTools Profiler | 0 |
| Tiempo de respuesta acción (ban) a feedback visual | Crono manual | < 150ms mostrar spinner |
| Cobertura de paths de error en acciones | Tests | ≥ 60% |

### I. Orden Final Consolidado (Refinado)
1. Baseline métricas + medición latencia & N+1.
2. Refactor enrichment → query agregada.
3. Extraer constantes/utilidades.
4. Crear hooks data / filtros / selección.
5. Hook modales + normalización acciones.
6. Subcomponentes UI (stats, filtros, tabla, fila, popover).
7. In-flight actions + notificaciones.
8. i18n extracción mínima (diccionario local).
9. a11y labels + foco popover.
10. Cleanup callbacks y profiling.
11. Tests de hooks + error mapping.
12. Documentar métricas finales + delta.

### J. Quick Wins (Muy Bajo Riesgo – Implementar Temprano)
1. Añadir `aria-label` a todos los IconButton con solo ícono.
2. Centralizar `getCurrentAdminId` en único util y validar null antes de cada acción (ya se hace parcialmente, formalizar). 
3. Añadir `disabled={loading}` al botón FAB de refrescar cuando una acción está en curso.
4. Sustituir colores hardcodeados (#1976d2, #FF8C00…) por `theme.palette.*`.

### K. Criterios de “Hecho” (Definition of Done) para este refactor
Debe cumplirse TODO lo siguiente:
1. Componente principal < 250 LOC.
2. Sin N+1 fetch por usuario para conteo de productos.
3. Acción `ban` imposible de duplicar vía doble click rápido.
4. Fila de usuario no re-renderiza si otro usuario cambia de estado (medido). 
5. Mínimo 5 tests: filtros, selección, ban (éxito), ban (usuario ya baneado), deleteMultiple (mezcla éxito/error). 
6. Documentación actualizada (sección “Métricas finales” añadida al archivo).

### L. Posibles Omisiones Del Análisis Inicial (Corregidas Aquí)
| Omisión | Ahora Cubierto |
|---------|----------------|
| N+1 en enriquecimiento | Sí (Sección B.1 & F) |
| In-flight duplication | Sí (B.2 & G) |
| a11y de IconButtons | Sí (B.5 & J) |
| Estrategia de error taxonomy | Sí (E) |
| Métrica de latencia real | Sí (H) |
| Integración futura con caching lib | Referenciada (Roadmap) |

---
Conclusión V2: El diagnóstico original es válido; se han identificado optimizaciones estructurales adicionales (principalmente eliminación del N+1, normalización de errores, in-flight control y accesibilidad) que elevan la robustez y escalabilidad del refactor. El plan ajustado prioriza mitigación de cuellos de botella antes de distribuir la lógica.


