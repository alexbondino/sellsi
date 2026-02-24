import { checkRateLimit, recordRateLimitHit, formatRetryInSeconds } from './rateLimit';

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'documento';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadBlobWithRateLimit({
  blob,
  filename,
  rateKey,
  limit = 5,
  windowMs = 60_000,
  onBlocked,
}) {
  const rl = checkRateLimit({ key: rateKey, limit, windowMs });
  if (!rl.allowed) {
    const seconds = formatRetryInSeconds(rl.retryInMs);
    onBlocked?.({ seconds, retryInMs: rl.retryInMs });
    throw new Error(`RATE_LIMITED:${seconds}`);
  }

  recordRateLimitHit({ key: rateKey });
  triggerBlobDownload(blob, filename);
}

export async function downloadUrlAsBlobWithRateLimit({
  url,
  filename,
  rateKey,
  limit = 5,
  windowMs = 60_000,
  fetchInit,
  onBlocked,
}) {
  const rl = checkRateLimit({ key: rateKey, limit, windowMs });
  if (!rl.allowed) {
    const seconds = formatRetryInSeconds(rl.retryInMs);
    onBlocked?.({ seconds, retryInMs: rl.retryInMs });
    throw new Error(`RATE_LIMITED:${seconds}`);
  }

  recordRateLimitHit({ key: rateKey });

  const resp = await fetch(url, fetchInit);
  if (!resp.ok) throw new Error('No se pudo descargar');
  const blob = await resp.blob();
  triggerBlobDownload(blob, filename);
}

export async function downloadSupabaseStoragePathWithRateLimit({
  supabase,
  bucket,
  path,
  filename,
  rateKey,
  limit = 5,
  windowMs = 60_000,
  onBlocked,
}) {
  if (!supabase) throw new Error('supabase requerido');
  if (!bucket) throw new Error('bucket requerido');
  if (!path) throw new Error('path requerido');

  const rl = checkRateLimit({ key: rateKey, limit, windowMs });
  if (!rl.allowed) {
    const seconds = formatRetryInSeconds(rl.retryInMs);
    onBlocked?.({ seconds, retryInMs: rl.retryInMs });
    throw new Error(`RATE_LIMITED:${seconds}`);
  }

  recordRateLimitHit({ key: rateKey });

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw error || new Error('No se pudo descargar');
  triggerBlobDownload(data, filename);
}

export async function openUrlWithRateLimit({
  url,
  rateKey,
  limit = 5,
  windowMs = 60_000,
  target = '_blank',
  features = 'noopener,noreferrer',
  onBlocked,
}) {
  const rl = checkRateLimit({ key: rateKey, limit, windowMs });
  if (!rl.allowed) {
    const seconds = formatRetryInSeconds(rl.retryInMs);
    onBlocked?.({ seconds, retryInMs: rl.retryInMs });
    throw new Error(`RATE_LIMITED:${seconds}`);
  }

  recordRateLimitHit({ key: rateKey });
  window.open(url, target, features);
}
