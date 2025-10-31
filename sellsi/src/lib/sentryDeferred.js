// Deferred Sentry initialization with in-memory event queue.
// Goal: avoid Sentry SDK parse/exec on critical path while not losing early errors.

let SentryMod = null; // will hold imported module
let initialized = false;
const queue = [];
const MAX_QUEUE = 50;
const CAPTURE_THROTTLE_MS = 1000; // minimum ms between captureException calls
let lastCaptureTs = 0;
// Symbol used to mark Error objects that were already captured to avoid duplicate captures
const __SENTRY_CAPTURED = Symbol.for('__sentry_captured__');

function enqueue(method, args) {
  if (initialized && SentryMod) {
    try { SentryMod[method](...args); } catch (_) {}
    return;
  }

  // Simple dedupe for captureMessage: avoid queueing identical messages within 1s
  try {
    if (method === 'captureMessage' && args && args[0]) {
      const last = queue.length ? queue[queue.length - 1] : null;
      if (last && last.method === 'captureMessage' && last.args && last.args[0] === args[0] && (Date.now() - last.ts) < 1000) {
        return; // skip duplicate message
      }
    }
  } catch (_) {}

  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ method, args, ts: Date.now() });
}

export function captureException(error, context) {
  try {
    if (error && typeof error === 'object') {
      if (error[__SENTRY_CAPTURED]) return;
      try { error[__SENTRY_CAPTURED] = true; } catch (_) {}
    }
  } catch (_) {}
  const now = Date.now();
  // simple throttle: avoid bursts of captureException that could cause 429
  if (now - lastCaptureTs < CAPTURE_THROTTLE_MS) {
    // If queue is already large, drop the event
    if (queue.length > MAX_QUEUE / 2) return;
  } else {
    lastCaptureTs = now;
  }

  enqueue('captureException', [error, context]);
}
export function captureMessage(message, level = 'info') {
  enqueue('captureMessage', [message, { level }]);
}
export function addBreadcrumb(breadcrumb) {
  enqueue('addBreadcrumb', [breadcrumb]);
}

async function flushQueue() {
  if (!SentryMod) return;
  while (queue.length) {
    const evt = queue.shift();
    try { SentryMod[evt.method](...evt.args); } catch (_) {}
  }
}

export async function initSentryDeferred(options = {}) {
  if (initialized || !import.meta.env.PROD) return;
  initialized = true;
  try {
    const mod = await import('@sentry/react');
    SentryMod = mod;
    SentryMod.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        mod.browserTracingIntegration(),
        mod.replayIntegration({
          // 🛡️ SAFARI FIX: Configuración para evitar errores cross-origin con iframes externos
          // Safari es estricto con seguridad y bloquea acceso a contentWindow de YouTube
          blockAllMedia: false,
          maskAllText: false,
          maskAllInputs: true,
          // Bloquear grabación de iframes externos (YouTube, Vimeo, etc.)
          blockSelector: 'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="vimeo.com"]',
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      ...options,
    });
    await flushQueue();
    if (options?.debug) {
    }
  } catch (err) {
  }
}

// Safe wrapper that will not throw if Sentry is not available and will
// attempt to enqueue the exception using the deferred queue.
export function captureExceptionSafe(error, context) {
  try {
    captureException(error, context);
  } catch (_) {
    // swallow to avoid cascading errors in an ErrorBoundary
  }
}

// Schedule helpers
export function scheduleSentryInit() {
  if (!import.meta.env.PROD) return; // skip in dev
  const start = () => initSentryDeferred();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2000 });
  } else {
    setTimeout(start, 1500);
  }
  // Also ensure first interaction triggers init if earlier than idle
  ['pointerdown','keydown','touchstart','visibilitychange'].forEach(evt => {
    window.addEventListener(evt, () => start(), { once: true, passive: true });
  });
}

// Global pre-init error capture
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    captureException(e.error || e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    captureException(e.reason || e);
  });
}

// Expose small debug hook
export function getSentryQueueLength() { return queue.length; }
