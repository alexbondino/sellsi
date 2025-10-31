# Fuentes Self-Hosted (Inter)

Colocar aquí los archivos optimizados WOFF2:
- inter-400.woff2 (subset latin)
- inter-600.woff2
- inter-700.woff2

Generación recomendada (ejemplo usando glyphhanger o fonttools):
1. Descargar OTF/TTF oficiales.
2. Subset (latin básico + signos) para reducir peso.
3. Convertir a WOFF2.
4. Verificar que tamaños estén dentro de objetivos (<20KB cada peso si subset correcto).

Tras añadirlos, volver a correr Lighthouse para validar eliminación de warnings de preconnect y estabilidad en FCP/LCP.
