import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { withMetrics } from '../_shared/metrics.ts';

/* QUICK WIN: get-invoice-url
   Minimal endpoint que:
   - Valida método y CORS
   - Requiere auth (Bearer token, supabase-js v2 session)
   - Recibe { path }
   - Verifica que dicho path exista en invoices_meta y pertenezca al usuario (buyer) vía join con orders
   - Genera signed URL corta (60s) y la devuelve
*/

const corsHeaders: Record<string,string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(req => withMetrics('get-invoice-url', req, async () => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const jwt = authHeader.replace('Bearer ', '').trim();

    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !anon) {
      return new Response(JSON.stringify({ error: 'Config faltante' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    const body = await req.json().catch(() => ({}));
    const path: string | undefined = body.path;
    if (!path || typeof path !== 'string') {
      return new Response(JSON.stringify({ error: 'path requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!path.includes('.')) {
      return new Response(JSON.stringify({ error: 'path inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Obtener fila invoices_meta
    const { data: invoiceRow, error: invErr } = await supabase
      .from('invoices_meta')
      .select('order_id, supplier_id, path')
      .eq('path', path)
      .maybeSingle();

    if (invErr || !invoiceRow) {
      return new Response(JSON.stringify({ error: 'Factura no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Verificar ownership en orders (buyer = auth user) o permitir si usuario es el supplier (RLS también puede reforzarlo)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    // Consultar order para confirmar que userId es buyer
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', invoiceRow.order_id)
      .maybeSingle();

    if (orderErr || !orderRow) {
      return new Response(JSON.stringify({ error: 'Orden no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isBuyer = orderRow.user_id === userId;
    const isSupplier = false; // QUICK WIN: sin lookup adicional de roles; se podría ampliar

    if (!isBuyer && !isSupplier) {
      return new Response(JSON.stringify({ error: 'Sin permisos para esta factura' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Generar signed URL (TTL corto)
    const EXPIRES_SECONDS = 60;
    const { data: signedData, error: signedErr } = await supabase
      .storage
      .from('invoices')
      .createSignedUrl(path, EXPIRES_SECONDS);

    if (signedErr || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: 'No se pudo generar URL' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ url: signedData.signedUrl, expiresIn: EXPIRES_SECONDS }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Error interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}));
