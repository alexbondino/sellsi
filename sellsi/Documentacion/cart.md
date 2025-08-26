# Carrito (BuyerCart) – Estrategia de Responsividad XS / SM (Mobile First sin romper Desktop)

Documento técnico que describe problemas actuales de la UI del carrito y el plan de adaptación responsiva para breakpoints móviles (`xs` y `sm`) asegurando cero regresiones en `md+` (desktop).

## Objetivos
1. Usabilidad total en 360–430px (xs) y 412–575px (sm / mini).
2. Eliminar overflow horizontal / scroll lateral.
3. Mantener layout y jerarquía existentes para `md`, `mac`, `lg`, `xl` sin cambios visibles.
4. Priorizar: legibilidad del producto, controles de cantidad, precio total y CTA de checkout.
5. Reducir altura excesiva y fricción táctil (taps seguros ≥40px hit area).

## Componentes Analizados
- `BuyerCart.jsx`
- `CartHeader.jsx`
- `CartItem.jsx`
- `OrderSummary.jsx`
- `PriceBreakdown.jsx`
- `ShippingCompatibilityModal.jsx`
- Subcomponentes de envío (`ShippingDisplay`, etc.)

## Problemas Detectados (Estado Actual Mobile)
| Área | Problema | Impacto |
|------|----------|---------|
| Layout principal | `flexWrap: 'nowrap'` en grid raíz | Cortes / overflow en pantallas angostas |
| OrderSummary | width porcentual (50% / 59%), sticky en mobile | Columnas estrechas, jerarquía rota |
| CartItem | 4 columnas comprimidas, imagen 160x160 fija | Salto de layout, scroll vertical largo |
| CartItem envío | `borderLeft` en mobile | Desalineación y espacio perdido |
| Header | h4 + icon 40px grande, botón eliminar ancho | Header ocupa demasiado viewport |
| PriceBreakdown | Tipografías sin escala, Alert grande | Espaciado vertical excesivo |
| Modal compatibilidad | Tamaño md en mobile | Casi full screen sin optimización |

## Principios de Diseño Aplicados
- Mobile-first additive overrides: sólo se agregan reglas `down('sm')`, no se eliminan estilos desktop.
- Reordenamiento semántico (primero contenido, luego resumen) para foco en productos.
- Reducción de densidad sin perder jerarquía (títulos se escalan, cifras se mantienen claras).
- Minimizar sombras y borders en móvil para mejorar performance y legibilidad.

## Cambios Propuestos por Componente

### 1. BuyerCart Layout
- Permitir wrap: `flexWrap: { xs: 'wrap', md: 'nowrap' }`.
- Orden natural: Lista (order 1) → Resumen (order 2) en mobile.
- Ajustar contenedor principal: `p: { xs: 2, sm: 2.5, md: 3 }`, `mb` reducido: `{ xs: 3, md: 6 }`.
- Eliminar anchuras intermedias inconsistentes; mantener `maxWidth` global.

### 2. OrderSummary
- Mobile: `position: 'static'`, ancho completo `width: { xs: '100%', sm: '100%', md: 300, lg: 360, xl: 400 }`.
- Padding y spacing compactos: `p: { xs: 2, sm: 2.25, md: 3 }`.
- Spacing stacks: `{ xs: 2, md: 3 }`.
- (Fase 2 opcional) Variante Bottom Sheet con estado plegado → no incluida en primera implementación.

### 3. CartItem
#### Estructura Responsive
| Breakpoint | Distribución |
|------------|--------------|
| xs / sm | Bloques apilados (Imagen → Info → Controles → Envío/Acciones) |
| md+ | 4 columnas (Imagen / Info / Controles / Envío) |

#### Ajustes
- Grid estándar MUI: `item xs={12}` para cada bloque; `md={3|4|3|2}` en desktop.
- Imagen: tamaño escalado `{ xs: 110, sm: 130, md: 160 }`, centrada (`mx: 'auto'`).
- Remover `borderLeft` en envío para xs/sm.
- Acciones (eliminar / buscar) reubicadas debajo de envío en mobile (stack horizontal compacto) o mantenidas en esquina en md+.
- Reducción de márgenes: `Paper mb: { xs: 2.5, md: 4 }`.
- Tipografía:
	- Título: `fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }` si responsiveFontSizes no ajusta suficiente.
	- Labels secundarios: `fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }`.
