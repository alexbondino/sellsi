// @ts-nocheck
// Lightweight shared metrics helper for Edge Functions
// Phase 1: fire-and-forget single-row insert
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MetricOpts {
  functionName: string;
  status: 'success' | 'error';
  startedAt: number; // performance.now() timestamp ref
  errorCode?: string;
  errorMessage?: string;
  requestOrigin?: string | null;
  meta?: Record<string, unknown>;
}

export async function recordInvocation(opts: MetricOpts) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const duration = Math.round(performance.now() - opts.startedAt);
    await admin.from('edge_function_invocations').insert({
      function_name: opts.functionName,
      duration_ms: duration,
      status: opts.status,
      error_code: opts.errorCode || null,
      error_message: opts.errorMessage ? opts.errorMessage.slice(0,500) : null,
      request_origin: opts.requestOrigin || null,
      meta: opts.meta || {},
      started_at: new Date(Date.now() - duration).toISOString(),
      finished_at: new Date().toISOString(),
    });
  } catch (_) {
    // swallow any metric failure
  }
}

export async function withMetrics<T>(functionName: string, request: Request, fn: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  const origin = request.headers.get('origin') || null;
  try {
    const result = await fn();
    queueMicrotask(() => recordInvocation({ functionName, status: 'success', startedAt, requestOrigin: origin }));
    return result;
  } catch (e) {
    queueMicrotask(() => recordInvocation({
      functionName,
      status: 'error',
      startedAt,
      requestOrigin: origin,
      errorCode: (e && (e.code || e.name)) ? String(e.code || e.name) : 'UNCLASSIFIED',
      errorMessage: e && e.message ? String(e.message) : 'unknown'
    }));
    throw e;
  }
}
