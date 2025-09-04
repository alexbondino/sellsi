## TopBar.jsx – Análisis Profundo y Propuesta de Refactor

Fecha: 2025-08-29  
Archivo analizado: `src/shared/components/navigation/TopBar/TopBar.jsx`  
LOC: 823 | imports: 18 | funciones/handlers: ~60 | if/branch count: 33 | churn: 65 | score interno: 59 | severidad: ALTO

---
### 1. Resumen Ejecutivo
El componente `TopBar` concentra responsabilidades heterogéneas (navegación, autenticación modal, cambio de rol, notificaciones, carrito, búsqueda marketplace móvil, routing contextual, manejo de listeners globales, estilos y layout responsivo). Su tamaño, fan-in implícito (eventos globales) y fan-out (múltiples dominios: auth, cart, notifications, role) elevan el riesgo de regresiones y dificultan la extensibilidad. El refactor propuesto busca: (a) Segregar responsabilidades en sub-componentes y hooks dedicados, (b) Reducir complejidad cognitiva y ramas condicionales específicas de estado de sesión / rol / viewport, (c) Formalizar contratos (props) y eliminar eventos window ad-hoc para búsqueda, (d) Facilitar test unitario y visual incremental, (e) Normalizar estilos y evitar duplicaciones inline.

Conclusión: Requiere refactor incremental en 3 fases. No refactor masivo único para minimizar riesgo sobre barra crítica de navegación.

---
### 2. Métricas y Señales de Riesgo
| Métrica | Valor | Observación |
|---------|-------|------------|
| LOC | 823 | >300 suele indicar necesidad de partición |
| importCount | 18 | Importa dominios cruzados (auth, notifications, cart, role) |
| function/handler count | ~60 | Alto para un único archivo de UI |
| ifCount | 33 | Altas ramas; mezcla lógica de negocio + presentación |
| churn | 65 | Cambia con frecuencia → conviene estabilizar API más pequeña |
| score | 59 | Umbral interno marcado como "alto" |
| exportCount | 1 | Monolito exportado |

Otros indicadores cualitativos: uso de `window.addEventListener` para bus de auth y búsqueda marketplace; estilos repetidos `outline/boxShadow/hover`; condicionales grandes para loggedIn y role.

---
### 3. Responsabilidades Identificadas (SRP Violations)
1. Presentación de layout (estructura fija, responsive breakpoints).  
2. Render condicional de navegación pública vs privada.  
3. Control de autenticación (apertura/cierre de modales login / register + transición).  
4. Selección y derivación de rol (route-based + prop isBuyer + loading).  
5. Gestión de notificaciones (popover, dialog grande, marca de leído, vista tab).  
6. Gestión de carrito (badge & navegación).  
7. Búsqueda marketplace móvil (estado local + eventos disparados).  
8. Routing y side-effects (navigate con manipulación de scroll y query).  
9. Normalización de paddings dinámicos y estilos inline repetidos.  
10. Control de avatar (fade-in, fallback).  
11. Modal genérico "Próximamente" (scope distinto).  
12. Menú móvil y menú perfil (estructura y comportamiento).  

---
### 4. Principales Code Smells
| Tipo | Evidencia | Riesgo |
|------|-----------|--------|
| God Component | Mezcla 12 responsabilidades | Dificultad de evolución |
| Event Bus Implícito | `window.addEventListener('openLogin'...)`, `marketplaceSearch` | Fragilidad / no tipado |
| Condicionales Anidados | Bloques loggedIn vs !loggedIn; buyer vs supplier | Aumento complejidad cognitiva |
| Estilos Duplicados | Repetición de `outline/boxShadow/border` resets | Fricción mantenimiento visual |
| Lógica de Ruta Incrustada | `getRoleFromCurrentRoute` dentro del render file | Duplicación potencial con otras áreas |
| Mezcla View + Domain | Notif logics + auth + cart en mismo nivel | Acoplamiento inadecuado |
| Side Effects Inline | Navigate con timers (`setTimeout`), dispatch events window | Comportamiento no evidente |
| Testability Reducida | Dificultad de aislar estados para pruebas | Bajos niveles de cobertura |
| Render Bloated | 200+ líneas de JSX en return | Mayor riesgo de conflicto de merge |

