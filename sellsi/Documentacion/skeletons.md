# Sistema de Skeletons Inteligentes – ProductPageView

Estado: PLAN APROBADO (fase 1 – documentación)  
Autor: Equipo Frontend  
Fecha: 2025-09-03  
Última Revisión Profunda: 2025-09-03 (segunda auditoría: OfferModal, QuotationModal, QuotationButton, ProductImageGallery, hooks ownership/precio) – Sin hallazgos adicionales críticos.

## Objetivo
Eliminar spinners (CircularProgress) usados como fallback estructural en la vista de producto y sustituirlos por un sistema de skeletons adaptativos ("inteligentes") que:
- Mantenga el layout estable (0 saltos visuales / CLS ≈ 0) durante la carga inicial.
- Sea responsive (desktop / mobile) sin duplicar componentes.
- Oculte skeletons de bloques que finalmente no se renderizarán (p.ej. acciones de compra si es producto propio / vista supplier / mis productos).
- Se auto–optimice: sólo muestra placeholders si la carga supera un umbral mínimo (flicker avoidance).

## Principios
1. Layout-first: se reserva el espacio definitivo desde el primer frame.
2. Context-aware: no se renderiza skeleton de secciones no permitidas por flags (fromMyProducts, isSupplier, etc.).
3. Micro-tiempos: si una sub-carga (tiers, ownership) resuelve < 120ms, se omite skeleton (evita parpadeo). Si > 120ms se activa y se mantiene >= 300ms (percepción de continuidad).
4. Un solo spinner real: sólo en acciones explícitas del usuario (ej: enviar oferta, mutaciones). Nunca para hidratar layout.
5. Reutilizable: cada bloque funcional tiene su contraparte skeleton con API mínima.

## Componentes y sus Skeletons
| Bloque | Componente Real | Skeleton | Condición Render | Notas |
|--------|-----------------|----------|------------------|-------|
| Cabecera completa (galería + info comercial) | `ProductHeader` | `ProductHeaderSkeleton` | Siempre si product está cargando | Agrupa sub-skeletons internos. |
| Galería imágenes | Dentro de `ProductHeader` (`ProductImageGallery`) | `GallerySkeleton` | Parte de header skeleton | Altos adaptativos: 500x500 desktop / 320x320 mobile. |
| Chips documentos tributarios | Dentro header | `DocumentTypesChipsSkeleton` | loadingDocumentTypes | Si proveedor sólo ofrece `ninguno`, no se reserva espacio. |
| Precio por volumen | priceContent tiers | `PriceTiersSkeleton` | loadingTiers | 4–5 filas placeholder. |
| Precio único | priceContent single | `SinglePriceSkeleton` | Nunca “loading” (se muestra directo) | Simplifica. |
| Acciones de compra (Ofertar / Agregar) | `PurchaseActions` | `PurchaseActionsSkeleton` | checkingOwnership OR (page loading) | Omite si ocultas por flags. |
| Descripción | `ProductInfo` | `ProductInfoSkeleton` (ya existe) | loading | Ajustar paddings móviles. |
| Regiones de despacho | `ProductShipping` | `ProductShippingSkeleton` | loading && isLoggedIn | No reservar cuando no logueado. |

## Flags / Condiciones Clave
```ts
const showTiers = (product?.priceTiers?.length || 0) > 0
const hidePurchase = product?.fromMyProducts || product?.isFromSupplierMarketplace || product?.isSupplier || isOwnProduct
const showShipping = isLoggedIn
```

## Hook: useSmartSkeleton
Responsable de decidir si mostrar un skeleton con umbrales anti-flicker.
```ts
const show = useSmartSkeleton(isLoading, { delay: 120, minDuration: 300 })
```
Implementación base:
1. Cuando `isLoading` pasa a true, arma timer `delay`. Si sigue en true después → activa skeleton.
2. Al pasar a false, si el skeleton estuvo visible < `minDuration`, lo mantiene hasta cumplir.

## Flujo de Carga (Timeline)
1. Wrapper monta `ProductPageView` inmediatamente (ya no muestra spinner propio).
2. `ProductPageView` evalúa: product null OR loading → render `ProductPageSkeleton` (layout macro).
3. Al recibir `product`: 
	 - Se monta el layout real.
	 - Suspense fallbacks de lazy components usan skeletons locales (no spinner). 
4. Sub-estados (tiers, ownership, documentTypes) usan skeletons específicos si exceden delay.

