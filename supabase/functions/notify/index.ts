// Supabase Edge Function: notify
// Sends transactional email via Resend API
//
// Required env vars (set in Supabase Dashboard → Project Settings → Edge Functions):
//   RESEND_API_KEY   — your Resend API key (https://resend.com)
//   SUPABASE_URL     — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
//
// Deploy:
//   supabase functions deploy notify --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = 'RailMatch <notifications@railmatch.ru>';
const PLATFORM_URL = 'https://railmatch.ru';

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId, subject, bodyText } = await req.json() as {
            userId: string;
            subject: string;
            bodyText: string;
        };

        if (!userId || !subject || !bodyText) {
            return new Response(JSON.stringify({ error: 'Missing userId, subject or bodyText' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch user email via admin client
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId);

        if (userErr || !user?.email) {
            console.error('User fetch error:', userErr);
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">RailMatch</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Биржа железнодорожных вагонов</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.7;">${bodyText.replace(/\n/g, '<br>')}</p>
            <a href="${PLATFORM_URL}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:0.3px;">
              Открыть платформу →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              Это автоматическое уведомление от RailMatch. Не отвечайте на это письмо.<br>
              <a href="${PLATFORM_URL}" style="color:#94a3b8;">railmatch.ru</a> ·
              <a href="mailto:support@railmatch.ru" style="color:#94a3b8;">support@railmatch.ru</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        // Send via Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [user.email],
                subject,
                html,
            }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            console.error('Resend error:', resendData);
            return new Response(JSON.stringify({ error: 'Email send failed', details: resendData }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('Function error:', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
