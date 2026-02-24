import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RateLimitResult = { allowed: true } | { allowed: false; retryInMs: number };

function floorToWindowStart(nowMs: number, windowMs: number) {
  return Math.floor(nowMs / windowMs) * windowMs;
}

export async function enforceRateLimit(opts: {
  identifier: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { identifier, key, limit, windowMs } = opts;
  if (!identifier || !key) return { allowed: true };

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return { allowed: true };

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const now = Date.now();
  const windowStartMs = floorToWindowStart(now, windowMs);
  const windowStartIso = new Date(windowStartMs).toISOString();

  // Fixed-window counter: upsert row, then read updated count.
  // This is not perfectly atomic under extreme concurrency, but is sufficient for anti-abuse.
  const { data: existing, error: selErr } = await admin
    .from('edge_rate_limits')
    .select('count')
    .eq('identifier', identifier)
    .eq('rl_key', key)
    .eq('window_start', windowStartIso)
    .maybeSingle();

  if (selErr) return { allowed: true };

  const current = Number(existing?.count ?? 0);
  if (Number.isFinite(current) && current >= limit) {
    const retryInMs = Math.max(0, windowMs - (now - windowStartMs));
    return { allowed: false, retryInMs };
  }

  // Update count (insert or increment)
  if (!existing) {
    const { error: insErr } = await admin.from('edge_rate_limits').insert({
      identifier,
      rl_key: key,
      window_start: windowStartIso,
      count: 1,
      updated_at: new Date().toISOString(),
    });
    if (insErr) return { allowed: true };
    return { allowed: true };
  }

  const { error: updErr } = await admin
    .from('edge_rate_limits')
    .update({ count: current + 1, updated_at: new Date().toISOString() })
    .eq('identifier', identifier)
    .eq('rl_key', key)
    .eq('window_start', windowStartIso);

  if (updErr) return { allowed: true };
  return { allowed: true };
}