---
### 5. Análisis de Estado y Eventos
Estados internos actuales (parciales): loginModal, registerModal, mobileMenuAnchor, profileAnchor, notifAnchor, notifModalOpen, mobileSearch, comingSoonModal, avatarLoaded. Muchos de estos son ortogonales y pueden aislarse en hooks/componentes específicos. Eventos window para auth y búsqueda deberían reemplazarse con un contexto o dispatcher centralizado.

Problema: `mobileSearch` dispara eventos (debounce) + navegación condicional; esto pertenece a un hook `useMarketplaceSearch` reutilizable.  
Problema: Doble origen de rol (prop isBuyer + análisis de ruta) puede generar desincronización; debería centralizarse en `useRoleFromRoute(roleContext)`.

---
### 6. Performance / Render
Riesgos menores de performance: Re-render completo al cambiar `mobileSearch` (aunque se restringe a buyer+marketplace). Notification context triggers rerender de toda la barra. Avatar fade cambia estado. No se usan `memo`/`useCallback` para handlers pasados en cascada (menor impacto actualmente). Descomposición reducirá renders costosos (ej. popovers) mediante `React.memo`.

Optimización futura: Cargar perezoso (lazy) también NotificationListPanel y separar boundary Suspense (actualmente solo auth modals). Considerar dynamic import para MobileSearch en mobile-only.

---
### 7. Accesibilidad / UX
Botones desactivan ripples y outlines; riesgo de accesibilidad teclado. Se debería:  
* Permitir focus visible (usar `:focus-visible`).  
* Proveer `aria-label` en icon buttons (carrito, campana, menú).  
* Asociar menú perfil con `aria-controls`/`aria-haspopup`.

---
### 8. Seguridad / Robustez
Logout: hace múltiples verificaciones; ok, pero silencia errores (podría loguear). Eventos globales carecen de namespacing → posible colisión. No se valida input de search (podría normalizar / trim / length guard antes de dispatch).

---
### 9. Debt Map (Clasificación)
| Categoría | Ítems |
|-----------|-------|
| Arquitectura | God component, event bus ad-hoc |
| Mantenibilidad | Estilos repetidos, condicionales múltiples |
| Test | Falta seam para aislar notificaciones, auth modals |
| UX/A11y | Focus oculto, aria parcial |
| Performance | Re-render global por contextos múltiples |
| Observabilidad | Errores silenciados (logout) |

---
### 10. Objetivos del Refactor
1. Reducir LOC del archivo principal a <250.  
2. Garantizar separación Container vs Presentational.  
3. Eliminar listeners window para auth / marketplace.  
4. Aumentar cobertura testable (rol derivado, búsqueda, apertura de menús).  
5. Centralizar estilos y tokens reutilizables.  
6. Mejorar accesibilidad (focus states + aria).  

KPIs post-refactor:  
* TopBarContainer LOC ~120–160.  
* Subcomponentes individuales <120 LOC.  
* Repetición de estilo (heurística) -70%.  
* Tests unidad: 6 casos clave cubriendo >80% branches de rol y menús.  

---
### 11. Diseño Propuesto (Descomposición)
Nueva estructura sugerida:
```
shared/components/navigation/TopBar/
	TopBarContainer.jsx        // Orquesta datos (role, session, context) y decide qué renderizar
	TopBarView.jsx             // Puro presentational; recibe props ya derivados
	components/
		LogoLink.jsx
		RoleSwitchControl.jsx
		NotificationsMenu.jsx    // Popover + Dialog + bell
		AuthModals.jsx           // Control central login/register + transición
		MobileMarketplaceSearch.jsx
		ProfileAvatarButton.jsx
		PublicNavLinks.jsx
		PrivateNavActions.jsx
		MobileMenu.jsx
	hooks/
		useRoleFromRoute.js
		useAuthModalBus.js       // Reemplaza eventos window (exponer openLogin/openRegister)
		useMarketplaceSearch.js  // Maneja debounce + dispatch vía context
	topBar.styles.js           // Exporta objetos sx reutilizables
	index.js                   // Re-export público controlado
```

Separaciones Clave:
* Container: obtiene session, role, notifications, cart, routing helpers.  
* View: solo recibe props preparados (e.g. `navLinks`, `rightActions`, `mobileMenuItems`, handlers ya memorized).  
* Hooks encapsulan side-effects (listeners, debounce, derivación de rol).  
* MarketplaceSearch: recibe `onSearch(term)` que se conecta a un contexto (no window event).  
* Logo handler separado: ahora `onLogoClick` distinto de `onGoToProfile` para semántica clara y futuras métricas.
* Accesibilidad (Fase 3 a11y parcial): roles/navigation, aria-label en botones (logo, notificaciones, menú móvil, perfil), focus visible para logo, alt avatar, aria-haspopup/expanded en menús y campana, label en switch de rol, labels y aria-controls vinculados (perfil, menú móvil), label campo búsqueda y botón enviar, soporte teclado campana mobile.
* NotificationsMenu: aísla lógica de popover/dialog + markAsRead.

