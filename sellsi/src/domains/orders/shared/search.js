// Sanitización de texto de búsqueda para uso en filtros ilike
// Escapa % y _ que son comodines en LIKE y fuerza longitud mínima.
export function sanitizeSearchText(input, { minLength = 2, maxLength = 80 } = {}) {
  if (!input) return '';
  let s = String(input).trim();
  if (s.length < minLength) return '';
  if (s.length > maxLength) s = s.slice(0, maxLength);
  // Escapar % y _ reemplazándolos por literales escapados
  s = s.replace(/%/g, '\\%').replace(/_/g, '\\_');
  return s;
}

export function buildIlikePattern(safeText) {
  if (!safeText) return null;
  return `%${safeText}%`;
}
