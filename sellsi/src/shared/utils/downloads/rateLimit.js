const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60 * 1000;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function getStorageKey(key) {
  return `sellsi:dl_rl:${key}`;
}

export function checkRateLimit({
  key,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
  now = Date.now(),
}) {
  if (!key) {
    return { allowed: true, remaining: limit, retryInMs: 0 };
  }

  const storageKey = getStorageKey(key);
  const raw = localStorage.getItem(storageKey);
  const timestamps = Array.isArray(raw) ? raw : safeJsonParse(raw, []);

  const recent = (Array.isArray(timestamps) ? timestamps : [])
    .map((v) => Number(v))
    .filter((ts) => Number.isFinite(ts) && now - ts < windowMs);

  const allowed = recent.length < limit;
  const remaining = Math.max(0, limit - recent.length);
  const oldest = recent.length ? Math.min(...recent) : null;
  const retryInMs = allowed || oldest == null ? 0 : Math.max(0, windowMs - (now - oldest));

  return { allowed, remaining, retryInMs };
}

export function recordRateLimitHit({ key, now = Date.now(), maxEntries = 50 }) {
  if (!key) return;
  const storageKey = getStorageKey(key);
  const raw = localStorage.getItem(storageKey);
  const timestamps = Array.isArray(raw) ? raw : safeJsonParse(raw, []);
  const arr = Array.isArray(timestamps) ? timestamps : [];
  arr.push(now);
  const pruned = arr.slice(-maxEntries);
  localStorage.setItem(storageKey, JSON.stringify(pruned));
}

export function formatRetryInSeconds(ms) {
  const sec = Math.ceil((ms || 0) / 1000);
  return sec <= 0 ? 1 : sec;
}
