// Utilidades para obtener el nombre legible de una comuna chilena
// Basado en los datos de chileData (comunasPorRegion)

import { comunasPorRegion } from './chileData';

// Construir un mapa plano value -> label (una sola vez)
const COMMUNE_MAP = Object.values(comunasPorRegion).flat().reduce((acc, item) => {
  if (item && item.value) {
    acc[item.value] = item.label || item.value;
  }
  return acc;
}, {});

function slugToTitleCase(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getCommuneDisplay(value) {
  if (!value) return '';
  return COMMUNE_MAP[value] || slugToTitleCase(value);
}

export { COMMUNE_MAP };
