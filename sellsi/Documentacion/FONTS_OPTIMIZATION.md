# Optimización de Fuentes (Inter)

Fecha: 2025-08-30
Estado inicial: Cargábamos Inter 100–900 desde Google Fonts. Uso real detectado: pesos 400 (normal), 600, 700 (bold). Se redujo la URL para eliminar pesos no usados.

## Cambios Aplicados (Fase 1 - Bajo Riesgo)
- `index.html`: Inter limitado a `400;600;700` (`display=swap`).
- Comentario añadido para mantener consistencia.

## Próximos Pasos (Opcionales)
1. Medir impacto (Lighthouse / Network panel): comparar tamaño transferido de CSS de fuentes antes vs después.
2. Si el ahorro justifica avanzar (>25–30 KB), proceder a self-host variable font:
   - Descargar `Inter-VariableFont_slnt,wght.ttf`.
   - Generar subset amplio Latin + Latin-Extended:
     ```bash
     pyftsubset Inter-VariableFont_slnt,wght.ttf \
       --output-file=InterVar-Subset.woff2 \
       --flavor=woff2 \
       --axis='wght=400:700' \
       --unicodes='U+0000-00FF,U+0100-024F,U+1E00-1EFF' \
       --layout-features='*' --passthrough-tables --drop-tables+=GSUB,GPOS # (mantén si necesitas ligaduras avanzadas)
     ```
   - Colocar el archivo en `public/fonts/`.
   - Añadir en `index.html` antes de los estilos:
     ```html
     <style>
     @font-face {
       font-family: 'Inter';
       src: url('/fonts/InterVar-Subset.woff2') format('woff2-variations');
       font-weight: 400 700;
       font-style: normal;
       font-display: swap;
     }
     </style>
     ```
   - Eliminar el `<link>` a Google Fonts.
3. Validar cobertura (TyC, perfiles, textos dinámicos). Si falta algún carácter, ampliar rangos (ej: símbolos monetarios U+20A0–20BF).
4. (Opcional) Evaluar `font-display: optional` en landing si priorizas LCP puro (riesgo de FOUT persistente en conexiones lentas).

## Métricas a Registrar
- Peso total de `font` resources (Network). Objetivo: <90 KB transfer inicial (fuente + CSS).
- LCP antes/después (≥3 mediciones móviles throttled).
- Cumulative Layout Shift (no debe empeorar tras cambio).

## Rollback Plan
Restaurar la URL original de Google Fonts si detectas caracteres faltantes o regresión visual crítica.

---
Mantenedor: Performance/Frontend.