## Eliminaciones / Sustituciones
| Ubicación | Antes | Después |
|-----------|-------|---------|
| `ProductPageView` Suspense fallback | `<CircularProgress />` | Skeleton específico (header/info/shipping). |
| `ProductHeader` price tiers | `<CircularProgress size=18>` | `<PriceTiersSkeleton />` con hook. |
| `ProductHeader` ownership | `<CircularProgress size=24>` | `<PurchaseActionsSkeleton />` |
| `ProductHeader` document types | Texto “Cargando opciones…” | `<DocumentTypesChipsSkeleton />` |
| `ProductPageWrapper` y `TechnicalSpecs` | Spinner central | Direct mount + delegar a skeleton principal |
| (Se mantiene) `OfferModal` botón enviar | Spinner inline botón | Conservado (acción puntual de usuario) |

## Estructura de Nuevos Archivos
```
src/domains/ProductPageView/
	hooks/
		useSmartSkeleton.js
	components/
		skeletons/
			ProductHeaderSkeleton.jsx
			PriceSkeletons.jsx
			PurchaseActionsSkeleton.jsx (opcional si se separa)
			ProductShippingSkeleton.jsx
		ProductPageSkeletons.jsx (se expande con exports nuevos)
```

## API Propuesta de Skeletons
```tsx
<ProductHeaderSkeleton 
	isMobile={boolean}
	showTiers={boolean}
	showPurchaseActions={boolean}
	showDocumentTypesChips={boolean}
/> 

<PriceTiersSkeleton rows={4}/> // rows default 4
<PurchaseActionsSkeleton withOffer={boolean} />
<DocumentTypesChipsSkeleton count={3} />
<ProductShippingSkeleton rows={5} />
```

## Plan de Migración (Incremental Seguro)
Fase 1 (este PR):
1. Añadir documentación (este archivo).
2. Crear hook `useSmartSkeleton`.
3. Crear skeletons nuevos básicos.
4. Sustituir fallbacks Suspense en `ProductPageView`.
5. Reemplazar spinners internos de `ProductHeader`.
6. Ajustar wrapper pages para delegar a skeleton principal.
7. grep confirmando sólo spinner estructural remanente en `OfferModal`.

Fase 2 (mejora UX):
1. Animaciones suaves (Fade / Grow coordinadas con minDuration).
2. Medición simple de tiempo de carga (performance.now) para logging opcional.
3. Ajustar tamaños dinámicos de galería según cantidad de imágenes > 1 (thumbnails skeleton). 

Fase 3 (opt):
1. Métricas CLS / LCP en env staging.
2. Experimento: prefetch de módulos lazy (React.lazy) al hover / viewport.

## Edge Cases Cubiertos
- Producto sin imágenes → gallery skeleton genérico; evita salto.
- Producto propio / supplier → no se muestran purchase skeletons (no engañar al usuario).
- Usuario no logueado → no reservar bloque de despacho.
- Tiers cargan muy rápido → skeleton omitido (anti flicker).
- Error al cargar módulo lazy → boundary muestra mensaje sin romper layout (skeleton ya desaparecido).

## Rollback Strategy
Cambios aislados: sólo sustitución de UI superficial. Para revertir, restaurar imports de `CircularProgress` y eliminar nuevos skeleton components.

## Métricas Deseadas (Post Implementación)
- 0 spinners estructurales en vista producto.
- CLS ≈ 0 (ver Lighthouse / Web Vitals).
- Percepción de velocidad subjetiva mejorada (feedback de QA interno).
- Ningún “flash” de contenido parcial.

## TODO Tracking (Fase 1)
- [x] Crear hook `useSmartSkeleton`.
- [x] Añadir carpeta `skeletons/` y componentes base.
- [x] Integrar en `ProductPageView` Suspense fallback (header/info/shipping skeletons).
- [x] Reemplazar spinners en `ProductHeader` (tiers / ownership / document types).
- [x] Actualizar wrappers (`ProductPageWrapper` reescrito limpio, `TechnicalSpecs` sin spinner propio).
- [x] Condicionar `ProductShippingSkeleton` estrictamente a `isLoggedIn`.
- [x] grep validar sólo spinner estructural restante en `OfferModal` (otros spinners fuera del alcance product page conservados por ser contextuales/acción).
- [ ] Verificar build y correr pruebas básicas (pendiente ejecución).

Nota: Existen dos rutas `TechnicalSpecs` (duplicado en `pages/` y `pages/hooks/`). Ambas fueron alineadas para eliminar `CircularProgress`; evaluar eliminación del duplicado en refactor posterior.

---
Fin de la documentación inicial. Proceder con implementación Fase 1.