- Checkbox de selección: top reducido `{ xs: 8, md: 16 }` y escala visual más compacta.
- ShippingDisplay: base intacta; (Fase 2) posible colapso / accordion.

### 4. CartHeader
- Escalar h4: `fontSize: { xs: '1.35rem', sm: '1.55rem', md: '2rem' }`.
- Ícono carrito: `{ xs: 32, md: 40 }`.
- Chips: `justifyContent: { xs: 'center', md: 'flex-start' }`, `gap: { xs: 1, md: 2 }`.
- Botón “Eliminar productos” → versión compacta en xs: `size='small'`, posible sólo icono + tooltip (texto corto “Eliminar”).
- Agrupar chips y acción dentro de stack vertical en xs (`direction: { xs: 'column', sm: 'row' }`).

### 5. PriceBreakdown
- Reducir densidad: filas `mb: { xs: 0.5, md: 1 }`.
- Labels: override `fontSize: { xs: '0.75rem' }`.
- Total: `fontSize: { xs: '1.15rem', sm: '1.25rem', md: 'inherit' }`.
- Divider: `my: { xs: 1.5, md: 2 }`.
- Alert región: `fontSize: { xs: '0.7rem' }`, padding vertical menor.

### 6. ShippingCompatibilityModal
- `fullScreen` en `down('sm')`.
- Contenido scrollable: `DialogContent` con `maxHeight: calc(100vh - 180px)`.
- Icono 48→40 en xs.
- Título degrade a `h6` en mobile.
- List items `py: { xs: 1, md: 1.5 }`.

## Performance / Accesibilidad
- Menor shadow en mobile: `boxShadow: { xs: 2, md: 6 }`.
- Hit areas manteniendo mínimo 40px (verificar IconButton no se reduce demasiado).
- Evitar setState layout-thrashing: sólo cambios estilísticos.
- Imagen con lazy load (validar `CartItemImage` ya lo hace / añadir si no).

## Roadmap Fases
| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Layout responsivo básico + compactación | Pendiente implementación |
| 2 | Bottom sheet summary + accordion shipping | Opcional futuro |
| 3 | Optimización micro-interacciones (entradas colapsadas) | Opcional |

## Checklist Implementación (Fase 1)
- [ ] BuyerCart: wrap + order + paddings
- [ ] OrderSummary: ancho completo móvil + static
- [ ] CartItem: grid redefinido + tamaños imagen + borderLeft condicional
- [ ] CartHeader: escalado tipografía + botón compacto
- [ ] PriceBreakdown: ajustes tipográficos
- [ ] Modal compatibilidad: fullscreen xs
- [ ] Verificación visual: sin overflow horizontal
- [ ] QA: Revisión breakpoints 375 / 412 / 540 / 768 / 1280

## Notas de No-Regresión
- No se modifican nombres de props ni lógica de negocio.
- Sólo se añaden/ajustan objetos `sx` con condiciones responsive.
- Layout original md+ se preserva replicando valores existentes para `md`.

## Ejemplos de Snippets (Referencia)
```jsx
// Ejemplo convertir OrderSummary a responsivo
<Paper sx={{
	position: { xs: 'static', md: 'sticky' },
	top: { md: 100 },
	width: { xs: '100%', sm: '100%', md: 300, lg: 360, xl: 400 },
	p: { xs: 2, sm: 2.25, md: 3 },
}}>
```
```jsx
// CartItem grid redefinido
<Grid container spacing={2}>
	<Grid item xs={12} md={3}>/* Imagen */</Grid>
	<Grid item xs={12} md={4}>/* Info */</Grid>
	<Grid item xs={12} md={3}>/* Controles */</Grid>
	<Grid item xs={12} md={2}>/* Envío / Acciones */</Grid>
</Grid>
```

