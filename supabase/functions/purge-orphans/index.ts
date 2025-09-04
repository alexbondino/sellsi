// Edge Function: purge-orphans
// Objetivo: Borrar físicamente archivos huérfanos confirmados tras periodo de retención
// Flujo:
// 1. Seleccionar lote de candidatos desde view vw_image_orphan_purge_candidates (limit configurable via query param ?limit=100)
// 2. Verificar siguen siendo huérfanos (opcional: ya asumido por view)
// 3. Eliminar en storage (bucket correspondiente)
// 4. Marcar confirmed_deleted_at = now() (idempotente)
// 5. Retornar resumen

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withMetrics } from '../_shared/metrics.ts'
// NOTE: Local editors without Deno types may complain; declare Deno to silence TS diagnostics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
// Consolidated: we use a single maintenance token CLEANUP_SECRET_TOKEN for all maintenance functions
const MAINTENANCE_SECRET_TOKEN = Deno.env.get('CLEANUP_SECRET_TOKEN')

if (!MAINTENANCE_SECRET_TOKEN) {
  throw new Error('Missing CLEANUP_SECRET_TOKEN env var')
}

if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
  throw new Error('Missing SUPABASE_URL and no auth key (service or anon) available')
}

// Prefer service role (full privileges under RLS). Fallback to anon (will only work fully if RLS disabled or policies allow needed ops).
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY!, { auth: { persistSession: false } })

// Simple logger depending on DEBUG_MODE (optional)
const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'
const log = DEBUG_MODE ? console.log : () => {}
if (!SUPABASE_SERVICE_ROLE_KEY) log('[purge-orphans] No service role key set (using anon). If RLS enabled or GRANTs missing, DB updates may fail.')

interface PurgeRow { path: string; bucket: 'product-images' | 'product-images-thumbnails'; detected_at: string }

serve((req) => withMetrics('purge-orphans', req, async () => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 })
  }
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ') || auth.substring(7) !== MAINTENANCE_SECRET_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500)

  // Obtener lote de candidatos (si RLS activo y usamos anon podría devolver vacío)
  const { data: candidates, error: viewError } = await supabase
    .from('vw_image_orphan_purge_candidates')
    .select('path,bucket,detected_at')
    .order('detected_at', { ascending: true })
    .limit(limit)

  if (viewError) {
    return new Response(JSON.stringify({ error: 'Error leyendo candidatos', details: viewError.message }), { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ purged: 0, message: 'No candidates' }), { status: 200 })
  }

  let purged = 0
  const errors: string[] = []

  for (const row of candidates as PurgeRow[]) {
    try {
  const { error: removeError } = await supabase.storage.from(row.bucket).remove([row.path])
      if (removeError) {
        errors.push(`${row.bucket}/${row.path}: ${removeError.message}`)
        continue
      }
      const { error: updateError } = await supabase
        .from('image_orphan_candidates')
        .update({ confirmed_deleted_at: new Date().toISOString() })
        .eq('path', row.path)
        .is('confirmed_deleted_at', null)
      if (updateError) {
        errors.push(`update ${row.path}: ${updateError.message}`)
        continue
      }
      purged++
    } catch (e: any) {
      errors.push(`${row.path}: ${e.message}`)
    }
  }

  return new Response(JSON.stringify({ purged, attempted: candidates.length, errors }), { status: errors.length ? 207 : 200 })
}))
