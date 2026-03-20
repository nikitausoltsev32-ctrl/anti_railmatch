// Supabase Edge Function: send-confirmation-email
// Handles the full registration flow server-side:
//   1. Creates auth user via admin API with email_confirm: true (no Supabase email sent)
//   2. Inserts profile row
//   3. Sends welcome email via Resend
//
// Required env vars:
//   RESEND_API_KEY            — your Resend API key
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
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a2e;padding:36px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td>
                <span style="display:inline-block;background:#2563eb;border-radius:10px;
                             padding:6px 10px;margin-bottom:14px;">
                  <span style="color:#fff;font-size:18px;font-weight:900;">&#128643;</span>
                </span>
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;line-height:1.2;">RailMatch</h1>
                <p style="margin:5px 0 0;color:#94a3b8;font-size:13px;">Платформа для железнодорожных грузоперевозок</p>
              </td>
              <td align="right" valign="top">
                <span style="display:inline-block;background:rgba(37,99,235,0.18);border-radius:8px;padding:4px 12px;">
                  <span style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Добро пожаловать</span>
                </span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="height:4px;background:linear-gradient(90deg,#2563eb,#4f46e5,#7c3aed);"></td></tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;font-weight:700;">Здравствуйте, ${name}!</h2>
            <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
              Ваш аккаунт в <strong>RailMatch</strong> успешно создан.<br>
              Вы уже можете войти и начать работу.
            </p>
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td align="center" style="background:#2563eb;border-radius:12px;box-shadow:0 4px 14px rgba(37,99,235,0.40);">
                <a href="${appUrl}" style="display:inline-block;padding:16px 40px;color:#fff;text-decoration:none;font-size:15px;font-weight:800;white-space:nowrap;">
                  Войти в RailMatch &nbsp;→
                </a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
              <strong style="color:#64748b;">RailMatch</strong> — платформа для железнодорожных грузоперевозок<br>
              Это автоматическое письмо, не отвечайте на него.<br>
              <a href="https://railmatch.ru" style="color:#2563eb;text-decoration:none;">railmatch.ru</a>
              &nbsp;·&nbsp;
              <a href="mailto:support@railmatch.ru" style="color:#2563eb;text-decoration:none;">support@railmatch.ru</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
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
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let email: string, password: string, name: string, company: string,
        phone: string, role: string, redirectTo: string;
    try {
        const body = await req.json() as {
            email: string; password: string; name?: string; company?: string;
            phone?: string; role?: string; redirectTo?: string;
        };
        email = body.email?.trim().toLowerCase();
        password = body.password;
        name = body.name?.trim() || 'Пользователь';
        company = body.company?.trim() || '';
        phone = body.phone?.trim() || '';
        role = (body.role === 'shipper' || body.role === 'owner') ? body.role : 'owner';
        redirectTo = body.redirectTo?.trim() || 'https://railmatch.ru';
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Missing required fields: email, password' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user via admin API — email_confirm: true skips Supabase's own email
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, company, phone, role },
    });

    if (createError) {
        console.error('Failed to create user:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const userId = userData.user.id;

    // Insert profile — if this fails, delete the auth user so registration can be retried cleanly
    const registrationInn = `9${Date.now().toString().slice(-9)}`;
    const { error: profileError } = await adminClient
        .from('profiles')
        .insert([{ id: userId, name, company, email, inn: registrationInn, phone, role, plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 }]);
    if (profileError) {
        console.error('Profile insert error:', profileError);
        await adminClient.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: 'Ошибка при создании профиля. Попробуйте зарегистрироваться снова.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Send welcome email via Resend (non-blocking on failure)
    if (RESEND_API_KEY) {
        const html = buildWelcomeHtml(name, redirectTo);
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject: 'Добро пожаловать в RailMatch!', html }),
        });
        if (!resendRes.ok) {
            const resendData = await resendRes.json();
            console.error('Resend error:', resendData);
        }
    }

    return new Response(JSON.stringify({ ok: true, userId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});
