// Genera un fingerprint estable (persistido) y su hash SHA-256 hex
// Usa userAgent + platform + un UUID almacenado localmente para evitar colisiones masivas.
export async function getOrCreateDeviceFingerprint() {
  try {
    let seed = localStorage.getItem('admin_device_seed')
    if (!seed) {
      seed = crypto.randomUUID()
      localStorage.setItem('admin_device_seed', seed)
    }
    const raw = [navigator.userAgent, navigator.platform, seed].join('|')
    const enc = new TextEncoder().encode(raw)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
  } catch (e) {
    console.error('Fingerprint error', e)
    return null
  }
}
