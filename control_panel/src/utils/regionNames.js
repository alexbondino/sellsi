// Mapeo y utilidades para nombres legibles de regiones chilenas.
// Centraliza la lógica usada en MyOrders y otros módulos para evitar duplicación.

const REGION_MAP = {
  'arica-parinacota': 'Arica y Parinacota',
  'tarapaca': 'Tarapacá',
  'antofagasta': 'Antofagasta',
  'atacama': 'Atacama',
  'coquimbo': 'Coquimbo',
  'valparaiso': 'Valparaíso',
  'metropolitana': 'Región Metropolitana',
  'ohiggins': "O'Higgins",
  'maule': 'Maule',
  'nuble': 'Ñuble',
  'biobio': 'Biobío',
  'araucania': 'Araucanía',
  'los-rios': 'Los Ríos',
  'los-lagos': 'Los Lagos',
  'aysen': 'Aysén',
  'magallanes': 'Magallanes'
};

export function rawRegionName(value) {
  if (!value) return '';
  const key = String(value).trim().toLowerCase();
  return REGION_MAP[key] || value;
}

export function getRegionDisplay(value, { withPrefix = true } = {}) {
  if (!value) return '';
  const base = rawRegionName(value);
  if (!withPrefix) return base;
  const lower = base.toLowerCase();
  if (lower.startsWith('región metropolitana')) return base; // ya incluye
  if (/^región\b/i.test(base)) return base; // ya comienza con Región
  return `Región de ${base}`;
}

export { REGION_MAP };