## Decisiones Diferidas
- Bottom sheet: requiere control de scroll + backdrop → pospuesto.
- Collapsible shipping por producto: esperar métricas de scroll real.
- Group actions floating (FAB) en mobile: evaluar densidad real tras Fase 1.

## Métricas a Validar tras Implementar

## Interacción con Temas y Breakpoints

### Contexto de Tema Usado en el Carrito
El carrito está envuelto con `dashboardThemeCore`, no con el `theme.js` principal. Esto implica que:
- No existe breakpoint `mini` (576) dentro del scope del carrito.
- No se aplica `responsiveFontSizes`; los heading mantienen tamaños fijos salvo overrides manuales.
- Breakpoints efectivos: `xs (0–411)`, `sm (412–767)`, `md (768–1699)`, `mac (>=1280 dentro de md)`, `lg (1700–2159)`, `xl (2160+)`.
- Cualquier ajuste fino para 576–640px requiere media queries manuales si se desea.

### Comparación Rápida
| Aspecto | dashboardThemeCore | theme.js principal |
|---------|--------------------|--------------------|
| Breakpoints extra | mac | mac + mini |
| responsiveFontSizes | No | Sí (factor 2) |
| Tipografía base | Inter h6 parcial | Lato + Inter headings |
| Overrides clave | MuiButton, MuiContainer | MuiTypography variants |

### Implicaciones para la Estrategia Responsive
1. Ajustes tipográficos deben hacerse con `sx` (fontSize por breakpoint) para h4/h5 en lugar de confiar en escalado automático.
2. Modal fullScreen si requiere abarcar hasta 575px debe usar `useMediaQuery('(max-width:575px)')` en vez de `down('sm')` si se define un umbral distinto a 412.
3. No introducir `mini` todavía evita regresiones en otros contextos que usan `dashboardThemeCore`.
4. Se pueden extraer patrones repetidos (Paper gradiente) a una variante `MuiPaper` en Fase 2 para centralizar mantenibilidad.

### Riesgos de Cambiar el Tema Ahora
| Acción | Riesgo | Mitigación |
|--------|--------|-----------|
| Añadir responsiveFontSizes | Cambios globales inesperados en dashboards | Crear tema derivado sólo para carrito |
| Agregar breakpoint mini | Layouts dependientes podrían divergir | Documentar y auditar vistas antes del merge |
| Unificar con theme.js | Pérdida de minimalismo performance | Mantener dualidad hasta refactor global |

### Recomendaciones Futuras (Fase 2+)
1. Clonar `dashboardThemeCore` → `cartResponsiveTheme` con responsiveFontSizes sobre subset de variantes.
2. Agregar design tokens de densidad: `cart.surface.paddingMobile`, `cart.image.sizeXs`.
3. Evaluar introducción de `mini` si métricas de tablets verticales requieren granularidad.
4. Implementar variante `MuiPaper` para superficies de item (`variant="cartSurface"`).

### Hook Sugerido (Pendiente)
```js
export function useCartResponsive() {
	const theme = useTheme();
	const isXs = useMediaQuery(`(max-width:${theme.breakpoints.values.sm - 1}px)`); // < 412
	const isSm = useMediaQuery(theme.breakpoints.between('sm','md')); // 412–767
	const isBelow576 = useMediaQuery('(max-width:575px)'); // pseudo-mini
	return { isXs, isSm, isBelow576 };
}
```

### Validaciones Específicas Post-Implementación
| Caso | Criterio | Esperado |
|------|----------|----------|
| iPhone SE 375 | Sin overflow horizontal | ✅ |
| Pixel 7 (412) | Título escala; CTA visible | ✅ |
| iPad mini 768 | Layout md (4 columnas) | ✅ |
| MacBook 1280 | Igual a md + opcionales mac | ✅ |
| 4K | MaxWidth controla expansión | ✅ |

### Métricas de Calidad a Monitorear
- CLS inicial < 0.02.
- Scroll FPS > 55 con 10 items en dispositivo medio.
- Altura CartItem xs < 320px promedio.

---
Autor: Auto-documentado por asistente (estrategia responsividad carrito)
Fecha: 2025-08-26

