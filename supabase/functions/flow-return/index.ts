// @ts-nocheck
// Edge Function para manejar el retorno de Flow (POST → redirect GET)
// Flow envía POST con token a urlReturn, esta función redirige al frontend

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FRONTEND_URLS: Record<string, string> = {
  production: 'https://sellsi.cl',
  sandbox: 'https://staging-sellsi.vercel.app',
};

serve(async (req: Request) => {
  const flowEnv = Deno.env.get('FLOW_ENV') || 'sandbox';
  const FRONTEND_URL = FRONTEND_URLS[flowEnv] || FRONTEND_URLS.sandbox;

  try {
    // Flow envía POST con token en body (form-urlencoded)
    let token: string | null = null;
    let orderId: string | null = null;

    // Extraer token del body
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      token = params.get('token');
    }

    // Extraer order_id del query string (lo pasamos en la URL)
    const url = new URL(req.url);
    orderId = url.searchParams.get('order');

    console.log('[flow-return] Received:', { token: token?.substring(0, 20), orderId });

    // Construir URL de redirección al frontend
    const redirectUrl = new URL(`${FRONTEND_URL}/buyer/orders`);
    redirectUrl.searchParams.set('payment', 'flow');
    if (orderId) {
      redirectUrl.searchParams.set('order', orderId);
    }
    if (token) {
      redirectUrl.searchParams.set('token', token);
    }

    console.log('[flow-return] Redirecting to:', redirectUrl.toString());

    // Redirigir con 303 See Other (cambia POST a GET)
    return new Response(null, {
      status: 303,
      headers: {
        'Location': redirectUrl.toString(),
      },
    });

  } catch (error) {
    console.error('[flow-return] Error:', error);
    // En caso de error, redirigir al home
    return new Response(null, {
      status: 303,
      headers: {
        'Location': `${FRONTEND_URL}/buyer/orders?payment=flow&error=redirect_failed`,
      },
    });
  }
});
