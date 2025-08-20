## Resumen de Issues de Dependencias en Hooks

Generado a partir de `resultados.md` (con sinónimos normalizados y severidad por missingCanonical).

Severidades:
- Critical: >=10 dependencias canónicas faltantes
- High: 5-9
- Medium: 3-4
- Low: 1-2

### Totales por Severidad

| Severidad | Cantidad de Hooks |
|-----------|-------------------|
| Critical  | 1 |
| High      | 11 |
| Medium    | 28 |
| Low       | 110 |

### Detalle Critical

| Archivo | Hook | Missing (Canónico) | Missing (Raw) |
|---------|------|--------------------|---------------|
| ProductPageWrapper.jsx | useEffect | 11 | 11 |

### Detalle High

| Archivo | Hook | Miss(Canon) | Miss(Raw) | Unnec | Inline |
|---------|------|------------:|----------:|------:|-------:|
| AddToCartModal.jsx (cart/AddToCartModal) | useMemo | 9 | 26 | 0 | 0 |
| ProductHeader.jsx | useEffect | 8 | 8 | 0 | 3 |
| ProviderHome.jsx | useEffect | 7 | 7 | 0 | 0 |
| useTransferInfoValidation.js | useEffect | 6 | 6 | 0 | 0 |
| ProductMarketplaceTable.jsx | useCallback | 6 | 6 | 0 | 0 |
| AuthProvider.jsx | useEffect | 5 | 5 | 0 | 0 |
| AddProduct.jsx | useEffect | 5 | 5 | 0 | 0 |
| useSupplierDashboard.js | useEffect | 5 | 5 | 0 | 0 |
| useTechnicalSpecs.js | useEffect | 5 | 5 | 1 | 0 |
| useProducts.js | useEffect | 5 | 5 | 0 | 0 |
| UserManagementTable.jsx | useCallback | 5 | 5 | 0 | 0 |

### Detalle Medium (primeros 15 mostrados)

| Archivo | Hook | Miss(Canon) | Miss(Raw) |
|---------|------|------------:|----------:|
| useResponsiveThumbnail.js | useMemo | 4 | 5 |
| Profile.jsx | useEffect | 4 | 4 |
| useTransferInfoValidation.js | useCallback | 4 | 4 |
| MyOrdersPage.jsx | useEffect | 4 | 4 |
| useSupplierProducts.js | useEffect | 4 | 4 |
| useSupplierProducts.js | useMemo | 4 | 4 |
| FilterPanel.jsx | useCallback | 4 | 4 |
| UserManagementTable.jsx (ban/unban) | useCallback | 4 | 4 |
| UserManagementTable.jsx (verify) | useCallback | 4 | 4 |
| UserManagementTable.jsx (delete) | useCallback | 4 | 4 |
| UserManagementTable.jsx (delete multiple) | useCallback | 4 | 4 |
| ProductMarketplaceTable.jsx | useCallback | 4 | 4 |
| AdminPanelTable.jsx | useCallback | 4 | 4 |
| AddToCartModal.jsx (set precios) | useEffect | 3 | 4 |
| ProfileImageModal.jsx | useEffect | 3 | 3 |

... (resto de medium en `resultados.md`)

### Observaciones Clave

1. El mayor caso (critical) es `ProductPageWrapper.jsx` con 11 missing canónicos completos: revisar lógica de carga de producto y consolidar quizás un objeto `product` como dependencia.
2. `AddToCartModal.jsx` concentra muchas variantes de campos (price/precio, thumbnail*) que se reducen a 9 canónicos tras normalizar: posible refactor para usar un objeto agrupado.
3. Repetición de múltiples callbacks en `UserManagementTable.jsx` y `ProductMarketplaceTable.jsx`: podría centralizar handlers o extraer custom hooks para reducir duplicación de dependencias.
4. Muchos low provienen de un único identificador faltante: priorizar primero Critical/High, luego Medium agrupando por archivo.

### Sugerencias de Acción

- Fase 1 (Alta prioridad): Corregir ProductPageWrapper.jsx y AddToCartModal.jsx.
- Fase 2: Agrupar handlers repetidos en tablas de administración y marketplace.
- Fase 3: Revisar medium de 4 missing para determinar si falta incluir un objeto padre (destructuring) como dependencia.
- Fase 4: Automatizar exclusión de patrones ya cubiertos (ej. si se añade `product` reducir entradas) y ejecutar script para validar reducción.

---
Generado automáticamente. Vuelve a ejecutar con:
`node scripts/analyze_hooks_deps.js --extra-globals React,Fragment --ignore prev,e,err,evt,event,_,_e,_err --stable formatCurrency,showErrorToast,showCartSuccess,showCartError,fetchUserProfile,filterActiveProducts,calculatePriceForQuantity,calculateRealShippingCost,calculateInventoryStats --auto-stable-constants --json --normalize-synonyms --summary --top 150 > scripts/resultados.tmp ; Move-Item -Force -Path scripts\resultados.tmp -Destination scripts\resultados.md`
