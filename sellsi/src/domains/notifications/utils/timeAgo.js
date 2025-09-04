// Utility to humanize timestamps (Spanish)
export function timeAgo(dateInput, nowTs = Date.now()) {
  if (!dateInput) return '';
  const ts = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
  if (isNaN(ts)) return '';
  const diffMs = nowTs - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 0) return 'ahora';
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'ayer';
  if (day < 7) return `hace ${day} d`;
  const week = Math.floor(day / 7);
  if (day < 30) return `hace ${week} sem`;
  const month = Math.floor(day / 30);
  if (day < 365) return `hace ${month} mes${month>1?'es':''}`;
  const year = Math.floor(day / 365);
  return `hace ${year} año${year>1?'s':''}`;
}
