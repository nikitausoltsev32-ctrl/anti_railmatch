import express from 'express';
import { handleStart } from './handlers/startHandler.js';
import { registerWebhook } from './lib/telegram.js';

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_SECRET = process.env.BOT_WEBHOOK_SECRET;
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.BOT_PUBLIC_URL; // e.g. https://railmatch-bot.up.railway.app

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}
if (!BOT_SECRET) {
  console.error('BOT_WEBHOOK_SECRET is required');
  process.exit(1);
}

// Health check for Railway
app.get('/', (req, res) => res.json({ status: 'ok', service: 'RailMatch Bot' }));

// Telegram webhook endpoint
app.post(`/webhook/${BOT_SECRET}`, async (req, res) => {
  try {
    const update = req.body;
    const message = update?.message;

    if (message?.text) {
      const chatId = message.chat.id;
      const text = message.text;
      const from = message.from;

      if (text.startsWith('/start')) {
        await handleStart(chatId, text, from);
      }
      // add other handlers here if they exist
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.sendStatus(200);
});

app.listen(PORT, async () => {
  console.log(`Bot server running on port ${PORT}`);

  if (PUBLIC_URL) {
    await registerWebhook(`${PUBLIC_URL}/webhook/${BOT_SECRET}`);
  } else {
    console.warn('BOT_PUBLIC_URL not set — webhook not registered');
  }
});
