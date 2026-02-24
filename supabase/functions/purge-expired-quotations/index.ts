import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { withMetrics } from '../_shared/metrics.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
const MAINTENANCE_SECRET_TOKEN = Deno.env.get('CLEANUP_SECRET_TOKEN');

if (!MAINTENANCE_SECRET_TOKEN) {
  throw new Error('Missing CLEANUP_SECRET_TOKEN env var');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

type Body = { limit?: number };

serve((req) =>
  withMetrics('purge-expired-quotations', req, async () => {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ') || auth.substring(7) !== MAINTENANCE_SECRET_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const requested = Number(body.limit || 500) || 500;
    const limit = Math.min(Math.max(requested, 1), 2000);

    const { data: expiredRows, error: listErr } = await supabase
      .from('quotation_documents')
      .select('id, storage_path')
      .lte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
      .limit(limit);

    if (listErr) {
      return new Response(JSON.stringify({ error: 'Error leyendo expiradas', details: listErr.message }), { status: 500 });
    }

    const rows = expiredRows || [];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, purged: 0, attempted: 0 }), { status: 200 });
    }

    const errors: string[] = [];
    let purged = 0;

    for (const row of rows) {
      try {
        const path = row.storage_path;
        if (!path) {
          errors.push(`${row.id}: missing_storage_path`);
          continue;
        }

        const { error: removeErr } = await supabase.storage.from('quotations').remove([path]);
        if (removeErr) {
          // Mantener metadata para reintentar en la próxima ejecución.
          errors.push(`${path}: remove_failed:${removeErr.message}`);
          continue;
        }

        const { error: delErr } = await supabase
          .from('quotation_documents')
          .delete()
          .eq('id', row.id);

        if (delErr) {
          errors.push(`${row.id}: db_delete_failed:${delErr.message}`);
          continue;
        }

        purged++;
      } catch (e: any) {
        errors.push(`${row.id}: ${e?.message || 'unknown_error'}`);
      }
    }

    return new Response(JSON.stringify({ ok: errors.length === 0, purged, attempted: rows.length, errors }), {
      status: errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  })
);
