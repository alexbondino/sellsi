/**
 * 📧 Edge Function para enviar feedback de usuarios
 * 
 * Recibe mensaje de feedback y lo envía por email a contacto@sellsi.cl
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withMetrics } from '../_shared/metrics.ts';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FeedbackRequest {
  message: string;
  companyName: string;
  contactEmail: string;
  userName?: string;
}

serve(req => withMetrics('send-feedback', req, async () => {
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo acepta POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Solo se permiten POST requests' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Servicio de email no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, companyName, contactEmail, userName }: FeedbackRequest = await req.json();

    // Validaciones básicas
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'El mensaje es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contactEmail || !contactEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email de contacto inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir el email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E52B2;">¡Ayúdanos a mejorar!</h2>
        <hr style="border: 1px solid #eee;" />
        
        <div style="margin: 20px 0;">
          <p><strong>Empresa:</strong> ${companyName || 'No especificada'}</p>
          <p><strong>Email de contacto:</strong> ${contactEmail}</p>
          ${userName ? `<p><strong>Usuario:</strong> ${userName}</p>` : ''}
        </div>
        
        <hr style="border: 1px solid #eee;" />
        
        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Mensaje del cliente:</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
            ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
        </div>
        
        <hr style="border: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          Este mensaje fue enviado desde la plataforma Sellsi.
        </p>
      </div>
    `;

    // Enviar email usando Resend API directamente
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sellsi Feedback <no-reply@sellsi.cl>',
        to: ['contacto@sellsi.cl'],
        reply_to: contactEmail,
        subject: '¡Ayúdanos a mejorar!',
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Error from Resend:', resendData);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el mensaje' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Feedback email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Feedback function error:', err);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}));
