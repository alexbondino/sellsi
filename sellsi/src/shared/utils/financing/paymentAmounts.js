/**
 * ============================================================================
 * FINANCING PAYMENT AMOUNTS UTILS
 * ============================================================================
 *
 * Utilidades para calcular montos de abono en línea de financiamientos.
 * Soporta dos modelos de datos:
 * - amount_used bruto + amount_paid acumulado
 * - amount_used neto (ya descontado por pagos)
 */

const toNonNegativeInteger = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

export const getUsedAmount = (financing) => {
  return toNonNegativeInteger(financing?.amount_used);
};

export const getPaidAmount = (financing) => {
  return toNonNegativeInteger(financing?.amount_paid);
};

/**
 * Disponible para abonar:
 * - Modelo acumulado: amount_used - amount_paid
 * - Compatibilidad legacy: si amount_paid es 0 o null, usar amount_used
 */
export const getAvailableAmountToPay = (financing) => {
  const amountUsed = getUsedAmount(financing);
  const amountPaid = getPaidAmount(financing);

  if (amountUsed <= 0) return 0;
  if (amountPaid <= 0) return amountUsed;

  return Math.max(0, amountUsed - amountPaid);
};

export const canPayOnlineFinancing = (financing) => {
  const amountUsed = getUsedAmount(financing);
  const availableToPay = getAvailableAmountToPay(financing);

  return amountUsed > 1 && availableToPay >= 1 && !financing?.paused;
};
