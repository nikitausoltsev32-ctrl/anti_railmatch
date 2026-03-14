import { sendMessage } from '../lib/telegram.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const BOT_SECRET = process.env.BOT_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'https://ch-ner3.vercel.app';

export async function handleStart(chatId, text, telegramUser) {
  const parts = text.trim().split(/\s+/);
  const code = parts[1];

  if (!code) {
    await sendMessage(
      chatId,
      `👋 Привет, ${telegramUser.first_name}!\n\n` +
      `Я бот RailMatch — платформы для грузовых перевозок.\n\n` +
      `Чтобы получать уведомления о ставках и сделках, ` +
      `откройте сайт и перейдите в <b>Профиль → Уведомления → Подключить Telegram</b>.\n\n` +
      `<a href="${APP_URL}">Открыть RailMatch</a>`
    );
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-linking-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_SECRET,
      },
      body: JSON.stringify({
        code,
        telegram_chat_id: chatId,
        telegram_username: telegramUser.username || null,
      }),
    });

    if (res.ok) {
      await sendMessage(
        chatId,
        `✅ <b>Аккаунт RailMatch успешно подключён!</b>\n\n` +
        `Теперь вы будете получать уведомления о новых ставках, ` +
        `сообщениях и статусе сделок прямо здесь.\n\n` +
        `<a href="${APP_URL}">Открыть платформу</a>`
      );
    } else if (res.status === 410) {
      await sendMessage(
        chatId,
        `❌ Код истёк. Вернитесь на сайт и сгенерируйте новый код.\n\n` +
        `<a href="${APP_URL}">Открыть RailMatch</a>`
      );
    } else {
      await sendMessage(
        chatId,
        `❌ Неверный код. Проверьте код на сайте и попробуйте снова.\n\n` +
        `<a href="${APP_URL}">Открыть RailMatch</a>`
      );
    }
  } catch (err) {
    console.error('Error verifying linking code:', err);
    await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
  }
}
