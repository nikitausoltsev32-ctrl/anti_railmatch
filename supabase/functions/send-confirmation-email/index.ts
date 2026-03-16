// Supabase Edge Function: send-confirmation-email
// Sends a branded HTML confirmation email via Resend API
//
// Required env vars (set in Supabase Dashboard → Project Settings → Edge Functions):
//   RESEND_API_KEY          — your Resend API key (https://resend.com)
//   EMAIL_CONFIRMATION_SECRET — shared secret for request auth (set same value in frontend)
//
// Deploy:
//   supabase functions deploy send-confirmation-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-confirmation-secret',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const CONFIRMATION_SECRET = Deno.env.get('EMAIL_CONFIRMATION_SECRET') ?? '';
const FROM_EMAIL = 'RailMatch <noreply@railmatch.ru>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function buildHtml(name: string, confirmationUrl: string): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение почты — RailMatch</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f0f4f8;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Rail icon (Unicode) + wordmark -->
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
                        Подтверждение
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
                Благодарим за регистрацию в&nbsp;<strong>RailMatch</strong>.<br>
                Для подтверждения вашего email-адреса нажмите кнопку ниже.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center"
                      style="background:#2563eb;border-radius:12px;
                             box-shadow:0 4px 14px rgba(37,99,235,0.40);">
                    <a href="${confirmationUrl}"
                       style="display:inline-block;padding:16px 40px;
                              color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:800;
                              letter-spacing:0.4px;white-space:nowrap;">
                      Подтвердить почту &nbsp;→
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Если кнопка не работает, скопируйте ссылку в браузер:<br>
                <a href="${confirmationUrl}"
                   style="color:#2563eb;word-break:break-all;">${confirmationUrl}</a>
              </p>

              <p style="margin:20px 0 0;color:#cbd5e1;font-size:12px;">
                Ссылка действительна 24&nbsp;часа. Если вы не регистрировались в RailMatch —
                просто проигнорируйте это письмо.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
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
        <!-- /Card -->

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

    // Validate shared secret (skip check if secret is not configured)
    if (CONFIRMATION_SECRET) {
        const providedSecret = req.headers.get('x-confirmation-secret');
        if (providedSecret !== CONFIRMATION_SECRET) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set');
        return new Response(JSON.stringify({ error: 'Email service not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let email = '';
    let name = 'Пользователь';
    let confirmation_url = '';

    try {
        const body = await req.json() as {
            email?: string;
            name?: string;
            confirmation_url?: string;
            userId?: string;
            redirectTo?: string;
        };

        name = body.name?.trim() || 'Пользователь';

        if (body.email && body.confirmation_url) {
            email = body.email.trim();
            confirmation_url = body.confirmation_url.trim();
        } else if (body.userId) {
            if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
                return new Response(JSON.stringify({ error: 'Supabase admin is not configured' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { data: userData, error: userError } = await admin.auth.admin.getUserById(body.userId);
            if (userError || !userData?.user?.email) {
                return new Response(JSON.stringify({ error: 'User not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            email = userData.user.email;
            name = (body.name?.trim() || userData.user.user_metadata?.name || 'Пользователь') as string;

            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
                type: 'signup',
                email,
                options: { redirectTo: body.redirectTo || undefined },
            });

            if (linkError || !linkData?.properties?.action_link) {
                return new Response(JSON.stringify({ error: 'Failed to generate confirmation link', details: linkError?.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            confirmation_url = linkData.properties.action_link;
        }
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!email || !confirmation_url) {
        return new Response(JSON.stringify({ error: 'Missing required fields: either (email + confirmation_url) or userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const html = buildHtml(name, confirmation_url);

    const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: 'Подтвердите вашу почту — RailMatch',
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
});
