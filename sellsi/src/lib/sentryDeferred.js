// Deferred Sentry initialization with in-memory event queue.
// Goal: avoid Sentry SDK parse/exec on critical path while not losing early errors.

let SentryMod = null; // will hold imported module
let initialized = false;
const queue = [];
const MAX_QUEUE = 50;

function enqueue(method, args) {
  if (initialized && SentryMod) {
    try { SentryMod[method](...args); } catch (_) {}
    return;
  }
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ method, args, ts: Date.now() });
}

export function captureException(error, context) {
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
        mod.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      ...options,
    });
    await flushQueue();
    if (options?.debug) {
      console.info('[sentryDeferred] Initialized. Flushed queued events.');
    }
  } catch (err) {
    console.warn('[sentryDeferred] init failed', err);
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
