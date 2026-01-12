/**
 * Lógica reutilizable para calcular días de vigencia de financiamientos
 * y determinar el estado (success/warning/error) según la cercanía a expiración
 * 
 * EJEMPLOS DE USO:
 * 
 * Plazo 7 días, aprobado hace 5 días:
 *   → días restantes = 2
 *   → threshold = 1 día
 *   → 2 > 1 → SUCCESS (verde)
 * 
 * Plazo 30 días, aprobado hace 23 días:
 *   → días restantes = 7
 *   → threshold = 7 días
 *   → 7 <= 7 → WARNING (naranja)
 * 
 * Plazo 60 días, aprobado hace 50 días:
 *   → días restantes = 10
 *   → threshold = 10 días
 *   → 10 <= 10 → WARNING (naranja)
 * 
 * Plazo 30 días, aprobado hace 100 días:
 *   → días restantes = 0 (max(0, -70))
 *   → ERROR (rojo - expirado)
 */

/**
 * Obtiene el umbral de días para activar warning según el plazo otorgado
 * Basado en la tabla de lógica de negocio:
 * - 1-7 días: warning 1 día antes
 * - 8-15 días: warning 3 días antes
 * - 16-44 días: warning 7 días antes
 * - 45-60+ días: warning 10 días antes
 * 
 * @param {number} termDays - Plazo otorgado en días
 * @returns {number} Días antes de expiración para activar warning
 */
export const getWarningThreshold = (termDays) => {
  if (termDays >= 1 && termDays <= 7) return 1;
  if (termDays >= 8 && termDays <= 15) return 3;
  if (termDays >= 16 && termDays <= 44) return 7;
  if (termDays >= 45) return 10;
  return 0; // Caso inesperado
};

/**
 * Calcula los días de vigencia restantes de un financiamiento
 * 
 * @param {string|Date} approvedAt - Fecha de aprobación del financiamiento
 * @param {number} termDays - Plazo otorgado en días
 * @returns {number} Días restantes (mínimo 0, nunca negativo)
 */
export const calculateDaysRemaining = (approvedAt, termDays) => {
  if (!approvedAt || !termDays) return 0;
  
  const approvedDate = new Date(approvedAt);
  const today = new Date();
  const daysPassed = Math.floor((today - approvedDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = termDays - daysPassed;
  
  // Nunca puede ser negativo
  return Math.max(0, daysRemaining);
};

/**
 * Determina el estado de vigencia según días restantes y umbral de warning
 * 
 * @param {number} daysRemaining - Días de vigencia restantes
 * @param {number} termDays - Plazo otorgado en días
 * @returns {'success' | 'warning' | 'error'} Estado del financiamiento
 *   - 'success' (verde): días restantes > umbral de warning
 *   - 'warning' (naranja): días restantes <= umbral de warning y > 0
 *   - 'error' (rojo): días restantes = 0 (expirado)
 */
export const getFinancingStatus = (daysRemaining, termDays) => {
  if (daysRemaining === 0) return 'error'; // Rojo: expirado
  
  const warningThreshold = getWarningThreshold(termDays);
  
  if (daysRemaining <= warningThreshold) return 'warning'; // Naranja: cercano a expirar
  
  return 'success'; // Verde: seguro, lejos de expirar
};

/**
 * Función completa que combina cálculo y determinación de estado
 * 
 * @param {string|Date} approvedAt - Fecha de aprobación
 * @param {number} termDays - Plazo otorgado en días
 * @returns {{daysRemaining: number, status: 'success' | 'warning' | 'error'}}
 */
export const getFinancingDaysStatus = (approvedAt, termDays) => {
  const daysRemaining = calculateDaysRemaining(approvedAt, termDays);
  const status = getFinancingStatus(daysRemaining, termDays);
  
  return {
    daysRemaining,
    status
  };
};
