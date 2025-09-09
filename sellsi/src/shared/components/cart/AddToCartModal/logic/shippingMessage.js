// Sanitización de mensaje de despacho
export function sanitizeShippingMessage(rawMsg) {
  if (!rawMsg) return '';
  let sanitized = String(rawMsg)
    .replace(/-\s*\$[\d.,\s]*$/g, '')
    .replace(/-\s*\$$/g, '')
    .trim();
  sanitized = sanitized.replace(/(\d+)\s*d[ií]as?\s*h[aá]biles/gi, (match, n) => Number(n) === 1 ? '1 día hábil' : `${n} días hábiles`);
  return sanitized;
}
