import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const storageBucket = "financing-documents";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    // optional param: older_than_hours
    const body = await req.json().catch(() => ({}));
    const olderHours = Number(body.older_than_hours || 24);
    const cutoff = new Date(Date.now() - olderHours * 3600 * 1000).toISOString();

    // list objects in bucket
    const { data: list, error: listErr } = await supabase.storage.from(storageBucket).list('', { limit: 1000, offset: 0 });
    if (listErr) throw listErr;

    const orphaned: string[] = [];

    for (const item of list) {
      // item.name is file name or folder; we only handle files
      if (item.name.endsWith('/')) continue;
      // check updated_at or created_at
      const objUpdated = item.updated_at || item.created_at || null;
      if (objUpdated && objUpdated < cutoff) {
        const filePath = item.name; // listing returns path relative to bucket root
        // check DB for a matching storage_path
        const { data: docs, error: docErr } = await supabase
          .from('financing_documents')
          .select('id')
          .eq('storage_path', filePath)
          .maybeSingle();
        if (docErr) throw docErr;
        if (!docs) {
          // orphan found
          orphaned.push(filePath);
          try {
            const { error: delErr } = await supabase.storage.from(storageBucket).remove([filePath]);
            if (delErr) console.error('Failed to delete orphan file', filePath, delErr);
          } catch (e) {
            console.error('Error deleting orphan file', filePath, e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: orphaned }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});