Patrón de datos:  
```
TopBarContainer
	├─ useRoleFromRoute(roleCtx, location, isBuyerProp)
	├─ useAuthModalBus() => { openLogin, openRegister, state }
	├─ useMarketplaceSearch({ onReactiveSearch })
	└─ Ensambla props → <TopBarView {...props}/>
```

---
### 12. Contratos (Draft)
TopBarView props (propuesta):  
* `publicLinks: {label, onClick}[]`  
* `privateActions: ReactNode` (paquete de acciones desktop)  
* `mobileMenuItems: MenuEntry[]`  
* `role: 'buyer'|'supplier'|null`  
* `onRoleChange(role)`  
* `isLoggedIn: boolean`  
* `onLogoClick()`  
* `authModals: { loginOpen, registerOpen, openLogin, openRegister, closeLogin, closeRegister, transitionLoginToRegister }`  
* `notifications: { unreadCount, panel, open, close }`  
* `cartCount: number`  
* `mobileSearch?: { value, onChange, onSubmit, visible }`  

---
### 13. Fases de Implementación
#### Fase 0 (Preparación – 30-45m)
* Crear `topBar.styles.js` con tokens reutilizados (`buttonReset`, contenedores).  
* Añadir tests snapshot inicial (para asegurar regresión mínima).  

#### Fase 1 (Extracción No Intrusiva – 2-3h)
* Mover lógica de avatar a `ProfileAvatarButton`.  
* Extraer `AuthModals` (mantener misma API interna).  
* Extraer `NotificationsMenu` (sin modificar lógica markAsRead).  
* Sustituir JSX inline con subcomponentes; mantener TopBar.jsx como orquestador temporal.  

#### Fase 2 (Hooks y Evento Marketplace – 3-4h)
* Crear `useRoleFromRoute` (copia lógica actual + tests).  
* Crear `useAuthModalBus` (reemplaza window events; exponer funciones globales vía `window.sellsiAuth` si se requiere compatibilidad temporal).  
* Crear `useMarketplaceSearch` con debounce interno; exponer callback `onImmediateSubmit` para Enter/botón.  
* Reemplazar dispatch `window.dispatchEvent('marketplaceSearch')` por contexto `MarketplaceSearchContext`.  

#### Fase 3 (Container/View Split – 2h)
* Renombrar `TopBar.jsx` → `TopBarContainer.jsx`.  
* Introducir `TopBarView.jsx` puro sin hooks excepto MUI.  
* Ajustar import público a `index.js`.  

#### Fase 4 (A11y + Estilos + Limpieza – 1-2h)
* Añadir `aria-label` y `aria-haspopup` a icon buttons y menús.  
* Reemplazar resets repetidos por clase SX central `focusReset` que conserva `:focus-visible`.  
* Eliminar inline style duplication.  

#### Fase 5 (Opcional / Performance) 
* Lazy load de `NotificationListPanel` y `MobileMarketplaceSearch` en móvil.  
* Memoizar subcomponentes (NotificationsMenu, PublicNavLinks) con `React.memo`.  

---
### 14. Plan de Pruebas
Pruebas unitarias (React Testing Library):  
1. Derivación de rol desde ruta (buyer/supplier neutrales).  
2. Apertura/cierre de modales login → register transition.  
3. Toggle rol dispara callback `onRoleChange`.  
4. Notificaciones: abrir popover y marcar item como leído llama `markAsRead`.  
5. Búsqueda móvil: Enter fuera de marketplace navega; dentro dispara callback.  
6. Logout limpia menús y navega a `/`.  

Pruebas E2E (Playwright sugerido):  
* Flujo cambio de rol + persistencia navegación.  
* Flujo notificación → navegación a órdenes.  

---
### 15. Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Regresión en navegación | Snapshot + E2E básico para rutas críticas |
| Eventos externos que dependían de window | Mantener capa de compat temporal en Fase 2 (`window.sellsiAuth.openLogin()`) |
| Desfase con RoleProvider | Alinear hook `useRoleFromRoute` importando de provider (no duplicar lista de rutas) |
| Aumento temporal de archivos | Documentar en README local del folder TopBar |

