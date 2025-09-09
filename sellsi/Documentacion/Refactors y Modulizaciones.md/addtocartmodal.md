# AddToCartModal Refactor Plan

Fecha: 2025-09-09  
Estado: PLANIFICADO (pendiente de autorización)

## 1. Contexto
`AddToCartModal.jsx` (~430+ líneas) concentra UI (Drawer + MUI + framer-motion) y múltiples capas de lógica: enriquecimiento de producto, modo oferta, cálculo de precios por tramos, validaciones (cantidad, billing, despacho), selección de documento tributario, sanitización de mensajes y armado del payload para el carrito.

Objetivo: Reducir complejidad cognitiva y aislar la lógica de negocio en funciones puras / hooks especializados sin cambiar la API pública ni el comportamiento observable.

## 2. Responsabilidades Actuales (Mapa)
1. Presentación / Layout: Drawer, animaciones, secciones, estilos sx.
2. Data enrichment: Carga de regiones de despacho (Supabase) + clon defensivo de tiers.
3. Dual Mode: Producto normal vs producto aceptado desde oferta (cantidad fija, precio ofertado, deadlines).
4. Gestión de Cantidad: mínimos/máximos dinámicos y mensajes de error.
5. Documento Tributario: Derivado dinámico vía `useSupplierDocumentTypes` + fallback manual.
6. Precios y Tiers: normalización, precio unitario efectivo, highlight de tier activo.
7. Validación de Despacho: gating por región, ventana `justOpened`, demora 100ms, sanitización de mensaje.
8. Billing: bloqueo condicional si se requiere factura y faltan campos.
9. Acción de Agregar / Confirmar Oferta: branch de flujo y armado de payload.
10. Sub-componentes inline: PriceTiersDisplay, OfferPriceDisplay, ProductSummary, DocumentTypeSelector, ShippingStatus, SubtotalSection.
11. Reglas de deshabilitación del botón (6 condiciones combinadas).
12. Logging (`console.info/error`).

## 3. Problemas Identificados
| Área | Problema | Impacto |
|------|----------|---------|
| Acoplamiento | Lógica de negocio mezclada con JSX | Dificulta test y evolución |
| Repetición | Cálculo de mínimo de tiers replicado | Riesgo de inconsistencias |
| Testeabilidad | Pocas funciones puras exportables | Tests frágiles o ausentes |
| Rendimiento cognitivo | 400+ líneas en un único archivo | Curva de entrada alta |
| Modo Oferta | Condicional disperso | Ruido y branching lógico |
| Sanitización | Regex inline en render | No reutilizable / difícil de test |
| Efectos | Timers + validaciones en cuerpo principal | Mayor ruido y riesgo de dependencias incorrectas |

## 4. Invariantes a Preservar
* Props y firma pública del componente (no romper imports externos).
* Comportamiento visual y textual (labels, orden, animaciones, estados disabled).
* Reglas de deshabilitación del botón (exacta equivalencia lógica).
* Ventana temporal `justOpened` (300ms) + delay 100ms en validación de despacho.
* Modo oferta: cantidad fija y callback `onSuccess` sin pasar por validaciones de cantidad estándar.
* Mensajes de errores y mensajes de alerta existentes.

## 5. Descomposición Objetivo
Directorio propuesto:
```
AddToCartModal/
	index.jsx                (export principal)
	AddToCartModal.jsx       (orquestador limpio)
	hooks/
		useProductEnrichment.js
		useOfferAwareProductData.js
		useQuantity.js
		useDocumentType.js
		useShippingOrchestration.js
		usePricing.js
		useAddToCartAction.js
	logic/
		productBuilders.js
		pricing.js
		quantity.js
		shippingMessage.js
		disableButtonRules.js
	components/
		ProductSummary.jsx
		PriceTiersDisplay.jsx
		OfferPriceDisplay.jsx
		DocumentTypeSelector.jsx
		ShippingStatus.jsx
		SubtotalSection.jsx
	styles.js
	README.md
```

