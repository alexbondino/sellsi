// Utilidad simple para días hábiles en Chile (Lunes–Viernes).
// Nota: Feriados se pueden inyectar ampliando CHILE_HOLIDAYS_YYYY.

const pad = n => (n < 10 ? `0${n}` : `${n}`);

const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Feriados configurables por año (agregar los feriados oficiales)
const CHILE_HOLIDAYS_2025 = new Set([
  '2025-01-01', // Año Nuevo
  '2025-04-18', // Viernes Santo
  '2025-04-19', // Sábado Santo (si aplica)
  '2025-05-01', // Día del Trabajador
  '2025-05-21', // Glorias Navales
  '2025-06-29', // San Pedro y San Pablo (si aplica)
  '2025-07-16', // Virgen del Carmen (si aplica)
  '2025-08-15', // Asunción de la Virgen
  '2025-09-18', // Independencia
  '2025-09-19', // Glorias del Ejército
  '2025-10-12', // Día del Descubrimiento de Dos Mundos
  '2025-10-31', // Día de las Iglesias Evangélicas y Protestantes
  '2025-11-01', // Día de Todos los Santos
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad
]);

const HOLIDAYS_BY_YEAR = {
  2025: CHILE_HOLIDAYS_2025,
};

export function isBusinessDayChile(date) {
  const day = date.getDay();
  // 0: Dom, 6: Sáb -> no hábil
  if (day === 0 || day === 6) return false;
  const iso = toISODate(date);
  const set = HOLIDAYS_BY_YEAR[date.getFullYear()];
  if (set && set.has(iso)) return false;
  return true;
}

export function addBusinessDaysChile(startDate, businessDays) {
  const d = new Date(startDate);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDayChile(d)) added += 1;
  }
  return d;
}

export function toISODateOnly(date) {
  return toISODate(new Date(date));
}
