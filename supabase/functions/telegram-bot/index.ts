import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://railmatch.ru";

async function sendMessage(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("ok", { status: 200 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const message = update?.message;
  if (!message) {
    return new Response("ok", { status: 200 });
  }

  const chatId: number = message.chat.id;
  const telegramUser = message.from;
  const text: string = message.text || "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // /start or /start TOKEN
  if (text.startsWith("/start")) {
    const parts = text.trim().split(" ");
    const token = parts[1]?.trim().toUpperCase();

    if (token) {
      // Try to link account
      const now = new Date().toISOString();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, name, telegram_id")
        .eq("telegram_link_token", token)
        .gt("telegram_link_token_expires", now)
        .single();

      if (error || !profile) {
        await sendMessage(
          chatId,
          "❌ Код недействителен или истёк срок действия.\n\nПолучите новый код в разделе <b>Профиль → Telegram</b> на сайте."
        );
        return new Response("ok", { status: 200 });
      }

      if (profile.telegram_id) {
        await sendMessage(chatId, "✅ Ваш Telegram уже привязан к аккаунту RailMatch.");
        return new Response("ok", { status: 200 });
      }

      // Save telegram_id
      await supabase
        .from("profiles")
        .update({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username || null,
          telegram_link_token: null,
          telegram_link_token_expires: null,
        })
        .eq("id", profile.id);

      await sendMessage(
        chatId,
        `✅ Telegram успешно привязан к аккаунту <b>${profile.name}</b> на RailMatch!\n\nТеперь вы будете получать уведомления здесь.`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "🚂 Открыть RailMatch", web_app: { url: APP_URL } },
            ]],
          },
        }
      );
      return new Response("ok", { status: 200 });
    }

    // /start without token — welcome message
    await sendMessage(
      chatId,
      `👋 Добро пожаловать в <b>RailMatch</b>!\n\nПлатформа для поиска грузов и вагонов. Откройте приложение кнопкой ниже или привяжите аккаунт через профиль на сайте.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: "🚂 Открыть RailMatch", web_app: { url: APP_URL } },
          ]],
        },
      }
    );
    return new Response("ok", { status: 200 });
  }

  // /menu
  if (text === "/menu") {
    await sendMessage(chatId, "Открыть RailMatch:", {
      reply_markup: {
        inline_keyboard: [[
          { text: "🚂 RailMatch", web_app: { url: APP_URL } },
        ]],
      },
    });
    return new Response("ok", { status: 200 });
  }

  // Default: hint
  await sendMessage(
    chatId,
    `Используйте кнопку меню или напишите /menu чтобы открыть RailMatch.`
  );

  return new Response("ok", { status: 200 });
});