## 6. Funciones Puras Planeadas
* `buildOfferProductData(offer, enrichedProduct)`
* `buildRegularProductData(enrichedProduct)`
* `deriveEffectiveMinimum(priceTiers, fallbackMinimum)`
* `computeQuantityBounds(productData)`
* `computePricing(priceTiers, basePrice, quantity)` (envoltura sobre util existente)
* `findActiveTier(priceTiers, quantity)`
* `sanitizeShippingMessage(rawMsg)`
* `shouldDisableButton(params)`

## 7. Hooks Planeados
| Hook | Responsabilidad |
|------|-----------------|
| `useProductEnrichment` | Carga y cacheo de regiones + clon defensivo |
| `useOfferAwareProductData` | Selección entre modo oferta / regular |
| `useQuantity` | Inicialización + validación de cantidad + errores |
| `useDocumentType` | Seleccionar documento válido según proveedor |
| `useShippingOrchestration` | Validación on-demand, timers, justOpened, sanitización |
| `usePricing` | Derivar pricing + tier activo + tiers display |
| `useAddToCartAction` | Manejar flujo de agregar / oferta + billing gating |

## 8. Roadmap por Fases
Fase 1: Extraer lógica pura (archivo `logic/*`) sin mover JSX.  
Fase 2: Introducir hooks (`hooks/*`) y reemplazar bloques inline.  
Fase 3: Extraer subcomponentes UI (`components/*`) + memo.  
Fase 4: Centralizar estilos (`styles.js`) y limpiar `sx` redundante.   

## 9. Opciones de Alcance
* A: Fases 1–3 (mínimo viable, rápido).
* B: Fases 1–5 (completo sin tests nuevos).

## 10. Métricas Esperadas
| Indicador | Actual | Objetivo |
|-----------|--------|----------|
| Líneas en archivo principal | ~430 | <140 |
| Funciones puras testeables | 0–1 | >=7 |
| Branches lógicos en render | Alto | Muy bajo (solo composición) |

## 11. Estrategia de Testing (si Opción C)
Tests (Vitest):
1. `pricing.computePricing` (tiers vacíos / un tramo / múltiples / borde max_quantity).
2. `quantity.deriveEffectiveMinimum` (orden aleatorio tiers).
3. `shippingMessage.sanitizeShippingMessage` (casos con sufijos monetarios, plurales, vacíos).
4. `disableButtonRules.shouldDisableButton` (tabla de verdad minimal: cada condición aisladamente + composición).

## 12. Riesgos & Mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| Cambios visuales involuntarios | Mantener estructura JSX y props; snapshot manual si existe |
| Dependencias de efectos incorrectas | Encapsular en hooks con listas revisadas + lint de hooks |
| Pérdida de lógica de ventana `justOpened` | Replicar dentro de `useShippingOrchestration` con tests temporales si se incluyen |
| Condiciones de disabled alteradas | Test unitario de `shouldDisableButton` |
| Repetición de fetch de regiones | Cache local en hook (opcional diferido para simplificar) |

## 13. Criterios de Aceptación
* Mismo flujo para: producto normal, producto con tiers, producto oferta, sin región, región luego disponible.
* Botón se deshabilita en EXACTAS mismas condiciones.
* No aparecen nuevos warnings React/MUI.
* Animación slide intacta (mismo `Drawer` + `motion.div`).

## 14. Cambios que NO se harán (en este refactor)
* No se alteran nombres de props públicas.
* No se añade caché global ni context nuevo.
* No se optimiza el fetch de regiones a nivel de app (solo refactor local).
* No se introducen nuevas features de UI.

## 15. Paso Siguiente
Esperar autorización con selección de alcance (A, B, C o D) y decisión sobre mantener `console.info`:
* Opción logs: (1) Eliminar, (2) Guardar detrás de flag DEBUG, (3) Dejar tal cual.

## 16. Resumen Ejecutivo (TL;DR)
Dividir el componente gigante en: funciones puras (determinísticas), hooks orquestadores (efectos y derivaciones), subcomponentes presentacionales y estilos centralizados, manteniendo comportamiento idéntico y reduciendo drásticamente la complejidad para futuras extensiones.

---
Fin del plan. A la espera de aprobación.
