import { sendMessage } from '../lib/telegram.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const BOT_SECRET = process.env.BOT_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'https://anti-railmatch-ner3.vercel.app';

const OPEN_BUTTON = {
    reply_markup: {
          inline_keyboard: [
                  [{ text: '🔵 Открыть RailMatch', web_app: { url: APP_URL } }]
                ]
    }
};

export async function handleStart(chatId, text, telegramUser) {
    const parts = text.trim().split(/\s+/);
    const code = parts[1];

  if (!code) {
        await sendMessage(
                chatId,
                `👋 Привет, ${telegramUser.first_name}!\n\n` +
                `Я бот RailMatch — платформы для грузовых перевозок.\n\n` +
                `Чтобы получать уведомления о ставках и сделках, ` +
                `откройте сайт и перейдите в <b>Профиль → Уведомления → Подключить Telegram</b>.`,
                OPEN_BUTTON
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
                        `сообщениях и статусе сделок прямо здесь.`,
                        OPEN_BUTTON
                      );
      } else if (res.status === 410) {
              await sendMessage(
                        chatId,
                        `❌ Код истёк. Вернитесь на сайт и сгенерируйте новый код.`,
                        OPEN_BUTTON
                      );
      } else {
              await sendMessage(
                        chatId,
                        `❌ Неверный код. Проверьте код на сайте и попробуйте снова.`,
                        OPEN_BUTTON
                      );
      }
  } catch (err) {
        console.error('Error verifying linking code:', err);
        await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
  }
}