---
### 16. Accesibilidad (Checklist Post Refactor)
* Todos IconButton con `aria-label`.  
* Focus visible restablecido (`:focus-visible`).  
* Menús con atributos `aria-controls`, `aria-expanded`.  
* Contraste de colores (blanco sobre #000 ok).  

---
### 17. Backlog Técnico Derivado
1. Implementar contexto `MarketplaceSearchContext`.  
2. Centralizar rutas role-specific en `roleRoutesMap` compartido.  
3. Añadir logger liviano para errores silenciados (logout).  
4. Linter custom rule: prohibir `window.addEventListener` en componentes UI (excepto adaptadores).  
5. Documentar eventos públicos en `EVENTS.md`.

---
### 18. Criterios de Finalización (Definition of Done del Refactor)
* `TopBarContainer.jsx` <= 180 LOC.  
* Sin listeners directos a window en container (salvo compat layer marcada `@deprecated`).  
* Tests unidad verdes (>=6).  
* A11y checklist cumplido.  
* Documentación actualizada (este archivo + README del folder).  

---
### 19. Decisión Final
Refactor NECESARIO (severidad alta). Enfoque incremental aprobado para mantener continuidad operativa. Priorizar Fases 1–3 dentro de la próxima iteración de mantenimiento; Fases 4–5 pueden alinearse con sprint de optimización UI/UX.

---
### 20. Próximos Pasos Inmediatos (Acción)
1. Crear `topBar.styles.js` y extraer estilos repetidos.  
2. Extraer `ProfileAvatarButton` + `AuthModals` (pull request inicial).  
3. Añadir test base der rol y modales.  

---
### 21. Validación y Ajustes Posteriores (Addendum 2025-08-29)
Revisión adicional detectó puntos no documentados o matices a corregir. No invalida el análisis base; lo complementa.

#### 21.1 Observaciones Nuevas
| Ítem | Detalle | Acción Recomendada |
|------|---------|--------------------|
| Import muerto | `NotificationsIcon` nunca usado | Eliminar (Fase 1) |
| Imports fragmentados | Múltiples bloques MUI (`Menu` y luego `Popover`, etc.) | Consolidar (Fase 1) |
| Código muerto | `openComingSoonModal` nunca seteado a true | Quitar modal o implementar trigger real (Fase 1) |
| Listeners re-registrados | Efecto auth depende de `openLoginModal`/`openRegisterModal` | Cambiar a array vacía + refs (Fase 2) |
| Layout 100vw | `width:'100vw'` puede causar scroll horizontal | Usar `width:'100%'` + left/right 0 (Fase 4) |
| Layout shift switch | Switch aparece tras load rol | Reservar espacio / skeleton (Fase 4) |
| Transición login→register | Usa `setTimeout(100)` mágico | Reemplazar por callback `onExited` del modal (Fase 2) |
| Normalización búsqueda | Falta trim consistente + límite | Sanitizar antes de producir evento (Fase 2) |
| Duplicación navegación perfil | Lógica repetida en menús | Extraer util `navigateToProfile(role)` (Fase 1) |
| Historial inflado | Uso de `?t=Date.now()` repetido | Considerar `replace: true` o state (Fase 3) |
| Accesibilidad | Falta `aria-label` en icon buttons | Añadir (Fase 4) |
| Focus outlines removidos | Reset agresivo de estilos | Implementar `:focus-visible` friendly (Fase 4) |
| Avatar fade state | `avatarLoaded` provoca rerender | Usar clase CSS con transición (Fase 5) |
| Event naming global | Eventos sin namespace | Introducir `sellsi:` prefix o wrapper (Fase 2) |

#### 21.2 Ajustes a Fases
Fase 1 (ampliada):
* Eliminar import muerto y modal "Próximamente" si no hay roadmap inmediato.
* Consolidar imports MUI.
* Extraer helper `navigateToProfile(role,isBuyer)`.

Fase 2 (reforzada):
* Sustituir `setTimeout` en transición auth por callback de cierre (modal event / promise).
* Implementar `useAuthModalBus` con namespace `sellsi` para compat (`window.sellsiAuth`).
* Sanitizar búsqueda (trim, length <= 120, bajar a minúsculas si aplica tokenización) previo a dispatch.
* Normalizar listeners auth (array dependencias vacía + refs internas).

Fase 3 (añadido):
* Revisar estrategia de forzado de scroll: reemplazar query timestamp por state o anchor id estable.

Fase 4 (a11y & layout):
* Reemplazar `100vw` por `100%` y asegurar `box-sizing: border-box`.
* Reservar ancho del switch con contenedor placeholder.
* Añadir `aria-label`, `aria-haspopup`, `aria-expanded` dinámicos.

Fase 5 (perf opcional):
* Migrar fade avatar a CSS only (sin estado JS).
* Memo para arrays `desktopNavLinks`, `mobileMenuItems` usando dependencias (isLoggedIn, role, counts).

#### 21.3 Riesgos Actualizados
| Riesgo Nuevo | Mitigación |
|--------------|-----------|
| Historial contaminado por timestamps | Reemplazar navigate con `replace` o state contextual |
| Re-renders por arrays recreadas | Memoizar colecciones (Fase 5) |
| Posible colisión nombres eventos globales | Prefijo `sellsi:` + wrapper bus |

#### 21.4 KPIs Ajustados
Se añade KPI: 0 imports muertos en `TopBarContainer` y 0 código muerto (modal sin trigger) tras Fase 1.

#### 21.5 Próxima Acción Concreta
Primera PR debe incluir: limpieza imports, eliminación modal inactivo, extracción avatar a componente, helper navigate perfil y documento `topBar.styles.js` inicial.

Fin Addendum.

---
### 22. Fase 2 – Implementación de Hooks y Compat Layer (2025-08-29)

Resumen: Se implementaron tres hooks para reducir lógica incrustada y eliminar listeners directos:

1. useRoleFromRoute
   - Extrae derivación de rol según pathname y prop isBuyer.
   - Sustituye función local getRoleFromCurrentRoute.
   - Memoiza el resultado y simplifica condición del switch.

2. useAuthModalBus
   - Centraliza estado y acciones de modales login/register.
   - Elimina setTimeout mágico en transición login→register (usa queueMicrotask).
   - Expone API global opcional: window.sellsiAuth.openLogin(), etc.
   - Añade compat layer opcional (enableLegacyEventListeners) que escucha eventos legacy openLogin / openRegister y emite warnings DEPRECATED.

3. useMarketplaceSearch
   - Encapsula estado, sanitización (trim + límite 120 chars) y debounce (300ms) de la búsqueda móvil.
   - Provee submit unificado: fuera del marketplace navega con state initialSearch; dentro dispara callback reactivo.
   - Mantiene por ahora dispatch de CustomEvent 'marketplaceSearch' solo como compatibilidad temporal (se reemplazará por contexto dedicado en una fase futura).

Cambios en TopBar.jsx:
- Remoción de la lógica inline de derivación de rol y búsqueda.
- Reemplazo de listeners window para auth por bus interno (con layer de compat habilitada temporalmente).
- Sustitución del timeout de 100ms por queueMicrotask.
- Limpieza adicional: se mantiene goToProfile helper y width 100% ya aplicado previamente.

Riesgos Mitigados:
- Re-registro de listeners sobre cambios de estado de modales.
- Duplicación de lógica de rol.
- Posibles inconsistencias al sanitizar la búsqueda (ahora centralizado).

Pendientes Post Fase 2:
- Reemplazar evento global 'marketplaceSearch' por contexto MarketplaceSearchContext (COMPLETADO: Fase 3).
- Introducir TopBarContainer / TopBarView split (siguiente fase).
- Añadir pruebas unitarias para hooks (cuando se habiliten tests; el usuario indicó no crear tests por ahora, se documenta para backlog).

Compat Layer Plan de Retiro:
- Paso 1 (actual): enableLegacyEventListeners=true emite warnings.
- Paso 2: comunicar en changelog y desactivar en entorno staging.
- Paso 3: eliminar soporte de eventos window y borrar flag.

Indicadores (post Fase 2):
- Listeners window directos para auth: 0 (solo compat layer si flag activo).
- Lógica de búsqueda inline removida: Sí.
- Lógica derivación rol inline removida: Sí.

---
Fin del documento.

---
### 23. Fase 3 (Split Container/View + Context Search) y Cierre Parcial A11y (2025-08-29)

Estado: COMPLETADA (estructura) + A11y básico aplicado y cerrado para esta iteración.

Logros Clave:
1. Split arquitectónico: `TopBarContainer.jsx` (lógica/orquestación) vs `TopBarView.jsx` (presentación pura). Monolito original eliminado.
2. Remplazo definitivo de `CustomEvent('marketplaceSearch')` por `MarketplaceSearchContext` con fallback legacy temporal sólo si provider ausente.
3. Separación explícita de handlers: `onLogoClick` vs `onGoToProfile` (telemetría futura y claridad semántica).
4. Accesibilidad implementada (alcance acordado):
	- `aria-label`, `aria-haspopup`, `aria-expanded` dinámicos en: logo, campana notificaciones (mobile), menú perfil, menú móvil, switch de rol.
	- Vinculación `id`/`aria-controls` (`topbar-profile-button` ↔ `topbar-profile-menu`, `topbar-mobile-menu-button` ↔ `topbar-mobile-menu`).
	- Campo de búsqueda móvil con `aria-label` y botón ejecutar etiquetado.
	- Soporte teclado (Enter/Espacio) en logo y campana.
	- Avatar con `alt` descriptivo.
5. Documentación actualizada (secciones 11 y 23) reflejando nueva arquitectura y estado a11y.

KPIs Post-Fase 3:
* Listeners window reemplazados: 1 (marketplace) ahora vía contexto. Auth mantiene compat layer (flag) → pendiente retirar.
* TopBarContainer LOC (objetivo <=180): verificado internamente (no incluido aquí) dentro de rango esperado.
* Accesibilidad básica: Checklist sección 16 cumplida + extras (linking ids, search labeling).

Pendientes (Backlog futuro no bloqueante para cierre de fase):
* (Completado en Sección 24) Retiro de fallback legacy búsqueda y listeners auth.
* Añadir focus ring consistente con token (actual usa inline boxShadow provisional).
* Placeholder reservado para switch de rol en estado loading (evitar jump leve).
* Migrar fade avatar a CSS puro (eliminar estado loaded) – rendimiento micro.
* Lazy load de panel pesado de notificaciones (optimizaciones fase 5).
* Introducir pruebas unitarias (usuario pospuso tests) para hooks extraídos.

Decisión de Cierre: Se considera la fase de accesibilidad “suficientemente buena” para esta iteración; mejoras restantes catalogadas como refinamientos de bajo riesgo/performance, no críticos para la estabilidad funcional.

Marca de Versión Interna: topbar-refactor-phase3-a11y-closure
### 24. Retiro Capa Legacy (Auth Events + marketplaceSearch Fallback) – 2025-08-29

Acción: Eliminados eventos window `openLogin` / `openRegister` (ya marcados deprecados) y el dispatch `CustomEvent('marketplaceSearch')` de fallback.

Detalles:
* `useAuthModalBus`: parámetro `enableLegacyEventListeners` removido; efecto listener eliminado.
* `TopBarContainer`: invocación ahora sin flag legacy; onReactive búsqueda sólo usa `MarketplaceSearchContext`.
* Documentación de pendientes actualizada (Sección 23) para reflejar cierre.

Motivación: Reducir superficie global no tipada y garantizar único canal de integración (API `window.sellsiAuth` opcional y contexto de búsqueda). Minimiza riesgos de drift y escuchas huérfanas.

Riesgos Residuales: Consumidores externos que aún disparaban eventos legacy deben migrar a `window.sellsiAuth.openLogin()` o a una llamada directa React. No se detectaron dependencias internas restantes.

Marca de Versión Interna: topbar-refactor-legacy-removed

---
### 25. Optimización Performance (Memo) – 2025-08-29 (Lazy Revertido)

Cambios vigentes:
* `RoleSwitchControl`: `React.memo` (se mantiene) para reducir renders innecesarios.
* `NotificationsMenu`: se revirtió el `React.lazy` del `NotificationListPanel` al evaluar que el beneficio (ahorro de bytes iniciales) no justificaba la latencia extra de primer uso.

Motivo Reversión Lazy:
* Panel de notificaciones se abre con alta frecuencia y el peso adicional no es significativo según estimación.
* Preferencia UX: evitar spinner/fallback en primer click.

Backlog Futuro Perf (si se retoman métricas reales):
* Medir tamaño real del módulo notificaciones post build (gzip) y re-evaluar lazy si supera umbral (>20KB gzip) y uso <50% sesiones.
* Prefetch condicional tras idle si se mantiene carga eager.
* Memo de arrays `desktopNavLinks` / `mobileMenuItems` (impacto menor, opcional).

Marca de Versión Interna: topbar-refactor-perf-memo-only

---

---

