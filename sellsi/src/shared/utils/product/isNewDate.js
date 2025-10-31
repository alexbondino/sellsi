// Small utility to determine if a timestamp is considered "new".
export const NEW_PRODUCT_WINDOW_DAYS = 3; // configurable default

export function isNewDate(timestamp, days = NEW_PRODUCT_WINDOW_DAYS) {
  if (!timestamp) return false;
  const t = new Date(timestamp);
  if (isNaN(t.getTime())) return false;
  const msWindow = Number(days) * 24 * 60 * 60 * 1000;
  return (Date.now() - t.getTime()) < msWindow;
}

export default isNewDate;
