# Análisis profundo: Inline JSX (Severidad Medium)

Fuente: `scripts/inline_inline.tmp` (heurística de severidad aplicada).

Medium detectados (3 en `AddToCartModal.jsx`):

| Componente / Prop | Línea:Columna | Tipo | Size | Contexto | Riesgo | Recomendación |
|-------------------|--------------|------|------|----------|--------|---------------|
| Box sx | 456:12 | objeto | 6 claves | Dentro de listado (layout de tiers) | Re-render crea nuevo objeto `sx` cada vez; si Box o hijos se memorizan en el futuro rompe bail-out | Extraer a constante fuera del componente: `const boxTierWrapperSx = { ... };` y usar `sx={boxTierWrapperSx}` |
| Drawer PaperProps.sx | 799:22 | objeto | 6 claves | Raíz del modal | Re-crea estilos del contenedor principal; podría impedir memo interno de MUI en futuros upgrades | Mover `paperBaseSx` a constante superior o usar `useMemo` si dependiera de props dinámicas |
| Box sx | 829:21 | objeto | 8 claves | Contenedor interno scroll/content | Objeto grande inline; mismo impacto que anterior | Extraer a constante `contentContainerSx` |

## Evaluación de impacto

- Los 3 casos Medium son exclusivamente objetos `sx` relativamente grandes (>=6 claves). No hay funciones con capturas múltiples ni arrays largos.
- Actualmente MUI procesa `sx` en cada render; mover a constantes reduce trabajo y facilita cache de estilos si se implementa memoización de subcomponentes.
- No hay riesgo funcional (no produce bugs), sólo potencial micro-optimización / limpieza.

## Estrategia de Remediación

1. Crear bloque de constantes de estilo al inicio del archivo, antes del componente:
```js
const boxTierWrapperSx = { p:2, border:isActive?2:1, borderColor: isActive? 'primary.main':'grey.300', bgcolor: isActive? 'primary.50':'transparent', cursor:'default' };
// Nota: donde se usa `isActive` el valor depende de lógica por item; ese caso NO puede ser constante pura.
```
Para ese caso específico (Box en línea 456) parte de las claves depende de `isActive`. Mantener object inline o generar helper:
```js
const getTierPaperSx = (isActive) => ({
	p:2,
	border: isActive ? 2 : 1,
	borderColor: isActive ? 'primary.main' : 'grey.300',
	bgcolor: isActive ? 'primary.50' : 'transparent',
	cursor:'default'
});
```
2. Drawer PaperProps.sx → constante estática (no depende de props):
```js
const drawerPaperBaseSx = {
	width: { xs:'100%', sm:460, md:518 },
	maxWidth:'90vw',
	zIndex:9999,
};
```
3. Box (829:21) mover a `contentLayoutSx`.

## Código sugerido (fragmentos)
```js
// Estilos extraídos
const drawerPaperBaseSx = { width:{ xs:'100%', sm:460, md:518 }, maxWidth:'90vw', zIndex:9999 };
const drawerHeaderSx = { p:2, borderBottom:1, borderColor:'primary.dark', bgcolor:'primary.main', color:'common.white', position:'sticky', top:0, zIndex:1 };
const contentContainerSx = { height:'100%', display:'flex', flexDirection:'column' };
// Generador dependiente de estado para tiers
const tierPaperSx = (isActive) => ({ p:2, border:isActive?2:1, borderColor:isActive?'primary.main':'grey.300', bgcolor:isActive?'primary.50':'transparent', cursor:'default' });
```

Aplicar progresivamente sólo si se quiere reducir ruido de futuros reportes (baja prioridad).

## Prioridad
Low-Medium (optimizaciones). Mantener en backlog behind: dependencia de hooks reales y callbacks críticos.

---
Generado automáticamente (clasificación manual añadida).
