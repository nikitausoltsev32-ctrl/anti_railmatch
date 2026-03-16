// Supabase Edge Function: send-confirmation-email
// Auto-confirms the user's email via admin API and sends a welcome email via Resend.
// This bypasses PKCE flow issues where clicking the link in a different browser
// would fail to exchange the code and leave the email unconfirmed.
//
// Required env vars (set in Supabase Dashboard → Project Settings → Edge Functions):
//   RESEND_API_KEY            — your Resend API key (https://resend.com)
//   SUPABASE_URL              — injected automatically
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically
//
// Deploy:
//   supabase functions deploy send-confirmation-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = 'RailMatch <noreply@railmatch.ru>';

function buildWelcomeHtml(name: string, appUrl: string): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Добро пожаловать в RailMatch!</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0f4f8;padding:48px 16px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:#2563eb;
                                 border-radius:10px;padding:6px 10px;
                                 margin-bottom:14px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:900;
                                   letter-spacing:1px;">&#128643;</span>
                    </span>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;
                               font-weight:900;letter-spacing:-0.5px;line-height:1.2;">
                      RailMatch
                    </h1>
                    <p style="margin:5px 0 0;color:#94a3b8;font-size:13px;font-weight:400;">
                      Платформа для железнодорожных грузоперевозок
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background:rgba(37,99,235,0.18);
                                 border-radius:8px;padding:4px 12px;">
                      <span style="color:#93c5fd;font-size:11px;font-weight:700;
                                   letter-spacing:1.5px;text-transform:uppercase;">
                        Добро пожаловать
                      </span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider accent -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#4f46e5,#7c3aed);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;font-weight:700;">
                Здравствуйте, ${name}!
              </h2>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
                Ваш аккаунт в <strong>RailMatch</strong> успешно создан.<br>
                Теперь вы можете войти и начать работу.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center"
                      style="background:#2563eb;border-radius:12px;
                             box-shadow:0 4px 14px rgba(37,99,235,0.40);">
                    <a href="${appUrl}"
                       style="display:inline-block;padding:16px 40px;
                              color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:800;
                              letter-spacing:0.4px;white-space:nowrap;">
                      Войти в RailMatch &nbsp;→
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                <strong style="color:#64748b;">RailMatch</strong> —
                платформа для железнодорожных грузоперевозок<br>
                Это автоматическое письмо, не отвечайте на него.<br>
                <a href="https://railmatch.ru" style="color:#2563eb;text-decoration:none;">railmatch.ru</a>
                &nbsp;·&nbsp;
                <a href="mailto:support@railmatch.ru" style="color:#2563eb;text-decoration:none;">support@railmatch.ru</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set');
        return new Response(JSON.stringify({ error: 'Email service not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let userId: string, redirectTo: string;
    try {
        const body = await req.json() as { userId: string; redirectTo?: string };
        userId = body.userId?.trim();
        redirectTo = body.redirectTo?.trim() || 'https://railmatch.ru';
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing required field: userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Create admin client
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch user info
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
        console.error('Failed to fetch user:', userError);
        return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const user = userData.user;
    const email = user.email ?? '';
    const name = (user.user_metadata?.name as string) || 'Пользователь';

    // Auto-confirm the user's email so they can login immediately
    // This avoids PKCE flow issues where clicking the link in a different
    // browser/device leaves the email unconfirmed
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
        email_confirm: true,
    });

    if (confirmError) {
        console.error('Failed to auto-confirm email:', confirmError);
        // Non-fatal: still try to send the welcome email
    }

    // Send welcome email via Resend
    const html = buildWelcomeHtml(name, redirectTo);

    const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: 'Добро пожаловать в RailMatch!',
            html,
        }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
        console.error('Resend error:', resendData);
        // Email sending failed but user is already confirmed — return partial success
        return new Response(JSON.stringify({ ok: true, emailSent: false, details: resendData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ ok: true, emailSent: true, id: resendData.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});
